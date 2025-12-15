import TronWeb from 'tronweb';
import { personalSigConfig } from "./personal-config.js"
import Trx from '@ledgerhq/hw-app-trx';
import TransportWebHID from '@ledgerhq/hw-transport-webhid';

var contractAddress
let tronWeb

const path = "44'/195'/0'/0/0";
var ledgerHardwareAddress
var ledgerApp

try {
  contractAddress = personalSigConfig.contractAddress

  tronWeb = new TronWeb.TronWeb({
    fullHost: personalSigConfig.fullHost,
    privateKey: personalSigConfig.privateKey
  })
} catch (err) {
  alert('The app looks not configured. Please run `npm run migrate`')
}

function tweakSignature(sig) {
    // Remove 0x prefix if present
    let prefix = "0x";
    if (sig.startsWith("0x")) {
        sig = sig.slice(2);
        prefix = "0x";
    }

    // Ensure the signature has exactly 130 hex chars (65 bytes)
    if (sig.length < 130) {
        // Pad the start with zeros
        sig = sig.padStart(130, "0");
    }

    // r: first 32 bytes (64 hex chars)
    const r = sig.slice(0, 64);

    // s: next 32 bytes (64 hex chars)
    const s = sig.slice(64, 128);

    // v: last byte (2 hex chars)
    let v = parseInt(sig.slice(128, 130), 16);

    // Tron/Ethereum compatibility:
    // if v is 0 or 1, convert to 27/28
    if (v < 27) v += 27;

    // Convert v back to 1-byte hex
    const vHex = v.toString(16).padStart(2, "0");

    // Return full signature
    return "0x" + r + s + vHex;
}

async function initLedger(path) {
  let transport, app, address;
  try {
    transport = await TransportWebHID.create();
    app = new Trx(transport);
    address = await app.getAddress(path);
    console.log(address);
  } catch (err) {
    alert('initLedger error:' + err)
  }
  console.log("address:", address);
  return { transport, app, address };
}

