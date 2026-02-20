import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import AnimalCard from './components/AnimalCard';
import Dashboard from './components/Dashboard';
import IngresoForm from './components/IngresoForm';
import AnimalList from './components/AnimalList';
import AnimalDetail from './components/AnimalDetail';
import CostDashboard from './components/CostDashboard';
import ImportView from './components/ImportView';
import SettingsView from './components/SettingsView';
import SalesSimulator from './components/SalesSimulator';
import SalesSheet from './components/SalesSheet';
import WeighingView from './components/WeighingView';
import PurchaseSheet from './components/PurchaseSheet';
import SiapAssignmentView from './components/SiapAssignmentView';
import ClientManager from './components/ClientManager';
import OvineDashboard from './components/OvineDashboard';
import HealthManager from './components/HealthManager';
import CalendarManager from './components/CalendarManager';
import SyncManager from './components/SyncManager';
import ExpenseManager from './components/ExpenseManager';
import AnimalService from './services/animalService';
import { LayoutDashboard, PlusCircle, Dog, List, DollarSign, FileSpreadsheet, Settings, Calculator, Tag, Truck, Menu, X, Users, Scissors, Syringe, Receipt, Calendar } from 'lucide-react';

// Mock data for initial view (keep animal mock for Demo)
const mockAnimal = {
    caravana_visual: 'V4001',
    fecha_liberacion_carencia: '2024-12-01',
    peso_actual: 450,
    categoria: 'NOVILLO',
    rodeo: 'POTRERO 5',
    negocio: 'ENGORDE'
};

