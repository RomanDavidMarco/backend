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
  // Including email in the destructuring assignment
  const { organizationName, headquartersAddress, email } = req.body;

  // Checking for the presence of the email along with other required fields
  if (!headquartersAddress) {
    return res.status(400).json({ message: 'HQ is required.' });
  }
  else if (!organizationName)
    return res.status(400).json({ message: 'Organization name is required.' });
  else if (!email)
    return res.status(400).json({ message: 'Email is required.' });


  try {
    // Adjusting the query to check for the email address instead of the organization name
    const { resources: existingRegistrations } = await masterContainer.items
      .query({
        query: "SELECT * FROM c WHERE c.email = @email",
        parameters: [{ name: "@email", value: email }]
      })
      .fetchAll();

    if (existingRegistrations.length > 0) {
      // If an entry with the provided email already exists, indicating the person is already registered
      return res.status(409).json({ message: 'A registration with the provided email already exists.' });
    }

    // The rest of the registration process remains unchanged
    const containerDefinition = {
      id: organizationName,
      partitionKey: { paths: ["/id"] }
    };

    await database.containers.createIfNotExists(containerDefinition);

    // Including the email in the newItem object
    const newItem = {
      id: organizationName, // Consider using a GUID or similar for unique IDs instead
      organizationName,
      headquartersAddress,
      email, // Now storing the email address with the registration
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

