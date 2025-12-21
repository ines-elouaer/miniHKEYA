// src/pages/FamilyLabyrinth.jsx
import { useEffect, useState, useRef } from "react";
import "../App.css";
import "./GameStyle.css";

const API = "http://127.0.0.1:8000";

export default function FamilyLabyrinth() {
  // --- état principal du labyrinthe ---
  const [grid, setGrid] = useState([]);
  const [start, setStart] = useState([0, 0]);
  const [player, setPlayer] = useState([0, 0]);

  const [targets, setTargets] = useState({});
  const [currentTargetId, setCurrentTargetId] = useState(null);

  const [difficulty, setDifficulty] = useState(1); // 1,2,3...
  const [path, setPath] = useState([]);

  const [score, setScore] = useState(0);

  const [isAnimating, setIsAnimating] = useState(false);
  const [modeIA, setModeIA] = useState(false);

  const [message, setMessage] = useState("");

  // suivi de la victoire et des niveaux débloqués
  const [hasWon, setHasWon] = useState(false);
  const [maxLevelUnlocked, setMaxLevelUnlocked] = useState(1);

  // nouveau : liste des targets trouvées (pour niveau 3)
  const [targetsFound, setTargetsFound] = useState([]);

  // --- timer & vies ---
  const [timeLeft, setTimeLeft] = useState(60);
  const [timerRunning, setTimerRunning] = useState(false);
  const [lives, setLives] = useState(3);
  const [roundFinished, setRoundFinished] = useState(false);
  const [gameOver, setGameOver] = useState(false);

  // --- overlays ---
  const [showTutorial, setShowTutorial] = useState(true);
  const [showCelebration, setShowCelebration] = useState(false);

  // --- chargement / erreurs ---
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  // --- sons ---
  const winSound = useRef(null);
  const stepSound = useRef(null);
  const hitSound = useRef(null);
  const loseSound = useRef(null);

  useEffect(() => {
    winSound.current = new Audio("/sounds/win.mp3");
    stepSound.current = new Audio("/sounds/family-step.mp3");
    hitSound.current = new Audio("/sounds/hit-wall.mp3");
    loseSound.current = new Audio("/sounds/gameover.mp3");
  }, []);

  const EMOJIS = {
    jeddek: "🧓",
    jeddekta: "👵",
    khouk: "🧒",
    okhtik: "👧",
    ommik: "👩",
    book: "👨",
  };

  const currentTarget =
    currentTargetId && targets ? targets[currentTargetId] : null;

  // ================== CHARGEMENT LABYRINTHE ==================
  async function loadLabyrinth(level) {
    try {
      setLoading(true);
      setLoadError("");
      console.log("➡️ appel backend:", `/api/family-labyrinth?difficulty=${level}`);

      const res = await fetch(
        `${API}/api/family-labyrinth?difficulty=${level}`
      );

      if (!res.ok) {
        const text = await res.text();
        console.error("Réponse non OK:", res.status, text);
        throw new Error(`HTTP ${res.status} - ${text}`);
      }

      const data = await res.json();
      console.log("✅ Réponse backend family-labyrinth:", data);

      if (!Array.isArray(data.grid)) {
        throw new Error("La réponse ne contient pas 'grid' (tableau).");
      }
      if (!Array.isArray(data.start)) {
        throw new Error("La réponse ne contient pas 'start' [ligne, colonne].");
      }
      if (!data.targets || Object.keys(data.targets).length === 0) {
        throw new Error("La réponse ne contient pas 'targets'.");
      }

      setGrid(data.grid);
      setStart(data.start);
      setPlayer(data.start);
      setTargets(data.targets);

      const ids = Object.keys(data.targets);
      const randomId = ids[Math.floor(Math.random() * ids.length)];
      setCurrentTargetId(randomId);

      // difficulté & paramètres (forcément entre 1 et 3)
      const lvl = Math.max(1, Math.min(3, level));
      setDifficulty(lvl);
      setLives(lvl >= 3 ? 2 : 3); // ex : moins de vies aux niveaux élevés
      setTimeLeft(Math.max(30, 60 - (lvl - 1) * 10)); // temps diminue
      setTimerRunning(true);
      setRoundFinished(false);
      setGameOver(false);
      setIsAnimating(false);
      setModeIA(false);
      setPath([]);
      setHasWon(false);
      setTargetsFound([]); // reset des cibles trouvées

      setMessage(
        `Va trouver : ${data.targets[randomId].name_ar} (${data.targets[randomId].name_fr})`
      );
    } catch (err) {
      console.error("Erreur backend :", err);
      setLoadError(
        "Erreur backend : " + (err?.message || JSON.stringify(err))
      );
    } finally {
      setLoading(false);
    }
  }

  // premier chargement
  useEffect(() => {
    loadLabyrinth(1);
  }, []);

  // ================== TIMER ==================
  useEffect(() => {
    if (!timerRunning || gameOver || roundFinished) return;

    const id = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(id);
          setTimerRunning(false);
          setRoundFinished(true);
          setGameOver(true);
          setHasWon(false); // temps écoulé => pas de victoire
          setMessage("⏰ Temps écoulé !");
          loseSound.current?.play().catch(() => {});
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(id);
  }, [timerRunning, gameOver, roundFinished]);

  function formatTime(sec) {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  }

  function renderHearts() {
    return (
      <>
        {[0, 1, 2].map((i) => (
          <span key={i}>{i < lives ? "❤️" : "🤍"}</span>
        ))}
      </>
    );
  }

  // ================== IA BFS / DFS ==================
  async function animatePath(pathSteps, label) {
    if (!Array.isArray(pathSteps) || pathSteps.length === 0) return;
    setModeIA(true);
    setIsAnimating(true);

    for (const [r, c] of pathSteps) {
      setPlayer([r, c]);
      stepSound.current?.play().catch(() => {});
      // eslint-disable-next-line no-await-in-loop
      await new Promise((res) => setTimeout(res, 300));
    }

    const end = pathSteps[pathSteps.length - 1];
    if (
      currentTarget &&
      end[0] === currentTarget.pos[0] &&
      end[1] === currentTarget.pos[1]
    ) {
      handleWin(`L'IA a trouvé ${currentTarget.name_ar} avec ${label} !`);
    }

    setIsAnimating(false);
    setModeIA(false);
  }

  async function askPath(algo) {
    if (!currentTargetId || roundFinished || gameOver) return;

    try {
      setMessage("L'IA réfléchit…");
      const url = `${API}/api/family-labyrinth/path?member_id=${currentTargetId}&algo=${algo}`;
      console.log("➡️ appel backend path:", url);
      const res = await fetch(url);
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`HTTP ${res.status} - ${text}`);
      }
      const data = await res.json();
      console.log("✅ Réponse backend path:", data);

      if (!Array.isArray(data.path) || data.path.length === 0) {
        setMessage("⚠️ Aucun chemin trouvé par l’IA.");
        return;
      }

      setPath(data.path);
      animatePath(data.path, algo.toUpperCase());
    } catch (e) {
      console.error("Erreur askPath:", e);
      setMessage("Erreur IA : " + e.message);
    }
  }

  // ================== DÉPLACEMENT ==================
  function handleWin(text) {
    // Niveau 3 : il faut trouver 2 membres de la famille dans le même labyrinthe
    if (difficulty === 3) {
      setTargetsFound((prev) => {
        // éviter les doublons
        if (prev.includes(currentTargetId)) {
          return prev;
        }
        const newFound = [...prev, currentTargetId];

        // 1er membre trouvé → on continue le niveau
        if (newFound.length < 2) {
          setScore((s) => s + 1);
          setMessage(
            `Bravo ! Tu as trouvé ${currentTarget.name_ar} 🎉 Maintenant trouve un autre membre de ta famille dans ce labyrinthe !`
          );

          // choisir une nouvelle cible parmi celles restantes
          const remainingIds = Object.keys(targets).filter(
            (id) => !newFound.includes(id)
          );
          if (remainingIds.length > 0) {
            const nextId =
              remainingIds[Math.floor(Math.random() * remainingIds.length)];
            setCurrentTargetId(nextId);
          }

          // petite célébration mais on ne termine pas la manche
          winSound.current?.play().catch(() => {});
          setShowCelebration(true);
          setTimeout(() => setShowCelebration(false), 1500);

          return newFound;
        }

        // 2ème membre trouvé → vraie victoire du niveau 3
        setScore((s) => s + 1);
        setRoundFinished(true);
        setTimerRunning(false);
        setGameOver(false);
        setHasWon(true);

        // débloquer jusqu'au niveau 3 (de toute façon c'est le dernier)
        setMaxLevelUnlocked((prevMax) => {
          const nextLevel = Math.min(3, difficulty + 1);
          return Math.max(prevMax, nextLevel);
        });

        const finalMessage =
          "🏆 Incroyable ! Tu as trouvé deux membres de ta famille dans le labyrinthe difficile ! Tu as terminé tous les niveaux du jeu.";
        winSound.current?.play().catch(() => {});
        setShowCelebration(true);
        setMessage(finalMessage);
        setTimeout(() => setShowCelebration(false), 1500);

        return newFound;
      });

      return;
    }

    // Niveaux 1 et 2 : comportement normal (une seule cible)
    setScore((s) => s + 1);
    setRoundFinished(true);
    setTimerRunning(false);
    setGameOver(false);
    setHasWon(true);

    setMaxLevelUnlocked((prev) => {
      const nextLevel = Math.min(3, difficulty + 1);
      return Math.max(prev, nextLevel);
    });

    let finalMessage = text;
    if (difficulty === 3) {
      finalMessage =
        "🏆 Félicitations ! Tu as terminé tous les niveaux du jeu !";
    }

    winSound.current?.play().catch(() => {});
    setShowCelebration(true);
    setMessage(finalMessage);
    setTimeout(() => setShowCelebration(false), 1500);
  }

  function loseLife(amount = 1, reason = "") {
    hitSound.current?.play().catch(() => {});
    setLives((l) => {
      const updated = l - amount;
      if (updated <= 0) {
        setGameOver(true);
        setRoundFinished(true);
        setTimerRunning(false);
        setHasWon(false); // défaite => pas de victoire
        loseSound.current?.play().catch(() => {});
        setMessage(reason || "💔 Tous tes cœurs sont perdus !");
        return 0;
      }
      setMessage(
        (reason || "Aïe !") +
          ` Il te reste ${updated} cœur${updated > 1 ? "s" : ""}.`
      );
      return updated;
    });
  }

  function move(dr, dc) {
    if (modeIA || isAnimating || roundFinished || gameOver) return;
    if (!grid.length) return;

    const [r, c] = player;
    const nr = r + dr;
    const nc = c + dc;

    if (nr < 0 || nc < 0 || nr >= grid.length || nc >= grid[0].length) {
      loseLife(1, "Tu es sorti du labyrinthe !");
      return;
    }

    const cell = grid[nr][nc];

    if (cell === 1) {
      loseLife(1, "🧱 Mur !");
      return;
    }
    if (cell === 2) {
      loseLife(2, "🔥 Case rouge !");
      return;
    }

    setPlayer([nr, nc]);
    stepSound.current?.play().catch(() => {});

    if (
      currentTarget &&
      nr === currentTarget.pos[0] &&
      nc === currentTarget.pos[1]
    ) {
      handleWin(`Bravo ! Tu as trouvé ${currentTarget.name_ar} 🎉`);
    }
  }

  useEffect(() => {
    function handleKey(e) {
      if (e.key === "ArrowUp") move(-1, 0);
      if (e.key === "ArrowDown") move(1, 0);
      if (e.key === "ArrowLeft") move(0, -1);
      if (e.key === "ArrowRight") move(0, 1);
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  });

  // ================== RENDER ==================

  if (loading) {
    return (
      <div className="page-root">
        <div className="glass-panel">
          <p>Chargement…</p>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="page-root">
        <div className="glass-panel">
          <h2>Erreur backend</h2>
          <p>{loadError}</p>
          <button className="primary-btn" onClick={() => loadLabyrinth(1)}>
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  if (!currentTarget) {
    return (
      <div className="page-root">
        <div className="glass-panel">
          <h2>Problème de configuration</h2>
          <p>
            Le backend a répondu, mais il n&apos;y a pas de membre de famille
            dans <code>targets</code>.
          </p>
          <pre style={{ whiteSpace: "pre-wrap", fontSize: "0.8rem" }}>
            {JSON.stringify(targets, null, 2)}
          </pre>
        </div>
      </div>
    );
  }

  const isLastLevel = difficulty >= 3;
  const canGoNextLevel =
    hasWon && !isLastLevel && maxLevelUnlocked > difficulty;

  return (
    <div className="page-root">
      <div className="glass-panel family-panel">
        {/* Bouton retour */}
        <div className="back-row">
          <button
            className="back-btn"
            type="button"
            onClick={() => (window.location.href = "/home")}
          >
            ← Retour à l&apos;accueil
          </button>
        </div>

        {/* HEADER */}
        <header className="game-header family-header">
          <h1>🧩 Cherche la famille</h1>
          <p>
            Niveau <b>{difficulty}</b> · Utilise les flèches pour rejoindre le
            bon membre de ta famille.
            {difficulty === 3 && (
              <>
                {" "}
                Dans ce niveau, tu dois trouver <b>2 membres</b> de ta famille
                avant la fin du temps !
              </>
            )}
          </p>

          <div className="family-header-line">
            <div className="family-avatar-box">
              <span className="family-emoji">
                {EMOJIS[currentTargetId] || "👨‍👩‍👧‍👦"}
              </span>
              <div>
                <div className="family-target-label">Tu cherches :</div>
                <div className="family-target-name">
                  {currentTarget.name_ar}{" "}
                  <span>({currentTarget.name_fr})</span>
                </div>
                {difficulty === 3 && (
                  <div style={{ fontSize: "0.8rem", marginTop: "4px" }}>
                    Membres trouvés dans ce niveau : {targetsFound.length} / 2
                  </div>
                )}
              </div>
            </div>

            <div className="family-score-timer">
              <div className="family-score">
                ⭐ Score famille : <b>{score}</b>
              </div>
              <div className="family-timer">
                ⏱ Temps : <b>{formatTime(timeLeft)}</b>
              </div>
              <div className="family-lives">
                ❤️ Vies : <b>{renderHearts()}</b>
              </div>
            </div>
          </div>

          <p className="family-message">{message}</p>

          <div className="family-buttons-row">
            <button
              className="secondary-btn wide"
              type="button"
              onClick={() => askPath("bfs")}
              disabled={isAnimating || gameOver || roundFinished}
            >
              🤖 Chemin BFS (plus court)
            </button>
            
          </div>
        </header>

        {/* GRILLE */}
        <section className="labyrinth-wrapper">
          <div className="labyrinth-grid">
            {grid.map((row, r) => (
              <div key={r} className="lab-row">
                {row.map((cell, c) => {
                  const isPlayer = r === player[0] && c === player[1];
                  const isTarget =
                    r === currentTarget.pos[0] && c === currentTarget.pos[1];

                  const inPath = path.some(
                    (p) => p[0] === r && p[1] === c
                  );

                  let cls = "lab-cell";
                  if (cell === 1) cls += " wall";
                  else if (cell === 2) cls += " danger";
                  else cls += " room";

                  if (inPath) cls += " in-path";
                  if (isPlayer) cls += " player";
                  if (r === start[0] && c === start[1]) cls += " start";
                  if (isTarget) cls += " target";

                  let content = "";
                  if (cell === 1) content = "🧱";
                  else if (cell === 2) content = "🟥";
                  else if (isPlayer) content = "🧒";
                  else if (isTarget) content = EMOJIS[currentTargetId] || "🎯";

                  return (
                    <div key={c} className={cls}>
                      {content}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </section>

        {/* CONTRÔLES MOBILE */}
        <section className="controls-arrows">
          <div className="arrows-row">
            <button
              onClick={() => move(-1, 0)}
              disabled={gameOver || roundFinished}
            >
              ⬆️
            </button>
          </div>
          <div className="arrows-row">
            <button
              onClick={() => move(0, -1)}
              disabled={gameOver || roundFinished}
            >
              ⬅️
            </button>
            <button
              onClick={() => move(1, 0)}
              disabled={gameOver || roundFinished}
            >
              ⬇️
            </button>
            <button
              onClick={() => move(0, 1)}
              disabled={gameOver || roundFinished}
            >
              ➡️
            </button>
          </div>
        </section>

        {/* FIN DE MANCHE : rejouer / niveau suivant */}
{roundFinished && (
  <section className="round-end-actions">
    <h3>Manche terminée</h3>

    {difficulty >= 3 && hasWon ? (
      <p>
        🎉 <b>Félicitations !</b> Tu as terminé les <b>3 niveaux</b> du jeu !
      </p>
    ) : (
      <p>
        Tu peux <b>rejouer ce niveau</b> ou passer au{" "}
        <b>niveau suivant</b> quand tu as gagné le niveau.
      </p>
    )}

    <div className="round-end-buttons">

      <button
        className="secondary-btn"
        type="button"
        onClick={() => loadLabyrinth(difficulty)}
      >
        🔁 Rejouer le niveau {difficulty}
      </button>

      {difficulty >= 3 && hasWon ? (
        <button
          className="primary-btn"
          type="button"
          onClick={() => loadLabyrinth(1)}
        >
          🎮 Rejouer tout le jeu
        </button>
      ) : (
        <button
          className="primary-btn"
          type="button"
          disabled={!hasWon}
          style={{
            opacity: hasWon ? 1 : 0.4,
            cursor: hasWon ? "pointer" : "not-allowed"
          }}
          onClick={() => {
            if (hasWon && difficulty < 3) {
              loadLabyrinth(difficulty + 1);
            }
          }}
        >
          🚀 Niveau suivant ({difficulty + 1})
        </button>
      )}
    </div>
  </section>
)}



        {/* TUTORIEL */}
        {showTutorial && (
          <div className="tutorial-overlay">
            <div className="tutorial-modal">
              <h2>🎮 Comment jouer ?</h2>
              <ul>
                <li>Tu es le petit personnage 🧒.</li>
                <li>
                  Tu dois trouver le membre de ta famille affiché en haut
                  (emoji + nom).
                </li>
                <li>Utilise les flèches du clavier ou les boutons pour bouger.</li>
                <li>
                  Tu peux cliquer sur les boutons 🤖 pour voir comment l&apos;IA
                  trouve le chemin.
                </li>
                <li>
                  Tu as un temps limité et des cœurs. Mur = -1 cœur, 🔴 rouge =
                  -2 cœurs. À 0 → Game Over.
                </li>
                <li>
                  Au niveau 3, tu dois trouver <b>deux membres</b> dans le même
                  labyrinthe !
                </li>
              </ul>
              <button
                className="primary-btn"
                type="button"
                onClick={() => setShowTutorial(false)}
              >
                J&apos;ai compris 👍
              </button>
            </div>
          </div>
        )}

        {/* CÉLÉBRATION */}
        {showCelebration && (
          <div className="celebration-banner">
            🎉 Bravo ! Tu as trouvé ta famille ! 🎉
          </div>
        )}
      </div>
    </div>
  );
}
