import { BigNumber } from '@ethersproject/bignumber'

import { DepositProcessedEvent, DepositQueuedEvent } from '../contracts/typechain/LiquidityPool'
import Lyra from '../lyra'
import { Market } from '../market'
import fetchLiquidityDepositEventDataByID from '../utils/fetchLiquidityDepositEventDataByID'
import fetchLiquidityDepositEventDataByOwner from '../utils/fetchLiquidityDepositEventDataByOwner'

export class LiquidityDeposit {
  lyra: Lyra
  __queued?: DepositQueuedEvent
  __processed?: DepositProcessedEvent
  __market: Market
  queueId?: number
  beneficiary: string
  amount: BigNumber
  tokenPriceAtDeposit?: BigNumber
  tokenValueAtDeposit?: BigNumber
  isPending: boolean
  depositRequestedTimestamp: number
  depositTimestamp: number

  constructor(
    lyra: Lyra,
    market: Market,
    data: {
      queued?: DepositQueuedEvent
      processed?: DepositProcessedEvent
    }
  ) {
    // Data
    this.lyra = lyra
    this.__market = market
    this.__queued = data.queued
    this.__processed = data.processed

    // Fields
    const queued = data.queued
    const processed = data.processed
    const queuedOrProcessed = queued ?? processed
    if (!queuedOrProcessed) {
      throw new Error('No queued or processed event for LiquidityDeposit')
    }
    this.queueId = queuedOrProcessed.args.depositQueueId.toNumber()
    this.beneficiary = queuedOrProcessed.args.beneficiary
    this.amount = queuedOrProcessed.args.amountDeposited
    this.tokenPriceAtDeposit = processed?.args.tokenPrice
    this.tokenValueAtDeposit = processed?.args.tokenPrice.mul(processed?.args.amountDeposited)
    this.isPending = !!(queued && processed)
    this.depositRequestedTimestamp = queuedOrProcessed.args.timestamp.toNumber()
    this.depositTimestamp = processed
      ? processed.args.timestamp.toNumber()
      : queued
      ? queued.args.timestamp.add(market.__marketData.marketParameters.lpParams.depositDelay).toNumber()
      : // Should never happen
        0
  }

  // Getters

  static async getByOwner(lyra: Lyra, marketAddress: string, owner: string): Promise<LiquidityDeposit[]> {
    const market = await Market.get(lyra, marketAddress)
    const { events } = await fetchLiquidityDepositEventDataByOwner(lyra, market, owner)
    const liquidityDeposits: LiquidityDeposit[] = events.map(event => new LiquidityDeposit(lyra, market, event))
    return liquidityDeposits
  }

  static async getByQueueId(lyra: Lyra, marketAddress: string, id: string): Promise<LiquidityDeposit> {
    const market = await Market.get(lyra, marketAddress)
    const event = await fetchLiquidityDepositEventDataByID(lyra, market, id)
    return new LiquidityDeposit(lyra, market, event)
  }

  // Edges

  market(): Market {
    return this.__market
  }
}