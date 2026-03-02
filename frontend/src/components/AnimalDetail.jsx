import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Activity, Syringe, Truck, Edit, HeartPulse, Scale,
    Info, Calendar, Fingerprint, ShieldAlert, TrendingUp, History,
    LayoutDashboard
} from 'lucide-react';
import AnimalService from '../services/animalService';
import AnimalCard from './AnimalCard';
import EditAnimalModal from './EditAnimalModal';
import MovementModal from './MovementModal';
import HealthModal from './HealthModal';
import PageHeader from './common/PageHeader';

const AnimalDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [animal, setAnimal] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [isMoving, setIsMoving] = useState(false);
    const [isHealthOpen, setIsHealthOpen] = useState(false);
    const [history, setHistory] = useState([]);

    useEffect(() => {
        const loadData = async () => {
            try {
                const [animalData, historyData] = await Promise.all([
                    AnimalService.getById(id),
                    AnimalService.getHistory(id)
                ]);
                setAnimal(animalData);
                setHistory(historyData);
            } catch (error) {
                console.error('Error fetching animal data:', error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [id]);

    const handleSave = async (updatedData) => {
        try {
            await AnimalService.update(id, updatedData);
            setAnimal({ ...animal, ...updatedData });
            setIsEditing(false);
        } catch (error) {
            console.error('Error updating animal:', error);
        }
    };

    const handleMovement = async (moveData) => {
        try {
            await AnimalService.registerMovement(id, moveData);
            const [updatedAnimal, updatedHistory] = await Promise.all([
                AnimalService.getById(id),
                AnimalService.getHistory(id)
            ]);
            setAnimal(updatedAnimal);
            setHistory(updatedHistory);
            setIsMoving(false);
        } catch (error) {
            console.error('Error moving animal:', error);
            alert('Error al registrar movimiento');
        }
    };

    const handleHealth = async (healthData) => {
        try {
            const apiPayload = {
                fecha_aplicacion: healthData.fecha,
                tipo_evento: healthData.tipo,
                producto: healthData.producto,
                dias_carencia: healthData.dias_carencia,
                detalles: healthData.detalle
            };
            const response = await AnimalService.registerHealthEvent(id, apiPayload);
            const [updatedAnimalData, updatedHistory] = await Promise.all([
                AnimalService.getById(id),
                AnimalService.getHistory(id)
            ]);
            setAnimal(updatedAnimalData);
            setHistory(updatedHistory);
            setIsHealthOpen(false);
        } catch (error) {
            console.error('Error recording health event:', error);
            alert('Error al guardar evento sanitario');
        }
    };

    const getEventDisplay = (event) => {
        switch (event.type) {
            case 'PESAJE':
                return {
                    title: `Pesaje: ${event.peso_kg}kg`,
                    subtitle: event.gdp_calculado > 0 ? `Ganancia: +${parseFloat(event.gdp_calculado).toFixed(3)} kg/día` : 'Referencia Inicial',
                    icon: <Scale size={18} />,
                    color: 'emerald'
                };
            case 'SANIDAD':
                return {
                    title: `${event.tipo_evento}: ${event.producto || 'Tratamiento'}`,
                    subtitle: event.nro_acta ? `Acta SENACSA: ${event.nro_acta}` : 'Registro Interno',
                    icon: <HeartPulse size={18} />,
                    color: 'rose'
                };
            case 'INGRESO':
                return {
                    title: `Incorporación al Stock`,
                    subtitle: `Origen: ${event.origen || 'Compra Directa'}`,
                    icon: <Truck size={18} />,
                    color: 'blue'
                };
            case 'SALIDA':
                return {
                    title: `Egreso de Establecimiento`,
                    subtitle: event.motivo_salida,
                    icon: <Truck size={18} />,
                    color: 'slate'
                };
            default:
                return {
                    title: 'Actividad Registrada',
                    subtitle: '',
                    icon: <Activity size={18} />,
                    color: 'slate'
                };
        }
    };

    const isCarenciaActive = animal && (animal.estado_sanitario === 'CUARENTENA' || animal.estado_sanitario === 'BLOQUEADO');
    const carenciaDate = animal?.fecha_liberacion_carencia ? new Date(animal.fecha_liberacion_carencia).toLocaleDateString() : '';

    if (loading) return (
        <div className="flex flex-col items-center justify-center py-24 text-slate-300 space-y-4">
            <div className="w-12 h-12 border-4 border-slate-100 border-t-indigo-500 rounded-full animate-spin"></div>
            <p className="font-black uppercase tracking-[0.2em] text-xs">Recuperando Ficha Individual</p>
        </div>
    );

    if (!animal) return (
        <div className="bg-white p-16 rounded-[2rem] border-2 border-dashed border-slate-100 text-center">
            <ShieldAlert size={48} className="mx-auto text-slate-100 mb-4" />
            <p className="text-slate-400 font-black uppercase tracking-widest text-xs">Identificador no encontrado</p>
            <Link to="/lista" className="mt-6 inline-flex items-center gap-2 text-indigo-500 font-bold hover:underline">
                Volver al listado
            </Link>
        </div>
    );

    return (
        <div className="max-w-6xl mx-auto space-y-6 pb-20 animate-in fade-in duration-500">
            <PageHeader
                title={`Expediente: ${animal.caravana_visual}`}
                subtitle="Información detallada, trazabilidad sanitaria y performance biométrica."
                icon={Fingerprint}
                actions={
                    <div className="flex flex-wrap gap-2">
                        <Link to="/lista" className="p-3 bg-white text-slate-600 rounded-xl shadow-sm border border-slate-100 hover:bg-slate-50 transition-all flex items-center gap-2 font-black text-[10px] uppercase tracking-widest">
                            <ArrowLeft size={16} /> Volver
                        </Link>
                        <button
                            onClick={() => navigate(`/pesaje/${animal.id}`)}
                            className="px-6 py-3 bg-blue-600 text-white font-black rounded-xl shadow-xl shadow-blue-500/20 hover:bg-blue-700 transition flex items-center gap-2 uppercase tracking-widest text-[10px]"
                        >
                            <Scale size={16} /> Pesaje
                        </button>
                        <button
                            onClick={() => setIsHealthOpen(true)}
                            className="px-6 py-3 bg-rose-500 text-white font-black rounded-xl shadow-xl shadow-rose-500/20 hover:bg-rose-600 transition flex items-center gap-2 uppercase tracking-widest text-[10px]"
                        >
                            <HeartPulse size={16} /> Sanidad
                        </button>
                        <button
                            onClick={() => setIsEditing(true)}
                            className="px-6 py-3 bg-slate-900 text-white font-black rounded-xl shadow-xl shadow-slate-900/10 hover:bg-indigo-600 transition flex items-center gap-2 uppercase tracking-widest text-[10px]"
                        >
                            <Edit size={16} /> Editar
                        </button>
                    </div>
                }
            />

            {isCarenciaActive && (
                <div className="bg-red-500 p-6 rounded-[2rem] shadow-2xl shadow-red-500/20 flex items-center gap-6 animate-in slide-in-from-top-4 duration-500 border border-red-400">
                    <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-white shrink-0">
                        <ShieldAlert size={32} />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-white font-black text-xs uppercase tracking-[0.3em] mb-1">Restricción Sanitaria Activa</h3>
                        <p className="text-red-50 font-bold text-lg leading-tight uppercase">
                            Animal en periodo de carencia medicinal. No apto para faena hasta el {carenciaDate}.
                        </p>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Profile Card & SIAP */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden group">
                        <div className="p-1 bg-slate-100">
                            <AnimalCard animal={animal} />
                        </div>
                        <div className="p-8 space-y-6">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2 border-b border-slate-50 pb-4">
                                <Fingerprint size={14} className="text-indigo-400" /> Identificación Oficial
                            </h4>
                            <div className="space-y-4">
                                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 group/item hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 transition-all">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Caravana (Tarjeta)</p>
                                    <p className="font-mono font-black text-2xl text-slate-800 tracking-tighter">{animal.caravana_visual}</p>
                                </div>
                                <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100 group/item hover:bg-white hover:shadow-xl hover:shadow-indigo-900/5 transition-all">
                                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Electrónica (RFID)</p>
                                    <p className="font-mono font-black text-2xl text-indigo-600 tracking-tighter">
                                        {animal.caravana_rfid || 'O-98200XXXXX'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Galería de Marcas (Double Brand support) */}
                        {animal.marcas && animal.marcas.length > 0 && (
                            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 mt-6">
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2 border-b border-slate-50 pb-4 mb-6">
                                    <FileText size={14} className="text-emerald-400" /> Galería de Marcas
                                </h4>
                                <div className="grid grid-cols-2 gap-4">
                                    {animal.marcas.map((m, idx) => (
                                        <div key={idx} className="aspect-square bg-slate-50 rounded-2xl overflow-hidden border border-slate-100 group/img relative">
                                            <img
                                                src={`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}${m.foto_path}`}
                                                alt={`Marca ${idx + 1}`}
                                                className="w-full h-full object-cover transition-transform group-hover/img:scale-110"
                                            />
                                            <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/50 text-white text-[8px] font-black uppercase rounded-lg">
                                                {m.tipo_marca}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="bg-slate-900 p-8 rounded-[2.5rem] shadow-xl text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-5 text-white -mr-4 -mt-4">
                            <LayoutDashboard size={120} />
                        </div>
                        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                            Performance Bio-Económica
                        </h4>
                        <div className="space-y-6 relative z-10">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-emerald-400">
                                    <TrendingUp size={20} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Evolución Nominal</p>
                                    <p className="font-black text-white text-lg tracking-tight">Crecimiento Sostenido</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Días en Stock</p>
                                    <p className="font-black text-white text-xl">142</p>
                                </div>
                                <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Última GDP</p>
                                    <p className="font-black text-emerald-400 text-xl">+0.850 <span className="text-[10px]">kg</span></p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Info & Timeline */}
                <div className="lg:col-span-8 space-y-8">
                    {/* Extra Details */}
                    <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 group">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2 border-b border-slate-50 pb-4 mb-8">
                            <Info size={14} className="text-slate-400" /> Atributos y Clasificación
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            <DetailItem icon={<Calendar />} label="Fecha de Nacimiento" value={animal.fecha_nacimiento || 'Registro Desconocido'} />
                            <DetailItem icon={<Activity />} label="Pelaje" value={animal.pelaje || 'SIN ESPECIFICAR'} />
                            <DetailItem icon={<LayoutDashboard />} label="Potrero / Lote" value={animal.ubicacion || 'Potrero Nro 04'} />
                            <DetailItem icon={<TrendingUp />} label="Precio de Compra" value="-- Gs/Kg" />
                            <DetailItem icon={<Scale />} label="Peso de Ingreso" value={`${animal.peso_inicial || 0} kg`} />
                        </div>
                    </div>

                    {/* Timeline */}
                    <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-5 text-slate-100 -mr-4 -mt-4">
                            <History size={120} />
                        </div>
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-10 flex items-center gap-2">
                            Línea de Tiempo Operativa
                        </h3>

                        <div className="relative border-l-2 border-slate-50 ml-4 space-y-12 pb-4">
                            {history.length === 0 ? (
                                <div className="pl-10 text-slate-300 font-bold text-sm uppercase tracking-widest">Sin eventos registrados para este individuo</div>
                            ) : (
                                history.map((event, i) => {
                                    const display = getEventDisplay(event);
                                    return (
                                        <div key={i} className="relative pl-12 group/event animate-in slide-in-from-left-4 duration-500">
                                            <div className={`absolute -left-[17px] top-0 h-8 w-8 rounded-2xl border-4 border-white shadow-lg flex items-center justify-center transition-all group-hover/event:scale-110
                                                ${display.color === 'emerald' ? 'bg-emerald-500 text-white shadow-emerald-200' :
                                                    display.color === 'rose' ? 'bg-rose-500 text-white shadow-rose-200' :
                                                        display.color === 'blue' ? 'bg-blue-600 text-white shadow-blue-200' : 'bg-slate-200 text-slate-600 shadow-slate-200'}
                                            `}>
                                                {display.icon}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-3 mb-1">
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{new Date(event.date).toLocaleDateString('es-PY')}</span>
                                                    <span className={`h-1.5 w-1.5 rounded-full ${display.color === 'emerald' ? 'bg-emerald-400' : display.color === 'rose' ? 'bg-rose-400' : 'bg-slate-300'}`}></span>
                                                </div>
                                                <h4 className="font-black text-slate-800 text-base tracking-tight group-hover/event:text-indigo-600 transition-colors">
                                                    {display.title}
                                                </h4>
                                                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1 opacity-70">{display.subtitle}</p>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Modals remain mostly same but could be stylized later if needed */}
            {isEditing && (
                <EditAnimalModal
                    animal={animal}
                    onClose={() => setIsEditing(false)}
                    onSave={handleSave}
                />
            )}

            {isMoving && (
                <MovementModal
                    animal={animal}
                    onClose={() => setIsMoving(false)}
                    onSave={handleMovement}
                />
            )}

            {isHealthOpen && (
                <HealthModal
                    animal={animal}
                    onClose={() => setIsHealthOpen(false)}
                    onSave={handleHealth}
                />
            )}
        </div>
    );
};

const DetailItem = ({ icon, label, value }) => (
    <div className="space-y-2 group/detail hover:translate-x-1 transition-all">
        <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-slate-50 text-slate-400 group-hover/detail:bg-indigo-50 group-hover/detail:text-indigo-500 transition-colors">
                {React.cloneElement(icon, { size: 14 })}
            </div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
        </div>
        <p className="font-bold text-slate-700 ml-8 text-sm uppercase tracking-tight">{value}</p>
    </div>
);

export default AnimalDetail;
