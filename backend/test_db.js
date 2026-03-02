const db = require('./config/db');

async function testDB() {
    try {
        console.log("Checking tables...");
        const [tables] = await db.query("SHOW TABLES");
        console.log("Tables present:", tables.map(t => Object.values(t)[0]));

        console.log("\nChecking clientes structure:");
        try {
            const [descClientes] = await db.query("DESCRIBE clientes");
            console.log(descClientes);
        } catch (e) { console.error("Error describing clientes:", e.message); }

        console.log("\nChecking compras_lotes structure:");
        try {
            const [descCompras] = await db.query("DESCRIBE compras_lotes");
            console.log(descCompras);
        } catch (e) { console.error("Error describing compras_lotes:", e.message); }

        console.log("\nChecking animales structure:");
        try {
            const [descAnimales] = await db.query("DESCRIBE animales");
            console.log(descAnimales);
        } catch (e) { console.error("Error describing animales:", e.message); }

    } catch (error) {
        console.error("Critical DB error:", error);
    } finally {
        process.exit();
    }
}

testDB();
