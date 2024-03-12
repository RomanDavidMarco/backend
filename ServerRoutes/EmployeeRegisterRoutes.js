const express = require('express');
const router = express.Router();
const { client, database, masterContainer } = require('./CosmosSetup');


// Route handler for the employee registration page
router.post('/empregister', (req, res) => {
    const { referral } = req.query;
    const regex = /^.{8}\d{8}.{4}$/;
    if (!regex.test(referral)) {
        return res.redirect('http://localhost:5173/');
        console.log('REFF: ', referral);
    }
    // Validate referral code (you can add your validation logic here)
    if (isValidReferral(referral)==null) {
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
});


// A function to validate the referral code
async function isValidReferral(referral) {

    try{
    // Search how many times the referral appears in the database, if the count is greater than 0 it means is valid
    const querySpec = {
        query: 'SELECT VALUE COUNT(1) FROM c WHERE c.employeeLink = @referralCode',
        parameters: [{ name: '@referralCode', value: referral }]
    };

    const { resources: results } = await client.database(database).container(masterContainer).items.query(querySpec).fetchAll();
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