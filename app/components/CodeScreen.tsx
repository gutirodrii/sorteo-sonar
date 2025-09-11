import { useState } from "react";
import { HelpModal } from "./HelpModal";

interface CodeScreenProps {
  onCodeVerified: () => void;
}

export function CodeScreen({ onCodeVerified }: CodeScreenProps) {
  const [showModal, setShowModal] = useState(false);
  const [code, setCode] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isShaking, setIsShaking] = useState(false);

  const handleCodeSubmit = async () => {
    if (!code.trim()) return;

    // Limpiar estados de error previos
    setHasError(false);
    setIsShaking(false);
    setIsValidating(true);

    // Simular validación de API
    await new Promise((resolve) => setTimeout(resolve, 1000));

    if (code === "1234") {
      onCodeVerified();
    } else {
      // Mostrar error y animación de temblor
      setHasError(true);
      setIsShaking(true);
      
      // Quitar la animación de temblor después de que termine
      setTimeout(() => {
        setIsShaking(false);
      }, 500);
    }

    setIsValidating(false);
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
    }
  };

  return (
    <div className="w-screen h-screen bg-white text-black flex flex-col justify-center items-center select-none p-5 relative">
      <HelpModal isOpen={showModal} onClose={() => setShowModal(false)} />

      {/* Contenido principal */}
      <div className="flex-1 flex flex-col justify-center items-center text-center max-w-[90%] w-full">
        {/* Título principal */}
        <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-8 tracking-wide">
          Introduce el código situado en tu pulsera
        </h1>

        {/* Link de ayuda */}
        <button
          onClick={() => setShowModal(true)}
          className="text-sm md:text-base text-gray-400 mb-12 underline-offset-2 hover:underline transition-all duration-200"
        >
          ¿Dónde está mi código?
        </button>
      </div>
       {/* Input y botón */}
       <div className="flex-1 flex flex-col justify-center items-center w-full max-w-md">
         <div className={`flex gap-3 w-full ${isShaking ? 'animate-shake' : ''}`}>
           <input
             type="text"
             value={code}
             onChange={handleInputChange}
             onKeyPress={handleKeyPress}
             placeholder="Código de pulsera"
             disabled={isValidating}
             className={`flex-1 px-4 py-3 text-lg border-2 rounded-lg focus:outline-none transition-all duration-200 disabled:opacity-50 ${
               hasError 
                 ? 'border-red-500 focus:border-red-600' 
                 : 'border-gray-300 focus:border-black'
             }`}
           />
           <button
             onClick={handleCodeSubmit}
             disabled={isValidating || !code.trim()}
             className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center"
           >
             {isValidating ? (
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
           <p className="text-red-500 text-sm mt-2 animate-fade-visible-fast">
             Código incorrecto. Por favor, intenta de nuevo.
           </p>
         )}
       </div>
    </div>
  );
}
