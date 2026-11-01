import React from "react";
import { Link } from "react-router-dom";
import styled from "styled-components";
import { Button } from "../styles";

function NavBar({ user, setUser }) {
  async function handleLogoutClick() {
    try {
      const response = await fetch("/logout", { method: "DELETE" });
      if (response.ok) {
        setUser(null);
      }
    } catch (error) {
      console.error("Could not log out:", error);
    }
  }

  return (
    <Wrapper>
      <Logo>
        <Link to="/">SessionFit</Link>
      </Logo>
      <Nav>
        <UserName>{user.username}</UserName>
        <Button variant="outline" onClick={handleLogoutClick}>Log out</Button>
      </Nav>
    </Wrapper>
  );
}

const Wrapper = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 18px max(24px, calc((100% - 1120px) / 2));
  border-bottom: 1px solid #e6ebe7;
  background: #fff;
  @media (max-width: 600px) { padding: 16px; }
`;

const Logo = styled.h1`
  font-size: 1.3rem;
  letter-spacing: -0.5px;
  color: #1d382b;
  margin: 0;
  font-weight: 850;

  a {
    color: inherit;
    text-decoration: none;
  }
`;

const Nav = styled.nav`
  display: flex;
  gap: 14px;
  align-items: center;
`;

const UserName = styled.span`
  color: #66776d;
  font-size: 13px;
  @media (max-width: 420px) { display: none; }
`;

export default NavBar;
