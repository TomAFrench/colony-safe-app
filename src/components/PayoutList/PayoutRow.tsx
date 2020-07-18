import React, { useState, useEffect } from "react";
import { formatUnits, BigNumber } from "ethers/utils";
import { TableRow, TableCell } from "@material-ui/core";
import { Zero } from "ethers/constants";
import { ColonyClient } from "@colony/colony-js";
import { ExtendedTokenLocking } from "@colony/colony-js/lib/clients/TokenLockingClient";
import { useToken, useColonyClient, useTokenLockingClient } from "../../contexts/ColonyContext";
import { PayoutInfo } from "../../typings";
import getReputationProof from "../../utils/colony/getReputationProof";

const getClaimableBalance = async (
  payout: PayoutInfo,
  client: ColonyClient,
  lockedBalance: BigNumber,
  userAddress: string,
): Promise<BigNumber> => {
  const { amount, colonyWideReputation, totalTokens, reputationState } = payout;
  const { reputationAmount } = await getReputationProof(client, userAddress, reputationState);

  const gmNumerator = reputationAmount.mul(lockedBalance);
  const gmDenominator = colonyWideReputation.mul(totalTokens);
  return gmNumerator.mul(amount).div(gmDenominator);
};

const getTotalClaimableBalance = async (
  payouts: PayoutInfo[],
  client: ColonyClient,
  tokenLockingClient: ExtendedTokenLocking,
  userAddress: string,
): Promise<BigNumber> => {
  const { balance } = await tokenLockingClient.getUserLock(await client.getToken(), userAddress);

  const claimableBalances = await Promise.all(
    payouts.map(payout => getClaimableBalance(payout, client, balance, userAddress)),
  );
  return claimableBalances.reduce((payoutTotal: BigNumber, claimableBalance: BigNumber) => {
    return payoutTotal.add(claimableBalance);
  }, Zero);
};

const PayoutRow = ({
  payouts,
  userAddress,
  onClick,
}: {
  payouts: PayoutInfo[];
  userAddress: string;
  onClick: () => void;
}) => {
  const colonyClient = useColonyClient();
  const tokenLockingClient = useTokenLockingClient();
  const payoutToken = useToken(payouts[0].tokenAddress);

  const [claimableBalance, setClaimableBalance] = useState<BigNumber>(Zero);

  useEffect(() => {
    if (colonyClient && tokenLockingClient) {
      getTotalClaimableBalance(payouts, colonyClient, tokenLockingClient, userAddress).then(setClaimableBalance);
    }
  }, [colonyClient, payouts, userAddress, tokenLockingClient]);

  if (payouts.length === 0) return null;
  return (
    <TableRow onClick={onClick}>
      <TableCell>{payoutToken?.symbol || payouts[0].tokenAddress}</TableCell>
      <TableCell align="right">{formatUnits(claimableBalance, payoutToken?.decimals)}</TableCell>
    </TableRow>
  );
};

export default PayoutRow;