var App = {
  tronWebProvider: null,
  contracts: {},
  accounts: [],
  contractAddress: contractAddress,
  privateKey: "0000000000000000000000000000000000000000000000000000000000000001",
  feeLimit: 100000000,
  callValue: 0,
  "abi": [
    {
      "inputs": [
        {
          "internalType": "bytes32",
          "name": "_messageHash",
          "type": "bytes32"
        }
      ],
      "name": "getEthSignedMessageHash",
      "outputs": [
        {
          "internalType": "bytes32",
          "name": "",
          "type": "bytes32"
        }
      ],
      "stateMutability": "pure",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "_to",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "_amount",
          "type": "uint256"
        },
        {
          "internalType": "string",
          "name": "_message",
          "type": "string"
        },
        {
          "internalType": "uint256",
          "name": "_nonce",
          "type": "uint256"
        }
      ],
      "name": "getMessageHash",
      "outputs": [
        {
          "internalType": "bytes32",
          "name": "",
          "type": "bytes32"
        }
      ],
      "stateMutability": "pure",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "bytes32",
          "name": "_ethSignedMessageHash",
          "type": "bytes32"
        },
        {
          "internalType": "bytes",
          "name": "_signature",
          "type": "bytes"
        }
      ],
      "name": "recoverSigner",
      "outputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "pure",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "bytes",
          "name": "sig",
          "type": "bytes"
        }
      ],
      "name": "splitSignature",
      "outputs": [
        {
          "internalType": "bytes32",
          "name": "r",
          "type": "bytes32"
        },
        {
          "internalType": "bytes32",
          "name": "s",
          "type": "bytes32"
        },
        {
          "internalType": "uint8",
          "name": "v",
          "type": "uint8"
        }
      ],
      "stateMutability": "pure",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "_signer",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "_to",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "_amount",
          "type": "uint256"
        },
        {
          "internalType": "string",
          "name": "_message",
          "type": "string"
        },
        {
          "internalType": "uint256",
          "name": "_nonce",
          "type": "uint256"
        },
        {
          "internalType": "bytes",
          "name": "signature",
          "type": "bytes"
        }
      ],
      "name": "verify",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        }
      ],
      "stateMutability": "pure",
      "type": "function"
    }
  ],
  init: async function () {
    const {transport, app, address} = await initLedger(path);
    if (address !== undefined) {
      ledgerHardwareAddress = address.address;
    }
    console.log("ledgerHardwareAddress:", ledgerHardwareAddress);
    ledgerApp = app;
    console.log("ledgerApp:", ledgerApp);

    this.accounts = [
      tronWeb.address.fromPrivateKey(personalSigConfig.privateKey)
    ]

    $("#contractAddress").text(tronWeb.address.fromHex(this.contractAddress))
    document.getElementById("signer_address").value = this.accounts[0];
    //this.initData();
    this.bindEvents();
  },

  verifyTIP191Sig: function () {
    var that = this;
    var _signer = $("#signer_address").val();
    var _to = $("#to_address").val();
    var _amount = $("#amount").val();
    var _message = $("#message").val();
    var _nonce = $("#nonce").val();
    var _signature = $("#signature").val();
    $("#loading").css({display: 'block'});
    $("#verify_sig").attr('disabled', 'disabled');

    this.triggerContract('verify', [_signer, _to, _amount, _message, _nonce, _signature], function (res)  {
      $("#loading").css({display: 'none'});
      $("#verify_sig").attr('disabled', null);
      $("#result").css({display: 'block'});
      $("#resResult").html(res.toString());
      console.log("verify result:", res);
    });
  },

  getMessageHash: function () {
    var that = this;

    return new Promise((resolve, reject) => {
      var _to = $("#to_address").val();
      var _amount = $("#amount").val();
      var _message = $("#message").val();
      var _nonce = $("#nonce").val();

      $("#loading").show();
      $("#get_message_hash").attr('disabled', true);

      that.triggerContract(
        'getMessageHash',
        [_to, _amount, _message, _nonce],
        function (res) {
          $("#loading").hide();
          $("#get_message_hash").attr('disabled', null);

          const hash = res.toString();
          $("#messageHash").html(hash);
          $("#message").show();

          resolve(hash);   // keypoint
        }
      );
    });
  },

  signWithTronweb: async function () {
    var that = this;
    try {
      // always getMessageHash()
      await that.getMessageHash();

      document.getElementById("signer_address").value = this.accounts[0];
      const messageHash = $("#messageHash").text().toString();
      console.log(messageHash);
      const bytes = tronWeb.utils.code.hexStr2byteArray(messageHash.replace(/^0x/, ""));
      console.log(bytes);
      // show loading + disable button
      $("#loading").css({display: 'block'});
      $("#sign_with_tronweb").prop('disabled', true);

      // await the signature
      const sig = await tronWeb.trx.signMessageV2(bytes);

      // hide loading + enable button
      $("#loading").css({display: 'none'});
      $("#sign_with_tronweb").prop('disabled', false);

      // show result (inspect the sig shape first)
      console.log("signWithTronweb result:", sig);
      // if sig is object, stringify it; if it's a hex string, show directly
      const display = (typeof sig === 'object') ? JSON.stringify(sig, null, 2) : String(sig);
      $("#result").css({display: 'block'});
      $("#resResult").html(display);

      $("#signature").val(sig.toString());

    } catch (err) {
      $("#loading").css({display: 'none'});
      $("#sign_with_tronweb").prop('disabled', false);
      console.error("Sign failed:", err);
      alert("Signing failed: " + (err.message || err));
    }
  },

  signWithLedgerDevice: async function () {
    var that = this;
    try {
      // always getMessageHash()
      await that.getMessageHash();

      document.getElementById("signer_address").value = ledgerHardwareAddress;
      const messageHash = $("#messageHash").text().toString();
      console.log(messageHash);
      const bytes = tronWeb.utils.code.hexStr2byteArray(messageHash.replace(/^0x/, ""));
      console.log(bytes);
      // show loading + disable button
      $("#loading").css({display: 'block'});
      $("#sign_with_tronweb").prop('disabled', true);

      console.log("messageHash:", messageHash);
      console.log("Buffer.from(bytes).toString(\"hex\"):", Buffer.from(bytes).toString("hex"));
      // await the signature
      const ledgerSig = await ledgerApp.signPersonalMessageFullDisplay(path, Buffer.from(bytes).toString("hex"));
      const sig = tweakSignature(ledgerSig);

      // hide loading + enable button
      $("#loading").css({display: 'none'});
      $("#sign_with_tronweb").prop('disabled', false);

      // show result (inspect the sig shape first)
      console.log("signWithLedgerDevice result:", sig);
      // if sig is object, stringify it; if it's a hex string, show directly
      const display = (typeof sig === 'object') ? JSON.stringify(sig, null, 2) : String(sig);
      $("#result").css({display: 'block'});
      $("#resResult").html(display);

      $("#signature").val(sig.toString());

    } catch (err) {
      $("#loading").css({display: 'none'});
      $("#sign_with_tronweb").prop('disabled', false);
      console.error("Sign failed:", err);
      alert("Signing failed: " + (err.message || err));
    }
  },

  getContract: function (address, callback) {
    tronWeb.getContract(address).then(function (res) {
      callback && callback(res);
    });
  },

  triggerContract: async function (methodName, args, callback) {
    console.log(this.contractAddress)
    let myContract = await tronWeb.contract(this.abi, this.contractAddress)

    var callSend = 'send'
    this.abi.forEach(function (val) {
      if (val.name === methodName) {
        callSend = /payable/.test(val.stateMutability) ? 'send' : 'call'
      }
    })

    myContract[methodName](...args)[callSend]({
      feeLimit: this.feeLimit,
      callValue: this.callValue || 0,
    }).then(function (res) {
      console.log(res);
      callback && callback(res);
    })
  },

  initTronWeb: function () {
    /*
     * Replace me...
     */

    return this.initContract();
  },

  initContract: function () {
    /*
     * Replace me...
     */

    return this.bindEvents();
  },

  bindEvents: function () {
    var that = this;
    $(document).on('click', '#verify_sig', function () {
      that.verifyTIP191Sig();
    });

    $(document).on('click', '#get_message_hash', function () {
      that.getMessageHash();
    });

    $(document).on('click', '#sign_with_tronweb', function () {
      that.signWithTronweb();
    });

    $(document).on('click', '#sign_with_ledger', function () {
      that.signWithLedgerDevice();
    });
  },

  markAdopted: function (adopters, account) {
    /*
     * Replace me...
     */
  },

  handleAdopt: function (event) {
    event.preventDefault();

    var petId = parseInt($(event.target).data('id'));

    /*
     * Replace me...
     */
  }
};

$(function () {
  $(window).on("load", function () {
    App.init();
  });
});
