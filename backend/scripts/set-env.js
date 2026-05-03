/**
 * Environment Switch Script
 * Usage: node scripts/set-env.js <local|production>
 */
const fs = require('fs');
const path = require('path');

const envType = process.argv[2];

if (!envType || !['local', 'production'].includes(envType)) {
    console.error('Usage: node scripts/set-env.js <local|production>');
    process.exit(1);
}

const envFile = `.env.${envType}`;
const targetFile = '.env';

try {
    // Check if source env file exists
    const sourcePath = path.join(__dirname, '..', envFile);
    if (!fs.existsSync(sourcePath)) {
        console.error(`Environment file ${envFile} does not exist`);
        process.exit(1);
    }
    
    // Copy environment file
    fs.copyFileSync(sourcePath, path.join(__dirname, '..', targetFile));
    console.log(`✅ Environment set to ${envType}`);
    console.log(`📁 Copied ${envFile} to .env`);
} catch (error) {
    console.error('❌ Error setting environment:', error.message);
    process.exit(1);
}
