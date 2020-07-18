import React from "react";
import styled from "styled-components";
import Blockies from "react-blockies";
import { Text } from "@gnosis.pm/safe-react-components";
import { shortenAddress } from "../../utils";

export const Identicon = styled(Blockies)`
  border-radius: 50%;
  margin-left: 10px;
  margin-right: 10px;
`;

const AddressWrapper = styled.div`
  display: flex;
  align-items: center;
`;

const Address = ({ address, digits }: { address: string; digits?: number }) => {
  return (
    <AddressWrapper>
      <Identicon seed={address.toLowerCase()} />
      <Text size="lg">{shortenAddress(address, digits)}</Text>
    </AddressWrapper>
  );
};

export default Address;
