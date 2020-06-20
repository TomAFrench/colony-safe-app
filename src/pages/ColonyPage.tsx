/* eslint-disable react/jsx-props-no-spreading */
import React, { useState, ReactElement } from "react";
import { Tabs, Tab, Box } from "@material-ui/core";
import styled from "styled-components";

import { getTokenList } from "../config/tokens";

import SetRewardsModal from "../components/Modals/SetRewardsModal.tsx";
import DomainTree from "../components/ColonyTree/DomainTree";
import ColonyTree from "../components/ColonyTree";
import TokenList from "../components/TokenList";
import PayoutList from "../components/PayoutList";
import PermissionsList from "../components/PermissionsList";

const OuterWrapper = styled.div`
  display: flex;
  flex-flow: row nowrap;
  padding: 16px 24px;
  width: calc(100% - 48px);
`;

const LeftWrapper = styled.div`
  display: flex;
  flex-flow: column nowrap;
  min-width: 120px;

  :first-child {
    margin-top: 80px;
  }
`;

const TabsWrapper = styled.div`
  display: flex;
  flex-flow: column nowrap;
`;

function TabPanel(props: any) {
  const { children, value, index, ...other } = props;

  return (
    <div hidden={value !== index} {...other}>
      {value === index && <Box p={3}>{children}</Box>}
    </div>
  );
}

const ColonyPage = () => {
  /** State Variables **/
  const [currentTab, setCurrentTab] = useState<number>(0);

  const sideBar = (): ReactElement | null => {
    switch (currentTab) {
      case 0:
        return <ColonyTree />;
      case 1:
        return <DomainTree />;
      case 2:
        return <SetRewardsModal />;
      default:
        return null;
    }
  };

  const handleChange = (_event: any, newValue: number) => {
    setCurrentTab(newValue);
  };

  return (
    <OuterWrapper>
      <LeftWrapper>{sideBar()}</LeftWrapper>
      <TabsWrapper>
        <Tabs variant="fullWidth" value={currentTab} onChange={handleChange}>
          <Tab label="Tokens" />
          <Tab label="Permissions" />
          <Tab label="Rewards" />
        </Tabs>
        <TabPanel value={currentTab} index={0}>
          <TokenList tokens={getTokenList("mainnet")} />
        </TabPanel>
        <TabPanel value={currentTab} index={1}>
          <PermissionsList />
        </TabPanel>
        <TabPanel value={currentTab} index={2}>
          <PayoutList tokens={getTokenList("mainnet")} />
        </TabPanel>
      </TabsWrapper>
    </OuterWrapper>
  );
};

export default ColonyPage;
