// frontend-react/src/pages/Register.jsx
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "../App.css";


const API = "http://127.0.0.1:8000";

export default function Register() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      const res = await fetch(`${API}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || "Erreur lors de la création du compte");
      }

      setSuccess("Compte créé 🎉 Tu peux maintenant te connecter.");
      // petite pause puis redirection vers la page de login
      setTimeout(() => navigate("/login"), 1200);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="auth-root">
      <div className="auth-card">
        <h1>miniHKEYA</h1>
        <h2>Créer un compte</h2>

        <form onSubmit={handleSubmit} className="auth-form">
          <label>
            Nom d'utilisateur
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </label>

          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
          {success && <p className="auth-success">{success}</p>}

          <button className="primary-btn" type="submit">
            Créer mon compte
          </button>
        </form>

        <p className="auth-bottom-text">
          Tu as déjà un compte ?{" "}
          <Link to="/login" className="auth-link">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
}
