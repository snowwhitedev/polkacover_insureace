// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "../libs/TransferHelper.sol";

contract BasePolkaOnChain is Ownable {
    event BuyProduct(uint256 indexed _productId, address _buyer);
    event WithdrawAsset(address _user, address _to, address _token, uint256 _amount);

    using Counters for Counters.Counter;
    Counters.Counter public productIds;
    mapping(address => bool) public availableCurrencies;

    // address public immutable WETH;
    // TODO should it be public?
    address public exchangeAgent;

    constructor(address _CVR, address _exchangeAgent) {
        availableCurrencies[_CVR] = true;
        exchangeAgent = _exchangeAgent;
    }

    modifier onlyAvailableToken(address _token) {
        require(availableCurrencies[_token], "Not allowed token");
        _;
    }

    receive() external payable {}

    function addCurrency(address _currency) external onlyOwner {
        require(!availableCurrencies[_currency], "Already available");
        availableCurrencies[_currency] = true;
    }

    function removeCurrency(address _currency) external onlyOwner {
        require(availableCurrencies[_currency], "Not available yet");
        availableCurrencies[_currency] = false;
    }

    /**
     * @dev For reflect tokens, we should deposit some tokens at contract directly,
     * We will withdraw tokens deposited at contract through this function
     */
    function withdrawAsset(
        address _token,
        address _to,
        uint256 _amount
    ) external onlyOwner {
        TransferHelper.safeTransfer(_token, _to, _amount);
        WithdrawAsset(msg.sender, _to, _token, _amount);
    }
}
