"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { Employee } from "@/lib/services/employeeService";

interface DeleteEmployeeModalProps {
  isOpen: boolean;
  employee: Employee | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function DeleteEmployeeModal({
  isOpen,
  employee,
  onClose,
  onSuccess,
}: DeleteEmployeeModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmText, setConfirmText] = useState("");

  if (!isOpen || !employee) return null;

  const isActive = employee.status === "active";
  const canDelete = employee.status === "inactive" || employee.status === "terminated";
  const requiresConfirmation = employee.status === "inactive";

  const handleDelete = async () => {
    if (!canDelete) {
      setError("Only inactive or terminated employees can be deleted. Please deactivate the employee first.");
      return;
    }

    if (requiresConfirmation && confirmText !== employee.name) {
      setError(`Please type ${employee.name} to confirm deletion`);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { employeeService } = await import("@/lib/services/employeeService");
      await employeeService.deleteEmployee(employee.id);
      onSuccess();
      onClose();
      setConfirmText("");
    } catch (err: any) {
      const errorMessage = err?.message || "Failed to delete employee. Please try again.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setError(null);
      setConfirmText("");
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-employee-title"
    >
      <Card
        className="w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <CardHeader className="border-b border-slate-200">
          <div className="flex items-center justify-between">
            <CardTitle id="delete-employee-title" className="text-xl font-bold text-[#0F172A]">
              Delete Employee
            </CardTitle>
            <button
              onClick={handleClose}
              disabled={loading}
              className="text-[#64748B] hover:text-[#0F172A] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Close delete employee dialog"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          {isActive ? (
            <div className="space-y-4">
              <div className="p-4 bg-[#F59E0B]/10 border-2 border-[#F59E0B]/30 rounded-lg">
                <div className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-[#F59E0B] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-[#F59E0B] mb-1">Cannot Delete Active Employee</h3>
                    <p className="text-sm text-[#0F172A]">
                      This employee is currently <strong>active</strong>. To delete an employee, you must first deactivate them by changing their status to <strong>inactive</strong>.
                    </p>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-[#64748B]">
                  <strong>Steps to delete:</strong>
                </p>
                <ol className="text-sm text-[#64748B] list-decimal list-inside space-y-1 ml-2">
                  <li>Edit the employee and change their status to &quot;Inactive&quot;</li>
                  <li>Save the changes</li>
                  <li>Return here and delete the employee</li>
                </ol>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-red-50 border-2 border-red-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-red-800 mb-1">Warning: Permanent Deletion</h3>
                    <p className="text-sm text-red-700">
                      This action will <strong>permanently delete</strong> the employee and all associated data. This cannot be undone.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-semibold text-[#0F172A]">
                  Employee to delete:
                </p>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <p className="text-sm font-medium text-[#0F172A]">{employee.name}</p>
                  <p className="text-xs text-[#64748B] mt-1">{employee.email}</p>
                  <p className="text-xs text-[#64748B]">
                    {employee.department || "No department"} • {employee.role || "No role"}
                  </p>
                </div>
              </div>

              {requiresConfirmation && (
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-[#0F172A]">
                    Type <strong className="text-red-600">{employee.name}</strong> to confirm:
                  </label>
                  <input
                    type="text"
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    placeholder={employee.name}
                    className="w-full px-4 py-2 border-2 border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm"
                    disabled={loading}
                    aria-label={`Type ${employee.name} to confirm deletion`}
                  />
                </div>
              )}

              {error && (
                <div className="p-4 bg-red-50 border-2 border-red-300 rounded-lg">
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-red-800 mb-1">Error</p>
                      <p className="text-sm text-red-700 whitespace-pre-line">{error}</p>
                    </div>
                    <button
                      onClick={() => setError(null)}
                      className="text-red-600 hover:text-red-800 transition-colors flex-shrink-0"
                      aria-label="Dismiss error"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-200">
            <Button
              variant="outline"
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="w-full sm:w-auto border-2 border-slate-300 bg-white hover:bg-slate-50 text-[#0F172A] font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isActive ? "Close" : "Cancel"}
            </Button>
            {!isActive && (
              <Button
                variant="gradient"
                type="button"
                onClick={handleDelete}
                disabled={loading || (requiresConfirmation && confirmText !== employee.name)}
                className="w-full sm:w-auto bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label={`Delete employee ${employee.name}`}
              >
                {loading ? "Deleting..." : "Delete Permanently"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
