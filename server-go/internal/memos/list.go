package memos

func (r *Repository) List() ([]Memo, error) {
	// 用 r.db.Order(欄位名 升降冪).Find(...) 查全部
	var memos []Memo
	result := r.db.Order("created_at desc").Find(&memos)

	if result.Error != nil {
		return nil, result.Error
	}

	return memos, nil
}