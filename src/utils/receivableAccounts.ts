// Update the import path below if the file is located elsewhere, e.g. "../context/ChartOfAccountsContext" or "../Context/ChartOfAccountsContext.ts"

import type { AccountNode } from "../Dashboard/Context/ChartOfAccountsContext";

// Utility to get all receivable accounts (1410 and children)
export function getReceivableAccounts(accounts: AccountNode[]): AccountNode[] {
  const result: AccountNode[] = [];
  function walk(nodes: AccountNode[]) {
    for (const acc of nodes) {
      if (acc.accountCode === "1410" || acc.selectedCode === "1410") {
        result.push(acc);
        if (acc.children) walk(acc.children);
      } else if (acc.parentAccount && acc.parentAccount.includes("1410")) {
        result.push(acc);
        if (acc.children) walk(acc.children);
      } else if (acc.children) {
        walk(acc.children);
      }
    }
  }
  walk(accounts);
  return result;
}
