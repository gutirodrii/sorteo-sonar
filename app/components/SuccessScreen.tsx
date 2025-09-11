import { useEffect } from "react";

interface SuccessScreenProps {
  onAdvance: () => void;
}

export function SuccessScreen({ onAdvance }: SuccessScreenProps) {
  useEffect(() => {
    // Avanzar automáticamente después de 3 segundos
    const timer = setTimeout(() => {
      onAdvance();
    }, 1000);

    return () => clearTimeout(timer);
  }, [onAdvance]);

  return (
    <div className="webapp-container text-black flex flex-col justify-center items-center select-none p-5">
      <div className="text-center max-w-[90%]">
        <h1 className="text-4xl font-bold mb-8 tracking-wider uppercase">
          ¡CÓDIGO VERIFICADO!
        </h1>
        <p className="text-xl mb-12 tracking-wide">
          Preparando tu sorteo...
        </p>
        <div className="w-8 h-8 border-4 border-gray-300 border-t-black rounded-full animate-spin mx-auto"></div>
      </div>
    </div>
  );
}
