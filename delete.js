const { CosmosClient } = require("@azure/cosmos");

// Define the connection parameters
const endpoint = "https://atc-2024-reformed-cosmos-account.documents.azure.com:443/";
const key = "NBLt1z2m8EgAyidEVYzLxrCckcYmN40pPg1NuCyerzxkvnsaOw0AJYOKYdXg8IhlspxQtMpWaBmmACDbAddPBw==";
const databaseId = "atc-2024-reformed-database";
const containerId = "organisations"; // Container ID to be deleted
// Initialize CosmosClient
const client = new CosmosClient({ endpoint, key });

// Function to connect to the database and perform operations
async function deleteContainer() {
    try {
        // Get a reference to the database
        const database = client.database(databaseId);
        
        // Get a reference to the container
        const container = database.container(containerId);
        
        // Delete the container
        const { resource: result } = await container.delete();

        console.log(`Container ${container.id} deleted successfully`);
    } catch (error) {
        console.error("Error deleting container:", error);
    }
}

// Call the function to delete the container
deleteContainer();
