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
import { useUserContextCompany2 } from "../../Context/Company & Users/UserContextCompany2";

export default function ManageUsersCompany2() {
  const { users, addUser, updateUser, deleteUser } = useUserContextCompany2();

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
    setFullName("");
    setEmail("");
    setRole(null);
    setCompany(null);
    setStatus("active");
    setOpen(false);
  };

  const handleEditUser = () => {
    if (editingUserIndex === null || !fullName || !email || !role || !company)
      return;
    const updatedUser = {
      name: fullName,
      email,
      role,
      roleColor: roleColors[role],
      company,
      status: status || "active",
      lastLogin: new Date().toLocaleDateString(),
    };
    updateUser(editingUserIndex, updatedUser);
    setEditingUserIndex(null);
    setFullName("");
    setEmail("");
    setRole(null);
    setCompany(null);
    setStatus("active");
    setEditOpen(false);
  };

  const handleEditClick = (idx: number) => {
    setEditingUserIndex(idx);
    const user = users[idx];
    setFullName(user.name);
    setEmail(user.email);
    setRole(user.role);
    setCompany(user.company);
    setStatus(user.status);
    setEditOpen(true);
  };

  const handleDeleteClick = (idx: number) => {
    deleteUser(idx);
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter ? u.role === roleFilter : true;
    return matchesSearch && matchesRole;
  });

  return (
    <Paper p="md">
      <Group justify="space-between" mb="md">
        <Text fw={600} fz="xl">
          Manage Users
        </Text>
        <Button
          color="#0A6802"
          leftSection={<IconPlus size={16} />}
          onClick={() => setOpen(true)}
        >
          Add User
        </Button>
      </Group>
      <Group mb="md">
        <TextInput
          placeholder="Search users..."
          value={search}
          onChange={(e) => setSearch(e.currentTarget.value)}
          leftSection={<IconSearch size={16} />}
        />
        <Select
          placeholder="Filter by role"
          data={Object.keys(roleColors)}
          value={roleFilter}
          onChange={setRoleFilter}
        />
      </Group>
      <Table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Company</th>
            <th>Status</th>
            <th>Last Login</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredUsers.map((user, idx) => (
            <tr key={idx}>
              <td>
                <Group gap={4}>
                  <Avatar color={user.roleColor} radius="xl" size={24}>
                    <IconUser size={16} />
                  </Avatar>
                  {user.name}
                </Group>
              </td>
              <td>{user.email}</td>
              <td>
                <Badge color={user.roleColor}>{user.role}</Badge>
              </td>
              <td>{user.company}</td>
              <td>
                <Badge color={user.status === "active" ? "green" : "red"}>
                  {user.status}
                </Badge>
              </td>
              <td>{user.lastLogin}</td>
              <td>
                <Group gap={4}>
                  <ActionIcon color="blue" onClick={() => handleEditClick(idx)}>
                    <IconEdit size={16} />
                  </ActionIcon>
                  <ActionIcon
                    color="red"
                    onClick={() => handleDeleteClick(idx)}
                  >
                    <IconTrash size={16} />
                  </ActionIcon>
                </Group>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
      <Modal opened={open} onClose={() => setOpen(false)} title="Add User">
        <Flex direction="column" gap="md">
          <TextInput
            label="Full Name"
            value={fullName}
            onChange={(e) => setFullName(e.currentTarget.value)}
          />
          <TextInput
            label="Email"
            value={email}
            onChange={(e) => setEmail(e.currentTarget.value)}
          />
          <Select
            label="Role"
            data={Object.keys(roleColors)}
            value={role}
            onChange={setRole}
          />
          <TextInput
            label="Company"
            value={company || ""}
            onChange={(e) => setCompany(e.currentTarget.value)}
          />
          <Select
            label="Status"
            data={["active", "inactive"]}
            value={status}
            onChange={setStatus}
          />
          <Group>
            <Button color="#0A6802" onClick={handleCreateUser}>
              Add
            </Button>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
          </Group>
        </Flex>
      </Modal>
      <Modal
        opened={editOpen}
        onClose={() => setEditOpen(false)}
        title="Edit User"
      >
        <Flex direction="column" gap="md">
          <TextInput
            label="Full Name"
            value={fullName}
            onChange={(e) => setFullName(e.currentTarget.value)}
          />
          <TextInput
            label="Email"
            value={email}
            onChange={(e) => setEmail(e.currentTarget.value)}
          />
          <Select
            label="Role"
            data={Object.keys(roleColors)}
            value={role}
            onChange={setRole}
          />
          <TextInput
            label="Company"
            value={company || ""}
            onChange={(e) => setCompany(e.currentTarget.value)}
          />
          <Select
            label="Status"
            data={["active", "inactive"]}
            value={status}
            onChange={setStatus}
          />
          <Group>
            <Button color="#0A6802" onClick={handleEditUser}>
              Update
            </Button>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
          </Group>
        </Flex>
      </Modal>
    </Paper>
  );
}
