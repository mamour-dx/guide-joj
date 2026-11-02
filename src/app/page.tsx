import Link from "next/link";
import { TodayView } from "@/components/TodayView";
import { days, sportChips } from "@/lib/data";

export default function TodayPage() {
  return (
    <>
      <TodayView days={days} sports={sportChips} />
      <noscript>
        <p className="mt-4 rounded-xl bg-surface p-4">
          Sans JavaScript, la page « Aujourd&apos;hui » ne peut pas connaître l&apos;heure.{" "}
          <Link href="/programme" className="font-bold underline">Voir le programme complet</Link>
        </p>
      </noscript>
    </>
  );
}
