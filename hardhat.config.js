const { utils } = require("ethers");

require("@nomiclabs/hardhat-waffle");
require("hardhat-deploy");
require("hardhat-deploy-ethers");
require("@nomiclabs/hardhat-etherscan");
require("hardhat-contract-sizer");
require("hardhat-gas-reporter");
require("dotenv").config();

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

const accounts = {
  mnemonic:
    process.env.MNEMONIC ||
    "test test test test test test test test test test test junk",
  // accountsBalance: "990000000000000000000",
};

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  defaultNetwork: "hardhat",
  gasReporter: {
    coinmarketcap: process.env.COINMARKETCAP_API_KEY,
    currency: "USD",
    enabled: false,
  },
  namedAccounts: {
    deployer: {
      default: 0,
    },
    dev: {
      default: 1,
    },
  },
  networks: {
    // hardhat: {
    //   hardfork: "london",
    //   allowUnlimitedContractSize: true,
    //   settings: {
    //     optimizer: {
    //       enabled: true,
    //       runs: 9999,
    //     },
    //   },
    //   evmVersion: "byzantium",
    //   forking: {
    //     url: "https://eth-rinkeby.alchemyapi.io/v2/8SAQa7xMc0VXTR_hyfPvAt2pe3QrXybB",
    //     enabled: true,
    //     blockNumber: 9525872
    //   },
    //   gasPrice: "auto",
    //   accounts
    // },
    /** Mainnet fork for InsureAce polka */
    hardhat: {
      allowUnlimitedContractSize: true,
      settings: {
        optimizer: {
          enabled: true,
          runs: 9999,
        },
      },
      forking: {
        url: "https://mainnet.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161",
        enabled: true,
        // blockNumber: 13138661, // 12302937,
      },
      gasPrice: "auto"
    },
    /** Kovan fork for NexusMutual  */
    // hardhat: {
    //   gasPrice: "auto",
    // },
    mainnet: {
      url: `https://mainnet.infura.io/v3/${process.env.INFURA_KEY}`,
      accounts,
      chainId: 1,
      live: false,
      saveDeployments: true,
    },
    rinkeby: {
      url: `https://rinkeby.infura.io/v3/${process.env.INFURA_KEY}`,
      accounts,
      chainId: 4,
      live: false,
      saveDeployments: true,
      tags: ["staging"],
      gasPrice: 5000000000,
      gasMultiplier: 2,
    },
    bscTest: {
      url: "https://data-seed-prebsc-1-s1.binance.org:8545",
      chainId: 97,
      accounts: { mnemonic: process.env.MNEMONIC },
      live: true,
      saveDeployments: true,
      gasMultiplier: 2,
    },
    bscMain: {
      url: "https://bsc-dataseed.binance.org/",
      chainId: 56,
      accounts: { mnemonic: process.env.MNEMONIC },
      live: true,
      saveDeployments: true,
    },
  },
  etherscan: {
    apiKey: process.env.BSC_API_KEY, // BSC_API_KEY
  },
  paths: {
    deploy: "deploy",
    deployments: "deployments",
    sources: "contracts",
    tests: "test",
  },
  // contractSizer: {
  //   alphaSort: true,
  //   disambiguatePaths: true,
  //   runOnCompile: true,
  // },
  solidity: {
    version: "0.8.0",
    settings: {
      optimizer: {
        enabled: true,
        runs: 500,
      },
    },
  },
  mocha: {
    timeout: 3000000,
  },
};
