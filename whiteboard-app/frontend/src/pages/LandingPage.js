import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
    ArrowRight,
    Zap,
    Layout,
    Users,
    Share2,
    Shield,
    MousePointer2,
    Layers,
    Sparkles,
    PenTool,
    MonitorPlay,
    MessageSquare,
    Github,
    Linkedin,
    Twitter,
    ChevronRight
} from "lucide-react";

/**
 * LandingPage — Premium, simple landing page for SyncSpace.
 * No demo video elements. Purely content + features + CTA.
 */

/* ─── Inline keyframes for animations ─── */
const animationStyles = `
@keyframes float-slow {
    0%, 100% { transform: translateY(0px) rotate(0deg); }
    50% { transform: translateY(-20px) rotate(3deg); }
}
@keyframes float-medium {
    0%, 100% { transform: translateY(0px) rotate(0deg); }
    50% { transform: translateY(-14px) rotate(-2deg); }
}
@keyframes float-fast {
    0%, 100% { transform: translateY(0px) rotate(0deg); }
    50% { transform: translateY(-10px) rotate(2deg); }
}
@keyframes gradient-shift {
    0%, 100% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
}
@keyframes fade-in-up {
    from { opacity: 0; transform: translateY(30px); }
    to { opacity: 1; transform: translateY(0); }
}
@keyframes fade-in {
    from { opacity: 0; }
    to { opacity: 1; }
}
@keyframes scale-in {
    from { opacity: 0; transform: scale(0.9); }
    to { opacity: 1; transform: scale(1); }
}
@keyframes slide-in-left {
    from { opacity: 0; transform: translateX(-40px); }
    to { opacity: 1; transform: translateX(0); }
}
@keyframes pulse-glow {
    0%, 100% { box-shadow: 0 0 20px rgba(79, 70, 229, 0.15); }
    50% { box-shadow: 0 0 40px rgba(79, 70, 229, 0.3); }
}
.animate-float-slow { animation: float-slow 6s ease-in-out infinite; }
.animate-float-medium { animation: float-medium 5s ease-in-out infinite; }
.animate-float-fast { animation: float-fast 4s ease-in-out infinite; }
.animate-gradient-shift { animation: gradient-shift 8s ease infinite; background-size: 200% 200%; }
.animate-fade-in-up { animation: fade-in-up 0.8s ease-out forwards; }
.animate-fade-in { animation: fade-in 1s ease-out forwards; }
.animate-scale-in { animation: scale-in 0.6s ease-out forwards; }
.animate-slide-in-left { animation: slide-in-left 0.8s ease-out forwards; }
.animate-pulse-glow { animation: pulse-glow 3s ease-in-out infinite; }
`;

/* ─── Stats Data ─── */
const stats = [
    { value: "10K+", label: "Active Teams" },
    { value: "2M+", label: "Boards Created" },
    { value: "99.9%", label: "Uptime SLA" },
    { value: "<50ms", label: "Sync Latency" }
];

/* ─── Features Data ─── */
const features = [
    {
        icon: Zap,
        title: "Zero Latency",
        desc: "Proprietary real-time engine ensures sub-50ms synchronization across the globe.",
        gradient: "from-amber-500 to-orange-600"
    },
    {
        icon: Share2,
        title: "Instant Sharing",
        desc: "Share boards with a single link or invite teammates directly to collaborative rooms.",
        gradient: "from-blue-500 to-cyan-500"
    },
    {
        icon: Shield,
        title: "Enterprise Security",
        desc: "Full end-to-end encryption for all board data, files, and communications.",
        gradient: "from-emerald-500 to-teal-600"
    },
    {
        icon: MousePointer2,
        title: "Live Cursors",
        desc: "See exactly where your teammates are working with real-time multi-cursor awareness.",
        gradient: "from-purple-500 to-violet-600"
    },
    {
        icon: Layers,
        title: "Rich Canvas",
        desc: "Professional drawing tools, image handling, screen sharing, and sticky notes on one canvas.",
        gradient: "from-pink-500 to-rose-600"
    },
    {
        icon: Users,
        title: "Team Roles",
        desc: "Granular access controls for admins, editors, and read-only viewers.",
        gradient: "from-indigo-500 to-blue-600"
    }
];

