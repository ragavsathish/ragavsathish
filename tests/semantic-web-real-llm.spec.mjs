import { expect, test } from "@playwright/test";

test.use({
  channel: "chrome",
  launchOptions: {
    args: ["--enable-unsafe-webgpu", "--enable-dawn-features=allow_unsafe_apis"]
  }
});

test.describe("semantic web fit assistant real LLM path", () => {
  test.skip(process.env.RUN_REAL_LLM !== "1", "Set RUN_REAL_LLM=1 to download and run the browser LLM model.");
  test.setTimeout(240_000);

  test("downloads a browser LLM and keeps the RDF answer authoritative", async ({ page }) => {
    await page.goto("/semantic-web/");

    await expect(page.locator("#rdfStatus")).toHaveText("970 triples");
    await expect(page.locator("#gpuStatus")).toHaveText("Available");
    await expect(page.locator("#wasmStatus")).toHaveText("Available");

    await page.getByRole("button", { name: "Load browser LLM" }).click();
    await expect.poll(
      async () => page.locator("#llmStatus").textContent(),
      { timeout: 180_000 }
    ).toMatch(/^(Ready|Unavailable)$/);

    const status = await page.locator("#llmStatus").textContent();
    test.skip(status === "Unavailable", "This Playwright browser cannot run the WebGPU or WASM browser LLM path.");

    await page
      .getByLabel("Role, program, opportunity, or concern")
      .fill("Would Sathish fit a health AI product lead role?");
    await page.getByRole("button", { name: "Assess" }).click();

    const answer = page.locator("#answer");
    await expect(answer).toContainText("Health AI product / technology lead", { timeout: 90_000 });
    await expect(answer).toContainText("Strong fit");
    await expect(answer).toContainText("Guard passed");
    await expect(answer).toContainText("AI-enabled Healthcare (domain:AIEnabledHealthcare)");
    await expect(answer).toContainText("Why: AI-enabled Healthcare (domain:AIEnabledHealthcare); Digital Health (domain:DigitalHealth); Climate and Health (domain:ClimateHealth).");
    await expect(answer).toContainText("Digital health technical lead who can connect AI-enabled self-care, guardrailed chatbot evaluation, offline-first retrieval, and healthcare access mission.");
    await expect(answer).toContainText("Browser-local LLM rendering");
    await expect(answer).toContainText(/Runtime: (WebGPU \+ WebAssembly|WebGPU via Transformers\.js|WebAssembly CPU)/);
    await expect(answer).not.toContainText("RDF-derived facts:");
  });
});
