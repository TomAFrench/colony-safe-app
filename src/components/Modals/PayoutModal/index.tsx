import React, { ReactElement, useCallback, useState } from "react";
import { GenericModal } from "@gnosis.pm/safe-react-components";
import ModalFooter from "./ModalFooter";
import { PayoutInfo } from "../../../typings";
import { useAppsSdk, useSafeAddress } from "../../../contexts/SafeContext";
import { useColonyClient } from "../../../contexts/ColonyContext";
import claimPayoutTxs from "../../../utils/transactions/rewards/claimPayout";
import waivePayoutTxs from "../../../utils/transactions/rewards/waivePayout";
import ModalBody from "./ModalBody";

const PayoutModal = ({
  isOpen,
  setIsOpen,
  payouts,
}: {
  isOpen: boolean;
  setIsOpen: Function;
  payouts: PayoutInfo[];
}): ReactElement | null => {
  const safeAddress = useSafeAddress();
  const appsSdk = useAppsSdk();
  const colonyClient = useColonyClient();
  const [claimPayoutArray, setClaimPayoutArray] = useState<boolean[]>(Array(payouts.length).fill(true));

  const handleClaimToggle = (payoutIndex: number, checked: boolean) => {
    setClaimPayoutArray(claimPayoutArray.map((current, index) => (payoutIndex === index ? checked : current)));
  };

  const claimOrWaivePayouts = useCallback(async () => {
    if (colonyClient && safeAddress) {
      const txs = await Promise.all(
        payouts.map((payout, index) =>
          claimPayoutArray[index]
            ? claimPayoutTxs(colonyClient, safeAddress, payout)
            : waivePayoutTxs(colonyClient, safeAddress, 1),
        ),
      );
      appsSdk.sendTransactions(txs);
    }
  }, [colonyClient, safeAddress, payouts, appsSdk, claimPayoutArray]);

  if (!isOpen) return null;
  return (
    <GenericModal
      onClose={() => setIsOpen(false)}
      title="Claim Payouts"
      body={<ModalBody payouts={payouts} claimPayoutArray={claimPayoutArray} onClaimToggle={handleClaimToggle} />}
      footer={
        <ModalFooter
          cancelText="Cancel"
          okText="Claim"
          handleCancel={() => setIsOpen(false)}
          handleOk={() => claimOrWaivePayouts()}
        />
      }
    />
  );
};

export default PayoutModal;