/* ─── How It Works Data ─── */
const steps = [
    {
        icon: PenTool,
        title: "Create a Board",
        desc: "Start a new whiteboard workspace in one click. Choose from blank canvas or templates.",
        step: "01"
    },
    {
        icon: Users,
        title: "Invite Your Team",
        desc: "Share a link or invite collaborators directly. Everyone joins in real-time instantly.",
        step: "02"
    },
    {
        icon: MonitorPlay,
        title: "Collaborate Live",
        desc: "Draw, write, share screens, and chat together — all synced in real-time.",
        step: "03"
    },
    {
        icon: MessageSquare,
        title: "Built-in Chat",
        desc: "Communicate with your team through integrated messaging without leaving the board.",
        step: "04"
    }
];

const LandingPage = () => {
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-700 overflow-x-hidden">
            <style>{animationStyles}</style>

            {/* ═══════════════════════ Navbar ═══════════════════════ */}
            <nav
                className={`fixed top-0 w-full z-50 px-6 h-16 flex items-center justify-between transition-all duration-300 ${scrolled
                    ? "bg-white/90 backdrop-blur-xl border-b border-slate-200/60 shadow-sm shadow-slate-200/40"
                    : "bg-transparent"
                    }`}
            >
                <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-blue-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
                        <Layout className="text-white w-5 h-5" />
                    </div>
                    <span className="text-xl font-black text-slate-900 tracking-tight">
                        SyncSpace
                    </span>
                </div>

                <div className="hidden md:flex items-center gap-8">
                    <a href="#features" className="text-sm font-bold text-slate-500 hover:text-indigo-600 transition-colors duration-200">
                        Features
                    </a>
                    <a href="#how-it-works" className="text-sm font-bold text-slate-500 hover:text-indigo-600 transition-colors duration-200">
                        How It Works
                    </a>
                    <a href="#stats" className="text-sm font-bold text-slate-500 hover:text-indigo-600 transition-colors duration-200">
                        Why Us
                    </a>
                </div>

                <div className="flex items-center gap-3">
                    <Link
                        to="/login"
                        className="text-sm font-bold text-slate-600 hover:text-indigo-600 transition-colors px-4 py-2 rounded-xl hover:bg-indigo-50"
                    >
                        Sign In
                    </Link>
                    <Link
                        to="/register"
                        className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white px-5 py-2 rounded-xl text-sm font-black uppercase tracking-wider shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/30 hover:-translate-y-0.5 transition-all active:scale-95"
                    >
                        Get Started
                    </Link>
                </div>
            </nav>

            {/* ═══════════════════════ Hero Section ═══════════════════════ */}
            <section className="relative pt-36 pb-20 px-6 overflow-hidden">
                {/* Background decorations */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[700px] bg-gradient-to-b from-indigo-50/60 via-blue-50/30 to-transparent -z-10"></div>

                {/* Floating geometric shapes */}
                <div className="absolute top-32 left-[8%] w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-400/20 to-purple-400/20 border border-indigo-200/30 animate-float-slow -z-10"></div>
                <div className="absolute top-48 right-[10%] w-12 h-12 rounded-full bg-gradient-to-br from-blue-400/20 to-cyan-400/20 border border-blue-200/30 animate-float-medium -z-10"></div>
                <div className="absolute top-[380px] left-[15%] w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400/15 to-orange-400/15 border border-amber-200/20 animate-float-fast -z-10 rotate-12"></div>
                <div className="absolute top-[320px] right-[18%] w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-400/15 to-teal-400/15 border border-emerald-200/20 animate-float-slow -z-10 rotate-45"></div>
                <div className="absolute top-[450px] left-[45%] w-8 h-8 rounded-lg bg-gradient-to-br from-pink-400/15 to-rose-400/15 border border-pink-200/20 animate-float-medium -z-10"></div>

                {/* Glow orbs */}
                <div className="absolute top-40 -left-32 w-[500px] h-[500px] bg-indigo-400/8 rounded-full blur-[100px]"></div>
                <div className="absolute top-60 -right-32 w-[400px] h-[400px] bg-blue-400/8 rounded-full blur-[100px]"></div>

                <div className="max-w-5xl mx-auto text-center relative">
                    {/* Badge */}
                    <div
                        className="animate-fade-in-up inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-black uppercase tracking-[0.15em] mb-8 border border-indigo-100"
                        style={{ animationDelay: "0.1s" }}
                    >
                        <Sparkles size={12} className="text-indigo-500" />
                        Real-Time Collaboration
                    </div>

                    {/* Main Heading */}
                    <h1
                        className="animate-fade-in-up text-4xl sm:text-5xl md:text-5xl lg:text-6xl font-black text-slate-900 mb-6 tracking-tighter leading-[0.95]"
                        style={{ animationDelay: "0.25s" }}
                    >
                        Your team's <br />
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-500 animate-gradient-shift">
                            creative canvas.
                        </span>
                    </h1>

                    {/* Subtitle */}
                    <p
                        className="animate-fade-in-up text-lg md:text-xl text-slate-500 max-w-2xl mx-auto mb-10 leading-relaxed font-medium"
                        style={{ animationDelay: "0.4s" }}
                    >
                        The professional whiteboard for modern teams. Draw, brainstorm, share files,
                        and stream your screen — all in a workspace built for high-performance collaboration.
                    </p>

                    {/* CTA Buttons */}
                    <div
                        className="animate-fade-in-up flex flex-col sm:flex-row items-center justify-center gap-4"
                        style={{ animationDelay: "0.55s" }}
                    >
                        <Link
                            to="/register"
                            className="group px-10 py-4 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-2xl font-black text-base uppercase tracking-wider shadow-xl shadow-indigo-500/25 hover:shadow-2xl hover:shadow-indigo-500/35 hover:-translate-y-1 transition-all duration-300 flex items-center gap-2 active:scale-95"
                        >
                            Start Free
                            <ArrowRight
                                size={18}
                                className="group-hover:translate-x-1 transition-transform duration-200"
                            />
                        </Link>
                        <Link
                            to="/login"
                            className="px-10 py-4 bg-white text-slate-700 border-2 border-slate-200 rounded-2xl font-black text-base uppercase tracking-wider hover:bg-slate-50 hover:border-slate-300 hover:-translate-y-0.5 transition-all duration-300 active:scale-95 shadow-sm"
                        >
                            Sign In
                        </Link>
                    </div>

                    {/* Trusted by text */}
                    <p
                        className="animate-fade-in mt-16 text-xs font-bold text-slate-400 uppercase tracking-[0.2em]"
                        style={{ animationDelay: "0.7s" }}
                    >
                        Trusted by teams at leading companies worldwide
                    </p>
                </div>
            </section>

            {/* ═══════════════════════ Stats Bar ═══════════════════════ */}
            <section id="stats" className="py-16 px-6">
                <div className="max-w-5xl mx-auto">
                    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xl shadow-slate-200/40 p-8 md:p-10">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                            {stats.map((stat, i) => (
                                <div key={i} className="text-center">
                                    <div className="text-3xl md:text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-blue-600 mb-2">
                                        {stat.value}
                                    </div>
                                    <div className="text-sm font-bold text-slate-400 uppercase tracking-wider">
                                        {stat.label}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* ═══════════════════════ Features Section ═══════════════════════ */}
            <section id="features" className="py-24 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase tracking-[0.15em] mb-5 border border-emerald-100">
                            <Zap size={12} />
                            Powerful Features
                        </div>
                        <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-5 tracking-tight leading-tight">
                            Everything you need to{" "}
                            <br className="hidden md:block" />
                            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-blue-600">
                                collaborate better
                            </span>
                        </h2>
                        <p className="text-lg text-slate-500 font-medium max-w-2xl mx-auto">
                            Modern tools for modern teams. SyncSpace is the most intuitive way for
                            remote teams to brainstorm, plan, and create together.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {features.map((feature, i) => (
                            <div
                                key={i}
                                className="group bg-white p-8 rounded-3xl border border-slate-200/80 shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 hover:-translate-y-1.5 transition-all duration-500 cursor-default"
                            >
                                <div
                                    className={`w-12 h-12 bg-gradient-to-br ${feature.gradient} rounded-2xl flex items-center justify-center mb-5 shadow-lg group-hover:scale-110 transition-transform duration-300`}
                                >
                                    <feature.icon size={22} className="text-white" />
                                </div>
                                <h3 className="text-lg font-black text-slate-900 mb-2">
                                    {feature.title}
                                </h3>
                                <p className="text-slate-500 font-medium leading-relaxed text-sm">
                                    {feature.desc}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ═══════════════════════ How It Works ═══════════════════════ */}
            <section id="how-it-works" className="py-24 px-6 bg-gradient-to-b from-slate-50 to-white">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-16">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-[10px] font-black uppercase tracking-[0.15em] mb-5 border border-blue-100">
                            <ChevronRight size={12} />
                            Simple Process
                        </div>
                        <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-5 tracking-tight">
                            How it works
                        </h2>
                        <p className="text-lg text-slate-500 font-medium max-w-xl mx-auto">
                            Get your team collaborating in minutes, not hours.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {steps.map((step, i) => (
                            <div
                                key={i}
                                className="relative group bg-white p-8 rounded-3xl border border-slate-200/80 shadow-sm hover:shadow-lg hover:shadow-indigo-500/5 transition-all duration-400"
                            >
                                {/* Step number */}
                                <div className="text-6xl font-black text-slate-100 group-hover:text-indigo-100 absolute top-4 right-6 transition-colors duration-300 select-none">
                                    {step.step}
                                </div>
                                <div className="relative z-10">
                                    <div className="w-11 h-11 bg-indigo-50 group-hover:bg-indigo-100 rounded-xl flex items-center justify-center mb-5 transition-colors duration-300">
                                        <step.icon
                                            size={20}
                                            className="text-indigo-600"
                                        />
                                    </div>
                                    <h3 className="text-lg font-black text-slate-900 mb-2">
                                        {step.title}
                                    </h3>
                                    <p className="text-slate-500 font-medium text-sm leading-relaxed">
                                        {step.desc}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ═══════════════════════ CTA Section ═══════════════════════ */}
            <section className="py-28 px-6">
                <div className="max-w-5xl mx-auto">
                    <div className="relative bg-gradient-to-br from-[#1E293B] to-[#0F172A] rounded-[2.5rem] p-12 md:p-20 overflow-hidden text-center shadow-2xl">
                        {/* Decorative glows */}
                        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/15 rounded-full blur-[120px] -mr-48 -mt-48"></div>
                        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-600/10 rounded-full blur-[120px] -ml-48 -mb-48"></div>
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-indigo-500/5 rounded-full blur-[60px]"></div>

                        {/* Grid pattern overlay */}
                        <div
                            className="absolute inset-0 opacity-[0.03]"
                            style={{
                                backgroundImage:
                                    "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
                                backgroundSize: "40px 40px"
                            }}
                        ></div>

                        <div className="relative z-10">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 text-indigo-300 text-[10px] font-black uppercase tracking-[0.15em] mb-8 border border-white/10">
                                <Sparkles size={12} />
                                Start For Free
                            </div>
                            <h2 className="text-4xl md:text-5xl font-black text-white mb-5 tracking-tight">
                                Ready to collaborate?
                            </h2>
                            <p className="text-slate-400 text-lg font-medium mb-12 max-w-xl mx-auto leading-relaxed">
                                Join thousands of teams creating their best work together on SyncSpace.
                                Free to start, scale when you need.
                            </p>
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                                <Link
                                    to="/register"
                                    className="group px-12 py-4 bg-gradient-to-r from-indigo-500 to-blue-500 text-white rounded-2xl font-black text-lg tracking-wider shadow-xl shadow-indigo-500/20 hover:shadow-2xl hover:shadow-indigo-500/30 hover:scale-105 transition-all duration-300 flex items-center gap-2"
                                >
                                    Get Started Free
                                    <ArrowRight
                                        size={18}
                                        className="group-hover:translate-x-1 transition-transform"
                                    />
                                </Link>
                                <Link
                                    to="/login"
                                    className="px-12 py-4 bg-white/5 border border-white/15 text-white rounded-2xl font-black text-lg tracking-wider hover:bg-white/10 transition-all duration-300"
                                >
                                    Sign In
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ═══════════════════════ Footer ═══════════════════════ */}
            <footer className="bg-white border-t border-slate-200/80 py-16 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col md:flex-row justify-between items-start gap-12 mb-14">
                        {/* Brand */}
                        <div className="max-w-xs">
                            <div className="flex items-center gap-2.5 mb-5">
                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-blue-600 flex items-center justify-center shadow-lg shadow-indigo-500/15">
                                    <Layout className="text-white w-4 h-4" />
                                </div>
                                <span className="text-lg font-black text-slate-900 tracking-tight">
                                    SyncSpace
                                </span>
                            </div>
                            <p className="text-slate-500 font-medium leading-relaxed mb-6 text-sm">
                                The world's fastest collaborative whiteboard. Designed for
                                speed, precision, and simplicity.
                            </p>
                            <div className="flex gap-3">
                                <a
                                    href="#"
                                    className="w-9 h-9 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 rounded-xl flex items-center justify-center text-slate-400 transition-all duration-200"
                                >
                                    <Twitter size={16} />
                                </a>
                                <a
                                    href="#"
                                    className="w-9 h-9 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 rounded-xl flex items-center justify-center text-slate-400 transition-all duration-200"
                                >
                                    <Linkedin size={16} />
                                </a>
                                <a
                                    href="#"
                                    className="w-9 h-9 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 rounded-xl flex items-center justify-center text-slate-400 transition-all duration-200"
                                >
                                    <Github size={16} />
                                </a>
                            </div>
                        </div>

                        {/* Links */}
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-10 md:gap-20">
                            <div>
                                <h4 className="text-xs font-black text-slate-900 uppercase tracking-[0.15em] mb-5">
                                    Product
                                </h4>
                                <ul className="space-y-3 text-sm font-medium text-slate-500">
                                    <li>
                                        <a href="#features" className="hover:text-indigo-600 transition-colors">
                                            Features
                                        </a>
                                    </li>
                                    <li>
                                        <a href="#" className="hover:text-indigo-600 transition-colors">
                                            Changelog
                                        </a>
                                    </li>
                                    <li>
                                        <a href="#" className="hover:text-indigo-600 transition-colors">
                                            Templates
                                        </a>
                                    </li>
                                </ul>
                            </div>
                            <div>
                                <h4 className="text-xs font-black text-slate-900 uppercase tracking-[0.15em] mb-5">
                                    Company
                                </h4>
                                <ul className="space-y-3 text-sm font-medium text-slate-500">
                                    <li>
                                        <a href="#" className="hover:text-indigo-600 transition-colors">
                                            About Us
                                        </a>
                                    </li>
                                    <li>
                                        <a href="#" className="hover:text-indigo-600 transition-colors">
                                            Careers
                                        </a>
                                    </li>
                                    <li>
                                        <a href="#" className="hover:text-indigo-600 transition-colors">
                                            Contact
                                        </a>
                                    </li>
                                </ul>
                            </div>
                            <div>
                                <h4 className="text-xs font-black text-slate-900 uppercase tracking-[0.15em] mb-5">
                                    Legal
                                </h4>
                                <ul className="space-y-3 text-sm font-medium text-slate-500">
                                    <li>
                                        <a href="#" className="hover:text-indigo-600 transition-colors">
                                            Privacy
                                        </a>
                                    </li>
                                    <li>
                                        <a href="#" className="hover:text-indigo-600 transition-colors">
                                            Terms
                                        </a>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Bottom bar */}
                    <div className="pt-8 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-medium text-slate-400">
                        <p>© 2026 SyncSpace Inc. All rights reserved.</p>
                        <div className="flex gap-6">
                            <a href="#" className="hover:text-slate-600 transition-colors">
                                Status
                            </a>
                            <a href="#" className="hover:text-slate-600 transition-colors">
                                Security
                            </a>
                            <a href="#" className="hover:text-slate-600 transition-colors">
                                Sitemap
                            </a>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
