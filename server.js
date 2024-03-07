const express = require('express');
const CosmosClient = require('@azure/cosmos').CosmosClient;
const { DateTime } = require('luxon');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const port = 3000;

const url = 'https://atc-2024-reformed-cosmos-account.documents.azure.com/';
const key = 'NBLt1z2m8EgAyidEVYzLxrCckcYmN40pPg1NuCyerzxkvnsaOw0AJYOKYdXg8IhlspxQtMpWaBmmACDbAddPBw==';
const databaseName = 'atc-2024-reformed-database';
const containerName = 'Organisations';

const client = new CosmosClient({ endpoint: url, key: key });
const database = client.database(databaseName);
const container = database.container(containerName);

app.use(express.json());

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

// Route to get all organisations
app.get('/organisations', async (req, res) => {
  try {
    const { resources: organisations } = await container.items
      .query("SELECT * from c")
      .fetchAll();
    res.status(200).json(organisations);
  } catch (error) {
    res.status(500).send(error);
  }
});

app.get('/', (req, res) => {
  res.send('Server is running. Access the /organisations endpoint to view the data.');
});

app.listen(port, () => console.log(`Server is running on http://localhost:${port}`));
