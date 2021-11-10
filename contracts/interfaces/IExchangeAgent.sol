// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.0;

interface IExchangeAgent {
    function getNeededTokenAmount(
        address _token0,
        address _token1,
        uint256 _desiredAmount
    ) external returns (uint256);

    function getTokenAmountForUSDC(address _token, uint256 _desiredAmount) external returns (uint256);

    function getETHAmountForUSDC(uint256 _desiredAmount) external view returns (uint256);

    function getTokenAmountForETH(address _token, uint256 _desiredAmount) external returns (uint256);

    function swapTokenWithETH(address _token, uint256 _amount) external;

    function swapTokenWithToken(
        address _token0,
        address _token1,
        uint256 _amount
    ) external;
}
