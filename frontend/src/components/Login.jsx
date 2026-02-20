import React, { useState } from 'react';
import { Lock, User, Eye, EyeOff, TreeDeciduous } from 'lucide-react';

const Login = ({ onLogin }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        // Credenciales solicitadas por el usuario
        if (username === 'Martina' && password === 'MarFebe22') {
            onLogin(true);
            localStorage.setItem('isAuthenticated', 'true');
        } else {
            setError('Usuario o contraseña incorrectos');
        }
    };

    return (
        <div className="min-h-screen bg-[#fcfaf7] flex items-center justify-center p-4">
            <div className="max-w-md w-full">
                <div className="bg-white rounded-[2.5rem] p-8 shadow-2xl shadow-slate-200/50 border border-slate-100 relative overflow-hidden">
                    {/* Decorative Elements */}
                    <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-50 rounded-full blur-3xl opacity-50" />
                    <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-amber-50 rounded-full blur-3xl opacity-50" />

                    <div className="relative text-center mb-10">
                        <div className="w-24 h-24 mx-auto mb-6 bg-emerald-600 rounded-3xl rotate-12 flex items-center justify-center shadow-xl shadow-emerald-200 overflow-hidden border-4 border-white">
                            <img src="/logo.png" alt="Ko'eju Logo" className="-rotate-12 w-full h-full object-cover" />
                        </div>
                        <h1 className="text-3xl font-black text-slate-800 tracking-tight">
                            Establecimiento <span className="text-emerald-600">ko'ẽju</span>
                        </h1>
                        <p className="text-slate-500 font-medium mt-1">Gestión Ganadera Inteligente</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-2">Usuario</label>
                            <div className="relative group">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-500 transition-colors" size={20} />
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-12 pr-4 outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-medium text-slate-700"
                                    placeholder="Nombre de usuario"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-2">Contraseña</label>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-500 transition-colors" size={20} />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-12 pr-12 outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-medium text-slate-700"
                                    placeholder="••••••••"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition-colors"
                                >
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                        </div>

                        {error && (
                            <div className="bg-red-50 text-red-500 text-sm py-3 px-4 rounded-xl font-bold flex items-center gap-2 border border-red-100 animate-shake">
                                <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-5 rounded-2xl shadow-xl shadow-slate-200 transition-all hover:scale-[1.02] active:scale-[0.98] mt-4"
                        >
                            Ingresar al Sistema
                        </button>
                    </form>

                    <div className="mt-10 pt-8 border-t border-slate-50 text-center">
                        <p className="text-slate-300 text-[10px] font-bold uppercase tracking-widest">
                            &copy; 2024 Ko'eju Admin &bull; v2.5
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
