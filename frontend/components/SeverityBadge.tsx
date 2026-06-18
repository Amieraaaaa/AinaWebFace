interface SeverityBadgeProps {
  severity: "none" | "mild" | "moderate" | "severe";
}

const styles = {
  none:     "bg-green-100 text-green-800",
  mild:     "bg-yellow-100 text-yellow-800",
  moderate: "bg-orange-100 text-orange-800",
  severe:   "bg-error-container text-on-error-container",
};

export default function SeverityBadge({ severity }: SeverityBadgeProps) {
  return (
    <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest ${styles[severity]}`}>
      {severity}
    </span>
  );
}
