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
| 環境變數 | 沿用 Node 版：`DB_HOST`、`DB_PORT`、`MYSQL_USER`、`MYSQL_PASSWORD`、`MYSQL_DATABASE` | `src/db/pool.ts` |

## 目錄規劃

```
server-go/
├── go.mod
├── internal/
│   ├── api/api.gen.go      # 已產生，oapi-codegen 輸出，含 StrictServerInterface
│   ├── db/pool.go          # GORM 連線（待寫）
│   ├── memos/memos.go      # CRUD，對應 src/memos/*.ts（待寫）
│   └── server/server.go    # 實作 api.StrictServerInterface（待寫）
└── cmd/
    └── server/main.go      # 組裝 db + server + chi router + middleware，對應 src/index.ts（待寫）
```

附註：`cmd/server/` 多一層是 Go 社群慣例（Standard Go Project Layout），因為 `package main` 會被編成執行檔、檔名=資料夾名，每個可執行檔要有獨立資料夾；若確定只會有一個執行檔，也可以簡化成 `cmd/server-go/main.go` 或直接放根目錄。

## 已實作/已確定的事

- `internal/api/api.gen.go` 已由 `task gen` 產生，介面是 `StrictServerInterface`（型別化 request/response struct），之後要寫的是實作這個介面，再用 `api.NewStrictHandler` 包成 `api.ServerInterface` 給 chi 用
- DB 改用 GORM，不是標準庫 `database/sql` 手刻 SQL
- Memo 資料表欄位是 camelCase（`createdAt`/`updatedAt`），GORM 預設的 snake_case 轉換對不上，寫 model 時要用 tag 明確指定 column 名稱
- MySQL driver 的 DSN 要加 `parseTime=True`，否則 DATETIME 欄位讀不進 `time.Time`

## 進度

| Step | 內容 | 狀態 |
|---|---|---|
| 1 | 規劃目錄結構、理解 package/可見性概念 | 完成 |
| 2 | `internal/db/pool.go`：GORM 連線（`requireEnv`、`buildDSN`、`NewConnection`，含連線池設定） | 完成，`go build`/`go vet` 通過 |
| 2.5 | （可選）啟動階段的連線 retry，應對 docker-compose DB container 還沒 ready 的情況 | 未開始，討論完但先擱置，之後再決定要不要做 |
| 3 | `internal/memos/`：GORM model + CRUD | 未開始 |
| 4 | `internal/server/`：實作 `StrictServerInterface` | 未開始 |
| 5 | `cmd/server/main.go`：組裝啟動 | 未開始 |
| 6 | 錯誤處理策略（對應 Node 版 `errorHandler`） | 未開始 |

## 待其他 Agent 回答的問題

> 這裡記錄使用者想問、但指定交給別的 agent 回答的問題，先不要在這個教學對話裡回答。

- **多組 DB 帳密 / 權限分層**：現在 `internal/db/pool.go` 的 `NewConnection()` 只用同一組 `MYSQL_USER`/`MYSQL_PASSWORD` 建一個連線池。使用者問：如果之後 API 呼叫方有不同登入層級（例如一般使用者 vs 管理員），是否需要依使用者層級分開用不同的 DB 帳密去連線？該怎麼設計？
