import { useState } from "react";
import "./GameStyle.css";

const API = "http://127.0.0.1:8000";
const MAX_STORIES = 4;

export default function ChnouwaSar() {
  const [theme, setTheme] = useState("souk");
  const [level, setLevel] = useState(1);

  const [storyCount, setStoryCount] = useState(1);
  const [finalScore, setFinalScore] = useState(0);

  const [storyId, setStoryId] = useState(null);
  const [rawStory, setRawStory] = useState("");
  const [maskedStory, setMaskedStory] = useState("");
  const [blanks, setBlanks] = useState([]);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [meta, setMeta] = useState(null); // theme/level/index

  async function startStory() {
    const genRes = await fetch(`${API}/game/story/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ theme, level }),
    });
    const genData = await genRes.json();

    setStoryId(genData.story_id);
    setRawStory(genData.raw_story);
    setMeta({ theme: genData.theme, level: genData.level, index: genData.index });

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
    setFinalScore(finalScore + data.score);
  }

  function nextStory() {
    setStoryCount(storyCount + 1);
    startStory();
  }

  function restart() {
    setStoryCount(1);
    setFinalScore(0);
    setResult(null);
    setAnswers({});
    setMaskedStory("");
    setRawStory("");
  }

  return (
    <div className="page-root">
      <div className="glass-panel">
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
          <h1>🎮 CHNOUWA SAR ?</h1>
          <p>Série : {theme} · Niveau {level}</p>

          {storyCount <= MAX_STORIES && (
            <p className="progress-bar">Histoire {storyCount}/{MAX_STORIES}</p>
          )}

          {storyCount === 1 && !rawStory && (
            <div className="header-controls">
              <select value={theme} onChange={(e) => setTheme(e.target.value)}>
                <option value="souk">Souk</option>
                <option value="famille">Famille</option>
                <option value="ecole">École</option>
              </select>

              <select value={level} onChange={(e) => setLevel(e.target.value)}>
                <option value="1">Niveau 1</option>
                <option value="2">Niveau 2</option>
                <option value="3">Niveau 3</option>
              </select>

              <button className="primary-btn" onClick={startStory}>
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
            <p>Thème : <b>{theme}</b></p>
            <p>Niveau : <b>{level}</b></p>
            <p>Score total : <b>{finalScore}</b> / {MAX_STORIES * 3}</p>

            <button className="primary-btn" onClick={restart}>
              Recommencer la série
            </button>
          </section>
        )}
      </div>
    </div>
  );
}
