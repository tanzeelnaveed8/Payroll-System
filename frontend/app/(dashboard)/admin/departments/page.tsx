"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import { Building2, Plus, Search, Pencil, Trash2, X, Loader2, FolderOpen } from "lucide-react";
import { departmentsApi, type Department } from "@/lib/api/departments";

export default function AdminDepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    description: "",
    managerId: "",
    parentDepartmentId: "",
    annualBudget: "",
    monthlyBudget: "",
    costCenter: "",
    location: "",
    timezone: "",
    status: "active" as "active" | "inactive",
  });

  const loadDepartments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await departmentsApi.getDepartments({
        page,
        limit: 10,
        search: search || undefined,
        status: statusFilter || undefined,
        sort: "name",
        order: "asc",
      });
      setDepartments(response.data);
      setTotal(response.pagination.total);
    } catch (err: any) {
      const errorMessage = err.message || "Failed to load departments. Please try again.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => {
    loadDepartments();
  }, [loadDepartments]);

  const handleAdd = () => {
    setFormData({
      name: "",
      code: "",
      description: "",
      managerId: "",
      parentDepartmentId: "",
      annualBudget: "",
      monthlyBudget: "",
      costCenter: "",
      location: "",
      timezone: "",
      status: "active",
    });
    setSelectedDepartment(null);
    setIsAddModalOpen(true);
  };

  const handleEdit = (dept: Department) => {
    setFormData({
      name: dept.name,
      code: dept.code || "",
      description: dept.description || "",
      managerId: dept.managerId || "",
      parentDepartmentId: dept.parentDepartmentId || "",
      annualBudget: dept.annualBudget?.toString() || "",
      monthlyBudget: dept.monthlyBudget?.toString() || "",
      costCenter: dept.costCenter || "",
      location: dept.location || "",
      timezone: dept.timezone || "",
      status: dept.status,
    });
    setSelectedDepartment(dept);
    setIsEditModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const data = {
        name: formData.name,
        code: formData.code || undefined,
        description: formData.description || undefined,
        managerId: formData.managerId || undefined,
        parentDepartmentId: formData.parentDepartmentId || undefined,
        annualBudget: formData.annualBudget ? parseFloat(formData.annualBudget) : undefined,
        monthlyBudget: formData.monthlyBudget ? parseFloat(formData.monthlyBudget) : undefined,
        costCenter: formData.costCenter || undefined,
        location: formData.location || undefined,
        timezone: formData.timezone || undefined,
        status: formData.status,
      };

      if (selectedDepartment) {
        await departmentsApi.updateDepartment(selectedDepartment.id, data);
      } else {
        await departmentsApi.createDepartment(data);
      }

      setIsAddModalOpen(false);
      setIsEditModalOpen(false);
      setSelectedDepartment(null);
      loadDepartments();
    } catch (err: any) {
      const errorMessage = err.message || "Failed to save department. Please try again.";
      setError(errorMessage);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this department?")) return;
    try {
      await departmentsApi.deleteDepartment(id);
      loadDepartments();
    } catch (err: any) {
      const errorMessage = err.message || "Failed to delete department. Please try again.";
      setError(errorMessage);
    }
  };

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#0F172A] mb-2 flex items-center gap-2">
            <Building2 className="h-7 w-7 text-[#2563EB]" />
            Department Management
          </h1>
          <p className="text-sm sm:text-base text-[#64748B]">Organize, configure, and oversee all company departments and their allocations</p>
        </div>
        <Button
          onClick={handleAdd}
          className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white"
        >
          + Add Department
        </Button>
      </div>

      <Card className="border-2 border-slate-300 bg-white shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                type="text"
                placeholder="Search departments..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full"
              />
            </div>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full sm:w-48"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#2563EB]"></div>
              <span className="ml-3 text-[#64748B]">Loading departments...</span>
            </div>
          ) : departments.length === 0 ? (
            <div className="text-center py-12 text-[#64748B]">
              <p className="text-lg mb-2">No departments found</p>
              <p className="text-sm">Create your first department to get started</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-slate-300 bg-gradient-to-r from-slate-50 to-blue-50">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-[#0F172A]">Name</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-[#0F172A]">Code</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-[#0F172A]">Employees</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-[#0F172A]">Budget</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-[#0F172A]">Status</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-[#0F172A]">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {departments.map((dept) => (
                      <tr
                        key={dept.id}
                        className="border-b border-slate-200 hover:bg-blue-50 transition-colors bg-white"
                      >
                        <td className="py-4 px-4">
                          <div>
                            <p className="font-medium text-[#0F172A]">{dept.name}</p>
                            {dept.description && (
                              <p className="text-xs text-[#64748B] mt-1">{dept.description}</p>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-sm text-[#64748B]">{dept.code || "-"}</span>
                        </td>
                        <td className="py-4 px-4">
                          <div>
                            <p className="text-sm font-medium text-[#0F172A]">
                              {dept.activeEmployeeCount} / {dept.employeeCount}
                            </p>
                            <p className="text-xs text-[#64748B]">Active / Total</p>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          {dept.annualBudget ? (
                            <span className="text-sm text-[#0F172A]">
                              Rs {(dept.annualBudget / 1000000).toFixed(1)}M
                            </span>
                          ) : (
                            <span className="text-sm text-[#64748B]">-</span>
                          )}
                        </td>
                        <td className="py-4 px-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border-2 ${
                              dept.status === "active"
                                ? "bg-green-100 text-green-800 border-green-300"
                                : "bg-gray-100 text-gray-800 border-gray-300"
                            }`}
                          >
                            {dept.status}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="default"
                              onClick={() => handleEdit(dept)}
                              className="text-xs sm:text-sm px-3 sm:px-4 py-1 sm:py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold shadow-sm hover:shadow-md"
                            >
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => handleDelete(dept.id)}
                              className="text-xs sm:text-sm px-3 sm:px-4 py-1 sm:py-2 bg-[#DC2626] hover:bg-[#B91C1C] text-white border-transparent hover:border-transparent font-semibold shadow-sm hover:shadow-md"
                            >
                              Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {total > 10 && (
                <div className="mt-4 flex items-center justify-between">
                  <p className="text-sm text-[#64748B]">
                    Showing {(page - 1) * 10 + 1} to {Math.min(page * 10, total)} of {total} departments
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="text-xs px-3 py-1"
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setPage((p) => p + 1)}
                      disabled={page * 10 >= total}
                      className="text-xs px-3 py-1"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {(isAddModalOpen || isEditModalOpen) && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={() => {
            setIsAddModalOpen(false);
            setIsEditModalOpen(false);
          }}
        >
          <Card
            className="w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <CardHeader className="border-b border-slate-200">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle className="text-xl font-bold text-[#0F172A]">
                    {selectedDepartment ? "Edit Department" : "Add New Department"}
                  </CardTitle>
                  {selectedDepartment && (
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs sm:text-sm">
                      <span className="text-[#64748B]">
                        Current: <span className="font-semibold text-[#0F172A]">{selectedDepartment.name}</span>
                        {selectedDepartment.code && (
                          <span className="text-[#94A3B8]"> • {selectedDepartment.code}</span>
                        )}
                      </span>
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                          selectedDepartment.status === "active"
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {selectedDepartment.status === "active" ? "Active" : "Inactive"}
                      </span>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setIsEditModalOpen(false);
                  }}
                  className="text-[#64748B] hover:text-[#0F172A] transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-[#0F172A]">
                      Name <span className="text-[#DC2626]">*</span>
                    </label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Department name"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-[#0F172A]">Code</label>
                    <Input
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                      placeholder="DEPT"
                      maxLength={10}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-[#0F172A]">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Department description"
                    rows={3}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-[#0F172A]">Annual Budget</label>
                    <Input
                      type="number"
                      value={formData.annualBudget}
                      onChange={(e) => setFormData({ ...formData, annualBudget: e.target.value })}
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-[#0F172A]">Monthly Budget</label>
                    <Input
                      type="number"
                      value={formData.monthlyBudget}
                      onChange={(e) => setFormData({ ...formData, monthlyBudget: e.target.value })}
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-[#0F172A]">Location</label>
                    <Input
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      placeholder="Office location"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-[#0F172A]">Timezone</label>
                    <Input
                      value={formData.timezone}
                      onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                      placeholder="UTC"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-[#0F172A]">Cost Center</label>
                  <Input
                    value={formData.costCenter}
                    onChange={(e) => setFormData({ ...formData, costCenter: e.target.value })}
                    placeholder="Cost center code"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-[#0F172A]">Status</label>
                  <Select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value as "active" | "inactive" })
                    }
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </Select>
                </div>

                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                    {error}
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                  <Button
                    variant="outline"
                    type="button"
                    onClick={() => {
                      setIsAddModalOpen(false);
                      setIsEditModalOpen(false);
                    }}
                    className="px-4 sm:px-6 h-10 sm:h-11 border-2 border-slate-300 text-[#0F172A] bg-white hover:bg-slate-50 font-semibold"
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="gradient"
                    type="submit"
                    className="bg-gradient-to-r from-blue-600 to-blue-700 text-white"
                  >
                    {selectedDepartment ? "Update Department" : "Create Department"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