const NavLink = ({ to, icon: Icon, label, onClick }) => {
    const location = useLocation();
    const isActive = location.pathname === to;
    return (
        <Link
            to={to}
            onClick={onClick}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors font-medium text-sm
            ${isActive ? 'bg-yellow-400 text-slate-900 font-bold' : 'text-slate-200 hover:text-white hover:bg-slate-800'}`}
        >
            <Icon size={18} />
            {label}
        </Link>
    );
};

// Mobile Bottom Navigation Component
const MobileBottomNav = () => {
    const location = useLocation();
    const [isMoreOpen, setIsMoreOpen] = useState(false);

    const navItems = [
        { to: "/", icon: LayoutDashboard, label: "Inicio" },
        { to: "/lista", icon: List, label: "Hacienda" },
        { to: "/ingreso", icon: PlusCircle, label: "Ingreso", highlight: true },
        { to: "/ventas", icon: DollarSign, label: "Ventas" },
        { to: "/costos", icon: Calculator, label: "Costos" }
    ];

    return (
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 pb-safe z-50">
            <div className="flex justify-around items-center h-16">
                {navItems.map((item) => {
                    const isActive = location.pathname === item.to;
                    return (
                        <Link
                            key={item.to}
                            to={item.to}
                            className={`flex flex-col items-center justify-center w-full h-full space-y-1
                                ${isActive ? 'text-yellow-400' : 'text-slate-400 hover:text-slate-200'}
                                ${item.highlight ? 'bg-slate-800/50' : ''}`}
                        >
                            <item.icon size={isActive ? 24 : 20} className={item.highlight ? "text-emerald-400" : ""} />
                            <span className="text-[10px] font-medium">{item.label}</span>
                        </Link>
                    );
                })}
                <button
                    onClick={() => setIsMoreOpen(true)}
                    className="flex flex-col items-center justify-center w-full h-full space-y-1 text-slate-400 hover:text-slate-200"
                >
                    <Menu size={20} />
                    <span className="text-[10px] font-medium">Más</span>
                </button>
            </div>

            {/* Full Menu Overlay */}
            {isMoreOpen && (
                <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-xl z-[60] p-6 animate-in slide-in-from-bottom-10 duration-200 flex flex-col">
                    <div className="flex justify-between items-center mb-8">
                        <h2 className="text-xl font-bold text-white">Menú Completo</h2>
                        <button onClick={() => setIsMoreOpen(false)} className="p-2 bg-slate-800 rounded-full text-white">
                            <X size={24} />
                        </button>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <MenuLink to="/compras" icon={FileSpreadsheet} label="Compras" onClick={() => setIsMoreOpen(false)} />
                        <MenuLink to="/clientes" icon={Users} label="Contactos" onClick={() => setIsMoreOpen(false)} />
                        <MenuLink to="/ovinos" icon={Scissors} label="Ovino" onClick={() => setIsMoreOpen(false)} />
                        <MenuLink to="/sanidad" icon={Syringe} label="Sanidad" onClick={() => setIsMoreOpen(false)} />
                        <MenuLink to="/gastos" icon={Receipt} label="Gastos" onClick={() => setIsMoreOpen(false)} />
                        <MenuLink to="/siap" icon={Tag} label="SIAP" onClick={() => setIsMoreOpen(false)} />
                        <MenuLink to="/simulador" icon={Calculator} label="Simulador" onClick={() => setIsMoreOpen(false)} />
                        <MenuLink to="/configuracion" icon={Settings} label="Configuración" onClick={() => setIsMoreOpen(false)} />
                    </div>
                </div>
            )}
        </div>
    );
};

const MenuLink = ({ to, icon: Icon, label, onClick }) => (
    <Link to={to} onClick={onClick} className="flex flex-col items-center justify-center bg-slate-800 p-4 rounded-xl active:bg-slate-700 transition-colors gap-3 border border-slate-700">
        <Icon size={32} className="text-yellow-400" />
        <span className="text-sm font-medium text-slate-200">{label}</span>
    </Link>
);

import Login from './components/Login';

function App() {
    const [potreros, setPotreros] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(localStorage.getItem('isAuthenticated') === 'true');

    useEffect(() => {
        if (isAuthenticated) {
            fetchDashboard();
        }
    }, [isAuthenticated]);

    const fetchDashboard = async () => {
        try {
            const data = await AnimalService.getDashboardStats();
            setPotreros(data);
        } catch (error) {
            console.error('Error fetching dashboard:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        setIsAuthenticated(false);
        localStorage.removeItem('isAuthenticated');
    };

    if (!isAuthenticated) {
        return <Login onLogin={setIsAuthenticated} />;
    }

    return (
        <Router>
            <div className="min-h-screen font-sans pb-20 md:pb-0">
                <SyncManager />
                {/* Desktop Navbar */}
                <nav className="bg-slate-900/95 backdrop-blur-md text-white shadow-lg sticky top-0 z-50 border-b border-slate-700 hidden md:block">
                    <div className="container mx-auto px-4">
                        <div className="flex items-center justify-between h-16">
                            <Link to="/" className="text-xl font-black tracking-tight text-yellow-400 hover:opacity-80 transition-opacity flex items-center gap-3">
                                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg border-2 border-slate-700/50 overflow-hidden shrink-0">
                                    <img src="/logo.png" alt="Ko'eju" className="w-full h-full object-cover" />
                                </div>
                                <span>Establecimiento <span className="text-white">ko'ẽju</span></span>
                            </Link>

                            <div className="flex gap-4 items-center">
                                <div className="flex gap-1 items-center">
                                    <NavLinks />
                                </div>
                                <button
                                    onClick={handleLogout}
                                    className="p-2 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white rounded-lg transition-all"
                                    title="Cerrar Sesión"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                        </div>
                    </div>
                </nav>

                {/* Mobile Header (Brand Only) */}
                <div className="md:hidden bg-slate-900 text-white p-4 sticky top-0 z-40 shadow-md flex justify-between items-center border-b border-slate-800">
                    <div /> {/* Spacer */}
                    <Link to="/" className="font-black tracking-tight text-yellow-400 flex items-center gap-3">
                        <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-md overflow-hidden border border-slate-700/50">
                            <img src="/logo.png" alt="Ko'eju" className="w-full h-full object-cover" />
                        </div>
                        <span>Establecimiento <span className="text-white">ko'ẽju</span></span>
                    </Link>
                    <button
                        onClick={handleLogout}
                        className="p-2 text-red-400"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="container mx-auto p-4 max-w-7xl">
                    <Routes>
                        <Route path="/" element={
                            loading ? <div className="text-center mt-20 text-slate-400">Cargando datos...</div> : <Dashboard potreros={potreros} />
                        } />

                        <Route path="/lista" element={<AnimalList />} />
                        <Route path="/ingreso" element={<IngresoForm />} />
                        <Route path="/compras" element={<PurchaseSheet />} />
                        <Route path="/ventas" element={<SalesSheet />} />
                        <Route path="/clientes" element={<ClientManager />} />
                        <Route path="/ovinos" element={<OvineDashboard />} />
                        <Route path="/sanidad" element={<HealthManager />} />
                        <Route path="/gastos" element={<ExpenseManager />} />
                        <Route path="/siap" element={<SiapAssignmentView />} />
                        <Route path="/animales/:id" element={<AnimalDetail />} />
                        <Route path="/pesaje/:id" element={<WeighingView />} />
                        <Route path="/costos" element={<CostDashboard />} />
                        <Route path="/simulador" element={<SalesSimulator />} />
                        <Route path="/importar" element={<ImportView />} />
                        <Route path="/configuracion" element={<SettingsView />} />
                        <Route path="/calendario" element={<CalendarManager />} />
                        <Route path="/animal" element={
                            <div className="flex justify-center mt-10">
                                <AnimalCard animal={mockAnimal} />
                            </div>
                        } />
                    </Routes>
                </div>

                <MobileBottomNav />
            </div>
        </Router>
    );
}

const NavLinks = ({ onClick }) => (
    <>
        <NavLink to="/" icon={LayoutDashboard} label="Dashboard" onClick={onClick} />
        <NavLink to="/lista" icon={List} label="Hacienda" onClick={onClick} />
        <NavLink to="/compras" icon={FileSpreadsheet} label="Compras" onClick={onClick} />
        <NavLink to="/ventas" icon={DollarSign} label="Ventas" onClick={onClick} />
        <NavLink to="/calendario" icon={Calendar} label="Agenda" onClick={onClick} />
        <NavLink to="/clientes" icon={Users} label="Contactos" onClick={onClick} />
        <NavLink to="/siap" icon={Tag} label="SIAP" onClick={onClick} />
        <NavLink to="/ingreso" icon={PlusCircle} label="Ingreso" onClick={onClick} />
        <NavLink to="/ovinos" icon={Scissors} label="Ovino" onClick={onClick} />
        <NavLink to="/sanidad" icon={Syringe} label="Sanidad" onClick={onClick} />
        <NavLink to="/gastos" icon={Receipt} label="Gastos" onClick={onClick} />
        <NavLink to="/costos" icon={DollarSign} label="Costos" onClick={onClick} />
        <NavLink to="/simulador" icon={Calculator} label="Simulador" onClick={onClick} />
        <NavLink to="/configuracion" icon={Settings} label="Config" onClick={onClick} />
    </>
);

export default App;
