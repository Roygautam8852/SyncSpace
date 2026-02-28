import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { roomService, authService } from "../services/api";
import toast from "react-hot-toast";
import {
  Layout,
  Plus,
  Users,
  Compass,
  Settings,
  LogOut,
  Search,
  Grid,
  List,
  ArrowRight,
  Activity,
  Clock,
  MoreVertical,
  User,
  Folder,
  Share2,
  Trash2,
  Bell,
  HardDrive,
  CreditCard,
  Shield,
  CheckCircle,
  Zap,
  Mail,
  Lock,
  Camera,
  Globe,
  Languages,
  Moon,
  Sun,
  Monitor,
  Eye,
  BellOff,
  Copy,
  ExternalLink,
  MailPlus,
  ArrowLeftRight,
  Menu,
  X
} from "lucide-react";

const Dashboard = () => {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newRoomName, setNewRoomName] = useState("");
  const [joinRoomId, setJoinRoomId] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState("grid"); // 'grid' | 'list'
  const [activeTab, setActiveTab] = useState("boards"); // 'boards' | 'team' | 'recent' | 'account' | 'profile' | 'settings'
  const [openMemberMenu, setOpenMemberMenu] = useState(null); // userId of open menu
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [showMemberProfileModal, setShowMemberProfileModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showRemoveMemberModal, setShowRemoveMemberModal] = useState(false);
  const [copying, setCopying] = useState(false);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'system');
  const [profileName, setProfileName] = useState(user?.name || "");
  const [profileAvatar, setProfileAvatar] = useState(user?.avatar || "");
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const avatarInputRef = useRef(null);

  useEffect(() => {
    const root = window.document.documentElement;
    const applyTheme = (currentTheme) => {
      if (currentTheme === 'dark') {
        root.classList.add('dark');
      } else if (currentTheme === 'light') {
        root.classList.remove('dark');
      } else {
        const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        isDark ? root.classList.add('dark') : root.classList.remove('dark');
      }
    };

    applyTheme(theme);
    localStorage.setItem('theme', theme);

    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const listener = (e) => e.matches ? root.classList.add('dark') : root.classList.remove('dark');
      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    }
  }, [theme]);

  useEffect(() => {
    fetchRooms();
  }, []);

  useEffect(() => {
    if (user) {
      setProfileName(user.name || "");
      setProfileAvatar(user.avatar || "");
    }
  }, [user]);

  const fetchRooms = async () => {
    try {
      const res = await roomService.getUserRooms();
      setRooms(res.data.rooms);
    } catch (err) {
      toast.error("Failed to load boards");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    if (!newRoomName.trim()) return;
    try {
      const res = await roomService.createRoom({ roomName: newRoomName });
      navigate(`/room/${res.data.room.roomId}`);
      toast.success("Board created!");
    } catch (err) {
      toast.error("Creation failed");
    }
  };

  const handleJoinRoom = async (e) => {
    e.preventDefault();
    if (!joinRoomId.trim()) return;

    setIsJoining(true);
    try {
      const roomFormatted = joinRoomId.trim().toUpperCase();
      await roomService.joinRoom({ roomId: roomFormatted });
      toast.success("Joined board!");
      navigate(`/room/${roomFormatted}`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Board not found or access denied");
    } finally {
      setIsJoining(false);
    }
  };

  const handleDeleteRoom = async (roomId) => {
    setDeletingId(roomId);
    try {
      await roomService.deleteRoom(roomId);
      setRooms((prev) => prev.filter((r) => r.roomId !== roomId));
      toast.success("Board deleted");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete");
    } finally {
      setDeletingId(null);
      setShowDeleteModal(null);
    }
  };

  const handleProfileImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        return toast.error("Image too large (max 2MB)");
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
        setProfileAvatar(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProfileUpdate = async () => {
    if (!profileName.trim()) return toast.error("Name is required");
    setIsUpdatingProfile(true);
    try {
      const res = await authService.updateProfile({
        name: profileName,
        avatar: profileAvatar
      });
      updateUser(res.data.user);
      setAvatarPreview(null);
      toast.success("Profile updated!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Update failed");
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const filteredRooms = rooms.filter((r) =>
    r.roomName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.roomId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isHost = (room) =>
    room.host?.toString() === user?._id?.toString() || room.host === user?._id;

  const timeAgo = (date) => {
    const seconds = Math.floor((Date.now() - new Date(date)) / 1000);
    if (seconds < 60) return "just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const renderAccountContent = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Account Overview</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Manage your subscription, security, and personal data.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-200 dark:border-slate-800 p-8 shadow-sm">
            <div className="flex items-start justify-between mb-8">
              <div className="flex items-center gap-5">
                <div className="w-20 h-20 rounded-3xl bg-blue-600 flex items-center justify-center text-white text-2xl font-black shadow-xl shadow-blue-500/20 overflow-hidden border-2 border-white dark:border-slate-800">
                  {user?.avatar ? (
                    <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    user?.name?.[0]?.toUpperCase()
                  )}
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white">{user?.name}</h3>
                  <p className="text-slate-500 dark:text-slate-400 font-medium">{user?.email}</p>
                </div>
              </div>
              <button onClick={() => setActiveTab('profile')} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-xl text-xs font-bold transition-all">
                Edit Profile
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 hover:border-blue-500/30 transition-all group">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-white dark:bg-slate-800 flex items-center justify-center shadow-sm">
                    <Shield size={16} className="text-blue-600" />
                  </div>
                  <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Two-Factor Auth</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Not Enabled</span>
                  <button className="text-[10px] font-black text-blue-600 uppercase hover:underline">Enable</button>
                </div>
              </div>
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 hover:border-blue-500/30 transition-all">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-white dark:bg-slate-800 flex items-center justify-center shadow-sm">
                    <CheckCircle size={16} className="text-emerald-500" />
                  </div>
                  <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Account Status</span>
                </div>
                <div className="text-sm font-bold text-slate-700 dark:text-slate-300">Verified & Secure</div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-200 dark:border-slate-800 p-8 shadow-sm">
            <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest mb-6">Usage & Limits</h4>
            <div className="space-y-6">
              {[
                { label: 'Cloud Storage', used: '240MB', total: '1GB', percent: 24, icon: HardDrive, color: 'bg-blue-600' },
                { label: 'Workspaces', used: rooms.length, total: '10', percent: (rooms.length / 10) * 100, icon: Layout, color: 'bg-indigo-600' },
                { label: 'Team Members', used: teamMembers.length, total: '5', percent: (teamMembers.length / 5) * 100, icon: Users, color: 'bg-emerald-600' },
              ].map((item, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex justify-between items-end">
                    <div className="flex items-center gap-2">
                      <item.icon size={14} className="text-slate-400 dark:text-slate-500" />
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{item.label}</span>
                    </div>
                    <span className="text-[10px] font-black text-slate-500 dark:text-slate-400">{item.used} / {item.total}</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${item.color} rounded-full transition-all duration-1000 ease-out`}
                      style={{ width: `${item.percent}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Plan Card */}
        <div className="lg:col-span-1">
          <div className="bg-slate-900 rounded-[32px] p-8 text-white relative overflow-hidden shadow-2xl shadow-slate-900/20">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/20 blur-[60px] rounded-full -mr-10 -mt-10"></div>
            <div className="relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center mb-6 shadow-lg shadow-blue-600/40">
                <Zap size={24} className="text-white" fill="currentColor" />
              </div>
              <h3 className="text-2xl font-black mb-1">Starter Plan</h3>
              <p className="text-slate-400 text-sm font-medium mb-8">Perfect for individuals and small startups.</p>

              <div className="space-y-4 mb-10">
                {['Unlimited Boards', 'Basic Collaboration', '1GB Storage', 'Standard Support'].map((feature, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <CheckCircle size={16} className="text-blue-500" />
                    <span className="text-xs font-bold text-slate-200">{feature}</span>
                  </div>
                ))}
              </div>

              <button className="w-full py-4 bg-white text-slate-900 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-blue-50 transition-all shadow-xl shadow-white/5 active:scale-95">
                Upgrade to Pro
              </button>

              <div className="mt-6 flex flex-col gap-3">
                <button className="w-full py-3 border border-white/10 hover:bg-white/5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 transition-all flex items-center justify-center gap-2">
                  <CreditCard size={14} />
                  Manage Billing
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderProfileContent = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Personal Profile</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Update your personal information and public presence.</p>
        </div>
        <button
          onClick={handleProfileUpdate}
          disabled={isUpdatingProfile}
          className="px-5 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-blue-500/20 hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isUpdatingProfile && <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>}
          {isUpdatingProfile ? "Saving..." : "Save Changes"}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Avatar & Quick Info */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-200 dark:border-slate-800 p-8 shadow-sm flex flex-col items-center text-center">
            <div className="relative group mb-6">
              <input
                type="file"
                ref={avatarInputRef}
                onChange={handleProfileImageChange}
                accept="image/*"
                className="hidden"
              />
              <div className="w-32 h-32 rounded-[40px] bg-blue-600 flex items-center justify-center text-white text-4xl font-black shadow-2xl shadow-blue-500/20 overflow-hidden border-4 border-white dark:border-slate-800">
                {avatarPreview || profileAvatar ? (
                  <img src={avatarPreview || profileAvatar} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  user?.name?.[0]?.toUpperCase()
                )}
              </div>
              <button
                onClick={() => avatarInputRef.current?.click()}
                className="absolute bottom-0 right-0 w-10 h-10 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl flex items-center justify-center text-slate-400 dark:text-slate-500 hover:text-blue-600 hover:shadow-lg transition-all shadow-md active:scale-90 group-hover:scale-110"
              >
                <Camera size={18} />
              </button>
            </div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white mb-1">{user?.name}</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-6">{user?.email}</p>
            <div className="w-full h-px bg-slate-100 dark:bg-slate-800 mb-6"></div>
            <div className="w-full space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Member Since</span>
                <span className="font-black text-slate-700 dark:text-slate-300">Feb 2026</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Global Rank</span>
                <span className="font-black text-blue-600">#420</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-[32px] border border-slate-200 p-6 shadow-sm">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Integrations</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm text-blue-600">
                    <Globe size={16} />
                  </div>
                  <span className="text-xs font-bold text-slate-700">Google Docs</span>
                </div>
                <div className="w-10 h-5 bg-blue-600 rounded-full flex items-center justify-end px-1">
                  <div className="w-3 h-3 bg-white rounded-full"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Forms */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-200 dark:border-slate-800 p-8 shadow-sm">
            <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest mb-6 flex items-center gap-2">
              <User size={18} className="text-blue-600" />
              General Information
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Full Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-600" size={16} />
                  <input
                    type="text"
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-2xl text-sm font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 transition-all"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-600" size={16} />
                  <input
                    type="email"
                    defaultValue={user?.email}
                    disabled
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl text-sm font-bold text-slate-400 dark:text-slate-500 cursor-not-allowed"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-200 dark:border-slate-800 p-8 shadow-sm">
            <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest mb-6 flex items-center gap-2">
              <Lock size={18} className="text-blue-600" />
              Security Settings
            </h4>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Current Password</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    className="w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-2xl text-sm font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 transition-all font-mono"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">New Password</label>
                  <input
                    type="password"
                    placeholder="New password"
                    className="w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-2xl text-sm font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 transition-all font-mono"
                  />
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 flex gap-3">
                <Shield size={20} className="text-amber-500 shrink-0" />
                <p className="text-xs text-amber-700 dark:text-amber-400 font-medium leading-relaxed">
                  Changing your password will log you out from all other devices. Make sure you remember your new password.
                </p>
              </div>
              <button className="px-6 py-3 bg-slate-900 dark:bg-blue-600 text-white rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-800 dark:hover:bg-blue-700 transition-all shadow-lg active:scale-95">
                Update Security
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSettingsContent = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">App Settings</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Configure your workspace environment and notifications.</p>
        </div>
        <button className="px-5 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-blue-500/20 hover:bg-blue-700 active:scale-95 transition-all">
          Update Settings
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Appearance Settings */}
        <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-200 dark:border-slate-800 p-8 shadow-sm">
          <h4 className="text-sm font-black text-slate-900 dark:text-slate-100 uppercase tracking-widest mb-6 flex items-center gap-2">
            <Eye size={18} className="text-blue-600" />
            Appearance
          </h4>
          <div className="space-y-6">
            <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Interface Theme</label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'light', label: 'Light', icon: Sun },
                  { id: 'dark', label: 'Dark', icon: Moon },
                  { id: 'system', label: 'System', icon: Monitor },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTheme(t.id)}
                    className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${theme === t.id ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-500/10' : 'border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700'}`}
                  >
                    <t.icon size={20} className={theme === t.id ? 'text-blue-600' : 'text-slate-400 dark:text-slate-500'} />
                    <span className={`text-[10px] font-black uppercase tracking-widest ${theme === t.id ? 'text-blue-600' : 'text-slate-500 dark:text-slate-400'}`}>{t.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
              <div className="flex flex-col">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200">Compact Sidebar</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Reduce sidebar width for more workspace</span>
              </div>
              <div className="w-10 h-5 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center px-1">
                <div className="w-3 h-3 bg-white rounded-full shadow-sm"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-200 dark:border-slate-800 p-8 shadow-sm">
          <h4 className="text-sm font-black text-slate-900 dark:text-slate-100 uppercase tracking-widest mb-6 flex items-center gap-2">
            <Bell size={18} className="text-blue-600" />
            Notifications
          </h4>
          <div className="space-y-4">
            {[
              { id: 'email', label: 'Email Notifications', desc: 'Get weekly activity digests', icon: Mail, enabled: true },
              { id: 'desktop', label: 'Desktop Alerts', desc: 'Instant browser notifications', icon: Bell, enabled: false },
              { id: 'marketing', label: 'Marketing Emails', desc: 'New features and promotions', icon: Zap, enabled: true },
            ].map((pref) => (
              <div key={pref.id} className="flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-2xl transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500">
                    <pref.icon size={18} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{pref.label}</span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">{pref.desc}</span>
                  </div>
                </div>
                <div className={`w-10 h-5 rounded-full flex items-center px-1 transition-colors ${pref.enabled ? 'bg-blue-600 justify-end' : 'bg-slate-200 dark:bg-slate-700'}`}>
                  <div className="w-3 h-3 bg-white rounded-full shadow-sm"></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Workspace Settings */}
        <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-200 dark:border-slate-800 p-8 shadow-sm lg:col-span-2">
          <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest mb-6 flex items-center gap-2">
            <Layout size={18} className="text-blue-600" />
            Workspace Preferences
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Default Board View</label>
                <select className="w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-2xl text-sm font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 transition-all appearance-none cursor-pointer">
                  <option>Grid View (Recommended)</option>
                  <option>List View</option>
                  <option>Table View</option>
                </select>
              </div>
              <div className="flex items-center justify-between p-4 bg-emerald-50 dark:bg-emerald-500/10 rounded-2xl border border-emerald-100 dark:border-emerald-500/20">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-emerald-900 dark:text-emerald-400">Auto-Save Drafts</span>
                  <span className="text-[10px] text-emerald-700/70 dark:text-emerald-500/60 font-medium">Instantly save all whiteboard changes</span>
                </div>
                <div className="w-10 h-5 bg-emerald-500 rounded-full flex items-center justify-end px-1">
                  <div className="w-3 h-3 bg-white rounded-full shadow-sm"></div>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-dash border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center text-center">
                <div className="w-12 h-12 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center mb-3 shadow-sm border border-slate-100 dark:border-slate-800 text-slate-300 dark:text-slate-600">
                  <Languages size={24} />
                </div>
                <h5 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Language & Region</h5>
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-4">English (United States) - UTC+5:30</p>
                <button className="text-[10px] font-black text-blue-600 uppercase hover:underline">Change Localization</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Extract unique team members from all boards
  const teamMembers = rooms.reduce((acc, room) => {
    room.participants.forEach(p => {
      if (!acc.find(m => m.userId === p.userId)) {
        acc.push({
          ...p,
          email: p.userId === user?._id ? user?.email : p.email,
          role: room.host === p.userId ? 'Owner' : 'Collaborator',
          lastSeen: room.updatedAt,
          boardsCount: rooms.filter(r => r.participants.some(part => part.userId === p.userId)).length
        });
      }
    });
    return acc;
  }, []);

  const renderTeamContent = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Team Members</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Manage your workspace collaborators and their roles.</p>
        </div>
        <button
          onClick={() => setShowInviteModal(true)}
          className="px-5 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-blue-500/20 hover:bg-blue-700 active:scale-95 transition-all flex items-center gap-2"
        >
          <Plus size={16} />
          Invite Member
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-visible">
        <div className="overflow-visible">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Member</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Role</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Boards</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {teamMembers.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-slate-400 font-medium italic">
                    No team members found. Start by creating a board!
                  </td>
                </tr>
              ) : teamMembers.map((member) => (
                <tr key={member.userId} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-sm border-2 border-white dark:border-slate-800 shadow-sm ring-1 ring-slate-100 dark:ring-slate-800">
                        {member.name?.[0]?.toUpperCase()}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-900 dark:text-slate-100">{member.name} {member.userId === user?._id && <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded ml-1 font-black">YOU</span>}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">{member.email || 'No email provided'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${member.role === 'Owner' ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>
                      {member.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Folder size={14} className="text-slate-400 dark:text-slate-600" />
                      <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{member.boardsCount}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                      <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">Active</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenMemberMenu(openMemberMenu === member.userId ? null : member.userId);
                      }}
                      className="p-2 text-slate-300 dark:text-slate-600 hover:text-slate-600 dark:hover:text-slate-400 hover:bg-white dark:hover:bg-slate-800 hover:shadow-md rounded-lg transition-all"
                    >
                      <MoreVertical size={16} />
                    </button>

                    {/* Floating Dropdown Menu */}
                    {openMemberMenu === member.userId && (
                      <>
                        <div className="fixed inset-0 z-[60]" onClick={() => setOpenMemberMenu(null)}></div>
                        <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-700 p-2 z-[70] animate-in fade-in zoom-in-95 origin-top-right duration-200">
                          <button
                            onClick={() => {
                              setSelectedMember(member);
                              setShowMemberProfileModal(true);
                              setOpenMemberMenu(null);
                            }}
                            className="w-full text-left px-3 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center gap-2 group transition-all"
                          >
                            <User size={14} className="text-slate-400 dark:text-slate-500 group-hover:text-blue-600" />
                            View Profile
                          </button>
                          <button
                            onClick={() => {
                              setSelectedMember(member);
                              setShowRoleModal(true);
                              setOpenMemberMenu(null);
                            }}
                            className="w-full text-left px-3 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center gap-2 group transition-all"
                          >
                            <Settings size={14} className="text-slate-400 dark:text-slate-500 group-hover:text-blue-600" />
                            Change Role
                          </button>
                          <div className="h-px bg-slate-50 dark:bg-slate-700 my-1 mx-2"></div>
                          <button
                            onClick={() => {
                              setSelectedMember(member);
                              setShowRemoveMemberModal(true);
                              setOpenMemberMenu(null);
                            }}
                            className="w-full text-left px-3 py-2.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl text-xs font-bold text-red-500 flex items-center gap-2 group transition-all"
                          >
                            <Trash2 size={14} className="text-red-400 group-hover:text-red-600" />
                            Remove Member
                          </button>
                        </div>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderRecentContent = () => {
    const sortedRecent = [...rooms].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Recent Activity</h2>
            <p className="text-sm text-slate-500 font-medium">Continue where you left off on your most recent projects.</p>
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-white rounded-2xl border border-slate-200 animate-pulse"></div>
            ))}
          </div>
        ) : sortedRecent.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-20 flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-6">
              <Clock className="text-slate-300 w-8 h-8" />
            </div>
            <h4 className="text-lg font-bold text-slate-900">No recent activity</h4>
            <p className="text-slate-500 text-sm font-medium mt-1 max-w-xs">Boards you edit or join will appear here automatically.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedRecent.map((room, idx) => (
              <Link
                key={room.roomId}
                to={`/room/${room.roomId}`}
                className="block group"
              >
                <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl dark:hover:shadow-blue-500/5 hover:-translate-y-0.5 hover:border-blue-500/30 transition-all duration-300 flex items-center gap-6">
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${boardColors[idx % boardColors.length]} flex items-center justify-center text-white shrink-0 shadow-lg shadow-blue-500/10`}>
                    <Layout size={24} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-bold text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors truncate">
                        {room.roomName}
                      </h4>
                      <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                        {room.roomId.slice(0, 8)}
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
                        <Clock size={12} className="text-slate-300 dark:text-slate-600" />
                        {timeAgo(room.updatedAt)}
                      </div>
                      <div className="h-1 w-1 bg-slate-300 dark:bg-slate-700 rounded-full"></div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
                        <Users size={12} className="text-slate-300 dark:text-slate-600" />
                        {room.participants.length} {room.participants.length === 1 ? 'member' : 'members'}
                      </div>
                    </div>
                  </div>

                  <div className="hidden sm:flex -space-x-2 mr-4">
                    {room.participants.slice(0, 3).map((p, i) => (
                      <div key={i} className="w-8 h-8 rounded-full border-2 border-white dark:border-slate-800 bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] font-black text-slate-600 dark:text-slate-400 overflow-hidden ring-1 ring-slate-100 dark:ring-slate-700">
                        {p.name?.[0]?.toUpperCase()}
                      </div>
                    ))}
                    {room.participants.length > 3 && (
                      <div className="w-8 h-8 rounded-full border-2 border-white dark:border-slate-800 bg-blue-600 flex items-center justify-center text-[10px] font-black text-white ring-1 ring-slate-100 dark:ring-slate-700">
                        +{room.participants.length - 3}
                      </div>
                    )}
                  </div>

                  <div className="w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-300 dark:text-slate-600 group-hover:bg-blue-600 group-hover:text-white transition-all transform group-hover:rotate-12">
                    <ArrowRight size={18} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderBoardsContent = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Welcome Card */}
      <div className="relative bg-gradient-to-r from-blue-700 to-indigo-800 rounded-2xl p-6 overflow-hidden shadow-xl shadow-blue-900/10">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5"></div>
        <div className="relative z-10">
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-100 text-[9px] font-bold uppercase tracking-wider mb-2 border border-white/10 backdrop-blur-md">
            <Activity size={10} />
            Beta Preview 2.0
          </div>
          <h1 className="text-2xl font-black text-white mb-1.5">
            {(() => {
              const hour = new Date().getHours();
              if (hour < 12) return `Good morning, ${user?.name?.split(' ')[0]} 👋`;
              if (hour < 17) return `Good afternoon, ${user?.name?.split(' ')[0]} ☀️`;
              return `Good evening, ${user?.name?.split(' ')[0]} 🌙`;
            })()}
          </h1>
          <p className="text-blue-100/80 text-sm font-medium max-w-lg">
            Create spaces where your team can collaborate and build something amazing together.
          </p>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Boards', value: rooms.length, icon: HardDrive, color: 'text-blue-600', bg: 'bg-blue-100' },
          { label: 'My Boards', value: rooms.filter(isHost).length, icon: User, color: 'text-indigo-600', bg: 'bg-indigo-100' },
          { label: 'Shared', value: rooms.filter(r => !isHost(r)).length, icon: Share2, color: 'text-cyan-600', bg: 'bg-cyan-100' },
          { label: 'Collaborators', value: teamMembers.length, icon: Users, color: 'text-emerald-600', bg: 'bg-emerald-100' },
        ].map((stat, i) => (
          <div key={i} className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex items-center justify-between">
            <div>
              <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-0.5">{stat.label}</div>
              <div className="text-xl font-black text-slate-900 dark:text-slate-100">{stat.value}</div>
            </div>
            <div className={`w-10 h-10 ${stat.bg} ${stat.color} rounded-lg flex items-center justify-center`}>
              <stat.icon size={20} />
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-lg shadow-slate-200/30 dark:shadow-none relative group overflow-hidden">
          <h2 className="text-lg font-black text-slate-900 dark:text-slate-100 mb-1 relative z-10">New Board</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-5 relative z-10">Start a fresh project from scratch</p>

          <form onSubmit={handleCreateRoom} className="flex gap-2 relative z-10">
            <input
              type="text"
              className="flex-1 px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 transition-all shadow-inner"
              placeholder="Enter name..."
              value={newRoomName}
              onChange={(e) => setNewRoomName(e.target.value)}
            />
            <button
              type="submit"
              className="px-5 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest shadow-md shadow-blue-500/20 hover:bg-blue-700 active:scale-95 transition-all flex items-center gap-1.5"
            >
              <Plus size={16} />
              Create
            </button>
          </form>
        </div>

        <div className="bg-blue-600 rounded-2xl p-6 border border-blue-500 shadow-lg shadow-blue-600/20 relative group overflow-hidden">
          <h2 className="text-lg font-black text-white mb-1 relative z-10">Join Room</h2>
          <p className="text-xs text-blue-100/70 font-medium mb-5 relative z-10">Enter an existing invitation code</p>

          <form onSubmit={handleJoinRoom} className="flex gap-2 relative z-10">
            <input
              type="text"
              className="flex-1 px-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-sm font-bold text-white placeholder:text-blue-200/50 focus:outline-none focus:border-white focus:bg-white/20 transition-all font-mono"
              placeholder="Room ID..."
              value={joinRoomId}
              onChange={(e) => setJoinRoomId(e.target.value)}
            />
            <button
              type="submit"
              disabled={isJoining || !joinRoomId.trim()}
              className="px-5 py-2.5 bg-white text-blue-600 rounded-xl font-bold text-xs uppercase tracking-widest shadow-md shadow-black/10 hover:bg-blue-50 active:scale-95 transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              <ArrowRight size={16} />
              Join
            </button>
          </form>
        </div>
      </div>

      {/* Boards Section */}
      <div className="pt-2">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-black text-slate-900 dark:text-slate-100 tracking-tight">Recent Boards</h3>
            <div className="h-4 w-px bg-slate-300"></div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-slate-800 text-blue-600 shadow-sm border border-slate-200 dark:border-slate-700' : 'text-slate-400 dark:text-slate-600 hover:text-slate-600 dark:hover:text-slate-400'}`}
              >
                <Grid size={16} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white dark:bg-slate-800 text-blue-600 shadow-sm border border-slate-200 dark:border-slate-700' : 'text-slate-400 dark:text-slate-600 hover:text-slate-600 dark:hover:text-slate-400'}`}
              >
                <List size={16} />
              </button>
            </div>
          </div>
          <Link to="#" className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 group">
            All Boards
            <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-48 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 animate-pulse"></div>
            ))}
          </div>
        ) : filteredRooms.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 flex flex-col items-center text-center transition-colors">
            <div className="w-14 h-14 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-center mb-4">
              <Folder className="text-slate-300 dark:text-slate-600 w-7 h-7" />
            </div>
            <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">No boards</h4>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {filteredRooms.map((room, idx) => (
              <div key={room.roomId} className="group relative">
                <Link to={`/room/${room.roomId}`}>
                  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl hover:shadow-blue-500/10 hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col h-full border-b-4 border-b-blue-600">
                    <div className={`h-24 bg-gradient-to-br ${boardColors[idx % boardColors.length]} relative`}>
                      <div className="absolute inset-0 opacity-5 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
                      <div className="absolute bottom-[-12px] left-4 w-9 h-9 rounded-xl bg-white dark:bg-slate-800 shadow-md flex items-center justify-center border border-slate-100 dark:border-slate-800">
                        <Layout size={18} className="text-blue-600" />
                      </div>
                    </div>
                    <div className="p-5 pt-6 flex-1 flex flex-col">
                      <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm mb-1 group-hover:text-blue-600 transition-colors truncate">
                        {room.roomName}
                      </h4>
                      <div className="flex items-center gap-1.5 mb-4">
                        <Clock size={10} className="text-slate-400 dark:text-slate-500" />
                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{timeAgo(room.updatedAt)}</span>
                      </div>
                      <div className="mt-auto flex items-center justify-between">
                        <div className="flex -space-x-1.5">
                          {room.participants.slice(0, 3).map((p, i) => (
                            <div key={i} className="w-6 h-6 rounded-full border-2 border-white dark:border-slate-800 bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-[8px] font-bold text-slate-600 dark:text-slate-300 overflow-hidden">
                              {p.name?.[0]?.toUpperCase()}
                            </div>
                          ))}
                        </div>
                        <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-[9px] font-bold text-slate-500 dark:text-slate-400">
                          {room.roomId.slice(0, 6)}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
                {isHost(room) && (
                  <button
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowDeleteModal(room.roomId); }}
                    className="absolute top-2 right-2 p-1.5 bg-white/90 dark:bg-slate-900/90 rounded-lg text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all border border-slate-100 dark:border-slate-800"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredRooms.map((room) => (
              <div key={room.roomId} className="group relative">
                <Link to={`/room/${room.roomId}`}>
                  <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-blue-500/30 transition-all flex items-center gap-4">
                    <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                      <Layout size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 group-hover:text-blue-600 transition-colors truncate">{room.roomName}</h4>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">
                        <span>{room.roomId.slice(0, 8)}</span>
                        <span>•</span>
                        <span>{timeAgo(room.updatedAt)}</span>
                      </div>
                    </div>
                    <div className="flex -space-x-1.5 mr-3">
                      {room.participants.slice(0, 3).map((p, i) => (
                        <div key={i} className="w-6 h-6 rounded-full border border-white dark:border-slate-800 bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-[8px] font-bold text-slate-600 dark:text-slate-300">
                          {p.name?.[0]?.toUpperCase()}
                        </div>
                      ))}
                    </div>
                    {isHost(room) && (
                      <button
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowDeleteModal(room.roomId); }}
                        className="p-1.5 text-slate-300 hover:text-red-500 rounded-lg transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  // Color palette for board preview backgrounds
  const boardColors = [
    "from-violet-500/20 to-purple-500/10",
    "from-blue-500/20 to-cyan-500/10",
    "from-emerald-500/20 to-teal-500/10",
    "from-amber-500/20 to-orange-500/10",
    "from-rose-500/20 to-pink-500/10",
    "from-indigo-500/20 to-sky-500/10",
  ];

  return (
    <div className="flex h-screen bg-[#F8FAFC] dark:bg-slate-950 transition-colors duration-300">
      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* ─── Sidebar ─── */}
      <aside className={`w-64 bg-[#1E293B] text-slate-300 flex flex-col shrink-0 border-r border-slate-800 fixed md:relative z-50 h-[100dvh] transition-transform duration-300 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Layout className="text-white w-4 h-4" />
            </div>
            <span className="text-lg font-bold text-white tracking-tight">SyncSpace</span>
          </div>
          <button className="md:hidden text-slate-400 hover:text-white" onClick={() => setIsMobileMenuOpen(false)}>
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 px-3 mt-2 space-y-0.5">
          <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest px-4 mb-1.5 opacity-60">Workspace</div>
          <button
            onClick={() => setActiveTab('boards')}
            className={`w-full flex items-center gap-2.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'boards' ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white group'}`}
          >
            <Folder size={16} className={activeTab === 'boards' ? 'text-white' : 'text-slate-400 group-hover:text-white'} />
            Boards
          </button>
          <button
            onClick={() => setActiveTab('team')}
            className={`w-full flex items-center gap-2.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'team' ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white group'}`}
          >
            <Users size={16} className={activeTab === 'team' ? 'text-white' : 'text-slate-400 group-hover:text-white'} />
            My Team
          </button>
          <button
            onClick={() => setActiveTab('recent')}
            className={`w-full flex items-center gap-2.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'recent' ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white group'}`}
          >
            <Activity size={16} className={activeTab === 'recent' ? 'text-white' : 'text-slate-400 group-hover:text-white'} />
            Recent
          </button>

          <div className="pt-4 text-[9px] font-bold text-slate-500 uppercase tracking-widest px-4 mb-1.5 opacity-60">Personal</div>
          <button
            onClick={() => setActiveTab('account')}
            className={`w-full flex items-center gap-2.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'account' ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white group'}`}
          >
            <HardDrive size={16} className={activeTab === 'account' ? 'text-white' : 'text-slate-400 group-hover:text-white'} />
            Account
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`w-full flex items-center gap-2.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'profile' ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white group'}`}
          >
            <User size={16} className={activeTab === 'profile' ? 'text-white' : 'text-slate-400 group-hover:text-white'} />
            Profile
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`w-full flex items-center gap-2.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'settings' ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white group'}`}
          >
            <Settings size={16} className={activeTab === 'settings' ? 'text-white' : 'text-slate-400 group-hover:text-white'} />
            Settings
          </button>
        </nav>

        <div className="p-3 mt-auto">
          <div className="bg-slate-800/40 rounded-xl p-3 border border-slate-700/30">
            <div className="flex items-center gap-2.5 mb-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-600/10 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold text-xs shrink-0 overflow-hidden">
                {user?.avatar ? (
                  <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  user?.name?.[0]?.toUpperCase()
                )}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-white truncate">{user?.name}</div>
                <div className="text-[9px] text-slate-500 truncate leading-none">{user?.email || 'Free Member'}</div>
              </div>
            </div>
            <button
              onClick={logout}
              className="w-full flex items-center justify-center gap-2 py-1.5 text-[10px] font-bold text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 rounded-lg transition-all"
            >
              <LogOut size={12} />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* ─── Main Content ─── */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden no-scrollbar w-full relative">
        {/* Top bar */}
        <div className="h-14 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 px-4 md:px-6 flex items-center justify-between transition-colors duration-300">
          <div className="flex items-center gap-3 w-full max-w-[200px] md:max-w-xs">
            <button className="md:hidden p-1.5 text-slate-400 hover:text-blue-600 -ml-2 shrink-0" onClick={() => setIsMobileMenuOpen(true)}>
              <Menu size={22} />
            </button>
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 w-3.5 h-3.5 hidden sm:block" />
              <input
                type="text"
                placeholder="Search..."
                className="w-full pl-3 sm:pl-9 pr-4 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <button className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-blue-600 transition-colors relative">
              <Bell size={18} />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full border border-white dark:border-slate-900"></span>
            </button>
            <div className="w-px h-5 bg-slate-200 dark:bg-slate-700 mx-0.5 sm:mx-1"></div>
            <div className="flex items-center gap-2 sm:gap-2.5 cursor-pointer" onClick={() => setActiveTab('profile')}>
              <div className="hidden sm:flex flex-col items-end leading-tight">
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100">{user?.name}</span>
                <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest">Active</span>
              </div>
              <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 border-2 border-white dark:border-slate-700 shadow-sm overflow-hidden shrink-0 flex items-center justify-center">
                {user?.avatar ? (
                  <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-blue-600 text-white font-black text-[10px] uppercase">
                    {user?.name?.[0]?.toUpperCase()}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 max-w-[1280px] mx-auto">
          {activeTab === 'boards' && renderBoardsContent()}
          {activeTab === 'team' && renderTeamContent()}
          {activeTab === 'recent' && renderRecentContent()}
          {activeTab === 'account' && renderAccountContent()}
          {activeTab === 'profile' && renderProfileContent()}
          {activeTab === 'settings' && renderSettingsContent()}
          {(activeTab !== 'boards' && activeTab !== 'team' && activeTab !== 'recent' && activeTab !== 'account' && activeTab !== 'profile' && activeTab !== 'settings') && (
            <div className="h-[60vh] flex flex-col items-center justify-center text-center animate-in fade-in duration-500">
              <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-3xl flex items-center justify-center mb-6 text-slate-300 dark:text-slate-600">
                <Settings size={40} />
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">Section Under Development</h3>
              <p className="text-slate-500 dark:text-slate-400 font-medium max-w-xs mx-auto">
                We're currently building the {activeTab} section to the highest production standards. Stay tuned!
              </p>
            </div>
          )}
        </div>
      </main>

      {/* ─── Team Modals ─── */}

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setShowInviteModal(false)}></div>
          <div className="relative bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[40px] p-10 max-w-lg w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-3xl flex items-center justify-center mb-8 mx-auto shadow-lg shadow-blue-200/50 dark:shadow-none">
              <MailPlus size={40} />
            </div>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white text-center mb-2 leading-tight">Invite Collaborators</h3>
            <p className="text-slate-500 dark:text-slate-400 text-center font-medium mb-8">Spread the word and build amazing things together.</p>

            <div className="space-y-4">
              <div className="p-5 bg-slate-50 dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-800">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1 mb-2 block">Direct Invite Link</label>
                <div className="flex gap-2">
                  <div className="flex-1 px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-mono text-slate-500 dark:text-slate-400 truncate flex items-center">
                    https://syncspace.app/invite/{Math.random().toString(36).substring(7)}
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText("https://syncspace.app/invite/example");
                      setCopying(true);
                      setTimeout(() => setCopying(false), 2000);
                      toast.success("Link copied to clipboard!");
                    }}
                    className={`px-5 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all flex items-center gap-2 ${copying ? 'bg-emerald-500 text-white' : 'bg-slate-900 dark:bg-blue-600 text-white hover:bg-slate-800 dark:hover:bg-blue-700'}`}
                  >
                    {copying ? <CheckCircle size={14} /> : <Copy size={14} />}
                    {copying ? 'Copied' : 'Copy'}
                  </button>
                </div>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-100 dark:border-slate-800"></span></div>
                <div className="relative flex justify-center text-[10px] uppercase font-black tracking-[0.2em] text-slate-300 dark:text-slate-600 bg-white dark:bg-slate-900 px-4">or invite by email</div>
              </div>

              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="collaborator@example.com"
                  className="flex-1 px-5 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-3xl text-sm font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 transition-all shadow-inner"
                />
                <button
                  onClick={() => {
                    toast.success("Invitation sent successfully!");
                    setShowInviteModal(false);
                  }}
                  className="px-8 bg-blue-600 text-white rounded-3xl font-black uppercase tracking-widest text-[10px] hover:bg-blue-700 active:scale-95 transition-all shadow-lg shadow-blue-500/20"
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Member Profile Modal */}
      {showMemberProfileModal && selectedMember && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setShowMemberProfileModal(false)}></div>
          <div className="relative bg-white dark:bg-slate-900 rounded-[40px] p-10 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden border border-slate-100 dark:border-slate-800">
            <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-br from-blue-600 to-indigo-700"></div>
            <div className="relative z-10">
              <div className="flex flex-col items-center">
                <div className="w-24 h-24 rounded-[32px] bg-white dark:bg-slate-800 p-1.5 shadow-xl mb-4 mt-6">
                  <div className="w-full h-full rounded-[26px] bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-blue-600 dark:text-blue-400 text-3xl font-black border-2 border-white dark:border-slate-800">
                    {selectedMember.name?.[0]?.toUpperCase()}
                  </div>
                </div>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-1">{selectedMember.name}</h3>
                <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest mb-8 ${selectedMember.role === 'Owner' ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>
                  {selectedMember.role}
                </div>

                <div className="w-full grid grid-cols-2 gap-4 mb-8">
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-700 text-center">
                    <div className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Boards Shared</div>
                    <div className="text-xl font-black text-slate-900 dark:text-white">{selectedMember.boardsCount}</div>
                  </div>
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-700 text-center">
                    <div className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Global Rank</div>
                    <div className="text-xl font-black text-blue-600 font-mono">#7.2k</div>
                  </div>
                </div>

                <div className="w-full space-y-3">
                  <button className="w-full py-4 bg-slate-900 dark:bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-800 dark:hover:bg-blue-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/10">
                    <Mail size={16} />
                    Send Message
                  </button>
                  <button className="w-full py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-200 dark:hover:bg-slate-700 transition-all flex items-center justify-center gap-2">
                    <ExternalLink size={16} />
                    View External Profile
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Change Role Modal */}
      {showRoleModal && selectedMember && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setShowRoleModal(false)}></div>
          <div className="relative bg-white dark:bg-slate-900 rounded-[40px] p-10 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200 border border-slate-100 dark:border-slate-800">
            <div className="w-20 h-20 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-3xl flex items-center justify-center mb-8 mx-auto shadow-lg shadow-indigo-200/50 dark:shadow-none">
              <ArrowLeftRight size={40} />
            </div>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white text-center mb-2 leading-tight">Change Role</h3>
            <p className="text-slate-500 dark:text-slate-400 text-center font-medium mb-8">Modify permissions for <span className="text-slate-900 dark:text-slate-200 font-bold">{selectedMember.name}</span>.</p>

            <div className="space-y-3">
              {[
                { id: 'Owner', desc: 'Full control over workspaces and team management.' },
                { id: 'Collaborator', desc: 'Can edit boards and participate in shared projects.' }
              ].map((role) => (
                <button
                  key={role.id}
                  onClick={() => {
                    toast.success(`${selectedMember.name}'s role updated to ${role.id}`);
                    setShowRoleModal(false);
                  }}
                  className={`w-full text-left p-5 rounded-3xl border-2 transition-all ${selectedMember.role === role.id ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-900/10' : 'border-slate-50 dark:border-slate-800 hover:border-slate-100 dark:hover:border-slate-700'}`}
                >
                  <div className="font-black text-sm text-slate-900 dark:text-slate-100 mb-1">{role.id}</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed">{role.desc}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Remove Member Confirmation */}
      {showRemoveMemberModal && selectedMember && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setShowRemoveMemberModal(false)}></div>
          <div className="relative bg-white dark:bg-slate-900 rounded-[40px] p-10 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200 border border-slate-100 dark:border-slate-800">
            <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-3xl flex items-center justify-center mb-8 mx-auto shadow-lg shadow-red-200/50 dark:shadow-none">
              <Trash2 size={40} />
            </div>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white text-center mb-4 leading-tight">Remove member?</h3>
            <p className="text-slate-500 dark:text-slate-400 text-center font-medium text-lg leading-relaxed mb-10">
              Are you sure you want to remove <span className="text-slate-900 dark:text-slate-200 font-black underline decoration-red-500/30 underline-offset-4">{selectedMember.name}</span>? They will lose access to all your shared workspaces.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setShowRemoveMemberModal(false)}
                className="py-4 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-200 font-black uppercase tracking-widest text-xs hover:bg-slate-200 dark:hover:bg-slate-700 transition-all border-b-4 border-slate-300 dark:border-slate-700 active:border-b-0 active:translate-y-1"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  toast.success(`${selectedMember.name} removed from workspace`);
                  setShowRemoveMemberModal(false);
                }}
                className="py-4 rounded-2xl bg-red-500 text-white font-black uppercase tracking-widest text-xs hover:bg-red-600 transition-all border-b-4 border-red-700 active:border-b-0 active:translate-y-1 shadow-lg shadow-red-200/50"
              >
                Confirm Removal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Delete Modal ─── */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setShowDeleteModal(null)}></div>
          <div className="relative bg-white dark:bg-slate-900 rounded-[40px] p-10 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200 border border-slate-100 dark:border-slate-800">
            <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-3xl flex items-center justify-center mb-8 mx-auto shadow-lg shadow-red-200/50 dark:shadow-none">
              <Trash2 size={40} />
            </div>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white text-center mb-4 leading-tight">Delete workspace?</h3>
            <p className="text-slate-500 dark:text-slate-400 text-center font-medium text-lg leading-relaxed mb-10">
              This action is <span className="text-emerald-500 font-black uppercase underline decoration-2 underline-offset-4">permanent</span>. All data in this board will be lost forever.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setShowDeleteModal(null)}
                className="py-4 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-200 font-black uppercase tracking-widest text-xs hover:bg-slate-200 dark:hover:bg-slate-700 transition-all border-b-4 border-slate-300 dark:border-slate-700 active:border-b-0 active:translate-y-1"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteRoom(showDeleteModal)}
                disabled={deletingId === showDeleteModal}
                className="py-4 rounded-2xl bg-red-500 text-white font-black uppercase tracking-widest text-xs hover:bg-red-600 transition-all border-b-4 border-red-700 active:border-b-0 active:translate-y-1 disabled:opacity-50 shadow-lg shadow-red-200/50"
              >
                {deletingId === showDeleteModal ? "Deleting..." : "Confirm Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
