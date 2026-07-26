import { expect, test } from "@playwright/test";

test.use({
  launchOptions: {
    args: ["--enable-unsafe-webgpu", "--enable-features=Vulkan"]
  }
});

test.describe("semantic web fit assistant real LLM path", () => {
  test.skip(process.env.RUN_REAL_LLM !== "1", "Set RUN_REAL_LLM=1 to download and run the browser WebGPU model.");
  test.setTimeout(240_000);

  test("downloads the WebGPU LLM and keeps the RDF answer authoritative", async ({ page }) => {
    await page.goto("/semantic-web/");

    await expect(page.locator("#rdfStatus")).toHaveText("574 triples");
    await expect(page.locator("#gpuStatus")).toHaveText("Available");

    await page.getByRole("button", { name: "Load WebGPU LLM" }).click();
    await expect.poll(
      async () => page.locator("#llmStatus").textContent(),
      { timeout: 180_000 }
    ).toMatch(/^(Ready|Unavailable)$/);

    const status = await page.locator("#llmStatus").textContent();
    test.skip(status === "Unavailable", "This Playwright browser cannot run the WebGPU/WebLLM model path.");

    await page
      .getByLabel("Role, program, opportunity, or concern")
      .fill("Would Sathish fit a health AI product lead role?");
    await page.getByRole("button", { name: "Assess" }).click();

    const answer = page.locator("#answer");
    await expect(answer).toContainText("Health AI product / technology lead", { timeout: 90_000 });
    await expect(answer).toContainText("Strong fit");
    await expect(answer).toContainText("AI-enabled Healthcare (domain:AIEnabledHealthcare)");
    await expect(answer).toContainText("Digital health technical lead who can connect AI-enabled product direction with privacy-aware architecture and healthcare purpose.");
    await expect(answer).toContainText(/Local LLM (answer|guard)/);
  });
});
