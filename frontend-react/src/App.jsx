import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./App.css";

import Accueil from "./pages/Accueil.jsx";
import Quiz from "./pages/Quiz.jsx";
import ChnouwaSar from "./pages/ChnouwaSar.jsx";
import RobotKelma from "./pages/RobotKelma.jsx";
import StoryBotGame from "./pages/StoryBotGame.jsx";   // 🔹 nouvel import

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Page d'accueil */}
        <Route path="/" element={<Accueil />} />

        {/* Page Quiz */}
        <Route path="/quiz" element={<Quiz />} />

        {/* Page Robot */}
        <Route path="/game/robot" element={<RobotKelma />} />

        {/* Page jeu CHNOUWA SAR */}
        <Route path="/game/chnouwa-sar" element={<ChnouwaSar />} />

        {/* Page STORY BOT */}
        <Route path="/game/story-bot" element={<StoryBotGame />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
