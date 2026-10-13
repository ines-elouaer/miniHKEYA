// src/pages/Accueil.jsx
import "../App.css";
import { useState } from "react";
import Sidebar from "../components/Sidebar";
import GamesList from "../components/GamesList";

export default function Accueil() {
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <div className="app-root">
      <div className="glass-layout">
        <Sidebar subtitle="Apprendre l’arabe en jouant" />

        <main className="main-panel">
          <header className="main-header">
            <h1>Jeux d’arabe</h1>
            <p>
              Apprends l’arabe petit à petit : vocabulaire, écoute, histoires et mini-jeux.
            </p>

            <div className="search-bar">
              <input
                type="text"
                placeholder="Rechercher un jeu…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <span className="search-icon">🔍</span>
            </div>
          </header>

          <GamesList searchTerm={searchTerm} />
        </main>
      </div>
    </div>
  );
}
