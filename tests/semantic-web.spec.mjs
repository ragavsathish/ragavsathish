import { expect, test } from "@playwright/test";

test.describe("semantic web fit assistant", () => {
  test("loads the RDF profile and initial UI", async ({ page }) => {
    await page.goto("/semantic-web/");

    await expect(page.getByRole("heading", { name: "Ask where Sathish fits, and where he does not." })).toBeVisible();
    await expect(page.locator("#rdfStatus")).toHaveText("574 triples");
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
      .fill("What ended in July 2026?");
    await page.getByRole("button", { name: "Assess" }).click();

    const answer = page.locator("#answer");
    await expect(answer).toContainText("RDF date fact");
    await expect(answer).toContainText("Senior Software Developer / Architect at MEGIN ended in July 2026.");
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

  test("does not load the browser LLM during deterministic smoke tests", async ({ page }) => {
    await page.goto("/semantic-web/");

    await expect(page.locator("#llmStatus")).toHaveText("Optional");
    await expect(page.locator("#answer")).toContainText("Grounded fit assessment will appear here.");
  });
});
