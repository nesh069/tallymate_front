import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useNavigate } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";
import { AuthProvider } from "./context/AuthContext";

vi.mock("./api/api", () => {
  const api = {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
  };
  return { api, setAuthToken: vi.fn(), setUnauthorizedHandler: vi.fn() };
});

import { api } from "./api/api";

const me = {
  data: { user: { id: 1, name: "Test User", email: "test@example.com", currency: "USD" } },
};

function NavProbe() {
  useNavigate();
  return null;
}

function renderApp(initialPath) {
  let navigate;
  function Capture() {
    navigate = useNavigate();
    return null;
  }
  const utils = render(
    <MemoryRouter initialEntries={[initialPath]}>
      <AuthProvider>
        <Capture />
        <App />
      </AuthProvider>
    </MemoryRouter>,
  );
  return { ...utils, go: (path) => act(() => navigate(path)) };
}

describe("logout", () => {
  beforeEach(() => {
    api.get.mockImplementation((path) => {
      if (path === "/auth/me") return Promise.resolve(me);
      if (path === "/api/notifications") return Promise.resolve({ data: [] });
      return Promise.resolve({ data: [] });
    });
  });

  afterEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it("clears in-memory state and localStorage so /signup and /login stay reachable", async () => {
    localStorage.setItem("token", "abc123");
    localStorage.setItem("user", JSON.stringify({ id: 1, name: "Test User" }));
    localStorage.setItem("token_expiry", String(Date.now() / 1000 + 3600));

    const { go } = renderApp("/profile");

    const logoutButton = await screen.findByRole("button", { name: /log out/i });
    await userEvent.click(logoutButton);

    await screen.findByRole("heading", { name: "Welcome back" });
    expect(localStorage.getItem("token")).toBeNull();
    expect(localStorage.getItem("user")).toBeNull();
    expect(localStorage.getItem("token_expiry")).toBeNull();

    go("/signup");
    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Create your account" })).toBeInTheDocument();
    });
    expect(screen.queryByRole("button", { name: /log out/i })).not.toBeInTheDocument();

    go("/login");
    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Welcome back" })).toBeInTheDocument();
    });
    expect(screen.getByRole("heading", { name: "Welcome back" })).toBeInTheDocument();
  });

  it("does not block unauthenticated users from /signup and /login", async () => {
    renderApp("/signup");
    expect(await screen.findByRole("heading", { name: "Create your account" })).toBeInTheDocument();

    renderApp("/login");
    expect(await screen.findByRole("heading", { name: "Welcome back" })).toBeInTheDocument();
  });
});
