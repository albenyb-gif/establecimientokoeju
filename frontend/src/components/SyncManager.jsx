import React, { useEffect, useState } from 'react';
import { db } from '../db/db';
import api from '../api/axios';
import { Wifi, WifiOff, RefreshCw, CheckCircle2 } from 'lucide-react';

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

        // Initial check and count
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
                // If success, delete from queue
                await db.syncQueue.delete(action.id);
            } catch (error) {
                console.error('Error syncing action:', action, error);
                // Stop syncing if server is down
                break;
            }
        }

        const remaining = await db.syncQueue.count();
        setPendingCount(remaining);
        setIsSyncing(false);

        if (remaining === 0 && queueSize > 0) {
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 3000);
        }
    };

    if (isOnline && pendingCount === 0 && !showSuccess) return null;

    return (
        <div className="fixed bottom-4 right-4 z-[9999] animate-in slide-in-from-bottom-4 duration-300">
            <div className={`
                flex items-center gap-3 px-4 py-3 rounded-2xl shadow-2xl border
                ${!isOnline ? 'bg-amber-50 border-amber-200 text-amber-700' :
                    showSuccess ? 'bg-emerald-50 border-emerald-200 text-emerald-700' :
                        'bg-white border-slate-200 text-slate-700'}
            `}>
                {!isOnline ? (
                    <>
                        <WifiOff size={20} className="text-amber-500" />
                        <div className="text-sm">
                            <p className="font-bold">Modo Offline</p>
                            {pendingCount > 0 && <p className="text-xs opacity-80">{pendingCount} cambios guardados localmente</p>}
                        </div>
                    </>
                ) : isSyncing ? (
                    <>
                        <RefreshCw size={20} className="text-blue-500 animate-spin" />
                        <span className="text-sm font-medium">Sincronizando datos...</span>
                    </>
                ) : showSuccess ? (
                    <>
                        <CheckCircle2 size={20} className="text-emerald-500" />
                        <span className="text-sm font-medium">¡Datos sincronizados!</span>
                    </>
                ) : null}
            </div>
        </div>
    );
};

export default SyncManager;
