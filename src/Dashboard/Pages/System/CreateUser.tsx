// src/pages/CreateUser.tsx
import { useState } from "react";
import {
  Paper,
  Group,
  Text,
  TextInput,
  PasswordInput,
  Select,
  Button,
  Anchor,
  Card,
} from "@mantine/core";

export default function CreateUser() {
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [type, setType] = useState("User");

  return (
    <Paper
      shadow="md"
      radius="md"
      p="md"
      withBorder
      style={{
        backgroundColor: "#1f232c",
        borderColor: "#83746e",
        color: "#dfd6d1",
        maxWidth: "600px",
        margin: "0 auto",
      }}
    >
      {/* Header */}
      <Card
        shadow="sm"
        padding="lg"
        style={{
          backgroundColor: "#1f232c",
          color: "#dfd6d1",
        }}
      >
        <Text
          fw={600}
          size="lg"
          style={{ marginBottom: "1rem", color: "#dfd6d1" }}
        >
          Create User
        </Text>

        {/* Form */}

        <TextInput
          label="Name:"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.currentTarget.value)}
          styles={{
            input: {
              backgroundColor: "#1f232c",
              color: "#dfd6d1",
              border: "1px solid #83746e",
            },
            label: { color: "#dfd6d1", fontWeight: 600 },
          }}
        />

        <PasswordInput
          mt="md"
          label="Password:"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.currentTarget.value)}
          styles={{
            input: {
              backgroundColor: "#1f232c",
              color: "#dfd6d1",
              border: "1px solid #83746e",
            },
            label: { color: "#dfd6d1", fontWeight: 600 },
          }}
        />

        <Select
          mt="md"
          label="Type:"
          value={type}
          onChange={(val) => setType(val || "User")}
          data={["User", "Admin", "Manager"]}
          styles={{
            input: {
              backgroundColor: "#1f232c",
              color: "#dfd6d1",
              border: "1px solid #83746e",
            },
            label: { color: "#dfd6d1", fontWeight: 600 },
            dropdown: { backgroundColor: "#1f232c", color: "#dfd6d1" },
            option: { "&[data-hovered]": { background: "#83746e" } },
          }}
        />

        <Select
          mt="md"
          label="Account Head:"
          placeholder="-- Select Account Head --"
          data={["Head 1", "Head 2"]}
          styles={{
            input: {
              backgroundColor: "#1f232c",
              color: "#dfd6d1",
              border: "1px solid #83746e",
            },
            label: { color: "#dfd6d1", fontWeight: 600 },
            dropdown: { backgroundColor: "#1f232c", color: "#dfd6d1" },
            option: { "&[data-hovered]": { background: "#83746e" } },
          }}
        />

        {/* Footer */}
        <Group
          justify="space-between"
          px="md"
          py="sm"
          style={{ background: "#1f232c", borderTop: "1px solid #83746e" }}
        >
          <Anchor href="#" c="#dfd6d1" underline="hover">
            View Users
          </Anchor>
          <Button
            radius="sm"
            styles={{
              root: {
                background: "#d9534f",
                color: "#ffffff",
                "&:hover": {
                  background: "#c9302c",
                },
              },
            }}
          >
            Save
          </Button>
        </Group>
      </Card>
    </Paper>
  );
}
