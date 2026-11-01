import React, { useState } from "react";
import { readApiResponse } from "../api";
import { Button, Error, Input, FormField, Label } from "../styles";

function LoginForm({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setErrors([]);
    setIsLoading(true);
    try {
      const data = await readApiResponse(await fetch("/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      }));
      onLogin(data);
    } catch (error) {
      setErrors([error.message || "Unable to connect to the server. Please try again."]);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <FormField>
        <Label htmlFor="username">Username</Label>
        <Input
          type="text"
          id="username"
          autoComplete="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
      </FormField>
      <FormField>
        <Label htmlFor="password">Password</Label>
        <Input
          type="password"
          id="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </FormField>
      <FormField>
        <Button variant="fill" color="primary" type="submit" disabled={isLoading}>
          {isLoading ? "Loading..." : "Login"}
        </Button>
      </FormField>
      <FormField>
        {errors.map((err) => (
          <Error key={err}>{err}</Error>
        ))}
      </FormField>
    </form>
  );
}

export default LoginForm;
