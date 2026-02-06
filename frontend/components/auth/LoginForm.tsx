"use client";

import { useState } from "react";
import Image from "next/image";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { useAuth } from "@/lib/contexts/AuthContext";

interface LoginFormProps {
  onFlip?: () => void;
}

/**
 * Production-ready Login Form Component
 * Public registration is disabled - only admin can create user accounts
 * Users should contact their administrator to get login credentials (email and password)
 */
export default function LoginForm({ onFlip }: LoginFormProps = {}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (!email.trim() || !password) {
      setError("Please enter both email and password");
      return;
    }
    
    setLoading(true);

    try {
      await login(email.trim(), password);
    } catch (err: unknown) {
      let errorMessage = "Login failed. Please try again.";
      
      if (err instanceof Error) {
        // Try to parse error message if it contains JSON
        try {
          const errorData = JSON.parse(err.message);
          if (errorData.errors && Array.isArray(errorData.errors)) {
            errorMessage = errorData.errors.map((e: { message: string }) => e.message).join(', ');
          } else if (errorData.message) {
            errorMessage = errorData.message;
          } else {
            errorMessage = err.message;
          }
        } catch {
          errorMessage = err.message || errorMessage;
        }
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full h-full glass-effect">
      <CardHeader className="px-4 sm:px-6 pb-4 sm:pb-6">
        <div className="flex flex-col items-center space-y-3 sm:space-y-4">
          <div className="h-24 w-24 sm:h-32 sm:w-32 md:h-40 md:w-40 flex items-center justify-center flex-shrink-0">
            <Image 
              src="/payroll logo.png" 
              alt="MeeTech Labs Management system Logo" 
              width={160}
              height={160}
              className="w-full h-full object-contain drop-shadow-lg"
            />
          </div>
          <CardTitle className="text-xl sm:text-2xl md:text-3xl font-bold text-[#0F172A] text-center px-2">
            Welcome Back
          </CardTitle>
          <p className="text-xs sm:text-sm text-[#64748B] text-center px-2 sm:px-4 leading-relaxed">
            Sign in with your credentials provided by administrator
          </p>
        </div>
      </CardHeader>
      <CardContent className="px-4 sm:px-6">
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-[#DC2626]/10 border border-[#DC2626]/20">
            <p className="text-sm text-[#DC2626]">{error}</p>
          </div>
        )}
        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label
              htmlFor="login-email"
              className="text-sm font-semibold text-[#0F172A]"
            >
              Email Address
            </label>
            <Input
              id="login-email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <label
              htmlFor="login-password"
              className="text-sm font-semibold text-[#0F172A]"
            >
              Password
            </label>
            <div className="relative">
              <Input
                id="login-password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                className="pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-5 h-5"
                  >
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-5 h-5"
                  >
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>
          <div className="flex items-center text-sm">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                className="rounded border-input text-primary focus:ring-2 focus:ring-primary"
                disabled={loading}
              />
              <span className="text-[#0F172A]">Remember me</span>
            </label>
          </div>
          <Button 
            type="submit" 
            variant="gradient" 
            className="w-full" 
            size="lg"
            disabled={loading}
          >
            {loading ? "Signing In..." : "Sign In"}
          </Button>
        </form>
        <div className="mt-6 pt-4 border-t border-slate-200 text-center">
          <p className="text-xs text-[#64748B] mb-2">
            Need access to the system?
          </p>
          <p className="text-xs text-[#64748B]">
            Please contact your system administrator to receive your login credentials (email and password).
            Only administrators can create user accounts for security purposes.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
