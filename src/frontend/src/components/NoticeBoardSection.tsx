import { useActor } from "@/hooks/useActor";
import { Bell } from "lucide-react";
import { useEffect, useState } from "react";

interface Notice {
  id: string;
  title: string;
  active: boolean;
  createdAt: bigint;
  message: string;
}

export default function NoticeBoardSection() {
  const { actor } = useActor();
  const [notices, setNotices] = useState<Notice[]>([]);

  useEffect(() => {
    if (!actor) return;
    (actor as any)
      .noticeList()
      .then((list: Notice[]) => {
        setNotices(list.filter((n) => n.active));
      })
      .catch(() => {});
  }, [actor]);

  if (notices.length === 0) return null;

  return (
    <section className="py-8 px-4" style={{ background: "#1a1f2e" }}>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-5">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: "#f59e0b22" }}
          >
            <Bell className="w-5 h-5" style={{ color: "#f59e0b" }} />
          </div>
          <h2
            className="font-serif text-2xl font-bold"
            style={{ color: "#f59e0b" }}
          >
            Notice Board
          </h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {notices.map((notice) => (
            <div
              key={notice.id}
              className="rounded-xl p-4 border"
              style={{
                background: "#2a3040",
                borderColor: "#f59e0b33",
              }}
            >
              <h3
                className="font-semibold text-base mb-1"
                style={{ color: "#fbbf24" }}
              >
                {notice.title}
              </h3>
              <p
                className="text-sm leading-relaxed"
                style={{ color: "#cbd5e1" }}
              >
                {notice.message}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
