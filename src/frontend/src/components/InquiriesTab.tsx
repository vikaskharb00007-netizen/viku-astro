import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Download,
  Eye,
  Hash,
  Image as ImageIcon,
  Images,
  Loader2,
  Mail,
  MapPin,
  RotateCcw,
  Trash2,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import type React from "react";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import type { Inquiry } from "../backend";
import type { ExternalBlob } from "../backend";
import { useDeleteInquiry, useGetAllInquiries } from "../hooks/useQueries";

function parseEmailFromQuestion(question: string): {
  email: string;
  cleanQuestion: string;
} {
  const match = question.match(/^\[EMAIL:([^\]]+)\]\n?/);
  if (match)
    return {
      email: match[1],
      cleanQuestion: question.replace(/^\[EMAIL:[^\]]+\]\n?/, ""),
    };
  const oldMatch = question.match(/^Email:\s*([^\n]+)\n\nQuery:\s*/);
  if (oldMatch)
    return {
      email: oldMatch[1].trim(),
      cleanQuestion: question.replace(/^Email:\s*[^\n]+\n\nQuery:\s*/, ""),
    };
  return { email: "", cleanQuestion: question };
}

const serviceNames: Record<number, string> = {
  1: "One Question",
  2: "Matchmaking",
  3: "Muhurat",
  4: "Professional Advice",
  5: "Phone Consultation",
  6: "Gemstone Consult",
  7: "Video Prediction",
  8: "Written Prediction",
};

const SPECIAL_SERVICE_IDS = new Set([7, 8]);

