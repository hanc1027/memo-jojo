import express, { type ErrorRequestHandler } from "express";
import * as OpenApiValidator from "express-openapi-validator";
import { load } from "js-yaml";
import { readFileSync } from "node:fs";
import swaggerUi from "swagger-ui-express";
import { pool } from "./db/pool.ts";
import { createMemo } from "./memos/create.ts";
import { listMemos } from "./memos/list.ts";
import { getMemo } from "./memos/get.ts";
import { updateMemo } from "./memos/update.ts";
import { removeMemo } from "./memos/remove.ts";


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
 * 測試 API 連線用
 */

app.get("/health", (_req, res) => {
  res.json({ success: true });
});

// 各功能API路由 - Start
/**
 * 新增 memo
 */
app.post("/memos", async (req, res) => {
  const memo = await createMemo(req.body);
  res.json(memo);
});

/**
 * 列出所有 memo
 */
app.get("/memos", async (_req, res) => {
  const memos = await listMemos();
  res.json(memos);
});

/**
 * 列出指定 memo
 */
app.get("/memos/:id", async (req, res) => {
  const memo = await getMemo(Number(req.params.id));
  res.json(memo);
});

/**
 * 更新指定 memo
 */
app.patch("/memos/:id", async (req, res) => {
  const memo = await updateMemo(Number(req.params.id), req.body);
  res.json(memo);
});

/**
 * 刪除指定 memo
 */
app.delete("/memos/:id", async (req, res) => {
  await removeMemo(Number(req.params.id));
  res.json({ success: true });
});

// 各功能API路由 - End

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

const codeFromStatus = (status: number) => {
  if (status === 400) return "VALIDATION_ERROR";
  if (status === 404) return "NOT_FOUND";
  return "BAD_REQUEST";
}

/**
 * 測試資料庫連線
 */
const dbConnection = async () => {
  await pool.query("SELECT NOW(), UTC_TIMESTAMP();")
}
dbConnection().then(() => {
  console.log("Database connected.");
}).catch((err) => {
  if (err instanceof Error) {
    console.error("Database connection test failed:", err.message);
  } else {
    console.error("Database connection test failed:", err);
  }
  process.exit(1);
});

/**
 * 啟動Server
 */
const port = Number(process.env.PORT ?? 3000);
app.listen(port, () => {
  console.log(`server listening on ${port}`);
});