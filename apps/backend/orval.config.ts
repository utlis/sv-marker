import { defineConfig } from "orval";

export default defineConfig({
  stanzaServer: {
    input: "../../openapi/stanza-server/openapi.json",
    output: {
      mode: "single",
      target: "./generated/stanza-server/client.ts",
      client: "fetch",
      baseUrl: {
        runtime: 'process.env.STANZA_SERVER_ORIGIN ?? ""',
      },
    },
  },
});
