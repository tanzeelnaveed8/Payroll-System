"use client";

import { useState } from "react";
import Image from "next/image";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { ROLES } from "@/lib/constants/roles";
import { useAuth } from "@/lib/contexts/AuthContext";

interface SignupFormProps {
  onFlip: () => void;
}

const roleOptions = [
  { value: "", label: "Select your role", disabled: true },
  { value: ROLES.ADMIN, label: "Administrator" },
  { value: ROLES.MANAGER, label: "Manager" },
  { value: ROLES.DEPT_LEAD, label: "Department Lead" },
  { value: ROLES.EMPLOYEE, label: "Employee" },
];

export default function SignupForm({ onFlip }: SignupFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "",
    password: "",
    confirmPassword: "",
    department: "",
    position: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { register } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    // Check password requirements
    const hasUpperCase = /[A-Z]/.test(formData.password);
    const hasLowerCase = /[a-z]/.test(formData.password);
    const hasNumber = /\d/.test(formData.password);
    
    if (!hasUpperCase || !hasLowerCase || !hasNumber) {
      setError("Password must contain at least one uppercase letter, one lowercase letter, and one number");
      return;
    }

    if (!formData.role) {
      setError("Please select a role");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role as 'admin' | 'manager' | 'dept_lead' | 'employee',
        ...(formData.department && { department: formData.department }),
        ...(formData.position && { position: formData.position }),
      });
    } catch (err: unknown) {
      if (err instanceof Error) {
        // Try to parse error message if it's a validation error
        try {
          const errorData = JSON.parse(err.message);
          if (errorData.errors && Array.isArray(errorData.errors)) {
            const errorMessages = errorData.errors.map((e: { field: string; message: string }) => e.message).join(', ');
            setError(errorMessages);
          } else {
            setError(err.message);
          }
        } catch {
          setError(err.message);
        }
      } else {
        setError("Registration failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full h-full glass-effect overflow-y-auto">
      <CardHeader className="pb-4 sm:pb-6 px-4 sm:px-6">
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
            Create Account
          </CardTitle>
          <p className="text-xs sm:text-sm text-[#64748B] text-center px-2 sm:px-4 leading-relaxed break-words">
            Sign up to get started with MeeTech Labs Management system
          </p>
        </div>
      </CardHeader>
      <CardContent className="pt-0 px-4 sm:px-6">
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-[#DC2626]/10 border border-[#DC2626]/20">
            <p className="text-sm text-[#DC2626]">{error}</p>
          </div>
        )}
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label
              htmlFor="signup-name"
              className="text-sm font-semibold text-[#0F172A]"
            >
              Full Name
            </label>
            <Input
              id="signup-name"
              type="text"
              placeholder="Enter your full name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="signup-email"
              className="text-sm font-semibold text-[#0F172A]"
            >
              Email Address
            </label>
            <Input
              id="signup-email"
              type="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="signup-role"
              className="text-sm font-semibold text-[#0F172A]"
            >
              Role <span className="text-[#DC2626]">*</span>
            </label>
            <Select
              id="signup-role"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              required
              disabled={loading}
            >
              {roleOptions.map((option) => (
                <option
                  key={option.value}
                  value={option.value}
                  disabled={option.disabled}
                >
                  {option.label}
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="signup-password"
              className="text-sm font-semibold text-[#0F172A]"
            >
              Password <span className="text-xs text-[#64748B] font-normal">(uppercase, lowercase, number)</span>
            </label>
            <Input
              id="signup-password"
              type="password"
              placeholder="Create a password (min 6 characters)"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2 -mt-1">
            <label
              htmlFor="signup-confirm"
              className="text-sm font-semibold text-[#0F172A]"
            >
              Confirm Password
            </label>
            <Input
              id="signup-confirm"
              type="password"
              placeholder="Confirm your password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              required
              disabled={loading}
            />
          </div>

          <div className="flex items-start space-x-2 text-sm pt-2">
            <input
              type="checkbox"
              id="terms"
              className="mt-1 rounded border-input text-primary focus:ring-2 focus:ring-primary"
              required
              disabled={loading}
            />
            <label htmlFor="terms" className="text-[#0F172A] cursor-pointer leading-relaxed">
              I agree to the{" "}
              <a href="#" className="text-[#2563EB] hover:text-[#1D4ED8] font-semibold">
                Terms & Conditions
              </a>{" "}
              and{" "}
              <a href="#" className="text-[#2563EB] hover:text-[#1D4ED8] font-semibold">
                Privacy Policy
              </a>
            </label>
          </div>

          <Button 
            type="submit" 
            variant="gradient" 
            className="w-full mt-6" 
            size="lg"
            disabled={loading}
          >
            {loading ? "Creating Account..." : "Create Account"}
          </Button>
        </form>

        <div className="mt-6 pt-4 border-t border-border/30 text-center">
          <p className="text-sm text-[#0F172A]">
            Already have an account?{" "}
            <button
              type="button"
              onClick={onFlip}
              className="text-[#2563EB] hover:text-[#1D4ED8] font-bold transition-colors"
              disabled={loading}
            >
              Sign In
            </button>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
