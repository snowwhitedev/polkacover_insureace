const { ethers } = require('hardhat');
const { BigNumber } = ethers;

const UniswapV2Router = require('../abis/UniswapV2Router.json');
const UniswapV2Factory = require('../abis/UniswapV2Factory.json');
const ERC20 = require('../abis/ERC20.json');

function getCreate2CohortAddress(actuaryAddress, { cohortName, sender, nonce }, bytecode) {
  const create2Inputs = [
    '0xff',
    actuaryAddress,
    ethers.utils.keccak256(ethers.utils.solidityPack(['address', 'string', 'uint'], [sender, cohortName, nonce])),
    ethers.utils.keccak256(bytecode),
  ];
  const sanitizedInputs = `0x${create2Inputs.map((i) => i.slice(2)).join('')}`;

  return ethers.utils.getAddress(`0x${ethers.utils.keccak256(sanitizedInputs).slice(-40)}`);
}

// Defaults to e18 using amount * 10^18
function getBigNumber(amount, decimals = 18) {
  return BigNumber.from(amount).mul(BigNumber.from(10).pow(decimals));
}

function getPaddedHexStrFromBN(bn) {
  const hexStr = ethers.utils.hexlify(bn);
  return ethers.utils.hexZeroPad(hexStr, 32);
}

function getHexStrFromStr(str) {
  const strBytes = ethers.utils.toUtf8Bytes(str);
  return ethers.utils.hexlify(strBytes);
}

async function advanceBlock() {
  return ethers.provider.send('evm_mine', []);
}

async function advanceBlockTo(blockNumber) {
  for (let i = await ethers.provider.getBlockNumber(); i < blockNumber; i++) {
    console.log(`mining block ${i}...`);
    await advanceBlock();
    console.log(`mined block ${i}`);
  }
}

function getContract(address, abi) {
  return new ethers.Contract(address, abi, ethers.provider);
}

async function createPair(router, factory, token0, token1, amount0, amount1, to, signer) {
  const deadline = new Date().getTime();
  const routerContract = getContract(router, JSON.stringify(UniswapV2Router));
  const factoryContract = getContract(factory, JSON.stringify(UniswapV2Factory));
  const token0Contract = getContract(token0, JSON.stringify(ERC20));
  const token1Contract = getContract(token1, JSON.stringify(ERC20));

  console.log('Approving router to consume tokens...');
  await (await token0Contract.connect(signer).approve(router, getBigNumber(10000000000), { from: signer.address })).wait();
  await (await token1Contract.connect(signer).approve(router, getBigNumber(10000000000), { from: signer.address })).wait();
  console.log('Approved.');

  console.log('Adding liquidity...');
  await (
    await routerContract.connect(signer).addLiquidity(token0, token1, amount0, amount1, amount0, amount1, to, deadline, { from: signer.address })
  ).wait();

  const pair = await factoryContract.getPair(token0, token1);

  return pair;
}

async function createPairETH(router, factory, token0, amountToken, amountETH, to, signer) {
  console.log('router', router);
  console.log('factory', factory);
  const deadline = new Date().getTime();
  const routerContract = getContract(router, JSON.stringify(UniswapV2Router));
  const factoryContract = getContract(factory, JSON.stringify(UniswapV2Factory));
  const token0Contract = getContract(token0, JSON.stringify(ERC20));

  console.log('Approving router to consume tokens...');
  await (await token0Contract.connect(signer).approve(router, getBigNumber(10000000000), { from: signer.address })).wait();
  console.log('Approved.');

  console.log('Adding liquidity...');
  await (
    await routerContract.connect(signer).addLiquidityETH(token0, amountToken, amountToken, amountETH, to, deadline, {
      value: amountETH,
    })
  ).wait();

  const WETH = await routerContract.WETH();
  console.log('WETH in Router', WETH);

  const pair = await factoryContract.getPair(token0, WETH);

  return pair;
}

module.exports = {
  getCreate2CohortAddress,
  getBigNumber,
  getPaddedHexStrFromBN,
  getHexStrFromStr,
  advanceBlock,
  advanceBlockTo,
  createPair,
  createPairETH,
};
