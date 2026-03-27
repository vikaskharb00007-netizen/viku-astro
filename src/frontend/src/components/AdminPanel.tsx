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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, Loader2, Plus, Trash2, Users } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  useCreateUser,
  useDeleteUser,
  useListUsers,
} from "../hooks/useVedicQueries";

interface AdminPanelProps {
  onBack: () => void;
}

export function AdminPanel({ onBack }: AdminPanelProps) {
  const { data: users = [], isLoading } = useListUsers();
  const createUser = useCreateUser();
  const deleteUser = useDeleteUser();

  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newLevel, setNewLevel] = useState("2");

  async function handleCreate() {
    if (!newUsername.trim() || !newPassword.trim()) {
      toast.error("Username and password are required.");
      return;
    }
    try {
      await createUser.mutateAsync({
        username: newUsername.trim(),
        password: newPassword.trim(),
        sectionLevel: Number(newLevel),
      });
      toast.success(`User "${newUsername.trim()}" created.`);
      setNewUsername("");
      setNewPassword("");
      setNewLevel("2");
    } catch {
      toast.error("Failed to create user.");
    }
  }

  async function handleDelete(username: string) {
    try {
      await deleteUser.mutateAsync(username);
      toast.success(`User "${username}" deleted.`);
    } catch {
      toast.error("Failed to delete user.");
    }
  }

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "oklch(var(--background))" }}
    >
      {/* Header */}
      <header
        className="px-4 py-4 flex items-center gap-4"
        style={{
          background: "oklch(var(--card))",
          borderBottom: "1px solid oklch(var(--border))",
        }}
      >
        <Button
          variant="ghost"
          data-ocid="admin.secondary_button"
          onClick={onBack}
          className="font-body gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to App
        </Button>
        <div className="flex items-center gap-2">
          <Users
            className="w-5 h-5"
            style={{ color: "oklch(var(--primary))" }}
          />
          <h1
            className="font-display text-xl font-bold"
            style={{ color: "oklch(var(--primary))" }}
          >
            Admin Panel
          </h1>
        </div>
      </header>

      <main className="flex-1 max-w-2xl mx-auto w-full p-4 space-y-6">
        {/* Create User Form */}
        <div
          className="rounded-lg p-5"
          style={{
            background: "oklch(var(--card))",
            border: "1px solid oklch(var(--border))",
          }}
        >
          <h2
            className="font-display text-base font-semibold mb-4"
            style={{ color: "oklch(var(--primary))" }}
          >
            Create New User
          </h2>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label
                className="text-xs uppercase tracking-wider font-body"
                style={{ color: "oklch(var(--muted-foreground))" }}
              >
                Username
              </Label>
              <Input
                data-ocid="admin.create_user.input"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                placeholder="e.g. rahul123"
                className="font-body"
                style={{
                  background: "oklch(var(--input))",
                  borderColor: "oklch(var(--border))",
                }}
              />
            </div>
            <div className="space-y-1.5">
              <Label
                className="text-xs uppercase tracking-wider font-body"
                style={{ color: "oklch(var(--muted-foreground))" }}
              >
                Password
              </Label>
              <Input
                data-ocid="admin.create_password.input"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Set a password"
                className="font-body"
                style={{
                  background: "oklch(var(--input))",
                  borderColor: "oklch(var(--border))",
                }}
              />
            </div>
            <div className="space-y-1.5">
              <Label
                className="text-xs uppercase tracking-wider font-body"
                style={{ color: "oklch(var(--muted-foreground))" }}
              >
                Section Access
              </Label>
              <Select value={newLevel} onValueChange={setNewLevel}>
                <SelectTrigger
                  data-ocid="admin.section_level.select"
                  className="font-body"
                  style={{
                    background: "oklch(var(--input))",
                    borderColor: "oklch(var(--border))",
                  }}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2">
                    Paid — Month &amp; Day Charts
                  </SelectItem>
                  <SelectItem value="3">
                    Advanced — All Sections + Predictions
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              data-ocid="admin.create_user.submit_button"
              onClick={handleCreate}
              disabled={createUser.isPending}
              className="w-full font-body font-semibold gap-2"
              style={{
                background: "oklch(var(--primary))",
                color: "oklch(var(--primary-foreground))",
              }}
            >
              {createUser.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              Create User
            </Button>
          </div>
        </div>

        {/* Users Table */}
        <div
          className="rounded-lg overflow-hidden"
          style={{
            background: "oklch(var(--card))",
            border: "1px solid oklch(var(--border))",
          }}
        >
          <div
            className="px-5 py-3"
            style={{ borderBottom: "1px solid oklch(var(--border))" }}
          >
            <h2
              className="font-display text-base font-semibold"
              style={{ color: "oklch(var(--primary))" }}
            >
              Users ({users.length})
            </h2>
          </div>

          {isLoading ? (
            <div
              data-ocid="admin.users.loading_state"
              className="py-8 text-center font-body text-sm"
              style={{ color: "oklch(var(--muted-foreground))" }}
            >
              <Loader2
                className="w-5 h-5 animate-spin mx-auto mb-2"
                style={{ color: "oklch(var(--primary))" }}
              />
              Loading users...
            </div>
          ) : users.length === 0 ? (
            <div
              data-ocid="admin.users.empty_state"
              className="py-8 text-center font-body text-sm"
              style={{ color: "oklch(var(--muted-foreground))" }}
            >
              No users yet. Create one above.
            </div>
          ) : (
            <Table data-ocid="admin.users.table">
              <TableHeader>
                <TableRow>
                  <TableHead className="font-body font-semibold">
                    Username
                  </TableHead>
                  <TableHead className="font-body font-semibold">
                    Section
                  </TableHead>
                  <TableHead className="font-body font-semibold w-16">
                    Action
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user, idx) => (
                  <TableRow
                    key={user.username}
                    data-ocid={`admin.users.row.${idx + 1}`}
                  >
                    <TableCell className="font-body font-medium">
                      {user.username}
                    </TableCell>
                    <TableCell>
                      <span
                        className="font-body text-xs px-2 py-0.5 rounded-full"
                        style={{
                          background:
                            Number(user.sectionLevel) === 3
                              ? "oklch(0.62 0.16 158 / 0.15)"
                              : "oklch(var(--primary) / 0.1)",
                          color:
                            Number(user.sectionLevel) === 3
                              ? "oklch(0.40 0.18 158)"
                              : "oklch(var(--primary))",
                        }}
                      >
                        {Number(user.sectionLevel) === 3 ? "Advanced" : "Paid"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <button
                        type="button"
                        data-ocid={`admin.users.delete_button.${idx + 1}`}
                        onClick={() => handleDelete(user.username)}
                        disabled={deleteUser.isPending}
                        className="p-1.5 rounded-md transition-colors"
                        style={{ color: "oklch(var(--muted-foreground))" }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.color =
                            "oklch(var(--destructive))";
                          (
                            e.currentTarget as HTMLButtonElement
                          ).style.background =
                            "oklch(var(--destructive) / 0.1)";
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.color =
                            "oklch(var(--muted-foreground))";
                          (
                            e.currentTarget as HTMLButtonElement
                          ).style.background = "transparent";
                        }}
                        aria-label={`Delete ${user.username}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </main>
    </div>
  );
}
