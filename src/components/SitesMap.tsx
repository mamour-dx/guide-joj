"use client";

// Carte des sites (Leaflet + tuiles OpenStreetMap). Chargée à la demande depuis SitesView :
// ni Leaflet ni les tuiles ne pèsent sur la page tant qu'on reste sur la liste.
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, Navigation, X } from "lucide-react";
import { CLUSTER_LABEL, CLUSTERS } from "@/lib/cards";
import type { Cluster } from "@/lib/schema";
import { ClusterTag, CLUSTER_DOT } from "./SessionCard";
import { RemainingCount } from "./TimeAware";

/** Site placé sur la carte : uniquement ceux dont lat/lng sont vérifiés (jamais de position devinée). */
export type MapVenue = {
  id: string;
  name: string;
  shortName: string;      // étiquette sur la carte, sans la précision entre parenthèses
  cluster: Cluster;
  lat: number;
  lng: number;
  routeUrl: string;       // itinéraire Google Maps, calculé côté serveur
  ends: string[];
  total: number;
};

type Focus = Cluster | "all";

// au-delà de ce zoom, les noms des sites s'affichent à côté des pastilles
const LABEL_ZOOM = 13;

function pin(cluster: Cluster, active: boolean) {
  // 44 px de zone tactile autour d'une pastille de 22 px
  return L.divIcon({
    className: "venue-pin",
    iconSize: [44, 44],
    iconAnchor: [22, 22],
    html: `<span class="venue-dot venue-dot-${cluster}${active ? " is-active" : ""}"></span>`,
  });
}

const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export default function SitesMap({ venues }: { venues: MapVenue[] }) {
  const el = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markers = useRef(new globalThis.Map<string, L.Marker>());
  const [selected, setSelected] = useState<string | null>(null);
  const [focus, setFocus] = useState<Focus>("all");

  useEffect(() => {
    const node = el.current;
    if (!node) return;
    const map = L.map(node, { zoomControl: false, tapTolerance: 15 });
    L.control.zoom({ position: "topright", zoomInTitle: "Zoomer", zoomOutTitle: "Dézoomer" }).addTo(map);
    map.attributionControl.setPrefix(false);
    // noms des sites sous les pastilles (markerPane = 600) : une étiquette ne cache jamais un site
    map.createPane("labels").style.zIndex = "550";
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>',
    }).addTo(map);

    for (const v of venues) {
      const m = L.marker([v.lat, v.lng], { icon: pin(v.cluster, false), title: v.name, alt: v.name, riseOnHover: true })
        .bindTooltip(v.shortName, { permanent: true, direction: "right", offset: [10, 0], className: "venue-label", pane: "labels" })
        .on("click", () => setSelected(v.id))
        .on("keypress", (e) => {
          if ((e as L.LeafletKeyboardEvent).originalEvent.key === "Enter") setSelected(v.id);
        })
        .addTo(map);
      markers.current.set(v.id, m);
    }
    map.on("click", () => setSelected(null));
    const labels = () => node.classList.toggle("show-labels", map.getZoom() >= LABEL_ZOOM);
    map.on("zoomend", labels);
    map.fitBounds(L.latLngBounds(venues.map((v) => [v.lat, v.lng])), { padding: [32, 32] });
    labels();
    mapRef.current = map;

    const all = markers.current;
    return () => {
      map.remove();
      all.clear();
      mapRef.current = null;
    };
  }, [venues]);

  // pastille du site choisi agrandie, et site gardé visible au-dessus du panneau du bas
  useEffect(() => {
    for (const v of venues) {
      const m = markers.current.get(v.id);
      m?.setIcon(pin(v.cluster, v.id === selected)).setZIndexOffset(v.id === selected ? 1000 : 0);
    }
    const m = selected ? markers.current.get(selected) : undefined;
    if (m && mapRef.current) {
      mapRef.current.panInside(m.getLatLng(), { paddingTopLeft: [24, 24], paddingBottomRight: [24, 200], animate: !reducedMotion() });
    }
  }, [selected, venues]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setSelected(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function zoomTo(f: Focus) {
    setFocus(f);
    setSelected(null);
    const list = f === "all" ? venues : venues.filter((v) => v.cluster === f);
    const map = mapRef.current;
    if (!map || list.length === 0) return;
    const bounds = L.latLngBounds(list.map((v) => [v.lat, v.lng]));
    const opts = { padding: [48, 48] as L.PointTuple, maxZoom: 15 };
    if (reducedMotion()) map.fitBounds(bounds, opts);
    else map.flyToBounds(bounds, { ...opts, duration: 0.6 });
  }

  const current = venues.find((v) => v.id === selected);
  const focusable: Focus[] = ["all", ...CLUSTERS.filter((c) => venues.some((v) => v.cluster === c))];

  return (
    <div>
      <div role="group" aria-label="Zoomer sur un secteur" className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 py-2">
        {focusable.map((f) => (
          <button
            key={f}
            type="button"
            aria-pressed={focus === f}
            onClick={() => zoomTo(f)}
            className={`pressable inline-flex min-h-11 shrink-0 items-center gap-1.5 border-2 border-line px-3.5 text-sm font-medium whitespace-nowrap ${
              focus === f ? "bg-ink text-page" : "bg-surface text-ink hover:bg-tint"
            }`}
          >
            {f !== "all" && <span className={`inline-block size-2.5 ring-1 ring-black ${CLUSTER_DOT[f]}`} aria-hidden="true" />}
            {f === "all" ? "Tous" : CLUSTER_LABEL[f]}
          </button>
        ))}
      </div>

      <div className="card relative mt-1 overflow-hidden">
        <div ref={el} className="sites-map h-[62dvh] min-h-80 w-full" aria-label="Carte des sites" />

        {current && (
          <div
            role="dialog"
            aria-label={current.name}
            className="rise absolute inset-x-2 bottom-2 z-[1000] border-2 border-line bg-surface p-4"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm">
                  <ClusterTag cluster={current.cluster} />
                </p>
                <p className="display mt-1 text-[1.75rem]">{current.name}</p>
                <p className="text-sm text-muted">
                  <RemainingCount ends={current.ends} total={current.total} />
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                aria-label="Fermer"
                className="-mt-2 -mr-2 flex size-11 shrink-0 items-center justify-center text-muted hover:bg-tint hover:text-ink"
              >
                <X aria-hidden="true" size={20} />
              </button>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Link
                href={`/sites/${current.id}`}
                className="btn min-h-11 px-4 text-sm"
              >
                Voir le site <ArrowRight aria-hidden="true" size={16} className="nudge" />
              </Link>
              <a
                href={current.routeUrl}
                target="_blank"
                rel="noopener"
                className="btn btn-ghost min-h-11 px-4 text-sm"
              >
                <Navigation aria-hidden="true" size={16} /> Itinéraire
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
