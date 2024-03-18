const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { client, database, masterContainer } = require('./CosmosSetup');

const router = express.Router();

// It's critical to keep your secret key secure; consider using environment variables
const SECRET_KEY =process.env.SECRET_KEY;

router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required.' });
    }


    try {

        const { resources: Containers } = await masterContainer.items
            .query("SELECT c.id FROM c")
            .fetchAll();
        for (const org of Containers) {
            const orgContainer = database.container(org.id);
            const { resources: users } = await orgContainer.items
                .query({
                    query: "SELECT * FROM c WHERE c.id = @email",
                    parameters: [{ name: "@email", value: email }]
                })
                .fetchAll();
            if (users.length > 0) {
                const user = users[0];
                const match = await bcrypt.compare(password, user.password);

                if (match) {
                    const token = jwt.sign(
                        {
                            userId: user.id,
                            email: user.email,
                            organizationName: org.id,
                        },
                        SECRET_KEY,
                        { expiresIn: '24h' }
                    );

                    return res.status(200).json({ message: 'Login successful.', token });
                } else {
                    return res.status(401).json({ message: 'Incorrect password.' });
                }
            }
        }

        return res.status(404).json({ message: 'User not found in any organization.' });
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({ message: 'An error occurred during login.' });
    }
});


module.exports = router;
