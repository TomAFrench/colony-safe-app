import React, { ReactElement, useState, useCallback } from "react";
import { ModalFooterConfirmation, GenericModal } from "@gnosis.pm/safe-react-components";
import { Box, Tab, Tabs } from "@material-ui/core";
import { ColonyRole, getMoveFundsPermissionProofs } from "@colony/colony-js";
import { parseUnits } from "ethers/utils";
import { Token, PermissionProof, Domain } from "../../../typings";
import SendTokensBody from "./SendTokensBody";
import MoveTokensBody from "./MoveTokensBody";
import { useColonyClient, usePermissionProof, useColonyExtendedDomains } from "../../../contexts/ColonyContext";
import { useSafeAddress, useAppsSdk } from "../../../contexts/SafeContext";
import moveTokenTxs from "../../../utils/transactions/moveTokens";
import makePaymentTxs from "../../../utils/transactions/makePayment";

function TabPanel(props: any) {
  const { children, value, index, ...other } = props;

  return (
    // eslint-disable-next-line react/jsx-props-no-spreading
    <div hidden={value !== index} {...other}>
      {value === index && <Box p={3}>{children}</Box>}
    </div>
  );
}

const TokenModal = ({
  isOpen,
  setIsOpen,
  token,
  domain,
  adminPermissionProof,
  fundingPermissionProof,
}: {
  isOpen: boolean;
  setIsOpen: Function;
  token: Token;
  domain: Domain;
  adminPermissionProof?: PermissionProof;
  fundingPermissionProof?: PermissionProof;
}): ReactElement | null => {
  const safeAddress = useSafeAddress();
  const appSdk = useAppsSdk();
  const client = useColonyClient();
  const domains = useColonyExtendedDomains();
  const paymentClientProof = usePermissionProof(
    domain.domainId,
    ColonyRole.Funding,
    client?.oneTxPaymentClient.address || "",
  );

  /** State Variables **/
  const [currentTab, setCurrentTab] = useState<number>(0);
  const [toDomain, setToDomain] = useState<Domain>(domains[0]);
  const [recipient, setRecipient] = useState<string>("");
  const [amount, setAmount] = useState<string>("");

  const handleChangeAddress = (event: any) => setRecipient(event.target.value);
  const handleChangeAmount = (event: any) => setAmount(event.target.value);
  const handleChangeDomain = (id: number) =>
    setToDomain(domains.find(testDomain => testDomain.domainId.toNumber() === id) as Domain);
  const handleChangeTab = (_event: any, newValue: number) => setCurrentTab(newValue);

  const moveTokensToPot = useCallback(async () => {
    if (client && safeAddress) {
      const fromPotId = domain.fundingPotId;
      const toPotId = toDomain.fundingPotId;

      const [fromPermissionDomainId, fromChildSkillIndex, toChildSkillIndex] = await getMoveFundsPermissionProofs(
        client,
        fromPotId,
        toPotId,
        safeAddress,
      );

      const txs = moveTokenTxs(
        client,
        fromPermissionDomainId,
        fromChildSkillIndex,
        toChildSkillIndex,
        token.address,
        parseUnits(amount, token.decimals),
        fromPotId,
        toPotId,
      );
      appSdk.sendTransactions(txs);
    }
  }, [amount, appSdk, client, domain.fundingPotId, safeAddress, toDomain.fundingPotId, token.address, token.decimals]);

  const sendTokens = useCallback(() => {
    if (client && adminPermissionProof && paymentClientProof) {
      const { domainId, skillId } = domain;
      // The Safe must have both Funding and Administration permissions to make a payment like this
      // however they must be on the same domain so a proof for either one is valid for both.
      // Similarly for the oneTxPaymentClient contract
      const [callerPermissionDomainId, callerChildSkillIndex] = adminPermissionProof;
      const [permissionDomainId, childSkillIndex] = paymentClientProof;

      const txs = makePaymentTxs(
        client,
        permissionDomainId,
        childSkillIndex,
        callerPermissionDomainId,
        callerChildSkillIndex,
        recipient,
        token.address,
        parseUnits(amount, token.decimals),
        domainId,
        skillId,
      );
      appSdk.sendTransactions(txs);
    }
  }, [
    adminPermissionProof,
    amount,
    appSdk,
    client,
    domain,
    paymentClientProof,
    recipient,
    token.address,
    token.decimals,
  ]);

  const modalTitle = `${token.symbol}`;

  const modalBody = (
    <>
      <Tabs variant="fullWidth" value={currentTab} onChange={handleChangeTab}>
        <Tab label="Move" />
        <Tab label="Send" />
      </Tabs>

      <TabPanel value={currentTab} index={0}>
        <MoveTokensBody
          amount={amount}
          handleChangeAmount={handleChangeAmount}
          targetDomain={toDomain}
          handleChangeDomain={handleChangeDomain}
          token={token}
          domains={domains}
          fundingPermissionProof={fundingPermissionProof}
        />
      </TabPanel>
      <TabPanel value={currentTab} index={1}>
        <SendTokensBody
          amount={amount}
          handleChangeAmount={handleChangeAmount}
          address={recipient}
          handleChangeAddress={handleChangeAddress}
          token={token}
          adminPermissionProof={adminPermissionProof}
        />
      </TabPanel>
    </>
  );

  const modalFooter = (
    <ModalFooterConfirmation
      okText="Save"
      // okDisabled={false}
      handleCancel={() => setIsOpen(false)}
      handleOk={async () => {
        if (currentTab === 1) {
          sendTokens();
        } else {
          await moveTokensToPot();
        }
        setIsOpen(false);
      }}
    />
  );

  if (!isOpen) return null;
  return <GenericModal onClose={() => setIsOpen(false)} title={modalTitle} body={modalBody} footer={modalFooter} />;
};

export default TokenModal;
