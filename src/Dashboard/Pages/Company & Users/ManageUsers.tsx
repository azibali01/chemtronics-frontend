import { useState } from "react";
import {
  Paper,
  Text,
  Group,
  TextInput,
  Select,
  Button,
  Table,
  Avatar,
  Badge,
  ActionIcon,
  Flex,
  Modal,
} from "@mantine/core";
import {
  IconSearch,
  IconUser,
  IconPlus,
  IconEdit,
  IconTrash,
} from "@tabler/icons-react";
import { useUserContext } from "../../Context/Company & Users/UserContext";

export default function ManageUsers() {
  const { users, addUser, updateUser, deleteUser } = useUserContext();

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<string | null>(null);
  const [company, setCompany] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>("active");

  const [editingUserIndex, setEditingUserIndex] = useState<number | null>(null);

  const roleColors: Record<string, string> = {
    "Super Admin": "red",
    "Company Admin": "blue",
    "Accounts User": "green",
    Staff: "gray",
  };

  const handleCreateUser = () => {
    if (!fullName || !email || !role || !company) return;

    const newUser = {
      name: fullName,
      email,
      role,
      roleColor: roleColors[role],
      company,
      status: status || "active",
      lastLogin: new Date().toLocaleDateString(),
    };

    addUser(newUser);
    resetForm();
    setOpen(false);
  };

  // Edit user
  const handleEditUser = (index: number) => {
    const user = users[index];
    setFullName(user.name);
    setEmail(user.email);
    setRole(user.role);
    setCompany(user.company);
    setStatus(user.status);
    setEditingUserIndex(index);
    setEditOpen(true);
  };

  const handleUpdateUser = () => {
    if (editingUserIndex === null) return;

    const updatedUser = {
      name: fullName,
      email,
      role: role || "",
      roleColor: roleColors[role || "Staff"],
      company: company || "",
      status: status || "active",
      lastLogin: users[editingUserIndex].lastLogin,
    };

    updateUser(editingUserIndex, updatedUser);
    resetForm();
    setEditOpen(false);
    setEditingUserIndex(null);
  };

  const resetForm = () => {
    setFullName("");
    setEmail("");
    setRole(null);
    setCompany(null);
    setStatus("active");
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase());

    const matchesRole = roleFilter ? user.role === roleFilter : true;

    return matchesSearch && matchesRole;
  });

  return (
    <div style={{ padding: "24px" }}>
      <Group justify="space-between" mb="md">
        <Text fw={600} fz="xl">
          User Management
        </Text>
        <Button
          leftSection={<IconPlus size={16} />}
          color="#0A6802"
          onClick={() => setOpen(true)}
        >
          Add User
        </Button>
      </Group>

      <Paper
        shadow="sm"
        radius="md"
        p="lg"
        withBorder
        style={{ backgroundColor: "#f6fff6" }}
      >
        <Text fw={500} mb={4}>
          Users
        </Text>
        <Text fz="sm" c="dimmed" mb="md">
          Manage user accounts, roles, and permissions
        </Text>

        <Group mb="md" gap="md">
          <TextInput
            placeholder="Search users..."
            leftSection={<IconSearch size={16} />}
            value={search}
            onChange={(e) => setSearch(e.currentTarget.value)}
          />
          <Select
            placeholder="All Roles"
            data={["Super Admin", "Company Admin", "Accounts User", "Staff"]}
            value={roleFilter}
            onChange={setRoleFilter}
            clearable
          />
        </Group>

        <Table highlightOnHover withTableBorder>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>User</Table.Th>
              <Table.Th>Role</Table.Th>
              <Table.Th>Company</Table.Th>
              <Table.Th>Status</Table.Th>
              <Table.Th>Last Login</Table.Th>
              <Table.Th>Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {filteredUsers.length > 0 ? (
              filteredUsers.map((user, index) => (
                <Table.Tr key={index}>
                  <Table.Td>
                    <Flex direction="row" gap="sm" align="center">
                      <Avatar size="sm" color="gray" radius="xl">
                        <IconUser size={16} />
                      </Avatar>
                      <div>
                        <Text fw={500}>{user.name}</Text>
                        <Text fz="sm" c="dimmed">
                          {user.email}
                        </Text>
                      </div>
                    </Flex>
                  </Table.Td>
                  <Table.Td>
                    <Badge color={user.roleColor} variant="filled">
                      {user.role}
                    </Badge>
                  </Table.Td>
                  <Table.Td>{user.company}</Table.Td>
                  <Table.Td>
                    <Badge
                      color={user.status === "active" ? "#819E00" : "gray"}
                      variant="filled"
                    >
                      {user.status}
                    </Badge>
                  </Table.Td>
                  <Table.Td>{user.lastLogin}</Table.Td>
                  <Table.Td>
                    <Group gap="xs">
                      <ActionIcon
                        variant="light"
                        color="#0A6802"
                        onClick={() => handleEditUser(index)}
                      >
                        <IconEdit size={16} />
                      </ActionIcon>
                      <ActionIcon
                        variant="light"
                        color="red"
                        onClick={() => deleteUser(index)}
                      >
                        <IconTrash size={16} />
                      </ActionIcon>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))
            ) : (
              <Table.Tr>
                <Table.Td colSpan={6}>
                  <Text ta="center" c="dimmed">
                    No users found
                  </Text>
                </Table.Td>
              </Table.Tr>
            )}
          </Table.Tbody>
        </Table>
      </Paper>

      <Modal
        opened={open}
        onClose={() => setOpen(false)}
        title="Add New User"
        centered
        size="lg"
      >
        <Text fz="sm" c="dimmed" mb="md">
          Create a new user account. Assign appropriate role and permissions.
        </Text>
        <TextInput
          label="Full Name"
          value={fullName}
          onChange={(e) => setFullName(e.currentTarget.value)}
          mb="md"
        />
        <TextInput
          label="Email"
          value={email}
          onChange={(e) => setEmail(e.currentTarget.value)}
          mb="md"
        />
        <Select
          label="Role"
          data={["Super Admin", "Company Admin", "Accounts User", "Staff"]}
          value={role}
          onChange={setRole}
          mb="md"
        />
        <Select
          label="Company"
          data={[
            "Acme Corporation",
            "TechStart Solutions",
            "Global Enterprises",
          ]}
          value={company}
          onChange={setCompany}
          mb="md"
        />
        <Select
          label="Status"
          data={["active", "inactive"]}
          value={status}
          onChange={setStatus}
          mb="md"
        />
        <Group justify="flex-end" mt="lg">
          <Button color="green" onClick={handleCreateUser}>
            Create User
          </Button>
        </Group>
      </Modal>

      <Modal
        opened={editOpen}
        onClose={() => setEditOpen(false)}
        title="Edit User"
        centered
        size="lg"
      >
        <Text fz="sm" c="dimmed" mb="md">
          Update user details and permissions.
        </Text>
        <TextInput
          label="Full Name"
          value={fullName}
          onChange={(e) => setFullName(e.currentTarget.value)}
          mb="md"
        />
        <TextInput
          label="Email"
          value={email}
          onChange={(e) => setEmail(e.currentTarget.value)}
          mb="md"
        />
        <Select
          label="Role"
          data={["Super Admin", "Company Admin", "Accounts User", "Staff"]}
          value={role}
          onChange={setRole}
          mb="md"
        />
        <Select
          label="Company"
          data={[
            "Acme Corporation",
            "TechStart Solutions",
            "Global Enterprises",
          ]}
          value={company}
          onChange={setCompany}
          mb="md"
        />
        <Select
          label="Status"
          data={["active", "inactive"]}
          value={status}
          onChange={setStatus}
          mb="md"
        />
        <Group justify="flex-end" mt="lg">
          <Button color="blue" onClick={handleUpdateUser}>
            Update User
          </Button>
        </Group>
      </Modal>
    </div>
  );
}
