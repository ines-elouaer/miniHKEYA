// src/components/GamesList.jsx
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { games as allGames } from "../data/games";

export default function GamesList({ searchTerm = "", showEmptyMessage = true }) {
  const navigate = useNavigate();

  const filteredGames = useMemo(() => {
    if (!searchTerm.trim()) return allGames;
    return allGames.filter((game) =>
      game.title.toLowerCase().startsWith(searchTerm.toLowerCase())
    );
  }, [searchTerm]);

  return (
    <section className="games-list">
      {filteredGames.length === 0 && showEmptyMessage && (
        <p style={{ padding: "1rem", opacity: 0.7 }}>
          Aucun jeu ne commence par « {searchTerm} ».
        </p>
      )}

      {filteredGames.map((game) => (
        <article
          key={game.id}
          className="game-row"
          onClick={() => navigate(game.path)}
        >
          <div className={`game-thumb ${game.className}`}>{game.icon}</div>

          <div className="game-info">
            <h3>{game.title}</h3>
            <p>{game.description}</p>
            <span className="game-tag">{game.tag}</span>
          </div>

          <div className="game-progress">
            <span className="progress-label">{game.progressLabel}</span>
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
              />
            </div>
            <span className="progress-percent">{game.progressPercent}</span>
          </div>
        </article>
      ))}
    </section>
  );
}
