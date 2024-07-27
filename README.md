# Wallet Manager Smart Contract

# Usage

### Install dependencies
```bash
yarn install
```

### Setup environment
- Set PRIVATE_KEY in [.env](.env) file
- Set ALCHEMY_APIKEY in [.env](.env) file

### Test
```bash
yarn test
```

### Deploy contract
```bash
yarn deploy
```

### Deploy test ERC20 token
```bash
yarn deploy:token
```

### Mint test ERC20 token
```bash
yarn mint contract_address to_address amount
```

### Export ABI
```bash
yarn export-abi
```