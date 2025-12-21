// src/pages/StoryBotGame.jsx
import { useState } from "react";
import "../App.css";

// ✅ Fonction qui lit un texte avec la voix du navigateur
function speak(text) {
  if (typeof window === "undefined" || !window.speechSynthesis) {
    alert("La synthèse vocale n’est pas supportée par ce navigateur.");
    return;
  }

  const clean = (text || "").toString().trim();
  if (!clean) return;

  // Normaliser un peu le texte (évite certains bugs)
  const normalized = clean.replace(/\s+/g, " ");

  // Annuler une éventuelle lecture en cours
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(normalized);

  // 1) pour arabe standard :
  utterance.lang = "ar-SA";
  // 2) si ton histoire est plutôt en français :
  // utterance.lang = "fr-FR";

  utterance.rate = 0.9; // un peu plus lent
  utterance.pitch = 1; // tonalité normale

  // Essayer de choisir une voix arabe si dispo
  const voices = window.speechSynthesis.getVoices();
  const arabicVoice =
    voices.find((v) => v.lang.startsWith("ar")) ||
    voices.find((v) => v.lang.startsWith("fr"));

  if (arabicVoice) {
    utterance.voice = arabicVoice;
  }

  window.speechSynthesis.speak(utterance);
}

export default function StoryBotGame() {
  const [story, setStory] = useState("");
  const [level, setLevel] = useState(1); // niveau par défaut = 1
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // 📝 ce que l’utilisateur écrit (thème) + ce qui apparaît dans la bulle
  const [spokenText, setSpokenText] = useState("");

  // 🔄 Appel backend + lecture de l’histoire
  const handleGenerate = async () => {
    setLoading(true);
    setStory("");
    setError("");

    try {
      const themeToSend = spokenText.trim() || "famille";

      const res = await fetch(
        "http://127.0.0.1:8000/game/story-bot/generate",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            theme: themeToSend,
            level: level, // 👈 on envoie le niveau choisi
          }),
        }
      );

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.detail || "Erreur côté backend");
      }

      const data = await res.json();
      console.log("Réponse backend:", data);

      if (!data.story) {
        setError("Story not found");
        return;
      }

      setStory(data.story);
      speak(data.story);
    } catch (err) {
      console.error(err);
      setError(err.message || "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  };

  // 💬 texte dans la bulle au-dessus du robot
  const bubbleText = loading
    ? "ستنى شوية... na7ki 7keya jdida 🔄"
    : spokenText.trim() || "T7ebb n7ki-lk 7keya tawa ?";

  return (
    <div className="story-page">
      <div className="story-card">
        {/* Texte haut */}
        <header className="story-card-header">
          <p className="story-card-kicker">miniHKEYA Bot</p>
          <h1 className="story-card-title">
            Chnouwa <span>Sar ?</span>
          </h1>
          <p className="story-card-desc">
            Écris un thème, laisse ton petit avatar le lire, puis écoute la
            7keya générée 💫
          </p>
        </header>

        {/* Avatar + bulle */}
        <div className="story-avatar-zone">
          <div className="story-avatar-bubble">{bubbleText}</div>

          <div className="story-avatar-ring">
            <div className="story-avatar-inner">
              <span role="img" aria-label="robot">
                🤖
              </span>
            </div>
          </div>
        </div>

        {/* Champ où l’utilisateur écrit + niveau */}
        <section className="echo-input-block">
          <label htmlFor="echoInput" className="echo-input-label">
            Écris le thème de ta 7keya (ex. famille, école, souk...) :
          </label>

          <div className="echo-input-row">
            <input
              id="echoInput"
              type="text"
              placeholder="Ex. famille, école, voyage..."
              value={spokenText}
              onChange={(e) => setSpokenText(e.target.value)}
            />

            {/* ➤ lance l’histoire (appel backend + lecture) */}
            <button
              type="button"
              className="echo-send-btn"
              onClick={handleGenerate}
              disabled={loading}
            >
              ➤
            </button>
          </div>

          {/* 🔽 Sélecteur de niveau sous le champ */}
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

        {/* Bouton principal (même action que la flèche) */}
        <button
          className="story-main-button"
          onClick={handleGenerate}
          disabled={loading}
        >
          {loading ? "Le bot prépare l’histoire..." : "Lancer l’histoire"}
        </button>

        {error && <div className="story-error">{error}</div>}
      </div>

      {/* Histoire générée en dessous */}
      <div className="story-output">
        <h2>Hkeyetna 📖</h2>
        <div className="story-output-bubble">
          {loading && (
            <span>miniHKEYA Bot réfléchit à une nouvelle histoire...</span>
          )}

          {!loading && story && <span>{story}</span>}

          {!loading && !story && !error && (
            <span>
              Écris un thème (ex. <strong>famille</strong>), puis clique sur{" "}
              <strong>“Lancer l’histoire”</strong> ou sur la flèche pour écouter
              ta première 7keya 🌙
            </span>
          )}

          {error && !loading && <span>{error}</span>}
        </div>
      </div>
    </div>
  );
}
