import { Badge } from "@/components/ui/badge";
import { Edit2, Eye, EyeOff, Loader2, Plus, Trash2 } from "lucide-react";
import React, { useState } from "react";
import { toast } from "sonner";
import type { BlogPost } from "../backend";
import {
  useDeletePost,
  useGetAllPostsAdmin,
  usePublishPost,
} from "../hooks/useQueries";
import BlogPostEditor from "./BlogPostEditor";

export default function BlogManagementTab() {
  const { data: posts, isLoading } = useGetAllPostsAdmin();
  const deleteMutation = useDeletePost();
  const publishMutation = usePublishPost();
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [showEditor, setShowEditor] = useState(false);

  const formatDate = (time: bigint) => {
    const ms = Number(time / BigInt(1_000_000));
    return new Date(ms).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleDelete = async (post: BlogPost) => {
    if (!confirm(`Delete "${post.title}"?`)) return;
    try {
      await deleteMutation.mutateAsync(post.id);
      toast.success("Post deleted");
    } catch {
      toast.error("Failed to delete post");
    }
  };

  const handleTogglePublish = async (post: BlogPost) => {
    try {
      await publishMutation.mutateAsync(post.id);
      toast.success(post.published ? "Post updated" : "Post published");
    } catch {
      toast.error("Failed to update post");
    }
  };

  const handleEdit = (post: BlogPost) => {
    setEditingPost(post);
    setShowEditor(true);
  };
  const handleCloseEditor = () => {
    setShowEditor(false);
    setEditingPost(null);
  };

  if (isLoading)
    return (
      <div className="flex justify-center py-16">
        <Loader2 size={32} className="animate-spin text-gold/60" />
      </div>
    );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-charcoal/50">
          {posts?.length || 0} total posts
        </p>
        <button
          type="button"
          onClick={() => {
            setEditingPost(null);
            setShowEditor(true);
          }}
          className="btn-gold flex items-center gap-2 text-sm"
          data-ocid="blog_mgmt.primary_button"
        >
          <Plus size={14} />
          New Post
        </button>
      </div>

      {showEditor && (
        <BlogPostEditor post={editingPost} onClose={handleCloseEditor} />
      )}

      {!posts || posts.length === 0 ? (
        <div className="text-center py-16" data-ocid="blog_mgmt.empty_state">
          <p className="font-serif text-xl text-charcoal/40">No posts yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((post, i) => (
            <div
              key={post.id.toString()}
              className="rounded-xl border border-gold/20 bg-white/60 p-4 flex items-start gap-4"
              data-ocid={`blog_mgmt.item.${i + 1}`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-serif font-semibold text-charcoal truncate">
                    {post.title}
                  </h3>
                  <Badge
                    variant={post.published ? "default" : "secondary"}
                    className={`text-xs shrink-0 ${
                      post.published
                        ? "bg-sage/20 text-sage-dark border-sage/30"
                        : "bg-charcoal/10 text-charcoal/50"
                    }`}
                  >
                    {post.published ? "Published" : "Draft"}
                  </Badge>
                </div>
                <p className="text-xs text-charcoal/50">
                  By {post.author} &middot; {formatDate(post.createdAt)}
                </p>
                <p className="text-sm text-charcoal/60 mt-1 line-clamp-2">
                  {post.content}
                </p>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => handleEdit(post)}
                  className="p-2 text-charcoal/50 hover:text-gold-dark hover:bg-gold/10 rounded-lg transition-colors"
                  data-ocid={`blog_mgmt.edit_button.${i + 1}`}
                >
                  <Edit2 size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => handleTogglePublish(post)}
                  disabled={publishMutation.isPending}
                  className="p-2 text-charcoal/50 hover:text-sage-dark hover:bg-sage/10 rounded-lg transition-colors"
                >
                  {publishMutation.isPending ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : post.published ? (
                    <EyeOff size={14} />
                  ) : (
                    <Eye size={14} />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(post)}
                  disabled={deleteMutation.isPending}
                  className="p-2 text-charcoal/50 hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                  data-ocid={`blog_mgmt.delete_button.${i + 1}`}
                >
                  {deleteMutation.isPending ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Trash2 size={14} />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
