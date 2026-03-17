import React, { useState } from "react";
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
  const [loginUserName, setLoginUserName] = useState("");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginEmployeeNumber, setLoginEmployeeNumber] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginRole, setLoginRole] = useState("user");
  const [loginDesignation, setLoginDesignation] = useState("");
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

  const teamTitle = team === "presales" ? "ESDS Presales Tender Tracker" : "ESDS Sales Tender Tracker";

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
        setLoginRole(p.role || "user");
        setLoginUserName(p.full_name || "");
        setLoginDesignation(p.designation || "");
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
      setLoginRole(p.role || "user");
      setLoginUserName(p.fullName || "");
      setLoginDesignation(p.designation || "");
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

    if (!loginEmail || !loginPassword || !loginEmployeeNumber) {
      setLoginError("Please enter email, employee number, and password");
      return;
    }

    if (loginRole !== "admin" && !loginDesignation) {
      setLoginError("Please select a designation");
      return;
    }

    if (!loginEmail.includes("@esds.co.in")) {
      setLoginError("Only @esds.co.in email addresses are allowed");
      return;
    }

    try {
      const res = await api.post("/auth/login", {
        email: loginEmail,
        password: loginPassword,
      });
      const { token, user } = res.data;
      localStorage.setItem("esds_token", token);
      const profile = user.profile || {};
      const userData = {
        email: user.email,
        employeeNumber: profile.employee_number || loginEmployeeNumber,
        designation: profile.designation || (loginRole === "team_lead" ? loginDesignation : ""),
        role: user.role || loginRole,
        team: profile.team || team,
        fullName:
          profile.full_name ||
          loginUserName ||
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
      setLoginError(err.response?.data?.message || "Login failed");
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setSignupError("");

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
      const res = await api.post("/auth/signup", {
        fullName: signupFullName,
        email: signupEmail,
        employeeNumber: signupEmployeeNumber,
        designation: signupDesignation,
        role: signupRole,
        team,
        password: signupPassword,
      });
      const { token, user } = res.data;
      localStorage.setItem("esds_token", token);
      const profile = user.profile || {};
      const userData = {
        email: user.email,
        employeeNumber: profile.employee_number || signupEmployeeNumber,
        designation: profile.designation || signupDesignation,
        role: user.role || signupRole,
        team: profile.team || team,
        fullName: profile.full_name || signupFullName,
      };
      localStorage.setItem("esds_user", JSON.stringify(userData));
      localStorage.setItem(`esds_profile_${signupEmail}`, JSON.stringify(userData));
      navigate(createPageUrl(`Dashboard?team=${team}`));
    } catch (e) {
      setSignupError(e.response?.data?.message || "Signup failed");
      return;
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
              onClick={() => setMode("login")}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                mode === "login"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setMode("signup")}
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
                  <Label className="text-gray-700 font-medium text-sm">Select Role</Label>
                  <Select value={loginRole} onValueChange={(val) => { setLoginRole(val); setLoginDesignation(""); setLoginUserName(""); }}>
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

                {loginRole !== "admin" && (
                  <>
                    <div className="space-y-1">
                      <Label className="text-gray-700 font-medium text-sm">User Name</Label>
                      <Input
                        type="text"
                        placeholder="Enter your full name"
                        value={loginUserName}
                        onChange={(e) => setLoginUserName(e.target.value)}
                        className="h-10 rounded-xl border-gray-200 bg-gray-50/50 text-sm"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-gray-700 font-medium text-sm">Designation</Label>
                      <Select value={loginDesignation} onValueChange={setLoginDesignation}>
                        <SelectTrigger className="h-10 rounded-xl border-gray-200 bg-gray-50/50 text-sm">
                          <SelectValue placeholder="Select designation" />
                        </SelectTrigger>
                        <SelectContent>
                          {designationOptions.map((d) => (
                            <SelectItem key={d} value={d}>{d}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}

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
                  className="w-full h-11 bg-[#1e3a8a] hover:bg-[#1e40af] text-white rounded-xl font-semibold text-sm gap-2 shadow-lg shadow-blue-900/20"
                >
                  <LogIn className="w-4 h-4" />
                  Sign In
                </Button>
              </motion.form>
            ) : (
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
                  className="w-full h-11 bg-[#00A3E0] hover:bg-[#0090c7] text-white rounded-xl font-semibold text-sm gap-2 shadow-lg shadow-sky-500/20"
                >
                  <UserPlus className="w-4 h-4" />
                  Create Account
                </Button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>


      </motion.div>
    </div>
  );
}