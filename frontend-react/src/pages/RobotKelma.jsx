import { useState } from "react";
import "../App.css";
import "./GameStyle.css";

const API = "http://127.0.0.1:8000";

export default function RobotKelma() {
  const [level, setLevel] = useState(1);
  const [roundId, setRoundId] = useState(null);
  const [word, setWord] = useState("");
  const [choices, setChoices] = useState([]);
  const [selected, setSelected] = useState(null);
  const [result, setResult] = useState(null);
  const [score, setScore] = useState(0);
  const [roundCount, setRoundCount] = useState(0);

  function speakWord(text) {
    if (!window.speechSynthesis || !text) return;
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "ar-001";
    window.speechSynthesis.speak(utter);
  }

  async function startRound() {
    try {
      const res = await fetch(`${API}/game/robot/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ level: Number(level) }),
      });

      if (!res.ok) {
        const txt = await res.text();
        console.error("Erreur API generate:", res.status, txt);
        alert("Erreur API generate. Regarde la console.");
        return;
      }

      const data = await res.json();
      console.log("Robot generate =>", data);

      setRoundId(data.round_id);
      setWord(data.word);
      setChoices(data.choices || []);
      setSelected(null);
      setResult(null);
      setRoundCount((c) => c + 1);

      speakWord(data.word);
    } catch (e) {
      console.error(e);
      alert("Erreur API: " + e.message);
    }
  }

  async function checkAnswer() {
    if (!roundId || selected === null) {
      alert("Choisis une image d'abord 🙂");
      return;
    }

    const choice = choices.find((c) => c.id === selected);
    if (!choice) return;

    const res = await fetch(`${API}/game/robot/check`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        round_id: roundId,
        choice_label: choice.label,
      }),
    });

    if (!res.ok) {
      const txt = await res.text();
      console.error("Erreur API check:", res.status, txt);
      alert("Erreur API check. Regarde la console.");
      return;
    }

    const data = await res.json();
    console.log("Robot check =>", data);

    setResult(data);

    if (data.correct) {
      setScore((s) => s + 1);
    }
  }

  function imagePath(imageKey) {
    return `/img/${imageKey}.png`;
  }

  return (
    <div className="page-root">
      <div className="glass-panel robot-panel">
        {/* Bouton retour */}
        <div className="back-row">
          <button
            className="back-btn"
            type="button"
            onClick={() => (window.location.href = "/")}
          >
            ← Retour à l&apos;accueil
          </button>
        </div>

        <header className="game-header">
          <h1>🤖 ROBOT MOUL L&apos;KALMA</h1>
          <p>
            Le robot prononce un mot tunisien, à toi de trouver la bonne image !
          </p>

          <p className="progress-bar">
            Manche : {roundCount} · Score : {score}
          </p>

          <div className="header-controls">
            <select value={level} onChange={(e) => setLevel(e.target.value)}>
              <option value="1">Niveau 1 (facile)</option>
              <option value="2">Niveau 2</option>
              <option value="3">Niveau 3</option>
            </select>

            <button className="secondary-btn" onClick={() => speakWord(word)}>
              🔊 Réécouter
            </button>

            <button className="primary-btn" onClick={startRound}>
              Nouvelle manche
            </button>
          </div>
        </header>

        {word && (
          <section className="robot-word-block">
            <p className="robot-word">
              Mot à deviner : <b>{word}</b>
            </p>
          </section>
        )}

        <section className="robot-choices-grid">
          {choices.map((choice) => {
            let cls = "robot-choice-card";
            if (result) {
              if (result.correct_word === choice.label) {
                cls += " correct";
              } else if (selected === choice.id && !result.correct) {
                cls += " wrong";
              }
            } else if (selected === choice.id) {
              cls += " selected";
            }

            return (
              <button
                key={choice.id}
                className={cls}
                onClick={() => setSelected(choice.id)}
                disabled={!!result}
              >
                <img
                  src={imagePath(choice.image_key)}
                  alt={choice.label}
                  className="robot-choice-image"
                />
                <span className="robot-choice-label">{choice.label}</span>
              </button>
            );
          })}
        </section>

        {choices.length > 0 && !result && (
          <div className="robot-actions">
            <button className="secondary-btn" onClick={checkAnswer}>
              Vérifier ma réponse
            </button>
          </div>
        )}

        {result && (
          <section className="result-block">
            <h3>Résultat</h3>
            <div
              className={
                "result-box " + (result.correct ? "result-good" : "result-bad")
              }
            >
              {result.feedback}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
