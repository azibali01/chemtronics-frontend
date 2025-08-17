import { useState, type ReactNode } from "react";
import {
  AppShell,
  ScrollArea,
  TextInput,
  NavLink,
  Group,
  Title,
} from "@mantine/core";
import {
  IconFileText,
  IconChevronDown,
  IconChevronRight,
  IconSearch,
  IconReport,
  IconSettings,
  IconUsers,
  IconDashboard,
} from "@tabler/icons-react";
import { Link, Outlet } from "react-router-dom";

type MenuChild = {
  label: string;
  path: string;
};

type MenuItem = {
  label: string;
  icon: ReactNode;
  children?: MenuChild[];
};

const menuItems: MenuItem[] = [
  {
    label: "Dashboard",
    icon: <IconDashboard size={18} />,
  },
  {
    label: "Coding",
    icon: <IconFileText size={18} />,
    children: [
      { label: "Accounts Coding", path: "/coding/accounts-coding" },
      { label: "Account Registration", path: "/coding/account-regzistration" },
      { label: "Simple Account Coding", path: "/coding/simple-account-coding" },
      {
        label: "Accounts Opening Balances",
        path: "/coding/accounts-opening-balances",
      },
    ],
  },
  {
    label: "Invoice",
    icon: <IconFileText size={18} />,
    children: [
      { label: "Purchase Invoice", path: "/dashboard/purchase-invoice" },
      { label: "Purchase Invoice GST", path: "/invoice/purchase-gst" },
      { label: "Purchase Return", path: "/invoice/purchase-return" },
    ],
  },
  {
    label: "Accounts",
    icon: <IconUsers size={18} />,
    children: [
      { label: "Cash Payment / Debit Voucher", path: "/accounts/cash-payment" },
      {
        label: "Cash Receipt / Credit Voucher",
        path: "/accounts/cash-receipt",
      },
      { label: "Journal Voucher", path: "/accounts/journal-voucher" },
      { label: "Bank Credit Voucher", path: "/accounts/bank-credit" },
      { label: "Bank Debit Voucher", path: "/accounts/bank-debit" },
      { label: "Sales Commission", path: "/accounts/sales-commission" },
    ],
  },
  {
    label: "Accounts Reports",
    icon: <IconReport size={18} />,
    children: [
      { label: "Chart of Accounts", path: "/reports/chart-of-accounts" },
      { label: "Account Ledger", path: "/reports/account-ledger" },
      { label: "Cash Book", path: "/reports/cash-book" },
      { label: "Day Book", path: "/reports/day-book" },
      { label: "Journal Book", path: "/reports/journal-book" },
      { label: "Balance Sheet", path: "/reports/balance-sheet" },
      { label: "Receivable / Payable", path: "/reports/receivable-payable" },
      { label: "Profit / Loss", path: "/reports/profit-loss" },
    ],
  },
  {
    label: "System",
    icon: <IconSettings size={18} />,
    children: [
      { label: "Create User", path: "/system/create-user" },
      { label: "User Rights", path: "/system/user-rights" },
      {
        label: "Account Master Deletion",
        path: "/system/account-master-deletion",
      },
      { label: "Control Accounts", path: "/system/control-accounts" },
      { label: "Database Backup", path: "/system/database-backup" },
      { label: "Database Restore", path: "/system/database-restore" },
    ],
  },
];

export default function DashboardLayout() {
  const [opened, setOpened] = useState<{ [key: string]: boolean }>({});

  const toggle = (label: string) => {
    setOpened((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{
        width: 260,
        breakpoint: "sm",
        collapsed: { mobile: false },
      }}
      padding="md"
      styles={{
        main: {
          backgroundColor: "#0b0909", // Black main background
          color: "#d6d6d6", // Pewter text
        },
      }}
    >
      {/* HEADER */}
      <AppShell.Header>
        <Group
          h="100%"
          px="md"
          justify="space-between"
          style={{
            backgroundColor: "#44444c", // Ebony header
            borderBottom: "1px solid #8c8c8c", // Gray border
          }}
        >
          <Title order={4} c="#d6d6d6">
            POS Dashboard
          </Title>
        </Group>
      </AppShell.Header>

      {/* SIDEBAR */}
      <AppShell.Navbar p="xs" style={{ backgroundColor: "#44444c" }}>
        <TextInput
          placeholder="Search"
          size="xs"
          leftSection={<IconSearch size={14} color="#d6d6d6" />}
          styles={{
            input: {
              backgroundColor: "#0b0909",
              border: "1px solid #8c8c8c",
              color: "#d6d6d6",
              "::placeholder": { color: "#8c8c8c" },
            },
          }}
        />

        <ScrollArea offsetScrollbars style={{ marginTop: 10 }}>
          {menuItems.map((item) => (
            <div key={item.label}>
              <NavLink
                label={item.label}
                leftSection={item.icon}
                rightSection={
                  item.children ? (
                    opened[item.label] ? (
                      <IconChevronDown size={14} />
                    ) : (
                      <IconChevronRight size={14} />
                    )
                  ) : null
                }
                onClick={() => item.children && toggle(item.label)}
                styles={{
                  root: {
                    color: "#d6d6d6",
                    borderRadius: 6,
                    "&:hover": {
                      backgroundColor: "#8c8c8c",
                      color: "#0b0909",
                    },
                  },
                  label: { fontWeight: 500 },
                }}
              />
              {opened[item.label] &&
                item.children?.map((sub) => (
                  <NavLink
                    key={sub.path}
                    label={sub.label}
                    component={Link}
                    to={sub.path}
                    ml="lg"
                    styles={{
                      root: {
                        color: "#8c8c8c",
                        fontSize: "0.85rem",
                        borderRadius: 4,
                        "&:hover": {
                          backgroundColor: "#d6d6d6",
                          color: "#0b0909",
                        },
                      },
                    }}
                  />
                ))}
            </div>
          ))}
        </ScrollArea>
      </AppShell.Navbar>

      {/* MAIN CONTENT */}
      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
}
