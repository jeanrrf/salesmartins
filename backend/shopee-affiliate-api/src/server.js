const express = require('express');
const cors = require('cors');
const config = require('./config/database');
const ModuleLoader = require('./utils/moduleLoader');

// Initialize express app
const app = express();
app.use(express.json());
app.use(cors());

// Always load core routes (Sales Martins and basic data access)
app.use('/api/products', require('./routes/productRoutes'));

// Conditionally load development-only routes
ModuleLoader.registerRoutesIfEnabled(app, 'categoryRepair', (app) => {
    app.use('/api/category-repair', require('./routes/categoryRepairRoutes'));
});

ModuleLoader.registerRoutesIfEnabled(app, 'searchModule', (app) => {
    app.use('/api/search', require('./routes/searchRoutes'));
});

ModuleLoader.registerRoutesIfEnabled(app, 'adminPanel', (app) => {
    // Only load auth middleware in development
    const authMiddleware = require('./middleware/authMiddleware');
    app.use('/api/admin', authMiddleware, require('./routes/adminRoutes'));
});

ModuleLoader.registerRoutesIfEnabled(app, 'dataManagement', (app) => {
    // Only load auth middleware in development
    const authMiddleware = require('./middleware/authMiddleware');
    app.use('/api/data', authMiddleware, require('./routes/dataRoutes'));
});

// Simple environment info endpoint
app.get('/api/environment', (req, res) => {
    res.json({
        environment: config.environment.isProduction ? 'production' : 'development',
        modules: Object.entries(config.modules)
            .filter(([_, enabled]) => enabled)
            .map(([name]) => name)
    });
});

// Start the server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server running in ${config.environment.isProduction ? 'PRODUCTION' : 'DEVELOPMENT'} mode on port ${PORT}`);
    console.log('Enabled modules:', Object.entries(config.modules)
        .filter(([_, enabled]) => enabled)
        .map(([name]) => name)
        .join(', ')
    );
});