interface SkinCardProps {
  condition: string;
  severity: "none" | "mild" | "moderate" | "severe";
  score: number;
  icon: string;
  description?: string;
}

const severityColors = {
  none:     "border-b-4 border-green-300",
  mild:     "border-b-4 border-yellow-300",
  moderate: "border-b-4 border-orange-400",
  severe:   "border-b-4 border-secondary",
};

export default function SkinCard({ condition, severity, score, icon, description }: SkinCardProps) {
  return (
    <div className={`bg-surface-container-lowest p-6 rounded-3xl shadow-sm ${severityColors[severity]} group hover:-translate-y-1 transition-transform duration-300`}>
      <div className="flex items-center justify-between mb-4">
        <div className="w-12 h-12 bg-primary-fixed flex items-center justify-center rounded-2xl">
          <span className="material-symbols-outlined text-primary text-2xl">{icon}</span>
        </div>
        <span className="text-2xl font-headline font-black text-primary">{score.toFixed(0)}</span>
      </div>
      <h3 className="text-lg font-headline font-bold text-on-surface capitalize mb-1">{condition}</h3>
      {description && (
        <p className="text-sm text-on-surface-variant leading-relaxed">{description}</p>
      )}
      {/* Score bar */}
      <div className="mt-4 h-1.5 w-full bg-surface-container-high rounded-full overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all duration-500"
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}
