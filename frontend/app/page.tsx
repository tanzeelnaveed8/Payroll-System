import Link from "next/link";
import Image from "next/image";
import Button from "@/components/ui/Button";
import { Zap, Shield, BarChart3 } from "lucide-react";

export default function HomePage() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center p-8 overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('/background (2).png')",
          backgroundAttachment: 'fixed',
        }}
      />
      {/* Subtle overlay for better content readability while preserving background beauty */}
      <div className="absolute inset-0 z-[1] bg-gradient-to-b from-white/50 via-white/40 to-white/50" />
      
      {/* Content */}
      <div className="relative z-10 w-full max-w-4xl space-y-8 sm:space-y-10 lg:space-y-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-4 sm:space-y-6">
          <div className="flex justify-center mb-4 sm:mb-6">
            <div className="h-32 w-32 sm:h-48 sm:w-48 lg:h-64 lg:w-64 flex items-center justify-center flex-shrink-0">
              <Image 
                src="/payroll logo.png" 
                alt="MeeTech Labs Management system Logo" 
                width={256}
                height={256}
                priority
                className="w-full h-full object-contain drop-shadow-2xl"
              />
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-[#0F172A] leading-tight px-2 sm:px-4 break-words">
            MeeTech Labs Management system
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-[#64748B] max-w-2xl mx-auto px-2 sm:px-4 leading-relaxed">
            Enterprise Workforce Management Platform
            <br className="hidden sm:block" />
            <span className="block sm:inline text-sm sm:text-base text-[#64748B] mt-1 sm:mt-0">
              Streamline your payroll, manage your workforce, and grow your business
            </span>
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center px-4 sm:px-0">
          <Link href="/login" className="w-full sm:w-auto max-w-xs sm:max-w-none">
            <Button className="w-full sm:w-48" size="lg" variant="gradient">
              Sign In
            </Button>
          </Link>
        </div>
        <div className="mt-4 sm:mt-6 text-center px-4 sm:px-6">
          <p className="text-xs sm:text-sm text-[#64748B] max-w-md mx-auto leading-relaxed">
            Need access to the system? Please contact your system administrator to receive your login credentials.
            Only administrators can create user accounts for security purposes.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 mt-8 sm:mt-12 lg:mt-16 px-4 sm:px-0">
          <div className="p-4 sm:p-6 rounded-2xl glass-effect">
            <div className="mb-2 sm:mb-3"><Zap className="w-7 h-7 sm:w-8 sm:h-8 text-blue-600" /></div>
            <h3 className="font-bold text-base sm:text-lg mb-1 sm:mb-2 text-[#0F172A]">Fast & Efficient</h3>
            <p className="text-[#64748B] text-xs sm:text-sm leading-relaxed">Automate payroll processing and reduce manual work from hours to minutes</p>
          </div>
          <div className="p-4 sm:p-6 rounded-2xl glass-effect">
            <div className="mb-2 sm:mb-3"><Shield className="w-7 h-7 sm:w-8 sm:h-8 text-blue-600" /></div>
            <h3 className="font-bold text-base sm:text-lg mb-1 sm:mb-2 text-[#0F172A]">Secure & Reliable</h3>
            <p className="text-[#64748B] text-xs sm:text-sm leading-relaxed">Bank-grade encryption and role-based access control protect your sensitive data</p>
          </div>
          <div className="p-4 sm:p-6 rounded-2xl glass-effect sm:col-span-2 md:col-span-1">
            <div className="mb-2 sm:mb-3"><BarChart3 className="w-7 h-7 sm:w-8 sm:h-8 text-blue-600" /></div>
            <h3 className="font-bold text-base sm:text-lg mb-1 sm:mb-2 text-[#0F172A]">Insights & Analytics</h3>
            <p className="text-[#64748B] text-xs sm:text-sm leading-relaxed">Real-time dashboards and detailed reports for smarter workforce decisions</p>
          </div>
        </div>
      </div>
    </div>
  );
}
