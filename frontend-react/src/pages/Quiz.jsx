import { useState } from "react";
import "../App.css";
import "./GameStyle.css";

const API = "http://127.0.0.1:8000";

export default function Quiz() {
  const [questions, setQuestions] = useState([]);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [feedback, setFeedback] = useState("");

  async function loadQuiz() {
    try {
      const res = await fetch(`${API}/api/quiz/questions`);
      const data = await res.json();
      console.log("Questions reçues :", data);

      setQuestions(data.questions || []);
      setIndex(0);
      setSelected(null);
      setScore(0);
      setFinished(false);
      setFeedback("");
    } catch (e) {
      alert("Erreur lors du chargement du quiz : " + e.message);
    }
  }

  function currentQuestion() {
    return questions[index];
  }

  function validate() {
    const q = currentQuestion();
    if (!q) {
      setFeedback("Pas de question chargée.");
      return;
    }
    if (selected === null) {
      setFeedback("Choisis une réponse 🙂");
      return;
    }

    if (selected === q.correct_index) {
      setScore(score + 1);
      setFeedback("✅ Bravo, bonne réponse !");
    } else {
      setFeedback(
        `❌ Mauvaise réponse. La bonne était : ${q.choices[q.correct_index]}`
      );
    }
  }

  function next() {
    if (index + 1 < questions.length) {
      setIndex(index + 1);
      setSelected(null);
      setFeedback("");
    } else {
      setFinished(true);
    }
  }

  const q = currentQuestion();
  const total = questions.length || 1;
  const progressPercent =
    questions.length > 0 ? ((index + 1) / questions.length) * 100 : 0;

  return (
    <div className="app-root">
      <div className="glass-layout">
        {/* SIDEBAR */}
        <aside className="sidebar">
          <div className="profile-block">
            <div className="avatar">
              <span>MK</span>
            </div>
            <div className="profile-text">
              <h2>miniHKEYA</h2>
              <p>Quiz linguistiques</p>
            </div>
          </div>

          <nav className="sidebar-nav">
            <button
              className="nav-item"
              onClick={() => (window.location.href = "/")}
            >
              <span className="nav-icon">🏠</span>
              <span>Accueil</span>
            </button>

            <button className="nav-item active">
              <span className="nav-icon">🔤</span>
              <span>Quiz</span>
            </button>

            <button
              className="nav-item"
              onClick={() => (window.location.href = "/game/chnouwa-sar")}
            >
              <span className="nav-icon">🧠</span>
              <span>Chnouwa Sar ?</span>
            </button>
          </nav>

          <div className="sidebar-cta">
            <p>Teste ton vocabulaire tunisien 🎉</p>
            <button className="cta-button" onClick={loadQuiz}>
              Charger le quiz
            </button>
          </div>
        </aside>

        {/* MAIN */}
        <main className="main-panel">
          <header className="main-header">
            <h1>Quiz vocabulaire</h1>
            <p>Choisis le bon mot ou l&apos;expression en tunisien.</p>

            {questions.length > 0 && (
              <div className="quiz-progress">
                <div className="quiz-progress-top">
                  <span>
                    Question {index + 1} / {total}
                  </span>
                  <span>Score : {score}</span>
                </div>
                <div className="quiz-progress-bar">
                  <div
                    className="quiz-progress-fill"
                    style={{ width: `${progressPercent}%` }}
                  ></div>
                </div>
              </div>
            )}
          </header>

          <section className="games-list">
            {!q && !finished && (
              <article className="game-row">
                <div className="game-info">
                  <h3>Prêt(e) ?</h3>
                  <p>
                    Clique sur <b>&quot;Charger le quiz&quot;</b> dans le menu
                    à gauche pour commencer.
                  </p>
                </div>
              </article>
            )}

            {q && !finished && (
              <article className="game-row quiz-card">
                <div className="game-info">
                  <h3 className="quiz-question-title">{q.question}</h3>

                  <div className="quiz-choices-list">
                    {q.choices.map((choice, i) => (
                      <button
                        key={i}
                        className={
                          selected === i
                            ? "quiz-choice-btn selected"
                            : "quiz-choice-btn"
                        }
                        onClick={() => {
                          console.log("Choix cliqué :", i, choice);
                          setSelected(i);
                        }}
                      >
                        {choice}
                      </button>
                    ))}
                  </div>

                  {feedback && (
                    <p className="quiz-feedback">
                      <i>{feedback}</i>
                    </p>
                  )}

                  <div className="quiz-actions">
                    <button className="primary-btn" onClick={validate}>
                      Valider
                    </button>
                    <button className="secondary-btn" onClick={next}>
                      Suivant
                    </button>
                  </div>
                </div>
              </article>
            )}

            {finished && (
              <article className="game-row quiz-final">
                <div className="game-info">
                  <h3>🎉 Quiz terminé !</h3>
                  <p>
                    Tu as obtenu <b>{score}</b> / {total}
                  </p>
                  <button className="primary-btn" onClick={loadQuiz}>
                    Rejouer
                  </button>
                </div>
              </article>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}
