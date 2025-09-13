import { Card, Group, Stack, Text, Button } from "@mantine/core";
import {
  IconCalendar,
  IconPlus,
  IconFileText,
  IconPackage,
  IconUsers,
  IconTrendingUp,
  IconCurrencyDollar,
  IconBox,
  IconTrendingDown,
  IconAlertTriangle,
} from "@tabler/icons-react";
import { useNavigate } from "react-router-dom";
import { useDashboardHome } from "../Context/DashboardHomeContext";

const quickActions = [
  {
    title: "Create Sales Invoice",
    description: "Generate a new sales invoice",
    icon: IconFileText,
    href: "/invoicing/sales",
    color: "blue",
  },
  {
    title: "Add Product",
    description: "Add new product to inventory",
    icon: IconPackage,
    href: "/products",
    color: "green",
  },
  {
    title: "Add User",
    description: "Create new user account",
    icon: IconUsers,
    href: "/users",
    color: "grape",
  },
];

export default function DashboardHome() {
  const navigate = useNavigate();
  const { stats } = useDashboardHome();

  return (
    <Group align="stretch" gap={0}>
      <Stack style={{ flex: 1, overflow: "hidden" }}>
        {/* Header */}
        <Group
          justify="space-between"
          align="center"
          px={24}
          py={12}
          style={{
            borderBottom: "1px solid #eee",
            background: "#fff",
          }}
        >
          <Text size="xl" fw={700}>
            Dashboard
          </Text>
          <Button
            leftSection={<IconCalendar size={16} />}
            size="sm"
            color="#0A6802"
          >
            Today
          </Button>
        </Group>
        {/* Main Content */}
        <Stack px={24} py={24} gap={24} style={{ flex: 1, overflowY: "auto" }}>
          <Group gap={24} mb={24} style={{ flexWrap: "wrap" }}>
            <Card
              withBorder
              radius={"md"}
              shadow="sm"
              style={{
                background: "#f6fff7",
                minWidth: 320,
                flex: "1 1 30%",
                marginBottom: 16,
              }}
            >
              <Group justify="space-between" align="flex-start">
                <Stack gap={0}>
                  <Text fw={600} size="lg">
                    Total Sales
                  </Text>
                  <Text fw={700} size="2xl" mt={8}>
                    ${stats.totalSales.toLocaleString()}
                  </Text>
                </Stack>
                <IconCurrencyDollar size={24} color="#222" />
              </Group>
            </Card>
            <Card
              withBorder
              radius={"md"}
              shadow="sm"
              style={{
                background: "#f6fff7",
                minWidth: 320,
                flex: "1 1 30%",
                marginBottom: 16,
              }}
            >
              <Group justify="space-between" align="flex-start">
                <Stack gap={0}>
                  <Text fw={600} size="lg">
                    Total Purchases
                  </Text>
                  <Text fw={700} size="2xl" mt={8}>
                    ${stats.totalPurchases.toLocaleString()}
                  </Text>
                </Stack>
                <IconBox size={24} color="#222" />
              </Group>
            </Card>
            <Card
              withBorder
              radius={"md"}
              shadow="sm"
              style={{
                background: "#f6fff7",
                minWidth: 320,
                flex: "1 1 30%",
                marginBottom: 16,
              }}
            >
              <Group justify="space-between" align="flex-start">
                <Stack gap={0}>
                  <Text fw={600} size="lg">
                    Stock in Hand
                  </Text>
                  <Text fw={700} size="2xl" mt={8}>
                    ${stats.stockInHand.toLocaleString()}
                  </Text>
                </Stack>
                <IconBox size={24} color="#222" />
              </Group>
            </Card>
            <Card
              withBorder
              radius={"md"}
              shadow="sm"
              style={{
                background: "#f6fff7",
                minWidth: 320,
                flex: "1 1 30%",
                marginBottom: 16,
              }}
            >
              <Group justify="space-between" align="flex-start">
                <Stack gap={0}>
                  <Text fw={600} size="lg">
                    Receivables
                  </Text>
                  <Text fw={700} size="2xl" mt={8}>
                    ${stats.receivables.toLocaleString()}
                  </Text>
                </Stack>
                <IconTrendingUp size={24} color="#222" />
              </Group>
            </Card>
            <Card
              withBorder
              radius={"md"}
              shadow="sm"
              style={{
                background: "#f6fff7",
                minWidth: 320,
                flex: "1 1 30%",
                marginBottom: 16,
              }}
            >
              <Group justify="space-between" align="flex-start">
                <Stack gap={0}>
                  <Text fw={600} size="lg">
                    Payables
                  </Text>
                  <Text fw={700} size="2xl" mt={8}>
                    ${stats.payables.toLocaleString()}
                  </Text>
                </Stack>
                <IconTrendingDown size={24} color="#222" />
              </Group>
            </Card>
            <Card
              withBorder
              shadow="sm"
              style={{
                background: "#f6fff7",
                minWidth: 320,
                flex: "1 1 30%",
                marginBottom: 16,
              }}
            >
              <Group justify="space-between" align="flex-start">
                <Stack gap={0}>
                  <Text fw={600} size="lg">
                    Low Stock Items
                  </Text>
                  <Text fw={700} size="2xl" mt={8}>
                    {stats.lowStockItems}
                  </Text>
                </Stack>
                <IconAlertTriangle size={24} color="#222" />
              </Group>
            </Card>
          </Group>
          <Card withBorder shadow="sm" bg="#F1FCF0" radius={"md"}>
            <Stack>
              <Text fw={600} size="lg">
                Quick Actions
              </Text>
              <Text size="sm" c="dimmed">
                Frequently used actions for faster workflow
              </Text>
              <Stack gap={12} mt={8}>
                {quickActions.map((action) => (
                  <Group
                    key={action.title}
                    align="center"
                    gap={16}
                    style={{
                      border: "1px solid #eee",
                      borderRadius: 8,
                      padding: 12,
                      cursor: "pointer",
                      background: "#fff",
                      transition: "background 0.2s",
                    }}
                    onClick={() => {
                      if (action.title === "Create Sales Invoice")
                        navigate("/dashboard/sales-invoice");
                      if (action.title === "Add User")
                        navigate("/dashboard/manage-users");
                    }}
                  >
                    <Button
                      color={action.color}
                      variant="light"
                      radius="md"
                      size="md"
                      style={{ minWidth: 40, padding: 0 }}
                    >
                      <action.icon size={18} />
                    </Button>
                    <Stack gap={0} style={{ flex: 1 }}>
                      <Text fw={500}>{action.title}</Text>
                      <Text size="xs" c="dimmed">
                        {action.description}
                      </Text>
                    </Stack>
                    <Button variant="subtle" color="gray" size="sm" radius="md">
                      <IconPlus size={16} />
                    </Button>
                  </Group>
                ))}
              </Stack>
            </Stack>
          </Card>
        </Stack>
      </Stack>
    </Group>
  );
}
