import { assessFit } from "../semantic-web/fit-engine.js";
import { loadFacts } from "./rdf-utils.mjs";

export default class RdfFitProvider {
  id() {
    return "rdf-fit-engine";
  }

  async callApi(prompt) {
    const result = assessFit(String(prompt), loadFacts());
    return {
      output: JSON.stringify(result, null, 2)
    };
  }
}
