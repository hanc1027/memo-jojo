package memos

import (
	"errors"
	"fmt"

	"gorm.io/gorm"
)

func (r *Repository) Get(id int) (*Memo, error) {
	var memo Memo
	result := r.db.First(&memo, id)

	if result.Error != nil {
		if  errors.Is(result.Error,gorm.ErrRecordNotFound) {
			return nil, fmt.Errorf("memo id=%d: %w", id, ErrNotFound)
		}
		return nil, result.Error
	}

	return &memo, nil
}