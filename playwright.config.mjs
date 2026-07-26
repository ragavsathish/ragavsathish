import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  timeout: 30_000,
  expect: {
    timeout: 10_000
  },
  use: {
    baseURL: "http://127.0.0.1:8765",
    trace: "on-first-retry"
  },
  webServer: {
    command: "python3 -m http.server 8765",
    url: "http://127.0.0.1:8765/semantic-web/",
    reuseExistingServer: !process.env.CI,
    timeout: 20_000
  }
});
