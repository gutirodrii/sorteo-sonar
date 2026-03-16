import { useState } from "react";
import { HelpModal } from "./HelpModal";
import { usePageTelemetry } from "../utils/usePageTelemetry";
import { useSession, type VerifyUserResult } from "../utils/SessionContext";
import type { UserState } from "../utils/api";

interface CodeScreenProps {
  onCodeVerified: (code: string, state: UserState) => void;
}

export function CodeScreen({ onCodeVerified }: CodeScreenProps) {
  const [showModal, setShowModal] = useState(false);
  const [code, setCode] = useState("");
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isShaking, setIsShaking] = useState(false);
  const { trackClick } = usePageTelemetry("code");
  const { verifyUser, isVerifying } = useSession();

  const handleCodeSubmit = async () => {
    if (!code.trim()) return;

    // Limpiar estados de error previos
    setHasError(false);
    setErrorMessage("");
    setIsShaking(false);

    // Validar que no esté vacío
    const userId = code.trim();

    if (!userId) {
      showError("El código no puede estar vacío");
      return;
    }

    // Verificar el usuario contra la API
    const result: VerifyUserResult = await verifyUser(userId);

    if (result.success) {
      trackClick("verify", { userId, state: result.state });
      onCodeVerified(code, result.state);
    } else {
      // Mostrar error apropiado
      if (result.isNotFound) {
        showError("Código de pulsera inválido. Por favor, verifica tu código.");
      } else {
        showError(result.error || "Error al verificar el código");
      }
    }
  };

  const showError = (message: string) => {
    setHasError(true);
    setErrorMessage(message);
    setIsShaking(true);

    // Quitar la animación de temblor después de que termine
    setTimeout(() => {
      setIsShaking(false);
    }, 500);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleCodeSubmit();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCode(e.target.value);
    // Limpiar el error cuando el usuario empiece a escribir
    if (hasError) {
      setHasError(false);
      setErrorMessage("");
    }
  };

  return (
    <div
      className={`webapp-container text-black flex flex-col justify-center items-center select-none p-5 relative`}
    >
      <HelpModal isOpen={showModal} onClose={() => setShowModal(false)} />

      {/* Contenido principal */}
      <div className="flex-1 flex flex-col justify-center items-center text-center max-w-[90%] w-full">
        {/* Título principal */}
        <h1 className="text-3xl font-bold mb-8 tracking-wide">
          Introduce el código situado en tu pulsera
        </h1>

        {/* Link de ayuda */}
        <button
          onClick={() => setShowModal(true)}
          className="text-sm text-gray-400 mb-12 underline-offset-2 hover:underline transition-all duration-200"
        >
          ¿Dónde está mi código?
        </button>
      </div>

      {/* Input y botón */}
      <div className="flex-1 flex flex-col justify-center items-center w-full max-w-md">
        <div
          className={`flex gap-3 w-full ${isShaking ? "animate-shake" : ""}`}
        >
          <input
            type="text"
            value={code}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder="Código de pulsera"
            disabled={isVerifying}
            className={`flex-1 px-4 py-3 text-lg border-2 rounded-lg focus:outline-none transition-all duration-200 disabled:opacity-50 ${
              hasError
                ? "border-red-500 focus:border-red-600"
                : "border-gray-300 focus:border-black"
            }`}
          />
          <button
            onClick={handleCodeSubmit}
            disabled={isVerifying || !code.trim()}
            className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center"
          >
            {isVerifying ? (
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            )}
          </button>
        </div>

        {/* Mensaje de error */}
        {hasError && (
          <p className="text-red-500 text-sm mt-2 animate-fade-visible-fast text-center">
            {errorMessage}
          </p>
        )}
      </div>
    </div>
  );
}
