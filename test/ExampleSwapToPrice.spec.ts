import chai, { expect } from 'chai'
import { Contract } from 'ethers'
import { MaxUint256 } from 'ethers/constants'
import { BigNumber, bigNumberify, defaultAbiCoder, formatEther } from 'ethers/utils'
import { solidity, MockProvider, createFixtureLoader, deployContract } from 'ethereum-waffle'

import { expandTo18Decimals } from './shared/utilities'
import { v2Fixture } from './shared/fixtures'

import ExampleSwapToPrice from '../build/ExampleSwapToPrice.json'

chai.use(solidity)

const overrides = {
  gasLimit: 9999999
}

describe('ExampleSwapToPrice', () => {
  const provider = new MockProvider({
    hardfork: 'istanbul',
    mnemonic: 'horn horn horn horn horn horn horn horn horn horn horn horn',
    gasLimit: 9999999
  })
  const [wallet] = provider.getWallets()
  const loadFixture = createFixtureLoader(provider, [wallet])

  let token0: Contract
  let token1: Contract
  let pair: Contract
  let swapToPriceExample: Contract

  beforeEach(async function() {
    const fixture = await loadFixture(v2Fixture)
    token0 = fixture.token0
    token1 = fixture.token1
    pair = fixture.pair
    swapToPriceExample = await deployContract(wallet, ExampleSwapToPrice, [], overrides)
  })

  describe.only('#swapToPrice', () => {
    it('requires non-zero inputs', async () => {
      expect(
        swapToPriceExample.swapToPrice(token0.address, token1.address, 100, 0, 0, wallet.address)
      ).to.be.revertedWith('ExampleSwapToPrice: ZERO_PRICE')
      expect(
        swapToPriceExample.swapToPrice(token0.address, token1.address, 100, 10, 0, wallet.address)
      ).to.be.revertedWith('ExampleSwapToPrice: ZERO_PRICE')
      expect(
        swapToPriceExample.swapToPrice(token0.address, token1.address, 100, 0, 10, wallet.address)
      ).to.be.revertedWith('ExampleSwapToPrice: ZERO_PRICE')
    })
  })
})
