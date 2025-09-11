interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function HelpModal({ isOpen, onClose }: HelpModalProps) {
  if (!isOpen) return null;

  return (
    <div className="max-w-[425px] fixed inset-0 m-auto backdrop-blur-sm flex items-center justify-center z-50 p-4 bg-black/10">
      <div className="bg-white rounded-lg max-w-[300px] w-full overflow-auto shadow-2xl backdrop-blur-none">
        {/* Header del modal */}
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-lg font-semibold">¿Dónde está mi código?</h3>
          <button
            onClick={onClose}
            className="text-2xl font-bold text-gray-500 hover:text-black transition-colors duration-200"
          >
            ×
          </button>
        </div>

        {/* Contenido del modal */}
        <div className="p-4">
          <div
            className="w-full aspect-square bg-gray-200 flex items-center justify-center text-gray-500 text-lg font-medium rounded-lg mb-4 m-auto"
            style={{ width: `200px`, maxWidth: "200px" }}
          >
            Imagen de ejemplo de pulsera
          </div>
          <p className="text-sm text-gray-600 text-center">
            El código se encuentra en la parte posterior de tu pulsera
          </p>
        </div>
      </div>
    </div>
  );
}
