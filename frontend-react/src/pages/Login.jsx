// src/pages/Login.jsx
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "../App.css"; // on remonte d'un dossier: src/pages -> src/App.css

const API = "http://127.0.0.1:8000";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    try {
      const res = await fetch(`${API}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || "Erreur de connexion");
      }

      // sauvegarde du token + user
      localStorage.setItem("token", data.access_token);
      localStorage.setItem("user", JSON.stringify(data.user));

      navigate("/home"); // redirection vers l'accueil
// redirection vers l'accueil
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="auth-root">
      <div className="auth-card">
        <h1>miniHKEYA</h1>
        <h2>Connexion</h2>

        <form onSubmit={handleSubmit} className="auth-form">
          <label>
            Nom d&apos;utilisateur
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </label>

          <label>
            Mot de passe
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>

          {error && <p className="auth-error">{error}</p>}

          <button className="primary-btn" type="submit">
            Se connecter
          </button>
        </form>

        <p className="auth-bottom-text">
          Pas encore de compte ?{" "}
          <Link to="/register" className="auth-link">
            S&apos;inscrire
          </Link>
        </p>
      </div>
    </div>
  );
}
