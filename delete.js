const { CosmosClient } = require("@azure/cosmos");

// Define the connection parameters
const endpoint = "https://atc-2024-reformed-cosmos-account.documents.azure.com:443/";
const key = "NBLt1z2m8EgAyidEVYzLxrCckcYmN40pPg1NuCyerzxkvnsaOw0AJYOKYdXg8IhlspxQtMpWaBmmACDbAddPBw==";
const databaseId = "atc-2024-reformed-database";
const containerId = "Organisations"; // Container ID for operations

// Initialize CosmosClient
const client = new CosmosClient({ endpoint, key });

// Function to delete a container
async function deleteContainer() {
    try {
        const database = client.database(databaseId);
        const container = database.container(containerId);

        await container.delete();
        console.log(`Container ${containerId} deleted successfully`);
    } catch (error) {
        console.error("Error deleting container:", error);
    }
}

async function deleteAllContainers() {
    try {
        const database = client.database(databaseId);
        
        // Retrieve all containers in the database
        const { resources: containers } = await database.containers.readAll().fetchAll();
        
        // Iterate over each container and delete it
        for (const container of containers) {
            await database.container(container.id).delete();
            console.log(`Container ${container.id} deleted successfully`);
        }
    } catch (error) {
        console.error("Error deleting containers:", error);
    }
}

// Function to create a container
async function createContainer() {
    try {
        const database = client.database(databaseId);

        const { container } = await database.containers.createIfNotExists({
            id: containerId,
            partitionKey: { paths: ["/id"] } // Adjust the partitionKey path according to your data model
        });

        console.log(`Container ${container.id} created successfully`);
    } catch (error) {
        console.error("Error creating container:", error);
    }
}

// Example usage
// Uncomment the function you want to use and change the 'const containerId = "your-choice"'- Container ID for operations
//deleteContainer();
//createContainer();
//deleteAllContainers();