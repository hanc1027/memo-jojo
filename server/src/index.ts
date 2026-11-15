import express, { type ErrorRequestHandler } from "express";
import swaggerUi from "swagger-ui-express";
import { load } from "js-yaml";
import { readFileSync } from "node:fs";
import * as OpenApiValidator from "express-openapi-validator";


const specPath = "../openapi/openapi.yaml";
const spec = load(readFileSync(specPath, "utf8")) as object;

const app = express();
app.use(express.json());

/**
 * Swagger UI 解析渲染
 */
app.use("/docs", swaggerUi.serve, swaggerUi.setup(spec)); 
app.use(OpenApiValidator.middleware({
  apiSpec: specPath,
}));

/**
 * 實際功能 API 路由
 */

app.get("/health", (_req, res) => {
  res.json({ success: true });
});

/**
 * 錯誤處理
 */
const errorHandler: ErrorRequestHandler = (err, _req, res, next) => {
  const status = typeof err?.status === "number" ? err.status : 500;

  if (status >= 500) {
    console.error(err);
    res.status(500).json({
      error: { code: "INTERNAL_ERROR", message: "Internal Server Error" },
    });
    return;
  }

  res.status(status).json({
    error: { code: codeFromStatus(status), message: err.message },
  });
};
app.use(errorHandler);

function codeFromStatus(status: number): string {
  if (status === 400) return "VALIDATION_ERROR";
  if (status === 404) return "NOT_FOUND";
  return "BAD_REQUEST";
}

/**
 * 啟動Server
 */
const port = Number(process.env.PORT ?? 3000);
app.listen(port, () => {
  console.log(`server listening on ${port}`);
});