interface InstructionsScreenProps {
  onStartGame: () => void;
}

export function InstructionsScreen({ onStartGame }: InstructionsScreenProps) {
  return (
    <div className="w-screen h-screen bg-white text-black flex flex-col justify-start items-center select-none p-5 overflow-y-auto">
      <div className="max-w-2xl w-full flex flex-col items-center pt-8 pb-12">
        {/* Título principal */}
        {/* <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-12 text-center tracking-wide">
          Instrucciones del Juego
        </h1> */}

        {/* Sección de Instrucciones */}
        <div className="w-full mb-10">
          <h2 className="text-xl md:text-2xl font-semibold mb-6 text-gray-800">
            Instrucciones:
          </h2>
          
          <ul className="space-y-4 text-base md:text-lg leading-relaxed">
            <li className="flex items-start">
              <span className="text-black font-semibold mr-3">•</span>
              <span>El premio es único por pulsera y usuario.</span>
            </li>
            <li className="flex items-start">
              <span className="text-black font-semibold mr-3">•</span>
              <span>Tirar el dado.</span>
            </li>
            <li className="flex items-start">
              <span className="text-black font-semibold mr-3">•</span>
              <span>Insertar número que te salió del dado para optar al premio.</span>
            </li>
            <li className="flex items-start">
              <span className="text-black font-semibold mr-3">•</span>
              <span>El primer número que de el dado en la primera tirada será el número que deberás introducir.</span>
            </li>
          </ul>
        </div>

        {/* Sección de Premios */}
        <div className="w-full mb-12">
          <h2 className="text-xl md:text-2xl font-semibold mb-6 text-gray-800">
            Premios:
          </h2>
          
          <p className="text-base md:text-lg mb-6 text-gray-700">
            Según el resultado del dado obtendrás los siguientes premio.
          </p>

          {/* Tabla de premios */}
          <div className="bg-gray-50 rounded-lg p-6">
            <div className="grid grid-cols-2 gap-4">
              {[
                { number: "1", prize: "10€" },
                { number: "2", prize: "15€" },
                { number: "3", prize: "20€" },
                { number: "4", prize: "25€" },
                { number: "5", prize: "30€" },
                { number: "6", prize: "35€" }
              ].map(({ number, prize }) => (
                <div 
                  key={number}
                  className="flex justify-between items-center py-3 px-4 bg-white rounded-lg shadow-sm border"
                >
                  <span className="text-lg md:text-xl font-bold text-black">
                    {number}
                  </span>
                  <span className="text-lg md:text-xl font-semibold text-green-600">
                    {prize}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Mensaje de suerte */}
        <div className="text-center mb-8">
          <p className="text-xl md:text-2xl font-medium text-gray-800">
            ¡Mucha suerte!
          </p>
        </div>

        {/* Botón para ir al juego */}
        <button
          onClick={onStartGame}
          className="px-8 py-4 bg-black text-white text-lg md:text-xl font-semibold rounded-lg hover:bg-gray-800 transition-all duration-200 transform hover:scale-105 active:scale-95"
        >
          Ir al juego
        </button>
      </div>
    </div>
  );
}
