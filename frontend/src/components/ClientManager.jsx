import React, { useState, useEffect } from 'react';
import ClientService from '../services/clientService';
import { Users, Plus, Search, Edit2, Trash2, Mail, Phone, MapPin, Tag, Building2, User, X } from 'lucide-react';

const ClientManager = () => {
    const [clients, setClients] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingClient, setEditingClient] = useState(null);
    const [loading, setLoading] = useState(true);

    const [formData, setFormData] = useState({
        nombre: '',
        ruc: '',
        telefono: '',
        email: '',
        direccion: '',
        tipo: 'PARTICULAR'
    });

    useEffect(() => {
        fetchClients();
    }, []);

    const fetchClients = async () => {
        try {
            const data = await ClientService.getAll();
            setClients(data);
        } catch (error) {
            console.error('Error fetching clients:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (client = null) => {
        if (client) {
            setEditingClient(client);
            setFormData(client);
        } else {
            setEditingClient(null);
            setFormData({
                nombre: '',
                ruc: '',
                telefono: '',
                email: '',
                direccion: '',
                tipo: 'PARTICULAR'
            });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingClient) {
                await ClientService.update(editingClient.id, formData);
            } else {
                await ClientService.create(formData);
            }
            fetchClients();
            setIsModalOpen(false);
        } catch (error) {
            alert('Error al guardar cliente');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('¿Está seguro de eliminar este cliente?')) {
            try {
                await ClientService.delete(id);
                fetchClients();
            } catch (error) {
                alert('Error al eliminar cliente');
            }
        }
    };

    const filteredClients = (clients || []).filter(c =>
        (c?.nombre || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c?.ruc || '').includes(searchTerm)
    );

    return (
        <div className="space-y-8 pb-20 animate-in fade-in duration-500">
            {/* Header section with Stats */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                        <Users className="text-indigo-600" size={36} />
                        Gestión de Contactos
                    </h1>
                    <p className="text-slate-500 mt-1">Administra tus compradores, vendedores y frigoríficos.</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="w-full md:w-auto px-6 py-3 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 flex items-center justify-center gap-2"
                >
                    <Plus size={20} /> Nuevo Contacto
                </button>
            </div>

            {/* Filters & Search */}
            <div className="bg-white/80 backdrop-blur-md p-4 rounded-3xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4 items-center">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar por nombre o RUC..."
                        className="w-full pl-12 pr-4 py-3 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                    <select className="bg-slate-50 border-none rounded-2xl px-4 py-3 text-slate-600 font-medium focus:ring-2 focus:ring-indigo-500 outline-none">
                        <option>Todos los tipos</option>
                        <option>Particular</option>
                        <option>Frigorífico</option>
                        <option>Feria</option>
                    </select>
                </div>
            </div>

            {/* Grid of Clients */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    <div className="col-span-full py-20 text-center text-slate-400 font-medium">Cargando contactos...</div>
                ) : filteredClients.length === 0 ? (
                    <div className="col-span-full py-20 text-center text-slate-400 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                        No se encontraron contactos que coincidan con la búsqueda.
                    </div>
                ) : (
                    filteredClients.map((client) => (
                        <div key={client.id} className="group bg-white p-6 rounded-3xl shadow-sm border border-slate-100 hover:shadow-xl hover:shadow-indigo-500/5 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
                            <div className="flex justify-between items-start mb-4">
                                <div className={`p-3 rounded-2xl ${client.tipo === 'FRIGORIFICO' ? 'bg-amber-50 text-amber-600' :
                                    client.tipo === 'FERIA' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'
                                    }`}>
                                    {client.tipo === 'FRIGORIFICO' ? <Building2 size={24} /> : <User size={24} />}
                                </div>
                                <div className="flex gap-1">
                                    <button onClick={() => handleOpenModal(client)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors">
                                        <Edit2 size={18} />
                                    </button>
                                    <button onClick={() => handleDelete(client.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors">
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div>
                                    <h3 className="text-xl font-bold text-slate-800 line-clamp-1">{client.nombre || 'Sin Nombre'}</h3>
                                    <p className="text-xs font-bold text-white bg-slate-800 px-2 py-0.5 rounded inline-block mt-1">RUC: {client.ruc || 'S/N'}</p>
                                </div>

                                <div className="space-y-2 pt-2 border-t border-slate-50">
                                    <div className="flex items-center gap-3 text-sm text-slate-500">
                                        <Phone size={14} className="text-slate-400" />
                                        <span>{client.telefono || 'Sin teléfono'}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-slate-500">
                                        <Mail size={14} className="text-slate-400" />
                                        <span className="truncate">{client.email || 'Sin email'}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-slate-500">
                                        <Tag size={14} className="text-slate-400" />
                                        <span className="font-bold text-xs uppercase text-slate-400 tracking-wider font-mono">{client.tipo || 'N/A'}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Accent line */}
                            <div className={`absolute bottom-0 left-0 right-0 h-1.5 ${client.tipo === 'FRIGORIFICO' ? 'bg-amber-400' :
                                client.tipo === 'FERIA' ? 'bg-emerald-400' : 'bg-blue-400'
                                }`} />
                        </div>
                    ))
                )}
            </div>

            {/* Modal for Create/Edit */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-lg rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="bg-indigo-600 p-8 text-white relative">
                            <h2 className="text-2xl font-bold">{editingClient ? 'Editar Contacto' : 'Nuevo Contacto'}</h2>
                            <p className="opacity-80 text-sm">Completa los campos para {editingClient ? 'actualizar' : 'registrar'} la información.</p>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="absolute top-6 right-6 p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-8 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1 ml-1">Razón Social / Nombre Completo</label>
                                    <input
                                        required
                                        type="text"
                                        placeholder="Ej: Frigorífico Concepción S.A."
                                        className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium"
                                        value={formData.nombre}
                                        onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                                    />
                                </div>
                                <div className="col-span-1">
                                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1 ml-1">RUC</label>
                                    <input
                                        type="text"
                                        placeholder="80000000-0"
                                        className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-mono"
                                        value={formData.ruc}
                                        onChange={(e) => setFormData({ ...formData, ruc: e.target.value })}
                                    />
                                </div>
                                <div className="col-span-1">
                                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1 ml-1">Tipo de Contacto</label>
                                    <select
                                        className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium"
                                        value={formData.tipo}
                                        onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                                    >
                                        <option value="PARTICULAR">Particular</option>
                                        <option value="FRIGORIFICO">Frigorífico</option>
                                        <option value="FERIA">Feria</option>
                                        <option value="PROVEEDOR">Proveedor</option>
                                    </select>
                                </div>
                                <div className="col-span-1">
                                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1 ml-1">Teléfono</label>
                                    <input
                                        type="text"
                                        placeholder="021 000 000"
                                        className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none"
                                        value={formData.telefono}
                                        onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                                    />
                                </div>
                                <div className="col-span-1">
                                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1 ml-1">Email</label>
                                    <input
                                        type="email"
                                        placeholder="contacto@ejemplo.com"
                                        className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1 ml-1">Dirección / Ubicación</label>
                                    <textarea
                                        rows="2"
                                        placeholder="Avda. Principal casi..."
                                        className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none"
                                        value={formData.direccion}
                                        onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                                    ></textarea>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 py-4 text-slate-500 font-bold rounded-2xl hover:bg-slate-50 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-4 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
                                >
                                    {editingClient ? 'Actualizar' : 'Guardar Contacto'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ClientManager;
