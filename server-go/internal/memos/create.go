package memos

func (r *Repository) Create(title, content string) (*Memo, error) {
	memo := Memo{Title: title, Content: content}

	result := r.db.Create(&memo)
	if result.Error != nil {
		return nil, result.Error
	}
	return &memo, nil
}
