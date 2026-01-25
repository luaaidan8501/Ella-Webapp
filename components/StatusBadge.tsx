import type { ServiceStatusType } from "../lib/types";

const statusStyles: Record<ServiceStatusType, string> = {
  STANDBY: "bg-white/10 text-bone",
  PLATE_UP: "bg-brass/80 text-ink",
  PICK_UP: "bg-sage/80 text-ink",
  SERVED: "bg-white text-ink"
};

export const StatusBadge = ({ status }: { status: ServiceStatusType }) => {
  const label = status === "PLATE_UP" ? "FIRE" : status.replace("_", " ");
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-mono tracking-wide ${statusStyles[status]}`}>{label}</span>
  );
};
