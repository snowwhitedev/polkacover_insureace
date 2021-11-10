// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./libs/TransferHelper.sol";
import {IUniswapV2Pair} from "./interfaces/IUniswapV2Pair.sol";
import {IUniswapV2Factory} from "./interfaces/IUniswapV2Factory.sol";
import "./interfaces/IExchangeAgent.sol";

import "hardhat/console.sol";

/**
 * @dev This smart contract is for getting CVR_ETH, CVR_USDT price
 */
contract ExchangeAgent is Ownable, IExchangeAgent, ReentrancyGuard {
    event AddedGateway(address _sender, address _gateway);
    event RemovedGateway(address _sender, address _gateway);
    event SetCurrency(address _sender, address _currency, address _pair);
    event RemovedCurrency(address _sender, address _currency);
    event WithdrawAsset(address _user, address _to, address _token, uint256 _amount);

    mapping(address => bool) public whiteList; // white listed polka gateways
    // available currencies in Polkacover, token => pair
    // for now we allow CVR
    mapping(address => bool) public availableCurrencies;

    address public immutable USDC_ADDRESS;
    address public immutable WETH;
    address public immutable UNISWAP_FACTORY;

    constructor(
        address _USDC_ADDRESS,
        address _WETH,
        address _UNISWAP_FACTORY
    ) {
        USDC_ADDRESS = _USDC_ADDRESS;
        WETH = _WETH;
        UNISWAP_FACTORY = _UNISWAP_FACTORY;
    }

    receive() external payable {}

    modifier onlyWhiteListed(address _gateway) {
        require(whiteList[_gateway], "Only white listed addresses are acceptable");
        _;
    }

    /**
     * @dev Get needed _token0 amount for _desiredAmount of _token1
     */
    function _getNeededTokenAmount(
        address _token0,
        address _token1,
        uint256 _desiredAmount
    ) private view returns (uint256) {
        console.log("SC ===>  UNISWAP_FACTORY", UNISWAP_FACTORY);
        console.log("SC ===> _WETH", WETH);
        console.log("SC ===> token0", _token0);
        console.log("SC ===> token1", _token1);
        address pair = IUniswapV2Factory(UNISWAP_FACTORY).getPair(_token0, _token1);
        require(pair != address(0), "There's no pair");

        address token0 = IUniswapV2Pair(pair).token0();
        (uint256 reserve0, uint256 reserve1, ) = IUniswapV2Pair(pair).getReserves();

        uint256 denominator;
        uint256 numerator;
        if (_token0 == token0) {
            denominator = reserve1;
            numerator = reserve0 * _desiredAmount;
        } else {
            denominator = reserve0;
            numerator = reserve1 * _desiredAmount;
        }

        return numerator / denominator;
    }

    /**
     * @dev Get needed _token0 amount for _desiredAmount of _token1
     */
    function getNeededTokenAmount(
        address _token0,
        address _token1,
        uint256 _desiredAmount
    ) external view override returns (uint256) {
        return _getNeededTokenAmount(_token0, _token1, _desiredAmount);
    }

    function getETHAmountForUSDC(uint256 _desiredAmount) external view override returns (uint256) {
        return _getNeededTokenAmount(WETH, USDC_ADDRESS, _desiredAmount);
    }

    function getTokenAmountForUSDC(address _token, uint256 _desiredAmount) external view override returns (uint256) {
        return _getNeededTokenAmount(_token, USDC_ADDRESS, _desiredAmount);
    }

    function getTokenAmountForETH(address _token, uint256 _desiredAmount) external view override returns (uint256) {
        console.log("_token", _token);
        return _getNeededTokenAmount(_token, WETH, _desiredAmount);
    }

    /**
     * @param _amount: this one is the value with decimals
     */
    function swapTokenWithETH(address _token, uint256 _amount) external override onlyWhiteListed(msg.sender) nonReentrant {
        // store CVR in this exchagne contract
        // send eth to buy gateway based on the uniswap price
        require(availableCurrencies[_token], "Token should be added in available list");
        _swapTokenWithToken(_token, WETH, _amount);
    }

    function swapTokenWithToken(
        address _token0,
        address _token1,
        uint256 _amount
    ) external override onlyWhiteListed(msg.sender) nonReentrant {
        require(availableCurrencies[_token0], "Token should be added in available list");
        _swapTokenWithToken(_token0, _token1, _amount);
    }

    /**
     * @dev exchange _amount of _token0 with _token1
     */
    function _swapTokenWithToken(
        address _token0,
        address _token1,
        uint256 _amount
    ) private {
        address pair = IUniswapV2Factory(UNISWAP_FACTORY).getPair(_token0, _token1);
        require(pair != address(0), "There's no pair");

        address token0 = IUniswapV2Pair(pair).token0();
        (uint256 reserve0, uint256 reserve1, ) = IUniswapV2Pair(pair).getReserves();

        uint256 denominator;
        uint256 numerator;
        if (_token0 == token0) {
            denominator = reserve0;
            numerator = reserve1 * _amount;
        } else {
            denominator = reserve1;
            numerator = reserve0 * _amount;
        }

        uint256 value = numerator / denominator;
        require(value <= address(this).balance, "Insufficient ETH balance");

        TransferHelper.safeTransferFrom(_token0, msg.sender, address(this), _amount);

        if (_token1 == WETH) {
            TransferHelper.safeTransferETH(msg.sender, value);
        } else {
            TransferHelper.safeTransfer(_token1, msg.sender, value);
        }
    }

    function addWhiteList(address _gateway) external onlyOwner {
        require(!whiteList[_gateway], "Already white listed");
        whiteList[_gateway] = true;
    }

    function removeWhiteList(address _gateway) external onlyOwner {
        require(whiteList[_gateway], "Not white listed");
        whiteList[_gateway] = false;
    }

    function addCurrency(address _currency) external onlyOwner {
        require(!availableCurrencies[_currency], "Already available");
        availableCurrencies[_currency] = true;
    }

    function removeCurrency(address _currency) external onlyOwner {
        require(availableCurrencies[_currency], "Not available yet");
        availableCurrencies[_currency] = false;
    }

    function withdrawAsset(
        address _to,
        address _token,
        uint256 _amount
    ) external onlyOwner {
        if (_token == address(0)) {
            TransferHelper.safeTransferETH(_to, _amount);
        } else {
            TransferHelper.safeTransfer(_token, _to, _amount);
        }
        emit WithdrawAsset(owner(), _to, _token, _amount);
    }
}
