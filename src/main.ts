import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/env.js";
import { AppModule } from "./app.module.js";
import { swaggerJson, swaggerUi } from "./docs/swagger.js";
import { bootstrapProductionState } from "./database/bootstrap.js";

const app = express();

app.use(helmet());
app.use(cors({ origin: "*", credentials: false }));
app.use(express.json({ limit: "2mb" }));
app.use(morgan("dev"));

app.get("/health", (_request, response) => {
  response.json({ ok: true, service: "aamusted-sip-api", time: new Date().toISOString() });
});
app.get("/api/docs.json", swaggerJson);
app.get("/api/docs", swaggerUi);

async function start() {
  await bootstrapProductionState();

  for (const module of AppModule) {
    app.use(module.basePath, module.router);
  }

  app.listen(env.port, () => {
    console.log(`AAMUSTED SIP API listening on http://localhost:${env.port}`);
  });
}

start().catch((error) => {
  console.error("AAMUSTED SIP API failed to start because production persistence could not be initialized.", error);
  process.exit(1);
});
