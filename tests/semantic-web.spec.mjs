import { expect, test } from "@playwright/test";

test.describe("semantic web fit assistant", () => {
  test("loads the RDF profile and initial UI", async ({ page }) => {
    await page.goto("/semantic-web/");

    await expect(page.getByRole("heading", { name: "rdf-fit" })).toBeVisible();
    await expect(page.locator("#rdfStatus")).toHaveText("935 triples");
    await expect(page.locator("#wasmStatus")).toHaveText("Available");
    await expect(page.getByRole("button", { name: "Assess" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Load browser LLM" })).toBeVisible();
    await expect(page.locator("#llmDetail")).toContainText("Tries WebLLM WebGPU, Transformers.js WebGPU, then WASM CPU.");
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

    await page.getByRole("button", { name: "cloud" }).click();

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
    await page.getByRole("button", { name: "Load browser LLM" }).click();
    await expect(page.locator("#llmStatus")).toHaveText("Ready");

    await page.getByRole("button", { name: "Assess" }).click();

    const answer = page.locator("#answer");
    await expect(answer).toContainText("Browser-local LLM rendering");
    await expect(answer).toContainText("Guard passed");
    await expect(answer).toContainText("Backend: WebLLM");
    await expect(answer).toContainText("Model: SmolLM2-1.7B-Instruct-q4f16_1-MLC");
    await expect(answer).toContainText("Runtime: WebGPU + WebAssembly");
    await expect(answer).toContainText("Network: model fetch only");
    await expect(answer).toContainText("Fit: Strong fit");
  });

  test("falls back to Transformers.js WebGPU when WebLLM shader support is missing", async ({ page }) => {
    await page.route("https://esm.run/@mlc-ai/web-llm", async (route) => {
      await route.fulfill({
        contentType: "application/javascript",
        body: `
          export async function CreateMLCEngine() {
            const error = new Error("This model requires WebGPU extension shader-f16.");
            error.name = "ShaderF16SupportError";
            throw error;
          }
        `
      });
    });
    await page.route("https://esm.run/@huggingface/transformers", async (route) => {
      await route.fulfill({
        contentType: "application/javascript",
        body: `
          export async function pipeline(task, modelId, options) {
            if (options?.device !== "webgpu") {
              throw new Error("Expected Transformers.js WebGPU first");
            }
            options?.progress_callback?.({ loaded: 1, total: 1 });
            return async function generate() {
              return [{
                generated_text: [
                  "Fit: Strong fit",
                  "Why: Medical Device Software (domain:MedicalDeviceSoftware) and Regulated Healthcare (domain:RegulatedHealthcare) support the fit.",
                  "Gaps: Make commercial ownership and founder-level accountability explicit. | Add concrete clinical discovery stories, not only platform achievements.",
                  "Positioning: Research-to-product healthcare technologist with regulated medical software, digital health, and clinical workflow exposure."
                ].join("\\n")
              }];
            };
          }
        `
      });
    });

    await page.goto("/semantic-web/");
    await page.getByRole("button", { name: "Load browser LLM" }).click();
    await expect(page.locator("#llmStatus")).toHaveText("Ready");
    await expect(page.locator("#llmDetail")).toContainText("WebLLM WebGPU failed: ShaderF16SupportError");
    await expect(page.locator("#llmDetail")).toContainText("Loaded Transformers.js WebGPU model onnx-community/SmolLM2-135M-Instruct-ONNX-MHA");

    await page.getByRole("button", { name: "Assess" }).click();

    const answer = page.locator("#answer");
    await expect(answer).toContainText("Browser-local LLM rendering");
    await expect(answer).toContainText("Guard passed");
    await expect(answer).toContainText("Backend: Transformers.js");
    await expect(answer).toContainText("Model: onnx-community/SmolLM2-135M-Instruct-ONNX-MHA");
    await expect(answer).toContainText("Runtime: WebGPU via Transformers.js");
    await expect(answer).toContainText("Fit: Strong fit");
  });

  test("falls back to Transformers.js WASM CPU when both WebGPU paths fail", async ({ page }) => {
    await page.route("https://esm.run/@mlc-ai/web-llm", async (route) => {
      await route.fulfill({
        contentType: "application/javascript",
        body: `
          export async function CreateMLCEngine() {
            const error = new Error("This model requires WebGPU extension shader-f16.");
            error.name = "ShaderF16SupportError";
            throw error;
          }
        `
      });
    });
    await page.route("https://esm.run/@huggingface/transformers", async (route) => {
      await route.fulfill({
        contentType: "application/javascript",
        body: `
          export async function pipeline(task, modelId, options) {
            if (options?.device === "webgpu") {
              throw new Error("Transformers.js WebGPU unavailable");
            }
            options?.progress_callback?.({ loaded: 1, total: 1 });
            return async function generate() {
              return [{
                generated_text: [
                  "Fit: Strong fit",
                  "Why: Medical Device Software (domain:MedicalDeviceSoftware) and Regulated Healthcare (domain:RegulatedHealthcare) support the fit.",
                  "Gaps: Make commercial ownership and founder-level accountability explicit. | Add concrete clinical discovery stories, not only platform achievements.",
                  "Positioning: Research-to-product healthcare technologist with regulated medical software, digital health, and clinical workflow exposure."
                ].join("\\n")
              }];
            };
          }
        `
      });
    });

    await page.goto("/semantic-web/");
    await page.getByRole("button", { name: "Load browser LLM" }).click();
    await expect(page.locator("#llmStatus")).toHaveText("Ready");
    await expect(page.locator("#llmDetail")).toContainText("WebLLM WebGPU failed: ShaderF16SupportError");
    await expect(page.locator("#llmDetail")).toContainText("Transformers.js WebGPU failed: Error: Transformers.js WebGPU unavailable");
    await expect(page.locator("#llmDetail")).toContainText("Loaded Transformers.js WASM model onnx-community/SmolLM2-135M-Instruct-ONNX-MHA");

    await page.getByRole("button", { name: "Assess" }).click();

    const answer = page.locator("#answer");
    await expect(answer).toContainText("Browser-local LLM rendering");
    await expect(answer).toContainText("Guard passed");
    await expect(answer).toContainText("Backend: Transformers.js");
    await expect(answer).toContainText("Model: onnx-community/SmolLM2-135M-Instruct-ONNX-MHA");
    await expect(answer).toContainText("Runtime: WebAssembly CPU");
    await expect(answer).toContainText("Fit: Strong fit");
  });

  test("falls back to WASM generation when Transformers.js WebGPU generation stalls", async ({ page }) => {
    await page.addInitScript(() => {
      window.__BROWSER_LLM_TIMEOUT_MS__ = 50;
    });
    await page.route("https://esm.run/@mlc-ai/web-llm", async (route) => {
      await route.fulfill({
        contentType: "application/javascript",
        body: `
          export async function CreateMLCEngine() {
            const error = new Error("This model requires WebGPU extension shader-f16.");
            error.name = "ShaderF16SupportError";
            throw error;
          }
        `
      });
    });
    await page.route("https://esm.run/@huggingface/transformers", async (route) => {
      await route.fulfill({
        contentType: "application/javascript",
        body: `
          export async function pipeline(task, modelId, options) {
            options?.progress_callback?.({ loaded: 1, total: 1 });
            if (options?.device === "webgpu") {
              return async function generate() {
                return new Promise(() => {});
              };
            }
            return async function generate() {
              return [{
                generated_text: [
                  "Fit: Strong fit",
                  "Why: Medical Device Software (domain:MedicalDeviceSoftware) and Regulated Healthcare (domain:RegulatedHealthcare) support the fit.",
                  "Gaps: Make commercial ownership and founder-level accountability explicit. | Add concrete clinical discovery stories, not only platform achievements.",
                  "Positioning: Research-to-product healthcare technologist with regulated medical software, digital health, and clinical workflow exposure."
                ].join("\\n")
              }];
            };
          }
        `
      });
    });

    await page.goto("/semantic-web/");
    await page.getByRole("button", { name: "Load browser LLM" }).click();
    await expect(page.locator("#llmStatus")).toHaveText("Ready");
    await expect(page.locator("#llmDetail")).toContainText("Loaded Transformers.js WebGPU model");

    await page.getByRole("button", { name: "Assess" }).click();

    const answer = page.locator("#answer");
    await expect(answer).toContainText("Guard passed");
    await expect(answer).toContainText("Runtime: WebAssembly CPU");
    await expect(page.locator("#llmDetail")).toContainText("Transformers.js WebGPU via Transformers.js generation timed out");
    await expect(page.locator("#llmDetail")).toContainText("Falling back to Transformers.js WASM CPU for generation");
  });

  test("does not load the browser LLM during deterministic smoke tests", async ({ page }) => {
    await page.goto("/semantic-web/");

    await expect(page.locator("#llmStatus")).toHaveText("Optional");
    await expect(page.locator("#answer")).toContainText("awaiting query");
  });
});
