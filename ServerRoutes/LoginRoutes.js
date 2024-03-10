const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { client, database, masterContainer } = require('./CosmosSetup');

const router = express.Router();

// It's critical to keep your secret key secure; consider using environment variables
const SECRET_KEY ='HJc5wPb2LrT8eZsG9FvU3YqXjN6mKdA1RhIoOaDpQnWxSeFtRyGuVhJc5wPb2LrT';

router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required.' });
    }

    try {
        // Step 1: Query the "Organisations" master container for the user by email
        const orgContainer = database.container('Organisations');
        const { resources: users } = await orgContainer.items
            .query({
                query: "SELECT * FROM c WHERE c.id = @email",
                parameters: [{ name: "@email", value: email }]
            })
            .fetchAll();

        if (users.length === 0) {
            return res.status(404).json({ message: 'User not found.' });
        }

        // Assuming the user's organization's name is stored in 'organizationName' field
        const user = users[0];
        const organizationName = user.organizationName;
        
        // Step 2: Query the specific organization's container for user details
        const userContainer = database.container(organizationName);
        const { resources: userDetails } = await userContainer.items
            .query({
                query: "SELECT * FROM c WHERE c.email = @email",
                parameters: [{ name: "@email", value: email }]
            })
            .fetchAll();

        if (userDetails.length === 0) {
            // This should theoretically not happen since the user exists in the master container
            return res.status(500).json({ message: 'User details not found in the organization container.' });
        }

        const userDetail = userDetails[0];
        const match = await bcrypt.compare(password, userDetail.password);
        if (!match) {
            return res.status(401).json({ message: 'Incorrect password.' });
        }

        // User authenticated; include relevant information in JWT payload
        const token = jwt.sign(
            {
                userId: userDetail.id,
                email: userDetail.email,
                organizationName: organizationName,
                roles: userDetail.roles
            },
            SECRET_KEY,
            { expiresIn: '24h' }
        );

        res.status(200).json({ message: 'Login successful.', token });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'An error occurred during login.' });
    }
});


module.exports = router;
