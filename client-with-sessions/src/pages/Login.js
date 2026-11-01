import { useState } from "react";
import styled from "styled-components";
import LoginForm from "../components/LoginForm";
import SignUpForm from "../components/SignUpForm";
import { Button } from "../styles";

function Login({ onLogin }) {
  const [showLogin, setShowLogin] = useState(true);

  return (
    <Wrapper>
      <Logo>SessionFit</Logo>
      <Intro>Build a stronger habit, one workout at a time.</Intro>
      {showLogin ? (
        <>
          <LoginForm onLogin={onLogin} />
          <Divider />
          <p>
            Don't have an account? &nbsp;
            <Button color="secondary" onClick={() => setShowLogin(false)}>
              Sign Up
            </Button>
          </p>
        </>
      ) : (
        <>
          <SignUpForm onLogin={onLogin} />
          <Divider />
          <p>
            Already have an account? &nbsp;
            <Button color="secondary" onClick={() => setShowLogin(true)}>
              Log In
            </Button>
          </p>
        </>
      )}
    </Wrapper>
  );
}

const Logo = styled.h1`
  font-size: 2.4rem;
  letter-spacing: -1.5px;
  color: #1d382b;
  margin: 8px 0 4px;
`;

const Wrapper = styled.section`
  max-width: 460px;
  margin: 64px auto;
  padding: 32px;
  background: white;
  border: 1px solid #e6ebe7;
  border-radius: 16px;
  box-shadow: 0 12px 40px rgba(34, 57, 44, 0.07);
  @media(max-width: 520px) { margin: 24px 16px; padding: 24px; }
`;

const Intro = styled.p`
  color: #78877e;
  margin: 0 0 26px;
`;

const Divider = styled.hr`
  border: none;
  border-bottom: 1px solid #e6ebe7;
  margin: 24px 0 18px;
`;

export default Login;
