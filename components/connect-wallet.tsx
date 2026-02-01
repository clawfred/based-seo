"use client";

import {
  Wallet,
  ConnectWallet as OCKConnectWallet,
  WalletDropdown,
  WalletDropdownDisconnect,
} from "@coinbase/onchainkit/wallet";
import { Address, Avatar, Name, Identity } from "@coinbase/onchainkit/identity";

export function ConnectWallet() {
  return (
    <Wallet>
      <OCKConnectWallet className="h-11 gap-2 rounded-md border border-border bg-background/60 px-3.5 text-foreground shadow-sm backdrop-blur hover:bg-background/80">
        <Avatar className="h-6 w-6" />
        {/* Show name on md+ only; keep it tight + truncated */}
        <span className="hidden max-w-[200px] truncate text-sm font-medium md:inline-flex [&_*]:text-foreground">
          <Name />
        </span>
      </OCKConnectWallet>
      <WalletDropdown>
        <Identity className="px-4 pb-2 pt-3" hasCopyAddressOnClick>
          <Avatar />
          <Name />
          <Address />
        </Identity>
        <WalletDropdownDisconnect />
      </WalletDropdown>
    </Wallet>
  );
}
