"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { Wallet, Download, FileText, Eye, Receipt } from "lucide-react";
import { employeeService, type Paystub } from "@/lib/services/employeeService";
import { payrollService } from "@/lib/services/payrollService";
import { useAuth } from "@/lib/contexts/AuthContext";
import { toast } from "@/lib/hooks/useToast";

export default function EmployeePaystubsPage() {
  const [loading, setLoading] = useState(true);
  const [paystubs, setPaystubs] = useState<Paystub[]>([]);
  const [selectedStub, setSelectedStub] = useState<string | null>(null);
  const [selectedPaystubDetail, setSelectedPaystubDetail] = useState<any>(null);
  const { user } = useAuth();

  useEffect(() => {
    loadPaystubs();
  }, []);

  const loadPaystubs = async () => {
    try {
      setLoading(true);
      const result = await employeeService.getPaystubs(1, 100);
      setPaystubs(result.paystubs || []);
    } catch (error: any) {
      toast.error(error?.message || 'Failed to load paystubs');
      setPaystubs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleViewPaystub = async (id: string) => {
    try {
      const detail = await employeeService.getPaystubById(id);
      setSelectedPaystubDetail(detail);
      setSelectedStub(id);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load paystub details');
      setSelectedPaystubDetail(null);
    }
  };

  const selectedPaystub = selectedPaystubDetail || paystubs.find((s) => s.id === selectedStub);

  if (loading) {
    return (
      <div className="space-y-6 p-4 sm:p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 rounded w-48"></div>
          <div className="grid grid-cols-1 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-slate-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#0F172A] mb-2">Pay Stubs</h1>
        <p className="text-sm sm:text-base text-[#64748B]">
          View and download your payment history
        </p>
      </div>

      {paystubs.length === 0 ? (
        <Card className="border-2 border-slate-300 bg-white shadow-sm">
          <CardContent className="py-12">
            <div className="text-center text-[#64748B]">
              <svg className="w-16 h-16 mx-auto mb-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-base font-semibold text-[#0F172A] mb-2">No Pay Stubs Available</p>
              <p className="text-sm text-[#64748B] max-w-md mx-auto">
                Your pay stubs will appear here once payroll has been processed for a pay period. 
                If you believe this is an error, please contact your manager or HR department.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {paystubs.map((stub) => (
              <Card
                key={stub.id}
                className={`border-2 border-slate-300 bg-white hover:shadow-xl transition-all cursor-pointer shadow-sm ${
                  selectedStub === stub.id ? "ring-2 ring-[#2563EB] border-[#2563EB]" : ""
                }`}
                onClick={() => setSelectedStub(selectedStub === stub.id ? null : stub.id)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-lg font-bold text-[#0F172A]">
                          Rs {stub.netPay.toLocaleString()}
                        </h3>
                        <Badge
                          className={
                            stub.status === "paid"
                              ? "bg-[#16A34A]/10 text-[#16A34A] border-2 border-[#16A34A]/30 font-semibold"
                              : "bg-[#F59E0B]/10 text-[#F59E0B] border-2 border-[#F59E0B]/30 font-semibold"
                          }
                        >
                          {stub.status === "paid" ? "Paid" : "Processing"}
                        </Badge>
                      </div>
                      <p className="text-sm text-[#64748B] mb-1">
                        {new Date(stub.payDate).toLocaleDateString("en-US", {
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                      <p className="text-xs text-[#64748B]">
                        {new Date(stub.payPeriodStart).toLocaleDateString()} - {new Date(stub.payPeriodEnd).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-[#2563EB]/20 text-[#2563EB] hover:bg-[#2563EB]/5"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewPaystub(stub.id);
                        }}
                      >
                        View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-slate-200 text-[#64748B] hover:bg-slate-50"
                        onClick={async (e) => {
                          e.stopPropagation();
                          try {
                            await payrollService.getPaystubPDF(stub.id);
                            toast.success('Paystub PDF downloaded successfully');
                          } catch (error: any) {
                            toast.error(error.message || 'Failed to download PDF');
                            handleViewPaystub(stub.id);
                          }
                        }}
                      >
                        Download
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {selectedPaystub && (
            <div className="lg:col-span-1">
              <Card className="border-2 border-slate-300 bg-white sticky top-6 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg font-bold text-[#0F172A]">Pay Stub Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-xs text-[#64748B] mb-1">Pay Period</p>
                    <p className="text-sm font-semibold text-[#0F172A]">
                      {new Date(selectedPaystub.payPeriodStart).toLocaleDateString()} - {new Date(selectedPaystub.payPeriodEnd).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-200">
                    <div>
                      <p className="text-xs text-[#64748B] mb-1">Gross Pay</p>
                      <p className="text-sm font-semibold text-[#0F172A]">
                        Rs {(selectedPaystub.grossPay || 0).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-[#64748B] mb-1">Deductions</p>
                      <p className="text-sm font-semibold text-[#0F172A]">
                        Rs {(selectedPaystub.totalDeductions || 0).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="pt-4 border-t border-slate-200">
                    <p className="text-xs text-[#64748B] mb-1">Net Pay</p>
                    <p className="text-2xl font-bold text-[#0F172A]">
                      Rs {(selectedPaystub.netPay || 0).toLocaleString()}
                    </p>
                  </div>
                  {selectedPaystubDetail && (
                    <div className="pt-4 border-t border-slate-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-[#64748B]">Earnings</span>
                        <span className="text-xs font-semibold text-[#0F172A]">
                          Rs {(selectedPaystubDetail.grossPay || 0).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-[#64748B]">Taxes</span>
                        <span className="text-xs font-semibold text-[#0F172A]">
                          Rs {(selectedPaystubDetail.taxes?.total || 0).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-[#64748B]">Other Deductions</span>
                        <span className="text-xs font-semibold text-[#0F172A]">
                          Rs {((selectedPaystubDetail.totalDeductions || 0) - (selectedPaystubDetail.taxes?.total || 0)).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  )}
                  <Button
                    variant="outline"
                    className="w-full border-slate-200 text-[#64748B] hover:bg-slate-50"
                    onClick={async () => {
                      if (!selectedPaystub) return;
                      try {
                        await payrollService.getPaystubPDF(selectedPaystub.id);
                        toast.success('Paystub PDF downloaded successfully');
                      } catch (error: any) {
                        toast.error(error.message || 'Failed to download PDF');
                      }
                    }}
                  >
                    Download PDF
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

