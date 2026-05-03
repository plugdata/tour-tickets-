/**
 * Auto-add Authentication Guard to all protected pages
 * Run: node scripts/add-auth-guard.js
 */
const fs = require('fs');
const path = require('path');

// Pages that need authentication protection (exclude login page)
const protectedPages = [
    'addons/list.html',
    'admin/bank-accounts.html',
    'booking/form.html',
    'booking/insurance.html',
    'booking/rental.html',
    'booking/seats.html',
    'booking/status.html',
    'booking/ticket.html',
    'bookings/list.html',
    'bookings/view.html',
    'bookmoney/bookbank.html',
    'bookmoney/bookmoney.html',
    'bus-rounds/list.html',
    'cms/gallery.html',
    'cms/media.html',
    'cms/settings.html',
    'contents/list.html',
    'customers/list.html',
    'customers/view.html',
    'dashboard.html',
    'expenses/list.html',
    'index.html',
    'insurance/conditions.html',
    'insurance/customer-form.html',
    'insurance/form.html',
    'insurance/list.html',
    'monitor/list.html',
    'monitor/report.html',
    'payments/list.html',
    'products.html',
    'reports/print.html',
    'reports/staff-report.html',
    'reports/summary.html',
    'trips/list.html',
    'user/form.html',
    'user/list.html',
    'user/view.html',
    'users/list.html'
];

function addAuthGuard(filePath) {
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        
        // Check if auth-guard is already included
        if (content.includes('auth-guard.js')) {
            console.log(`✅ ${filePath} - Already has auth guard`);
            return;
        }
        
        // Find the auth.js script and add auth-guard.js after it
        const authJsPattern = /<script src="[^"]*auth\.js"><\/script>/;
        const match = content.match(authJsPattern);
        
        if (match) {
            // Insert auth-guard.js after auth.js
            const authGuardScript = match[0].replace('auth.js', 'auth-guard.js') + '\n';
            content = content.replace(match[0], match[0] + '\n' + authGuardScript);
            
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`✅ ${filePath} - Added auth guard`);
        } else {
            console.log(`⚠️  ${filePath} - Could not find auth.js script`);
        }
        
    } catch (error) {
        console.error(`❌ ${filePath} - Error: ${error.message}`);
    }
}

// Process all protected pages
console.log('🔐 Adding authentication guard to protected pages...\n');

protectedPages.forEach(page => {
    const fullPath = path.join(__dirname, '..', 'pages', page);
    if (fs.existsSync(fullPath)) {
        addAuthGuard(fullPath);
    } else {
        console.log(`⚠️  File not found: ${fullPath}`);
    }
});

console.log('\n🎉 Authentication guard setup complete!');
