package server

import (
	"context"
	"errors"

	"memo-server/internal/api"
	"memo-server/internal/memos"
)

// Server 裡面放著 repo，之後每個 API 函式都透過 s.repo 存取 DB
type Server struct {
	repo *memos.Repository
}

// NewServer 建立 Server，之後在 main.go 呼叫
func NewServer(repo *memos.Repository) *Server {
	return &Server{repo: repo}
}

// toAPIMemo 把 DB 的 Memo 轉成 API 格式的 Memo（對應 Node 版的 toMemo）
func toAPIMemo(m memos.Memo) api.Memo {
	return api.Memo{
		Id:        m.ID,
		Title:     m.Title,
		Content:   m.Content,
		CreatedAt: m.CreatedAt,
		UpdatedAt: m.UpdatedAt,
	}
}

// 取得全部的 memos
func (s *Server) GetMemos(ctx context.Context, request api.GetMemosRequestObject) (api.GetMemosResponseObject, error) {
	// 呼叫 DB 那一層拿資料
	list, err := s.repo.List()
	if err != nil {
		return nil, err
	}

	// 一筆一筆轉成 API 格式
	result := make([]api.Memo, 0, len(list))
	for _, m := range list {
		result = append(result, toAPIMemo(m))
	}

	// 回傳 200
	return api.GetMemos200JSONResponse(result), nil
}

// 取得單筆 memo
func (s *Server) GetMemo(ctx context.Context, request api.GetMemoRequestObject) (api.GetMemoResponseObject, error) {
	// 呼叫 DB 那一層拿資料（request.Id 就是網址裡的 id）
	m, err := s.repo.Get(request.Id)

	// 找不到 → 回 404
	if errors.Is(err, memos.ErrNotFound) {
		return api.GetMemo404JSONResponse{NotFoundJSONResponse: notFoundBody()}, nil
	}

	// 其他錯誤 → 往上丟
	if err != nil {
		return nil, err
	}

	// 回傳 200
	return api.GetMemo200JSONResponse(toAPIMemo(*m)), nil
}

// 新增 memo
func (s *Server) CreateMemo(ctx context.Context, request api.CreateMemoRequestObject) (api.CreateMemoResponseObject, error) {
	// 從 body 取出 title、content，交給 DB 那一層新增
	m, err := s.repo.Create(request.Body.Title, request.Body.Content)
	if err != nil {
		return nil, err
	}

	// 回傳 200，內容是新增後的 memo
	return api.CreateMemo200JSONResponse(toAPIMemo(*m)), nil
}

// 更新單筆 memo
func (s *Server) UpdateMemo(ctx context.Context, request api.UpdateMemoRequestObject) (api.UpdateMemoResponseObject, error) {
	// 網址的 id + body 的欄位，交給 DB 那一層更新
	m, err := s.repo.Update(request.Id, request.Body.Title, request.Body.Content)

	// 找不到 → 回 404
	if errors.Is(err, memos.ErrNotFound) {
		return api.UpdateMemo404JSONResponse{NotFoundJSONResponse: notFoundBody()}, nil
	}

	// 其他錯誤 → 往上丟
	if err != nil {
		return nil, err
	}

	// 回傳 200，內容是更新後的 memo
	return api.UpdateMemo200JSONResponse(toAPIMemo(*m)), nil
}

// 刪除單筆 memo
func (s *Server) DeleteMemo(ctx context.Context, request api.DeleteMemoRequestObject) (api.DeleteMemoResponseObject, error) {

	// 網址的 id 欄位，交給 DB 那一層進行刪除
	err := s.repo.Remove(request.Id)

	// 找不到 → 回 404
	if errors.Is(err, memos.ErrNotFound) {
		return api.DeleteMemo404JSONResponse{NotFoundJSONResponse: notFoundBody()}, nil
	}


	// 其他錯誤 → 往上丟
	if err != nil {
		return nil, err
	}

	return api.DeleteMemo200JSONResponse{Success: true}, nil
}
