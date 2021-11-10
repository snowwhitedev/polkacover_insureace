const axios = require('axios');

require('dotenv').config();

function getAPIEndPoint(chainId, method) {
  switch (chainId) {
    case 1:
      return `https://api.insurace.io/ops/v1/${method}?code=${process.env.INSURE_ACE_MAINNET_KEY}`;
    case 4:
      return `https://insurace-sl-microservice.azurewebsites.net/${method}?code=${process.env.INSURE_ACE_RINKEBY_KEY}`;
    default:
      return `https://api.insurace.io/ops/v1/${method}?code=${process.env.INSURE_ACE_MAINNET_KEY}`;
  }
}

async function getCoverPremium(chainId, { chain, productIds, coverDays, coverAmounts, coverCurrency, owner, referralCode }) {
  const body = {
    chain,
    productIds,
    coverDays,
    coverAmounts,
    coverCurrency,
    owner,
    referralCode,
  };

  const { data } = await axios.post(getAPIEndPoint(chainId, 'getCoverPremium'), body);

  return {
    premium: data.premiumAmount,
    params: data.params,
  };
}

async function confirmCoverPremium(chainId, { chain, params }) {
  const body = {
    chain,
    params,
  };

  const { data } = await axios.post(getAPIEndPoint(chainId, 'confirmCoverPremium'), body);

  return {
    params: data,
  };
}

module.exports = {
  getAPIEndPoint,
  getCoverPremium,
  confirmCoverPremium,
};
