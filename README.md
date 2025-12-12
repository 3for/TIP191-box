# tip191-box

Verify 'TIP191 personal sign' signature in solidity with Tronbox.

```
git clone https://github.com/3for/TIP191-box
cd TIP191-box
cp sample-env .env
# set correspoding PRIVATE_KEY and TRON_NETWORK in .env file
tronbox compile
npm install
npm run migrate
npm run dev
```

Steps:

1. Run "http://localhost:3000/" in brower.

2. Set "to address", "amount", "message", "nonce"

3. Click "Get Message Hash"

4. Click "Sign with tronWeb"

5. Click "Verify TIP191 signature", the result should be `true`

