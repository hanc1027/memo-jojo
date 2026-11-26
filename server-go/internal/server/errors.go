package server

import (
	"memo-server/internal/api"
)

// 錯誤代碼與訊息，集中管理
const (
	codeNotFound    = "NOT_FOUND"
	msgMemoNotFound = "找不到該Memo"
)

// notFoundBody 產生 404 的回應內容，所有 API 共用
func notFoundBody() api.NotFoundJSONResponse {
	var body api.NotFoundJSONResponse
	body.Error.Code = codeNotFound
	body.Error.Message = msgMemoNotFound
	return body
}