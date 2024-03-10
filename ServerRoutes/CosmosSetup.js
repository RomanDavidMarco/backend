const { CosmosClient } = require('@azure/cosmos');

const url = 'https://atc-2024-reformed-cosmos-account.documents.azure.com/';
const key = 'NBLt1z2m8EgAyidEVYzLxrCckcYmN40pPg1NuCyerzxkvnsaOw0AJYOKYdXg8IhlspxQtMpWaBmmACDbAddPBw==';
const databaseName = 'atc-2024-reformed-database';
const masterContainerName = 'Organisations';

const client = new CosmosClient({ endpoint: url, key: key });
const database = client.database(databaseName);
const masterContainer = database.container(masterContainerName);

module.exports = { client, database, masterContainer };