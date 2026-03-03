const db = require('./config/db');

async function checkIndexes() {
    try {
        console.log("Checking indexes for 'clientes' table:");
        const [indexes] = await db.query("SHOW INDEX FROM clientes");
        console.log(JSON.stringify(indexes, null, 2));

        console.log("\nChecking full schema of 'clientes':");
        const [schema] = await db.query("SHOW CREATE TABLE clientes");
        console.log(schema[0]['Create Table']);
    } catch (error) {
        console.error("Error checking db:", error.message);
    } finally {
        process.exit();
    }
}

checkIndexes();
