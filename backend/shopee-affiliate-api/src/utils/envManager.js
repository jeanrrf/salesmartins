const fs = require('fs');
const path = require('path');

const ENV_FILE_PATH = path.resolve(__dirname, '../../.env');
const ENV_DEV_PATH = path.resolve(__dirname, '../../.env.development');
const ENV_PROD_PATH = path.resolve(__dirname, '../../.env.production');

function getCurrentEnv() {
    try {
        const envContent = fs.readFileSync(ENV_FILE_PATH, 'utf8');
        const nodeEnv = envContent.match(/NODE_ENV=(\w+)/);
        return nodeEnv ? nodeEnv[1] : 'development';
    } catch (error) {
        return 'development';
    }
}

function backupCurrentEnv() {
    const currentEnv = getCurrentEnv();
    const backupPath = `${ENV_FILE_PATH}.backup`;
    
    if (fs.existsSync(ENV_FILE_PATH)) {
        fs.copyFileSync(ENV_FILE_PATH, backupPath);
        console.log('✅ Backup do arquivo .env atual criado');
    }
    
    return currentEnv;
}

function switchEnvironment(targetEnv) {
    const currentEnv = backupCurrentEnv();
    
    if (currentEnv === targetEnv) {
        console.log(`⚠️ Ambiente já está configurado para ${targetEnv}`);
        return false;
    }
    
    const sourcePath = targetEnv === 'production' ? ENV_PROD_PATH : ENV_DEV_PATH;
    
    if (!fs.existsSync(sourcePath)) {
        console.error(`❌ Arquivo ${sourcePath} não encontrado`);
        return false;
    }
    
    try {
        fs.copyFileSync(sourcePath, ENV_FILE_PATH);
        console.log(`✅ Ambiente alterado para ${targetEnv}`);
        return true;
    } catch (error) {
        console.error('❌ Erro ao alterar ambiente:', error);
        return false;
    }
}

module.exports = {
    getCurrentEnv,
    switchEnvironment
};