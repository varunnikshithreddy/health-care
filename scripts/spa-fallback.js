const fs = require('fs');
const path = require('path');

const routes = [
  'schedule',
  'dashboard',
  'tasks',
  'water',
  'meals',
  'food-scanner',
  'history',
  'settings',
  'login',
  'signup',
  'onboarding',
  'privacy',
  'terms',
  'forgot-password',
];

function generateSPAFallbacks(distDir) {
  if (!fs.existsSync(distDir)) return;
  const indexHtml = fs.readFileSync(path.join(distDir, 'index.html'), 'utf8');

  // Create 404.html so static hosts fallback to React Router
  fs.writeFileSync(path.join(distDir, '404.html'), indexHtml, 'utf8');

  // Create route/index.html for each SPA route so direct loads succeed with 200
  routes.forEach((r) => {
    const routeDir = path.join(distDir, r);
    if (!fs.existsSync(routeDir)) {
      fs.mkdirSync(routeDir, { recursive: true });
    }
    fs.writeFileSync(path.join(routeDir, 'index.html'), indexHtml, 'utf8');
  });
}

generateSPAFallbacks(path.resolve(__dirname, '../client/dist'));
generateSPAFallbacks(path.resolve(__dirname, '../dist'));
console.log('✓ Successfully generated SPA route HTML fallbacks and 404.html');
