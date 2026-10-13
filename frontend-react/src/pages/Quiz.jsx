// src/pages/Quiz.jsx
import { useState, useEffect, useRef } from "react";
import "../App.css";
import "./GameStyle.css";
import Sidebar from "../components/Sidebar";

const API = "http://127.0.0.1:8000";
const GLOBAL_TIME = 60;

export default function Quiz() {
  const [questions, setQuestions] = useState([]);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  const [feedback, setFeedback] = useState("");
  const [feedbackType, setFeedbackType] = useState("info"); // "info" | "warning" | "success" | "error"
  const [validated, setValidated] = useState(false);

  const [timeLeft, setTimeLeft] = useState(GLOBAL_TIME);
  const [isRunning, setIsRunning] = useState(false);
  const [timerKey, setTimerKey] = useState(0);
  const [usedSeconds, setUsedSeconds] = useState(0);

  const winAudioRef = useRef(null);
  const loseAudioRef = useRef(null);

  useEffect(() => {
    winAudioRef.current = new Audio("/sounds/win.mp3");
    loseAudioRef.current = new Audio("/sounds/gameover.mp3");
  }, []);

  async function loadQuiz() {
    try {
      const res = await fetch(`${API}/api/quiz/questions`);

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`HTTP ${res.status} - ${txt}`);
      }

      const data = await res.json();

      winAudioRef.current?.pause();
      loseAudioRef.current?.pause();
      if (winAudioRef.current) winAudioRef.current.currentTime = 0;
      if (loseAudioRef.current) loseAudioRef.current.currentTime = 0;

      setQuestions(data.questions || []);
      setIndex(0);
      setSelected(null);
      setScore(0);
      setFinished(false);

      setFeedback("");
      setFeedbackType("info");
      setValidated(false);

      setIsRunning(false);
      setTimeLeft(GLOBAL_TIME);
      setUsedSeconds(0);

      setTimerKey((key) => key + 1);
      setIsRunning(true);
    } catch (e) {
      setFeedback("❌ Erreur lors du chargement du quiz : " + e.message);
      setFeedbackType("error");
      console.error(e);
    }
  }

  function currentQuestion() {
    return questions[index];
  }

  function validate() {
    const q = currentQuestion();
    if (!q) return;

    if (selected === null) {
      setFeedback("⚠️ Choisis une réponse 🙂");
      setFeedbackType("warning");
      return;
    }

    const correct = Number(q.correct_index);

    if (selected === correct) {
      setScore((prev) => prev + 1);
      setFeedback("✅ Bravo !");
      setFeedbackType("success");
    } else {
      setFeedback(`❌ Oups. La bonne réponse était : ${q.choices[correct]}`);
      setFeedbackType("error");
    }

    setValidated(true);
  }

  function next() {
    // ✅ notification si clique "Suivant" avant "Vérifier"
    if (!validated) {
      setFeedback("⚠️ Vérifie ta réponse avant de passer à la suivante !");
      setFeedbackType("warning");
      return;
    }

    if (index + 1 < questions.length) {
      setIndex((prev) => prev + 1);
      setSelected(null);
      setFeedback("");
      setFeedbackType("info");
      setValidated(false);
    } else {
      setFinished(true);
      setIsRunning(false);
      setUsedSeconds(GLOBAL_TIME - timeLeft);
    }
  }

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

  const q = currentQuestion();
  const total = questions.length || 1;

  return (
    <div className="app-root">
      <div className="glass-layout">
        <Sidebar subtitle="Quiz – Vocabulaire arabe" />

        <main className="main-panel">
          <header className="main-header">
            <h1>KalmaPlay</h1>
            <p>Lis la question (en français) et choisis la bonne réponse (souvent en arabe).</p>

            {questions.length > 0 && (
              <div className="quiz-progress">
                <div className="quiz-progress-top">
                  <span>
                    Question {index + 1} / {total}
                  </span>
                  <span className="quiz-timer">⏱ {formatTime(timeLeft)}</span>
                  <span>Score : {score}</span>
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
                    Clique sur <b>“Commencer”</b> pour lancer le quiz.
                  </p>
                </div>

                <div style={{ paddingRight: "1rem" }}>
                  <button className="cta-button" onClick={loadQuiz}>
                    Commencer
                  </button>
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
                        className={selected === i ? "quiz-choice-btn selected" : "quiz-choice-btn"}
                        onClick={() => {
                          setSelected(i);

                          // si l'utilisateur change de choix après validation -> il doit revérifier
                          if (validated) {
                            setValidated(false);
                            setFeedback("");
                            setFeedbackType("info");
                          }
                        }}
                      >
                        {choice}
                      </button>
                    ))}
                  </div>

                  {feedback && (
                    <p className={`quiz-feedback ${feedbackType}`}>
                      <i>{feedback}</i>
                    </p>
                  )}

                  <div className="quiz-actions">
                    <button className="primary-btn" onClick={validate}>
                      Vérifier
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
                  <h3>🎉 Terminé !</h3>
                  <p>
                    Ton score : <b>{score}</b> / {total}
                  </p>
                  <p>
                    ⏱ Temps : <b>{formatDuration(usedSeconds)}</b>
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
