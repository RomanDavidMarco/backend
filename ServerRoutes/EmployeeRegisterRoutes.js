
const express = require('express');
const router = express.Router();
const { client, database, masterContainer } = require('./CosmosSetup');
const { DateTime } = require('luxon');
const bcrypt = require('bcrypt');

const saltRounds = 10; // Cost factor for hashing the password

// Route handler for the employee registration page
router.post('/empregister', async (req, res) => {
    console.log("IM HERE");
    const { referral } = req.query;
    console.log(referral);
    const regex = /^.{8}\d{8}.{4}$/;
    if (!regex.test(referral)) {
        return res.status(400).json({ message: 'Not valid referral form.' });
    }
    // Validate referral code (you can add your validation logic here)
    const currentOrg= await isValidReferral(referral);
    console.log(currentOrg);
    if (currentOrg==null) {
        return res.status(400).json({ message: 'Referral expired.' });
    }

    const { name, email, password } = req.body;

    if (!name) {
        return res.status(400).json({ message: 'Name is required.' });
    } else if (!email) {
        return res.status(400).json({ message: 'Email is required.' });
    } else if (!password) {
        return res.status(400).json({ message: 'Password is required.' });
    }

    try {
        // Check if the user already exists in the organization based on the email
        const querySpecUser = {
                query: 'SELECT TOP 1 * FROM c WHERE c.id = @id',
                parameters: [{ name: '@id', value: email }]
            };
        const { resources: existingUser } = await database.container(currentOrg).items.query(querySpecUser).fetchAll();
        if (existingUser.length > 0) {
            // If an entry with the provided organization name already exists
            return res.status(409).json({ message: 'An user with the provided email already exists.' });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Proceed with the registration since the employee does not exist
        const employeeData = {
            id: email,
            name,
            registeredAt: DateTime.now().toISO(),
            password: hashedPassword,
            roles:["employee"]
        };

        await database.container(currentOrg).items.create(employeeData);
        res.status(201).json({ message: 'Employee registered successfully', employee: employeeData });
    } catch (error) {
        console.error('Error while registering organization:', error);
        res.status(500).json({ message: 'Failed to register organization.' });
    }
    
});


// A function to validate the referral code
async function isValidReferral(referral) {

    try{
    // Search how many times the referral appears in the database, if the count is greater than 0 it means is valid
    const querySpecRef = {
        query: 'SELECT * FROM c WHERE c.employeeLink = @employeeLink',
        parameters: [{ name: '@employeeLink', value: referral }]
    };

    const { resources: results } = await masterContainer.items.query(querySpecRef).fetchAll();
    console.log(results[0].organizationName);
    if (results.length > 0) {
        return results[0].id;
    } else {
        return null; // Return null if referral code not found
    }

    }catch(error){
        console.error('Error validating code :', error);
        return null;
    }
}

module.exports = router;