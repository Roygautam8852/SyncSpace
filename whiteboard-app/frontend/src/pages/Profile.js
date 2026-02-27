import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { authService } from "../services/api";
import toast from "react-hot-toast";

const Profile = () => {
    const { user, updateUser } = useAuth();
    const [name, setName] = useState(user?.name || "");
    const [loading, setLoading] = useState(false);

    const handleUpdate = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await authService.updateProfile({ name });
            updateUser(res.data.user);
            toast.success("Profile updated successfully!");
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to update profile");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* Background Decorative Elements */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary-600/10 rounded-full blur-[120px]"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/10 rounded-full blur-[120px]"></div>

            <div className="w-full max-w-xl relative z-10">
                <Link to="/dashboard" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-8 group shrink-0">
                    <span className="p-2 rounded-lg bg-white/5 border border-white/10 group-hover:bg-primary-600 transition-all">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
                        </svg>
                    </span>
                    <span className="font-bold text-sm uppercase tracking-widest">Dashboard</span>
                </Link>

                <div className="card-premium p-0 overflow-hidden">
                    <div className="h-32 bg-gradient-to-r from-primary-600 to-indigo-600 relative">
                        <div className="absolute -bottom-12 left-8 p-1 bg-slate-950 rounded-3xl">
                            <div className="w-24 h-24 rounded-2xl bg-slate-800 border-4 border-slate-900 flex items-center justify-center text-4xl font-bold text-white shadow-xl shadow-black/50 overflow-hidden">
                                {user?.name?.[0]}
                            </div>
                        </div>
                    </div>

                    <div className="pt-16 pb-10 px-10">
                        <div className="mb-10">
                            <h1 className="text-3xl font-bold text-white mb-1 tracking-tight">Profile Settings</h1>
                            <p className="text-slate-400 font-medium">Manage your personal identity on SyncSpace</p>
                        </div>

                        <form onSubmit={handleUpdate} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] uppercase tracking-widest font-bold text-slate-500 ml-1">Display Name</label>
                                <input
                                    type="text"
                                    className="input-premium w-full text-lg font-bold"
                                    placeholder="Enter your name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                />
                                <p className="text-[10px] text-slate-500 ml-1">This is how other collaborators will see you in rooms.</p>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] uppercase tracking-widest font-bold text-slate-500 ml-1">Email Address</label>
                                <div className="relative group">
                                    <input
                                        type="email"
                                        className="input-premium w-full !bg-white/5 !border-white/5 opacity-50 cursor-not-allowed font-medium"
                                        value={user?.email}
                                        disabled
                                    />
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                        <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-6">
                                <button
                                    type="submit"
                                    className="btn-premium w-full py-4 text-base font-bold tracking-wide"
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <div className="flex items-center justify-center gap-2">
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            <span>Updating Profile...</span>
                                        </div>
                                    ) : (
                                        "Save Account Changes"
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                <div className="mt-8 flex justify-center gap-8 px-4 opacity-50 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-700">
                    <div className="flex items-center gap-2 uppercase tracking-tighter text-[10px] font-bold text-slate-500">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> Secure Access
                    </div>
                    <div className="flex items-center gap-2 uppercase tracking-tighter text-[10px] font-bold text-slate-500">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span> Data Encrypted
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;
