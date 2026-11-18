# server-go 遷移筆記

把 `server/`（Node + Express）改寫成 `server-go/`（Go + chi），供任何電腦開啟此專案時同步進度與決策。

## 協作方式（重要）

使用者要透過這次遷移學習 Go 的運作與架構，**不要直接把完整 code 寫出來**。正確做法：
- 一步一步帶：先講概念、給函式簽名/骨架，讓使用者自己填邏輯
- 使用者寫完/卡住再 review、解惑，才進下一步
- 回覆排版依使用者全域偏好：優先用表格，流程用 Mermaid，避免大量條列

## 技術選型

| 項目 | 選擇 | 對應 Node 版 |
|---|---|---|
| Router | `go-chi/chi/v5` | Express |
| API 程式碼產生 | `oapi-codegen`（`strict-server: true`, `chi-server: true`, `embedded-spec: true`），設定在 `oapi-codegen.yaml`，`task gen` 執行 | `express-openapi-validator` |
| DB 存取 | **GORM**（`gorm.io/gorm` + `gorm.io/driver/mysql`） | `mysql2/promise` |
| 環境變數（執行期） | 沿用 Node 版 5 個變數：`DB_HOST`、`DB_PORT`、`MYSQL_USER`、`MYSQL_PASSWORD`、`MYSQL_DATABASE`；程式碼本身只用 `os.Getenv`，不處理 `.env` | `src/db/pool.ts` |
| 環境變數（本機開發/測試） | `go.mod` 的 `tool` 區塊加 `github.com/joho/godotenv/cmd/godotenv`，`Taskfile.yml` 的 `dev`/`test` task 用 `go tool godotenv -f ../.env <command>` 包起來載入根目錄 `.env` | `node --env-file-if-exists=../.env` |

## 目錄規劃（現況）

```
server-go/
├── go.mod
├── Taskfile.yml             # gen / dev / test / check
├── internal/
│   ├── api/api.gen.go       # 已產生，oapi-codegen 輸出，含 StrictServerInterface
│   ├── db/pool.go           # GORM 連線：requireEnv、buildDSN、NewConnection（完成)
│   ├── memos/               # CRUD，依操作拆檔，對應 src/memos/*.ts
│   │   ├── model.go         # Memo struct
│   │   ├── repository.go    # Repository struct + NewRepository()
│   │   ├── errors.go        # ErrNotFound 等共用 sentinel error
│   │   ├── list.go          # List()（完成)
│   │   ├── get.go           # Get()（進行中)
│   │   ├── create.go        # Create()（未開始)
│   │   ├── update.go        # Update()（未開始)
│   │   ├── remove.go        # Delete()（未開始)
│   │   └── memos_test.go    # 整合測試，接真實 DB
│   └── server/server.go     # 實作 api.StrictServerInterface（待寫）
└── cmd/
    └── server/main.go       # 組裝 db + server + chi router + middleware，對應 src/index.ts（待寫）
```

附註：`cmd/server/` 多一層是 Go 社群慣例（Standard Go Project Layout），因為 `package main` 會被編成執行檔、檔名=資料夾名，每個可執行檔要有獨立資料夾；若確定只會有一個執行檔，也可以簡化成 `cmd/server-go/main.go` 或直接放根目錄。

Go 的 package 邊界是「資料夾」不是「檔案」，`internal/memos/` 底下所有檔案都宣告 `package memos`，彼此可以直接互相呼叫，拆多少檔案純粹是可讀性考量，不影響功能。

## 已實作/已確定的事

