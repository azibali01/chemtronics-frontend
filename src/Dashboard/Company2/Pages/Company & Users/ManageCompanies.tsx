import {
  Box,
  Button,
  Card,
  Group,
  Table,
  Text,
  TextInput,
  Badge,
  ScrollArea,
  Modal,
  ActionIcon,
} from "@mantine/core";
import { useState } from "react";
import {
  IconSearch,
  IconBuildingSkyscraper,
  IconEdit,
  IconTrash,
} from "@tabler/icons-react";
import { useCompanyContextCompany2 } from "../../Context/Company & Users/CompanyContextCompany2";

export default function ManageCompaniesCompany2() {
  const { companies, addCompany, updateCompany, deleteCompany } =
    useCompanyContextCompany2();

  const [search, setSearch] = useState("");
  const [opened, setOpened] = useState(false);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [form, setForm] = useState({
    name: "",
    address: "",
    email: "",
    phone: "",
    users: 0,
    status: "active" as "active" | "inactive",
    created: new Date().toLocaleDateString(),
  });

  const filteredCompanies = companies.filter((c) =>
    [c.name, c.email, c.phone, c.address].some((field) =>
      field.toLowerCase().includes(search.toLowerCase())
    )
  );

  const handleSubmit = () => {
    if (editIndex !== null) {
      updateCompany(editIndex, form);
      setEditIndex(null);
    } else {
      addCompany(form);
    }
    setForm({
      name: "",
      address: "",
      email: "",
      phone: "",
      users: 0,
      status: "active",
      created: new Date().toLocaleDateString(),
    });
    setOpened(false);
  };

  const handleEdit = (idx: number) => {
    setEditIndex(idx);
    setForm(companies[idx]);
    setOpened(true);
  };

  const handleDelete = (idx: number) => {
    deleteCompany(idx);
  };

  return (
    <Box>
      <Group justify="space-between" mb="md">
        <Text fw={600} fz="xl">
          Manage Companies
        </Text>
        <Button color="#0A6802" onClick={() => setOpened(true)}>
          Add Company
        </Button>
      </Group>
      <TextInput
        placeholder="Search companies..."
        value={search}
        onChange={(e) => setSearch(e.currentTarget.value)}
        leftSection={<IconSearch size={16} />}
        mb="md"
      />
      <ScrollArea>
        <Table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Address</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Users</th>
              <th>Status</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredCompanies.map((company, idx) => (
              <tr key={idx}>
                <td>{company.name}</td>
                <td>{company.address}</td>
                <td>{company.email}</td>
                <td>{company.phone}</td>
                <td>{company.users}</td>
                <td>
                  <Badge color={company.status === "active" ? "green" : "red"}>
                    {company.status}
                  </Badge>
                </td>
                <td>{company.created}</td>
                <td>
                  <Group gap={4}>
                    <ActionIcon color="blue" onClick={() => handleEdit(idx)}>
                      <IconEdit size={16} />
                    </ActionIcon>
                    <ActionIcon color="red" onClick={() => handleDelete(idx)}>
                      <IconTrash size={16} />
                    </ActionIcon>
                  </Group>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </ScrollArea>
      <Modal
        opened={opened}
        onClose={() => setOpened(false)}
        title={editIndex !== null ? "Edit Company" : "Add Company"}
      >
        <Stack>
          <TextInput
            label="Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.currentTarget.value })}
          />
          <TextInput
            label="Address"
            value={form.address}
            onChange={(e) =>
              setForm({ ...form, address: e.currentTarget.value })
            }
          />
          <TextInput
            label="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.currentTarget.value })}
          />
          <TextInput
            label="Phone"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.currentTarget.value })}
          />
          <TextInput
            label="Users"
            type="number"
            value={form.users}
            onChange={(e) =>
              setForm({ ...form, users: Number(e.currentTarget.value) })
            }
          />
          <Group>
            <Button color="#0A6802" onClick={handleSubmit}>
              {editIndex !== null ? "Update" : "Add"}
            </Button>
            <Button variant="outline" onClick={() => setOpened(false)}>
              Cancel
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Box>
  );
}
