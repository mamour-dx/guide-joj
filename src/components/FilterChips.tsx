"use client";

import { CLUSTER_LABEL, CLUSTERS } from "@/lib/cards";
import { toggle, type Filters } from "@/lib/filters";
import { CLUSTER_DOT } from "./SessionCard";

type SportChip = { id: string; label: string; emoji: string };

function Chip({ pressed, onClick, children }: { pressed: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={`inline-flex min-h-11 shrink-0 items-center gap-1.5 border px-3.5 text-sm font-semibold whitespace-nowrap ${
        pressed ? "border-blue bg-blue text-on-blue" : "border-line bg-page text-ink"
      }`}
    >
      {children}
    </button>
  );
}

export function FilterChips({
  value,
  onChange,
  sports,
}: {
  value: Filters;
  onChange: (f: Filters) => void;
  sports: SportChip[];
}) {
  return (
    <div role="group" aria-label="Filtres" className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 py-2">
      <Chip pressed={value.free} onClick={() => onChange({ ...value, free: !value.free })}>Gratuit</Chip>
      <Chip pressed={value.finals} onClick={() => onChange({ ...value, finals: !value.finals })}>Finales</Chip>
      {CLUSTERS.map((c) => (
        <Chip key={c} pressed={value.clusters.includes(c)} onClick={() => onChange({ ...value, clusters: toggle(value.clusters, c) })}>
          <span className={`inline-block size-2.5 ${CLUSTER_DOT[c]}`} aria-hidden="true" />
          {CLUSTER_LABEL[c]}
        </Chip>
      ))}
      {sports.map((s) => (
        <Chip key={s.id} pressed={value.sports.includes(s.id)} onClick={() => onChange({ ...value, sports: toggle(value.sports, s.id) })}>
          {s.label}
        </Chip>
      ))}
    </div>
  );
}
