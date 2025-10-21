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
  IconChevronDown,
  IconChevronRight,
  IconSearch,
  IconArrowRight,
  IconLogout,
  IconBuildingSkyscraper,
  IconBook,
  IconFileInvoice,
  IconPackage,
  IconReportAnalytics,
  IconCash,
  IconReceipt2,
  IconChartBar,
  IconHome,
} from "@tabler/icons-react";
import { Link, Outlet, useLocation } from "react-router-dom";
import BrandToggle from "../../toggle/BrandToggle";

type MenuChild = {
  label: string;
  path: string;
  icon?: ReactNode;
};

type MenuItem = {
  label: string;
  icon: ReactNode;
  children?: MenuChild[];
  path?: string;
};
const menuItems: MenuItem[] = [
  {
    label: "Dashboard",
    icon: <IconHome size={18} />,
    children: [
      {
        label: "Dashboard Home",
        path: "/dashboard/dashboard-home",
        icon: <IconArrowRight size={16} />,
      },
    ],
  },
  {
    label: "Company & Users",
    icon: <IconBuildingSkyscraper size={18} />,
    children: [
      {
        label: "Manage Companies",
        icon: <IconArrowRight size={16} />,
        path: "/dashboard/manage-companies",
      },
      {
        label: "Manage Users",
        icon: <IconArrowRight size={16} />,
        path: "/dashboard/manage-users",
      },
      {
        label: "Permissions",
        icon: <IconArrowRight size={16} />,
        path: "/dashboard/permissions",
      },
    ],
  },
  {
    label: "Chart of Accounts",
    icon: <IconBook size={18} />,

    children: [
      {
        label: "Chart of Accounts",
        icon: <IconBook size={18} />,
        path: "/dashboard/chart-of-accounts",
      },
      {
        label: "Accounts Opening Balances",
        icon: <IconBook size={18} />,
        path: "/dashboard/accounts-opening-balances",
      },
    ],
  },
  {
    label: "Invoicing",
    icon: <IconFileInvoice size={18} />,
    children: [
      {
        label: "Sales Invoice",
        icon: <IconArrowRight size={16} />,
        path: "/dashboard/sales-invoice",
      },
      {
        label: "Purchase Invoice",
        icon: <IconArrowRight size={16} />,
        path: "/dashboard/purchase-invoice",
      },
      {
        label: "Purchase Returns",
        icon: <IconArrowRight size={16} />,
        path: "/dashboard/purchase-returns",
      },
      {
        label: "Credit Sale Invoice",
        icon: <IconArrowRight size={16} />,
        path: "/dashboard/credit-sale-invoice",
      },
      {
        label: "Sale Returns",
        icon: <IconArrowRight size={16} />,
        path: "/dashboard/sale-returns",
      },
      {
        label: "Delivery Challan",
        icon: <IconArrowRight size={16} />,
        path: "/dashboard/delivery-challans",
      },
    ],
  },
  {
    label: "Inventory",
    icon: <IconPackage size={18} />,
    children: [
      {
        label: "Products",
        icon: <IconArrowRight size={16} />,
        path: "/dashboard/products",
      },
      {
        label: "Stock Opening",
        icon: <IconArrowRight size={16} />,
        path: "/dashboard/account-ledger",
      },
      {
        label: "Stock Ledger",
        icon: <IconArrowRight size={16} />,
        path: "/dashboard/stock-ledger",
      },
      {
        label: "Stock Reports",
        icon: <IconArrowRight size={16} />,
        path: "/dashboard/stock-reports",
      },
    ],
  },
  {
    label: "Ledger & Reports",
    icon: <IconReportAnalytics size={18} />,
    children: [
      {
        label: "General Ledger",
        icon: <IconArrowRight size={16} />,
        path: "/dashboard/general-ledger",
      },
      {
        label: "Sales Ledger",
        icon: <IconArrowRight size={16} />,
        path: "/dashboard/sales-ledger",
      },
      {
        label: "Purchase Ledger",
        icon: <IconArrowRight size={16} />,
        path: "/dashboard/purchase-ledger",
      },
      {
        label: "Accounts Receivable",
        icon: <IconArrowRight size={16} />,
        path: "/dashboard/accounts-receivable",
      },
      {
        label: "Accounts Payable",
        icon: <IconArrowRight size={16} />,
        path: "/dashboard/accounts-payable",
      },
      {
        label: "Trial Balance",
        icon: <IconArrowRight size={16} />,
        path: "/dashboard/trial-balance",
      },
    ],
  },
  {
    label: "Accounts",
    icon: <IconCash size={18} />,
    children: [
      {
        label: "Cash Book",
        icon: <IconArrowRight size={16} />,
        path: "/dashboard/cash-book",
      },
      {
        label: "Journal Vouchers",
        icon: <IconArrowRight size={16} />,
        path: "/dashboard/journal-vouchers",
      },
    ],
  },
  {
    label: "Tax & Invoices",
    icon: <IconReceipt2 size={18} />,
    children: [
      {
        label: "GST Invoices",
        icon: <IconArrowRight size={16} />,
        path: "/dashboard/gst-invoices",
      },
      {
        label: "Tax Reports",
        icon: <IconArrowRight size={16} />,
        path: "/dashboard/tax-reports",
      },
    ],
  },
  {
    label: "Analytics",
    icon: <IconChartBar size={18} />,
    children: [
      {
        label: "Analytics Dashboard",
        icon: <IconArrowRight size={16} />,
        path: "/dashboard/analytics",
      },
    ],
  },
];

