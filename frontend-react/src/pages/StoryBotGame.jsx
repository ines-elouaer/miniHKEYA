import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../App.css";
import "./GameStyle.css";
import Sidebar from "../components/Sidebar";
import logoImg from "../assets/logo.png";

const API = "http://127.0.0.1:8000";

// ✅ Change ici pour tester des voix Edge-TTS
const EDGE_TTS_VOICE = "ar-SA-ZariyahNeural";
// Exemples à tester :
// "ar-SA-HamedNeural", "ar-SA-ZariyahNeural", "ar-EG-SalmaNeural", "ar-AE-FatimaNeural"

export default function StoryBotGame() {
  const navigate = useNavigate();

  const [story, setStory] = useState("");
  const [level, setLevel] = useState(1);
  const [loading, setLoading] = useState(false);
  const [ttsLoading, setTtsLoading] = useState(false);
  const [error, setError] = useState("");
  const [spokenText, setSpokenText] = useState("");

  const audioRef = useRef(null);
  const lastObjectUrlRef = useRef(null);

  useEffect(() => {
    audioRef.current = new Audio();
    return () => {
      if (lastObjectUrlRef.current) URL.revokeObjectURL(lastObjectUrlRef.current);
      try {
        if (window.speechSynthesis) window.speechSynthesis.cancel();
      } catch {}
    };
  }, []);

  // =========================
  // AUDIO STOP
  // =========================
  const stopAllAudio = () => {
    try {
      if (window.speechSynthesis) window.speechSynthesis.cancel();
    } catch {}

    try {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    } catch {}
  };

  // =========================
  // TTS 1) BACKEND (Edge-TTS) -> en premier
  // =========================
  const speakWithBackend = async (text) => {
    setTtsLoading(true);
    try {
      stopAllAudio();

      const res = await fetch(`${API}/tts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // ✅ c'est ici que la voix Edge-TTS se change
        body: JSON.stringify({ text, voice: EDGE_TTS_VOICE }),
        cache: "no-store",
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.detail || "Erreur TTS backend");
      }

      const blob = await res.blob();

      if (lastObjectUrlRef.current) URL.revokeObjectURL(lastObjectUrlRef.current);

      const url = URL.createObjectURL(blob);
      lastObjectUrlRef.current = url;

      audioRef.current.src = url;
      await audioRef.current.play();
      return true;
    } finally {
      setTtsLoading(false);
    }
  };

  // =========================
  // TTS 2) NAVIGATEUR (fallback)
  // =========================
  const getBrowserVoices = () =>
    new Promise((resolve) => {
      if (!window.speechSynthesis) return resolve([]);

      const v = window.speechSynthesis.getVoices();
      if (v && v.length) return resolve(v);

      window.speechSynthesis.onvoiceschanged = () => {
        resolve(window.speechSynthesis.getVoices());
      };

      setTimeout(() => resolve(window.speechSynthesis.getVoices()), 800);
    });

  const speakWithBrowser = async (text) => {
    if (!window.speechSynthesis) return false;

    const voices = await getBrowserVoices();

    const arVoice =
      voices.find((v) => (v.lang || "").toLowerCase().startsWith("ar")) ||
      voices.find((v) => (v.name || "").toLowerCase().includes("arab"));

    if (!arVoice) return false;

    stopAllAudio();

    const utt = new SpeechSynthesisUtterance(text);
    utt.voice = arVoice;
    utt.lang = arVoice.lang || "ar-SA";
    utt.rate = 0.95;
    utt.pitch = 1.0;

    window.speechSynthesis.speak(utt);
    return true;
  };

  // ✅ lecture globale: backend d'abord
  const speakStory = async (customText) => {
    const text = (customText ?? story ?? "").trim();
    if (!text) return;

    setError("");

    try {
      // 1) essayer backend (où la voix change)
      await speakWithBackend(text);
      return;
    } catch (err) {
      // 2) fallback navigateur
      const ok = await speakWithBrowser(text);
      if (ok) return;

      setError(
        (err?.message || "Erreur TTS") +
          " — Astuce: installe edge-tts dans TON venv backend: python -m pip install edge-tts"
      );
    }
  };

  // =========================
  // GENERATE STORY
  // =========================
  const handleGenerate = async () => {
    setLoading(true);
    setStory("");
    setError("");

    try {
      const themeToSend = spokenText.trim() || "famille";

      const res = await fetch(`${API}/game/story-bot/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theme: themeToSend, level }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.detail || "Erreur côté backend");
      }

      const data = await res.json();
      if (!data.story) throw new Error("Histoire introuvable");

      setStory(data.story);

      localStorage.setItem("last_story_theme", themeToSend);
      localStorage.setItem("last_story_level", String(level));
      localStorage.setItem("last_story_text", data.story);

      await speakStory(data.story);
    } catch (err) {
      setError(err.message || "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  };

  const bubbleText = loading
    ? "Attends… je fabrique ton histoire ✨📚"
    : spokenText.trim() || "Coucou ! Donne-moi un thème 🥰";

  // ✅ AFFICHAGE EN PARAGRAPHE (au lieu de lignes séparées)
  // - remplace les \n par des espaces
  // - enlève les espaces multiples
  const storyAsParagraph = (story || "")
    .replace(/\s*\n+\s*/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();

  return (
    <div className="app-root">
      <div className="glass-layout">
        <Sidebar subtitle="Story Bot – Histoires en arabe" />

        <main className="main-panel">
          <div className="story-page">
            <div className="story-card">
              <header className="story-card-header">
                <p className="story-card-kicker">Story Bot</p>
                <h1 className="story-card-title">
                  Une histoire <span>en arabe</span>
                </h1>
                <p className="story-card-desc">
                  Écris un thème, puis écoute l’histoire en arabe 🎧
                </p>
              </header>

              <div className="story-avatar-zone">
                <div className="story-avatar-bubble">{bubbleText}</div>
                 <div className="story-avatar-ring">
                  <div className="story-avatar-inner">
                    <img
                      src={logoImg}
                      alt="Mascotte"
                      className="story-avatar-img"
                    />
                  </div>
                </div>
              </div>

              <section className="echo-input-block">
                <label htmlFor="echoInput" className="echo-input-label">
                  Thème (ex : famille, école, animaux, voyage...) :
                </label>

                <div className="echo-input-row">
                  <input
                    id="echoInput"
                    type="text"
                    placeholder="Ex. famille, école, animaux…"
                    value={spokenText}
                    onChange={(e) => setSpokenText(e.target.value)}
                  />

                  <button
                    type="button"
                    className="echo-send-btn"
                    onClick={handleGenerate}
                    disabled={loading}
                    title="Générer"
                  >
                    ➤
                  </button>
                </div>

                <div className="story-level-toggle">
                  <span className="story-level-label">Niveau :</span>

                  <button
                    type="button"
                    onClick={() => setLevel(1)}
                    className={`level-pill ${level === 1 ? "active" : ""}`}
                  >
                    1 • 6–7 ans
                  </button>

                  <button
                    type="button"
                    onClick={() => setLevel(2)}
                    className={`level-pill ${level === 2 ? "active" : ""}`}
                  >
                    2 • 8–10 ans
                  </button>
                </div>
              </section>

              <button
                className="story-main-button"
                onClick={handleGenerate}
                disabled={loading}
              >
                {loading ? "Le bot prépare l’histoire..." : "Lancer l’histoire"}
              </button>

              <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
                <button
                  className="secondary-btn"
                  onClick={() => speakStory()}
                  disabled={!story || loading || ttsLoading}
                  style={{ flex: 1 }}
                >
                  {ttsLoading ? "Lecture..." : "🔊 Réécouter"}
                </button>

                <button
                  className="secondary-btn"
                  onClick={() => navigate("/game/chnouwa-sar")}
                  disabled={!story || loading}
                  style={{ flex: 1 }}
                >
                  🎮 Aller à Mission Hkeya
                </button>
              </div>

              {error && <div className="story-error">{error}</div>}
            </div>

            <div className="story-output">
              <h2>Ton histoire (en arabe) 📖</h2>
              <div className="story-output-bubble">
                {loading && <span>Le bot réfléchit…</span>}

                {/* ✅ ICI: AFFICHAGE EN PARAGRAPHE */}
                {!loading && story && <span>{storyAsParagraph}</span>}

                {!loading && !story && !error && (
                  <span>
                    Écris un thème, puis clique sur{" "}
                    <strong>“Lancer l’histoire”</strong>.
                  </span>
                )}

                {error && !loading && <span>{error}</span>}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
