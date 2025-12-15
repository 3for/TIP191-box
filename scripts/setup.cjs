var fs = require('fs')
var path = require('path')
var TRONVerifyPersonalSignature = require('../build/contracts/TRONVerifyPersonalSignature')

const tronboxConfig = require('../tronbox.cjs').networks;

// Auto detect current network (from TronBox CLI or user-defined env)
const currentNetwork = process.env.TRON_NETWORK || 'nile';

// Load network config dynamically
const netConf = tronboxConfig[currentNetwork];

if (!netConf) {
  throw new Error(`Unknown Tron network: ${currentNetwork}`);
}

// Get network_id
const netId = netConf.network_id;

// Use dynamic network_id instead of hardcoded '3'
const personalSigAddress = TRONVerifyPersonalSignature.networks[netId]?.address;

console.log(`Using network: ${currentNetwork} (id=${netId})`);
console.log('Contract address:', personalSigAddress);

console.log('The app has been configured.')
console.log('Run "npm run dev" to start it.')

const personalSigConfig = {
  contractAddress: personalSigAddress,
  privateKey: netConf.privateKey,
  fullHost: netConf.fullHost
}

fs.writeFileSync(path.resolve(__dirname, '../src/js/personal-config.js'),`export const personalSigConfig = ${JSON.stringify(personalSigConfig, null, 2)}`)
