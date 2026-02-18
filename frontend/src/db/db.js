import Dexie from 'dexie';

export const db = new Dexie('koEjuDB');

// Define database schema
db.version(1).stores({
    animals: 'id, caravana_visual, estado_general',
    rodeos: 'id, nombre',
    inventory: 'id, nombre_comercial',
    syncQueue: '++id, type, endpoint, payload, timestamp'
});

// Helper to save data to cache
export const cacheData = {
    saveAnimals: async (animals) => {
        await db.animals.bulkPut(animals);
    },
    saveRodeos: async (rodeos) => {
        await db.rodeos.bulkPut(rodeos);
    },
    saveInventory: async (items) => {
        await db.inventory.bulkPut(items);
    }
};

// Helper to queue offline changes
export const queueOfflineAction = async (type, endpoint, payload) => {
    await db.syncQueue.add({
        type,
        endpoint,
        payload,
        timestamp: Date.now()
    });
};
