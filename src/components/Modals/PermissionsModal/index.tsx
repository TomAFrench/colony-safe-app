import React, { useState, useMemo, useCallback } from "react";
import { ColonyRole } from "@colony/colony-js";
import { BigNumberish } from "ethers/utils";
import AdministrationIcon from "../../../assets/permissions/administration.svg";
import ArbitrationIcon from "../../../assets/permissions/arbitration.svg";
import ArchitectureIcon from "../../../assets/permissions/architecture.svg";
import FundingIcon from "../../../assets/permissions/funding.svg";
import RecoveryIcon from "../../../assets/permissions/recovery.svg";
import RootIcon from "../../../assets/permissions/root.svg";

import ManageListModal from "./Modal";
import setNewPermissions from "../../../utils/transactions/permissions/setNewPermissions";
import { shortenAddress, isAddress } from "../../../utils";
import { Permission } from "./types";
import { useColonyClient } from "../../../contexts/ColonyContext";
import { PermissionUpdate } from "../../../typings";
import { useAppsSdk } from "../../../contexts/SafeContext";

const displayPermissions = (permissions: number[]): Permission[] => [
  {
    id: ColonyRole.Root.toString(),
    iconUrl: RootIcon,
    name: "Root",
    description: "",
    checked: permissions.includes(ColonyRole.Root),
    revokeable: true,
  },
  {
    id: ColonyRole.Recovery.toString(),
    iconUrl: RecoveryIcon,
    name: "Recovery",
    description: "",
    checked: permissions.includes(ColonyRole.Recovery),
    revokeable: false,
  },
  {
    id: ColonyRole.Arbitration.toString(),
    iconUrl: ArbitrationIcon,
    name: "Arbitration",
    description: "",
    checked: permissions.includes(ColonyRole.Arbitration),
    revokeable: true,
  },
  {
    id: ColonyRole.Architecture.toString(),
    iconUrl: ArchitectureIcon,
    name: "Architecture",
    description: "",
    checked: permissions.includes(ColonyRole.Architecture),
    revokeable: true,
  },
  {
    id: ColonyRole.Funding.toString(),
    iconUrl: FundingIcon,
    name: "Funding",
    description: "",
    checked: permissions.includes(ColonyRole.Funding),
    revokeable: true,
  },
  {
    id: ColonyRole.Administration.toString(),
    iconUrl: AdministrationIcon,
    name: "Administration",
    description: "",
    checked: permissions.includes(ColonyRole.Administration),
    revokeable: true,
  },
];

const roleChanged = (initialRoles: ColonyRole[], updatedRoles: ColonyRole[], role: ColonyRole) =>
  initialRoles.includes(role) !== updatedRoles.includes(role);

const getRoleUpdates = (initialRoles: ColonyRole[], updatedRoles: ColonyRole[]): PermissionUpdate[] => {
  return Object.values(ColonyRole)
    .filter(el => typeof el !== "string" && roleChanged(initialRoles, updatedRoles, el))
    .map(role => ({ role: role as ColonyRole, setTo: updatedRoles.includes(role as ColonyRole) }));
};

const PermissionsModal = ({
  isOpen,
  setIsOpen,
  address,
  permissions,
  domainId,
  permissionDomainId,
  childSkillIndex,
}: {
  isOpen: boolean;
  setIsOpen: Function;
  address?: string;
  permissions: number[];
  domainId: BigNumberish;
  permissionDomainId: BigNumberish;
  childSkillIndex: BigNumberish;
}) => {
  const appsSdk = useAppsSdk();
  const colonyClient = useColonyClient();
  const [userAddress, setUserAddress] = useState<string | undefined>(address);
  const [newUserPermissions, setNewUserPermissions] = useState(permissions);

  const onItemToggle = (roleId: number, checked: boolean) => {
    const copy = newUserPermissions.filter(role => role !== roleId);
    if (checked) {
      copy.push(roleId);
    }
    setNewUserPermissions(copy);
  };

  const updatePermissions = useCallback(() => {
    const setPermissions = async () => {
      if (colonyClient && isAddress(userAddress)) {
        const roleUpdates = getRoleUpdates(permissions, newUserPermissions);
        const txs = await setNewPermissions(
          colonyClient,
          userAddress as string,
          roleUpdates,
          permissionDomainId,
          domainId,
          childSkillIndex,
        );
        appsSdk.sendTransactions(txs);
      }
    };
    setPermissions();
  }, [
    colonyClient,
    permissions,
    newUserPermissions,
    userAddress,
    permissionDomainId,
    domainId,
    childSkillIndex,
    appsSdk,
  ]);

  const items = useMemo(() => displayPermissions(newUserPermissions), [newUserPermissions]);
  if (!isOpen) return null;
  return (
    <ManageListModal
      title={address ? shortenAddress(address) : "New Account"}
      defaultIconUrl=""
      permissionsList={items}
      onSubmitForm={() => {
        updatePermissions();
        setIsOpen(false);
      }}
      onClose={() => setIsOpen(false)}
      onPermissionToggle={onItemToggle}
      newAccount={!address}
      userAddress={userAddress}
      handleChangeAddress={(event: any) => setUserAddress(event.target.value)}
    />
  );
};

export default PermissionsModal;
