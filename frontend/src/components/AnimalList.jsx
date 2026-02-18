import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AnimalService from '../services/animalService';
import { Search, Filter, MoreVertical, FileText, Download } from 'lucide-react';
import ReportGenerator from './ReportGenerator';

const AnimalList = () => {
    const [animals, setAnimals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        fetchAnimals();
    }, []);

    const fetchAnimals = async () => {
        try {
            const data = await AnimalService.getAnimals();
            setAnimals(data);
        } catch (error) {
            console.error('Error fetching animals:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleExport = () => {
        ReportGenerator.generateStockReport(animals);
    };

    const filteredAnimals = animals.filter(a =>
        a.caravana_visual.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.categoria.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.rodeo.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getStatusColor = (status) => {
        return status === 'ACTIVO' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700';
    };

    return (
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100">
            {/* Header Toolbar */}
            <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4 bg-slate-50/50">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        📋 Listado de Hacienda
                        <span className="text-sm font-normal text-slate-400 bg-white px-2 py-1 rounded-full border border-slate-200">
                            {animals.length} activos
                        </span>
                    </h2>
                </div>

                <div className="flex gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar caravana, rodeo..."
                            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={handleExport}
                        className="p-2 bg-slate-800 text-white rounded-xl hover:bg-slate-700 transition-colors shadow-lg shadow-slate-500/30 flex items-center gap-2 px-4 font-bold"
                    >
                        <Download size={18} /> Exportar
                    </button>
                    <button className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600">
                        <Filter size={20} />
                    </button>
                    <button className="p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-500/30">
                        <FileText size={20} />
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                            <th className="p-4 font-semibold border-b border-slate-100">Caravana</th>
                            <th className="p-4 font-semibold border-b border-slate-100">Categoría</th>
                            <th className="p-4 font-semibold border-b border-slate-100">Rodeo</th>
                            <th className="p-4 font-semibold border-b border-slate-100 text-right">Peso (Kg)</th>
                            <th className="p-4 font-semibold border-b border-slate-100">Negocio</th>
                            <th className="p-4 font-semibold border-b border-slate-100">Estado</th>
                            <th className="p-4 font-semibold border-b border-slate-100 text-center">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="text-sm divide-y divide-slate-50">
                        {loading ? (
                            <tr><td colSpan="7" className="p-8 text-center text-slate-400">Cargando datos...</td></tr>
                        ) : filteredAnimals.length === 0 ? (
                            <tr><td colSpan="7" className="p-8 text-center text-slate-400">No se encontraron animales.</td></tr>
                        ) : (
                            filteredAnimals.map((animal) => (
                                <tr
                                    key={animal.id}
                                    onClick={() => navigate(`/animal/${animal.id}`)}
                                    className="hover:bg-blue-50/50 transition-colors group cursor-pointer"
                                >
                                    <td className="p-4 font-bold text-slate-700">{animal.caravana_visual}</td>
                                    <td className="p-4 text-slate-600">{animal.categoria}</td>
                                    <td className="p-4 text-slate-500">{animal.rodeo}</td>
                                    <td className="p-4 text-right font-mono text-slate-700 font-medium">{animal.peso_actual}</td>
                                    <td className="p-4">
                                        <span className="px-2 py-1 rounded text-xs font-semibold bg-slate-100 text-slate-600">
                                            {animal.negocio}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${getStatusColor(animal.estado_sanitario)}`}>
                                            {animal.estado_sanitario}
                                        </span>
                                    </td>
                                    <td className="p-4 text-center">
                                        <button className="text-slate-400 hover:text-blue-600 p-1 rounded-lg hover:bg-blue-50 transition-all">
                                            <MoreVertical size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination Footer (Mock) */}
            <div className="p-4 border-t border-slate-100 flex justify-between items-center text-xs text-slate-400">
                <p>Mostrando {filteredAnimals.length} registros</p>
                <div className="flex gap-2">
                    <button className="px-3 py-1 border rounded hover:bg-slate-50" disabled>Anterior</button>
                    <button className="px-3 py-1 border rounded hover:bg-slate-50">Siguiente</button>
                </div>
            </div>
        </div>
    );
};

export default AnimalList;
