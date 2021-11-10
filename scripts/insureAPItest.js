const axios = require('axios');
const { Contract, providers, utils, Wallet } = require('ethers');

// -------------------------------------------------------------------------------------------------
// Configuration
// -------------------------------------------------------------------------------------------------

// The JSON RPC URL that connects to an Ethereum node.
const jsonRpcUrl = '';

// The private key of a wallet that is used to purchase this cover.
const privateKey = '';

// The address of InsurAce Cover contract. Please contact InsurAce team to get the contract address. Different chains have different addresses.
const contractAddress = '';

// The URL of InsurAce API.
const httpApiUrl = 'https://api.insurace.io/ops/v1';

// The code that allows consumers to access InsurAce API.
const httpApiCode = 'BIJtkcwZVbqksdkGQphamIi6yXfUpd2cwIxeDs6jmT4uXYaWJwONIA==';

// The blockchain that the cover purchase transaction is sent to. Valid values are ETH, BSC, POLYGON.
const chain = 'ETH';

// The product IDs for this cover purchase. Can be more than 1 product IDs. Please check https://docs.insurace.io/landing-page/documentation/protocol-design/product-design/product-list for a complete list of products.
const productIds = [4, 58];

// The cover period (in days) for each product.
const coverDays = [30, 60];

// The cover amount for each product.
const coverAmounts = ['500000000000000000', '800000000000000000'];

// The address of the token used to purchase this cover. Please check https://api.insurace.io/docs for a list of tokens that can be used to purchase covers.
const coverCurrency = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';

// The referral code used in this cover purchase, may be null.
const referralCode = null;

// -------------------------------------------------------------------------------------------------
// Functions
// -------------------------------------------------------------------------------------------------

// Visit https://api.insurace.io/docs for detailed API documentation.
async function getCoverPremium({ chain, productIds, coverDays, coverAmounts, coverCurrency, owner, referralCode }) {
  const body = {
    chain,
    productIds,
    coverDays,
    coverAmounts,
    coverCurrency,
    owner,
    referralCode,
  };

  const options = {
    params: {
      code: httpApiCode,
    },
  };

  const { data } = await axios.post(httpApiUrl + '/getCoverPremium', body, options);
  console.log('getCoverPremium axios');

  return {
    premium: data.premiumAmount,
    params: data.params,
  };
}

// Visit https://api.insurace.io/docs for detailed API documentation.
async function confirmCoverPremium({ chain, params }) {
  const body = {
    chain,
    params,
  };

  const options = {
    params: {
      code: httpApiCode,
    },
  };

  const { data } = await axios.post(httpApiUrl + '/confirmCoverPremium', body, options);

  return {
    params: data,
  };
}

async function buyCover(wallet, params) {
  const contractAbi = [
    'function buyCover(uint16[] products, uint16[] durationInDays, uint256[] amounts, address currency, address owner, uint256 referralCode, uint256 premiumAmount, uint256[] helperParameters, uint256[] securityParameters, uint8[] v, bytes32[] r, bytes32[] s) payable',
  ];

  const contract = new Contract(contractAddress, contractAbi, wallet);

  const response = await contract.buyCover(
    params[0],
    params[1],
    params[2],
    params[3],
    params[4],
    params[5],
    params[6],
    params[7],
    params[8],
    params[9],
    params[10],
    params[11]
  );

  const receipt = await response.wait();

  return receipt;
}

async function main() {
  // const provider = new providers.JsonRpcProvider(jsonRpcUrl);
  // const wallet = new Wallet(privateKey, provider);

  console.log('1. Get premium');

  const premiumInfo = await getCoverPremium({
    // owner: wallet.address,
    owner: '0x6C641CE6A7216F12d28692f9d8b2BDcdE812eD2b',
    chain,
    productIds,
    coverDays,
    coverAmounts,
    coverCurrency,
    referralCode,
  });

  console.log(`premiumInfo ${JSON.stringify(premiumInfo)}`);
  console.log(`premiumInfo raw data ${premiumInfo.premium.toString()}`);
  console.log(`Premium = ${utils.formatEther(premiumInfo.premium)}`);

  console.log('2. Confirm premium');

  const confirmInfo = await confirmCoverPremium({
    chain,
    params: premiumInfo.params,
  });

  // console.log(`confirmInfo ${confirmInfo}`);

  // console.log('3. Purchase cover');

  // const receipt = await buyCover(wallet, confirmInfo.params);

  // console.log('Cover purchase successful.');
  // console.log(`Transaction hash: ${receipt.transactionHash}`);
}

main();
