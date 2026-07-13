import React, { useState, useEffect, useRef } from "react";
import {
  Vote as VoteIcon,
  Users,
  Calendar,
  UserCheck,
  TrendingUp,
  Award,
  Download,
  Plus,
  Edit2,
  Trash2,
  Search,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Sliders,
  Shield,
  FileSpreadsheet,
  Clock,
  CheckCircle,
  AlertCircle,
  X,
  UploadCloud,
  FileText,
  User,
  History,
  Lock,
  Moon,
  Sun,
  RefreshCw,
  Eye,
  Check,
} from "lucide-react";
import {
  getStoredUser,
  getStoredToken,
  clearStoredAuth,
  loginElector,
  loginAdmin,
  getElections,
  createElection,
  updateElection,
  deleteElection,
  getCandidates,
  createCandidate,
  updateCandidate,
  deleteCandidate,
  getElectors,
  createElector,
  bulkUploadElectors,
  deleteElector,
  deleteAllElectors,
  castVote,
  getElectorVoteHistory,
  getDashboardStats,
  getElectionResults,
  getRemainingVotersReport,
} from "./api";
import {
  User as UserType,
  Election,
  Candidate,
  Elector,
  ElectorHistory,
  DashboardStats,
  ElectionResult,
} from "./types";

// ==========================================
// TOAST NOTIFICATIONS SYSTEM
// ==========================================
interface Toast {
  id: string;
  message: string;
  type: "success" | "error" | "info";
}

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserType | null>(getStoredUser());
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return localStorage.getItem("vote_theme") === "dark";
  });

  const [toasts, setToasts] = useState<Toast[]>([]);

  // Show Toast Utility
  const showToast = (message: string, type: "success" | "error" | "info" = "success") => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("vote_theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("vote_theme", "light");
    }
  }, [isDarkMode]);

  const handleLogout = () => {
    clearStoredAuth();
    setCurrentUser(null);
    showToast("Logged out successfully", "info");
  };

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-200 ${isDarkMode ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-900"}`}>
      {/* Top Navbar */}
      <nav className={`sticky top-0 z-40 border-b transition-colors duration-200 ${isDarkMode ? "bg-[#0F172A]/95 border-slate-800 backdrop-blur-md text-white" : "bg-white text-slate-900 border-slate-200 shadow-sm"}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="bg-[#2563EB] p-2.5 rounded-lg text-white shadow-sm flex items-center justify-center">
                <VoteIcon className="h-5.5 w-5.5" id="nav-logo-icon" />
              </div>
              <div>
                <span className="font-display font-bold text-sm sm:text-base leading-none tracking-tight block text-slate-950 dark:text-white">
                  UNI VOTE
                </span>
                <span className="text-[10px] uppercase tracking-widest text-[#2563EB] dark:text-blue-400 font-bold block mt-1">
                  University Election Portal
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Theme Toggle */}
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className={`p-2 rounded-lg transition-colors ${isDarkMode ? "hover:bg-slate-800 text-yellow-400" : "hover:bg-slate-100 text-slate-500 hover:text-slate-950"}`}
                title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
                id="theme-toggle-btn"
              >
                {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </button>

              {currentUser && (
                <div className={`flex items-center space-x-3 border-l pl-4 ${isDarkMode ? "border-slate-800" : "border-slate-200"}`}>
                  <div className="hidden sm:block text-right">
                    <p className={`text-xs font-semibold ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>{currentUser.name}</p>
                    <p className="text-[10px] text-[#2563EB] dark:text-blue-400 uppercase tracking-widest font-bold mt-0.5">
                      {currentUser.role === "admin" ? "Admin Portal" : `Elector • ${currentUser.registerNumber}`}
                    </p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg shadow-sm transition active:scale-95"
                    id="logout-btn"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    <span className="hidden md:inline">Logout</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Container */}
      <main className="flex-grow w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentUser ? (
          currentUser.role === "admin" ? (
            <AdminPortal isDarkMode={isDarkMode} showToast={showToast} />
          ) : (
            <ElectorPortal isDarkMode={isDarkMode} currentUser={currentUser} showToast={showToast} />
          )
        ) : (
          <AuthPortal setCurrentUser={setCurrentUser} isDarkMode={isDarkMode} showToast={showToast} />
        )}
      </main>

      {/* Footer */}
      <footer className={`mt-auto border-t py-6 transition-colors duration-200 ${isDarkMode ? "bg-[#0F172A]/80 border-slate-800 text-slate-400" : "bg-white border-slate-200 text-slate-500 shadow-xs"}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Dhanalakshmi Srinivasan University</span>
            <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">|</span>
            <span className="text-slate-500 dark:text-slate-400">University Election Portal</span>
          </div>
          <div className="text-slate-500 dark:text-slate-400 text-center sm:text-right font-medium">
            Designed by <span className="font-semibold text-blue-600 dark:text-blue-400">GJ Square</span> &copy; 2026
          </div>
        </div>
      </footer>

      {/* Toasts list */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col space-y-2 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`flex items-center space-x-3 p-4 rounded-xl shadow-lg border text-sm max-w-md animate-fade-in pointer-events-auto ${
              toast.type === "success"
                ? "bg-emerald-50 border-emerald-200 text-emerald-950 dark:bg-emerald-950/90 dark:border-emerald-800 dark:text-emerald-100"
                : toast.type === "error"
                ? "bg-rose-50 border-rose-200 text-rose-950 dark:bg-rose-950/90 dark:border-rose-800 dark:text-rose-100"
                : "bg-blue-50 border-blue-200 text-blue-950 dark:bg-blue-950/90 dark:border-blue-800 dark:text-blue-100"
            }`}
            id={`toast-${toast.id}`}
          >
            {toast.type === "success" && <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0" />}
            {toast.type === "error" && <AlertCircle className="h-5 w-5 text-rose-500 shrink-0" />}
            {toast.type === "info" && <Clock className="h-5 w-5 text-blue-500 shrink-0" />}
            <span className="font-medium">{toast.message}</span>
            <button
              onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
              className="ml-auto text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ==========================================
// PORTAL 1: AUTHENTICATION PORTAL (COMBINED)
// ==========================================
interface AuthPortalProps {
  setCurrentUser: (u: UserType) => void;
  isDarkMode: boolean;
  showToast: (m: string, t?: "success" | "error" | "info") => void;
}

function AuthPortal({ setCurrentUser, isDarkMode, showToast }: AuthPortalProps) {
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("DSU");
  const [adminPassword, setAdminPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Set default password based on portal toggle
  useEffect(() => {
    if (!isAdminMode) {
      setPassword("DSU");
    } else {
      setUsername("");
    }
  }, [isAdminMode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isAdminMode) {
        const response = await loginAdmin(username.trim(), adminPassword);
        setCurrentUser(response.user);
        showToast(`Welcome back, Administrator ${response.user.name}!`, "success");
      } else {
        const response = await loginElector(username.trim(), password);
        setCurrentUser(response.user);
        showToast(`Welcome, ${response.user.name}! You are logged in successfully.`, "success");
      }
    } catch (err: any) {
      showToast(err.message || "Invalid credentials", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto my-12 animate-fade-in" id="auth-portal-card">
      <div className={`rounded-2xl border overflow-hidden shadow-xl transition-all duration-200 ${isDarkMode ? "bg-[#0F172A] border-slate-800" : "bg-white border-slate-200"}`}>
        {/* Decorative Top header */}
        <div className="bg-gradient-to-r from-[#0F172A] to-[#1E3A8A] text-white px-6 py-9 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-[#2563EB]/10 mix-blend-color-dodge"></div>
          <VoteIcon className="h-10 w-10 mx-auto text-blue-400 mb-2.5" />
          <h2 className="font-display font-bold text-2xl tracking-tight uppercase">UNI VOTE</h2>
          <p className="text-xs text-slate-300 font-sans tracking-wide">University Election Portal</p>
        </div>

        {/* Auth Mode Tabs */}
        <div className={`flex border-b ${isDarkMode ? "border-slate-800 bg-slate-950/50" : "border-slate-100 bg-slate-50"}`}>
          <button
            onClick={() => setIsAdminMode(false)}
            className={`w-1/2 py-4 text-xs uppercase tracking-widest font-bold transition-all duration-200 flex items-center justify-center space-x-2 border-b-2 ${
              !isAdminMode
                ? "border-[#2563EB] text-[#2563EB] dark:text-blue-400 bg-transparent"
                : "border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            }`}
            id="elector-portal-tab"
          >
            <User className="h-4 w-4" />
            <span>Elector Portal</span>
          </button>
          <button
            onClick={() => setIsAdminMode(true)}
            className={`w-1/2 py-4 text-xs uppercase tracking-widest font-bold transition-all duration-200 flex items-center justify-center space-x-2 border-b-2 ${
              isAdminMode
                ? "border-[#2563EB] text-[#2563EB] dark:text-blue-400 bg-transparent"
                : "border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            }`}
            id="admin-portal-tab"
          >
            <Shield className="h-4 w-4" />
            <span>Admin Portal</span>
          </button>
        </div>

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-2">
                {isAdminMode ? "Admin Username" : "Register Number / Username"}
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className={`w-full px-4 py-3 pl-10 rounded-xl text-sm border focus:outline-none focus:ring-2 focus:ring-[#2563EB]/50 transition ${
                    isDarkMode
                      ? "bg-slate-950 border-slate-800 text-white placeholder-slate-600"
                      : "bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400"
                  }`}
                  placeholder={isAdminMode ? "Enter admin username..." : "e.g., 101, 102..."}
                  id="auth-username-input"
                />
                <User className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
              </div>
            </div>

            {!isAdminMode ? (
              <div>
                <label className="block text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-2">
                  Elector Password
                </label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`w-full px-4 py-3 pl-10 rounded-xl text-sm border focus:outline-none focus:ring-2 focus:ring-[#2563EB]/50 transition ${
                      isDarkMode
                        ? "bg-slate-950 border-slate-800 text-slate-300"
                        : "bg-slate-100 border-slate-200 text-slate-700"
                    }`}
                    placeholder="Enter default password..."
                    id="auth-password-input"
                  />
                  <Lock className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                </div>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-2 font-medium">
                  * Notice: The default voting access password for all electors is <span className="font-bold text-[#2563EB]">DSU</span>.
                </p>
              </div>
            ) : (
              <div>
                <label className="block text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-2">
                  Admin Password
                </label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    className={`w-full px-4 py-3 pl-10 rounded-xl text-sm border focus:outline-none focus:ring-2 focus:ring-[#2563EB]/50 transition ${
                      isDarkMode
                        ? "bg-slate-950 border-slate-800 text-white"
                        : "bg-white border-slate-200 text-slate-900"
                    }`}
                    placeholder="Enter secure password (e.g. admin123)..."
                    id="auth-admin-password-input"
                  />
                  <Lock className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                </div>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-[#2563EB] hover:bg-[#1D4ED8] disabled:bg-[#2563EB]/60 text-white font-semibold rounded-xl text-sm shadow-md hover:shadow-[#2563EB]/25 active:scale-[0.98] transition-all duration-150 flex items-center justify-center space-x-2"
            id="auth-submit-btn"
          >
            {loading ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Authenticating...</span>
              </>
            ) : (
              <>
                <span>Secure Login</span>
                <Shield className="h-4 w-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

// ==========================================
// COUNTDOWN TIMER COMPONENT
// ==========================================
interface CountdownProps {
  endDate: string;
  onEnd?: () => void;
}

function CountdownTimer({ endDate, onEnd }: CountdownProps) {
  const [timeLeft, setTimeLeft] = useState<{ d: number; h: number; m: number; s: number } | null>(null);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = +new Date(endDate) - +new Date();
      if (difference <= 0) {
        setTimeLeft(null);
        if (onEnd) onEnd();
        return;
      }

      setTimeLeft({
        d: Math.floor(difference / (1000 * 60 * 60 * 24)),
        h: Math.floor((difference / (1000 * 60 * 60)) % 24),
        m: Math.floor((difference / 1000 / 60) % 60),
        s: Math.floor((difference / 1000) % 60),
      });
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(interval);
  }, [endDate, onEnd]);

  if (!timeLeft) {
    return (
      <span className="inline-flex items-center space-x-1 text-xs text-rose-500 font-bold bg-rose-500/10 px-2.5 py-1 rounded-full">
        <Clock className="h-3.5 w-3.5 animate-pulse" />
        <span>ELECTION ENDED</span>
      </span>
    );
  }

  return (
    <div className="flex items-center space-x-2 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-lg text-amber-600 dark:text-amber-400 font-mono text-xs font-semibold">
      <Clock className="h-4 w-4 shrink-0 animate-pulse text-amber-500" />
      <span>ENDS IN:</span>
      <span className="text-slate-700 dark:text-slate-300">
        {timeLeft.d > 0 && `${timeLeft.d}d `}
        {String(timeLeft.h).padStart(2, "0")}h {String(timeLeft.m).padStart(2, "0")}m {String(timeLeft.s).padStart(2, "0")}s
      </span>
    </div>
  );
}

// ==========================================
// PORTAL 2: ELECTOR PORTAL
// ==========================================
interface ElectorPortalProps {
  currentUser: UserType;
  isDarkMode: boolean;
  showToast: (m: string, t?: "success" | "error" | "info") => void;
}

function ElectorPortal({ currentUser, isDarkMode, showToast }: ElectorPortalProps) {
  const [activeTab, setActiveTab] = useState<"elections" | "history" | "profile">("elections");
  const [elections, setElections] = useState<Election[]>([]);
  const [loading, setLoading] = useState(true);
  const [votedHistory, setVotedHistory] = useState<ElectorHistory[]>([]);
  
  // Selection States for Voting
  const [selectedElection, setSelectedElection] = useState<Election | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [candidateFilter, setCandidateFilter] = useState("");
  const [confirmCandidate, setConfirmCandidate] = useState<Candidate | null>(null);
  const [votingLoading, setVotingLoading] = useState(false);

  const fetchElectorData = async () => {
    setLoading(true);
    try {
      const elecList = await getElections();
      // Filter out upcoming and sort: active first, then closed
      elecList.sort((a, b) => {
        if (a.status === "Active" && b.status !== "Active") return -1;
        if (a.status !== "Active" && b.status === "Active") return 1;
        return new Date(b.endDate).getTime() - new Date(a.endDate).getTime();
      });
      setElections(elecList);

      const history = await getElectorVoteHistory();
      setVotedHistory(history);
    } catch (e: any) {
      showToast(e.message || "Failed to load elector dashboard data", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchElectorData();
  }, []);

  const handleSelectElection = async (election: Election) => {
    if (election.status !== "Active") {
      showToast("Voting is only allowed for active elections.", "info");
      return;
    }
    if (election.hasVoted) {
      showToast("You have already voted in this election.", "error");
      return;
    }

    try {
      const candList = await getCandidates(election.id);
      setCandidates(candList);
      setSelectedElection(election);
      setCandidateFilter("");
    } catch (e: any) {
      showToast(e.message || "Failed to retrieve candidates", "error");
    }
  };

  const handleConfirmVoteClick = (candidate: Candidate) => {
    setConfirmCandidate(candidate);
  };

  const submitVote = async () => {
    if (!selectedElection || !confirmCandidate) return;
    setVotingLoading(true);

    try {
      await castVote(selectedElection.id, confirmCandidate.id);
      showToast("Vote Submitted Successfully!", "success");
      
      // Close modal and clear selection
      setConfirmCandidate(null);
      setSelectedElection(null);
      
      // Refresh elector data
      await fetchElectorData();
    } catch (e: any) {
      showToast(e.message || "Failed to submit vote", "error");
    } finally {
      setVotingLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <RefreshCw className="h-10 w-10 text-blue-600 animate-spin" />
        <p className="text-slate-500 font-medium">Loading elector workspace...</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
      {/* Left Sidebar Menu */}
      <div className="lg:col-span-1 space-y-4">
        <div className={`p-6 rounded-2xl border transition-all ${isDarkMode ? "bg-[#0F172A] border-slate-800" : "bg-white border-slate-200 shadow-sm"}`}>
          <div className="flex flex-col items-center text-center space-y-3 pb-5 border-b border-slate-100 dark:border-slate-800">
            <div className="h-16 w-16 bg-blue-50 dark:bg-slate-950 rounded-full flex items-center justify-center text-[#2563EB] dark:text-blue-400 font-bold text-xl font-display shadow-inner border border-blue-100 dark:border-slate-800">
              {currentUser.name.split(" ").map(w => w[0]).join("")}
            </div>
            <div>
              <h3 className="font-display font-bold text-base leading-tight">{currentUser.name}</h3>
              <p className="font-mono text-xs text-slate-500 dark:text-slate-400 mt-1">Reg: {currentUser.registerNumber}</p>
            </div>
          </div>

          <div className="space-y-1.5 mt-5">
            <button
              onClick={() => { setActiveTab("elections"); setSelectedElection(null); }}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-semibold whitespace-nowrap transition-all duration-150 ${
                activeTab === "elections" && !selectedElection
                  ? "bg-[#2563EB]/10 text-[#2563EB] dark:bg-[#2563EB]/25 dark:text-blue-400"
                  : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50"
              }`}
              id="btn-available-elections"
            >
              <VoteIcon className="h-4.5 w-4.5" />
              <span>Available Elections</span>
            </button>

            <button
              onClick={() => { setActiveTab("history"); setSelectedElection(null); }}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-semibold whitespace-nowrap transition-all duration-150 ${
                activeTab === "history"
                  ? "bg-[#2563EB]/10 text-[#2563EB] dark:bg-[#2563EB]/25 dark:text-blue-400"
                  : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50"
              }`}
              id="btn-vote-history"
            >
              <History className="h-4.5 w-4.5" />
              <span>Vote History</span>
            </button>

            <button
              onClick={() => { setActiveTab("profile"); setSelectedElection(null); }}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-semibold whitespace-nowrap transition-all duration-150 ${
                activeTab === "profile"
                  ? "bg-[#2563EB]/10 text-[#2563EB] dark:bg-[#2563EB]/25 dark:text-blue-400"
                  : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50"
              }`}
              id="btn-elector-profile"
            >
              <User className="h-4.5 w-4.5" />
              <span>My Profile</span>
            </button>
          </div>
        </div>

        {/* Informative widget */}
        <div className={`p-5 rounded-2xl border ${isDarkMode ? "bg-[#0F172A] border-slate-800 text-white" : "bg-white border-slate-200 text-slate-900 shadow-sm"}`}>
          <h4 className={`text-xs uppercase font-bold tracking-widest ${isDarkMode ? "text-blue-400" : "text-blue-600"}`}>Secured Voting</h4>
          <p className={`text-[11px] mt-2.5 leading-relaxed font-medium ${isDarkMode ? "text-slate-300" : "text-slate-600"}`}>
            Every elector account gets one vote per election. Double voting and data manipulation are strictly prohibited. Your vote is stored in encrypted ledgers.
          </p>
        </div>
      </div>

      {/* Main Content Pane */}
      <div className="lg:col-span-3">
        {selectedElection ? (
          /* ACTIVE VOTING MODE */
          <div className="space-y-6 animate-fade-in" id="active-voting-canvas">
            {/* Back to list button */}
            <button
              onClick={() => setSelectedElection(null)}
              className="inline-flex items-center space-x-2 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline mb-2"
              id="back-to-elections-btn"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Back to Elections List</span>
            </button>

            {/* Election Title Banner */}
            <div className={`p-6 sm:p-8 rounded-2xl border transition-colors ${isDarkMode ? "bg-[#0F172A] border-slate-800" : "bg-white border-slate-200 shadow-sm"}`}>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <span className="inline-flex items-center text-[10px] tracking-wider uppercase font-extrabold text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-950/50 px-2.5 py-1 rounded-full mb-3">
                    Active Election
                  </span>
                  <h2 className="font-display font-extrabold text-2xl tracking-tight leading-snug">{selectedElection.title}</h2>
                  <p className="text-xs text-slate-500 mt-2 max-w-xl">{selectedElection.description}</p>
                </div>
                <div className="shrink-0">
                  <CountdownTimer endDate={selectedElection.endDate} />
                </div>
              </div>
            </div>

            {/* Search and Candidate Cards Layout */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-display font-bold text-lg">Contesting Candidates</h3>
                <div className="relative w-64">
                  <input
                    type="text"
                    value={candidateFilter}
                    onChange={(e) => setCandidateFilter(e.target.value)}
                    className={`w-full px-4 py-2 pl-9 rounded-xl text-xs border focus:outline-none focus:ring-1 focus:ring-[#2563EB]/50 transition ${
                      isDarkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-900 shadow-sm"
                    }`}
                    placeholder="Search candidates..."
                    id="search-candidates-input"
                  />
                  <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                </div>
              </div>

              {candidates.length === 0 ? (
                <div className={`p-10 text-center rounded-2xl border ${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
                  <Users className="h-10 w-10 mx-auto text-slate-400 mb-2" />
                  <p className="text-sm font-medium text-slate-500">No candidates available for this election yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {candidates
                    .filter(c => c.name.toLowerCase().includes(candidateFilter.toLowerCase()) || c.registerNumber.toLowerCase().includes(candidateFilter.toLowerCase()))
                    .map((candidate) => (
                      <div
                        key={candidate.id}
                        className={`p-5 rounded-2xl border flex items-center justify-between hover:scale-[1.01] transition-all duration-200 ${
                          isDarkMode ? "bg-[#0F172A] border-slate-800 hover:border-slate-700" : "bg-white border-slate-200 hover:border-blue-200 hover:shadow-lg shadow-sm"
                        }`}
                        id={`candidate-card-${candidate.id}`}
                      >
                        <div className="flex items-center space-x-4">
                          {candidate.photo ? (
                            <img
                              src={candidate.photo}
                              alt={candidate.name}
                              className="h-12 w-12 object-cover rounded-xl border border-blue-100 dark:border-slate-800"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="h-12 w-12 bg-blue-50 dark:bg-slate-950 rounded-xl flex items-center justify-center border border-blue-100 dark:border-slate-800 text-blue-600 dark:text-blue-400 font-bold text-lg font-display">
                              {candidate.name.charAt(0)}
                            </div>
                          )}
                          <div>
                            <h4 className="font-bold text-sm text-slate-900 dark:text-white leading-snug">{candidate.name}</h4>
                            <p className="font-mono text-[10px] text-slate-400 mt-1">Candidate ID: {candidate.registerNumber}</p>
                          </div>
                        </div>

                        <button
                          onClick={() => handleConfirmVoteClick(candidate)}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md transition active:scale-95 flex items-center space-x-1.5"
                          id={`vote-btn-${candidate.id}`}
                        >
                          <VoteIcon className="h-3.5 w-3.5" />
                          <span>Cast Vote</span>
                        </button>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* STANDARD TAB PANELS */
          <div className="animate-fade-in">
            {activeTab === "elections" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b pb-4 border-slate-100 dark:border-slate-800">
                  <div>
                    <h2 className="font-display font-extrabold text-2xl tracking-tight">University Elections</h2>
                    <p className="text-xs text-slate-500 mt-1">Review active, upcoming, and past student body elections.</p>
                  </div>
                  <button onClick={fetchElectorData} className="p-2 border rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
                    <RefreshCw className="h-4 w-4 text-slate-500" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {elections.map((election) => {
                    const isActive = election.status === "Active";
                    const isUpcoming = election.status === "Upcoming";
                    const isClosed = election.status === "Closed";

                    return (
                      <div
                        key={election.id}
                        className={`rounded-2xl border flex flex-col p-6 transition-all duration-200 ${
                          isDarkMode ? "bg-[#0F172A] border-slate-800" : "bg-white border-slate-200 shadow-sm"
                        } ${isActive && !election.hasVoted ? "ring-2 ring-[#2563EB]/30" : ""}`}
                        id={`election-grid-item-${election.id}`}
                      >
                        <div className="flex justify-between items-start">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase ${
                              isActive
                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                : isUpcoming
                                ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                                : "bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                            }`}
                          >
                            {election.status}
                          </span>
                          
                          {isActive && <CountdownTimer endDate={election.endDate} />}
                        </div>

                        <h3 className="font-display font-bold text-base mt-4 text-slate-900 dark:text-white leading-snug">
                          {election.title}
                        </h3>

                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 flex-grow leading-relaxed">
                          {election.description || "No description provided."}
                        </p>

                        <div className="grid grid-cols-2 gap-4 border-t border-b border-slate-50 dark:border-slate-800 py-3 my-4 text-[11px] font-medium text-slate-500">
                          <div>
                            <span className="block text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Starts At</span>
                            <span className="text-slate-800 dark:text-slate-200 mt-0.5 block">
                              {new Date(election.startDate).toLocaleDateString()} {new Date(election.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <div>
                            <span className="block text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Ends At</span>
                            <span className="text-slate-800 dark:text-slate-200 mt-0.5 block">
                              {new Date(election.endDate).toLocaleDateString()} {new Date(election.endDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between mt-2 pt-1">
                          <div className="flex items-center space-x-1.5 text-xs text-slate-500">
                            <Users className="h-4 w-4 text-slate-400" />
                            <span>{election.candidatesCount} Candidates Contesting</span>
                          </div>

                          {isActive ? (
                            election.hasVoted ? (
                              <button
                                disabled
                                className="px-4 py-2 bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 text-xs font-bold rounded-xl flex items-center space-x-1.5 cursor-not-allowed"
                                id={`voted-badge-${election.id}`}
                              >
                                <CheckCircle className="h-4 w-4" />
                                <span>Voted Successfully</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => handleSelectElection(election)}
                                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md transition active:scale-95 flex items-center space-x-1"
                                id={`enter-vote-${election.id}`}
                              >
                                <span>Enter Voting Room</span>
                                <ChevronRight className="h-4 w-4" />
                              </button>
                            )
                          ) : isUpcoming ? (
                            <button
                              disabled
                              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-400 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 cursor-not-allowed"
                            >
                              Opens Soon
                            </button>
                          ) : (
                            <div className="inline-flex items-center text-xs text-slate-400 font-semibold bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
                              Closed
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {activeTab === "history" && (
              <div className="space-y-6">
                <div>
                  <h2 className="font-display font-extrabold text-2xl tracking-tight">Your Vote Audit Trail</h2>
                  <p className="text-xs text-slate-500 mt-1">Review your active participation log and securely confirm submission keys.</p>
                </div>

                {votedHistory.length === 0 ? (
                  <div className={`p-12 text-center rounded-2xl border ${isDarkMode ? "bg-[#0F172A] border-slate-800" : "bg-white border-slate-200 shadow-sm"}`}>
                    <VoteIcon className="h-12 w-12 mx-auto text-slate-300 dark:text-slate-700 mb-3" />
                    <h3 className="font-display font-bold text-base text-slate-600 dark:text-slate-400">No Votes Cast Yet</h3>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                      You haven't participated in any active elections yet. Browse available elections above to cast your secure vote!
                    </p>
                  </div>
                ) : (
                  <div className={`rounded-2xl border overflow-hidden ${isDarkMode ? "bg-[#0F172A] border-slate-800" : "bg-white border-slate-200 shadow-sm"}`}>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className={`border-b text-xs font-bold uppercase tracking-wider text-slate-400 ${isDarkMode ? "bg-slate-950/50 border-slate-800" : "bg-slate-50 border-slate-100"}`}>
                            <th className="py-4 px-6">Election / Title</th>
                            <th className="py-4 px-6">Candidate Selected</th>
                            <th className="py-4 px-6">Date & Time Cast</th>
                            <th className="py-4 px-6 text-center">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                          {votedHistory.map((item) => (
                            <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                              <td className="py-4 px-6 font-semibold">{item.electionTitle}</td>
                              <td className="py-4 px-6">
                                <span className="inline-flex items-center space-x-1 bg-blue-500/5 text-blue-600 dark:text-blue-400 px-2.5 py-1 rounded-lg border border-blue-500/10 font-semibold text-xs">
                                  {item.candidateName}
                                </span>
                              </td>
                              <td className="py-4 px-6 font-mono text-xs text-slate-500">
                                {new Date(item.votedAt).toLocaleString()}
                              </td>
                              <td className="py-4 px-6 text-center">
                                <span className="inline-flex items-center space-x-1 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
                                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                                  <span>Verified & Audited</span>
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === "profile" && (
              <div className="space-y-6">
                <div>
                  <h2 className="font-display font-extrabold text-2xl tracking-tight">Elector Identity Profile</h2>
                  <p className="text-xs text-slate-500 mt-1">Official credentials and register metadata verification.</p>
                </div>

                <div className={`p-8 rounded-2xl border ${isDarkMode ? "bg-[#0F172A] border-slate-800" : "bg-white border-slate-200 shadow-sm"} max-w-xl`}>
                  <div className="flex items-center space-x-6 pb-6 border-b border-slate-100 dark:border-slate-800">
                    <div className="h-20 w-20 bg-blue-600/10 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center font-bold text-3xl font-display shadow-inner shrink-0">
                      {currentUser.name.split(" ").map(w => w[0]).join("")}
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-xl">{currentUser.name}</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-widest font-extrabold mt-1">Student Elector</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6 pt-6 text-sm">
                    <div>
                      <span className="block text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Register / Roll Number</span>
                      <span className="text-slate-800 dark:text-slate-200 font-mono font-bold text-base mt-1 block">
                        {currentUser.registerNumber}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Assigned Institution</span>
                      <span className="text-blue-600 dark:text-blue-400 font-bold text-base mt-1 block">
                        Dhanalakshmi Srinivasan University
                      </span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Security Clearance</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold text-base mt-1 block">
                        Active Elector
                      </span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Total Ballots Cast</span>
                      <span className="text-blue-600 dark:text-blue-400 font-bold text-base mt-1 block">
                        {votedHistory.length}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* CONFIRMATION POPUP DIALOG */}
      {confirmCandidate && selectedElection && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" id="vote-confirmation-modal">
          <div className={`w-full max-w-md p-6 rounded-2xl border shadow-2xl animate-fade-in ${
            isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
          }`}>
            <div className="text-center pb-4 border-b border-slate-100 dark:border-slate-800">
              <VoteIcon className="h-12 w-12 mx-auto text-blue-600 mb-3" />
              <h3 className="font-display font-bold text-lg text-slate-900 dark:text-white">Confirm Your Vote</h3>
              <p className="text-xs text-slate-400 mt-1">This operation is secure and irreversible.</p>
            </div>

            <div className="my-6 p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 space-y-3">
              <div>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Election</span>
                <span className="block text-sm font-bold text-slate-900 dark:text-white mt-0.5">{selectedElection.title}</span>
              </div>
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Candidate Selected</span>
                <div className="flex items-center space-x-2 mt-1">
                  {confirmCandidate.photo ? (
                    <img
                      src={confirmCandidate.photo}
                      alt={confirmCandidate.name}
                      className="h-7 w-7 object-cover rounded-md"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="h-7 w-7 bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 rounded-md flex items-center justify-center text-xs font-bold font-display">
                      {confirmCandidate.name.charAt(0)}
                    </div>
                  )}
                  <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{confirmCandidate.name}</span>
                </div>
              </div>
            </div>

            <div className="bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs rounded-xl p-3 mb-6 leading-relaxed flex items-start space-x-2">
              <AlertCircle className="h-4.5 w-4.5 shrink-0 text-amber-500 mt-0.5" />
              <span>Are you sure you want to vote for this candidate? You cannot change your decision or vote again in this election.</span>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setConfirmCandidate(null)}
                className="w-1/2 py-3 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-semibold rounded-xl text-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition active:scale-95"
                id="btn-confirm-no"
              >
                NO, CANCEL
              </button>
              <button
                onClick={submitVote}
                disabled={votingLoading}
                className="w-1/2 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-semibold rounded-xl text-xs shadow-md transition active:scale-95 flex items-center justify-center space-x-1"
                id="btn-confirm-yes"
              >
                {votingLoading ? (
                  <>
                    <RefreshCw className="h-3 w-3 animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <span>YES, SUBMIT</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// PORTAL 3: ADMIN PORTAL
// ==========================================
interface AdminPortalProps {
  isDarkMode: boolean;
  showToast: (m: string, t?: "success" | "error" | "info") => void;
}

type AdminTab = "dashboard" | "elections" | "candidates" | "electors" | "results" | "remaining_voters" | "settings";

function AdminPortal({ isDarkMode, showToast }: AdminPortalProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>("dashboard");
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [elections, setElections] = useState<Election[]>([]);
  const [loading, setLoading] = useState(true);

  // Elections state
  const [editingElection, setEditingElection] = useState<Partial<Election> | null>(null);
  const [isElectionModalOpen, setIsElectionModalOpen] = useState(false);

  // Candidates state
  const [selectedElectionForCandidates, setSelectedElectionForCandidates] = useState<string>("");
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [editingCandidate, setEditingCandidate] = useState<Partial<Candidate> | null>(null);
  const [isCandidateModalOpen, setIsCandidateModalOpen] = useState(false);
  const [isDraggingPhoto, setIsDraggingPhoto] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  // Electors state
  const [electorsList, setElectorsList] = useState<Elector[]>([]);
  const [totalElectors, setTotalElectors] = useState(0);
  const [electorPage, setElectorPage] = useState(1);
  const [electorSearch, setElectorSearch] = useState("");
  const [isElectorModalOpen, setIsElectorModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [electorName, setElectorName] = useState("");
  const [electorRegNum, setElectorRegNum] = useState("");
  const [bulkTextInput, setBulkTextInput] = useState("");

  // Results state
  const [selectedResultElection, setSelectedResultElection] = useState<string>("");
  const [electionResult, setElectionResult] = useState<ElectionResult | null>(null);

  // Remaining Voters state
  const [selectedReportElection, setSelectedReportElection] = useState<string>("");
  const [reportData, setReportData] = useState<any | null>(null);
  const [reportSearchQuery, setReportSearchQuery] = useState("");
  const [reportCurrentPage, setReportCurrentPage] = useState(1);
  const [reportLoading, setReportLoading] = useState(false);

  // Custom Deletion Confirmation Modal state
  const [deleteConfirmInfo, setDeleteConfirmInfo] = useState<{
    type: "election" | "candidate" | "elector" | "all_electors";
    id: string;
    title: string;
    description: string;
  } | null>(null);

  // Load Dashboard/Admin data
  const loadAdminDashboardData = async () => {
    setLoading(true);
    try {
      const dashboardStats = await getDashboardStats();
      setStats(dashboardStats);

      const elecList = await getElections();
      setElections(elecList);

      if (elecList.length > 0) {
        if (!selectedElectionForCandidates) {
          setSelectedElectionForCandidates(elecList[0].id);
        }
        if (!selectedResultElection) {
          setSelectedResultElection(elecList[0].id);
        }
        if (!selectedReportElection) {
          setSelectedReportElection(elecList[0].id);
        }
      }
    } catch (e: any) {
      showToast(e.message || "Failed to retrieve administrator statistics", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminDashboardData();
  }, [activeTab]);

  // Load candidates specifically when election changes
  useEffect(() => {
    if (selectedElectionForCandidates) {
      fetchCandidatesForAdmin();
    }
  }, [selectedElectionForCandidates]);

  // Load results specifically when selection changes
  useEffect(() => {
    if (selectedResultElection) {
      fetchResultsForAdmin();
    }
  }, [selectedResultElection]);

  // Load remaining voters report when selection changes
  useEffect(() => {
    if (selectedReportElection) {
      fetchRemainingVotersReport();
    }
  }, [selectedReportElection]);

  // Fetch report when activeTab becomes 'remaining_voters'
  useEffect(() => {
    if (activeTab === "remaining_voters") {
      if (elections.length > 0 && !selectedReportElection) {
        setSelectedReportElection(elections[0].id);
      } else if (selectedReportElection) {
        fetchRemainingVotersReport();
      }
    }
  }, [activeTab]);

  const fetchCandidatesForAdmin = async () => {
    try {
      const list = await getCandidates(selectedElectionForCandidates);
      setCandidates(list);
    } catch (e: any) {
      showToast("Failed to load candidates", "error");
    }
  };

  const fetchResultsForAdmin = async () => {
    try {
      const res = await getElectionResults(selectedResultElection);
      setElectionResult(res);
    } catch (e: any) {
      showToast("Failed to fetch results", "error");
    }
  };

  const fetchRemainingVotersReport = async () => {
    if (!selectedReportElection) return;
    setReportLoading(true);
    try {
      const res = await getRemainingVotersReport(selectedReportElection);
      setReportData(res);
    } catch (e: any) {
      showToast("Failed to fetch remaining voters report", "error");
    } finally {
      setReportLoading(false);
    }
  };

  const triggerRemainingVotersDownload = () => {
    if (!selectedReportElection) return;
    const token = getStoredToken();
    window.open(`/api/reports/remaining-voters/${selectedReportElection}/export?authorization=${token}`, "_blank");
    showToast("Generating remaining voters report spreadsheet and initiating secure download...", "success");
  };

  // Elector Search & Pagination Fetch
  useEffect(() => {
    if (activeTab === "electors") {
      fetchElectorsForAdmin();
    }
  }, [electorPage, electorSearch, activeTab]);

  const fetchElectorsForAdmin = async () => {
    try {
      const res = await getElectors(electorPage, 10, electorSearch);
      setElectorsList(res.electors);
      setTotalElectors(res.total);
    } catch (e: any) {
      showToast("Failed to load electors", "error");
    }
  };

  // ==========================================
  // ELECTION ACTIONS
  // ==========================================
  const handleOpenElectionModal = (election?: Election) => {
    if (election) {
      setEditingElection(election);
    } else {
      setEditingElection({
        title: "",
        description: "",
        startDate: new Date().toISOString().substring(0, 16),
        endDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().substring(0, 16),
        status: "Upcoming",
      });
    }
    setIsElectionModalOpen(true);
  };

  const handleSaveElection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingElection || !editingElection.title || !editingElection.startDate || !editingElection.endDate) return;

    try {
      if (editingElection.id) {
        await updateElection(editingElection.id, {
          title: editingElection.title,
          description: editingElection.description,
          startDate: editingElection.startDate,
          endDate: editingElection.endDate,
          status: editingElection.status,
        });
        showToast("Election Updated Successfully", "success");
      } else {
        await createElection({
          title: editingElection.title,
          description: editingElection.description || "",
          startDate: editingElection.startDate,
          endDate: editingElection.endDate,
          status: editingElection.status || "Upcoming",
        });
        showToast("Election Created Successfully", "success");
      }
      setIsElectionModalOpen(false);
      loadAdminDashboardData();
    } catch (err: any) {
      showToast(err.message || "Failed to save election", "error");
    }
  };

  const handleDeleteElectionClick = (id: string) => {
    const election = elections.find((e) => e.id === id);
    setDeleteConfirmInfo({
      type: "election",
      id,
      title: election ? election.title : "this election",
      description: "ALL contesting candidates and recorded votes will be permanently purged.",
    });
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmInfo) return;
    const { type, id } = deleteConfirmInfo;
    try {
      if (type === "election") {
        await deleteElection(id);
        showToast("Election and all linked resources deleted", "success");
        loadAdminDashboardData();
      } else if (type === "candidate") {
        await deleteCandidate(id);
        showToast("Candidate successfully removed", "success");
        fetchCandidatesForAdmin();
      } else if (type === "elector") {
        await deleteElector(id);
        showToast("Elector deleted successfully", "success");
        fetchElectorsForAdmin();
      } else if (type === "all_electors") {
        await deleteAllElectors();
        showToast("All electors deleted successfully", "success");
        fetchElectorsForAdmin();
        loadAdminDashboardData();
      }
    } catch (err: any) {
      showToast(err.message || `Failed to delete ${type}`, "error");
    } finally {
      setDeleteConfirmInfo(null);
    }
  };

  const handleDeleteAllElectorsClick = () => {
    setDeleteConfirmInfo({
      type: "all_electors",
      id: "all",
      title: "ALL Student Electors",
      description: "This will permanently purge EVERY single elector from the database, along with any votes they have cast.",
    });
  };

  const handleManualStatusToggle = async (election: Election, status: "Active" | "Closed" | "Upcoming") => {
    try {
      await updateElection(election.id, { status });
      showToast(`Election status updated to ${status}`, "success");
      loadAdminDashboardData();
    } catch (err: any) {
      showToast("Failed to switch status", "error");
    }
  };

  // ==========================================
  // CANDIDATE ACTIONS
  // ==========================================
  const handlePhotoUpload = (file: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      showToast("Only image files are allowed", "error");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast("Image must be smaller than 5MB", "error");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      if (editingCandidate) {
        setEditingCandidate({ ...editingCandidate, photo: base64 });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingPhoto(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingPhoto(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingPhoto(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handlePhotoUpload(e.dataTransfer.files[0]);
    }
  };

  const handleOpenCandidateModal = (candidate?: Candidate) => {
    if (candidate) {
      setEditingCandidate(candidate);
    } else {
      setEditingCandidate({
        name: "",
        registerNumber: "",
        electionId: selectedElectionForCandidates,
        photo: "",
      });
    }
    setIsCandidateModalOpen(true);
  };

  const handleSaveCandidate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCandidate || !editingCandidate.name || !editingCandidate.registerNumber || !editingCandidate.electionId) return;

    try {
      if (editingCandidate.id) {
        await updateCandidate(editingCandidate.id, {
          name: editingCandidate.name,
          registerNumber: editingCandidate.registerNumber,
          photo: editingCandidate.photo || "",
        });
        showToast("Candidate edited successfully", "success");
      } else {
        await createCandidate({
          name: editingCandidate.name,
          registerNumber: editingCandidate.registerNumber,
          electionId: editingCandidate.electionId,
          photo: editingCandidate.photo || "",
        });
        showToast("Candidate registered successfully", "success");
      }
      setIsCandidateModalOpen(false);
      fetchCandidatesForAdmin();
    } catch (err: any) {
      showToast(err.message || "Operation failed", "error");
    }
  };

  const handleDeleteCandidateClick = (id: string) => {
    const candidate = candidates.find((c) => c.id === id);
    setDeleteConfirmInfo({
      type: "candidate",
      id,
      title: candidate ? candidate.name : "this candidate",
      description: "Any votes cast for them will also be permanently removed.",
    });
  };

  // ==========================================
  // ELECTOR ACTIONS
  // ==========================================
  const handleSaveElector = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!electorName || !electorRegNum) return;

    try {
      await createElector({ name: electorName, registerNumber: electorRegNum });
      showToast("Elector manually enrolled with default pass 'DSU'", "success");
      setElectorName("");
      setElectorRegNum("");
      setIsElectorModalOpen(false);
      fetchElectorsForAdmin();
    } catch (err: any) {
      showToast(err.message || "Registration failed", "error");
    }
  };

  const handleDeleteElectorClick = (id: string) => {
    const elector = electorsList.find((el) => el.id === id);
    setDeleteConfirmInfo({
      type: "elector",
      id,
      title: elector ? elector.name : "this elector",
      description: "Their associated vote keys will be permanently removed.",
    });
  };

  const handleBulkEnrollment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkTextInput.trim()) return;

    const parsedElectors: Array<{ name: string; registerNumber: string }> = [];
    const lines = bulkTextInput.split("\n");
    
    lines.forEach((line) => {
      const parts = line.split(",");
      if (parts.length >= 2) {
        const reg = parts[0].trim();
        const name = parts.slice(1).join(",").trim();
        if (reg && name) {
          parsedElectors.push({ registerNumber: reg, name });
        }
      }
    });

    if (parsedElectors.length === 0) {
      showToast("Invalid CSV format. Please structure: 'RegisterNumber, Candidate Name'", "error");
      return;
    }

    try {
      const res = await bulkUploadElectors(parsedElectors);
      showToast(res.message, "success");
      setBulkTextInput("");
      setIsBulkModalOpen(false);
      fetchElectorsForAdmin();
    } catch (err: any) {
      showToast("Bulk enrollment failed", "error");
    }
  };

  // DragnDrop file reader
  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      parseCSVFile(file);
    }
  };

  const handleFileSelectChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      parseCSVFile(file);
    }
  };

  const parseCSVFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        setBulkTextInput(text);
        showToast("CSV contents loaded. Review and click Enroll below.", "info");
      }
    };
    reader.readAsText(file);
  };

  // Excel trigger helper
  const triggerExcelDownload = () => {
    if (!selectedResultElection) return;
    const token = getStoredToken();
    window.open(`/api/results/${selectedResultElection}/export?authorization=${token}`, "_blank");
    showToast("Generating result spreadsheet and initiating secure download...", "success");
  };

  const filteredRemainingVoters = reportData
    ? reportData.remainingVoters.filter((v: any) =>
        v.name.toLowerCase().includes(reportSearchQuery.toLowerCase()) ||
        v.registerNumber.toLowerCase().includes(reportSearchQuery.toLowerCase())
      )
    : [];

  const itemsPerPage = 10;
  const totalReportPages = Math.ceil(filteredRemainingVoters.length / itemsPerPage);
  const paginatedRemainingVoters = filteredRemainingVoters.slice(
    (reportCurrentPage - 1) * itemsPerPage,
    reportCurrentPage * itemsPerPage
  );

  if (loading && !stats) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <RefreshCw className="h-10 w-10 text-blue-600 animate-spin" />
        <p className="text-slate-500 font-medium">Loading administrator interface...</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
      {/* LEFT SIDEBAR NAVIGATION */}
      <div className="lg:col-span-1 space-y-4 w-full">
        <div className={`p-4 sm:p-5 rounded-2xl border transition-all ${isDarkMode ? "bg-[#0F172A] border-slate-800" : "bg-white border-slate-200 shadow-sm"}`}>
          <div className="flex items-center space-x-2.5 pb-3 lg:pb-4 mb-3 lg:mb-4 border-b border-slate-100 dark:border-slate-800">
            <Shield className="h-5 w-5 text-[#2563EB] dark:text-blue-400 shrink-0" />
            <h3 className="font-display font-bold text-sm tracking-tight uppercase">Admin Panel</h3>
          </div>

          <div className="space-y-1">
            {[
              { id: "dashboard", label: "Dashboard", icon: TrendingUp },
              { id: "elections", label: "Elections", icon: Calendar },
              { id: "candidates", label: "Candidates", icon: Users },
              { id: "electors", label: "Electors", icon: UserCheck },
              { id: "results", label: "Results", icon: Award },
              { id: "remaining_voters", label: "Remaining Voters", icon: FileSpreadsheet },
              { id: "settings", label: "Settings", icon: Sliders },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as AdminTab)}
                  className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all duration-150 ${
                    activeTab === tab.id
                      ? "bg-[#2563EB]/10 text-[#2563EB] dark:bg-[#2563EB]/25 dark:text-blue-400"
                      : "text-slate-500 hover:text-slate-900 hover:bg-slate-50 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800/50"
                  }`}
                  id={`admin-sidebar-${tab.id}`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Quick Statistics Widget */}
        <div className={`p-4 rounded-2xl border ${isDarkMode ? "bg-[#0F172A] border-slate-800" : "bg-blue-50/50 border-blue-100 shadow-sm"}`}>
          <span className="text-[10px] text-[#2563EB] dark:text-blue-400 uppercase font-bold tracking-widest block">System Status</span>
          <div className="mt-3 flex items-center justify-between text-xs font-semibold">
            <span className="text-slate-500">Database Engine</span>
            <span className="text-emerald-500 flex items-center space-x-1">
              <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
              <span>Online</span>
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs font-semibold">
            <span className="text-slate-500">Auto-Auditing</span>
            <span className="text-blue-600 dark:text-blue-400">Armed</span>
          </div>
        </div>
      </div>

      {/* RIGHT WORKSPACE SPACE */}
      <div className="lg:col-span-3">
        {/* TAB 1: DASHBOARD STATS */}
        {activeTab === "dashboard" && stats && (
          <div className="space-y-8 animate-fade-in" id="dashboard-tab-panel">
            <div>
              <h2 className="font-display font-extrabold text-2xl tracking-tight text-black dark:text-black">University Voting Analytics</h2>
              <p className="text-xs text-slate-500 mt-1">Real-time telemetry, elector turnout, and operational logs.</p>
            </div>

            {/* Grid stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {[
                { title: "Total Registered Voters", count: stats.totalElectors, icon: UserCheck, color: "text-[#2563EB] bg-[#2563EB]/10 dark:bg-blue-950/40" },
                { title: "Total Elections", count: stats.totalElections, icon: Calendar, color: "text-indigo-600 bg-indigo-100/60 dark:bg-indigo-950/40" },
                { title: "Contesting Candidates", count: stats.totalCandidates, icon: Users, color: "text-purple-600 bg-purple-100/60 dark:bg-purple-950/40" },
                { title: "Total Votes Cast", count: stats.totalVotesCast, icon: VoteIcon, color: "text-[#22C55E] bg-[#22C55E]/10 dark:bg-emerald-950/40" },
                { title: "Remaining Voters", count: stats.pendingVoters, icon: Clock, color: "text-amber-600 bg-amber-100/60 dark:bg-amber-950/40" },
                { title: "Voting Percentage", count: `${stats.votingPercentage}%`, icon: TrendingUp, color: "text-rose-600 bg-rose-100/60 dark:bg-rose-950/40" },
              ].map((card, idx) => {
                const Icon = card.icon;
                return (
                  <div
                    key={idx}
                    className={`p-5 rounded-2xl border transition-all duration-200 ${isDarkMode ? "bg-[#0F172A] border-slate-800" : "bg-white border-slate-200 shadow-sm hover:shadow-md"}`}
                    id={`stat-card-${idx}`}
                  >
                    <div className="flex justify-between items-start">
                      <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">{card.title}</span>
                      <div className={`p-1.5 rounded-lg ${card.color}`}>
                        <Icon className="h-4.5 w-4.5" />
                      </div>
                    </div>
                    <p className="font-display font-extrabold text-2xl mt-4 tracking-tight text-black dark:text-black">
                      {card.count}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Dynamic Charts & Turnout Indicator */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Turnout Gauge card */}
              <div className={`md:col-span-1 p-6 rounded-2xl border flex flex-col justify-between ${isDarkMode ? "bg-[#0F172A] border-slate-800" : "bg-white border-slate-200 shadow-sm"}`}>
                <div>
                  <h3 className="font-display font-bold text-sm tracking-tight mb-1">Participation Turnout</h3>
                  <p className="text-[10px] text-slate-400 font-medium">Turnout average across running elections.</p>
                </div>

                <div className="my-6 flex justify-center relative">
                  {/* Custom SVG Circular Gauge */}
                  <svg className="w-36 h-36">
                    <circle cx="72" cy="72" r="54" className="stroke-slate-100 dark:stroke-slate-800/80" strokeWidth="12" fill="transparent" />
                    <circle
                      cx="72"
                      cy="72"
                      r="54"
                      className="stroke-[#2563EB]"
                      strokeWidth="12"
                      fill="transparent"
                      strokeDasharray="339.2"
                      strokeDashoffset={339.2 - (339.2 * stats.votingPercentage) / 100}
                      strokeLinecap="round"
                      transform="rotate(-90 72 72)"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="font-display font-extrabold text-2xl text-black dark:text-black">{stats.votingPercentage}%</span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Turnout</span>
                  </div>
                </div>

                <div className="text-center text-xs text-slate-500 font-medium">
                  <span className="font-semibold text-[#22C55E]">{stats.totalVotesCast} cast</span> out of <span className="font-semibold text-[#2563EB]">{stats.totalElectors} electors</span>.
                </div>
              </div>

              {/* Recent System Activity Logs */}
              <div className={`md:col-span-2 p-6 rounded-2xl border flex flex-col justify-between ${isDarkMode ? "bg-[#0F172A] border-slate-800" : "bg-white border-slate-200 shadow-sm"}`}>
                <div>
                  <h3 className="font-display font-bold text-sm tracking-tight mb-2">Live Activity Log</h3>
                  <p className="text-[10px] text-slate-400 font-medium mb-4">Latest cryptographically recorded electoral events.</p>
                </div>

                {stats.recentActivity.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-10">No electoral activity recorded yet.</p>
                ) : (
                  <div className="space-y-3 max-h-[220px] overflow-y-auto pr-2">
                    {stats.recentActivity.map((act, index) => (
                      <div
                        key={index}
                        className={`flex items-center justify-between p-2.5 rounded-xl border text-xs ${
                          isDarkMode ? "bg-slate-950/60 border-slate-800/50" : "bg-slate-50 border-slate-100"
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          <span
                            className={`p-1 rounded-md shrink-0 ${
                              act.type === "vote_cast" ? "bg-[#22C55E]/15 text-[#22C55E]" : "bg-[#2563EB]/15 text-[#2563EB]"
                            }`}
                          >
                            {act.type === "vote_cast" ? <Check className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                          </span>
                          <div>
                            <p className="font-bold">
                              {act.type === "vote_cast" ? `Ballot Cast: ${act.electorName} (${act.electorReg})` : `New Ballot Created`}
                            </p>
                            <p className="text-[10px] text-slate-400 font-bold mt-0.5">{act.electionTitle}</p>
                            {act.type === "vote_cast" && act.candidateName && (
                              <p className="text-[10px] text-slate-500 font-bold mt-0.5">
                                Selected Candidate: <span className="text-blue-600 dark:text-blue-400">{act.candidateName}</span>
                              </p>
                            )}
                          </div>
                        </div>
                        <span className="text-[9px] font-mono text-slate-400 shrink-0 font-bold">
                          {new Date(act.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: ELECTIONS MANAGEMENT */}
        {activeTab === "elections" && (
          <div className="space-y-6 animate-fade-in" id="elections-tab-panel">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-4 border-slate-100 dark:border-slate-800">
              <div>
                <h2 className="font-display font-extrabold text-2xl tracking-tight">Election Management</h2>
                <p className="text-xs text-slate-500 mt-1">Create, edit, delete, and manually activate student elections.</p>
              </div>
              <button
                onClick={() => handleOpenElectionModal()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md transition active:scale-95 flex items-center space-x-1.5 self-start sm:self-auto"
                id="btn-add-election"
              >
                <Plus className="h-4 w-4" />
                <span>Create Election</span>
              </button>
            </div>

            {elections.length === 0 ? (
              <div className={`p-16 text-center rounded-2xl border ${isDarkMode ? "bg-[#0F172A] border-slate-800" : "bg-white border-slate-200 shadow-sm"}`}>
                <Calendar className="h-12 w-12 mx-auto text-slate-300 dark:text-slate-700 mb-3" />
                <h3 className="font-display font-bold text-base text-slate-600 dark:text-slate-400">No Elections Created</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Click the "Create Election" button to launch your university's first student-body voting ballot!
                </p>
              </div>
            ) : (
              <div className={`rounded-2xl border overflow-hidden ${isDarkMode ? "bg-[#0F172A] border-slate-800" : "bg-white border-slate-200 shadow-sm"}`}>
                {/* Desktop and Tablet Table view */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className={`border-b text-xs font-bold uppercase tracking-wider text-slate-400 ${isDarkMode ? "bg-slate-950/50 border-slate-800" : "bg-slate-50 border-slate-100"}`}>
                        <th className="py-4 px-6">Election Title</th>
                        <th className="py-4 px-6">Schedule Dates</th>
                        <th className="py-4 px-6">Status</th>
                        <th className="py-4 px-6">Contestants</th>
                        <th className="py-4 px-6 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                      {elections.map((el) => (
                        <tr key={el.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                          <td className="py-4 px-6">
                            <p className="font-bold text-slate-900 dark:text-white leading-snug">{el.title}</p>
                            <p className="text-[10px] text-slate-400 truncate max-w-[200px] mt-0.5">{el.description || "No description."}</p>
                          </td>
                          <td className="py-4 px-6 font-mono text-[10px] space-y-0.5">
                            <p><span className="text-slate-400 uppercase tracking-widest font-bold">Start:</span> {new Date(el.startDate).toLocaleString()}</p>
                            <p><span className="text-slate-400 uppercase tracking-widest font-bold">End:</span> {new Date(el.endDate).toLocaleString()}</p>
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center space-x-1.5">
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                                  el.status === "Active"
                                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                    : el.status === "Upcoming"
                                    ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                                    : "bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                                }`}
                              >
                                {el.status}
                              </span>
                            </div>
                          </td>
                          <td className="py-4 px-6 font-semibold">{el.candidatesCount} Candidates</td>
                          <td className="py-4 px-6 text-right space-x-1">
                            {/* Manual control buttons */}
                            {el.status === "Upcoming" && (
                              <button
                                onClick={() => handleManualStatusToggle(el, "Active")}
                                className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded"
                                title="Force Launch/Activate"
                                id={`force-launch-${el.id}`}
                              >
                                LAUNCH
                              </button>
                            )}
                            {el.status === "Active" && (
                              <button
                                onClick={() => handleManualStatusToggle(el, "Closed")}
                                className="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded"
                                title="Force Terminate/Close"
                                id={`force-close-${el.id}`}
                              >
                                CLOSE
                              </button>
                            )}
                            <button
                              onClick={() => handleOpenElectionModal(el)}
                              className="p-1.5 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 rounded"
                              title="Edit"
                              id={`edit-election-${el.id}`}
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteElectionClick(el.id)}
                              className="p-1.5 border border-rose-200 hover:bg-rose-50 text-rose-600 rounded"
                              title="Delete"
                              id={`delete-election-${el.id}`}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards view */}
                <div className="block md:hidden divide-y divide-slate-100 dark:divide-slate-800">
                  {elections.map((el) => (
                    <div key={el.id} className="p-4 space-y-3">
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white text-xs leading-snug">{el.title}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-2">{el.description || "No description."}</p>
                        </div>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase shrink-0 ${
                            el.status === "Active"
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                              : el.status === "Upcoming"
                              ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                              : "bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                          }`}
                        >
                          {el.status}
                        </span>
                      </div>
                      <div className="bg-slate-50/50 dark:bg-slate-950/40 p-2.5 rounded-xl font-mono text-[9px] space-y-0.5 text-slate-500 dark:text-slate-400">
                        <p><span className="text-slate-400 font-bold uppercase">Start:</span> {new Date(el.startDate).toLocaleString()}</p>
                        <p><span className="text-slate-400 font-bold uppercase">End:</span> {new Date(el.endDate).toLocaleString()}</p>
                      </div>
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[11px] font-semibold text-slate-500">{el.candidatesCount} Candidates</span>
                        <div className="flex items-center space-x-1">
                          {el.status === "Upcoming" && (
                            <button
                              onClick={() => handleManualStatusToggle(el, "Active")}
                              className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[9px] font-extrabold rounded uppercase"
                              id={`force-launch-mob-${el.id}`}
                            >
                              LAUNCH
                            </button>
                          )}
                          {el.status === "Active" && (
                            <button
                              onClick={() => handleManualStatusToggle(el, "Closed")}
                              className="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white text-[9px] font-extrabold rounded uppercase"
                              id={`force-close-mob-${el.id}`}
                            >
                              CLOSE
                            </button>
                          )}
                          <button
                            onClick={() => handleOpenElectionModal(el)}
                            className="p-1.5 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 rounded"
                            id={`edit-election-mob-${el.id}`}
                          >
                            <Edit2 className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() => handleDeleteElectionClick(el.id)}
                            className="p-1.5 border border-rose-200 hover:bg-rose-50 text-rose-600 rounded"
                            id={`delete-election-mob-${el.id}`}
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: CANDIDATE MANAGEMENT */}
        {activeTab === "candidates" && (
          <div className="space-y-6 animate-fade-in" id="candidates-tab-panel">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-4 border-slate-100 dark:border-slate-800">
              <div>
                <h2 className="font-display font-extrabold text-2xl tracking-tight">Candidate Management</h2>
                <p className="text-xs text-slate-500 mt-1">Register candidates to contesting election ballots.</p>
              </div>
              <button
                onClick={() => handleOpenCandidateModal()}
                disabled={elections.length === 0}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-xs font-bold rounded-xl shadow-md transition active:scale-95 flex items-center space-x-1.5 self-start sm:self-auto"
                id="btn-add-candidate"
              >
                <Plus className="h-4 w-4" />
                <span>Add Candidate</span>
              </button>
            </div>

            {/* Select active election */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:space-x-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider shrink-0">Select Election:</span>
              <select
                value={selectedElectionForCandidates}
                onChange={(e) => setSelectedElectionForCandidates(e.target.value)}
                className={`w-full sm:w-auto px-3 py-2 text-xs font-semibold rounded-xl border focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                  isDarkMode ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-800"
                }`}
                id="election-selector-dropdown"
              >
                {elections.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.title} ({e.status})
                  </option>
                ))}
              </select>
            </div>

            {candidates.length === 0 ? (
              <div className={`p-16 text-center rounded-2xl border ${isDarkMode ? "bg-[#0F172A] border-slate-800" : "bg-white border-slate-200 shadow-sm"}`}>
                <Users className="h-12 w-12 mx-auto text-slate-300 dark:text-slate-700 mb-3" />
                <h3 className="font-display font-bold text-base text-slate-600 dark:text-slate-400">No Candidates Registered</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Select an election above and click "Add Candidate" to register candidate contestants!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {candidates.map((cand) => (
                  <div
                    key={cand.id}
                    className={`p-5 rounded-2xl border flex items-center justify-between ${
                      isDarkMode ? "bg-[#0F172A] border-slate-800" : "bg-white border-slate-200 shadow-sm"
                    }`}
                    id={`candidate-item-${cand.id}`}
                  >
                    <div className="flex items-center space-x-4">
                      {cand.photo ? (
                        <img
                          src={cand.photo}
                          alt={cand.name}
                          className="h-10 w-10 object-cover rounded-lg border border-slate-200 dark:border-slate-800"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="h-10 w-10 bg-slate-100 dark:bg-slate-950 text-blue-600 dark:text-blue-400 font-bold text-base font-display rounded-lg flex items-center justify-center">
                          {cand.name.charAt(0)}
                        </div>
                      )}
                      <div>
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white">{cand.name}</h4>
                        <p className="font-mono text-[10px] text-slate-400 mt-0.5">Register: {cand.registerNumber}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-1.5">
                      <button
                        onClick={() => handleOpenCandidateModal(cand)}
                        className="p-1.5 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 rounded"
                        title="Edit Candidate"
                        id={`edit-candidate-${cand.id}`}
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteCandidateClick(cand.id)}
                        className="p-1.5 border border-rose-200 hover:bg-rose-50 text-rose-600 rounded"
                        title="Delete Candidate"
                        id={`delete-candidate-${cand.id}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: ELECTOR MANAGEMENT */}
        {activeTab === "electors" && (
          <div className="space-y-6 animate-fade-in" id="electors-tab-panel">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-4 border-slate-100 dark:border-slate-800">
              <div>
                <h2 className="font-display font-extrabold text-2xl tracking-tight">Elector Database</h2>
                <p className="text-xs text-slate-500 mt-1">Enroll electors manually or upload rosters using Excel CSV drag-and-drop.</p>
              </div>
              <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto sm:justify-end">
                <button
                  onClick={() => setIsBulkModalOpen(true)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl shadow-sm transition active:scale-95 flex items-center space-x-1.5 whitespace-nowrap"
                  id="btn-bulk-import"
                >
                  <UploadCloud className="h-4 w-4" />
                  <span>Bulk Import</span>
                </button>
                <button
                  onClick={() => setIsElectorModalOpen(true)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md transition active:scale-95 flex items-center space-x-1.5 whitespace-nowrap"
                  id="btn-add-elector"
                >
                  <Plus className="h-4 w-4" />
                  <span>Enroll Elector</span>
                </button>
                <button
                  onClick={handleDeleteAllElectorsClick}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-md transition active:scale-95 flex items-center space-x-1.5 whitespace-nowrap"
                  id="btn-clear-all-electors"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Clear All Electors</span>
                </button>
              </div>
            </div>

            {/* Search Box */}
            <div className="relative">
              <input
                type="text"
                value={electorSearch}
                onChange={(e) => { setElectorSearch(e.target.value); setElectorPage(1); }}
                className={`w-full px-4 py-3 pl-10 rounded-xl text-xs border focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                  isDarkMode ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-800 shadow-sm"
                }`}
                placeholder="Search electors by Name or Register Number..."
                id="search-electors-input"
              />
              <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
            </div>

            {electorsList.length === 0 ? (
              <div className={`p-16 text-center rounded-2xl border ${isDarkMode ? "bg-[#0F172A] border-slate-800" : "bg-white border-slate-200 shadow-sm"}`}>
                <UserCheck className="h-12 w-12 mx-auto text-slate-300 dark:text-slate-700 mb-3" />
                <h3 className="font-display font-bold text-base text-slate-600 dark:text-slate-400">No Electors Found</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Try adjusting your search criteria, or enroll electors using the buttons above.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className={`rounded-2xl border overflow-hidden ${isDarkMode ? "bg-[#0F172A] border-slate-800" : "bg-white border-slate-200 shadow-sm"}`}>
                  {/* Desktop and Tablet table */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className={`border-b text-xs font-bold uppercase tracking-wider text-slate-400 ${isDarkMode ? "bg-slate-950/50 border-slate-800" : "bg-slate-50 border-slate-100"}`}>
                          <th className="py-4 px-6">Elector Name</th>
                          <th className="py-4 px-6">Register Number</th>
                          <th className="py-4 px-6">Access Password</th>
                          <th className="py-4 px-6">Date Enrolled</th>
                          <th className="py-4 px-6 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                        {electorsList.map((el) => (
                          <tr key={el.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                            <td className="py-4 px-6 font-bold">{el.name}</td>
                            <td className="py-4 px-6 font-mono font-medium text-blue-600 dark:text-blue-400">{el.registerNumber}</td>
                            <td className="py-4 px-6 font-mono text-[10px] text-slate-400">DSU (default)</td>
                            <td className="py-4 px-6 text-slate-500">{new Date(el.createdAt).toLocaleDateString()}</td>
                            <td className="py-4 px-6 text-right">
                              <button
                                onClick={() => handleDeleteElectorClick(el.id)}
                                className="p-1.5 border border-rose-200 hover:bg-rose-50 text-rose-600 rounded"
                                title="Delete Elector"
                                id={`delete-elector-${el.id}`}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile electors cards */}
                  <div className="block md:hidden divide-y divide-slate-100 dark:divide-slate-800">
                    {electorsList.map((el) => (
                      <div key={el.id} className="p-4 flex items-center justify-between text-xs gap-4">
                        <div className="space-y-1">
                          <p className="font-bold text-slate-900 dark:text-white">{el.name}</p>
                          <div className="flex items-center space-x-2">
                            <span className="font-mono text-[10px] font-bold text-blue-600 dark:text-blue-400">Reg: {el.registerNumber}</span>
                            <span className="text-[10px] text-slate-400">•</span>
                            <span className="text-[10px] text-slate-400">DSU</span>
                          </div>
                          <p className="text-[10px] text-slate-400">{new Date(el.createdAt).toLocaleDateString()}</p>
                        </div>
                        <button
                          onClick={() => handleDeleteElectorClick(el.id)}
                          className="p-1.5 border border-rose-200 hover:bg-rose-50 text-rose-600 rounded shrink-0"
                          title="Delete Elector"
                          id={`delete-elector-mob-${el.id}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Pagination Controls */}
                {totalElectors > 10 && (
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      Showing {(electorPage - 1) * 10 + 1}-{Math.min(electorPage * 10, totalElectors)} of {totalElectors} electors
                    </span>
                    <div className="flex space-x-1">
                      <button
                        onClick={() => setElectorPage((prev) => Math.max(1, prev - 1))}
                        disabled={electorPage === 1}
                        className="p-2 border rounded-xl disabled:opacity-50 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
                        id="btn-pagination-prev"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setElectorPage((prev) => prev + 1)}
                        disabled={electorPage * 10 >= totalElectors}
                        className="p-2 border rounded-xl disabled:opacity-50 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
                        id="btn-pagination-next"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 5: RESULTS & EXCEL EXPORTS */}
        {activeTab === "results" && (
          <div className="space-y-6 animate-fade-in" id="results-tab-panel">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-4 border-slate-100 dark:border-slate-800">
              <div>
                <h2 className="font-display font-extrabold text-2xl tracking-tight">Electoral Audits & Results</h2>
                <p className="text-xs text-slate-500 mt-1">Review live vote margins, declared winners, and download Excel audits.</p>
              </div>
              <button
                onClick={triggerExcelDownload}
                disabled={!selectedResultElection}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white text-xs font-bold rounded-xl shadow-md transition active:scale-95 flex items-center space-x-1.5 self-start sm:self-auto"
                id="btn-export-excel"
              >
                <Download className="h-4 w-4" />
                <span>Export Excel</span>
              </button>
            </div>

            {/* Select results election */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:space-x-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider shrink-0">Select Election:</span>
              <select
                value={selectedResultElection}
                onChange={(e) => setSelectedResultElection(e.target.value)}
                className={`w-full sm:w-auto px-3 py-2 text-xs font-semibold rounded-xl border focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                  isDarkMode ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-800"
                }`}
                id="results-election-selector"
              >
                {elections.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.title} ({e.status})
                  </option>
                ))}
              </select>
            </div>

            {electionResult ? (
              <div className="space-y-6">
                {/* Info and Winner Cards Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Total votes */}
                  <div className={`p-5 rounded-2xl border ${isDarkMode ? "bg-[#0F172A] border-slate-800" : "bg-white border-slate-200 shadow-sm"}`}>
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Total Votes Audited</span>
                    <p className="font-display font-extrabold text-3xl mt-2 text-[#2563EB] dark:text-blue-400">
                      {electionResult.totalVotes}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-2 font-semibold">Votes cast securely in this election.</p>
                  </div>

                  {/* Declared Winner */}
                  <div className={`rounded-2xl md:col-span-2 overflow-hidden transition-all duration-200 ${
                    electionResult.totalVotes > 0 && electionResult.winner && !electionResult.winner.isTie
                      ? "bg-[#2563EB] text-white p-6 shadow-md relative"
                      : isDarkMode ? "bg-[#0F172A] border border-slate-800 p-5" : "bg-white border border-slate-200 shadow-sm p-5"
                  }`}>
                    {electionResult.totalVotes === 0 ? (
                      <>
                        <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Declared Status / Winner</span>
                        <p className="font-display font-bold text-lg mt-3 text-slate-400">No votes recorded yet.</p>
                      </>
                    ) : electionResult.winner ? (
                      electionResult.winner.isTie ? (
                        <>
                          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Declared Status / Winner</span>
                          <div className="flex items-center space-x-3 mt-3">
                            <div className="p-2 bg-amber-100 dark:bg-amber-950/50 rounded-xl text-amber-600">
                              <Award className="h-6 w-6 animate-pulse" />
                            </div>
                            <div>
                              <p className="font-bold text-sm text-amber-600">Tie Declared</p>
                              <p className="text-[11px] text-slate-400 mt-0.5">Tied contestants: {electionResult.winner.tiedCandidates?.join(", ")}</p>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="flex flex-col sm:flex-row items-center justify-between h-full gap-4 relative">
                          <div className="absolute -right-2 -bottom-4 opacity-10 pointer-events-none">
                            <Award className="w-32 h-32" />
                          </div>
                          <div className="flex items-center space-x-4 z-10">
                            <div className="w-16 h-16 rounded-full border-2 border-white/25 p-0.5 shrink-0">
                              <div className="w-full h-full rounded-full bg-white/10 flex items-center justify-center text-lg font-bold">
                                {electionResult.winner.name.split(" ").map(w => w[0]).join("")}
                              </div>
                            </div>
                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/85 mb-0.5">Current Leading Winner</p>
                              <h2 className="text-xl font-bold font-display leading-tight">{electionResult.winner.name}</h2>
                              <p className="text-[10px] font-mono opacity-75 mt-0.5">#{electionResult.winner.registerNumber}</p>
                            </div>
                          </div>
                          <div className="bg-white/10 rounded-lg p-3 shrink-0 text-right w-full sm:w-auto z-10">
                            <p className="text-[9px] uppercase font-bold tracking-wider opacity-75">Votes Secured</p>
                            <p className="text-2xl font-black font-display leading-none mt-1">{electionResult.winner.voteCount}</p>
                            <p className="text-[10px] font-medium opacity-80 mt-1">{electionResult.winner.percentage}% of total share</p>
                          </div>
                        </div>
                      )
                    ) : (
                      <>
                        <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Declared Status / Winner</span>
                        <p className="font-display font-bold text-lg mt-3 text-slate-400">Awaiting ballots...</p>
                      </>
                    )}
                  </div>
                </div>

                {electionResult.candidates.length === 0 ? (
                  <div className={`p-10 text-center rounded-2xl border ${isDarkMode ? "bg-[#0F172A] border-slate-800" : "bg-white border-slate-200"}`}>
                    <p className="text-xs text-slate-500 font-medium">No contestants registered for this election results query.</p>
                  </div>
                ) : (
                  /* ANALYTICS CHARTS SECTION */
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Horizontal Bar Chart (SVG) */}
                    <div className={`p-6 rounded-2xl border ${isDarkMode ? "bg-[#0F172A] border-slate-800" : "bg-white border-slate-200 shadow-sm"}`}>
                      <h3 className="font-display font-bold text-sm tracking-tight mb-4">Ballot Tally Comparison</h3>
                      <div className="space-y-4">
                        {electionResult.candidates.map((cand) => (
                          <div key={cand.id} className="space-y-1.5">
                            <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                              <span>{cand.name} ({cand.registerNumber})</span>
                              <span>{cand.voteCount} votes ({cand.percentage}%)</span>
                            </div>
                            <div className="h-3 w-full bg-slate-100 dark:bg-slate-950 rounded-full overflow-hidden border border-slate-50 dark:border-slate-800">
                              <div
                                className="h-full bg-[#2563EB] rounded-full transition-all duration-500"
                                style={{ width: `${cand.percentage}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Proportional Percentage Share (SVG Pie/Donut Chart) */}
                    <div className={`p-6 rounded-2xl border flex flex-col justify-start space-y-4 ${isDarkMode ? "bg-[#0F172A] border-slate-800" : "bg-white border-slate-200 shadow-sm"}`}>
                      <div>
                        <h3 className="font-display font-bold text-sm tracking-tight mb-1">Percentage Share</h3>
                        <p className="text-[10px] text-slate-400 font-medium">Distribution of voter selections.</p>
                      </div>

                      {electionResult.totalVotes === 0 ? (
                        <p className="text-xs text-slate-400 text-center py-10">No chart data available yet.</p>
                      ) : (
                        <div className="my-4 flex flex-col sm:flex-row items-center justify-around gap-4">
                          {/* Beautiful stacked percentage visualizer donut style or layered rings */}
                          <div className="flex flex-col space-y-2 w-full max-w-xs justify-center">
                            {electionResult.candidates.map((cand, idx) => {
                              const colors = [
                                "bg-[#2563EB]",
                                "bg-[#22C55E]",
                                "bg-purple-500",
                                "bg-amber-500",
                                "bg-pink-500",
                              ];
                              const colorClass = colors[idx % colors.length];
                              return (
                                <div key={cand.id} className="flex items-center justify-between text-xs font-medium">
                                  <div className="flex items-center space-x-2">
                                    <span className={`h-2.5 w-2.5 rounded-full ${colorClass}`}></span>
                                    <span className="text-slate-600 dark:text-slate-300">{cand.name}</span>
                                  </div>
                                  <span className="font-mono text-slate-400 font-bold">{cand.percentage}%</span>
                                </div>
                              );
                            })}
                          </div>
                          <div className="h-28 w-28 shrink-0 flex items-center justify-center relative bg-slate-100 dark:bg-slate-950 rounded-full border dark:border-slate-800 shadow-inner">
                            <span className="font-display font-extrabold text-[10px] uppercase tracking-wider text-slate-400">Audited</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-500">Loading election metrics...</p>
            )}
          </div>
        )}

        {/* TAB: REMAINING VOTERS REPORT */}
        {activeTab === "remaining_voters" && (
          <div className="space-y-6 animate-fade-in" id="remaining-voters-tab-panel">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-4 border-slate-100 dark:border-slate-800">
              <div>
                <h2 className="font-display font-extrabold text-2xl tracking-tight text-slate-900 dark:text-white">Remaining Voters</h2>
                <p className="text-xs text-slate-500 mt-1">Identify and track electors who have not yet voted in active or concluded elections.</p>
              </div>
              <button
                onClick={triggerRemainingVotersDownload}
                disabled={!selectedReportElection || !reportData || reportData.remainingVoters.length === 0}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:dark:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-md transition active:scale-95 flex items-center space-x-1.5 self-start sm:self-auto disabled:cursor-not-allowed"
                id="btn-export-remaining"
              >
                <FileSpreadsheet className="h-4 w-4" />
                <span>Export to Excel</span>
              </button>
            </div>

            {/* Select report election */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:space-x-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider shrink-0">Select Election:</span>
              <select
                value={selectedReportElection}
                onChange={(e) => {
                  setSelectedReportElection(e.target.value);
                  setReportSearchQuery("");
                  setReportCurrentPage(1);
                }}
                className={`w-full sm:w-auto px-3 py-2 text-xs font-semibold rounded-xl border focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                  isDarkMode ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-800"
                }`}
                id="reports-election-selector"
              >
                {elections.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.title} ({e.status})
                  </option>
                ))}
              </select>
            </div>

            {reportLoading ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-4">
                <RefreshCw className="h-8 w-8 text-blue-600 animate-spin" />
                <p className="text-xs text-slate-500 font-medium">Calculating remaining voters in real time...</p>
              </div>
            ) : reportData ? (
              <div className="space-y-6">
                {/* Real-time stats cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { title: "Total Registered Voters", count: reportData.stats.totalRegistered, icon: UserCheck, color: "text-[#2563EB] bg-[#2563EB]/10 dark:bg-blue-950/40" },
                    { title: "Total Votes Cast", count: reportData.stats.totalVotesCast, icon: VoteIcon, color: "text-[#22C55E] bg-[#22C55E]/10 dark:bg-emerald-950/40" },
                    { title: "Remaining Voters", count: reportData.stats.remainingCount, icon: Clock, color: "text-amber-600 bg-amber-100/60 dark:bg-amber-950/40" },
                    { title: "Voting Percentage", count: `${reportData.stats.votingPercentage}%`, icon: TrendingUp, color: "text-rose-600 bg-rose-100/60 dark:bg-rose-950/40" },
                  ].map((card, idx) => {
                    const Icon = card.icon;
                    return (
                      <div
                        key={idx}
                        className={`p-4 rounded-2xl border transition-all duration-200 ${isDarkMode ? "bg-[#0F172A] border-slate-800" : "bg-white border-slate-200 shadow-sm"}`}
                        id={`report-stat-card-${idx}`}
                      >
                        <div className="flex justify-between items-start">
                          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">{card.title}</span>
                          <div className={`p-1.5 rounded-lg ${card.color}`}>
                            <Icon className="h-4 w-4" />
                          </div>
                        </div>
                        <p className="font-display font-extrabold text-xl mt-3 tracking-tight text-slate-900 dark:text-white">
                          {card.count}
                        </p>
                      </div>
                    );
                  })}
                </div>

                {/* Remaining Voters Table container */}
                <div className={`rounded-2xl border ${isDarkMode ? "bg-[#0F172A] border-slate-800" : "bg-white border-slate-200 shadow-sm"}`}>
                  <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <h3 className="font-display font-bold text-sm tracking-tight text-slate-900 dark:text-white">Voters Pending Ballot Submission</h3>
                    
                    {/* Search filter */}
                    <div className="relative w-full sm:w-64">
                      <Search className="absolute left-3.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search remaining voters..."
                        value={reportSearchQuery}
                        onChange={(e) => {
                          setReportSearchQuery(e.target.value);
                          setReportCurrentPage(1);
                        }}
                        className={`w-full pl-9 pr-4 py-1.5 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                          isDarkMode ? "bg-slate-950 border-slate-800 text-white placeholder-slate-600" : "bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400"
                        }`}
                      />
                    </div>
                  </div>

                  {filteredRemainingVoters.length === 0 ? (
                    <div className="p-12 text-center">
                      <CheckCircle className="h-10 w-10 text-emerald-500 mx-auto mb-2" />
                      <h4 className="font-bold text-sm text-slate-700 dark:text-slate-300">All Registered Voters Active</h4>
                      <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                        {reportSearchQuery ? "No electors matched your filter terms." : "Awesome! Turnout is 100%. Every single registered elector has successfully cast their ballot!"}
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* Desktop remaining voters table */}
                      <div className="hidden md:block overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className={`border-b text-xs font-bold uppercase tracking-wider text-slate-400 ${isDarkMode ? "bg-slate-950/50 border-slate-800" : "bg-slate-50 border-slate-100"}`}>
                              <th className="py-3.5 px-6">Register Number</th>
                              <th className="py-3.5 px-6">Voter Name</th>
                              <th className="py-3.5 px-6">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                            {paginatedRemainingVoters.map((v: any) => (
                              <tr key={v.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                                <td className="py-3.5 px-6 font-mono font-bold text-blue-600 dark:text-blue-400">{v.registerNumber}</td>
                                <td className="py-3.5 px-6 font-semibold text-slate-700 dark:text-slate-300">{v.name}</td>
                                <td className="py-3.5 px-6">
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-amber-500/10 text-amber-600 dark:text-amber-400">
                                    Pending Vote
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Mobile remaining voters cards list */}
                      <div className="block md:hidden divide-y divide-slate-100 dark:divide-slate-800">
                        {paginatedRemainingVoters.map((v: any) => (
                          <div key={v.id} className="p-4 flex items-center justify-between text-xs gap-4">
                            <div className="space-y-1">
                              <p className="font-bold text-slate-900 dark:text-white">{v.name}</p>
                              <p className="font-mono text-[10px] text-blue-600 dark:text-blue-400">Reg: {v.registerNumber}</p>
                            </div>
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-amber-500/10 text-amber-600 dark:text-amber-400">
                              Pending
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Remaining Voters Pagination */}
                      {filteredRemainingVoters.length > itemsPerPage && (
                        <div className="flex items-center justify-between p-4 border-t border-slate-100 dark:border-slate-800">
                          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                            Showing {(reportCurrentPage - 1) * itemsPerPage + 1}-{Math.min(reportCurrentPage * itemsPerPage, filteredRemainingVoters.length)} of {filteredRemainingVoters.length} remaining
                          </span>
                          <div className="flex space-x-1">
                            <button
                              onClick={() => setReportCurrentPage((prev) => Math.max(1, prev - 1))}
                              disabled={reportCurrentPage === 1}
                              className="p-1.5 border rounded-xl disabled:opacity-50 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 disabled:cursor-not-allowed"
                            >
                              <ChevronLeft className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => setReportCurrentPage((prev) => Math.min(totalReportPages, prev + 1))}
                              disabled={reportCurrentPage === totalReportPages}
                              className="p-1.5 border rounded-xl disabled:opacity-50 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 disabled:cursor-not-allowed"
                            >
                              <ChevronRight className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-12 text-center rounded-2xl border border-slate-200 dark:border-slate-800">
                <p className="text-xs text-slate-500">Please select an election to generate the remaining voters report.</p>
              </div>
            )}
          </div>
        )}

        {/* TAB 6: SETTINGS & DEFAULTS */}
        {activeTab === "settings" && (
          <div className="space-y-6 animate-fade-in" id="settings-tab-panel">
            <div>
              <h2 className="font-display font-extrabold text-2xl tracking-tight">System Configuration</h2>
              <p className="text-xs text-slate-500 mt-1">Configure system variables, database controls, and audit constraints.</p>
            </div>

            <div className={`p-6 rounded-2xl border ${isDarkMode ? "bg-[#0F172A] border-slate-800 text-white" : "bg-white border-slate-200 shadow-sm text-slate-900"} max-w-2xl space-y-6`}>
              <div className="space-y-2">
                <h3 className="font-bold text-sm">Institution Identity</h3>
                <p className="text-xs text-slate-500">Primary display title and labeling context across elector interfaces.</p>
                <input
                  type="text"
                  disabled
                  value="Dhanalakshmi Srinivasan University"
                  className={`w-full px-4 py-2.5 rounded-xl text-xs border focus:outline-none bg-blue-50/40 border-blue-200 dark:bg-blue-950/10 dark:border-blue-900/50 text-blue-600 dark:text-blue-400 font-bold`}
                />
              </div>

              <div className="space-y-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <h3 className="font-bold text-sm">Security Controls</h3>
                <div className="flex items-center justify-between text-xs">
                  <div>
                    <p className={`font-bold ${isDarkMode ? "text-white" : "text-slate-900"}`}>Prevent Duplicate Votes</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Blocks electors from casting multiple ballots per election.</p>
                  </div>
                  <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-500 font-bold rounded-lg border border-emerald-500/20 text-[10px] uppercase">
                    ACTIVE
                  </span>
                </div>
              </div>

              <div className="space-y-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <h3 className="font-bold text-sm">Default Elector Setup</h3>
                <p className="text-xs text-slate-500">
                  All newly registered/uploaded student electors are enrolled with the static default password key: <span className="font-bold text-blue-600">DSU</span>.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MODAL 1: ELECTION CREATOR/EDITOR */}
      {isElectionModalOpen && editingElection && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" id="election-modal">
          <div className={`w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 rounded-2xl border shadow-2xl animate-fade-in ${
            isDarkMode ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-900"
          }`}>
            <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-800 mb-6">
              <h3 className="font-display font-bold text-base">
                {editingElection.id ? "Edit Ballot Election" : "Launch New Election"}
              </h3>
              <button onClick={() => setIsElectionModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveElection} className="space-y-4">
              <div>
                <label className="block text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1.5">Election Name / Title</label>
                <input
                  type="text"
                  required
                  value={editingElection.title || ""}
                  onChange={(e) => setEditingElection({ ...editingElection, title: e.target.value })}
                  className={`w-full px-4 py-2.5 rounded-xl text-xs border focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                    isDarkMode ? "bg-slate-950 border-slate-800" : "bg-slate-50 border-slate-200"
                  }`}
                  placeholder="e.g. Student Council President Election..."
                  id="modal-election-title-input"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1.5">Description</label>
                <textarea
                  value={editingElection.description || ""}
                  onChange={(e) => setEditingElection({ ...editingElection, description: e.target.value })}
                  className={`w-full px-4 py-2.5 rounded-xl text-xs border focus:outline-none focus:ring-1 focus:ring-blue-500 h-20 ${
                    isDarkMode ? "bg-slate-950 border-slate-800" : "bg-slate-50 border-slate-200"
                  }`}
                  placeholder="Summarize voting instructions and student positions..."
                  id="modal-election-desc-input"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1.5">Start Date & Time</label>
                  <input
                    type="datetime-local"
                    required
                    value={editingElection.startDate ? editingElection.startDate.substring(0, 16) : ""}
                    onChange={(e) => setEditingElection({ ...editingElection, startDate: e.target.value })}
                    className={`w-full px-4 py-2.5 rounded-xl text-xs border focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                      isDarkMode ? "bg-slate-950 border-slate-800" : "bg-slate-50 border-slate-200"
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1.5">End Date & Time</label>
                  <input
                    type="datetime-local"
                    required
                    value={editingElection.endDate ? editingElection.endDate.substring(0, 16) : ""}
                    onChange={(e) => setEditingElection({ ...editingElection, endDate: e.target.value })}
                    className={`w-full px-4 py-2.5 rounded-xl text-xs border focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                      isDarkMode ? "bg-slate-950 border-slate-800" : "bg-slate-50 border-slate-200"
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1.5">Initial Status</label>
                <select
                  value={editingElection.status || "Upcoming"}
                  onChange={(e) => setEditingElection({ ...editingElection, status: e.target.value as any })}
                  className={`w-full px-4 py-2.5 rounded-xl text-xs border focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                    isDarkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                  }`}
                >
                  <option value="Upcoming">Upcoming</option>
                  <option value="Active">Active</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>

              <div className="flex space-x-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsElectionModalOpen(false)}
                  className="w-1/2 py-2.5 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-semibold rounded-xl text-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs shadow transition active:scale-95"
                  id="btn-save-election-submit"
                >
                  {editingElection.id ? "Save Changes" : "Launch Election"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: CANDIDATE REGISTRAR */}
      {isCandidateModalOpen && editingCandidate && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" id="candidate-modal">
          <div className={`w-full max-w-md max-h-[90vh] overflow-y-auto p-6 rounded-2xl border shadow-2xl animate-fade-in ${
            isDarkMode ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-900"
          }`}>
            <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-800 mb-6">
              <h3 className="font-display font-bold text-base">
                {editingCandidate.id ? "Edit Contestant Details" : "Register New Candidate"}
              </h3>
              <button onClick={() => setIsCandidateModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCandidate} className="space-y-4">
              <div>
                <label className="block text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1.5">Contestant Name</label>
                <input
                  type="text"
                  required
                  value={editingCandidate.name || ""}
                  onChange={(e) => setEditingCandidate({ ...editingCandidate, name: e.target.value })}
                  className={`w-full px-4 py-2.5 rounded-xl text-xs border focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                    isDarkMode ? "bg-slate-950 border-slate-800" : "bg-slate-50 border-slate-200"
                  }`}
                  placeholder="e.g. Rohit Kumar..."
                  id="modal-candidate-name-input"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1.5">Register / Candidate Number</label>
                <input
                  type="text"
                  required
                  value={editingCandidate.registerNumber || ""}
                  onChange={(e) => setEditingCandidate({ ...editingCandidate, registerNumber: e.target.value })}
                  className={`w-full px-4 py-2.5 rounded-xl text-xs border focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                    isDarkMode ? "bg-slate-950 border-slate-800" : "bg-slate-50 border-slate-200"
                  }`}
                  placeholder="e.g. REG01..."
                  id="modal-candidate-reg-input"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1.5">Candidate Photo</label>
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => photoInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition flex flex-col items-center justify-center min-h-[120px] ${
                    isDraggingPhoto
                      ? "border-blue-500 bg-blue-500/10"
                      : isDarkMode
                      ? "border-slate-800 hover:border-slate-700 bg-slate-950/40"
                      : "border-slate-200 hover:border-slate-300 bg-slate-50"
                  }`}
                >
                  <input
                    type="file"
                    ref={photoInputRef}
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        handlePhotoUpload(e.target.files[0]);
                      }
                    }}
                    accept="image/*"
                    className="hidden"
                  />
                  
                  {editingCandidate.photo ? (
                    <div className="relative group">
                      <img
                        src={editingCandidate.photo}
                        alt="Candidate preview"
                        className="h-20 w-20 object-cover rounded-xl border border-slate-200 dark:border-slate-800"
                        referrerPolicy="no-referrer"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingCandidate({ ...editingCandidate, photo: "" });
                          if (photoInputRef.current) photoInputRef.current.value = "";
                        }}
                        className="absolute -top-2 -right-2 p-1 bg-rose-600 text-white rounded-full hover:bg-rose-700 shadow-md transition active:scale-95"
                        title="Remove photo"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <UploadCloud className="h-8 w-8 text-slate-400 mb-2" />
                      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                        Drag & drop candidate photo, or <span className="text-blue-600 dark:text-blue-400 hover:underline">browse</span>
                      </p>
                      <p className="text-[10px] text-slate-400 mt-1">Supports JPG, PNG, GIF up to 5MB</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex space-x-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCandidateModalOpen(false)}
                  className="w-1/2 py-2.5 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-semibold rounded-xl text-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs shadow transition active:scale-95"
                  id="btn-save-candidate-submit"
                >
                  Save Contestant
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: INDIVIDUAL ELECTOR REGISTRAR */}
      {isElectorModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" id="elector-modal">
          <div className={`w-full max-w-md max-h-[90vh] overflow-y-auto p-6 rounded-2xl border shadow-2xl animate-fade-in ${
            isDarkMode ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-900"
          }`}>
            <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-800 mb-6">
              <h3 className="font-display font-bold text-base">Enroll Student Elector</h3>
              <button onClick={() => setIsElectorModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveElector} className="space-y-4">
              <div>
                <label className="block text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1.5">Elector Full Name</label>
                <input
                  type="text"
                  required
                  value={electorName}
                  onChange={(e) => setElectorName(e.target.value)}
                  className={`w-full px-4 py-2.5 rounded-xl text-xs border focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                    isDarkMode ? "bg-slate-950 border-slate-800" : "bg-slate-50 border-slate-200"
                  }`}
                  placeholder="e.g. Shreya Gowda..."
                  id="modal-elector-name-input"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1.5">Register Number / Login Username</label>
                <input
                  type="text"
                  required
                  value={electorRegNum}
                  onChange={(e) => setElectorRegNum(e.target.value)}
                  className={`w-full px-4 py-2.5 rounded-xl text-xs border focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                    isDarkMode ? "bg-slate-950 border-slate-800" : "bg-slate-50 border-slate-200"
                  }`}
                  placeholder="e.g. 115..."
                  id="modal-elector-reg-input"
                />
                <p className="text-[9px] text-slate-400 mt-1 font-semibold">* Access password is initialized as DSU.</p>
              </div>

              <div className="flex space-x-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsElectorModalOpen(false)}
                  className="w-1/2 py-2.5 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-semibold rounded-xl text-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs shadow transition active:scale-95"
                  id="btn-save-elector-submit"
                >
                  Enroll Elector
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: BULK CSV/EXCEL IMPORTER */}
      {isBulkModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" id="bulk-import-modal">
          <div className={`w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 rounded-2xl border shadow-2xl animate-fade-in ${
            isDarkMode ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-900"
          }`}>
            <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-800 mb-6">
              <h3 className="font-display font-bold text-base">Bulk Enroll Electors</h3>
              <button onClick={() => setIsBulkModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleBulkEnrollment} className="space-y-4">
              {/* Drag-and-drop CSV Area */}
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleFileDrop}
                className={`p-6 border-2 border-dashed rounded-xl text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50/5 transition duration-200 ${
                  isDarkMode ? "border-slate-800 bg-slate-950/30" : "border-slate-200 bg-slate-50/50"
                }`}
                id="drag-drop-container"
              >
                <UploadCloud className="h-8 w-8 mx-auto text-blue-500 mb-2" />
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Drag & Drop CSV / Excel Spreadsheet File Here</p>
                <p className="text-[10px] text-slate-400 mt-1">Or click to select spreadsheet files manually</p>
                <input
                  type="file"
                  accept=".csv, text/csv, text/plain"
                  onChange={handleFileSelectChange}
                  className="hidden"
                  id="file-selector"
                />
                <button
                  type="button"
                  onClick={() => document.getElementById("file-selector")?.click()}
                  className="mt-3 px-3 py-1.5 bg-blue-600/10 hover:bg-blue-600/25 text-blue-600 dark:text-blue-400 font-bold rounded-lg text-[10px]"
                >
                  Select File
                </button>
              </div>

              <div className="relative">
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-[10px] text-slate-400 uppercase font-bold tracking-wider">Paste Rosters Manually (CSV Format)</label>
                  <span className="text-[9px] text-slate-400 font-medium">Format: RegisterNumber, ElectorName</span>
                </div>
                <textarea
                  value={bulkTextInput}
                  onChange={(e) => setBulkTextInput(e.target.value)}
                  className={`w-full px-4 py-2.5 rounded-xl text-xs border focus:outline-none focus:ring-1 focus:ring-blue-500 h-32 font-mono ${
                    isDarkMode ? "bg-slate-950 border-slate-800 text-slate-300" : "bg-slate-50 border-slate-200 text-slate-800"
                  }`}
                  placeholder={`e.g.,
111, Sachin Tendulkar
112, Rahul Dravid
113, Sourav Ganguly`}
                  id="bulk-text-input"
                />
              </div>

              <div className="flex space-x-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsBulkModalOpen(false)}
                  className="w-1/2 py-2.5 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-semibold rounded-xl text-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!bulkTextInput.trim()}
                  className="w-1/2 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-xl text-xs shadow transition active:scale-95"
                  id="btn-bulk-import-submit"
                >
                  Process & Enroll
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CUSTOM CONFIRMATION MODAL */}
      {deleteConfirmInfo && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4" id="custom-confirm-modal">
          <div className={`w-full max-w-md p-6 rounded-2xl border shadow-2xl animate-fade-in ${
            isDarkMode ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-900"
          }`}>
            <div className="flex items-center space-x-3 text-rose-600 dark:text-rose-400 mb-4">
              <AlertCircle className="h-6 w-6 shrink-0" />
              <h3 className="font-display font-bold text-lg">Confirm Deletion</h3>
            </div>
            
            <p className="text-sm font-medium mb-2">
              Are you sure you want to delete <span className="font-bold underline text-rose-600 dark:text-rose-400">{deleteConfirmInfo.title}</span>?
            </p>
            
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
              {deleteConfirmInfo.description} This action is completely irreversible.
            </p>

            <div className="flex space-x-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setDeleteConfirmInfo(null)}
                className="w-1/2 py-2.5 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-semibold rounded-xl text-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="w-1/2 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-xl text-xs shadow transition active:scale-95 animate-pulse"
                id="btn-confirm-delete-submit"
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
