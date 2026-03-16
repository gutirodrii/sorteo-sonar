import { useEffect, useState } from "react";
import { useSession } from "../utils/SessionContext";

interface ReportScreenProps {
  onSubmitReport: () => void;
}

export function ReportScreen({ onSubmitReport }: ReportScreenProps) {
  const { session, submitClaim, pushTelemetry } = useSession();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    pushTelemetry({ type: "view", name: "report_screen", timestamp: Date.now() });
  }, [pushTelemetry]);

  const handleClick = async (value: number) => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    setError(null);
    pushTelemetry({ type: "click", name: `report_${value}`, timestamp: Date.now() });

    try {
      // Enviar el valor reclamado a la API
      const response = await submitClaim(value);
      console.log("[Report] Claim enviado:", {
        claimed: value,
        actual: response.trueValue,
      });
      onSubmitReport();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error al enviar respuesta";
      setError(message);
      setIsSubmitting(false);
    }
  };

  const buttons = [1, 2, 3, 4, 5, 6];

  return (
    <div className="webapp-container text-black flex flex-col items-center select-none p-5">
      <div className="w-full max-w-sm">
        <h2 className="text-xl font-semibold mb-6">
          ¿Qué número mostró tu primera tirada válida?
        </h2>
        
        {error && (
          <div className="mb-4 text-red-600 text-sm bg-red-50 px-4 py-2 rounded-lg">
            {error}
          </div>
        )}

        <div className="grid grid-cols-3 gap-3">
          {buttons.map((n) => (
            <button
              key={n}
              onClick={() => handleClick(n)}
              disabled={isSubmitting}
              className="py-4 rounded-lg border text-lg font-bold hover:bg-gray-100 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {n}
            </button>
          ))}
        </div>

        {session.firstValidRoll != null && (
          <p className="text-xs text-gray-500 mt-4">
            Recuerda: solo cuenta la primera tirada válida.
          </p>
        )}

        {isSubmitting && (
          <div className="mt-4 text-center text-gray-600">
            <span className="animate-pulse">Enviando...</span>
          </div>
        )}
      </div>
    </div>
  );
}
