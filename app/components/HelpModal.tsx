interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function HelpModal({ isOpen, onClose }: HelpModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-[90vw] w-full max-h-[80vh] overflow-auto">
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
            className="w-full aspect-square bg-gray-200 flex items-center justify-center text-gray-500 text-lg font-medium rounded-lg mb-4"
            style={{ width: `calc(100vw - 2rem)`, maxWidth: '100%' }}
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
