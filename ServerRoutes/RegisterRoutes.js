const express = require('express');
const router = express.Router();
const { DateTime } = require('luxon');
const bcrypt = require('bcrypt');
const { client, database, masterContainer } = require('./CosmosSetup');
const { v4: uuidv4 } = require('uuid');

const saltRounds = 10; // Cost factor for hashing the password

router.post('/register', async (req, res) => {
    const { name, organizationName, headquartersAddress, email, password } = req.body;

    if (!organizationName) {
        return res.status(400).json({ message: 'Organization name is required.' });
    } else if (!headquartersAddress) {
        return res.status(400).json({ message: 'Headquarters address is required.' });
    } else if (!email) {
        return res.status(400).json({ message: 'Email is required.' });
    } else if (!password) {
        return res.status(400).json({ message: 'Password is required.' });
    }else if (!name) {
        return res.status(400).json({ message: 'Name is required.' });
    }

    try {
        // Check if the organization already exists based on the organizationName
        const { resources: existingOrganizations } = await masterContainer.items
            .query({
                query: "SELECT * FROM c WHERE c.id = @organizationName",
                parameters: [{ name: "@organizationName", value: organizationName }]
            })
            .fetchAll();

        if (existingOrganizations.length > 0) {
            // If an entry with the provided organization name already exists
            return res.status(409).json({ message: 'An organization with the provided name already exists.' });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Proceed with the registration since the organization does not exist
        const organizationData = {
            id: organizationName,
            headquartersAddress: headquartersAddress,
            registeredAt: DateTime.now().toISO(),
        };
        const employeeLink = generateAffiliateLink(organizationName,organizationData.registeredAt);
        organizationData.employeeLink=employeeLink;
        
        await masterContainer.items.create(organizationData);

        // Attempt to create a new container for the organization if it does not exist
        await database.containers.createIfNotExists({
            id: organizationName,
            partitionKey: { paths: ["/id"] }
        });

        // Reference to the newly created container
        const newContainer = database.container(organizationName);

        // Including an additional entry "organisationAdmin" with the hashed password
        const newItem = {
            id: email,
            name: name,
            password: hashedPassword, // Store the hashed password
            roles:["organizationAdmin","departmentManager","projectManager"]
            // employee: false,
            //organisationAdmin: true,
            //departmentManager: false,
            //projectManager: false
        };
        
        await newContainer.items.create(newItem);

        res.status(201).json({ message: 'Organization registered successfully', organization: organizationData });
    } catch (error) {
        console.error('Error while registering organization:', error);
        res.status(500).json({ message: 'Failed to register organization.' });
    }
});

function generateAffiliateLink(organizationName, registratedAt) {
    const randomStartString = uuidv4().slice(0, 6); // Generate random string of 6 characters
    const randomEndString = uuidv4().slice(0, 4); // Generate another random string of 4 characters
    const formattedDate = registratedAt.split('T')[0]; // Extract date portion from ISO string
    const year = formattedDate.slice(0, 4);
    const month = formattedDate.slice(5, 7);
    const day = formattedDate.slice(8, 10);
    const firstTwoLetters = organizationName.slice(0, 2).toUpperCase(); // Get first two letters of company name
    return `${randomStartString}${firstTwoLetters}${year}${month}${day}${randomEndString}`;
}

module.exports = router;
