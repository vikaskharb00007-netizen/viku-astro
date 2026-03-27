import VisitorGate from "@/components/VisitorGate";
import { Button } from "@/components/ui/button";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import VedicNumerologyApp from "../components/VedicNumerologyApp";

type Tier = 1 | 2 | 3;

const TIERS = [
  {
    id: 1 as Tier,
    icon: "🔢",
    title: "Normal",
    desc: "Basic numerology: Date of Birth number, Dasa cycle, Year number",
  },
  {
    id: 2 as Tier,
    icon: "📊",
    title: "Advanced",
    desc: "All Normal features + Nature number, Career guidance, Month & Day numbers, Download chart as PDF",
  },
  {
    id: 3 as Tier,
    icon: "✨",
    title: "Advanced+",
    desc: "Complete numerology suite with all features unlocked",
  },
];

function TierSelection({ onSelect }: { onSelect: (t: Tier) => void }) {
  const navigate = useNavigate();
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-12"
      style={{ background: "#111827" }}
    >
      <button
        type="button"
        data-ocid="numerology.back_button"
        onClick={() => navigate({ to: "/" })}
        className="self-start mb-6 text-sm text-gray-400 hover:text-amber-400 flex items-center gap-1 transition-colors"
      >
        ← Back
      </button>
      <h1
        className="font-serif text-3xl md:text-4xl font-bold mb-2 text-center"
        style={{ color: "#fbbf24" }}
      >
        Numerology
      </h1>
      <p className="text-gray-400 mb-8 text-center text-sm md:text-base">
        Select your service level to continue
      </p>
      <div className="grid gap-4 sm:grid-cols-3 w-full max-w-3xl">
        {TIERS.map((tier) => (
          <button
            key={tier.id}
            type="button"
            data-ocid={`numerology.tier_${tier.id}.button`}
            onClick={() => onSelect(tier.id)}
            className="rounded-2xl p-6 text-left transition-all duration-200 hover:scale-105 focus:outline-none border"
            style={{
              background: "#3d4a5c",
              borderColor: "#4a5568",
              color: "white",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = "#f59e0b";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = "#4a5568";
            }}
          >
            <div className="text-4xl mb-3">{tier.icon}</div>
            <div
              className="font-bold text-lg mb-2"
              style={{ color: "#fbbf24" }}
            >
              {tier.title}
            </div>
            <p className="text-sm leading-relaxed" style={{ color: "#cbd5e1" }}>
              {tier.desc}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}

export default function NumerologyPage() {
  const navigate = useNavigate();
  const [tier, setTier] = useState<Tier | null>(null);
  const handleClose = () => navigate({ to: "/" });

  return (
    <VisitorGate service="numerology">
      {tier === null ? (
        <TierSelection onSelect={setTier} />
      ) : (
        <div className="min-h-screen">
          <div className="flex justify-between items-center px-4 pt-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setTier(null)}
              data-ocid="numerology.back_button"
              className="text-xs rounded-full"
            >
              ← Change Level
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate({ to: "/horoscope" })}
              data-ocid="numerology.link"
              className="text-xs rounded-full border-green-600 text-green-700 hover:bg-green-50"
            >
              🔮 KP Horoscope
            </Button>
          </div>
          <VedicNumerologyApp
            onClose={handleClose}
            onGoToNadiCards={() => navigate({ to: "/nadi-cards" })}
            tier={tier}
          />
        </div>
      )}
    </VisitorGate>
  );
}
