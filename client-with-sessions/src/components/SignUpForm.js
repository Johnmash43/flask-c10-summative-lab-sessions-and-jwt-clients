import React, { useState } from "react";
import { readApiResponse } from "../api";
import { Button, Error, Input, FormField, Label } from "../styles";

function SignUpForm({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [errors, setErrors] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setErrors([]);
    setIsLoading(true);
    try {
      const data = await readApiResponse(await fetch("/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          password,
          password_confirmation: passwordConfirmation,
        }),
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
          autoComplete="off"
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
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
        />
      </FormField>
      <FormField>
        <Label htmlFor="password_confirmation">Password Confirmation</Label>
        <Input
          type="password"
          id="password_confirmation"
          value={passwordConfirmation}
          onChange={(e) => setPasswordConfirmation(e.target.value)}
          autoComplete="current-password"
          required
        />
      </FormField>
      <FormField>
        <Button type="submit" disabled={isLoading}>{isLoading ? "Creating account..." : "Sign Up"}</Button>
      </FormField>
      <FormField>
        {errors.map((err) => (
          <Error key={err}>{err}</Error>
        ))}
      </FormField>
    </form>
  );
}

export default SignUpForm;
