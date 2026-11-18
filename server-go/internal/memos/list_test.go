package memos

import (
	"testing"

	"memo-server/internal/db"
)

func TestList(t *testing.T) {
	gormDB, err := db.NewConnection()
	if err != nil {
		t.Fatalf("連線失敗: %v", err)
	}

	repo := NewRepository(gormDB)
	result, err := repo.List()
	if err != nil {
		t.Fatalf("List 失敗: %v", err)
	}

	t.Logf("查到 %d 筆", len(result))
}
