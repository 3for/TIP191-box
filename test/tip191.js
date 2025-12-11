const wait = require('./helpers/wait');
const chalk = require('chalk');
const TRONVerifyPersonalSignature = artifacts.require('./TRONVerifyPersonalSignature.sol');

// The following tests require TronBox >= 4.1.x
// and Tron Quickstart (https://github.com/tronprotocol/docker-tron-quickstart)

contract('TRONVerifyPersonalSignature', function (accounts) {
  let tip191PersonalSign;

  before(async function () {
    tip191PersonalSign = await TRONVerifyPersonalSignature.deployed();
    if (accounts.length < 3) {
      // Set your own accounts if you are not using Tron Quickstart
    }
  });

  it('should verify that there are at least three available accounts', async function () {
    if (accounts.length < 3) {
      console.log(
        chalk.blue(
          '\nYOUR ATTENTION, PLEASE.]\nTo test TRONVerifyPersonalSignature you should use Tron Quickstart (https://github.com/tronprotocol/docker-tron-quickstart) as your private network.\nAlternatively, you must set your own accounts in the "before" statement in "test/tip191.js".\n'
        )
      );
    }
    assert.isTrue(accounts.length >= 3);
  });
});
