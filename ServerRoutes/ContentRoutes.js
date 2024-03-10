const express = require('express');
const router = express.Router();
const { client, database, masterContainer } = require('./CosmosSetup');

router.get('/all-contents', async (req, res) => {
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

module.exports = router;