require('dotenv').config();
const express = require('express');
const app = express();
const port = 3000;

app.use(express.json());
const { corsMiddleware } = require('./ServerRoutes/MiddlewareRoutes');
app.use(corsMiddleware);


// Import routes
const organizationRoutes = require('./ServerRoutes/OrganisationRoutes');
const registerRoutes = require('./ServerRoutes/RegisterRoutes');
const contentRoutes = require('./ServerRoutes/ContentRoutes');
const loginRoutes = require('./ServerRoutes/LoginRoutes');
const employeeRegisterRoutes = require('./ServerRoutes/EmployeeRegisterRoutes');

// Use routes
app.use(organizationRoutes);
app.use(registerRoutes);
app.use(contentRoutes);
app.use(loginRoutes);
app.use(employeeRegisterRoutes);

app.get('/', (req, res) => {
  res.send('Server is running.');
});

app.listen(port, () => console.log(`Server is running on http://localhost:${port}`));
