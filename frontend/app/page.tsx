import Link from "next/link";
import Button from "@/components/ui/Button";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#F8FAFC] p-8">
      <div className="w-full max-w-4xl space-y-12">
        <div className="text-center space-y-6">
          <div className="flex justify-center mb-6">
            <div className="h-32 w-32 rounded-3xl flex items-center justify-center shadow-glow-lg overflow-hidden bg-white p-4">
              <img 
                src="/payroll logo.png" 
                alt="InsightPayroll Logo" 
                className="w-full h-full object-contain"
              />
            </div>
          </div>
          <h1 className="text-6xl font-bold text-[#0F172A]">
            Payroll System
          </h1>
          <p className="text-xl text-[#64748B] max-w-2xl mx-auto">
            Enterprise Workforce Management Platform
            <br />
            <span className="text-base text-[#64748B]">
              Streamline your payroll, manage your workforce, and grow your business
            </span>
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link href="/login" className="w-full sm:w-auto">
            <Button className="w-full sm:w-48" size="lg" variant="gradient">
              Sign In
            </Button>
          </Link>
          <Link href="/login" className="w-full sm:w-auto">
            <Button className="w-full sm:w-48" size="lg" variant="gradient">
              Sign Up
            </Button>
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
          <div className="p-6 rounded-2xl glass-effect">
            <div className="text-3xl mb-3">⚡</div>
            <h3 className="font-bold text-lg mb-2 text-[#0F172A]">Fast & Efficient</h3>
            <p className="text-[#64748B] text-sm">Process payroll in minutes, not hours</p>
          </div>
          <div className="p-6 rounded-2xl glass-effect">
            <div className="text-3xl mb-3">🔒</div>
            <h3 className="font-bold text-lg mb-2 text-[#0F172A]">Secure & Reliable</h3>
            <p className="text-[#64748B] text-sm">Enterprise-grade security for your data</p>
          </div>
          <div className="p-6 rounded-2xl glass-effect">
            <div className="text-3xl mb-3">📊</div>
            <h3 className="font-bold text-lg mb-2 text-[#0F172A]">Insights & Analytics</h3>
            <p className="text-[#64748B] text-sm">Make data-driven decisions with real-time reports</p>
          </div>
        </div>
      </div>
    </div>
  );
}
