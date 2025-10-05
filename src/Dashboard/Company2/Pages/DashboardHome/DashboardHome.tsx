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
import { useDashboardHomeCompany2 } from "../../Context/DashboardHomeContextCompany2";

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

export default function DashboardHomeCompany2() {
  const navigate = useNavigate();
  const { stats } = useDashboardHomeCompany2();

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
          <Button leftSection={<IconPlus size={16} />}>Quick Action</Button>
        </Group>
        {/* ...existing code... */}
      </Stack>
    </Group>
  );
}
