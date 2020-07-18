import React, { useState, ChangeEvent, useCallback } from "react";
import { Button, GenericModal, TextField, ModalFooterConfirmation } from "@gnosis.pm/safe-react-components";
import { parseUnits, formatUnits } from "ethers/utils";
import { useAppsSdk, useSafeAddress } from "../../../contexts/SafeContext";
import {
  useColonyClient,
  useNativeTokenAddress,
  useNativeTokenInfo,
  useLockedTokenBalance,
  useNativeTokenBalanceOf,
} from "../../../contexts/ColonyContext";
import depositTxs from "../../../utils/transactions/tokenLocking/deposit";
import getActivePayouts from "../../../utils/colony/getActivePayouts";
import withdrawTxs from "../../../utils/transactions/tokenLocking/withdraw";

const TokenLockingModal = ({ lock, disabled }: { lock?: boolean; disabled?: boolean }) => {
  const safeAddress = useSafeAddress();
  const appsSdk = useAppsSdk();
  const colonyClient = useColonyClient();
  const nativeToken = useNativeTokenAddress() || "";
  const unlockedBalance = useNativeTokenBalanceOf(safeAddress);
  const lockedBalance = useLockedTokenBalance(safeAddress);
  const { decimals } = useNativeTokenInfo() || {};

  const [isOpen, setIsOpen] = useState(false);
  const [amount, setAmount] = useState<string>("");

  const tokenAction = useCallback(
    (lockAmount: string) => {
      if (colonyClient) {
        const lockWei = parseUnits(lockAmount, decimals);
        console.log(`${lock ? "Locking" : "Unlocking"} ${lockAmount} of token ${nativeToken} (${lockWei} wei)`);
        if (lock) {
          depositTxs(colonyClient, nativeToken, lockWei).then(txs => appsSdk.sendTransactions(txs));
        } else {
          withdrawTxs(colonyClient, nativeToken, lockWei).then(txs => appsSdk.sendTransactions(txs));
        }
      }
    },
    [colonyClient, decimals, lock, nativeToken, appsSdk],
  );

  if (colonyClient) getActivePayouts(colonyClient);
  const modalBody = (
    <>
      {`Locked Balance: ${formatUnits(lockedBalance, decimals || 0)}`}
      {`Unlocked Balance: ${formatUnits(unlockedBalance, decimals || 0)}`}
      Amount{" "}
      <TextField
        label="Amount"
        value={amount}
        onChange={(e: ChangeEvent<HTMLInputElement>): void => setAmount(e.target.value)}
      />
    </>
  );

  const modalFooter = (
    <ModalFooterConfirmation
      okText={lock ? "Lock" : "Unlock"}
      // okDisabled={false}
      handleCancel={() => setIsOpen(false)}
      handleOk={() => tokenAction(amount)}
    />
  );
  return (
    <>
      <Button size="md" color="primary" onClick={() => setIsOpen(!isOpen)} disabled={disabled}>
        {lock ? "Lock" : "Unlock"} Tokens
      </Button>
      {isOpen && (
        <GenericModal
          onClose={() => setIsOpen(false)}
          title={lock ? "Lock Tokens" : "Unlock Tokens"}
          body={modalBody}
          footer={modalFooter}
        />
      )}
    </>
  );
};

export default TokenLockingModal;
