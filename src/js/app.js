var contractAddress
let tronWeb

try {
  contractAddress = personalSigConfig.contractAddress
  console.log(personalSigConfig.privateKey);
  tronWeb = new TronWeb.TronWeb({
    fullHost: personalSigConfig.fullHost,
    privateKey: personalSigConfig.privateKey
  })
} catch (err) {
  alert('The app looks not configured. Please run `npm run migrate`')
}


App = {
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
    console.log("ZYD 111");
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
    var _to = $("#to_address").val();
    var _amount = $("#amount").val();
    var _message = $("#message").val();
    var _nonce = $("#nonce").val();
    $("#loading").css({display: 'block'});
    $("#get_message_hash").attr('disabled', 'disabled');
    console.log("ZYD 111");
    this.triggerContract('getMessageHash', [_to, _amount, _message, _nonce], function (res)  {
      $("#loading").css({display: 'none'});
      $("#get_message_hash").attr('disabled', null);
      $("#messageHash").html(res.toString());
      $("#message").show();
      console.log("getMessageHash result:", res);
    });
  },

  signWithTronweb: async function () {
    var that = this;
    try {
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


  getContract: function (address, callback) {
    tronWeb.getContract(address).then(function (res) {
      callback && callback(res);
    });
  },

  triggerContract: async function (methodName, args, callback) {
    let myContract = await tronWeb.contract().at(this.contractAddress)

    var callSend = 'send'
    this.abi.forEach(function (val) {
      if (val.name === methodName) {
        callSend = /payable/.test(val.stateMutability) ? 'send' : 'call'
      }
    })
    console.log("ZYD 222");

    myContract[methodName](...args)[callSend]({
      feeLimit: this.feeLimit,
      callValue: this.callValue || 0,
    }).then(function (res) {
      console.log("ZYD 333");
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
  $(window).load(function () {
    App.init();
  });
});
