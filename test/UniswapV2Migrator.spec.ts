import chai, { expect } from 'chai'
import { Contract } from 'ethers'
import { AddressZero, MaxUint256 } from 'ethers/constants'
import { bigNumberify } from 'ethers/utils'
import { solidity, MockProvider, createFixtureLoader } from 'ethereum-waffle'

import { v2Fixture } from './shared/fixtures'
import { expandTo18Decimals } from './shared/utilities'

chai.use(solidity)

const MINIMUM_LIQUIDITY = bigNumberify(10).pow(3)

const overrides = {
  gasLimit: 9999999
}

describe('UniswapV2Migrator', () => {
  const provider = new MockProvider({
    hardfork: 'istanbul',
    mnemonic: 'horn horn horn horn horn horn horn horn horn horn horn horn',
    gasLimit: 9999999
  })
  const [wallet] = provider.getWallets()
  const loadFixture = createFixtureLoader(provider, [wallet])

  let WETHPartner: Contract
  let WETHPair: Contract
  let router: Contract
  let migrator: Contract
  let WETHExchangeV1: Contract
  beforeEach(async function() {
    const fixture = await loadFixture(v2Fixture)
    WETHPartner = fixture.WETHPartner
    WETHPair = fixture.WETHPair
    router = fixture.router
    migrator = fixture.migrator
    WETHExchangeV1 = fixture.WETHExchangeV1
  })

  it('router', async () => {
    expect(await migrator.router()).to.eq(router.address)
  })

  it('migrate', async () => {
    const WETHPartnerAmount = expandTo18Decimals(1)
    const ETHAmount = expandTo18Decimals(4)
    await WETHPartner.approve(WETHExchangeV1.address, MaxUint256)
    await WETHExchangeV1.addLiquidity(bigNumberify(1), WETHPartnerAmount, MaxUint256, {
      ...overrides,
      value: ETHAmount
    })
    await WETHExchangeV1.approve(migrator.address, MaxUint256)
    const expectedLiquidity = expandTo18Decimals(2)
    const WETHPairToken0 = await WETHPair.token0()
    await expect(
      migrator.migrate(WETHPartner.address, WETHPartnerAmount, ETHAmount, wallet.address, MaxUint256, overrides)
    )
      .to.emit(WETHPair, 'Transfer')
      .withArgs(AddressZero, AddressZero, MINIMUM_LIQUIDITY)
      .to.emit(WETHPair, 'Transfer')
      .withArgs(AddressZero, wallet.address, expectedLiquidity.sub(MINIMUM_LIQUIDITY))
      .to.emit(WETHPair, 'Sync')
      .withArgs(
        WETHPairToken0 === WETHPartner.address ? WETHPartnerAmount : ETHAmount,
        WETHPairToken0 === WETHPartner.address ? ETHAmount : WETHPartnerAmount
      )
      .to.emit(WETHPair, 'Mint')
      .withArgs(
        router.address,
        WETHPairToken0 === WETHPartner.address ? WETHPartnerAmount : ETHAmount,
        WETHPairToken0 === WETHPartner.address ? ETHAmount : WETHPartnerAmount
      )
    expect(await WETHPair.balanceOf(wallet.address)).to.eq(expectedLiquidity.sub(MINIMUM_LIQUIDITY))
  })
})
