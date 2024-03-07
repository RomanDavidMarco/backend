const express = require('express');
const { CosmosClient } = require('@azure/cosmos');
const { DateTime } = require('luxon');
const app = express();
const port = 3000;

const url = 'https://atc-2024-reformed-cosmos-account.documents.azure.com/';
const key = 'NBLt1z2m8EgAyidEVYzLxrCckcYmN40pPg1NuCyerzxkvnsaOw0AJYOKYdXg8IhlspxQtMpWaBmmACDbAddPBw==';
const databaseName = 'atc-2024-reformed-database';
const masterContainerName = 'Organisations';

const client = new CosmosClient({ endpoint: url, key: key });
const database = client.database(databaseName);
const masterContainer = database.container(masterContainerName);

app.use(express.json());

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.post('/register', async (req, res) => {
  const { organizationName, headquartersAddress } = req.body;

  if (!organizationName || !headquartersAddress) {
    return res.status(400).json({ message: 'Organization name and headquarters address are required.' });
  }

  try {
    // Check if the "Organisations" container already contains this organization
    const { resources: existingOrganizations } = await masterContainer.items
      .query({ query: "SELECT * FROM c WHERE c.organizationName = @name", parameters: [{ name: "@name", value: organizationName }] })
      .fetchAll();

    if (existingOrganizations.length > 0) {
      // Organization already exists in the master container
      return res.status(409).json({ message: 'Organization already exists.' });
    }

    // Create a new container for the organization if it does not exist
    const containerDefinition = {
      id: organizationName,
      partitionKey: { paths: ["/id"] } // Adjust the partitionKey according to your data model
    };
    const containerOptions = { offerThroughput: 400 }; // Set throughput as per your requirement

    await database.containers.createIfNotExists(containerDefinition, containerOptions);

    // Insert the new organization's details into the "Organisations" container
    const newItem = {
      id: organizationName,
      organizationName,
      headquartersAddress,
      registeredAt: DateTime.now().toISO()
    };
    const { resource: createdItem } = await masterContainer.items.create(newItem);

    res.status(201).json({ message: 'Organization registered successfully', organization: createdItem });
  } catch (error) {
    console.error('Error while registering organization:', error);
    res.status(500).json({ message: 'Failed to register organization.' });
  }
});

// Optionally, add the route to list all organizations
app.get('/organisations', async (req, res) => {
  try {
    const { resources: organisations } = await masterContainer.items
      .query("SELECT * from c")
      .fetchAll();
    res.status(200).json(organisations);
  } catch (error) {
    console.error('Error fetching organizations:', error);
    res.status(500).json({ message: 'Failed to fetch organizations.' });
  }
});

app.get('/', (req, res) => {
  res.send('Server is running. Use the /register endpoint to register an organization.');
});

app.listen(port, () => console.log(`Server is running on http://localhost:${port}`));

