const fs = require('fs');
const path = require('path');

/**
 * Middleware that injects custom scripts into HTML responses
 */
function injectScripts(req, res, next) {
    // Keep track of the original send function
    const originalSend = res.send;
    
    // Only process HTML responses for Sales Martins routes
    if (req.path === '/sales-martins' || req.path.startsWith('/sales-martins/')) {
        res.send = function(body) {
            // Only process HTML responses (strings)
            if (typeof body === 'string' && body.includes('</html>')) {
                try {
                    // Load our script
                    const scriptPath = path.join(__dirname, '../../public/disableHomeNavigation.js');
                    const scriptContent = fs.readFileSync(scriptPath, 'utf8');
                    
                    // Inject before closing body tag
                    body = body.replace('</body>', `<script>${scriptContent}</script></body>`);
                    
                    // Update Content-Length if it exists
                    if (res.getHeader('Content-Length')) {
                        res.setHeader('Content-Length', Buffer.byteLength(body));
                    }
                } catch (error) {
                    console.error('Error injecting script:', error);
                }
            }
            
            // Call the original function
            return originalSend.call(this, body);
        };
    }
    
    next();
}

module.exports = injectScripts;
