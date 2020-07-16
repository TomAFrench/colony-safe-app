import React, { useMemo, useState } from "react";

import { TableBody } from "@material-ui/core";
import { ColonyRole } from "@colony/colony-js";

import PayoutRow from "./PayoutRow";
import NewPayoutRow from "./NewPayoutRow";
import Table from "../common/StyledTable";

import { useSafeInfo } from "../../contexts/SafeContext";
import { useActivePayouts, useHasDomainPermission } from "../../contexts/ColonyContext";
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
  const safeInfo = useSafeInfo();
  const activePayouts = useActivePayouts();
  const hasRootPermission = useHasDomainPermission(safeInfo?.safeAddress, 1, ColonyRole.Root);

  const [isOpen, setIsOpen] = useState<boolean>(false);

  const payoutList = useMemo(
    () =>
      Object.entries(groupPayouts(activePayouts)).map(([tokenAddress, payouts]) => (
        <PayoutRow key={tokenAddress} payouts={payouts} />
      )),
    [activePayouts],
  );

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
