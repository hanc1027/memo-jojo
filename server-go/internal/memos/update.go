package memos

func (r *Repository) Update(id int, title, content *string) (*Memo, error) {
	updates := map[string]any{}

	if title != nil {
		updates["title"] = *title
	}

	if content != nil {
		updates["content"] = *content
	}

	if len(updates) > 0 {
		result := r.db.Model(&Memo{}).Where("id = ?", id).Updates(updates)
		if result.Error != nil {
			return nil, result.Error
		}
	}

	return r.Get(id)
}
