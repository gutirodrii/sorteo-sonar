import type { TreatmentConfig } from "../utils/SessionContext";

export function TreatmentBanner({ treatment }: { treatment: TreatmentConfig }) {
  const { referenceSampleSize, displayedShareFivePct, dishonestyLevelPct } = treatment;
  return (
    <div className="w-full max-w-sm mb-4 p-3 rounded-lg border bg-gray-50 text-sm">
      <p>
        De los últimos <strong>{referenceSampleSize}</strong> participantes, el <strong>
        {displayedShareFivePct.toFixed(2)}%</strong> han reportado un 5 (el <strong>{dishonestyLevelPct}%</strong> era el valor esperado)
      </p>
    </div>
  );
}



