package memos

import (
	"time"
)

type Memo struct {
	ID        int       `gorm:"primaryKey"`
	Title     string
	Content   string
	CreatedAt time.Time
	UpdatedAt time.Time
}
