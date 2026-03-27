import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useActor } from "@/hooks/useActor";
import { Loader2, Lock, LogOut, Plus, Star, Trash2 } from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
import BlogManagementTab from "../components/BlogManagementTab";
import InquiriesTab from "../components/InquiriesTab";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

const ADMIN_EMAIL = "vikaskharb00007@gmail.com";
const ADMIN_PASS = "Miku03@love";

interface VisitorID {
  username: string;
  password: string;
  service: string;
  visitorName: string;
  createdAt: bigint;
  expiresAt: bigint;
}

interface Notice {
  id: string;
  title: string;
  message: string;
  createdAt: bigint;
  active: boolean;
}

const SERVICE_LABELS: Record<string, string> = {
  "astro-chart": "Astro Chart",
  numerology: "Numerology",
  horary: "Horary / Prashna",
};

function VisitorIDPanel({ actor }: { actor: any }) {
  const [ids, setIds] = useState<VisitorID[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    service: "astro-chart",
    visitorName: "",
    username: "",
    password: "",
    expiry: "30",
  });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  const loadIds = async () => {
    if (!actor) return;
    try {
      const result = await actor.visitorListIds(ADMIN_EMAIL, ADMIN_PASS);
      setIds(result);
    } catch {}
    setLoading(false);
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional
  useEffect(() => {
    loadIds();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actor) return;
    setCreating(true);
    setError("");
    try {
      await actor.visitorCreateId(
        ADMIN_EMAIL,
        ADMIN_PASS,
        form.service,
        form.visitorName,
        form.username,
        form.password,
        BigInt(form.expiry),
      );
      setForm({
        service: "astro-chart",
        visitorName: "",
        username: "",
        password: "",
        expiry: "30",
      });
      await loadIds();
    } catch (err: any) {
      setError(err?.message || "Failed to create visitor ID");
    }
    setCreating(false);
  };

  const handleDelete = async (username: string) => {
    if (!actor) return;
    try {
      await actor.visitorDeleteId(ADMIN_EMAIL, ADMIN_PASS, username);
      await loadIds();
    } catch {}
  };

  return (
    <div className="space-y-6">
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
        <h3 className="font-serif text-lg font-semibold text-amber-800 mb-4">
          Create Visitor ID
        </h3>
        <form
          onSubmit={handleCreate}
          className="grid grid-cols-1 sm:grid-cols-2 gap-3"
          data-ocid="visitorid.modal"
        >
          <div className="space-y-1">
            <Label className="text-xs font-medium text-gray-600">Service</Label>
            <select
              value={form.service}
              onChange={(e) =>
                setForm((p) => ({ ...p, service: e.target.value }))
              }
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-1 focus:ring-amber-400"
              data-ocid="visitorid.select"
            >
              <option value="astro-chart">Astro Chart</option>
              <option value="numerology">Numerology</option>
              <option value="horary">Horary / Prashna</option>
            </select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-medium text-gray-600">
              Visitor Name
            </Label>
            <Input
              value={form.visitorName}
              onChange={(e) =>
                setForm((p) => ({ ...p, visitorName: e.target.value }))
              }
              placeholder="Full name"
              required
              data-ocid="visitorid.input"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-medium text-gray-600">
              Username
            </Label>
            <Input
              value={form.username}
              onChange={(e) =>
                setForm((p) => ({ ...p, username: e.target.value }))
              }
              placeholder="Login username"
              required
              data-ocid="visitorid.input"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-medium text-gray-600">
              Password
            </Label>
            <Input
              type="password"
              value={form.password}
              onChange={(e) =>
                setForm((p) => ({ ...p, password: e.target.value }))
              }
              placeholder="Login password"
              required
              data-ocid="visitorid.input"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-medium text-gray-600">Expiry</Label>
            <select
              value={form.expiry}
              onChange={(e) =>
                setForm((p) => ({ ...p, expiry: e.target.value }))
              }
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-1 focus:ring-amber-400"
              data-ocid="visitorid.select"
            >
              <option value="30">1 Month</option>
              <option value="180">6 Months</option>
              <option value="365">1 Year</option>
            </select>
          </div>
          <div className="flex items-end">
            <Button
              type="submit"
              disabled={creating}
              className="w-full bg-amber-700 hover:bg-amber-800 text-white"
              data-ocid="visitorid.submit_button"
            >
              {creating ? (
                <Loader2 size={14} className="animate-spin mr-1" />
              ) : (
                <Plus size={14} className="mr-1" />
              )}
              Create ID
            </Button>
          </div>
          {error && (
            <div
              className="sm:col-span-2 text-sm text-red-600 bg-red-50 rounded-lg py-2 px-3"
              data-ocid="visitorid.error_state"
            >
              {error}
            </div>
          )}
        </form>
      </div>

      <div>
        <h3 className="font-serif text-lg font-semibold text-amber-800 mb-3">
          Active Visitor IDs
        </h3>
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2
              className="animate-spin text-amber-600"
              data-ocid="visitorid.loading_state"
            />
          </div>
        ) : ids.length === 0 ? (
          <div
            className="text-center py-8 text-gray-400"
            data-ocid="visitorid.empty_state"
          >
            No visitor IDs created yet
          </div>
        ) : (
          <div className="space-y-2">
            {ids.map((vid, idx) => (
              <div
                key={vid.username}
                className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg"
                data-ocid={`visitorid.item.${idx + 1}`}
              >
                <div className="min-w-0">
                  <div className="font-medium text-gray-800 text-sm">
                    {vid.visitorName}
                  </div>
                  <div className="text-xs text-gray-500">
                    @{vid.username} ·{" "}
                    {SERVICE_LABELS[vid.service] || vid.service}
                  </div>
                  <div className="text-xs text-gray-400">
                    Expires:{" "}
                    {new Date(
                      Number(vid.expiresAt) / 1_000_000,
                    ).toLocaleDateString()}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(vid.username)}
                  className="ml-3 text-red-400 hover:text-red-600 p-1 rounded"
                  data-ocid={`visitorid.delete_button.${idx + 1}`}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function NoticeBoardPanel({ actor }: { actor: any }) {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ title: "", message: "" });
  const [creating, setCreating] = useState(false);

  const loadNotices = async () => {
    if (!actor) return;
    try {
      const result = await actor.adminListNotices(ADMIN_EMAIL, ADMIN_PASS);
      setNotices(result);
    } catch {}
    setLoading(false);
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional
  useEffect(() => {
    loadNotices();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actor || !form.title.trim()) return;
    setCreating(true);
    try {
      await actor.adminCreateNotice(
        ADMIN_EMAIL,
        ADMIN_PASS,
        form.title,
        form.message,
      );
      setForm({ title: "", message: "" });
      await loadNotices();
    } catch {}
    setCreating(false);
  };

  const handleDelete = async (id: string) => {
    if (!actor) return;
    try {
      await actor.adminDeleteNotice(ADMIN_EMAIL, ADMIN_PASS, id);
      await loadNotices();
    } catch {}
  };

  const handleToggle = async (id: string) => {
    if (!actor) return;
    try {
      await actor.adminToggleNotice(ADMIN_EMAIL, ADMIN_PASS, id);
      await loadNotices();
    } catch {}
  };

  return (
    <div className="space-y-6">
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
        <h3 className="font-serif text-lg font-semibold text-amber-800 mb-4">
          Post Notice
        </h3>
        <form
          onSubmit={handleCreate}
          className="space-y-3"
          data-ocid="notice.modal"
        >
          <div className="space-y-1">
            <Label className="text-xs font-medium text-gray-600">Title</Label>
            <Input
              value={form.title}
              onChange={(e) =>
                setForm((p) => ({ ...p, title: e.target.value }))
              }
              placeholder="Notice title"
              required
              data-ocid="notice.input"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-medium text-gray-600">Message</Label>
            <textarea
              value={form.message}
              onChange={(e) =>
                setForm((p) => ({ ...p, message: e.target.value }))
              }
              placeholder="Notice message"
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-amber-400 resize-none"
              data-ocid="notice.textarea"
            />
          </div>
          <Button
            type="submit"
            disabled={creating}
            className="bg-amber-700 hover:bg-amber-800 text-white"
            data-ocid="notice.submit_button"
          >
            {creating ? (
              <Loader2 size={14} className="animate-spin mr-1" />
            ) : (
              <Plus size={14} className="mr-1" />
            )}
            Post Notice
          </Button>
        </form>
      </div>

      <div>
        <h3 className="font-serif text-lg font-semibold text-amber-800 mb-3">
          All Notices
        </h3>
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2
              className="animate-spin text-amber-600"
              data-ocid="notice.loading_state"
            />
          </div>
        ) : notices.length === 0 ? (
          <div
            className="text-center py-8 text-gray-400"
            data-ocid="notice.empty_state"
          >
            No notices yet
          </div>
        ) : (
          <div className="space-y-2">
            {notices.map((n, idx) => (
              <div
                key={n.id}
                className="flex items-start justify-between p-3 bg-white border border-gray-200 rounded-lg"
                data-ocid={`notice.item.${idx + 1}`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-800 text-sm">
                      {n.title}
                    </span>
                    <span
                      className={`text-xs px-1.5 py-0.5 rounded ${n.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}
                    >
                      {n.active ? "Active" : "Hidden"}
                    </span>
                  </div>
                  {n.message && (
                    <div className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                      {n.message}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 ml-3 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleToggle(n.id)}
                    className="text-xs text-amber-700 hover:text-amber-900 font-medium"
                    data-ocid={`notice.toggle.${idx + 1}`}
                  >
                    {n.active ? "Hide" : "Show"}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(n.id)}
                    className="text-red-400 hover:text-red-600 p-1 rounded"
                    data-ocid={`notice.delete_button.${idx + 1}`}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function InquiriesPanel({ actor }: { actor: any }) {
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { identity, login, isLoggingIn } = useInternetIdentity();
  const isAuthenticated = !!identity;

  useEffect(() => {
    if (!actor || !isAuthenticated) return;
    actor
      .getAllInquiries()
      .then((result: any[]) => setInquiries(result))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [actor, isAuthenticated]);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-serif text-lg font-semibold text-amber-800 mb-3">
          Visitor Inquiries
        </h3>
        {!isAuthenticated ? (
          <div className="text-center py-6 bg-amber-50 rounded-xl border border-amber-200">
            <p className="text-sm text-gray-600 mb-3">
              Login with Internet Identity to see inquiries
            </p>
            <Button
              onClick={login}
              disabled={isLoggingIn}
              className="bg-amber-700 hover:bg-amber-800 text-white"
              data-ocid="enquiries.primary_button"
            >
              {isLoggingIn ? (
                <Loader2 size={14} className="animate-spin mr-1" />
              ) : null}
              Login with Internet Identity
            </Button>
          </div>
        ) : loading ? (
          <div className="flex justify-center py-8">
            <Loader2
              className="animate-spin text-amber-600"
              data-ocid="enquiries.loading_state"
            />
          </div>
        ) : inquiries.length === 0 ? (
          <div
            className="text-center py-8 text-gray-400"
            data-ocid="enquiries.empty_state"
          >
            No inquiries yet
          </div>
        ) : (
          <div className="space-y-3">
            {inquiries.map((q, idx) => (
              <div
                key={q.id || String(q.submittedAt)}
                className="p-4 bg-white border border-gray-200 rounded-xl"
                data-ocid={`enquiries.item.${idx + 1}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-gray-800 text-sm">
                    {q.visitorName || q.name || "Visitor"}
                  </span>
                  <span className="text-xs text-gray-400">
                    {new Date(
                      Number(q.submittedAt) / 1_000_000,
                    ).toLocaleDateString()}
                  </span>
                </div>
                {q.question && (
                  <div className="text-sm text-gray-600">{q.question}</div>
                )}
                {q.dob && (
                  <div className="text-xs text-amber-700 mt-1">
                    DOB: {q.dob}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {isAuthenticated && (
        <div className="border-t border-gray-200 pt-6">
          <h3 className="font-serif text-lg font-semibold text-amber-800 mb-3">
            Booking Inquiries
          </h3>
          <InquiriesTab />
        </div>
      )}
    </div>
  );
}

export default function AdminPage() {
  const [loggedIn, setLoggedIn] = useState(
    () => !!sessionStorage.getItem("admin_auth"),
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const { actor } = useActor();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (email === ADMIN_EMAIL && password === ADMIN_PASS) {
      sessionStorage.setItem("admin_auth", "1");
      setLoggedIn(true);
      setLoginError("");
    } else {
      setLoginError("Invalid credentials");
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("admin_auth");
    setLoggedIn(false);
    setEmail("");
    setPassword("");
  };

  if (!loggedIn) {
    return (
      <div
        className="min-h-screen flex items-center justify-center px-4 py-12"
        style={{
          background:
            "linear-gradient(135deg, oklch(0.12 0.025 60) 0%, oklch(0.18 0.03 55) 100%)",
        }}
      >
        <div className="w-full max-w-sm">
          <div className="bg-white rounded-2xl border border-amber-300 shadow-2xl p-8">
            <div className="text-center mb-7">
              <div className="w-14 h-14 rounded-full bg-amber-100 border border-amber-300 flex items-center justify-center mx-auto mb-4">
                <Lock className="w-6 h-6 text-amber-700" />
              </div>
              <h1 className="font-serif text-2xl font-bold text-gray-800 mb-1">
                Admin Dashboard
              </h1>
              <p className="text-sm text-gray-500">
                Sign in to manage your site
              </p>
            </div>
            <form
              onSubmit={handleLogin}
              className="space-y-4"
              data-ocid="admin.modal"
            >
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-gray-700">
                  Email
                </Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@example.com"
                  required
                  data-ocid="admin.input"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-gray-700">
                  Password
                </Label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  required
                  data-ocid="admin.input"
                />
              </div>
              {loginError && (
                <div
                  className="text-sm text-red-600 bg-red-50 rounded-lg py-2 px-3 text-center"
                  data-ocid="admin.error_state"
                >
                  {loginError}
                </div>
              )}
              <Button
                type="submit"
                className="w-full bg-amber-700 hover:bg-amber-800 text-white font-semibold"
                data-ocid="admin.submit_button"
              >
                Sign In
              </Button>
            </form>
            <div className="mt-5 flex items-center justify-center gap-1.5 text-amber-400/60">
              <Star size={10} fill="currentColor" />
              <Star size={10} fill="currentColor" />
              <Star size={10} fill="currentColor" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen"
      style={{
        background:
          "linear-gradient(180deg, oklch(0.975 0.008 85) 0%, oklch(0.96 0.015 80) 100%)",
      }}
    >
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-serif text-2xl md:text-3xl font-bold text-amber-800">
              Admin Dashboard
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Astroplam-Desstiny by Viku Kharb
            </p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-red-600 transition-colors border border-gray-300 rounded-lg px-3 py-2"
            data-ocid="admin.secondary_button"
          >
            <LogOut size={14} />
            Logout
          </button>
        </div>

        <Tabs defaultValue="enquiries" className="w-full">
          <TabsList className="w-full bg-amber-100 border border-amber-200 mb-6">
            <TabsTrigger
              value="enquiries"
              className="flex-1 data-[state=active]:bg-amber-700 data-[state=active]:text-white"
              data-ocid="admin.tab"
            >
              Enquiries
            </TabsTrigger>
            <TabsTrigger
              value="content"
              className="flex-1 data-[state=active]:bg-amber-700 data-[state=active]:text-white"
              data-ocid="admin.tab"
            >
              Content
            </TabsTrigger>
            <TabsTrigger
              value="visitor-ids"
              className="flex-1 data-[state=active]:bg-amber-700 data-[state=active]:text-white"
              data-ocid="admin.tab"
            >
              Visitor IDs
            </TabsTrigger>
          </TabsList>

          <TabsContent value="enquiries">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <InquiriesPanel actor={actor} />
            </div>
          </TabsContent>

          <TabsContent value="content">
            <div className="space-y-6">
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                <NoticeBoardPanel actor={actor} />
              </div>
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                <h3 className="font-serif text-lg font-semibold text-amber-800 mb-4">
                  Blog Management
                </h3>
                <BlogManagementTab />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="visitor-ids">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <VisitorIDPanel actor={actor} />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
