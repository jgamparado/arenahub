import { Dumbbell, Trophy, Waves } from "lucide-react";
import type { SportType } from "../lib/types";

export function SportIcon({ sport, className }: { sport: SportType; className?: string }) {
  if (sport === "beach_tennis") return <Trophy className={className} />;
  if (sport === "futevolei") return <Dumbbell className={className} />;
  return <Waves className={className} />;
}
