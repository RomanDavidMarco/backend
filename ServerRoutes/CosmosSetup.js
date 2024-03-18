const { CosmosClient } = require('@azure/cosmos');

const url = process.env.COSMOS_DB_ENDPOINT;
const key = process.env.COSMOS_DB_KEY;
const databaseName = process.env.COSMOS_DB_NAME;
const masterContainerName = process.env.COSMOS_DB_CONTAINER;

const client = new CosmosClient({ endpoint: url, key: key });
const database = client.database(databaseName);
const masterContainer = database.container(masterContainerName);

module.exports = { client, database, masterContainer };