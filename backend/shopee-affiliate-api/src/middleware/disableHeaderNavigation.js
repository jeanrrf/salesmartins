/**
 * Middleware that disables header navigation buttons in the Sales Martins interface
 * Injects a script to remove or disable buttons that navigate away from the Sales Martins page
 */
function disableHeaderNavigation(req, res, next) {
    if (req.path === '/sales-martins' || req.path.startsWith('/sales-martins/')) {
        // Store the original send function
        const originalSend = res.send;
        
        res.send = function(body) {
            // Only process HTML responses
            if (typeof body === 'string' && body.includes('</body>')) {
                // Add script to disable dashboard button
                const disableScript = `
                <script>
                    document.addEventListener('DOMContentLoaded', function() {
                        // Function to remove or disable header navigation buttons
                        function disableNavigation() {
                            // Target header elements
                            const headerSelectors = [
                                'header', '.header', 'nav', '.nav', '.navbar', '.navigation'
                            ];
                            
                            // Find all navigation containers
                            headerSelectors.forEach(selector => {
                                const containers = document.querySelectorAll(selector);
                                
                                containers.forEach(container => {
                                    // Find all links and buttons
                                    const navItems = container.querySelectorAll('a, button');
                                    
                                    navItems.forEach(item => {
                                        // Check if it's a link to somewhere other than sales-martins
                                        const href = item.getAttribute('href');
                                        const target = item.getAttribute('data-target');
                                        
                                        if ((href && !href.includes('/sales-martins') && !href.startsWith('#')) || 
                                            (target && !target.includes('/sales-martins'))) {
                                            // Hide the button
                                            item.style.display = 'none';
                                            
                                            // Prevent click events
                                            item.addEventListener('click', function(e) {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                return false;
                                            }, true);
                                        }
                                    });
                                });
                            });
                            
                            // Also specifically target dashboard links anywhere in the page
                            const dashboardLinks = document.querySelectorAll(
                                'a[href="/dashboard"], a[href*="/dashboard/"], ' +
                                'button[data-target="/dashboard"], .dashboard-link, ' +
                                'a[href="/home"], a[href="/admin"], .admin-link'
                            );
                            
                            dashboardLinks.forEach(link => {
                                link.style.display = 'none';
                            });
                        }
                        
                        // Run immediately and also after any React/DOM updates
                        disableNavigation();
                        setInterval(disableNavigation, 1000);
                    });
                </script>`;
                
                body = body.replace('</body>', disableScript + '</body>');
            }
            
            // Call the original function
            return originalSend.call(this, body);
        };
    }
    next();
}

module.exports = disableHeaderNavigation;
