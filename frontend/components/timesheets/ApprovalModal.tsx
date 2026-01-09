"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

interface ApprovalModalProps {
  open: boolean;
  onClose: () => void;
  type: "approve" | "reject" | "bulk-approve" | "bulk-reject" | null;
  onSubmit: (comment?: string) => void;
  loading: boolean;
  timesheetCount: number;
}

export default function ApprovalModal({
  open,
  onClose,
  type,
  onSubmit,
  loading,
  timesheetCount,
}: ApprovalModalProps) {
  const [comment, setComment] = useState("");

  useEffect(() => {
    if (!open) {
      setComment("");
    }
  }, [open]);

  if (!open || !type) return null;

  const isReject = type === "reject" || type === "bulk-reject";
  const isBulk = type.startsWith("bulk");
  const requiresComment = isReject;

  const handleSubmit = () => {
    if (requiresComment && !comment.trim()) {
      return;
    }
    onSubmit(comment.trim() || undefined);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <Card className="w-full max-w-md border border-slate-200 bg-white">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-[#0F172A]">
            {isReject ? "Reject" : "Approve"} Time Sheet{isBulk ? "s" : ""}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-[#64748B]">
              {isBulk
                ? `You are about to ${isReject ? "reject" : "approve"} ${timesheetCount} time sheet${timesheetCount > 1 ? "s" : ""}.`
                : `You are about to ${isReject ? "reject" : "approve"} this time sheet.`}
            </p>

            {requiresComment && (
              <div className="space-y-2">
                <label className="text-sm font-semibold text-[#0F172A]">
                  Comment <span className="text-[#DC2626]">*</span>
                </label>
                <textarea
                  className="w-full min-h-[100px] rounded-xl border-2 border-[#2563EB]/30 bg-white px-4 py-3 text-sm text-[#0F172A] placeholder:text-[#64748B] focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-[#2563EB] transition-all"
                  placeholder="Enter a reason for rejection..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  required
                />
                <p className="text-xs text-[#64748B]">
                  A comment is required when rejecting time sheets.
                </p>
              </div>
            )}

            {!requiresComment && (
              <div className="space-y-2">
                <label className="text-sm font-semibold text-[#0F172A]">
                  Optional Comment
                </label>
                <textarea
                  className="w-full min-h-[100px] rounded-xl border-2 border-[#2563EB]/30 bg-white px-4 py-3 text-sm text-[#0F172A] placeholder:text-[#64748B] focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-[#2563EB] transition-all"
                  placeholder="Add an optional comment..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                />
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                size="default"
                onClick={onClose}
                disabled={loading}
                className="flex-1 border-slate-300 text-[#0F172A]"
              >
                Cancel
              </Button>
              <Button
                variant={isReject ? "outline" : "gradient"}
                size="default"
                onClick={handleSubmit}
                disabled={loading || (requiresComment && !comment.trim())}
                className={
                  isReject
                    ? "flex-1 border-red-300 text-red-600 hover:bg-red-50"
                    : "flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white"
                }
              >
                {loading ? "Processing..." : isReject ? "Reject" : "Approve"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}




