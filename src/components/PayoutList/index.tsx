import React, { useMemo, useState } from "react";

import { TableBody } from "@material-ui/core";
import { ColonyRole } from "@colony/colony-js";

import PayoutRow from "./PayoutRow";
import NewPayoutRow from "./NewPayoutRow";
import Table from "../common/StyledTable";

import { useSafeAddress } from "../../contexts/SafeContext";
import { useClaimablePayouts, useHasDomainPermission } from "../../contexts/ColonyContext";
import { PayoutInfo } from "../../typings";
import PayoutModal from "../Modals/PayoutModal";

type GroupedPayouts = { [tokenAddress: string]: PayoutInfo[] };

const groupPayouts = (payouts: PayoutInfo[]): GroupedPayouts => {
  return payouts.reduce((accumulator: GroupedPayouts, payout: PayoutInfo) => {
    accumulator[payout.tokenAddress] = accumulator[payout.tokenAddress] || [];
    accumulator[payout.tokenAddress].push(payout);
    return accumulator;
  }, {});
};

const PayoutList = () => {
  const safeAddress = useSafeAddress();
  const activePayouts = useClaimablePayouts(safeAddress);
  const hasRootPermission = useHasDomainPermission(safeAddress, 1, ColonyRole.Root);

  const [isOpen, setIsOpen] = useState<boolean>(false);

  const payoutList = useMemo(() => {
    if (!safeAddress) return [];
    return Object.entries(groupPayouts(activePayouts)).map(([tokenAddress, payouts]) => (
      <PayoutRow key={tokenAddress} userAddress={safeAddress} payouts={payouts} />
    ));
  }, [activePayouts, safeAddress]);

  return (
    <Table>
      {activePayouts.length > 0 && <PayoutModal isOpen={isOpen} setIsOpen={setIsOpen} payouts={activePayouts} />}
      <TableBody onClick={() => setIsOpen(true)}>
        {hasRootPermission && <NewPayoutRow />}
        {payoutList}
      </TableBody>
    </Table>
  );
};

export default PayoutList;
