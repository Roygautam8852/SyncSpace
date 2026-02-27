import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import WhiteboardRoom from "./pages/WhiteboardRoom";
import Profile from "./pages/Profile";
import LandingPage from "./pages/LandingPage";

import { Toaster } from "react-hot-toast";

const PrivateRoute = ({ children }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-4">
                <div className="w-12 h-12 border-4 border-slate-100 border-t-violet-600 rounded-full animate-spin"></div>
                <span className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Syncing Session...</span>
            </div>
        );
    }

    return user ? children : <Navigate to="/login" />;
};

function App() {
    return (
        <div className="app bg-white dark:bg-slate-950 min-h-screen transition-colors duration-300">
            <Toaster
                position="top-right"
                toastOptions={{
                    className: '!bg-white !text-slate-800 !border-slate-200 !rounded-xl !shadow-2xl !text-sm !font-bold',
                    duration: 4000,
                }}
            />
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route
                    path="/dashboard"
                    element={
                        <PrivateRoute>
                            <Dashboard />
                        </PrivateRoute>
                    }
                />
                <Route
                    path="/profile"
                    element={
                        <PrivateRoute>
                            <Profile />
                        </PrivateRoute>
                    }
                />
                <Route
                    path="/room/:roomId"
                    element={
                        <PrivateRoute>
                            <WhiteboardRoom />
                        </PrivateRoute>
                    }
                />
                <Route path="/" element={<LandingPage />} />
            </Routes>
        </div>
    );
}

export default App;