function ZoomableImageModal({
  url,
  alt,
  onClose,
  children,
}: {
  url: string;
  alt: string;
  onClose: () => void;
  children?: React.ReactNode;
}) {
  const [zoom, setZoom] = useState(1);
  const ZOOM_STEP = 0.25;

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.stopPropagation();
    if (e.deltaY < 0) setZoom((z) => Math.min(z + ZOOM_STEP, 4));
    else setZoom((z) => Math.max(z - ZOOM_STEP, 0.5));
  }, []);

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = `${alt.replace(/\s+/g, "_")}.${blob.type.split("/")[1] || "jpg"}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(objectUrl);
    } catch {
      window.open(url, "_blank");
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 flex flex-col items-center justify-center p-4"
      onClick={onClose}
      onKeyDown={(e) => {
        if (e.key === "Escape") onClose();
      }}
    >
      <div
        className="relative z-10 flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-3 shadow-lg"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setZoom((z) => Math.max(z - ZOOM_STEP, 0.5));
          }}
          className="p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
        >
          <ZoomOut size={16} />
        </button>
        <span className="text-white text-xs font-medium min-w-[40px] text-center">
          {Math.round(zoom * 100)}%
        </span>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setZoom((z) => Math.min(z + ZOOM_STEP, 4));
          }}
          className="p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
        >
          <ZoomIn size={16} />
        </button>
        <div className="w-px h-5 bg-white/20 mx-1" />
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setZoom(1);
          }}
          className="p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
        >
          <RotateCcw size={16} />
        </button>
        <div className="w-px h-5 bg-white/20 mx-1" />
        <button
          type="button"
          onClick={handleDownload}
          className="p-1.5 rounded-full bg-gold/80 hover:bg-gold text-white transition-colors"
        >
          <Download size={16} />
        </button>
        <div className="w-px h-5 bg-white/20 mx-1" />
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="p-1.5 rounded-full bg-white/20 hover:bg-red-500/80 text-white transition-colors"
        >
          <X size={16} />
        </button>
      </div>
      <div
        className="overflow-auto max-h-[75vh] max-w-[90vw] flex items-center justify-center cursor-move"
        onWheel={handleWheel}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <img
          src={url}
          alt={alt}
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: "center center",
            transition: "transform 0.15s ease",
            display: "block",
            maxWidth: zoom <= 1 ? "100%" : "none",
          }}
          className="rounded-xl shadow-2xl select-none"
          draggable={false}
        />
      </div>
      {children}
      <p className="text-white/40 text-xs mt-3">
        Scroll to zoom · Click outside to close
      </p>
    </div>
  );
}

function HandPicturePreview({ inquiry }: { inquiry: Inquiry }) {
  const [showFull, setShowFull] = useState(false);
  if (!inquiry.handPicture)
    return <span className="text-xs text-charcoal/30 italic">No image</span>;
  const url = inquiry.handPicture.getDirectURL();
  return (
    <>
      <button
        type="button"
        onClick={() => setShowFull(true)}
        className="flex items-center gap-1 text-xs text-gold-dark hover:text-gold transition-colors"
      >
        <ImageIcon size={12} />
        View Image
      </button>
      {showFull && (
        <ZoomableImageModal
          url={url}
          alt={`${inquiry.visitorName}_hand_picture`}
          onClose={() => setShowFull(false)}
        />
      )}
    </>
  );
}

function PalmPhotosPreview({
  photos,
  visitorName,
}: { photos: Array<ExternalBlob | null>; visitorName?: string }) {
  const [fullViewIndex, setFullViewIndex] = useState<number | null>(null);
  const validPhotos = photos.filter((p): p is ExternalBlob => p !== null);
  if (validPhotos.length === 0)
    return <span className="text-xs text-charcoal/30 italic">No photos</span>;
  return (
    <>
      <div className="flex flex-wrap gap-1.5">
        {validPhotos.map((photo, idx) => (
          <button
            key={photo.getDirectURL()}
            type="button"
            onClick={() => setFullViewIndex(idx)}
            className="relative group"
          >
            <img
              src={photo.getDirectURL()}
              alt={`Palm ${idx + 1}`}
              className="w-10 h-10 object-cover rounded-md border border-gold/20 hover:border-gold/60 transition-colors"
            />
          </button>
        ))}
      </div>
      {fullViewIndex !== null && (
        <ZoomableImageModal
          url={validPhotos[fullViewIndex].getDirectURL()}
          alt={`${visitorName || "palm"}_palm_photo_${fullViewIndex + 1}`}
          onClose={() => setFullViewIndex(null)}
        >
          {validPhotos.length > 1 && (
            <div className="flex items-center gap-3 mt-2">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setFullViewIndex((i) =>
                    i !== null && i > 0 ? i - 1 : validPhotos.length - 1,
                  );
                }}
                className="bg-white/20 hover:bg-white/30 rounded-full px-4 py-1.5 text-white text-sm transition-colors"
              >
                ‹ Prev
              </button>
              <span className="text-white/60 text-xs">
                {fullViewIndex + 1} / {validPhotos.length}
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setFullViewIndex((i) =>
                    i !== null ? (i + 1) % validPhotos.length : 0,
                  );
                }}
                className="bg-white/20 hover:bg-white/30 rounded-full px-4 py-1.5 text-white text-sm transition-colors"
              >
                Next ›
              </button>
            </div>
          )}
        </ZoomableImageModal>
      )}
    </>
  );
}

function PlaceOfBirthDisplay({ inquiry }: { inquiry: Inquiry }) {
  const parts = [inquiry.city, inquiry.state, inquiry.birthCountry].filter(
    Boolean,
  );
  if (parts.length === 0)
    return <span className="text-xs text-charcoal/30 italic">—</span>;
  return <span className="text-xs text-charcoal/70">{parts.join(", ")}</span>;
}

function SeedNumberBadge({ seedNumber }: { seedNumber: bigint }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs bg-gold/10 text-gold-dark px-2 py-0.5 rounded-full font-medium">
      <Hash size={10} />
      Seed: {seedNumber.toString()}
    </span>
  );
}

function DeleteInquiryButton({ inquiryId }: { inquiryId: string }) {
  const [open, setOpen] = useState(false);
  const { mutate: deleteInquiry, isPending } = useDeleteInquiry();
  const handleConfirm = () => {
    deleteInquiry(inquiryId, {
      onSuccess: () => {
        toast.success("Inquiry deleted successfully");
        setOpen(false);
      },
      onError: () => {
        toast.error("Failed to delete inquiry");
        setOpen(false);
      },
    });
  };
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={isPending}
        className="inline-flex items-center gap-1 p-1.5 rounded-md text-charcoal/40 hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-40"
        title="Delete inquiry"
        data-ocid="inquiries.delete_button"
      >
        {isPending ? (
          <Loader2 size={14} className="animate-spin" />
        ) : (
          <Trash2 size={14} />
        )}
      </button>
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent data-ocid="inquiries.delete.dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this inquiry?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The inquiry and all associated data
              will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={isPending}
              data-ocid="inquiries.delete.cancel_button"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirm}
              disabled={isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-ocid="inquiries.delete.confirm_button"
            >
              {isPending ? (
                <span className="inline-flex items-center gap-1.5">
                  <Loader2 size={13} className="animate-spin" />
                  Deleting…
                </span>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function SpecialServiceDetails({ inquiry }: { inquiry: Inquiry }) {
  const { cleanQuestion } = parseEmailFromQuestion(inquiry.question || "");
  return (
    <div className="mt-2 space-y-1.5 border-t border-gold/10 pt-2">
      {(inquiry.city || inquiry.state || inquiry.birthCountry) && (
        <div className="flex items-start gap-1">
          <MapPin size={11} className="text-gold/60 shrink-0 mt-0.5" />
          <PlaceOfBirthDisplay inquiry={inquiry} />
        </div>
      )}
      {cleanQuestion && (
        <div>
          <span className="text-xs font-semibold text-charcoal/60">
            Special Question:{" "}
          </span>
          <span className="text-xs text-charcoal/70">{cleanQuestion}</span>
        </div>
      )}
      {inquiry.pastLifeNotes && (
        <div>
          <span className="text-xs font-semibold text-charcoal/60">
            Past Life Events:{" "}
          </span>
          <span className="text-xs text-charcoal/70">
            {inquiry.pastLifeNotes}
          </span>
        </div>
      )}
      {inquiry.palmPhotos && inquiry.palmPhotos.length > 0 && (
        <div>
          <div className="flex items-center gap-1 mb-1">
            <Images size={11} className="text-gold/60" />
            <span className="text-xs font-semibold text-charcoal/60">
              Palm Photos:
            </span>
          </div>
          <PalmPhotosPreview
            photos={inquiry.palmPhotos}
            visitorName={inquiry.visitorName}
          />
        </div>
      )}
    </div>
  );
}

export default function InquiriesTab() {
  const { data: inquiries, isLoading, error } = useGetAllInquiries();

  if (isLoading)
    return (
      <div className="flex justify-center py-16">
        <Loader2 size={32} className="animate-spin text-gold/60" />
      </div>
    );
  if (error)
    return (
      <div className="text-center py-16 text-destructive/60">
        <p>Failed to load inquiries. You may not have admin access.</p>
      </div>
    );
  if (!inquiries || inquiries.length === 0)
    return (
      <div className="text-center py-16" data-ocid="inquiries.empty_state">
        <Eye size={48} className="text-gold/30 mx-auto mb-4" />
        <p className="font-serif text-xl text-charcoal/40">No inquiries yet</p>
      </div>
    );

  return (
    <div className="space-y-4">
      <p className="text-sm text-charcoal/50">
        {inquiries.length} total inquiries
      </p>

      {/* Desktop Table */}
      <div className="hidden lg:block overflow-hidden rounded-xl border border-gold/20 shadow-spiritual">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gold/10 border-b border-gold/20">
              {[
                "#",
                "Service",
                "Name",
                "Email",
                "DOB / TOB",
                "Place of Birth",
                "Question / Notes",
                "Images",
                "Submitted",
                "Action",
              ].map((h) => (
                <th
                  key={h}
                  className="px-4 py-3 text-left font-semibold text-charcoal/70 text-xs uppercase tracking-wide"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {inquiries.map((inquiry, idx) => {
              const isSpecial = SPECIAL_SERVICE_IDS.has(
                Number(inquiry.serviceId),
              );
              const hasSeedNumber = inquiry.seedNumber != null;
              const { email: parsedEmail, cleanQuestion } =
                parseEmailFromQuestion(inquiry.question || "");
              return (
                <tr
                  key={inquiry.id.toString()}
                  className={`border-t border-gold/10 hover:bg-gold/5 ${idx % 2 === 0 ? "bg-white/60" : "bg-cream-bg/60"}`}
                  data-ocid={`inquiries.row.${idx + 1}`}
                >
                  <td className="px-4 py-3 text-charcoal/50">{idx + 1}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full w-fit ${isSpecial ? "bg-violet-100 text-violet-700" : "bg-gold/10 text-gold-dark"}`}
                      >
                        {serviceNames[Number(inquiry.serviceId)] ||
                          `Service ${inquiry.serviceId}`}
                      </span>
                      {hasSeedNumber && (
                        <SeedNumberBadge seedNumber={inquiry.seedNumber!} />
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-medium text-charcoal">
                    {inquiry.visitorName}
                  </td>
                  <td className="px-4 py-3">
                    {parsedEmail ? (
                      <a
                        href={`mailto:${parsedEmail}`}
                        className="text-xs text-gold-dark hover:text-gold transition-colors underline underline-offset-2 break-all"
                      >
                        {parsedEmail}
                      </a>
                    ) : (
                      <span className="text-xs text-charcoal/30 italic">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-charcoal/60">
                    <div>{inquiry.dob}</div>
                    {inquiry.tob && (
                      <div className="text-xs text-charcoal/40">
                        {inquiry.tob}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <PlaceOfBirthDisplay inquiry={inquiry} />
                  </td>
                  <td className="px-4 py-3 text-charcoal/70 min-w-[240px] max-w-[320px]">
                    {cleanQuestion && (
                      <div className="text-xs">
                        <span className="font-medium text-charcoal/50">
                          Q:{" "}
                        </span>
                        <span className="break-words whitespace-pre-wrap leading-relaxed">
                          {cleanQuestion}
                        </span>
                      </div>
                    )}
                    {inquiry.pastLifeNotes && (
                      <div className="text-xs mt-1">
                        <span className="font-medium text-charcoal/50">
                          Notes:{" "}
                        </span>
                        <span className="break-words whitespace-pre-wrap leading-relaxed">
                          {inquiry.pastLifeNotes}
                        </span>
                      </div>
                    )}
                    {!cleanQuestion && !inquiry.pastLifeNotes && (
                      <span className="text-charcoal/30 italic text-xs">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {isSpecial &&
                    inquiry.palmPhotos &&
                    inquiry.palmPhotos.length > 0 ? (
                      <PalmPhotosPreview
                        photos={inquiry.palmPhotos}
                        visitorName={inquiry.visitorName}
                      />
                    ) : (
                      <HandPicturePreview inquiry={inquiry} />
                    )}
                  </td>
                  <td className="px-4 py-3 text-charcoal/50 text-xs whitespace-nowrap">
                    {new Date().toLocaleDateString("en-IN")}
                  </td>
                  <td className="px-4 py-3">
                    <DeleteInquiryButton inquiryId={inquiry.id} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="lg:hidden space-y-4">
        {inquiries.map((inquiry) => {
          const isSpecial = SPECIAL_SERVICE_IDS.has(Number(inquiry.serviceId));
          const hasSeedNumber = inquiry.seedNumber != null;
          const { email: parsedEmail, cleanQuestion: mobileCleanQuestion } =
            parseEmailFromQuestion(inquiry.question || "");
          return (
            <div
              key={inquiry.id.toString()}
              className={`rounded-xl border bg-white/60 p-4 space-y-2 ${isSpecial ? "border-violet-200" : "border-gold/20"}`}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-charcoal">
                  {inquiry.visitorName}
                </span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${isSpecial ? "bg-violet-100 text-violet-700" : "bg-gold/10 text-gold-dark"}`}
                >
                  {serviceNames[Number(inquiry.serviceId)] ||
                    `Service ${inquiry.serviceId}`}
                </span>
              </div>
              {parsedEmail && (
                <div className="flex items-center gap-1.5">
                  <Mail size={11} className="text-gold-dark shrink-0" />
                  <a
                    href={`mailto:${parsedEmail}`}
                    className="text-xs text-gold-dark hover:text-gold transition-colors underline underline-offset-2 break-all"
                  >
                    {parsedEmail}
                  </a>
                </div>
              )}
              {hasSeedNumber && (
                <div>
                  <SeedNumberBadge seedNumber={inquiry.seedNumber!} />
                </div>
              )}
              <div className="text-xs text-charcoal/50">
                DOB: {inquiry.dob}
                {inquiry.tob && (
                  <span className="ml-2">Time: {inquiry.tob}</span>
                )}
              </div>
              {isSpecial ? (
                <SpecialServiceDetails inquiry={inquiry} />
              ) : (
                <>
                  {(inquiry.city || inquiry.state || inquiry.birthCountry) && (
                    <div className="flex items-center gap-1">
                      <MapPin size={11} className="text-gold/60 shrink-0" />
                      <PlaceOfBirthDisplay inquiry={inquiry} />
                    </div>
                  )}
                  {mobileCleanQuestion && (
                    <div>
                      <span className="text-xs font-medium text-charcoal/60">
                        Question:{" "}
                      </span>
                      <span className="text-xs text-charcoal/70">
                        {mobileCleanQuestion}
                      </span>
                    </div>
                  )}
                  {inquiry.pastLifeNotes && (
                    <div>
                      <span className="text-xs font-medium text-charcoal/60">
                        Notes:{" "}
                      </span>
                      <span className="text-xs text-charcoal/70">
                        {inquiry.pastLifeNotes}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between pt-1">
                    <HandPicturePreview inquiry={inquiry} />
                    <span className="text-xs text-charcoal/40">
                      {new Date().toLocaleDateString("en-IN")}
                    </span>
                  </div>
                </>
              )}
              {isSpecial && (
                <div className="text-xs text-charcoal/40 pt-1">
                  {new Date().toLocaleDateString("en-IN")}
                </div>
              )}
              <div className="flex items-center justify-end pt-2 border-t border-gold/10">
                <DeleteInquiryButton inquiryId={inquiry.id} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
