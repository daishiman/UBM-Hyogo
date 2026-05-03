# System spec update summary - 06c-C-admin-tags

- 12-search-tags.md / 11-admin-management.md の queue-only 境界を採用。
- aiworkflow-requirements indexes に 06c-C remaining-only workflow を追加対象として同期。
- 旧 CRUD 前提は正本に反するため撤回。
- 実コード追補: `TagQueuePanel` と `AdminTagsPage` の status / locator を queue-only + `dlq` 対応へ同期し、旧 `admin-add-tag-button` CRUD 前提を撤回。
