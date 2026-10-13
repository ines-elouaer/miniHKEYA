import { useState, useEffect, useRef } from "react";
import "../App.css";
import "./GameStyle.css";
import Sidebar from "../components/Sidebar";

const API = "http://127.0.0.1:8000";
const MAX_STORIES = 4;

export default function ChnouwaSar() {
  const [theme, setTheme] = useState("souk");
  const [level, setLevel] = useState(1);

  const [storyCount, setStoryCount] = useState(1);
  const [finalScore, setFinalScore] = useState(0);
  const [totalMaxScore, setTotalMaxScore] = useState(0);

  const [storyId, setStoryId] = useState(null);
  const [rawStory, setRawStory] = useState("");
  const [maskedStory, setMaskedStory] = useState("");
  const [blanks, setBlanks] = useState([]);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);

  const [usedStoryKeys, setUsedStoryKeys] = useState([]);

  const winAudioRef = useRef(null);
  const loseAudioRef = useRef(null);

  useEffect(() => {
    const t = localStorage.getItem("last_story_theme");
    const l = localStorage.getItem("last_story_level");

    if (t) setTheme(t);
    if (l) setLevel(Number(l));
  }, []);

  useEffect(() => {
    winAudioRef.current = new Audio("/sounds/win.mp3");
    loseAudioRef.current = new Audio("/sounds/gameover.mp3");
  }, []);

  // ✅ NEW: si localStorage vide -> prendre la dernière histoire depuis backend
  async function getLastStoryText() {
    // 1) localStorage
    const ls = localStorage.getItem("last_story_text");
    if (ls && ls.trim()) return ls;

    // 2) backend
    try {
      const res = await fetch(`${API}/game/story-bot/last`, { method: "GET" });
      if (!res.ok) return null;

      const data = await res.json();
      if (!data?.story) return null;

      // re-stocke pour Accueil -> Mission Hkeya
      localStorage.setItem("last_story_text", data.story);
      if (data.theme) localStorage.setItem("last_story_theme", data.theme);
      if (data.level) localStorage.setItem("last_story_level", String(data.level));

      // optionnel: sync l’UI
      if (data.theme) setTheme(data.theme);
      if (data.level) setLevel(Number(data.level));

      return data.story;
    } catch (e) {
      console.warn("[MissionHkeya] erreur get_last_story:", e);
      return null;
    }
  }

  async function startStory(attempt = 0) {
    const lastStory = await getLastStoryText();
    console.log("last_story_text =", lastStory);

    // ✅ IMPORTANT: use_llm: true sinon le backend peut ignorer llm_story_text
    const payload = lastStory
      ? { theme, level, use_llm: true, llm_story_text: lastStory }
      : { theme, level };

    const genRes = await fetch(`${API}/game/story/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const genData = await genRes.json();
    console.log("generate response =", genData);
    console.log("source =", genData.source);

    // ✅ On NE supprime PAS last_story_text (sinon Accueil -> Mission Hkeya ne marche plus)
    // if (lastStory) localStorage.removeItem("last_story_text");

    const storyKey =
      genData.story_id != null
        ? `id-${genData.story_id}`
        : `${genData.theme}-${genData.index}`;

    if (usedStoryKeys.includes(storyKey)) {
      if (attempt < 5) return startStory(attempt + 1);
    }

    setUsedStoryKeys((prev) => [...prev, storyKey]);
    setStoryId(genData.story_id);
    setRawStory(genData.raw_story);

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

    const newFinalScore = finalScore + data.score;
    const newTotalMaxScore = totalMaxScore + data.max_score;

    setFinalScore(newFinalScore);
    setTotalMaxScore(newTotalMaxScore);

    if (storyCount === MAX_STORIES) {
      const isPerfect = newFinalScore === newTotalMaxScore;

      const winAudio = winAudioRef.current;
      const loseAudio = loseAudioRef.current;

      if (winAudio && loseAudio) {
        winAudio.pause();
        loseAudio.pause();
        winAudio.currentTime = 0;
        loseAudio.currentTime = 0;

        if (isPerfect) winAudio.play().catch(() => {});
        else loseAudio.play().catch(() => {});
      }
    }
  }

  function nextStory() {
    setStoryCount((prev) => prev + 1);
    startStory();
  }

  function restart() {
    winAudioRef.current?.pause();
    loseAudioRef.current?.pause();
    if (winAudioRef.current) winAudioRef.current.currentTime = 0;
    if (loseAudioRef.current) loseAudioRef.current.currentTime = 0;

    setStoryCount(1);
    setFinalScore(0);
    setTotalMaxScore(0);
    setResult(null);
    setAnswers({});
    setMaskedStory("");
    setRawStory("");
    setStoryId(null);
    setUsedStoryKeys([]);
  }

  return (
    <div className="app-root">
      <div className="glass-layout">
        <Sidebar subtitle="Histoire à trous" />

        <main className="main-panel">
          <header className="game-header">
            <h1>Mission Hkeya</h1>
            <p>Choisis les bons mots (souvent en arabe) pour compléter l’histoire.</p>

            {storyCount <= MAX_STORIES && (
              <p className="progress-bar">
                Histoire {storyCount}/{MAX_STORIES} · Niveau {level}
              </p>
            )}

            {storyCount === 1 && !rawStory && (
              <div className="header-controls">
                <select value={level} onChange={(e) => setLevel(Number(e.target.value))}>
                  <option value="1">Facile</option>
                  <option value="2">Moyen</option>
                  <option value="3">Difficile</option>
                </select>

                <button className="primary-btn" onClick={() => startStory()}>
                  Démarrer
                </button>
              </div>
            )}
          </header>

          {rawStory && (
            <section className="story-block">
              <h3>Histoire (référence)</h3>
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
                      onClick={() => setAnswers({ ...answers, [b.blank_id]: choice })}
                    >
                      {choice}
                    </button>
                  ))}
                </div>
              ))}

              {!result && (
                <button className="secondary-btn" onClick={checkAnswers}>
                  Vérifier
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
                Total : <b>{finalScore} / {totalMaxScore}</b>
              </p>

              <button className="primary-btn" onClick={restart}>
                Recommencer
              </button>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}
