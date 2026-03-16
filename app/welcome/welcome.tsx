import { useState, useEffect, useRef } from "react";
import { WelcomeScreen } from "../components/WelcomeScreen";
import { CodeScreen } from "../components/CodeScreen";
import { SuccessScreen } from "../components/SuccessScreen";
import { InstructionsScreen } from "../components/InstructionsScreen";
import { GameScreen } from "../components/GameScreen";
import { ReportScreen } from "../components/ReportScreen";
import { ExitScreen } from "../components/ExitScreen";
import { useSession } from "../utils/SessionContext";
import type { UserState } from "../utils/api";

type Screen = "welcome" | "code" | "success" | "instructions" | "game" | "report" | "exit";

export function Welcome() {
  const [currentScreen, setCurrentScreen] = useState<Screen>("welcome");
  const { trackScreenNavigation, session } = useSession();
  const lastTrackedScreen = useRef<string | null>(null);

  // Trackear cambios de pantalla (solo una vez por pantalla)
  useEffect(() => {
    if (!session.userId) return;

    const screenMap: Record<Screen, "screen1" | "screen2" | "screen3" | null> = {
      welcome: "screen1",
      code: "screen1",
      success: "screen1",
      instructions: "screen2",
      game: "screen2",
      report: "screen3",
      exit: "screen3",
    };

    const apiScreen = screenMap[currentScreen];
    // Solo trackear si es diferente de la última pantalla trackeada
    if (apiScreen && lastTrackedScreen.current !== apiScreen) {
      lastTrackedScreen.current = apiScreen;
      trackScreenNavigation(apiScreen);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentScreen, session.userId]);

  const handleAdvanceToCode = () => {
    setCurrentScreen("code");
  };

  /**
   * Callback cuando el código de pulsera es verificado
   * Navega a la pantalla correspondiente según el estado del usuario:
   * - State 0: El usuario no ha tirado → va a instrucciones
   * - State 1: El usuario ya tiró pero no reportó → va directo al dado
   * - State 2: El usuario ya completó → va a la pantalla de salida
   */
  const handleCodeVerified = (code: string, state: UserState) => {
    console.log("[App] Usuario verificado, código:", code, "estado:", state);
    
    switch (state) {
      case 0:
        // Usuario nuevo, no ha tirado → mostrar pantalla de éxito → instrucciones → juego
        setCurrentScreen("success");
        break;
      case 1:
        // Usuario ya tiró pero no reportó → ir directo al juego
        setCurrentScreen("game");
        break;
      case 2:
        // Usuario ya completó → ir a pantalla de salida
        setCurrentScreen("exit");
        break;
      default:
        setCurrentScreen("success");
    }
  };

  const handleShowInstructions = () => {
    setCurrentScreen("instructions");
  };

  const handleStartGame = () => {
    setCurrentScreen("game");
  };

  const handleContinueToReport = () => {
    setCurrentScreen("report");
  };

  const handleReportSubmitted = () => {
    setCurrentScreen("exit");
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
      return <GameScreen onContinueToReport={handleContinueToReport} />;
    
    case "report":
      return <ReportScreen onSubmitReport={handleReportSubmitted} />;
    
    case "exit":
      return <ExitScreen />;
    
    default:
      return <WelcomeScreen onAdvance={handleAdvanceToCode} />;
  }
}
