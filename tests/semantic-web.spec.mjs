import { expect, test } from "@playwright/test";

test.describe("semantic web fit assistant", () => {
  test("loads the RDF profile and initial UI", async ({ page }) => {
    await page.goto("/semantic-web/");

    await expect(page.getByRole("heading", { name: "Ask where Sathish fits, and where he does not." })).toBeVisible();
    await expect(page.locator("#rdfStatus")).toHaveText("862 triples");
    await expect(page.locator("#wasmStatus")).toHaveText("Available");
    await expect(page.getByRole("button", { name: "Assess" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Load WebGPU LLM" })).toBeVisible();
  });

  test("assesses medtech founder fit from RDF evidence", async ({ page }) => {
    await page.goto("/semantic-web/");

    await page.getByRole("button", { name: "Assess" }).click();

    const answer = page.locator("#answer");
    await expect(answer).toContainText("MedTech founder / biodesign program");
    await expect(answer).toContainText("Strong fit");
    await expect(answer).toContainText("Medical Device Software (domain:MedicalDeviceSoftware)");
    await expect(answer).toContainText("MEG Maps Platform and Medical Device Software Infrastructure");
    await expect(answer).toContainText("Technology Lead (role:ScopeImpactTechnologyLead)");
    await expect(answer).toContainText("Make commercial ownership and founder-level accountability explicit.");
  });

  test("can say when a target is a weak fit", async ({ page }) => {
    await page.goto("/semantic-web/");

    await page
      .getByLabel("Role, program, opportunity, or concern")
      .fill("Is Sathish suitable for frontend brand design?");
    await page.getByRole("button", { name: "Assess" }).click();

    const answer = page.locator("#answer");
    await expect(answer).toContainText("Frontend brand / visual design specialist");
    await expect(answer).toContainText("Weak fit");
    await expect(answer).toContainText("React (skill:React)");
    await expect(answer).toContainText("Better fit for product engineering than pure brand or visual design.");
  });

  test("keeps unsupported targets weak instead of borrowing unrelated evidence", async ({ page }) => {
    await page.goto("/semantic-web/");

    await page
      .getByLabel("Role, program, opportunity, or concern")
      .fill("Is he suitable for hardware electronics design?");
    await page.getByRole("button", { name: "Assess" }).click();

    const answer = page.locator("#answer");
    await expect(answer).toContainText("Unclear target / insufficient RDF match");
    await expect(answer).toContainText("Weak fit");
    await expect(answer).toContainText("The RDF does not show enough target-specific evidence for this question.");
    await expect(answer).not.toContainText("Strong fit");
  });

  test("does not invent current employment for date-like questions", async ({ page }) => {
    await page.goto("/semantic-web/");

    await page
      .getByLabel("Role, program, opportunity, or concern")
      .fill("Is he currently at MEGIN?");
    await page.getByRole("button", { name: "Assess" }).click();

    const answer = page.locator("#answer");
    await expect(answer).toContainText("Unclear target / insufficient RDF match");
    await expect(answer).toContainText("Weak fit");
    await expect(answer).toContainText("The RDF does not show enough target-specific evidence for this question.");
    await expect(answer).not.toContainText("Strong fit");
  });

  test("answers RDF date fact questions from role end dates", async ({ page }) => {
    await page.goto("/semantic-web/");

    await page
      .getByLabel("Role, program, opportunity, or concern")
      .fill("What ended in October 2025?");
    await page.getByRole("button", { name: "Assess" }).click();

    const answer = page.locator("#answer");
    await expect(answer).toContainText("RDF date fact");
    await expect(answer).toContainText("Senior Software Developer / Architect at MEGIN ended in October 2025.");
    await expect(answer).toContainText("role:MeginSeniorSoftwareDeveloperArchitect");
    await expect(answer).toContainText("org:MEGIN");
  });

  test("example chips update and assess the question", async ({ page }) => {
    await page.goto("/semantic-web/");

    await page.getByRole("button", { name: "Cloud architect" }).click();

    await expect(page.getByLabel("Role, program, opportunity, or concern")).toHaveValue(
      "Is Sathish suitable for cloud platform architect roles?"
    );
    await expect(page.locator("#answer")).toContainText("Cloud platform / regulated infrastructure architect");
    await expect(page.locator("#answer")).toContainText("AWS (skill:AWS)");
    await expect(page.locator("#answer")).toContainText("Terraform (skill:Terraform)");
  });

  test("renders browser-local LLM output with runtime metadata when WebLLM is loaded", async ({ page }) => {
    await page.route("https://esm.run/@mlc-ai/web-llm", async (route) => {
      await route.fulfill({
        contentType: "application/javascript",
        body: `
          export async function CreateMLCEngine(modelId, options) {
            options?.initProgressCallback?.({ progress: 1 });
            return {
              chat: {
                completions: {
                  async create() {
                    return {
                      choices: [{
                        message: {
                          content: [
                            "Fit: Strong fit",
                            "Why: Medical Device Software (domain:MedicalDeviceSoftware) and Regulated Healthcare (domain:RegulatedHealthcare) support the fit.",
                            "Gaps: Make commercial ownership and founder-level accountability explicit. | Add concrete clinical discovery stories, not only platform achievements.",
                            "Positioning: Research-to-product healthcare technologist with regulated medical software, digital health, and clinical workflow exposure."
                          ].join("\\n")
                        }
                      }]
                    };
                  }
                }
              }
            };
          }
        `
      });
    });

    await page.goto("/semantic-web/");
    await page.getByRole("button", { name: "Load WebGPU LLM" }).click();
    await expect(page.locator("#llmStatus")).toHaveText("Ready");

    await page.getByRole("button", { name: "Assess" }).click();

    const answer = page.locator("#answer");
    await expect(answer).toContainText("Browser-local LLM rendering");
    await expect(answer).toContainText("Guard passed");
    await expect(answer).toContainText("Model: SmolLM2-1.7B-Instruct-q4f16_1-MLC");
    await expect(answer).toContainText("Runtime: WebGPU + WebAssembly");
    await expect(answer).toContainText("Network: model fetch only");
    await expect(answer).toContainText("Fit: Strong fit");
  });

  test("does not load the browser LLM during deterministic smoke tests", async ({ page }) => {
    await page.goto("/semantic-web/");

    await expect(page.locator("#llmStatus")).toHaveText("Optional");
    await expect(page.locator("#answer")).toContainText("Grounded fit assessment will appear here.");
  });
});
