import React, { useState, useEffect } from 'react';
import ClientService from '../services/clientService';
import PageHeader from './common/PageHeader';
import { Users, Plus, Search, Edit2, Trash2, Mail, Phone, Tag, Building2, User, X, CheckSquare } from 'lucide-react';

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
        if (window.confirm('¿Está seguro de eliminar este contacto?')) {
            try {
                await ClientService.delete(id);
                fetchClients();
            } catch (error) {
                alert('Error al eliminar contacto');
            }
        }
    };

    const filteredClients = (clients || []).filter(c =>
        (c?.nombre || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c?.ruc || '').includes(searchTerm)
    );

    return (
        <div className="space-y-6 pb-20 animate-in fade-in duration-500">
            <PageHeader
                title="Gestión de Contactos"
                subtitle="Registro de compradores, vendedores y aliados comerciales."
                icon={Users}
                actions={
                    <button
                        onClick={() => handleOpenModal()}
                        className="px-8 py-3 bg-slate-900 text-white font-black rounded-2xl hover:bg-emerald-600 transition-all shadow-xl shadow-slate-900/10 flex items-center justify-center gap-2 uppercase tracking-widest text-sm"
                    >
                        <Plus size={20} /> Nuevo Contacto
                    </button>
                }
            />

            {/* Filters & Search */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4 items-center mb-8">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar por nombre o RUC..."
                        className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-emerald-500 transition-all outline-none font-medium text-slate-700 shadow-inner"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Grid of Clients */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    <div className="col-span-full py-20 text-center text-slate-400 font-bold uppercase tracking-widest">Cargando registros...</div>
                ) : filteredClients.length === 0 ? (
                    <div className="col-span-full py-24 text-center text-slate-300 bg-white rounded-[2rem] border-2 border-dashed border-slate-100 font-bold uppercase tracking-widest text-sm">
                        No se encontraron contactos en la base de datos
                    </div>
                ) : (
                    filteredClients.map((client) => (
                        <div key={client.id} className="group bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 hover:shadow-2xl hover:shadow-slate-200/50 hover:-translate-y-2 transition-all duration-500 relative flex flex-col h-full">
                            <div className="flex justify-between items-start mb-6">
                                <div className={`p-4 rounded-2xl shadow-sm ${client.tipo === 'FRIGORIFICO' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                                    client.tipo === 'FERIA' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-indigo-50 text-indigo-600 border border-indigo-100'
                                    }`}>
                                    {client.tipo === 'FRIGORIFICO' ? <Building2 size={24} /> : <User size={24} />}
                                </div>
                                <div className="flex gap-1.5">
                                    <button onClick={() => handleOpenModal(client)} className="p-2.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all">
                                        <Edit2 size={18} />
                                    </button>
                                    <button onClick={() => handleDelete(client.id)} className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all">
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>

                            <div className="flex-1 space-y-4">
                                <div>
                                    <h3 className="text-2xl font-black text-slate-800 tracking-tight leading-none group-hover:text-emerald-700 transition-colors">{client.nombre}</h3>
                                    <div className="flex items-center gap-2 mt-2">
                                        <span className="text-[10px] font-black text-white bg-slate-900 px-2.5 py-1 rounded-lg uppercase tracking-widest border-2 border-slate-900 ring-2 ring-slate-100 ring-offset-2">RUC {client.ruc || 'S/N'}</span>
                                    </div>
                                </div>

                                <div className="space-y-3 pt-4 mt-2 border-t border-slate-50">
                                    <div className="flex items-center gap-3 text-sm font-bold text-slate-500">
                                        <Phone size={16} className="text-slate-300" />
                                        <span>{client.telefono || 'Sin contacto'}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm font-bold text-slate-500">
                                        <Mail size={16} className="text-slate-300" />
                                        <span className="truncate">{client.email || 'Sin correo'}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-xs font-black text-slate-400 uppercase tracking-[0.2em] pt-2">
                                        <Tag size={14} className="text-slate-300" />
                                        <span>{client.tipo}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Decorative element */}
                            <div className={`absolute top-0 right-0 w-32 h-32 opacity-5 pointer-events-none -mt-8 -mr-8 transition-all group-hover:scale-125 group-hover:-translate-x-4 ${client.tipo === 'FRIGORIFICO' ? 'text-amber-500' : client.tipo === 'FERIA' ? 'text-emerald-500' : 'text-indigo-500'}`}>
                                {client.tipo === 'FRIGORIFICO' ? <Building2 size={128} /> : <User size={128} />}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Modal for Create/Edit */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="bg-slate-900 p-10 text-white relative">
                            <h2 className="text-3xl font-black tracking-tight">{editingClient ? 'Editar Contacto' : 'Nuevo Contacto'}</h2>
                            <p className="opacity-50 text-sm font-bold uppercase tracking-widest mt-1">Ko'ẽju Ganadería</p>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="absolute top-10 right-10 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-all"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-10 space-y-6">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Razón Social / Nombre</label>
                                    <input required type="text" className="w-full p-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:border-emerald-500 focus:bg-white outline-none font-bold text-slate-800 transition-all" value={formData.nombre} onChange={(e) => setFormData({ ...formData, nombre: e.target.value })} />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">RUC</label>
                                        <input type="text" className="w-full p-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:border-emerald-500 focus:bg-white outline-none font-mono font-bold" value={formData.ruc} onChange={(e) => setFormData({ ...formData, ruc: e.target.value })} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Tipo</label>
                                        <select className="w-full p-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:border-emerald-500 focus:bg-white outline-none font-bold bg-white appearance-none cursor-pointer" value={formData.tipo} onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}>
                                            <option value="PARTICULAR">Particular</option>
                                            <option value="FRIGORIFICO">Frigorífico</option>
                                            <option value="FERIA">Feria</option>
                                            <option value="PROVEEDOR">Proveedor</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Teléfono</label>
                                        <input type="text" className="w-full p-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:border-emerald-500 focus:bg-white outline-none font-bold" value={formData.telefono} onChange={(e) => setFormData({ ...formData, telefono: e.target.value })} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Email</label>
                                        <input type="email" className="w-full p-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:border-emerald-500 focus:bg-white outline-none font-bold" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Dirección</label>
                                    <textarea rows="2" className="w-full p-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:border-emerald-500 focus:bg-white outline-none font-bold resize-none" value={formData.direccion} onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}></textarea>
                                </div>
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-4 text-slate-400 font-black uppercase tracking-widest text-xs hover:bg-slate-50 rounded-2xl transition-all">Cancelar</button>
                                <button type="submit" className="flex-2 py-4 px-10 bg-emerald-600 text-white font-black uppercase tracking-widest text-xs rounded-2xl hover:bg-emerald-500 transition-all shadow-xl shadow-emerald-900/20">
                                    {editingClient ? 'Actualizar Registro' : 'Confirmar Registro'}
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
