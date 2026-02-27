import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import { useGoogleLogin } from '@react-oauth/google';
import { Layout, Github, Mail, ArrowRight, ArrowLeft } from "lucide-react";

const Login = () => {
  const { login, googleLogin } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success("Welcome back to SyncSpace");
      navigate("/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setLoading(true);
      try {
        await googleLogin(tokenResponse.access_token);
        toast.success("Welcome back to SyncSpace!");
        navigate("/dashboard");
      } catch (err) {
        toast.error("Google login failed");
        console.error(err);
      } finally {
        setLoading(false);
      }
    },
    onError: () => toast.error("Google login failed"),
  });

  return (
    <div className="h-screen w-full flex items-center justify-center bg-[#F8FAFC] overflow-hidden relative font-sans">
      {/* Abstract Background Shapes */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-400/10 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-400/10 rounded-full blur-[120px]"></div>
      </div>

      {/* Back Button */}
      <Link
        to="/"
        className="absolute top-8 left-8 flex items-center gap-2 text-slate-400 hover:text-blue-600 font-bold transition-all group z-20 hover:-translate-x-1"
      >
        <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center shadow-sm group-hover:border-blue-200 group-hover:shadow-blue-500/10">
          <ArrowLeft size={18} />
        </div>
        <span className="text-xs uppercase tracking-widest">Back</span>
      </Link>

      <div className="w-full max-w-[420px] px-6 relative z-10">
        <div className="text-center mb-5">
          <div className="inline-flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Layout className="text-white w-4 h-4" />
            </div>
            <span className="text-lg font-black text-slate-900 tracking-tight">SyncSpace</span>
          </div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight leading-tight">Welcome Back</h1>
          <p className="text-[9px] text-slate-400 font-black uppercase tracking-[0.2em] mt-1">Sign in to your workspace</p>
        </div>

        <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-[0_20px_70px_-10px_rgba(37,99,235,0.1)] border border-slate-200/60 transition-all">
          <div className="space-y-3 mb-6">
            <button
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center gap-3 py-3 bg-white border border-slate-200 rounded-xl font-bold text-slate-700 hover:bg-slate-50 transition-all active:scale-95 group shadow-sm text-xs"
            >
              <img src="https://www.google.com/favicon.ico" alt="Google" className="w-4 h-4 grayscale group-hover:grayscale-0 transition-all" />
              <span className="text-xs uppercase tracking-wider">Continue with Google</span>
            </button>
          </div>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
            <div className="relative flex justify-center text-[9px] uppercase font-black tracking-widest text-slate-400">
              <span className="bg-white px-4">Or sign in with email</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5" />
                <input
                  type="email"
                  className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all shadow-inner"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center ml-1">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Password</label>
                <a href="#" className="text-[9px] font-black text-blue-600 hover:text-blue-700 uppercase tracking-widest">Forgot?</a>
              </div>
              <input
                type="password"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white transition-all shadow-inner"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl font-black text-[10px] uppercase tracking-[0.15em] shadow-[0_10px_25px_-5px_rgba(37,99,235,0.4)] hover:shadow-[0_15px_30px_-5px_rgba(37,99,235,0.5)] hover:-translate-y-0.5 active:scale-[0.98] transition-all flex items-center justify-center gap-3 mt-2 relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
              {loading ? "Signing in..." : "Continue to Workspace"}
              {!loading && <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />}
            </button>
          </form>

          <p className="mt-8 text-center text-[10px] font-bold text-slate-500 uppercase tracking-wide">
            New here? <Link to="/register" className="text-blue-600 hover:text-blue-700 font-black">Create workspace</Link>
          </p>
        </div>

        <div className="mt-6 flex items-center justify-center gap-4 opacity-30 grayscale saturate-0 pointer-events-none">
          <span className="text-[8px] font-black tracking-widest uppercase italic">Safe & Secure</span>
        </div>
      </div>
    </div>
  );
};

export default Login;
