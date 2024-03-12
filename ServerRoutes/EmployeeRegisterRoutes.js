const express = require('express');
const router = express.Router();
const { client, database, masterContainer } = require('./CosmosSetup');
const { DateTime } = require('luxon');
const bcrypt = require('bcrypt');

const saltRounds = 10; // Cost factor for hashing the password

// Route handler for the employee registration page
router.post('/empregister', async (req, res) => {
    const { referral } = req.query;
    const regex = /^.{8}\d{8}.{4}$/;
    if (!regex.test(referral)) {
        return res.redirect('http://localhost:5173/');
        console.log('REFF: ', referral);
    }
    // Validate referral code (you can add your validation logic here)
    const currentOrg= await isValidReferral(referral);
    if (currentOrg==null) {
        return res.redirect('http://localhost:5173/');
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
                query: 'SELECT VALUE COUNT(1) FROM c WHERE c.email = @email',
                parameters: [{ name: '@email', value: email }]
            };
        const { resources: existingUser } = await client.database(database).container(currentOrg).items.query(querySpecUser).fetchAll();
        if (existingUser > 0) {
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

        await currentOrg.items.create(employeeData);
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
        query: 'SELECT VALUE COUNT(1) FROM c WHERE c.employeeLink = @referralCode',
        parameters: [{ name: '@referralCode', value: referral }]
    };

    const { resources: results } = await client.database(database).container(masterContainer).items.query(querySpecRef).fetchAll();
    if (results.length > 0) {
        return results[0].organizationName;
    } else {
        return null; // Return null if referral code not found
    }

    }catch(error){
        console.error('Error validating code :', error);
        return null;
    }
}

module.exports = router;