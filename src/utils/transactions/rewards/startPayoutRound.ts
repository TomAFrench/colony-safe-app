import { ColonyClient } from "@colony/colony-js";
import { Interface } from "ethers/utils";
import { AddressZero } from "ethers/constants";
import { Transaction } from "../../../typings";
import getReputationProof from "../../colony/getReputationProof";

const startPayoutRoundTxs = async (colonyClient: ColonyClient, token: string): Promise<Transaction[]> => {
  const colonyInterface: Interface = colonyClient.interface;
  const { key, value, branchMask, siblings } = await getReputationProof(colonyClient, AddressZero);
  const txs: Transaction[] = [];

  txs.push({
    data: colonyInterface.functions.startNextRewardPayout.encode([token, key, value, branchMask, siblings]),
    to: colonyClient.address,
    value: 0,
  });

  return txs;
};

export default startPayoutRoundTxs;
