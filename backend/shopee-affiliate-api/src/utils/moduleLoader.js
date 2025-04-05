const config = require('../config/database');

/**
 * Utility for conditionally loading modules based on environment
 */
class ModuleLoader {
  /**
   * Conditionally load a module based on configuration
   * @param {string} moduleName - Name of the module in config.modules
   * @param {Function} importFn - Import function that returns the module
   * @returns {Object|null} The module if available, null otherwise
   */
  static async loadIfEnabled(moduleName, importFn) {
    if (config.modules[moduleName]) {
      try {
        return await importFn();
      } catch (error) {
        console.error(`Failed to load module ${moduleName}:`, error);
        return null;
      }
    }
    console.log(`Module ${moduleName} is disabled in this environment`);
    return null;
  }

  /**
   * Register routes conditionally based on environment
   * @param {Express} app - Express application
   * @param {string} moduleName - Module name to check in config
   * @param {Function} routeSetupFn - Function that sets up routes
   */
  static registerRoutesIfEnabled(app, moduleName, routeSetupFn) {
    if (config.modules[moduleName]) {
      routeSetupFn(app);
      console.log(`Routes for ${moduleName} registered`);
    } else {
      console.log(`Routes for ${moduleName} not registered (disabled in this environment)`);
    }
  }

  /**
   * Register middleware for all routes
   * @param {Object} app - Express app instance
   * @param {Function} middleware - The middleware function to register
   */
  static registerGlobalMiddleware(app, middleware) {
    app.use(middleware);
  }
}

module.exports = ModuleLoader;
