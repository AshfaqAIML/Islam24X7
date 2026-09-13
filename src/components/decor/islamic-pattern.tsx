import { useId } from "react";
import { cn } from "@/lib/utils";

/**
 * Subtle Islamic geometric lattice — the classical "breath of the
 * compassionate" eight-pointed star tile. Decorative only (aria-hidden),
 * colored via currentColor, opacity controlled by the parent.
 *
 * Usage:
 *   <div className="relative">
 *     <StarLattice className="absolute inset-0 h-full w-full text-gold opacity-[0.07]" />
 *     ...content
 *   </div>
 */
export function StarLattice({
  className,
  tile = 76,
}: {
  className?: string;
  tile?: number;
}) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  const half = tile / 2;
  const q = tile / 4;

  return (
    <svg
      aria-hidden="true"
      className={cn("pointer-events-none select-none", className)}
    >
      <defs>
        <pattern
          id={`star-lattice-${id}`}
          width={tile}
          height={tile}
          patternUnits="userSpaceOnUse"
        >
          {/* eight-pointed star: two overlapping squares */}
          <rect
            x={q}
            y={q}
            width={half}
            height={half}
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
          />
          <rect
            x={q}
            y={q}
            width={half}
            height={half}
            transform={`rotate(45 ${half} ${half})`}
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
          />
          {/* lattice connector dots at tile corners */}
          <circle cx="0" cy="0" r="1.2" fill="currentColor" />
          <circle cx={tile} cy="0" r="1.2" fill="currentColor" />
          <circle cx="0" cy={tile} r="1.2" fill="currentColor" />
          <circle cx={tile} cy={tile} r="1.2" fill="currentColor" />
          <circle cx={half} cy={half} r="1.4" fill="currentColor" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#star-lattice-${id})`} />
    </svg>
  );
}
