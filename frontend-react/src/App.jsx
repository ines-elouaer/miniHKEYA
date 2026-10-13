import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./App.css";

import Accueil from "./pages/Accueil.jsx";
import Quiz from "./pages/Quiz.jsx";
import ChnouwaSar from "./pages/ChnouwaSar.jsx";
import RobotKelma from "./pages/RobotKelma.jsx";
import StoryBotGame from "./pages/StoryBotGame.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import FamilyLabyrinth from "./pages/FamilyLabyrinth.jsx";

function RequireAuth({ children }) {
  const token = localStorage.getItem("token");
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Default: go login */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        
        {/* Auth */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Home */}
        <Route
          path="/home"
          element={
            <RequireAuth>
              <Accueil />
            </RequireAuth>
          }
        />

        {/* Quiz */}
        <Route
          path="/quiz"
          element={
            <RequireAuth>
              <Quiz />
            </RequireAuth>
          }
        />

        {/* Robot */}
        <Route
          path="/game/robot"
          element={
            <RequireAuth>
              <RobotKelma />
            </RequireAuth>
          }
        />

        {/* Mission Hkeya (Chnouwa Sar) */}
        <Route
          path="/game/chnouwa-sar"
          element={
            <RequireAuth>
              <ChnouwaSar />
            </RequireAuth>
          }
        />

        {/* Story Bot */}
        <Route
          path="/game/story-bot"
          element={
            <RequireAuth>
              <StoryBotGame />
            </RequireAuth>
          }
        />

        {/* Family */}
        <Route
          path="/game/family"
          element={
            <RequireAuth>
              <FamilyLabyrinth />
            </RequireAuth>
          }
        />
        <Route
  path="/game/chnouwa-sar"
  element={
    <RequireAuth>
      <ChnouwaSar />
    </RequireAuth>
  }
/>

      </Routes>
    </BrowserRouter>
  );
}

export default App;
