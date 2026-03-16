import { useEffect, useState } from "react";
import { useSession } from "../utils/SessionContext";
import { TreatmentBanner } from "./TreatmentBanner";
import { Dice3D } from "./Dice3D";

interface GameScreenProps {
  onContinueToReport: () => void;
}

export function GameScreen({ onContinueToReport }: GameScreenProps) {
  const { session, rollDice, pushTelemetry } = useSession();
  const [isRolling, setIsRolling] = useState(false);
  const [hasValid, setHasValid] = useState<boolean>(session.firstValidRoll !== null);
  const [error, setError] = useState<string | null>(null);
  const [pendingRollValue, setPendingRollValue] = useState<number | null>(null);

  useEffect(() => {
    pushTelemetry({ type: "view", name: "game_screen", timestamp: Date.now() });
  }, [pushTelemetry]);

  // Handler para cuando el dado 3D necesita un resultado
  const handleRollRequest = async (): Promise<number> => {
    setError(null);
    pushTelemetry({ type: "click", name: "roll", timestamp: Date.now() });

    try {
      // Llamar a la API para obtener el resultado
      const response = await rollDice();
      
      if (!hasValid) {
        setHasValid(true);
      }
      
      return response.value;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error al lanzar dado";
      setError(message);
      throw err;
    }
  };

  // Handler para cuando la animación del dado termina
  const handleDiceResult = (result: number) => {
    console.log("[Game] Resultado del dado:", result);
    setIsRolling(false);
  };

  // Handler para cuando inicia el roll
  const handleRollStart = () => {
    setIsRolling(true);
    setError(null);
  };

  return (
    <div className="webapp-container text-black flex flex-col items-center select-none p-5">
      {session.treatment && <TreatmentBanner treatment={session.treatment} />}

      <div className="flex-1 flex flex-col items-center w-full min-h-0">
        {/* Título */}
        <h2 className="text-xl font-semibold text-center mb-3">
          Toca el dado para lanzar
        </h2>

        {/* Dado 3D */}
        <div className="w-full">
          <Dice3D
            onResult={handleDiceResult}
            onRollRequest={handleRollRequest}
            onRollStart={handleRollStart}
          />
        </div>

        {/* Error */}
        {error && (
          <div className="text-red-600 text-sm bg-red-50 px-4 py-2 rounded-lg mt-2">
            {error}
          </div>
        )}

        {/* Historial de tiradas */}
        {session.diceRolls.length > 0 && (
          <div className="w-full max-w-sm mt-3">
            <h3 className="font-semibold mb-1 text-sm">Historial de tiradas</h3>
            <ul className="text-xs text-gray-700 list-disc pl-5 max-h-16 overflow-y-auto">
              {session.diceRolls.map((r, idx) => (
                <li key={idx}>
                  #{idx + 1}: {r.value} {idx === 0 ? "(primera)" : ""}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Botón continuar — siempre visible al final */}
        <button
          onClick={onContinueToReport}
          disabled={!hasValid || isRolling}
          className="mt-auto pt-4 w-full max-w-xs px-8 py-3 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          Continuar
        </button>
      </div>
    </div>
  );
}
