import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Bell,
  ClipboardList,
  Loader2,
  MessageSquare,
  ShieldAlert,
  ToggleLeft,
  Trash2,
  X,
} from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useActor } from "../hooks/useActor";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useCheckAdmin,
  useGetAllInquiries,
  useGetVisitorQueries,
} from "../hooks/useQueries";
import BlogManagementTab from "./BlogManagementTab";
import InquiriesTab from "./InquiriesTab";

const ADMIN_EMAIL = "vikaskharb00007@gmail.com";
const ADMIN_PASSWORD = "Miku03@love";

interface AdminDashboardProps {
  onClose: () => void;
}

function InquiryNotificationPopup({
  count,
  onViewInquiries,
  onDismiss,
}: {
  count: number;
  onViewInquiries: () => void;
  onDismiss: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-gold/20 max-w-sm w-full p-6 text-center">
        <div className="w-14 h-14 rounded-full bg-gold/10 flex items-center justify-center mx-auto mb-4">
          <Bell size={28} className="text-gold-dark" />
        </div>
        <h2 className="font-serif text-xl font-semibold text-charcoal mb-1">
          {count > 0
            ? `You have ${count} ${count === 1 ? "inquiry" : "inquiries"}`
            : "No inquiries yet"}
        </h2>
        <p className="text-sm text-charcoal/55 mb-6">
          {count > 0
            ? "Visitor inquiries and booking requests are waiting in your dashboard."
            : "No visitor submissions yet. Check back later."}
        </p>
        <div className="flex flex-col sm:flex-row gap-2 justify-center">
          {count > 0 && (
            <button
              type="button"
              onClick={onViewInquiries}
              className="btn-gold flex items-center justify-center gap-2 text-sm px-5 py-2"
              data-ocid="admin.view_inquiries.button"
            >
              <ClipboardList size={15} />
              View Inquiries
            </button>
          )}
          <button
            type="button"
            onClick={onDismiss}
            className="btn-outline-gold text-sm px-5 py-2"
            data-ocid="admin.dismiss.button"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}

interface VisitorQuery {
  name: string;
  contactInfo: string;
  message: string;
  submittedAt?: string | bigint;
}

function QueriesTab({ queries }: { queries: VisitorQuery[] }) {
  if (queries.length === 0) {
    return (
      <div
        data-ocid="queries.empty_state"
        className="flex flex-col items-center justify-center py-16 text-center"
      >
        <MessageSquare size={40} className="text-gold/30 mx-auto mb-3" />
        <p className="font-serif text-lg text-charcoal/50">No queries yet</p>
        <p className="text-sm text-charcoal/35 mt-1">
          Visitor queries will appear here once submitted.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-charcoal/50">
        {queries.length} {queries.length === 1 ? "query" : "queries"} received
      </p>
      <div className="hidden md:block overflow-x-auto rounded-xl border border-gold/20">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gold/10 text-charcoal/70">
              <th className="text-left px-4 py-3 font-semibold">#</th>
              <th className="text-left px-4 py-3 font-semibold">Name</th>
              <th className="text-left px-4 py-3 font-semibold">
                Contact Info
              </th>
              <th className="text-left px-4 py-3 font-semibold">Message</th>
            </tr>
          </thead>
          <tbody>
            {queries.map((q, i) => (
              <tr
                key={`${q.name}-${q.contactInfo}-${i}`}
                data-ocid={`queries.row.${i + 1}`}
                className="border-t border-gold/10 hover:bg-gold/5 transition-colors"
              >
                <td className="px-4 py-3 text-charcoal/40 font-mono text-xs">
                  {i + 1}
                </td>
                <td className="px-4 py-3 font-medium text-charcoal">
                  {q.name}
                </td>
                <td className="px-4 py-3 text-charcoal/70">{q.contactInfo}</td>
                <td className="px-4 py-3 text-charcoal/60 max-w-xs truncate">
                  {q.message}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="md:hidden space-y-3">
        {queries.map((q, i) => (
          <div
            key={`${q.name}-${q.contactInfo}-${i}`}
            data-ocid={`queries.item.${i + 1}`}
            className="bg-white rounded-xl border border-gold/20 p-4 space-y-2"
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold text-charcoal">{q.name}</span>
              <span className="text-xs text-charcoal/40">#{i + 1}</span>
            </div>
            <p className="text-xs text-charcoal/60">{q.contactInfo}</p>
            <p className="text-sm text-charcoal/70 leading-relaxed">
              {q.message}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

interface VisitorID {
  service: string;
  expiresAt: bigint;
  username: string;
  password: string;
  createdAt: bigint;
  visitorName: string;
}

function VisitorIDsTab() {
  const { actor } = useActor();
  const [ids, setIds] = useState<VisitorID[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    service: "astro-chart",
    visitorName: "",
    username: "",
    password: "",
    expiry: "30",
  });

  const loadIds = async () => {
    if (!actor) return;
    setLoading(true);
    try {
      const list = await (actor as any).visitorListIds(
        ADMIN_EMAIL,
        ADMIN_PASSWORD,
      );
      setIds(list);
    } catch {
      toast.error("Failed to load visitor IDs");
    } finally {
      setLoading(false);
    }
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional
  useEffect(() => {
    loadIds();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actor]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actor) return;
    if (
      !form.visitorName.trim() ||
      !form.username.trim() ||
      !form.password.trim()
    ) {
      toast.error("Please fill all fields");
      return;
    }
    setCreating(true);
    try {
      await (actor as any).visitorCreateId(
        ADMIN_EMAIL,
        ADMIN_PASSWORD,
        form.service,
        form.visitorName.trim(),
        form.username.trim(),
        form.password.trim(),
        BigInt(form.expiry),
      );
      toast.success("Visitor ID created successfully");
      setForm({
        service: "astro-chart",
        visitorName: "",
        username: "",
        password: "",
        expiry: "30",
      });
      await loadIds();
    } catch (err: any) {
      const msg = err?.message || "Failed to create visitor ID";
      toast.error(msg);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (username: string) => {
    if (!actor) return;
    try {
      await (actor as any).visitorDeleteId(
        ADMIN_EMAIL,
        ADMIN_PASSWORD,
        username,
      );
      toast.success("Visitor ID deleted");
      setIds((prev) => prev.filter((id) => id.username !== username));
    } catch {
      toast.error("Failed to delete visitor ID");
    }
  };

  const formatExpiry = (ns: bigint) => {
    try {
      return new Date(Number(ns / 1_000_000n)).toLocaleDateString();
    } catch {
      return "Unknown";
    }
  };

  return (
    <div className="space-y-6">
      {/* Create Form */}
      <div className="bg-gold/5 rounded-xl border border-gold/20 p-5">
        <h3 className="font-serif text-lg font-semibold text-charcoal mb-4">
          Create Visitor ID
        </h3>
        <form
          onSubmit={handleCreate}
          className="grid gap-4 sm:grid-cols-2"
          data-ocid="visitor_ids.modal"
        >
          <div className="space-y-1.5">
            <Label className="text-sm text-charcoal/70">Service</Label>
            <Select
              value={form.service}
              onValueChange={(v) => setForm((p) => ({ ...p, service: v }))}
            >
              <SelectTrigger data-ocid="visitor_ids.select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="astro-chart">Astro Chart</SelectItem>
                <SelectItem value="numerology">Numerology</SelectItem>
                <SelectItem value="horary">Horary / Prashna</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm text-charcoal/70">Expiry</Label>
            <Select
              value={form.expiry}
              onValueChange={(v) => setForm((p) => ({ ...p, expiry: v }))}
            >
              <SelectTrigger data-ocid="visitor_ids.select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30">1 Month</SelectItem>
                <SelectItem value="180">6 Months</SelectItem>
                <SelectItem value="365">1 Year</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm text-charcoal/70">Visitor Name</Label>
            <Input
              data-ocid="visitor_ids.input"
              value={form.visitorName}
              onChange={(e) =>
                setForm((p) => ({ ...p, visitorName: e.target.value }))
              }
              placeholder="Full name"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm text-charcoal/70">Username</Label>
            <Input
              data-ocid="visitor_ids.input"
              value={form.username}
              onChange={(e) =>
                setForm((p) => ({ ...p, username: e.target.value }))
              }
              placeholder="Login username"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm text-charcoal/70">Password</Label>
            <Input
              data-ocid="visitor_ids.input"
              type="password"
              value={form.password}
              onChange={(e) =>
                setForm((p) => ({ ...p, password: e.target.value }))
              }
              placeholder="Login password"
            />
          </div>
          <div className="flex items-end">
            <Button
              type="submit"
              data-ocid="visitor_ids.submit_button"
              disabled={creating}
              className="w-full btn-gold"
            >
              {creating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Create ID"
              )}
            </Button>
          </div>
        </form>
      </div>

      {/* List */}
      <div>
        <h3 className="font-serif text-lg font-semibold text-charcoal mb-3">
          Active Visitor IDs
        </h3>
        {loading ? (
          <div
            data-ocid="visitor_ids.loading_state"
            className="flex justify-center py-8"
          >
            <Loader2 className="animate-spin text-gold" size={28} />
          </div>
        ) : ids.length === 0 ? (
          <div
            data-ocid="visitor_ids.empty_state"
            className="text-center py-8 text-charcoal/40"
          >
            No visitor IDs created yet.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-gold/20">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gold/10 text-charcoal/70">
                  <th className="text-left px-4 py-3 font-semibold">
                    Visitor Name
                  </th>
                  <th className="text-left px-4 py-3 font-semibold">
                    Username
                  </th>
                  <th className="text-left px-4 py-3 font-semibold">Service</th>
                  <th className="text-left px-4 py-3 font-semibold">Expires</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {ids.map((id, i) => (
                  <tr
                    key={id.username}
                    data-ocid={`visitor_ids.row.${i + 1}`}
                    className="border-t border-gold/10 hover:bg-gold/5"
                  >
                    <td className="px-4 py-3 font-medium text-charcoal">
                      {id.visitorName}
                    </td>
                    <td className="px-4 py-3 text-charcoal/70 font-mono">
                      {id.username}
                    </td>
                    <td className="px-4 py-3 text-charcoal/60 capitalize">
                      {id.service}
                    </td>
                    <td className="px-4 py-3 text-charcoal/60">
                      {formatExpiry(id.expiresAt)}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        data-ocid={`visitor_ids.delete_button.${i + 1}`}
                        onClick={() => handleDelete(id.username)}
                        className="text-red-500 hover:text-red-700 transition-colors"
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

interface Notice {
  id: string;
  title: string;
  active: boolean;
  createdAt: bigint;
  message: string;
}

function NoticeBoardTab() {
  const { actor } = useActor();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");

  const loadNotices = async () => {
    if (!actor) return;
    setLoading(true);
    try {
      const list = await (actor as any).noticeListAll(
        ADMIN_EMAIL,
        ADMIN_PASSWORD,
      );
      setNotices(list);
    } catch {
      toast.error("Failed to load notices");
    } finally {
      setLoading(false);
    }
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional
  useEffect(() => {
    loadNotices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actor]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actor || !title.trim() || !message.trim()) {
      toast.error("Please fill title and message");
      return;
    }
    setCreating(true);
    try {
      await (actor as any).noticeCreate(
        ADMIN_EMAIL,
        ADMIN_PASSWORD,
        title.trim(),
        message.trim(),
      );
      toast.success("Notice created");
      setTitle("");
      setMessage("");
      await loadNotices();
    } catch {
      toast.error("Failed to create notice");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!actor) return;
    try {
      await (actor as any).noticeDelete(ADMIN_EMAIL, ADMIN_PASSWORD, id);
      toast.success("Notice deleted");
      setNotices((prev) => prev.filter((n) => n.id !== id));
    } catch {
      toast.error("Failed to delete notice");
    }
  };

  const handleToggle = async (id: string) => {
    if (!actor) return;
    try {
      await (actor as any).noticeToggleActive(ADMIN_EMAIL, ADMIN_PASSWORD, id);
      setNotices((prev) =>
        prev.map((n) => (n.id === id ? { ...n, active: !n.active } : n)),
      );
    } catch {
      toast.error("Failed to toggle notice");
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-gold/5 rounded-xl border border-gold/20 p-5">
        <h3 className="font-serif text-lg font-semibold text-charcoal mb-4">
          Post Notice
        </h3>
        <form
          onSubmit={handleCreate}
          className="space-y-3"
          data-ocid="notice_board.modal"
        >
          <div className="space-y-1.5">
            <Label className="text-sm text-charcoal/70">Title</Label>
            <Input
              data-ocid="notice_board.input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Notice title"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm text-charcoal/70">Message</Label>
            <Textarea
              data-ocid="notice_board.textarea"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Notice message"
              rows={3}
            />
          </div>
          <Button
            type="submit"
            data-ocid="notice_board.submit_button"
            disabled={creating}
            className="btn-gold"
          >
            {creating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              "Post Notice"
            )}
          </Button>
        </form>
      </div>

      <div>
        <h3 className="font-serif text-lg font-semibold text-charcoal mb-3">
          All Notices
        </h3>
        {loading ? (
          <div
            data-ocid="notice_board.loading_state"
            className="flex justify-center py-8"
          >
            <Loader2 className="animate-spin text-gold" size={28} />
          </div>
        ) : notices.length === 0 ? (
          <div
            data-ocid="notice_board.empty_state"
            className="text-center py-8 text-charcoal/40"
          >
            No notices yet.
          </div>
        ) : (
          <div className="space-y-3">
            {notices.map((n, i) => (
              <div
                key={n.id}
                data-ocid={`notice_board.item.${i + 1}`}
                className="bg-white rounded-xl border border-gold/20 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-charcoal">
                        {n.title}
                      </span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          n.active
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {n.active ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <p className="text-sm text-charcoal/70">{n.message}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      data-ocid={`notice_board.toggle.${i + 1}`}
                      onClick={() => handleToggle(n.id)}
                      title={n.active ? "Deactivate" : "Activate"}
                      className="text-amber-500 hover:text-amber-700 transition-colors"
                    >
                      <ToggleLeft size={18} />
                    </button>
                    <button
                      type="button"
                      data-ocid={`notice_board.delete_button.${i + 1}`}
                      onClick={() => handleDelete(n.id)}
                      className="text-red-500 hover:text-red-700 transition-colors"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminDashboard({ onClose }: AdminDashboardProps) {
  const { identity } = useInternetIdentity();
  const { data: isAdmin, isLoading } = useCheckAdmin();
  const { data: inquiries } = useGetAllInquiries();
  const { data: visitorQueries } = useGetVisitorQueries();
  const [activeTab, setActiveTab] = useState("inquiries");
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    if (isAdmin && inquiries !== undefined) {
      setShowPopup(true);
    }
  }, [isAdmin, inquiries]);

  if (!identity) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream-bg pt-20">
        <div className="text-center">
          <ShieldAlert size={48} className="text-gold/40 mx-auto mb-4" />
          <p className="font-serif text-xl text-charcoal/60">
            Please log in to access the dashboard
          </p>
          <button
            type="button"
            onClick={onClose}
            className="mt-4 btn-outline-gold text-sm"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream-bg pt-20">
        <Loader2 size={32} className="animate-spin text-gold/60" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream-bg pt-20">
        <div className="text-center">
          <ShieldAlert size={48} className="text-destructive/40 mx-auto mb-4" />
          <p className="font-serif text-xl text-charcoal/60">Access Denied</p>
          <p className="text-sm text-charcoal/40 mt-1">
            You do not have admin privileges.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="mt-4 btn-outline-gold text-sm"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const inquiryCount = inquiries?.length ?? 0;
  const queryCount = (visitorQueries as any[])?.length ?? 0;

  return (
    <div className="min-h-screen bg-cream-bg pt-20">
      {showPopup && (
        <InquiryNotificationPopup
          count={inquiryCount}
          onViewInquiries={() => {
            setActiveTab("inquiries");
            setShowPopup(false);
          }}
          onDismiss={() => setShowPopup(false)}
        />
      )}

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-serif text-3xl font-semibold text-charcoal">
              Admin Dashboard
            </h1>
            <p className="text-sm text-charcoal/50 mt-1">
              Manage inquiries, blog posts, visitor IDs, and notices
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-2 btn-outline-gold text-sm"
            data-ocid="admin.close.button"
          >
            <X size={14} />
            Close Dashboard
          </button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-gold/10 border border-gold/20 mb-6 flex-wrap h-auto gap-1">
            <TabsTrigger
              value="inquiries"
              className="data-[state=active]:bg-gold data-[state=active]:text-white"
              data-ocid="admin.inquiries.tab"
            >
              Inquiries
              {inquiryCount > 0 && (
                <span className="ml-1.5 bg-gold text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">
                  {inquiryCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="blog"
              className="data-[state=active]:bg-gold data-[state=active]:text-white"
              data-ocid="admin.blog.tab"
            >
              Blog Management
            </TabsTrigger>
            <TabsTrigger
              value="queries"
              className="data-[state=active]:bg-gold data-[state=active]:text-white"
              data-ocid="admin.queries.tab"
            >
              Queries
              {queryCount > 0 && (
                <span className="ml-1.5 bg-gold text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">
                  {queryCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="visitor-ids"
              className="data-[state=active]:bg-gold data-[state=active]:text-white"
              data-ocid="admin.visitor_ids.tab"
            >
              Visitor IDs
            </TabsTrigger>
            <TabsTrigger
              value="notice-board"
              className="data-[state=active]:bg-gold data-[state=active]:text-white"
              data-ocid="admin.notice_board.tab"
            >
              Notice Board
            </TabsTrigger>
          </TabsList>

          <TabsContent value="inquiries">
            <InquiriesTab />
          </TabsContent>
          <TabsContent value="blog">
            <BlogManagementTab />
          </TabsContent>
          <TabsContent value="queries">
            <QueriesTab queries={(visitorQueries as any[]) ?? []} />
          </TabsContent>
          <TabsContent value="visitor-ids">
            <VisitorIDsTab />
          </TabsContent>
          <TabsContent value="notice-board">
            <NoticeBoardTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
