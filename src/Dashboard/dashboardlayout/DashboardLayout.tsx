import { useState, type ReactNode } from "react";
import {
  AppShell,
  ScrollArea,
  TextInput,
  NavLink,
  Group,
  Text,
  Box,
  Button,
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
  IconArrowRight,
  IconLogout,
  IconBuilding,
} from "@tabler/icons-react";
import { Link, Outlet } from "react-router-dom";

type MenuChild = {
  label: string;
  path: string;
  icon?: ReactNode;
};

type MenuItem = {
  label: string;
  icon: ReactNode;
  children?: MenuChild[];
};

const menuItems: MenuItem[] = [
  { label: "Dashboard", icon: <IconDashboard size={18} /> },
  {
    label: "Coding",
    icon: <IconFileText size={18} />,
    children: [
      {
        label: "Accounts Coding",
        icon: <IconArrowRight size={16} />,
        path: "/dashboard/accounts-coding",
      },
      {
        label: "Account Registration",
        icon: <IconArrowRight size={16} />,
        path: "/dashboard/account-registration",
      },
      {
        label: "Simple Account Coding",
        icon: <IconArrowRight size={16} />,
        path: "/dashboard/simple-account-coding",
      },
      {
        label: "Accounts Opening Balances",
        icon: <IconArrowRight size={16} />,
        path: "/dashboard/accounts-opening-balances",
      },
    ],
  },
  {
    label: "Invoice",
    icon: <IconFileText size={18} />,
    children: [
      {
        label: "Purchase Invoice",
        icon: <IconArrowRight size={16} />,
        path: "/dashboard/purchase-invoice",
      },
      {
        label: "Purchase Invoice GST",
        icon: <IconArrowRight size={16} />,
        path: "/dashboard/purchase-invoice-GST",
      },
      {
        label: "Purchase Return",
        icon: <IconArrowRight size={16} />,
        path: "/dashboard/purchase-invoice-return",
      },

      {
        label: "Cash Sale Invoice",
        icon: <IconArrowRight size={16} />,
        path: "/dashboard/cash-sale-invoice",
      },
      {
        label: "Credit Sale Invoice",
        icon: <IconArrowRight size={16} />,
        path: "/dashboard/credit-sale-invoice",
      },
      {
        label: "Sale Return",
        icon: <IconArrowRight size={16} />,
        path: "/dashboard/sale-return",
      },
      {
        label: "Sale Return With Invoice",
        icon: <IconArrowRight size={16} />,
        path: "/dashboard/sale-return-with-invoice",
      },
      {
        label: "Cash Whole Sale Invoice",
        icon: <IconArrowRight size={16} />,
        path: "/dashboard/cash-wholesale-invoice",
      },
      {
        label: "Credit Whole Sale Invoice",
        icon: <IconArrowRight size={16} />,
        path: "/dashboard/credit-wholesale-invoice",
      },
      {
        label: "Whole Sale Return",
        icon: <IconArrowRight size={16} />,
        path: "/dashboard/whole-sale-return",
      },
      {
        label: "Whole Sale Return With Invoice",
        icon: <IconArrowRight size={16} />,
        path: "/dashboard/whole-sale-return-with-invoice",
      },
    ],
  },
  {
    label: "Accounts",
    icon: <IconUsers size={18} />,
    children: [
      {
        label: "Cash Payment / Debit Voucher",
        icon: <IconArrowRight size={16} />,
        path: "/dashboard/cash-payment-debit-voucher",
      },
      {
        label: "Cash Receipt / Credit Voucher",
        icon: <IconArrowRight size={16} />,
        path: "/dashboard/cash-receipt-credit-voucher",
      },
      {
        label: "Journal Voucher",
        icon: <IconArrowRight size={16} />,
        path: "/dashboard/journal-voucher",
      },
      {
        label: "Bank Credit Voucher",
        icon: <IconArrowRight size={16} />,
        path: "/dashboard/bank-credit-voucher",
      },
      {
        label: "Bank Debit Voucher",
        icon: <IconArrowRight size={16} />,
        path: "/dashboard/bank-debit-voucher",
      },
      {
        label: "Sales Commission",
        icon: <IconArrowRight size={16} />,
        path: "/dashboard/sales-commission",
      },
    ],
  },
  {
    label: "Accounts Reports",
    icon: <IconReport size={18} />,
    children: [
      {
        label: "Chart of Accounts",
        icon: <IconArrowRight size={16} />,
        path: "/reports/chart-of-accounts",
      },
      {
        label: "Account Ledger",
        icon: <IconArrowRight size={16} />,
        path: "/dashboard/account-ledger",
      },
      {
        label: "Cash Book",
        icon: <IconArrowRight size={16} />,
        path: "/dashboard/cash-book",
      },
      {
        label: "Day Book",
        icon: <IconArrowRight size={16} />,
        path: "/dashboard/day-book",
      },
      {
        label: "Journal Book",
        icon: <IconArrowRight size={16} />,
        path: "/dashboard/journal-book",
      },
      {
        label: "Balance Sheet",
        icon: <IconArrowRight size={16} />,
        path: "/dashboard/balance-sheet",
      },
      {
        label: "Receivable / Payable",
        icon: <IconArrowRight size={16} />,
        path: "/dashboard/receivable-payable-amount",
      },
      {
        label: "Profit / Loss",
        icon: <IconArrowRight size={16} />,
        path: "/dashboard/profit-loss",
      },
    ],
  },
  {
    label: "Trial Balance",
    icon: <IconReport size={18} />,
    children: [
      {
        label: "Short Trial Balance",
        icon: <IconArrowRight size={16} />,
        path: "/dashboard/short-trial-balance",
      },
      {
        label: "Trial Balance Between Dates",
        icon: <IconArrowRight size={16} />,
        path: "/dashboard/trial-balance-between-dates",
      },
      {
        label: "Group Trial",
        icon: <IconArrowRight size={16} />,
        path: "/dashboard/group-trial",
      },
      {
        label: "Detail Trial",
        icon: <IconArrowRight size={16} />,
        path: "/dashboard/detail-trial",
      },
      {
        label: "Six Column Trial",
        icon: <IconArrowRight size={16} />,
        path: "/dashboard/six-column-trial",
      },
    ],
  },
  {
    label: "Inventory Reports",
    icon: <IconReport size={18} />,
    children: [
      {
        label: "Daily Gross Profit",
        icon: <IconArrowRight size={16} />,
        path: "/dashboard/daily-gross-profit",
      },
      {
        label: "Stock Ledger",
        icon: <IconArrowRight size={16} />,
        path: "/dashboard/stock-ledger",
      },
      {
        label: "Stock In Hand",
        icon: <IconArrowRight size={16} />,
        path: "/dashboard/stock-in-hand",
      },
    ],
  },
  {
    label: "Product Reports",
    icon: <IconBuilding size={18} />,
    children: [
      {
        label: "Product Purchase",
        icon: <IconArrowRight size={16} />,
        path: "/dashboard/product-purchase",
      },
      {
        label: "Product Sale",
        icon: <IconArrowRight size={16} />,
        path: "/dashboard/product-sale",
      },
      {
        label: "Party Wise Product Sale",
        icon: <IconArrowRight size={16} />,
        path: "/dashboard/party-wise-product-sale",
      },
      {
        label: "Party List",
        icon: <IconArrowRight size={16} />,
        path: "/dashboard/party-list",
      },
      {
        label: "Product List Group Wise",
        icon: <IconArrowRight size={16} />,
        path: "/dashboard/product-list-group-wise",
      },
    ],
  },
  {
    label: "System",
    icon: <IconSettings size={18} />,
    children: [
      {
        label: "Create User",
        icon: <IconArrowRight size={16} />,
        path: "/dashboard/create-user",
      },
      {
        label: "User Rights",
        icon: <IconArrowRight size={16} />,
        path: "/dashboard/user-rights",
      },
      {
        label: "Account Master Deletion",
        icon: <IconArrowRight size={16} />,
        path: "/dashboard/account-master-deletion",
      },
      {
        label: "Control Accounts",
        icon: <IconArrowRight size={16} />,
        path: "/dashboard/control-accounts",
      },
      {
        label: "Database Backup",
        icon: <IconArrowRight size={16} />,
        path: "/dashboard/database-backup",
      },
      {
        label: "Database Restore",
        icon: <IconArrowRight size={16} />,
        path: "/dashboard/database-restore",
      },
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
          backgroundColor: "#1f232c", // dark background
          color: "#ffffff", // white text
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
            backgroundColor: "#1f232c",
            borderBottom: "1px solid #83746e", // Coffee Pot accent
            overflow: "hidden", // Ensure marquee text stays inside
            position: "relative",
          }}
        >
          {/* Logo */}
          <img
            src="../Logo.png"
            alt="Logo"
            style={{
              marginTop: 5,
              width: 130,
              height: 50,
              objectFit: "cover",
              borderRadius: 8,
            }}
          />

          {/* Marquee Text */}
          <Box
            style={{
              overflow: "hidden",
              whiteSpace: "nowrap",
              position: "absolute",
              left: "14%",
              right: "10%",
              textAlign: "center",
            }}
          >
            <Text
              fw={600}
              style={{
                display: "inline-block",
                paddingLeft: "100%",
                animation: "scrollText 15s linear infinite",
                backgroundImage:
                  "linear-gradient(90deg, #dfd6d1, #83746e, #dfd6d1)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                fontSize: "1rem",
              }}
            >
              Developed by: <strong>SemiColon</strong>
            </Text>
          </Box>

          <style>
            {`
        @keyframes scrollText {
          0% { transform: translateX(0); }
          100% { transform: translateX(-100%); }
        }
      `}
          </style>
          <Button
            variant="outline"
            size="xs"
            mr={100}
            style={{
              borderColor: "#83746e", // Coffee Pot border
              color: "#dfd6d1", // Serenity text
              backgroundColor: "#1f232c", // Dark bg
              transition: "all 0.3s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#83746e"; // Coffee Pot hover bg
              e.currentTarget.style.color = "#ffffff"; // White text on hover
              e.currentTarget.style.borderColor = "#dfd6d1"; // Serenity border on hover
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#1f232c"; // Dark bg
              e.currentTarget.style.color = "#dfd6d1"; // Serenity text
              e.currentTarget.style.borderColor = "#83746e"; // Coffee Pot border
            }}
            rightSection={<IconLogout size={14} color="#83746e" />}
          >
            Logout
          </Button>
        </Group>
      </AppShell.Header>

      {/* SIDEBAR */}
      <AppShell.Navbar p="xs" style={{ backgroundColor: "#1f232c" }}>
        <TextInput
          placeholder="Search"
          size="xs"
          leftSection={<IconSearch size={14} color="#83746e" />}
          styles={{
            input: {
              backgroundColor: "#2a2f3a", // slightly lighter than main dark
              border: "1px solid #83746e",
              color: "#ffffff",
              "::placeholder": { color: "#83746e" },
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
                    color: "#dfd6d1",
                    borderRadius: 6,
                    "&:hover": {
                      backgroundColor: "#83746e", // Coffee Pot hover
                      color: "#ffffff",
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
                    leftSection={sub.icon}
                    component={Link}
                    to={sub.path}
                    ml="lg"
                    styles={{
                      root: {
                        color: "#dfd6d1", // Serenity
                        fontSize: "0.85rem",
                        borderRadius: 4,
                        transition: "all 0.2s ease",
                        "&:hover": {
                          backgroundColor: "#83746e",
                          color: "#ffffff",
                          boxShadow: "0 0 4px rgba(223,214,209,0.6)",
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
