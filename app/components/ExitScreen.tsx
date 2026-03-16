import { useMemo } from "react";
import { useSession } from "../utils/SessionContext";

interface ExitScreenProps {
  onReset?: () => void;
}

export function ExitScreen({ onReset }: ExitScreenProps) {
  const { session } = useSession();

  const prizeMessage = useMemo(() => {
    const t = session.tickets;
    const lines = [
      `Tu número válido: ${session.firstValidRoll ?? "-"}`,
      `Tickets obtenidos: ${t}`,
    ];
    return lines.join("\n");
  }, [session.firstValidRoll, session.tickets]);

  const inviteLink = useMemo(() => {
    const token = session.userId ? btoa(`${session.userId}`) : "";
    const url = new URL(window.location.href);
    url.searchParams.set("ref", token);
    return url.toString();
  }, [session.userId]);

  return (
    <div className="webapp-container text-black flex flex-col items-center select-none p-5">
      <div className="w-full max-w-sm text-center">
        {session.incentiveAwarded ? (
          <>
            <h2 className="text-2xl font-bold mb-4">¡Enhorabuena!</h2>
            <p className="mb-4">
              Has obtenido un premio. Envía un email con tu código de pulsera
              para reclamarlo.
            </p>
            <pre className="bg-gray-50 p-3 rounded border text-left whitespace-pre-wrap">
              {prizeMessage}
            </pre>
          </>
        ) : (
          <>
            <h2 className="text-2xl font-bold mb-4">Gracias por participar</h2>
            <p className="mb-4">
              No has obtenido premio, pero puedes invitar a tus amigos con este
              enlace:
            </p>
            <div className="p-3 rounded border bg-gray-50 break-all text-sm mb-3">
              {inviteLink}
            </div>
            <p className="text-xs text-gray-600">
              El enlace incluye un token de referencia anónimo.
            </p>
          </>
        )}

        {onReset && (
          <button
            onClick={onReset}
            className="mt-6 px-6 py-3 border rounded-lg hover:bg-gray-100"
          >
            Volver al inicio
          </button>
        )}
      </div>
    </div>
  );
}
