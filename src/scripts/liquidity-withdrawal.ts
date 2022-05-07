import yargs from 'yargs'

import getScriptLyra from './utils/getScriptLyra'

export default async function liquidityWithdrawal(argv: string[]) {
  const { lyra } = getScriptLyra(argv)
  const args = await yargs(argv).options({
    market: { type: 'string', alias: 'm', require: true },
    owner: { type: 'string', alias: 'o', require: true },
  }).argv
  const liquidityWithdrawals = await lyra.liquidityWithdrawals(args.market, args.owner)
  console.log(liquidityWithdrawals)
}