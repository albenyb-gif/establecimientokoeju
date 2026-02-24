import React, { useEffect, useState } from 'react';
import { db } from '../db/db';
import api from '../api/axios';
import { Wifi, WifiOff, RefreshCw, CheckCircle2, CloudSync, CloudOff, Cloud, Database } from 'lucide-react';

const SyncManager = () => {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [isSyncing, setIsSyncing] = useState(false);
    const [pendingCount, setPendingCount] = useState(0);
    const [showSuccess, setShowSuccess] = useState(false);

    useEffect(() => {
        const handleStatusChange = () => {
            setIsOnline(navigator.onLine);
            if (navigator.onLine) syncData();
        };

        window.addEventListener('online', handleStatusChange);
        window.addEventListener('offline', handleStatusChange);

        updatePendingCount();

        return () => {
            window.removeEventListener('online', handleStatusChange);
            window.removeEventListener('offline', handleStatusChange);
        };
    }, []);

    const updatePendingCount = async () => {
        const count = await db.syncQueue.count();
        setPendingCount(count);
    };

    const syncData = async () => {
        const queueSize = await db.syncQueue.count();
        if (queueSize === 0) return;

        setIsSyncing(true);
        const pendingActions = await db.syncQueue.orderBy('timestamp').toArray();

        for (const action of pendingActions) {
            try {
                if (action.type === 'POST') {
                    await api.post(action.endpoint, action.payload);
                } else if (action.type === 'PUT') {
                    await api.put(action.endpoint, action.payload);
                }
                await db.syncQueue.delete(action.id);
            } catch (error) {
                console.error('Error syncing action:', action, error);
                break;
            }
        }

        const remaining = await db.syncQueue.count();
        setPendingCount(remaining);
        setIsSyncing(false);

        if (remaining === 0 && queueSize > 0) {
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 4000);
        }
    };

    // If online, no pending tasks, and not showing success, don't show anything
    if (isOnline && pendingCount === 0 && !showSuccess) return null;

    return (
        <div className="fixed bottom-6 right-6 z-[9999] animate-in slide-in-from-bottom-8 duration-500 ease-out">
            <div className={`
                flex items-center gap-4 px-6 py-4 rounded-[1.8rem] shadow-2xl border-2 backdrop-blur-md transition-all duration-500
                ${!isOnline ? 'bg-amber-500/90 border-amber-400 text-white shadow-amber-900/20' :
                    showSuccess ? 'bg-emerald-500/90 border-emerald-400 text-white shadow-emerald-900/20' :
                        'bg-white/90 border-slate-100 text-slate-900 shadow-slate-900/10'}
            `}>
                <div className="relative">
                    {!isOnline ? (
                        <div className="relative">
                            <CloudOff size={22} className="animate-pulse" />
                        </div>
                    ) : isSyncing ? (
                        <div className="relative">
                            <Cloud size={22} className="text-blue-500" />
                            <div className="absolute inset-0 border-2 border-blue-500 border-t-transparent rounded-full animate-spin -m-1"></div>
                        </div>
                    ) : showSuccess ? (
                        <div className="bg-white/20 p-1 rounded-lg">
                            <CheckCircle2 size={18} className="text-white" />
                        </div>
                    ) : (
                        <Database size={22} className="text-slate-400" />
                    )}

                    {pendingCount > 0 && !showSuccess && (
                        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full ring-2 ring-white">
                            {pendingCount}
                        </span>
                    )}
                </div>

                <div className="flex flex-col">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-70">
                        {!isOnline ? 'Conectividad Limitada' :
                            isSyncing ? 'Sincronización en Curso' :
                                showSuccess ? 'Sincronización Exitosa' : 'Base de Datos Local'}
                    </p>
                    <p className="text-sm font-black tracking-tight mt-0.5">
                        {!isOnline ? 'Operando en Modo Offline' :
                            isSyncing ? `Procesando ${pendingCount} Transacciones` :
                                showSuccess ? 'Resguardado en la Nube' : `${pendingCount} Cambios Pendientes`}
                    </p>
                </div>

                {(!isOnline || pendingCount > 0) && isOnline && !isSyncing && !showSuccess && (
                    <button
                        onClick={syncData}
                        className="ml-2 p-2 bg-slate-900 text-white rounded-xl hover:bg-indigo-600 transition-colors shadow-lg"
                    >
                        <RefreshCw size={14} />
                    </button>
                )}
            </div>
        </div>
    );
};

export default SyncManager;
