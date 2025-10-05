import {
  Card,
  Text,
  Group,
  SimpleGrid,
  Switch,
  Table,
  Button,
  Select,
  Badge,
} from "@mantine/core";
import { usePermissionContextCompany2 } from "../../Context/Company & Users/PermissionContextCompany2";

export default function PermissionsManagementCompany2() {
  const {
    roles,
    selectedRole,
    enabledPermissions,
    setSelectedRole,
    togglePermission,
  } = usePermissionContextCompany2();

  const handleSave = () => {
    alert(
      `${selectedRole.name} updated: ${enabledPermissions.length} permissions enabled`
    );
    console.log("Saved data:", { role: selectedRole.name, enabledPermissions });
  };

  return (
    <div>
      <Group justify="space-between" mb="md">
        <Text fw={600} fz="xl">
          Permissions Management
        </Text>
        <Button color="#0A6802" onClick={handleSave}>
          Save Changes
        </Button>
      </Group>

      <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} mb="lg">
        {roles.map((role) => (
          <Card
            key={role.name}
            shadow="sm"
            p="lg"
            radius="md"
            withBorder
            onClick={() => setSelectedRole(role)}
            style={{
              cursor: "pointer",
              border:
                selectedRole.name === role.name ? "2px solid green" : undefined,
            }}
          >
            <Group justify="space-between" mb="xs">
              <Text fw={600}>{role.name}</Text>
              {role.icon}
            </Group>
            <Text fz="xl" fw={700}>
              {role.description}
            </Text>
            <Badge color="green" mt="sm">
              {role.permissions.length} Permissions
            </Badge>
          </Card>
        ))}
      </SimpleGrid>

      <Table>
        <thead>
          <tr>
            <th>Permission</th>
            <th>Enabled</th>
          </tr>
        </thead>
        <tbody>
          {selectedRole.permissions.map((perm) => (
            <tr key={perm}>
              <td>{perm}</td>
              <td>
                <Switch
                  checked={enabledPermissions.includes(perm)}
                  onChange={() => togglePermission(perm)}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}
