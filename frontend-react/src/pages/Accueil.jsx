import "../App.css";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

export default function Accueil() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");

  // Liste des jeux avec leurs infos
  const games = [
    {
      id: "quiz",
      title: "Quiz linguistiques",
      description: "Choisis le bon mot ou l'expression tunisienne correcte.",
      tag: "Niveaux mixtes · Fille & garçon",
      icon: "🔤",
      className: "quiz-thumb",
      progressLabel: "Progression",
      progressPercent: "60%",
      progressWidth: "60%",
      onClick: () => navigate("/quiz"),
    },
    {
      id: "labyrinth",
      title:"Fin famillek ?",
      description:
        "Aidez le petit personnage à marcher dans le labyrinthe et à retrouver les membres de sa famille, un par un, sans tomber dans les pièges !",
      tag: "Logique & IA pour enfants",
      icon: "🧠",
      className: "bfs-thumb",
      progressLabel: "En préparation",
      progressPercent: "30%",
      progressWidth: "30%",
      onClick: () => navigate("/game/family"),

    },
    
    {
      id: "chnouwa",
      title: "Chnouwa Sar ?",
      description:
        "Complète une histoire tunisienne en devinant les mots manquants.",
      tag: "AI Gaming · Tunisien",
      icon: "📖",
      className: "listen-thumb",
      progressLabel: "Nouveau",
      progressPercent: "15%",
      progressWidth: "15%",
      onClick: () => navigate("/game/chnouwa-sar"),
    },
    {
      id: "robot",
      title: "Robot l'Kalma",
      description: "Écoute le mot et trouve l'image correcte.",
      tag: "Compréhension orale · Tunisien",
      icon: "🤖",
      className: "bfs-thumb",
      progressLabel: "Nouveau",
      progressPercent: "10%",
      progressWidth: "10%",
      onClick: () => navigate("/game/robot"),
    },
  ];

  // Filtrage : on garde les jeux dont le titre commence par ce que l'utilisateur tape
  const filteredGames = games.filter((game) => {
    if (!searchTerm.trim()) return true; // champ vide -> on montre tout
    return game.title.toLowerCase().startsWith(searchTerm.toLowerCase());
  });

  return (
    <div className="app-root">
      <div className="glass-layout">
        {/* ===================== SIDEBAR ===================== */}
        <aside className="sidebar">
          {/* Profil */}
          <div className="profile-block">
            <div className="avatar">
              <span>MK</span>
            </div>
            <div className="profile-text">
              <h2>miniHKEYA</h2>
              <p>AI Gaming Kids</p>
            </div>
          </div>

          {/* Menu */}
          <nav className="sidebar-nav">
            <button className="nav-item active">
              <span className="nav-icon">🎮</span>
              <span>Jeux</span>
            </button>

            <button className="nav-item" onClick={() => navigate("/quiz")}>
              <span className="nav-icon">🔤</span>
              <span>Quiz</span>
            </button>

            <button
              className="nav-item"
              onClick={() => navigate("/game/chnouwa-sar")}
            >
              <span className="nav-icon">🧠</span>
              <span>Chnouwe Sar</span>
            </button>

            <button
              className="nav-item"
              onClick={() => navigate("/game/robot")}
            >
              <span className="nav-icon">🤖</span>
              <span>Robot Kalma</span>
            </button>
<button
  className="nav-item"
  onClick={() => navigate("/game/family")}
>
  <span className="nav-icon">🏠</span>
  <span>Cherche la famille</span>
</button>

            <button className="nav-item">
              <span className="nav-icon">📚</span>
              <span>Bibliothèque</span>
            </button>
          </nav>

          {/* CTA */}
          <div className="sidebar-cta">
            <p>Commence ton aventure en tunisien 🎉</p>
            <button
              className="cta-button"
              onClick={() => navigate("/game/story-bot")}
            >
              Commencer
            </button>
          </div>
        </aside>

        {/* ===================== MAIN PANEL ===================== */}
        <main className="main-panel">
          <header className="main-header">
            <h1>AI Gaming</h1>
            <p>
              Espace ludique pour apprendre le dialecte tunisien : quiz,
              mini-jeux, écoute & prononciation.
            </p>

            <div className="search-bar">
              <input
                type="text"
                placeholder="Rechercher un jeu ou un quiz…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <span className="search-icon">🔍</span>
            </div>
          </header>

          {/* ===================== LISTE DES JEUX ===================== */}
          <section className="games-list">
            {filteredGames.length === 0 && (
              <p style={{ padding: "1rem", opacity: 0.7 }}>
                Aucun jeu ne commence par « {searchTerm} ».
              </p>
            )}

            {filteredGames.map((game) => (
              <article
                key={game.id}
                className="game-row"
                onClick={game.onClick}
              >
                <div className={`game-thumb ${game.className}`}>
                  {game.icon}
                </div>

                <div className="game-info">
                  <h3>{game.title}</h3>
                  <p>{game.description}</p>
                  <span className="game-tag">{game.tag}</span>
                </div>

                <div className="game-progress">
                  <span className="progress-label">
                    {game.progressLabel}
                  </span>
                  <div className="progress-track">
                    <div
                      className={`progress-fill ${
                        game.className.includes("quiz")
                          ? "quiz-fill"
                          : game.className.includes("listen")
                          ? "listen-fill"
                          : "bfs-fill"
                      }`}
                      style={{ width: game.progressWidth }}
                    ></div>
                  </div>
                  <span className="progress-percent">
                    {game.progressPercent}
                  </span>
                </div>
              </article>
            ))}
          </section>
        </main>
      </div>
    </div>
  );
}
