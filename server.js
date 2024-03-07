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
  const { organizationName, headquartersAddress, email } = req.body;

  if (!organizationName) {
    return res.status(400).json({ message: 'Organization name is required.' });
  } else if (!headquartersAddress) {
    return res.status(400).json({ message: 'Headquarters address is required.' });
  } else if (!email) {
    return res.status(400).json({ message: 'Email is required.' });
  }

  try {
    // Check if the organization already exists based on the organizationName
    const { resources: existingOrganizations } = await masterContainer.items
      .query({
        query: "SELECT * FROM c WHERE c.organizationName = @organizationName",
        parameters: [{ name: "@organizationName", value: organizationName }]
      })
      .fetchAll();

    if (existingOrganizations.length > 0) {
      // If an entry with the provided organization name already exists
      return res.status(409).json({ message: 'An organization with the provided name already exists.' });
    }

    // Proceed with the registration since the organization does not exist
    const organizationData = {
      id: organizationName, // Using the organization name as a unique identifier might lead to issues if names are not unique. Consider using a GUID or similar.
      organizationName,
      headquartersAddress,
      registeredAt: DateTime.now().toISO(),
    };

    await masterContainer.items.create(organizationData);

    // Attempt to create a new container for the organization if it does not exist
    await database.containers.createIfNotExists({
      id: organizationName,
      partitionKey: { paths: ["/id"] }
    });

    // Reference to the newly created container
    const newContainer = database.container(organizationName);

    // Including an additional entry "organisationAdmin"
    const newItem = {
      id: email, // Consider using a more unique ID for each entry.
      organizationName,
      headquartersAddress,
      email,
      registeredAt: DateTime.now().toISO(),
      organisationAdmin: true
    };

    await newContainer.items.create(newItem);

    res.status(201).json({ message: 'Organization registered successfully', organization: organizationData });
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

app.get('/all-contents', async (req, res) => {
  try {
    // List all containers in the database
    const { resources: containers } = await database.containers.readAll().fetchAll();
    
    let allData = [];

    // Query each container for its items
    for (const containerDef of containers) {
      const container = database.container(containerDef.id);
      const { resources: items } = await container.items
        .query("SELECT * FROM c")
        .fetchAll();
      
      allData.push({ container: containerDef.id, items });
    }

    res.status(200).json(allData);
  } catch (error) {
    console.error('Error fetching all contents:', error);
    res.status(500).json({ message: 'Failed to fetch all contents.' });
  }
});

app.get('/', (req, res) => {
  res.send('Server is running.');
});

app.listen(port, () => console.log(`Server is running on http://localhost:${port}`));

