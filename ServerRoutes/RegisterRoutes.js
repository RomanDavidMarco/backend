const express = require('express');
const router = express.Router();
const { DateTime } = require('luxon');
const { client, database, masterContainer } = require('./CosmosSetup');

router.post('/register', async (req, res) => {
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

module.exports = router;