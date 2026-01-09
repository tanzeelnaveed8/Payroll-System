"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { useAuth } from "@/lib/contexts/AuthContext";

interface LoginFormProps {
  onFlip: () => void;
}

export default function LoginForm({ onFlip }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
      <CardHeader>
        <div className="flex flex-col items-center space-y-4">
          <div className="h-20 w-20 rounded-2xl flex items-center justify-center shadow-glow overflow-hidden bg-white p-2">
            <img 
              src="/payroll logo.png" 
              alt="InsightPayroll Logo" 
              className="w-full h-full object-contain"
            />
          </div>
          <CardTitle className="text-3xl font-bold text-[#0F172A]">Welcome Back</CardTitle>
          <p className="text-sm text-[#64748B]">
            Sign in to your account to continue
          </p>
        </div>
      </CardHeader>
      <CardContent>
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
            <Input
              id="login-password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />
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
        <div className="mt-6 text-center">
          <p className="text-sm text-[#0F172A]">
            Don&apos;t have an account?{" "}
            <button
              type="button"
              onClick={onFlip}
              className="text-[#2563EB] hover:text-[#1D4ED8] font-bold transition-colors"
              disabled={loading}
            >
              Sign Up
            </button>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
