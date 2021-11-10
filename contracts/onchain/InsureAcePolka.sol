// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/math/SafeMathUpgradeable.sol";
import "../interfaces/IExchangeAgent.sol";
import {IInsureAce} from "../interfaces/IInsureAce.sol";
import "./BasePolkaOnChain.sol";

/**
 * We are supporting only CVR for InsureAce
 */
contract InsureAcePolka is BasePolkaOnChain {
    event BuyInsureAce(uint16[] productIds, address _buyer, address _currency, uint256 _amount);

    address public coverContractAddress;
    address public constant WETH = 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE;
    address public immutable CVR;

    constructor(
        address _CVR,
        address _exchangeAgent,
        address _coverContractAddress
    ) BasePolkaOnChain(_CVR, _exchangeAgent) {
        require(_coverContractAddress != address(0), "S:1");
        CVR = _CVR;
        coverContractAddress = _coverContractAddress;
    }

    function setup(address _coverContractAddress) external onlyOwner {
        require(_coverContractAddress != address(0), "S:1");
        coverContractAddress = _coverContractAddress;
    }

    function buyCoverByETH(
        uint16[] memory products,
        uint16[] memory durationInDays,
        uint256[] memory amounts,
        address currency,
        address owner,
        uint256 referralCode,
        uint256 premiumAmount,
        uint256[] memory helperParameters,
        uint256[] memory securityParameters,
        uint8[] memory v,
        bytes32[] memory r,
        bytes32[] memory s
    ) external payable {
        require(currency == WETH, "Not ETH product");
        require(msg.value >= premiumAmount, "Insufficient amount");
        if (msg.value - premiumAmount > 0) {
            TransferHelper.safeTransferETH(msg.sender, msg.value - premiumAmount);
        }

        IInsureAce(coverContractAddress).buyCover{value: premiumAmount}(
            products,
            durationInDays,
            amounts,
            currency,
            owner,
            referralCode,
            premiumAmount,
            helperParameters,
            securityParameters,
            v,
            r,
            s
        );

        emit BuyInsureAce(products, owner, currency, premiumAmount);
    }

    /**
     * @dev Through this function, users can get covers from Insure by some tokens such as CVR...
     * if users want to save gas fee, he shoud reach to this function through MultiSigWallet.
     */
    function buyCoverByToken(
        uint16[] memory products,
        uint16[] memory durationInDays,
        uint256[] memory amounts,
        address currency,
        address owner,
        uint256 referralCode,
        uint256 premiumAmount,
        uint256[] memory helperParameters,
        uint256[] memory securityParameters,
        uint8[] memory v,
        bytes32[] memory r,
        bytes32[] memory s
    ) external payable {
        uint256 amount;
        if (currency == WETH) {
            amount = IExchangeAgent(exchangeAgent).getTokenAmountForETH(CVR, premiumAmount);
        } else {
            amount = IExchangeAgent(exchangeAgent).getNeededTokenAmount(CVR, currency, premiumAmount);
        }

        TransferHelper.safeTransferFrom(CVR, msg.sender, address(this), amount);
        TransferHelper.safeApprove(CVR, exchangeAgent, amount);

        if (currency == WETH) {
            IExchangeAgent(exchangeAgent).swapTokenWithETH(CVR, amount);
        } else {
            IExchangeAgent(exchangeAgent).swapTokenWithToken(CVR, currency, amount);
            TransferHelper.safeApprove(currency, coverContractAddress, premiumAmount);
        }

        IInsureAce(coverContractAddress).buyCover{value: premiumAmount}(
            products,
            durationInDays,
            amounts,
            currency,
            owner,
            referralCode,
            premiumAmount,
            helperParameters,
            securityParameters,
            v,
            r,
            s
        );

        emit BuyInsureAce(products, owner, currency, premiumAmount);
    }
}
