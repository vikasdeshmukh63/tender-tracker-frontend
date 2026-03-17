import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "../utils";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, LogIn, UserPlus, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import api from "@/api/client";

export default function Auth() {
  const urlParams = new URLSearchParams(window.location.search);
  const team = urlParams.get("team") || "sales";
  const navigate = useNavigate();

  const [mode, setMode] = useState("login"); // "login" | "signup"

  // Login state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginEmployeeNumber, setLoginEmployeeNumber] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginError, setLoginError] = useState("");

  // Signup state
  const [signupFullName, setSignupFullName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupEmployeeNumber, setSignupEmployeeNumber] = useState("");
  const [signupDesignation, setSignupDesignation] = useState("");
  const [signupRole, setSignupRole] = useState("user");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupConfirmPassword, setSignupConfirmPassword] = useState("");
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [signupError, setSignupError] = useState("");

  // OTP verification state
  const [otpEmail, setOtpEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpError, setOtpError] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isLoginLoading, setIsLoginLoading] = useState(false);
  const [isSignupLoading, setIsSignupLoading] = useState(false);
  const [isOtpLoading, setIsOtpLoading] = useState(false);
  const [isResendLoading, setIsResendLoading] = useState(false);

  const teamTitle = team === "presales" ? "ESDS Presales Tender Tracker" : "ESDS Sales Tender Tracker";

  const resetLoginForm = () => {
    setLoginEmail("");
    setLoginEmployeeNumber("");
    setLoginPassword("");
    setShowLoginPassword(false);
    setLoginError("");
  };

  const resetSignupForm = () => {
    setSignupFullName("");
    setSignupEmail("");
    setSignupEmployeeNumber("");
    setSignupDesignation("");
    setSignupRole("user");
    setSignupPassword("");
    setSignupConfirmPassword("");
    setShowSignupPassword(false);
    setShowConfirmPassword(false);
    setSignupError("");
  };

  const resetOtpForm = () => {
    setOtpEmail("");
    setOtpCode("");
    setOtpError("");
    setResendCooldown(0);
  };

  useEffect(() => {
    if (!resendCooldown) return;
    const id = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(id);
  }, [resendCooldown]);

  // If already logged in, do not show Auth page; redirect to dashboard
  useEffect(() => {
    const userStr = localStorage.getItem("esds_user");
    if (userStr) {
      navigate(createPageUrl(`Dashboard?team=${team}`), { replace: true });
    }
  }, [navigate, team]);

  // Auto-fill login fields from backend (primary) or localStorage (fallback)
  const handleEmailBlur = async (email) => {
    if (!email || !email.includes("@")) return;

    // Try backend first
    try {
      const res = await api.get("/user-profiles", { params: { email } });
      const profiles = res.data;
      if (profiles && profiles.length > 0) {
        const p = profiles[0];
        setLoginEmployeeNumber(p.employee_number || "");
        return;
      }
    } catch (e) {
      // fall through to localStorage
    }

    // Fallback: localStorage
    const key = `esds_profile_${email}`;
    const stored = localStorage.getItem(key);
    if (stored) {
      const p = JSON.parse(stored);
      setLoginEmployeeNumber(p.employeeNumber || "");
    }
  };

  const designationOptions = team === "presales"
    ? [
        "Solution Architect",
        "Senior Solution Architect",
        "Presales Manager",
        "Team Lead - Presales",
        "Other",
      ]
    : [
        "Sales Executive",
        "Senior Sales Executive",
        "Sales Manager",
        "Senior Sales Manager",
        "Regional Sales Manager",
        "Team Lead - Sales",
        "Other",
      ];

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError("");
    if (isLoginLoading) return;

    if (!loginEmail || !loginPassword || !loginEmployeeNumber) {
      setLoginError("Please enter email, employee number, and password");
      return;
    }

    if (!loginEmail.includes("@esds.co.in")) {
      setLoginError("Only @esds.co.in email addresses are allowed");
      return;
    }

    try {
      setIsLoginLoading(true);
      const res = await api.post("/auth/login", {
        email: loginEmail,
        password: loginPassword,
        team,
      });
      const { token, user } = res.data;
      localStorage.setItem("esds_token", token);
      const profile = user.profile || {};
      const userData = {
        email: user.email,
        employeeNumber: profile.employee_number || loginEmployeeNumber,
        designation: profile.designation || "",
        role: user.role || profile.role || "user",
        team: profile.team || team,
        fullName:
          profile.full_name ||
          loginEmail
            .split("@")[0]
            .replace(".", " ")
            .split(" ")
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(" "),
      };
      localStorage.setItem("esds_user", JSON.stringify(userData));
      navigate(createPageUrl(`Dashboard?team=${team}`));
    } catch (err) {
      const data = err.response?.data;
      const message = data?.message || "Login failed";
      // If backend indicates OTP is required, redirect to OTP verification screen
      if (data?.requireOtp) {
        setOtpEmail(loginEmail);
        setOtpCode("");
        setOtpError("");
        setMode("otp");
        setResendCooldown(180);
      } else {
        setLoginError(message);
      }
    } finally {
      setIsLoginLoading(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setSignupError("");
    if (isSignupLoading) return;

    if (!signupFullName || !signupEmail || !signupEmployeeNumber || !signupPassword || !signupConfirmPassword) {
      setSignupError("Please fill in all required fields");
      return;
    }

    if (!signupEmail.includes("@esds.co.in")) {
      setSignupError("Only @esds.co.in email addresses are allowed");
      return;
    }

    if (signupPassword.length < 6) {
      setSignupError("Password must be at least 6 characters");
      return;
    }

    if (signupPassword !== signupConfirmPassword) {
      setSignupError("Passwords do not match");
      return;
    }

    if (signupRole === "team_lead" && !signupDesignation) {
      setSignupError("Please enter designation for Team Lead role");
      return;
    }

    try {
      setIsSignupLoading(true);
      const res = await api.post("/auth/signup", {
        fullName: signupFullName,
        email: signupEmail,
        employeeNumber: signupEmployeeNumber,
        designation: signupDesignation,
        role: signupRole,
        team,
        password: signupPassword,
      });
      const message =
        res.data?.message ||
        "Signup successful. Please verify the OTP sent to your email, then sign in.";
      // Do not auto-login; switch to OTP verification screen
      resetLoginForm();
      resetSignupForm();
      setOtpEmail(signupEmail);
      setOtpCode("");
      setOtpError("");
      setMode("otp");
      setResendCooldown(180);
      setSignupError(message);
    } catch (e) {
      const data = e.response?.data;
      const message = data?.message || "Signup failed";

      // If backend tells us OTP is pending for this user, redirect to OTP screen
      if (data?.otpPending) {
        setOtpEmail(signupEmail);
        setOtpCode("");
        setOtpError("");
        setMode("otp");
        setResendCooldown(180);
        setSignupError(message);
      } else {
        setSignupError(message);
      }
    } finally {
      setIsSignupLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!otpEmail || resendCooldown > 0 || isResendLoading) return;
    try {
      setIsResendLoading(true);
      await api.post("/auth/resend-otp", { email: otpEmail });
      setResendCooldown(180);
      setOtpError("");
    } catch (err) {
      const message = err.response?.data?.message || "Failed to resend OTP";
      setOtpError(message);
    } finally {
      setIsResendLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setOtpError("");
    if (isOtpLoading) return;

    if (!otpEmail || !otpCode) {
      setOtpError("Please enter the OTP sent to your email");
      return;
    }

    try {
      setIsOtpLoading(true);
      const res = await api.post("/auth/verify-otp", {
        email: otpEmail,
        otp: otpCode,
      });
      const { token, user } = res.data;
      localStorage.setItem("esds_token", token);
      const profile = user.profile || {};
      const effectiveTeam = profile.team || team;
      const userData = {
        email: user.email,
        employeeNumber: profile.employee_number || "",
        designation: profile.designation || "",
        role: user.role || profile.role || "user",
        team: effectiveTeam,
        fullName: profile.full_name || user.email.split("@")[0],
      };
      localStorage.setItem("esds_user", JSON.stringify(userData));
      localStorage.setItem(`esds_profile_${user.email}`, JSON.stringify(userData));
      navigate(createPageUrl(`Dashboard?team=${effectiveTeam}`));
    } catch (err) {
      const message = err.response?.data?.message || "OTP verification failed";
      setOtpError(message);
    } finally {
      setIsOtpLoading(false);
    }
  };

  return (
    <div className="h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 flex items-center justify-center p-6 overflow-hidden">
      {/* Background Decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-72 h-72 bg-blue-200/20 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-200/20 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 px-8 py-6 relative">
          {/* Back Button */}
          <button
            onClick={() => navigate(-1)}
            className="absolute top-6 left-5 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          {/* Logo */}
          <div className="flex justify-center mb-2">
            <img
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/698b030c53f286e8aa40c538/fd70202b1_image.png"
              alt="ESDS"
              className="w-24 h-24 object-contain"
            />
          </div>

          {/* Tab Toggle */}
          <div className="flex bg-gray-100 rounded-xl p-1 mb-4">
            <button
              onClick={() => {
                resetOtpForm();
                resetLoginForm();
                setMode("login");
              }}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                mode === "login"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => {
                resetOtpForm();
                resetSignupForm();
                setMode("signup");
              }}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                mode === "signup"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Sign Up
            </button>
          </div>

          <AnimatePresence mode="wait">
            {mode === "login" ? (
              <motion.form
                key="login"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
                onSubmit={handleLogin}
                className="space-y-2"
              >
                <div className="text-center mb-1">
                  <h1 className="text-xl font-bold text-gray-900">Welcome Back</h1>
                  <p className="text-gray-500 text-sm">Sign in to {teamTitle}</p>
                </div>

                <div className="space-y-1">
                  <Label className="text-gray-700 font-medium text-sm">Email</Label>
                  <Input
                    type="email"
                    placeholder="your.name@esds.co.in"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    onBlur={(e) => handleEmailBlur(e.target.value)}
                    className="h-10 rounded-xl border-gray-200 bg-gray-50/50 text-sm"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-gray-700 font-medium text-sm">Employee Number</Label>
                  <Input
                    type="text"
                    placeholder="Enter your employee number"
                    value={loginEmployeeNumber}
                    onChange={(e) => setLoginEmployeeNumber(e.target.value)}
                    className="h-10 rounded-xl border-gray-200 bg-gray-50/50 text-sm"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-gray-700 font-medium text-sm">Password</Label>
                  <div className="relative">
                    <Input
                      type={showLoginPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="h-10 rounded-xl border-gray-200 bg-gray-50/50 pr-10 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {loginError && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-xl text-xs"
                  >
                    {loginError}
                  </motion.div>
                )}

                <Button
                  type="submit"
                disabled={isLoginLoading}
                  className="w-full h-11 bg-[#1e3a8a] hover:bg-[#1e40af] text-white rounded-xl font-semibold text-sm gap-2 shadow-lg shadow-blue-900/20"
                >
                <LogIn className="w-4 h-4" />
                {isLoginLoading ? "Signing in..." : "Sign In"}
                </Button>
              </motion.form>
            ) : mode === "signup" ? (
              <motion.form
                key="signup"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                onSubmit={handleSignup}
                className="space-y-2"
              >
                <div className="text-center mb-1">
                  <h1 className="text-xl font-bold text-gray-900">Create Account</h1>
                  <p className="text-gray-500 text-sm">Join {teamTitle}</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-gray-700 font-medium text-sm">Full Name <span className="text-red-500">*</span></Label>
                    <Input
                      type="text"
                      placeholder="Full name"
                      value={signupFullName}
                      onChange={(e) => setSignupFullName(e.target.value)}
                      className="h-10 rounded-xl border-gray-200 bg-gray-50/50 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-gray-700 font-medium text-sm">Employee No. <span className="text-red-500">*</span></Label>
                    <Input
                      type="text"
                      placeholder="Emp number"
                      value={signupEmployeeNumber}
                      onChange={(e) => setSignupEmployeeNumber(e.target.value)}
                      className="h-10 rounded-xl border-gray-200 bg-gray-50/50 text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-gray-700 font-medium text-sm">Email <span className="text-red-500">*</span></Label>
                  <Input
                    type="email"
                    placeholder="your.name@esds.co.in"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    className="h-10 rounded-xl border-gray-200 bg-gray-50/50 text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-gray-700 font-medium text-sm">Role <span className="text-red-500">*</span></Label>
                    <Select value={signupRole} onValueChange={setSignupRole}>
                      <SelectTrigger className="h-10 rounded-xl border-gray-200 bg-gray-50/50 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">User</SelectItem>
                        <SelectItem value="team_lead">Team Lead</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-gray-700 font-medium text-sm">Designation {signupRole === "team_lead" && <span className="text-red-500">*</span>}</Label>
                    <Select value={signupDesignation} onValueChange={setSignupDesignation}>
                      <SelectTrigger className="h-10 rounded-xl border-gray-200 bg-gray-50/50 text-sm">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        {designationOptions.map((d) => (
                          <SelectItem key={d} value={d}>{d}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-gray-700 font-medium text-sm">Password <span className="text-red-500">*</span></Label>
                    <div className="relative">
                      <Input
                        type={showSignupPassword ? "text" : "password"}
                        placeholder="Min 6 chars"
                        value={signupPassword}
                        onChange={(e) => setSignupPassword(e.target.value)}
                        className="h-10 rounded-xl border-gray-200 bg-gray-50/50 pr-9 text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => setShowSignupPassword(!showSignupPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showSignupPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-gray-700 font-medium text-sm">Confirm <span className="text-red-500">*</span></Label>
                    <div className="relative">
                      <Input
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Re-enter"
                        value={signupConfirmPassword}
                        onChange={(e) => setSignupConfirmPassword(e.target.value)}
                        className="h-10 rounded-xl border-gray-200 bg-gray-50/50 pr-9 text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                {signupError && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-xl text-xs"
                  >
                    {signupError}
                  </motion.div>
                )}

                <Button
                  type="submit"
                disabled={isSignupLoading}
                  className="w-full h-11 bg-[#00A3E0] hover:bg-[#0090c7] text-white rounded-xl font-semibold text-sm gap-2 shadow-lg shadow-sky-500/20"
                >
                <UserPlus className="w-4 h-4" />
                {isSignupLoading ? "Creating account..." : "Create Account"}
                </Button>
              </motion.form>
            ) : (
              <motion.form
                key="otp"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                onSubmit={handleVerifyOtp}
                className="space-y-2"
              >
                <div className="text-center mb-1">
                  <h1 className="text-xl font-bold text-gray-900">Verify Account</h1>
                  <p className="text-gray-500 text-sm">
                    Enter the OTP sent to your email to activate your account.
                  </p>
                </div>

                <div className="space-y-1">
                  <Label className="text-gray-700 font-medium text-sm">Email</Label>
                  <Input
                    type="email"
                    value={otpEmail}
                    disabled
                    className="h-10 rounded-xl border-gray-200 bg-gray-50/70 text-sm"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-gray-700 font-medium text-sm">OTP Code</Label>
                  <Input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="Enter 6-digit OTP"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    className="h-10 rounded-xl border-gray-200 bg-gray-50/50 text-sm tracking-[0.3em] text-center"
                  />
                </div>

                {otpError && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-xl text-xs"
                  >
                    {otpError}
                  </motion.div>
                )}

                <div className="flex items-center justify-between text-xs text-gray-500">
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={!otpEmail || resendCooldown > 0 || isResendLoading}
                    className={`underline ${
                      resendCooldown > 0 || !otpEmail || isResendLoading
                        ? "text-gray-400 cursor-not-allowed"
                        : "text-blue-600 hover:text-blue-800"
                    }`}
                  >
                    {isResendLoading ? "Sending..." : "Resend OTP"}
                  </button>
                  {resendCooldown > 0 && (
                    <span>{`You can resend OTP in ${Math.floor(resendCooldown / 60)
                      .toString()
                      .padStart(1, "0")}:${(resendCooldown % 60).toString().padStart(2, "0")}`}</span>
                  )}
                </div>

                {signupError && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-amber-50 border border-amber-200 text-amber-700 px-3 py-2 rounded-xl text-xs"
                  >
                    {signupError}
                  </motion.div>
                )}

                <Button
                  type="submit"
                disabled={isOtpLoading}
                  className="w-full h-11 bg-[#1e3a8a] hover:bg-[#1e40af] text-white rounded-xl font-semibold text-sm gap-2 shadow-lg shadow-blue-900/20"
                >
                {isOtpLoading ? "Verifying..." : "Verify OTP"}
                </Button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>


      </motion.div>
    </div>
  );
}