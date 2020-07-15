import { ColonyClient } from "@colony/colony-js";
import { Transaction } from "../../../typings";

const waivePayoutTxs = async (
  colonyClient: ColonyClient,
  userAddress: string,
  payoutsWaived: number,
): Promise<Transaction[]> => {
  const tokenLockingClient = await colonyClient.networkClient.getTokenLockingClient();
  const nativeTokenAddress = await colonyClient.getToken();
  const { lockCount } = await tokenLockingClient.getUserLock(nativeTokenAddress, userAddress);

  const txs: Transaction[] = [];

  txs.push({
    data: tokenLockingClient.interface.functions.incrementLockCounterTo.encode([
      nativeTokenAddress,
      lockCount.add(payoutsWaived),
    ]),
    to: tokenLockingClient.address,
    value: 0,
  });

  return txs;
};

export default waivePayoutTxs;
