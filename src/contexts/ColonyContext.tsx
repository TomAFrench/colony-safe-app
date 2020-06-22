import React, { useState, createContext, ReactElement, useContext, useCallback, useEffect } from "react";

import {
  getColonyNetworkClient,
  Network,
  ColonyClient,
  NetworkClient,
  ColonyRoles,
  getColonyRoles,
  ColonyRole,
} from "@colony/colony-js";
import getTokenClient, { TokenInfo } from "@colony/colony-js/lib/clients/TokenClient";
import { InfuraProvider } from "ethers/providers";
import { BigNumber } from "ethers/utils";
import getColonyTokens from "../utils/colony/getColonyTokens";
import { Token } from "../typings";

interface Props {
  children: ReactElement | ReactElement[];
}

interface State {
  setColony: Function;
  colonyClient?: ColonyClient;
}

export const ColonyContext = createContext({} as State);

export function useColonyContext(): State {
  return useContext(ColonyContext);
}

function ColonyProvider({ children }: Props) {
  /** State Variables **/
  const [colonyClient, setColonyClient] = useState<ColonyClient>();
  const [networkClient, setNetworkClient] = useState<NetworkClient>();

  const network = "mainnet";
  useEffect(() => {
    const getNetworkClient = async () => {
      const provider = new InfuraProvider(network, process.env.REACT_APP_INFURA_KEY);
      // Get a network client instance
      const newNetworkClient = await getColonyNetworkClient(Network.Mainnet, provider);
      // Check out the logs to see the network address
      console.log("Network Address:", newNetworkClient.address);
      setNetworkClient(newNetworkClient);
    };
    getNetworkClient();
  }, [network]);

  const setColony = useCallback(
    async (colonyEnsName: string): Promise<void> => {
      if (!networkClient) return;

      console.log(`Finding address of ${colonyEnsName}`);
      const provider = new InfuraProvider(network, process.env.REACT_APP_INFURA_KEY);
      const colonyAddress = await provider.resolveName(colonyEnsName);

      console.log(`${colonyEnsName} address: ${colonyAddress}`);

      try {
        const newColonyClient = await networkClient.getColonyClient(colonyAddress);
        console.log("Colony address:", newColonyClient.address);
        setColonyClient(newColonyClient);
      } catch (e) {
        console.warn("Could not find colony", e);
      }
    },
    [networkClient],
  );

  useEffect(() => {
    if (process.env.REACT_APP_COLONY_ENS_NAME) setColony(process.env.REACT_APP_COLONY_ENS_NAME);
  }, [setColony]);

  return <ColonyContext.Provider value={{ colonyClient, setColony }}>{children}</ColonyContext.Provider>;
}

export const useColonyClient = (): ColonyClient | undefined => {
  const { colonyClient } = useColonyContext();
  return colonyClient;
};

export const useSetColony = (): Function => {
  const { setColony } = useColonyContext();
  return setColony;
};

export const useColonyVersion = (): BigNumber => {
  const colonyClient = useColonyClient();
  const [colonyVersion, setColonyVersion] = useState<BigNumber>(new BigNumber(0));

  useEffect(() => {
    if (colonyClient) {
      colonyClient.version().then((version: BigNumber) => setColonyVersion(version));
    }
  }, [colonyClient]);
  return colonyVersion;
};

export const useNativeTokenAddress = () => {
  const colonyClient = useColonyClient();
  const [nativeTokenAddress, setNativeTokenAddress] = useState<string>();

  useEffect(() => {
    if (colonyClient) {
      colonyClient.getToken().then((address: string) => setNativeTokenAddress(address));
    }
  }, [colonyClient]);

  return nativeTokenAddress;
};

export const useNativeTokenInfo = () => {
  const colonyClient = useColonyClient();
  const [tokenInfo, setTokenInfo] = useState<TokenInfo>();

  useEffect(() => {
    if (colonyClient) {
      colonyClient.tokenClient.getTokenInfo().then((info: TokenInfo) => setTokenInfo(info));
    }
  }, [colonyClient]);

  return tokenInfo;
};

export const useTokens = () => {
  const colonyClient = useColonyClient();
  const [tokens, setTokens] = useState<string[]>([]);

  useEffect(() => {
    if (colonyClient) {
      getColonyTokens(colonyClient).then((tokenAddresses: string[]) => setTokens(tokenAddresses));
    }
  }, [colonyClient]);

  return tokens;
};

export const useTokensInfo = () => {
  const colonyClient = useColonyClient();
  const tokens = useTokens();
  const [tokensInfo, setTokensInfo] = useState<Token[]>([]);

  useEffect(() => {
    if (colonyClient && tokens.length > 0) {
      Promise.all(
        tokens.map(async (tokenAddress: string) => {
          if (tokenAddress === "0x0000000000000000000000000000000000000000") {
            return {
              address: "0x0000000000000000000000000000000000000000",
              name: "Ether",
              symbol: "ETH",
              decimals: 18,
            };
          }
          return {
            address: tokenAddress,
            ...(await getTokenClient(tokenAddress, colonyClient.provider).getTokenInfo()),
          };
        }),
      ).then(newTokensInfo => setTokensInfo(newTokensInfo));
    }
  }, [colonyClient, tokens]);

  return tokensInfo;
};

export const useColonyRoles = (): ColonyRoles => {
  const colonyClient = useColonyClient();
  const [roles, setRoles] = useState<ColonyRoles>([]);

  useEffect(() => {
    if (colonyClient) {
      getColonyRoles(colonyClient).then((newRoles: ColonyRoles) => setRoles(newRoles));
    } else {
      setRoles([]);
    }
  }, [colonyClient]);

  return roles;
};

export const useHasDomainPermission = (
  userAddress: string | undefined,
  domainId: number,
  role: ColonyRole,
): boolean => {
  const colonyClient = useColonyClient();
  const [hasPermission, setHasPermission] = useState<boolean>(false);

  useEffect(() => {
    if (userAddress && colonyClient) {
      Promise.all([
        // Check if user has selected role (or root)
        colonyClient.hasUserRole(userAddress, domainId, ColonyRole.Root),
        colonyClient.hasUserRole(userAddress, domainId, role),
        // The user could also inherit this permission from the root domain
        colonyClient.hasUserRole(userAddress, 1, ColonyRole.Root),
        colonyClient.hasUserRole(userAddress, 1, role),
      ]).then(roleStatuses => setHasPermission(roleStatuses.includes(true)));
    } else {
      setHasPermission(false);
    }
  }, [colonyClient, userAddress, domainId, role]);

  return hasPermission;
};

export default ColonyProvider;
