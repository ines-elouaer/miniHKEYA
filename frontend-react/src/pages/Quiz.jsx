import { useState, useEffect, useRef } from "react";
import "../App.css";
import "./GameStyle.css";

const API = "http://127.0.0.1:8000";
const GLOBAL_TIME = 60; // 200 sec = 3 min 20

export default function Quiz() {
  const [questions, setQuestions] = useState([]);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [feedback, setFeedback] = useState("");

  // Timer
  const [timeLeft, setTimeLeft] = useState(GLOBAL_TIME);
  const [isRunning, setIsRunning] = useState(false);

  // Clé pour forcer la recréation du timer
  const [timerKey, setTimerKey] = useState(0);

  const [usedSeconds, setUsedSeconds] = useState(0);

  // Sons
  const winAudioRef = useRef(null);
  const loseAudioRef = useRef(null);

  useEffect(() => {
    winAudioRef.current = new Audio("/sounds/win.mp3");
    loseAudioRef.current = new Audio("/sounds/gameover.mp3");
  }, []);

  // ======================================================================
  // 🔥 Charger les questions + reset COMPLET du quiz
  // ======================================================================
  async function loadQuiz() {
    try {
      const res = await fetch(`${API}/api/quiz/questions`);
      const data = await res.json();

      // Réinitialiser sons
      if (winAudioRef.current) {
        winAudioRef.current.pause();
        winAudioRef.current.currentTime = 0;
      }
      if (loseAudioRef.current) {
        loseAudioRef.current.pause();
        loseAudioRef.current.currentTime = 0;
      }

      setQuestions(data.questions || []);
      setIndex(0);
      setSelected(null);
      setScore(0);
      setFeedback("");
      setFinished(false);

      // Reset timer propre
      setIsRunning(false);
      setTimeLeft(GLOBAL_TIME);
      setUsedSeconds(0);

      // IMPORTANT → Change timerKey AVANT de relancer isRunning
      setTimerKey((key) => key + 1);

      // Timer repart
      setIsRunning(true);
    } catch (e) {
      alert("Erreur lors du chargement du quiz : " + e.message);
    }
  }

  function currentQuestion() {
    return questions[index];
  }

  // ======================================================================
  // 🔍 Vérification réponse
  // ======================================================================
  function validate() {
    const q = currentQuestion();
    if (!q) return;

    if (selected === null) {
      setFeedback("Choisis une réponse 🙂");
      return;
    }

    if (selected === q.correct_index) {
      setScore((prev) => prev + 1);
      setFeedback("✅ Bonne réponse !");
    } else {
      setFeedback(`❌ Mauvaise réponse. La bonne était : ${q.choices[q.correct_index]}`);
    }
  }

  function next() {
    if (index + 1 < questions.length) {
      setIndex((prev) => prev + 1);
      setSelected(null);
      setFeedback("");
    } else {
      setFinished(true);
      setIsRunning(false);
      setUsedSeconds(GLOBAL_TIME - timeLeft);
    }
  }

  // ======================================================================
  // ⏱️ TIMER GLOBAL — Version 100% fonctionnelle
  // ======================================================================
  useEffect(() => {
    if (!isRunning || questions.length === 0) return;

    const id = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(id);
          setFinished(true);
          setIsRunning(false);
          setUsedSeconds(GLOBAL_TIME);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(id);
  }, [isRunning, timerKey, questions.length]);

  // ======================================================================
  // 🔊 Sons fin du quiz
  // ======================================================================
  useEffect(() => {
    if (!finished) return;

    const totalQuestions = questions.length;
    const isPerfect = score === totalQuestions;

    const win = winAudioRef.current;
    const lose = loseAudioRef.current;

    if (!win || !lose) return;

    win.pause();
    lose.pause();
    win.currentTime = 0;
    lose.currentTime = 0;

    if (isPerfect) win.play().catch(() => {});
    else lose.play().catch(() => {});
  }, [finished, score, questions.length]);

  // Formatage temps
  function formatTime(sec) {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  }

  function formatDuration(sec) {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    if (m === 0) return `${s} secondes`;
    if (s === 0) return `${m} minutes`;
    return `${m} min ${s} s`;
  }

  // Rendu question courante
  const q = currentQuestion();
  const total = questions.length || 1;

  return (
    <div className="app-root">
      <div className="glass-layout">

        {/* SIDEBAR */}
        <aside className="sidebar">
          <div className="profile-block">
            <div className="avatar"><span>MK</span></div>
            <div className="profile-text">
              <h2>miniHKEYA</h2>
              <p>Quiz linguistiques</p>
            </div>
          </div>

          <nav className="sidebar-nav">
            <button className="nav-item" onClick={() => (window.location.href = "/")}>
              <span>🏠</span> Accueil
            </button>

            <button className="nav-item active">
              <span>🔤</span> Quiz
            </button>

            <button className="nav-item" onClick={() => (window.location.href = "/game/chnouwa-sar")}>
              <span>🧠</span> Chnouwa Sar ?
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
            <h1>Vocabulaire du quiz</h1>
            <p>Choisis le bon mot ou l'expression en tunisien.</p>

            {questions.length > 0 && (
              <div className="quiz-progress">
                <div className="quiz-progress-top">
                  <span>Question {index + 1} / {total}</span>
                  <span className="quiz-timer">⏱ {formatTime(timeLeft)}</span>
                  <span>Score : {score}</span>
                </div>
              </div>
            )}
          </header>

          <section className="games-list">

            {/* MESSAGE INIT */}
            {!q && !finished && (
              <article className="game-row">
                <div className="game-info">
                  <h3>Prêt(e) ?</h3>
                  <p>Clique sur <b>"Charger le quiz"</b> pour commencer.</p>
                </div>
              </article>
            )}

            {/* QUESTION */}
            {q && !finished && (
              <article className="game-row quiz-card">
                <div className="game-info">
                  <h3 className="quiz-question-title">{q.question}</h3>

                  <div className="quiz-choices-list">
                    {q.choices.map((choice, i) => (
                      <button
                        key={i}
                        className={selected === i ? "quiz-choice-btn selected" : "quiz-choice-btn"}
                        onClick={() => setSelected(i)}
                      >
                        {choice}
                      </button>
                    ))}
                  </div>

                  {feedback && <p className="quiz-feedback"><i>{feedback}</i></p>}

                  <div className="quiz-actions">
                    <button className="primary-btn" onClick={validate}>Valider</button>
                    <button className="secondary-btn" onClick={next}>Suivant</button>
                  </div>
                </div>
              </article>
            )}

            {/* FIN DU QUIZ */}
            {finished && (
              <article className="game-row quiz-final">
                <div className="game-info">
                  <h3>🎉 Quiz terminé !</h3>
                  <p>Tu as obtenu <b>{score}</b> / {total}</p>
                  <p>⏱ Temps total : <b>{formatDuration(usedSeconds)}</b></p>

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
