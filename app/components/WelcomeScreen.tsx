import { useState, useEffect } from "react";

interface WelcomeScreenProps {
  onAdvance: () => void;
}

export function WelcomeScreen({ onAdvance }: WelcomeScreenProps) {
  const [canAdvance, setCanAdvance] = useState(false);
  const [showTitle, setShowTitle] = useState(false);
  const [showSubtitle, setShowSubtitle] = useState(false);
  const [showAction, setShowAction] = useState(false);

  useEffect(() => {
    // Secuencia de fadeIn
    const titleTimer = setTimeout(() => setShowTitle(true), 300);
    const subtitleTimer = setTimeout(() => setShowSubtitle(true), 1200);
    const actionTimer = setTimeout(() => setShowAction(true), 2100);
    
    // Permitir avanzar después de 3 segundos
    const advanceTimer = setTimeout(() => {
      setCanAdvance(true);
    }, 3000);

    return () => {
      clearTimeout(titleTimer);
      clearTimeout(subtitleTimer);
      clearTimeout(actionTimer);
      clearTimeout(advanceTimer);
    };
  }, []);

  const handleScreenClick = () => {
    if (canAdvance) {
      onAdvance();
    }
  };

  return (
    <div 
      className="w-screen h-screen bg-white text-black flex flex-col justify-start items-center cursor-pointer select-none p-5 overflow-hidden"
      onClick={handleScreenClick}
    >
      {/* Título principal - ubicado en la primera mitad vertical */}
      <div className="flex-1 flex items-center justify-center max-h-[50vh]">
        <h1 
          className={`text-4xl md:text-6xl lg:text-8xl font-bold tracking-[0.15em] uppercase text-center ${
            showTitle 
              ? 'animate-fade-visible' 
              : 'animate-fade-hidden'
          }`}
          style={{
            textShadow: '2px 2px 4px rgba(0, 0, 0, 0.1), 0 0 8px rgba(0, 0, 0, 0.05)'
          }}
        >
          BIENVENIDO A SONAR
        </h1>
      </div>

      {/* Contenido inferior */}
      <div className="flex-1 flex flex-col justify-evenly items-center text-center max-w-[90%]">
        {/* Subtítulo más llamativo */}
        <p 
          className={`text-2xl md:text-4xl lg:text-5xl font-semibold mb-16 tracking-wide bg-gradient-to-r from-black via-gray-800 to-black bg-clip-text text-transparent ${
            showSubtitle 
              ? 'animate-fade-visible' 
              : 'animate-fade-hidden'
          }`}
          style={{
            background: 'linear-gradient(45deg, #000000, #333333, #000000)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}
        >
          ¿Quieres ganar un premio?
        </p>

        {/* Texto de acción con pulse */}
        <p 
          className={`text-lg md:text-2xl lg:text-3xl tracking-wide text-gray-500 ${
            showAction 
              ? 'animate-fade-visible-fast' 
              : 'animate-fade-hidden'
          } ${
            canAdvance 
              ? 'animate-pulse' 
              : ''
          }`}
        >
          pulsa la pantalla para ganar
        </p>
      </div>
    </div>
  );
}
