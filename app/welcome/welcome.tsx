import { useState } from "react";
import { WelcomeScreen } from "../components/WelcomeScreen";
import { CodeScreen } from "../components/CodeScreen";
import { SuccessScreen } from "../components/SuccessScreen";
import { InstructionsScreen } from "../components/InstructionsScreen";

type Screen = "welcome" | "code" | "success" | "instructions" | "game";

export function Welcome() {
  const [currentScreen, setCurrentScreen] = useState<Screen>("welcome");

  const handleAdvanceToCode = () => {
    setCurrentScreen("code");
  };

  const handleCodeVerified = () => {
    setCurrentScreen("success");
  };

  const handleShowInstructions = () => {
    setCurrentScreen("instructions");
  };

  const handleStartGame = () => {
    setCurrentScreen("game");
  };

  switch (currentScreen) {
    case "welcome":
      return <WelcomeScreen onAdvance={handleAdvanceToCode} />;
    
    case "code":
      return <CodeScreen onCodeVerified={handleCodeVerified} />;
    
    case "success":
      return <SuccessScreen onAdvance={handleShowInstructions} />;
    
    case "instructions":
      return <InstructionsScreen onStartGame={handleStartGame} />;
    
    case "game":
      return (
        <div className="webapp-container text-black flex flex-col justify-center items-center select-none p-5">
          <h1 className="text-4xl font-bold mb-8">¡PRÓXIMAMENTE!</h1>
          <p className="text-xl text-gray-600">Pantalla del juego</p>
        </div>
      );
    
    default:
      return <WelcomeScreen onAdvance={handleAdvanceToCode} />;
  }
}
