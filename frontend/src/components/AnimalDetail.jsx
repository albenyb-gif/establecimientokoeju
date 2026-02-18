import { useParams, Link, useNavigate } from 'react-router-dom';
import AnimalService from '../services/animalService';
import AnimalCard from './AnimalCard';
import EditAnimalModal from './EditAnimalModal';
import MovementModal from './MovementModal';
import HealthModal from './HealthModal';
import { ArrowLeft, Activity, Syringe, Truck, Edit, HeartPulse } from 'lucide-react';

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
            // Mock Update Call
            await AnimalService.update(id, updatedData);
            setAnimal({ ...animal, ...updatedData });
            setIsEditing(false);
            // Ideally show success toast
        } catch (error) {
            console.error('Error updating animal:', error);
        }
    };

    const handleMovement = async (moveData) => {
        try {
            await AnimalService.registerMovement(id, moveData);

            // Refresh animal and history
            const [updatedAnimal, updatedHistory] = await Promise.all([
                AnimalService.getById(id),
                AnimalService.getHistory(id)
            ]);

            setAnimal(updatedAnimal);
            setHistory(updatedHistory);
            setIsMoving(false);

            // Success feedback could be added here
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

            // Refresh all data
            const [updatedAnimalData, updatedHistory] = await Promise.all([
                AnimalService.getById(id),
                AnimalService.getHistory(id)
            ]);

            setAnimal(updatedAnimalData);
            setHistory(updatedHistory);

            alert(response.bloqueo);
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
                    subtitle: event.gdp_calculado > 0 ? `GDP: +${parseFloat(event.gdp_calculado).toFixed(3)} kg/día` : 'Primer pesaje',
                    icon: <Activity size={16} />,
                    color: 'text-emerald-500 bg-emerald-50'
                };
            case 'SANIDAD':
                return {
                    title: `${event.tipo_evento}: ${event.producto || 'Tratamiento'}`,
                    subtitle: event.nro_acta ? `Acta: ${event.nro_acta}` : 'Sin ref.',
                    icon: <Syringe size={16} />,
                    color: 'text-rose-500 bg-rose-50'
                };
            case 'INGRESO':
                return {
                    title: `Ingreso a Establecimiento`,
                    subtitle: `Origen: ${event.origen || 'N/A'}`,
                    icon: <Truck size={16} />,
                    color: 'text-blue-500 bg-blue-50'
                };
            case 'SALIDA':
                return {
                    title: `Salida (Venta/Traslado)`,
                    subtitle: event.motivo_salida,
                    icon: <Truck size={16} />,
                    color: 'text-slate-500 bg-slate-50'
                };
            default:
                return {
                    title: 'Evento Registrado',
                    subtitle: '',
                    icon: <Activity size={16} />,
                    color: 'text-slate-400 bg-slate-50'
                };
        }
    };

    // Check for active CARENCIA
    const isCarenciaActive = animal && (animal.estado_sanitario === 'CUARENTENA' || animal.estado_sanitario === 'BLOQUEADO');
    const carenciaDate = animal?.fecha_liberacion_carencia ? new Date(animal.fecha_liberacion_carencia).toLocaleDateString() : '';

    if (loading) return <div className="text-center mt-20 text-slate-400">Cargando detalles...</div>;
    if (!animal) return <div className="text-center mt-20 text-slate-400">Animal no encontrado.</div>;

    return (
        <div className="max-w-4xl mx-auto pb-20">
            <div className="flex justify-between items-center mb-6">
                <Link to="/lista" className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors">
                    <ArrowLeft size={20} /> Volver al Listado
                </Link>
                <div className="flex gap-2 mt-4 md:mt-0 w-full md:w-auto">
                    <button
                        onClick={() => navigate(`/pesaje/${animal.id}`)}
                        className="flex-1 md:flex-none py-3 px-6 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 hover:bg-blue-700 transition flex items-center justify-center gap-2"
                    >
                        <Scale size={20} />
                        Pesaje
                    </button>
                    <button
                        onClick={() => setIsHealthOpen(true)}
                        className="flex-1 md:flex-none py-3 px-6 bg-white text-rose-600 font-bold rounded-xl border-2 border-rose-100 hover:bg-rose-50 transition flex items-center justify-center gap-2"
                    >
                        <Activity size={20} />
                        Sanidad
                    </button>
                    <button
                        onClick={() => setIsMoving(true)}
                        className="flex-1 md:flex-none py-3 px-6 bg-white text-slate-700 font-bold rounded-xl border-2 border-slate-100 hover:bg-slate-50 transition flex items-center justify-center gap-2"
                    >
                        <Truck size={20} /> Mover
                    </button>
                    <button
                        onClick={() => setIsEditing(true)}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/30 font-semibold"
                    >
                        <Edit size={18} /> Editar Datos
                    </button>
                </div>
            </div>

            {isCarenciaActive && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-r-lg flex items-start gap-4">
                    <div className="p-2 bg-red-100 rounded-full text-red-600">
                        <Activity size={24} />
                    </div>
                    <div>
                        <h3 className="text-red-800 font-bold text-lg">⚠️ PERIODO DE CARENCIA ACTIVO</h3>
                        <p className="text-red-700">
                            Este animal posee restricción sanitaria por aplicación de medicamentos.
                            <br />
                            <strong>No Apto para Faena hasta: {carenciaDate}</strong>
                        </p>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Columna Izquierda: Tarjeta Resumen */}
                <div className="md:col-span-1 space-y-4">
                    <AnimalCard animal={animal} />

                    {/* SIAP Info Card */}
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                        <h4 className="text-xs font-bold text-slate-400 uppercase mb-3">Identificación Oficial (SIAP)</h4>
                        <div className="space-y-3">
                            <div>
                                <p className="text-xs text-slate-500">Caravana Visual (Tarjeta)</p>
                                <p className="font-mono font-bold text-lg text-slate-800">{animal.caravana_visual}</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500">Caravana RFID (Botón)</p>
                                <p className="font-mono font-bold text-lg text-indigo-600">
                                    {animal.caravana_rfid || 'NO ASIGNADO'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Columna Derecha: Detalles e Historia */}
                <div className="md:col-span-2 space-y-6">
                    {/* Detalles Extra */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                        <h3 className="font-bold text-slate-800 mb-4 border-b border-slate-50 pb-2">Información Adicional</h3>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <p className="text-slate-400">Fecha Nacimiento</p>
                                <p className="font-medium text-slate-700">{animal.fecha_nacimiento || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-slate-400">Raza</p>
                                <p className="font-medium text-slate-700">Brangus (Est.)</p>
                            </div>
                            <div>
                                <p className="text-slate-400">Madre</p>
                                <p className="font-medium text-slate-700">--</p>
                            </div>
                            <div>
                                <p className="text-slate-400">Padre</p>
                                <p className="font-medium text-slate-700">--</p>
                            </div>
                        </div>
                    </div>

                    {/* Timeline */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                        <h3 className="font-bold text-slate-800 mb-6">Historial de Eventos</h3>
                        <div className="relative border-l-2 border-slate-100 ml-3 space-y-8">
                            {history.map((event, i) => {
                                const display = getEventDisplay(event);
                                return (
                                    <div key={i} className="relative pl-8 animate-in slide-in-from-left-2 duration-300">
                                        <div className={`absolute -left-[9px] top-0 h-4 w-4 rounded-full border-2 border-white shadow-sm flex items-center justify-center ${display.color}`}>
                                            <div className="w-2 h-2 rounded-full bg-current"></div>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-400 mb-1">{new Date(event.date).toLocaleDateString()}</p>
                                            <h4 className="font-bold text-slate-700 text-sm flex items-center gap-2">
                                                {display.title}
                                            </h4>
                                            <p className="text-xs text-slate-500 mt-1">{display.subtitle}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

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

export default AnimalDetail;
