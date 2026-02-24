import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    List,
    FileSpreadsheet,
    DollarSign,
    Calendar,
    Users,
    Tag,
    PlusCircle,
    Scissors,
    Syringe,
    Receipt,
    Calculator,
    Settings,
    X,
    LogOut
} from 'lucide-react';

const Sidebar = ({ onLogout, onClose }) => {
    const location = useLocation();

    const menuItems = [
        { to: "/", icon: LayoutDashboard, label: "Dashboard" },
        { to: "/calendario", icon: Calendar, label: "Agenda Interna" },
        { to: "/lista", icon: List, label: "Hacienda" },
        { to: "/ingreso", icon: PlusCircle, label: "Ingreso Hacienda" },
        { to: "/compras", icon: FileSpreadsheet, label: "Registro Compras" },
        { to: "/ventas", icon: DollarSign, label: "Planilla Ventas" },
        { to: "/clientes", icon: Users, label: "Contactos/Clientes" },
        { to: "/siap", icon: Tag, label: "Etiquetas SIAP" },
        { to: "/ovinos", icon: Scissors, label: "Módulo Ovino" },
        { to: "/sanidad", icon: Syringe, label: "Control Sanitario" },
        { to: "/gastos", icon: Receipt, label: "Gestión Gastos" },
        { to: "/costos", icon: Calculator, label: "Análisis Costos" },
        { to: "/simulador", icon: Calculator, label: "Simulador Ventas" },
        { to: "/configuracion", icon: Settings, label: "Configuración" },
    ];

    return (
        <div className="flex flex-col h-full bg-slate-900 text-slate-300 w-64 border-r border-slate-800 shadow-2xl relative">
            {/* Brand Header */}
            <div className="p-6 border-b border-slate-800/50 mb-4 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-10">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-xl shadow-slate-950/50 overflow-hidden border-2 border-slate-800">
                        <img src="/logo.png" alt="Ko'eju Logo" className="w-full h-full object-cover" />
                    </div>
                    <div>
                        <h2 className="text-white font-black text-lg tracking-tight leading-none italic">KO'ẼJU</h2>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-500 mt-1">Ganadería</p>
                    </div>
                </div>
                {onClose && (
                    <button
                        onClick={onClose}
                        className="absolute top-6 right-4 p-2 text-slate-500 hover:text-white md:hidden"
                    >
                        <X size={20} />
                    </button>
                )}
            </div>

            {/* Navigation Menu */}
            <nav className="flex-1 overflow-y-auto px-4 py-2 space-y-1 custom-scrollbar">
                {menuItems.map((item) => {
                    const isActive = location.pathname === item.to;
                    return (
                        <Link
                            key={item.to}
                            to={item.to}
                            onClick={onClose}
                            className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200 group
                                ${isActive
                                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/20 font-bold translate-x-1'
                                    : 'hover:bg-slate-800/50 hover:text-white'}`}
                        >
                            <item.icon size={20} className={`${isActive ? 'text-white' : 'text-slate-500 group-hover:text-emerald-400'} transition-colors`} />
                            <span className="text-sm tracking-wide">{item.label}</span>
                        </Link>
                    );
                })}
            </nav>

            {/* Footer / User Session */}
            <div className="p-4 mt-auto border-t border-slate-800/50 bg-slate-950/20">
                <button
                    onClick={onLogout}
                    className="w-full flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white py-3 rounded-xl transition-all font-bold text-xs uppercase tracking-widest border border-red-500/20"
                >
                    <LogOut size={16} />
                    Cerrar Sesión
                </button>
                <div className="mt-4 text-center">
                    <p className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.3em]">v2.5 &bull; 2024</p>
                </div>
            </div>
        </div>
    );
};

export default Sidebar;
