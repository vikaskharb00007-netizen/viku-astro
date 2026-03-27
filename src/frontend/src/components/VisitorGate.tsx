import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useActor } from "@/hooks/useActor";
import { Lock, Star } from "lucide-react";
import { useState } from "react";

interface VisitorGateProps {
  service: "astro-chart" | "numerology" | "horary";
  children: React.ReactNode;
}

const SERVICE_LABELS: Record<string, string> = {
  "astro-chart": "Astro Chart",
  numerology: "Numerology",
  horary: "Horary / Prashna",
};

export default function VisitorGate({ service, children }: VisitorGateProps) {
  const storageKey = `visitor_access_${service}`;
  const [granted, setGranted] = useState(
    () => !!sessionStorage.getItem(storageKey),
  );
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const { actor } = useActor();

  if (granted) {
    return <>{children}</>;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) return;
    if (!actor) {
      setError("Not connected. Please try again.");
      return;
    }
    setIsChecking(true);
    setError("");
    try {
      const valid = await actor.visitorValidateId(
        service,
        username.trim(),
        password.trim(),
      );
      if (valid) {
        sessionStorage.setItem(storageKey, username.trim());
        setGranted(true);
      } else {
        setError("Invalid credentials or ID has expired.");
      }
    } catch {
      setError("Connection error. Please try again.");
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-12"
      style={{
        background:
          "linear-gradient(135deg, oklch(0.975 0.008 85) 0%, oklch(0.96 0.015 80) 40%, oklch(0.93 0.018 280) 100%)",
      }}
    >
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl border border-amber-200 shadow-lg p-8">
          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto mb-4">
              <Lock className="w-6 h-6 text-amber-600" />
            </div>
            <h2 className="font-serif text-2xl md:text-3xl font-bold text-gray-800 mb-2">
              {SERVICE_LABELS[service]}
            </h2>
            <p className="text-sm md:text-base text-gray-500">
              Enter Your Visitor Credentials
            </p>
            <p className="text-xs text-gray-400 mt-1">
              This service requires a visitor ID provided by the admin.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="space-y-4"
            data-ocid="gate.modal"
          >
            <div className="space-y-1.5">
              <Label
                htmlFor="visitor-username"
                className="text-sm font-medium text-gray-700"
              >
                Username
              </Label>
              <Input
                id="visitor-username"
                data-ocid="gate.input"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                autoComplete="username"
              />
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="visitor-password"
                className="text-sm font-medium text-gray-700"
              >
                Password
              </Label>
              <Input
                id="visitor-password"
                data-ocid="gate.input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                autoComplete="current-password"
              />
            </div>

            {error && (
              <div
                data-ocid="gate.error_state"
                className="text-sm text-red-600 text-center bg-red-50 rounded-lg py-2 px-3"
              >
                {error}
              </div>
            )}

            <Button
              type="submit"
              data-ocid="gate.submit_button"
              disabled={isChecking || !username.trim() || !password.trim()}
              className="w-full font-semibold"
              style={{ background: "#2E8B57", color: "white" }}
            >
              {isChecking ? "Verifying..." : "Access Service"}
            </Button>

            <div className="mt-4 text-center text-xs text-gray-500 border-t border-gray-100 pt-3">
              <p className="font-medium text-gray-600 mb-1">
                Don&apos;t have credentials?
              </p>
              <p>Contact: vikaskharb00007@gmail.com</p>
              <p>WhatsApp: 8607985144 (Mon–Fri, 10am–4pm)</p>
            </div>
          </form>

          <div className="mt-4 flex items-center justify-center gap-1.5 text-amber-600/60">
            <Star size={10} fill="currentColor" />
            <Star size={10} fill="currentColor" />
            <Star size={10} fill="currentColor" />
          </div>
        </div>
      </div>
    </div>
  );
}
