import React, { ReactElement, ChangeEvent } from "react";
import { Text, Checkbox } from "@gnosis.pm/safe-react-components";
import { formatUnits } from "ethers/utils";
import styled from "styled-components";
import { PayoutInfo, Token } from "../../../typings";
import { useTokens } from "../../../contexts/ColonyContext";

const BodyHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 2px solid ${({ theme }) => theme.colors.separator};
  padding: 0 10px;
`;

const StyledItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0px 24px;
  height: 51px;
  border-bottom: 2px solid ${({ theme }) => theme.colors.separator};
  :last-child {
    border-bottom: 0px;
  }
`;

const StyledImageName = styled.div`
  display: flex;
  align-items: center;
`;

const TextDesc = styled(Text)`
  width: 350px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const ModalBody = ({
  payouts,
  claimPayoutArray,
  onClaimToggle,
}: {
  payouts: PayoutInfo[];
  claimPayoutArray: boolean[];
  onClaimToggle: (payoutIndex: number, checked: boolean) => any;
}): ReactElement => {
  const tokens = useTokens();

  return (
    <>
      <BodyHeader>
        <Text size="md">
          Payouts must be claimed or waived in order. Please select the payouts which you would like to claim. Any
          unclaimed payouts will be waived and will be returned to the Colony.
        </Text>
      </BodyHeader>
      {payouts.map((payout, index) => {
        const payoutToken = tokens.find(({ address }) => address === payout.tokenAddress) as Token;

        const onChange = (event: ChangeEvent<HTMLInputElement>, checked: boolean) => onClaimToggle(index, checked);

        return (
          <StyledItem key={payout.id.toString()}>
            <StyledImageName>
              <div>
                <div>
                  <Text size="lg" strong>
                    {payoutToken.symbol}
                  </Text>
                </div>
                <div>
                  <TextDesc size="md">{formatUnits(payout.amount, payoutToken.decimals)}</TextDesc>
                </div>
              </div>
            </StyledImageName>
            <Checkbox label="" name="Claim" checked={claimPayoutArray[index]} onChange={onChange} />
          </StyledItem>
        );
      })}
    </>
  );
};

export default ModalBody;
