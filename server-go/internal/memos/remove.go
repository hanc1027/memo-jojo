package memos

import (
	"fmt"
)

func (r *Repository) Remove(id int) error {
	result := r.db.Delete(&Memo{}, id)

	if result.Error != nil {
		return result.Error
	}
	// 等於 0，代表沒刪到東西（id 不存在）
	if result.RowsAffected == 0 {
		return fmt.Errorf("memo id=%d: %w", id, ErrNotFound)
	}

	return nil
}
