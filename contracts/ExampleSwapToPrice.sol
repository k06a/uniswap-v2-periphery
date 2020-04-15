pragma solidity =0.5.16;

import '@uniswap/v2-core/contracts/interfaces/IUniswapV2Pair.sol';

import './UniswapV2Library.sol';
import './interfaces/IERC20.sol';
import './interfaces/IUniswapV2Router01.sol';
import './libraries/SafeMath.sol';

contract ExampleSwapToPrice is UniswapV2Library {
    using SafeMath for uint256;

    // router address is identical across mainnet and testnets but differs between testing and deployed environments
    IUniswapV2Router01 public constant router = IUniswapV2Router01(0x84e924C5E04438D2c1Df1A981f7E7104952e6de1);

    // babylonian method (https://en.wikipedia.org/wiki/Methods_of_computing_square_roots#Babylonian_method)
    function sqrt(uint256 y) private pure returns (uint256 z) {
        if (y > 3) {
            z = y;
            uint256 x = y / 2 + 1;
            while (x < z) {
                z = x;
                x = (y / x + x) / 2;
            }
        } else if (y != 0) {
            z = 1;
        }
    }

    // swaps a given token in an amount to move the price to the profit-maximizing price, given the external true price
    // truePrice is expressed in the ratio of token in to token out
    function swapToPrice(
        address tokenIn,
        address tokenOut,
        uint256 maxTokenIn,
        uint128 truePriceTokenIn,
        uint128 truePriceTokenOut,
        address to
    ) public {
        require(truePriceTokenIn != 0 && truePriceTokenOut != 0, "ExampleSwapToPrice: ZERO_PRICE");

        (uint256 reserveIn, uint256 reserveOut) = getReserves(tokenIn, tokenOut);

        uint256 invariant = reserveIn.mul(reserveOut);

        uint256 leftSide = sqrt(invariant.mul(truePriceTokenIn).mul(1000) / uint256(truePriceTokenOut).mul(997));
        uint256 rightSide = reserveIn.mul(1000) / 997;

        // compute the amount that must be sent to move the price to the profit-maximizing price
        uint256 amountIn = leftSide.sub(rightSide);

        // may be desirable to arbitrage while spending only a certain amount of the input token
        if (amountIn > maxTokenIn) {
            amountIn = maxTokenIn;
        }

        address[] memory path = new address[](2);
        path[0] = tokenIn;
        path[1] = tokenOut;

        router.swapTokensForExactTokens(
            amountIn,
            getAmountOut(amountIn, reserveIn, reserveOut),
            path,
            to,
            block.timestamp
        );
    }
}
