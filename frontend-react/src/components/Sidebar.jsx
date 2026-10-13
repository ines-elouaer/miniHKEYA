import { useLocation, useNavigate } from "react-router-dom";
import "./Sidebar.css";
import logo from "../assets/logo.png";
import { Link } from "react-router-dom";
export default function Sidebar({ subtitle = "AI Gaming Kids" }) {
  const navigate = useNavigate();
  const location = useLocation();
  const isActive = (path) => location.pathname === path;

  return (
    <aside className="sidebar">
      <div className="profile-block">
        <div className="avatar" onClick={() => navigate("/home")} title="Accueil">
          <div className="avatar-inner">
            <img src={logo} alt="miniHKEYA logo" />
          </div>
        </div>

        <div className="profile-text">
          <h2>Hkeyti</h2>
          <p>{subtitle}</p>
        </div>
      </div>


      <nav className="sidebar-nav">
        <button
          className={`nav-item ${isActive("/home") ? "active" : ""}`}
          onClick={() => navigate("/home")}
        >
          <span className="nav-icon">🎮</span>
          <span>Accueil</span>
        </button>

        <button
          className={`nav-item ${isActive("/quiz") ? "active" : ""}`}
          onClick={() => navigate("/quiz")}
        >
          <span className="nav-icon">🔤</span>
          <span>KalmaPlay (Quiz)</span>
        </button>

        <button
          className={`nav-item ${isActive("/game/chnouwa-sar") ? "active" : ""}`}
          onClick={() => navigate("/game/chnouwa-sar")}
        >
          <span className="nav-icon">🧠</span>
          <span>Mission Hkeya</span>
        </button>

        <button
          className={`nav-item ${isActive("/game/robot") ? "active" : ""}`}
          onClick={() => navigate("/game/robot")}
        >
          <span className="nav-icon">🤖</span>
          <span>Sadiqi AI</span>
        </button>

        <button
          className={`nav-item ${isActive("/game/family") ? "active" : ""}`}
          onClick={() => navigate("/game/family")}
        >
          <span className="nav-icon">🏠</span>
          <span>La Famille</span>
        </button>

        <button className="nav-item" onClick={() => navigate("/library")}>
          <span className="nav-icon">📚</span>
          <span>Bibliothèque</span>
        </button>
      </nav>
<Link to="/powerbi">Power BI</Link>
      <div className="sidebar-cta">
        <p>Commence ton aventure en tunisien 🎉</p>
        <button className="cta-button" onClick={() => navigate("/game/story-bot")}>
          Commencer
        </button>
      </div>
    </aside>
  );
}