- `internal/api/api.gen.go` 已由 `task gen` 產生，介面是 `StrictServerInterface`（型別化 request/response struct），之後要寫的是實作這個介面，再用 `api.NewStrictHandler` 包成 `api.ServerInterface` 給 chi 用
- DB 改用 GORM，不是標準庫 `database/sql` 手刻 SQL
- Memo 資料表欄位其實是 **snake_case**（`created_at`/`updated_at`，對照 Node 版 `shared.ts` 的 `MemoRow`），正好符合 GORM 預設的 struct 欄位 → snake_case 轉換，`model.go` 的 `Memo` struct **不需要**額外寫 `gorm:"column:..."` tag（舊筆記寫成 camelCase 是錯的，已修正）
- Table 名稱同理不用額外指定：GORM 預設把 `Memo` 轉複數對應到 `memos` 表
- MySQL driver 的 DSN 要加 `parseTime=True`，否則 DATETIME 欄位讀不進 `time.Time`
- `Memo` 不嵌入 `gorm.Model`，避免帶出 `DeletedAt` 造成非預期的軟刪除——Node 版 `removeMemo` 是真的 `DELETE FROM`，要硬刪除
- DB 存取層用 `Repository` struct（持有 `*gorm.DB`，透過 `NewRepository(db)` 注入）而不是 Node 版那種全域 `pool` 變數，方便之後測試替換連線
- GORM 鏈式呼叫（`.Order()`/`.Where()`/`.Find()`...）可能回傳新的 `*gorm.DB`，**一定要接住回傳值再檢查 `.Error`**，不能看 base 的 `r.db.Error`（已踩過這個坑並修正）
- 錯誤處理用 sentinel error（`errors.go` 的 `ErrNotFound` 等）+ `fmt.Errorf("...%w", err)` 包裝動態內容，上層用 `errors.Is` 判斷，對應 Node 版 `Object.assign(new Error(...), { status: 404 })` 的做法
- Repository 層（`List`/`Get`...）**不要**在裡面加 log，錯誤只管往上傳；log 統一留給 Step 6 的集中錯誤處理，避免同一個錯誤被重複記錄多次
- `NewConnection()` 每呼叫一次就是一個全新、獨立的連線池，整個 app 生命週期只能呼叫一次，結果（`*gorm.DB`）往下共用傳給 `Repository`
- 連線池滿了（10 條都在用）時，第 11 個請求會**阻塞排隊**等待，不是直接報錯，跟 Node 版 `queueLimit: 0` 的行為一致

## 待加強項目（之後 Step 4/5 要記得考慮)

- **DB 查詢逾時**：目前 `Repository` 方法沒有接 `context.Context`。之後接上 HTTP handler 時，考慮把 request 的 `context` 傳進 `r.db.WithContext(ctx)`，搭配 chi 的 `middleware.Timeout(...)`，避免連線池滿載時某個請求無限期卡住等連線，而是逾時後回傳 `context.DeadlineExceeded` 讓 client 提早拿到錯誤

## 待其他 Agent 回答的問題

> 這裡記錄使用者想問、但指定交給別的 agent 回答的問題，先不要在這個教學對話裡回答。

- **多組 DB 帳密 / 權限分層**：現在 `internal/db/pool.go` 的 `NewConnection()` 只用同一組 `MYSQL_USER`/`MYSQL_PASSWORD` 建一個連線池。使用者問：如果之後 API 呼叫方有不同登入層級（例如一般使用者 vs 管理員），是否需要依使用者層級分開用不同的 DB 帳密去連線？該怎麼設計？

## 進度

| Step | 內容 | 狀態 |
|---|---|---|
| 1 | 規劃目錄結構、理解 package/可見性概念 | 完成 |
| 2 | `internal/db/pool.go`：GORM 連線（`requireEnv`、`buildDSN`、`NewConnection`，含連線池設定） | 完成，`go build`/`go vet` 通過 |
| 2.5 | （可選）啟動階段的連線 retry，應對 docker-compose DB container 還沒 ready 的情況 | 未開始，討論完但先擱置，之後再決定要不要做 |
| 3 | `internal/memos/`：GORM model + CRUD，依操作拆檔 | 進行中——`model.go`/`repository.go`/`errors.go`/`list.go` 完成，`get.go` 進行中，`create.go`/`update.go`/`remove.go` 未開始 |
| 4 | `internal/server/`：實作 `StrictServerInterface` | 未開始 |
| 5 | `cmd/server/main.go`：組裝啟動 | 未開始 |
| 6 | 錯誤處理策略（對應 Node 版 `errorHandler`，含 Repository 層的 log 統一收斂到這裡） | 未開始 |
