const express = require('express');
const router = express.Router();
const { client, database, masterContainer } = require('./CosmosSetup');

router.get('/organisations', async (req, res) => {
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

module.exports = router;
