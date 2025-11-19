import "../App.css"; // pour utiliser tout ton design glass

export default function Accueil() {
  return (
    <div className="app-root">
      <div className="glass-layout">
        
        {/* ===================== SIDEBAR ===================== */}
        <aside className="sidebar">
          
          {/* Profil */}
          <div className="profile-block">
            <div className="avatar"><span>MK</span></div>
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

            <button className="nav-item" onClick={() => window.location.href = "/quiz"}>
              <span className="nav-icon">🔤</span>
              <span>Quiz</span>
            </button>

            <button className="nav-item" onClick={() => window.location.href = "/game/chnouwa-sar"}>
              <span className="nav-icon">🧠</span>
              <span>Chnouwe Sar</span>
            </button>
<button className="nav-item" onClick={() => window.location.href = "/game/robot"}>
  <span className="nav-icon">🤖</span>
  <span>Robot Kalma</span>
</button>

            <button className="nav-item">
              <span className="nav-icon">📚</span>
              <span>Bibliothèque</span>
            </button>
          </nav>

          {/* CTA */}
          <div className="sidebar-cta">
            <p>Commence ton aventure en tunisien 🎉</p>
            <button className="cta-button">Commencer</button>
          </div>

        </aside>

        {/* ===================== MAIN PANEL ===================== */}
        <main className="main-panel">

          <header className="main-header">
            <h1>AI Gaming</h1>
            <p>Espace ludique pour apprendre le dialecte tunisien : quiz, mini-jeux, écoute & prononciation.</p>

            <div className="search-bar">
              <input type="text" placeholder="Rechercher un jeu ou un quiz…" />
              <span className="search-icon">🔍</span>
            </div>
          </header>

          {/* ===================== LISTE DES JEUX ===================== */}
          <section className="games-list">

            {/* Carte 1 - Quiz */}
            <article
              className="game-row"
              onClick={() => (window.location.href = "/quiz")}
            >
              <div className="game-thumb quiz-thumb">🔤</div>

              <div className="game-info">
                <h3>Quiz linguistiques</h3>
                <p>Choisis le bon mot ou l'expression tunisienne correcte.</p>
                <span className="game-tag">Niveaux mixtes · Fille & garçon</span>
              </div>

              <div className="game-progress">
                <span className="progress-label">Progression</span>
                <div className="progress-track">
                  <div className="progress-fill quiz-fill" style={{ width: "60%" }}></div>
                </div>
                <span className="progress-percent">60%</span>
              </div>
            </article>

            {/* Carte 2 - BFS/DFS */}
            <article
              className="game-row"
              onClick={() => (window.location.href = "/labyrinth")}
            >
              <div className="game-thumb bfs-thumb">🧠</div>

              <div className="game-info">
                <h3>Aventure BFS / DFS</h3>
                <p>Aide un petit robot à sortir d'un labyrinthe grâce aux algorithmes.</p>
                <span className="game-tag">Logique & IA pour enfants</span>
              </div>

              <div className="game-progress">
                <span className="progress-label">En préparation</span>
                <div className="progress-track">
                  <div className="progress-fill bfs-fill" style={{ width: "30%" }}></div>
                </div>
                <span className="progress-percent">30%</span>
              </div>
            </article>

            {/* Carte 3 - Écoute */}
            <article
              className="game-row"
              onClick={() => alert("Mode Écoute & Répète bientôt !")}
            >
              <div className="game-thumb listen-thumb">🎧</div>

              <div className="game-info">
                <h3>Écoute & Répète</h3>
                <p>Écoute une phrase en tunisien puis répète-la avec l'aide de l'IA.</p>
                <span className="game-tag">Prononciation · Oral</span>
              </div>

              <div className="game-progress">
                <span className="progress-label">Prototype</span>
                <div className="progress-track">
                  <div className="progress-fill listen-fill" style={{ width: "80%" }}></div>
                </div>
                <span className="progress-percent">80%</span>
              </div>
            </article>
 <article
    className="game-row"
    onClick={() => (window.location.href = "/game/chnouwa-sar")}
  >
    <div className="game-thumb listen-thumb">📖</div>

    <div className="game-info">
      <h3>Chnouwa Sar ? (Aventure IA)</h3>
      <p>Complète une histoire tunisienne en devinant les mots manquants.</p>
      <span className="game-tag">AI Gaming · Tunisien</span>
    </div>

    <div className="game-progress">
      <span className="progress-label">Nouveau</span>
      <div className="progress-track">
        <div className="progress-fill listen-fill" style={{ width: "15%" }}></div>
      </div>
      <span className="progress-percent">15%</span>
    </div>
  </article>
<article
  className="game-row"
  onClick={() => (window.location.href = "/game/robot")}
>
  <div className="game-thumb bfs-thumb">🤖</div>
  <div className="game-info">
    <h3>Robot l&apos;Kalma</h3>
    <p>Écoute le mot et trouve l&apos;image correcte.</p>
    <span className="game-tag">Compréhension orale · Tunisien</span>
  </div>
  <div className="game-progress">
    <span className="progress-label">Nouveau</span>
    <div className="progress-track">
      <div className="progress-fill bfs-fill" style={{ width: "10%" }} />
    </div>
    <span className="progress-percent">10%</span>
  </div>
</article>

          </section>
        </main>
      </div>
    </div>
    
  );
}
