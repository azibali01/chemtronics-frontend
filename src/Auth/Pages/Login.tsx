import { useForm } from "@mantine/form";
import {
  TextInput,
  Button,
  Card,
  Title,
  Stack,
  Text,
  PasswordInput,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useDisclosure } from "@mantine/hooks";
import { useState } from "react";
import { useAuth } from "../Context/AuthContext";
import { useNavigate } from "react-router";
import axios from "axios";

const Login = () => {
  const { login } = useAuth();
  const [visible, { toggle }] = useDisclosure(false);
  const [email, setEmail] = useState("");
  const navigate = useNavigate();
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    try {
      const res = await axios.post("/api/login", { email, password });
      if (res.status === 200) {
        login({ id: "1", email, name: "User" });
        navigate("/dashboard");
      } else {
        notifications.show({ message: "Login failed", color: "red" });
      }
    } catch {
      notifications.show({ message: "Login failed", color: "red" });
    }
  };

  const form = useForm({
    mode: "uncontrolled",
    initialValues: { email: "" },
    validate: {
      email: (value) => (/^\S+@\S+$/.test(value) ? null : "Invalid email"),
    },
  });

  const handleError = (errors: typeof form.errors) => {
    if (errors.email) {
      notifications.show({
        message: "Please provide a valid email",
        color: "red",
      });
    }
  };

  return (
    <Card
      withBorder
      shadow="md"
      w={400}
      h={400}
      style={{
        display: "flex",
        justifyContent: "center",
        backgroundColor: "#2A2A2A", // card background
        borderColor: "#b68d40", // gold border
      }}
    >
      <Stack align="center" justify="center">
        <form onSubmit={form.onSubmit(console.log, handleError)}>
          <Stack justify="center" gap={10}>
            <Stack justify="center" align="center" gap={10}>
              <Title order={3} c="#f4ebd0">
                Point of Sale
              </Title>
              <Text c="#d6ad60">Sign in to your account</Text>
            </Stack>

            <TextInput
              value={email}
              onChange={(event) => setEmail(event.currentTarget.value)}
              w={350}
              label="Email"
              placeholder="Email"
              styles={{
                label: { color: "#f4ebd0" },
                input: { backgroundColor: "#1E1E1E", color: "#f4ebd0" },
              }}
            />

            <PasswordInput
              value={password}
              onChange={(event) => setPassword(event.currentTarget.value)}
              label="Password"
              placeholder="Enter your password"
              visible={visible}
              onVisibilityChange={toggle}
              styles={{
                label: { color: "#f4ebd0" },
                input: { backgroundColor: "#1E1E1E", color: "#f4ebd0" },
              }}
            />

            <Button
              fullWidth
              mt="sm"
              color="#b68d40"
              onClick={handleLogin}
              // styles={{
              //   root: {
              //     backgroundColor: "#b68d40",
              //     "&:hover": { backgroundColor: "#d6ad60" },
              //     color: "#1E1E1E",
              //   },
              // }}
            >
              Login
            </Button>
          </Stack>
        </form>
      </Stack>
    </Card>
  );
};

export default Login;
