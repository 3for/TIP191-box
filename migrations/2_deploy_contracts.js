const TRONVerifyPersonalSignature = artifacts.require('./TRONVerifyPersonalSignature.sol');

module.exports = function (deployer) {
  deployer.deploy(TRONVerifyPersonalSignature);
};
