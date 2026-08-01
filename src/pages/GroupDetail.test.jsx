import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AuthProvider } from "../context/AuthContext";
import { GroupDetail } from "./GroupDetail";

vi.mock("../api/api", () => {
  const api = {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
  };
  return { api, setAuthToken: vi.fn(), setUnauthorizedHandler: vi.fn() };
});

import { api } from "../api/api";

const group = {
  id: 3,
  name: "Weekend Trip",
  created_by: 1,
  created_at: "2026-01-01T00:00:00Z",
  members: [
    { id: 1, name: "Test User", email: "test@example.com" },
    { id: 2, name: "Friend B", email: "friend-b@example.com" },
  ],
};

function renderGroupDetail() {
  return render(
    <MemoryRouter initialEntries={["/groups/3"]}>
      <AuthProvider>
        <Routes>
          <Route path="/groups/:groupId" element={<GroupDetail />} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  );
}

describe("GroupDetail member search", () => {
  beforeEach(() => {
    localStorage.setItem("token", "abc123");
    api.get.mockImplementation((path) => {
      if (path === "/auth/me") {
        return Promise.resolve({
          data: { user: { id: 1, name: "Test User", email: "test@example.com", currency: "USD" } },
        });
      }
      if (path === `/groups/${group.id}`) return Promise.resolve({ data: { group } });
      if (path === `/api/groups/${group.id}/expenses`) {
        return Promise.resolve({ data: { expenses: [] } });
      }
      if (path.startsWith("/friends/search")) return Promise.resolve({ data: { users: [] } });
      if (path === "/api/notifications") return Promise.resolve({ data: [] });
      return Promise.resolve({ data: [] });
    });
  });

  afterEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it("shows a clear no-results message instead of hanging for a nonexistent email", async () => {
    renderGroupDetail();

    const input = await screen.findByPlaceholderText("Search by email…");
    await userEvent.type(input, "nobody@nowhere.com");

    await waitFor(() => {
      expect(screen.getByText("No user found with that email.")).toBeInTheDocument();
    });
    expect(screen.queryByText("Searching…")).not.toBeInTheDocument();
  });

  it("resets the loading state and lists matching users when the email exists", async () => {
    api.get.mockImplementation((path) => {
      if (path === "/auth/me") {
        return Promise.resolve({
          data: { user: { id: 1, name: "Test User", email: "test@example.com", currency: "USD" } },
        });
      }
      if (path === `/groups/${group.id}`) return Promise.resolve({ data: { group } });
      if (path === `/api/groups/${group.id}/expenses`) {
        return Promise.resolve({ data: { expenses: [] } });
      }
      if (path.startsWith("/friends/search")) {
        return Promise.resolve({
          data: {
            users: [{ id: 9, name: "Found User", email: "found@example.com" }],
          },
        });
      }
      if (path === "/api/notifications") return Promise.resolve({ data: [] });
      return Promise.resolve({ data: [] });
    });

    renderGroupDetail();

    const input = await screen.findByPlaceholderText("Search by email…");
    await userEvent.type(input, "found@example.com");

    await waitFor(() => {
      expect(screen.getByText("Found User")).toBeInTheDocument();
    });
    expect(screen.getByText("found@example.com")).toBeInTheDocument();
    expect(screen.queryByText("Searching…")).not.toBeInTheDocument();
    expect(screen.queryByText("No user found with that email.")).not.toBeInTheDocument();
  });
});
