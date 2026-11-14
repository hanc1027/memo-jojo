import express from "express";
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
  validateRequests: true, // 擋下不符合契約的請求
  validateResponses: true, // 回應不符契約時會報錯，能抓到 handler 寫錯欄位。 開發時為 true
}));

/**
 * 實際功能 API 路由
 */

app.get("/health", (_req, res) => {
  res.json({ success: true });
});

const port = Number(process.env.PORT ?? 3000);
app.listen(port, () => {
  console.log(`server listening on ${port}`);
});