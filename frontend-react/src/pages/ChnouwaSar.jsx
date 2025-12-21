import { useState, useEffect, useRef } from "react";
import "./GameStyle.css";

const API = "http://127.0.0.1:8000";
const MAX_STORIES = 4;

export default function ChnouwaSar() {
  const [theme, setTheme] = useState("souk");
  const [level, setLevel] = useState(1);

  const [storyCount, setStoryCount] = useState(1);
  const [finalScore, setFinalScore] = useState(0);
  const [totalMaxScore, setTotalMaxScore] = useState(0); // somme des max_score

  const [storyId, setStoryId] = useState(null);
  const [rawStory, setRawStory] = useState("");
  const [maskedStory, setMaskedStory] = useState("");
  const [blanks, setBlanks] = useState([]);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [meta, setMeta] = useState(null);

  // 🔁 histoires déjà utilisées dans la série
  const [usedStoryKeys, setUsedStoryKeys] = useState([]);

  // 🔊 Références vers les sons
  const winAudioRef = useRef(null);
  const loseAudioRef = useRef(null);

  // Initialisation des sons
  useEffect(() => {
    winAudioRef.current = new Audio("/sounds/win.mp3");
    loseAudioRef.current = new Audio("/sounds/gameover.mp3");
  }, []);

  // Génère une nouvelle histoire, en évitant les doublons
  async function startStory(attempt = 0) {
    const genRes = await fetch(`${API}/game/story/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ theme, level }),
    });
    const genData = await genRes.json();

    // 🧠 Clé d'unicité de l'histoire :
    // on prend story_id si dispo, sinon (theme + index)
    const storyKey =
      genData.story_id != null
        ? `id-${genData.story_id}`
        : `${genData.theme}-${genData.index}`;

    // Si on a déjà vu cette histoire dans la série → on réessaie
    if (usedStoryKeys.includes(storyKey)) {
      console.log("Histoire déjà utilisée, on en génère une autre...");

      // sécurité : on ne boucle pas à l'infini
      if (attempt < 5) {
        return startStory(attempt + 1);
      } else {
        console.warn(
          "Impossible de trouver une nouvelle histoire différente après plusieurs essais."
        );
      }
    }

    // 👉 On accepte cette histoire et on l'ajoute à la liste des utilisées
    setUsedStoryKeys((prev) => [...prev, storyKey]);

    setStoryId(genData.story_id);
    setRawStory(genData.raw_story);
    setMeta({
      theme: genData.theme,
      level: genData.level,
      index: genData.index,
    });

    const maskRes = await fetch(`${API}/game/story/mask`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        story_id: genData.story_id,
        raw_story: genData.raw_story,
        level: level,
      }),
    });
    const maskData = await maskRes.json();

    setMaskedStory(maskData.masked_story);
    setBlanks(maskData.blanks);
    setAnswers({});
    setResult(null);
  }

  async function checkAnswers() {
    const formatted = blanks.map((b) => ({
      blank_id: b.blank_id,
      answer: answers[b.blank_id] || "",
    }));

    const res = await fetch(`${API}/game/story/check`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ story_id: storyId, answers: formatted }),
    });

    const data = await res.json();
    setResult(data);

    // 🔹 On calcule le nouveau total de points et de max
    const newFinalScore = finalScore + data.score;
    const newTotalMaxScore = totalMaxScore + data.max_score;

    setFinalScore(newFinalScore);
    setTotalMaxScore(newTotalMaxScore);

    // 👉 Si on vient de corriger la DERNIÈRE histoire, on décide win / game over
    if (storyCount === MAX_STORIES) {
      const isPerfect = newFinalScore === newTotalMaxScore;

      const winAudio = winAudioRef.current;
      const loseAudio = loseAudioRef.current;

      if (winAudio && loseAudio) {
        winAudio.pause();
        loseAudio.pause();
        winAudio.currentTime = 0;
        loseAudio.currentTime = 0;

        if (isPerfect) {
          winAudio
            .play()
            .catch((err) =>
              console.log("Erreur lecture audio victoire :", err)
            );
        } else {
          loseAudio
            .play()
            .catch((err) =>
              console.log("Erreur lecture audio game over :", err)
            );
        }
      }
    }
  }

  function nextStory() {
    setStoryCount((prev) => prev + 1);
    startStory();
  }

  function restart() {
    // Stopper les sons
    if (winAudioRef.current) {
      winAudioRef.current.pause();
      winAudioRef.current.currentTime = 0;
    }
    if (loseAudioRef.current) {
      loseAudioRef.current.pause();
      loseAudioRef.current.currentTime = 0;
    }

    setStoryCount(1);
    setFinalScore(0);
    setTotalMaxScore(0);
    setResult(null);
    setAnswers({});
    setMaskedStory("");
    setRawStory("");
    setStoryId(null);
    setMeta(null);
    setUsedStoryKeys([]); // 🔁 on vide la liste des histoires utilisées
  }

  return (
    <div className="page-root">
      <div className="glass-panel">
        <div className="back-row">
          <button
            className="back-btn"
            type="button"
            onClick={() => (window.location.href = "/home")}
          >
            ← Retour à l&apos;accueil
          </button>
        </div>

        <header className="game-header">
          <h1>🎮 CHNOUWA SAR ?</h1>
          <p>
            Série : {theme} · Niveau {level}
          </p>

          {storyCount <= MAX_STORIES && (
            <p className="progress-bar">
              Histoire {storyCount}/{MAX_STORIES}
            </p>
          )}

          {storyCount === 1 && !rawStory && (
            <div className="header-controls">
              <select value={theme} onChange={(e) => setTheme(e.target.value)}>
                <option value="souk">Souk</option>
                <option value="famille">Famille</option>
                <option value="ecole">École</option>
              </select>

              <select
                value={level}
                onChange={(e) => setLevel(Number(e.target.value))}
              >
                <option value="1">Niveau 1</option>
                <option value="2">Niveau 2</option>
                <option value="3">Niveau 3</option>
              </select>

              <button className="primary-btn" onClick={() => startStory()}>
                Démarrer la série
              </button>
            </div>
          )}
        </header>

        {rawStory && (
          <section className="story-block">
            <h3>Histoire générée</h3>
            <div className="story-box">{rawStory}</div>
          </section>
        )}

        {maskedStory && (
          <section className="story-block">
            <h3>Complète les trous</h3>
            <div className="story-box">{maskedStory}</div>

            {blanks.map((b) => (
              <div key={b.blank_id} className="blank-row">
                <span className="blank-label">Trou {b.blank_id} :</span>

                {b.choices.map((choice) => (
                  <button
                    key={choice}
                    className={
                      answers[b.blank_id] === choice
                        ? "choice-btn selected"
                        : "choice-btn"
                    }
                    onClick={() =>
                      setAnswers({ ...answers, [b.blank_id]: choice })
                    }
                  >
                    {choice}
                  </button>
                ))}
              </div>
            ))}

            {!result && (
              <button className="secondary-btn" onClick={checkAnswers}>
                Vérifier mes réponses
              </button>
            )}
          </section>
        )}

        {result && storyCount < MAX_STORIES && (
          <section className="result-block">
            <h3>Résultat</h3>
            <div className="result-box">
              Score : <b>{result.score}</b> / {result.max_score}
              <br />
              {result.feedback}
            </div>

            <button className="primary-btn" onClick={nextStory}>
              ➜ Histoire suivante
            </button>
          </section>
        )}

        {storyCount === MAX_STORIES && result && (
          <section className="result-block final">
            <h2>🎉 Série terminée !</h2>
            <p>
              Thème : <b>{theme}</b>
            </p>
            <p>
              Niveau : <b>{level}</b>
            </p>
            <p>
              Total des scores :{" "}
              <b>
                {finalScore} / {totalMaxScore}
              </b>
            </p>

            <button className="primary-btn" onClick={restart}>
              Recommencer la série
            </button>
          </section>
        )}
      </div>
    </div>
  );
}