export default function DashboardLayout() {
  const [opened, setOpened] = useState<{ [key: string]: boolean }>({});
  const location = useLocation();

  const basePath = "/dashboard";

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
        main: { backgroundColor: "#ffffffff" },
      }}
    >
      <AppShell.Header>
        <Group
          h="100%"
          px="md"
          justify="space-between"
          bg={"#FFFFFF"}
          style={{ overflow: "hidden", position: "relative" }}
        >
          <img
            src="../Logo.png"
            alt="Logo"
            style={{
              marginTop: 5,
              width: 130,
              height: 50,
              objectFit: "cover",
              borderRadius: 8,
              backgroundColor: "#819E00",
            }}
          />
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
                  "linear-gradient(90deg, #0A6802, #819E00, #0A6802)",
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
            size="xs"
            mr={100}
            color="#0A6802"
            style={{ transition: "all 0.3s ease" }}
            rightSection={<IconLogout size={14} color="#ffffffff" />}
          >
            Logout
          </Button>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="xs" bg={"#F1FCF0"}>
        <TextInput
          placeholder="Search"
          size="xs"
          leftSection={<IconSearch size={14} color="#819E00" />}
          styles={{
            input: {
              border: "1px solid #0A6802",
              color: "#000000ff",
              "::placeholder": { color: "#000000ff" },
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
                active={
                  location.pathname ===
                  `${basePath}/${item.label.toLowerCase()}`
                }
                styles={{
                  root: {
                    borderRadius: 6,
                    backgroundColor:
                      location.pathname ===
                      `${basePath}/${item.label.toLowerCase()}`
                        ? "#0A6802"
                        : "transparent",
                    color:
                      location.pathname ===
                      `${basePath}/${item.label.toLowerCase()}`
                        ? "#ffffff"
                        : "#222222",
                    "&:hover": {
                      backgroundColor: "#819E00",
                      color: "#ffffff",
                    },
                  },
                  label: { fontWeight: 600 },
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
                    active={location.pathname === sub.path}
                    ml="lg"
                    styles={{
                      root: {
                        fontSize: "0.85rem",
                        borderRadius: 4,
                        transition: "all 0.2s ease",
                        backgroundColor:
                          location.pathname ===
                          `${basePath}${sub.path.replace("/dashboard", "")}`
                            ? "#0A6802"
                            : "transparent",
                        color:
                          location.pathname ===
                          `${basePath}${sub.path.replace("/dashboard", "")}`
                            ? "#ffffff"
                            : "#222222",
                        "&:hover": {
                          backgroundColor: "#819E00",
                          color: "#ffffff",
                        },
                      },
                    }}
                  />
                ))}
            </div>
          ))}
        </ScrollArea>
        <BrandToggle />
      </AppShell.Navbar>

      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
}
