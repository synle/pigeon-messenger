import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import App from "./App";
import { ThemeProvider, createTheme } from "@mui/material";

const theme = createTheme();

const mockFetch = (body: unknown, init?: { status?: number }) =>
  vi.fn(
    async () =>
      new Response(JSON.stringify(body), {
        status: init?.status ?? 200,
        headers: { "Content-Type": "application/json" },
      }),
  ) as unknown as typeof fetch;

beforeEach(() => {
  // Default: empty connections list. Tests can override per case.
  globalThis.fetch = mockFetch([]);
});

/** Smoke tests for the top-level App component. */
describe("App", () => {
  it("renders the nav bar with Inbox, Connections, and Settings links", () => {
    render(
      <ThemeProvider theme={theme}>
        <MemoryRouter initialEntries={["/"]}>
          <App />
        </MemoryRouter>
      </ThemeProvider>,
    );
    // The MUI Buttons in NavBar render as <a> (component={RouterLink}),
    // so they have role="link", not "button".
    expect(screen.getByText("Pigeon Messenger")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /inbox/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /^connections$/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /settings/i })).toBeInTheDocument();
  });

  it("renders the Inbox empty state when no connections exist", async () => {
    render(
      <ThemeProvider theme={theme}>
        <MemoryRouter initialEntries={["/"]}>
          <App />
        </MemoryRouter>
      </ThemeProvider>,
    );
    await waitFor(() => expect(screen.getByText(/no connections yet/i)).toBeInTheDocument());
  });

  it("renders the Settings page when navigated to /settings", () => {
    render(
      <ThemeProvider theme={theme}>
        <MemoryRouter initialEntries={["/settings"]}>
          <App />
        </MemoryRouter>
      </ThemeProvider>,
    );
    expect(screen.getByRole("heading", { name: "Settings" })).toBeInTheDocument();
  });

  it("renders the Connections page header", async () => {
    render(
      <ThemeProvider theme={theme}>
        <MemoryRouter initialEntries={["/connections"]}>
          <App />
        </MemoryRouter>
      </ThemeProvider>,
    );
    expect(screen.getByRole("heading", { name: "Connections" })).toBeInTheDocument();
  });
});
