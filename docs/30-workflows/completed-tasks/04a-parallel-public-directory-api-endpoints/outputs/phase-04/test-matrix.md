# Phase 4 — Test Matrix（AC × verify）

| AC | unit | contract | leak | authz | search | fixture |
| --- | --- | --- | --- | --- | --- | --- |
| AC-1 公開フィルタ | public-filter | members list | declined/hidden/deleted | - | - | members.json |
| AC-2 PublicMemberProfile 型 | to-public-member-profile | profile zod | leak keys | - | - | members.json |
| AC-3 visibility=public | visibility-filter | profile fields | visibility leak | - | - | members.json + schema-questions.json |
| AC-4 不適格 404 | - | - | 404 三種 + 存在しない id | - | - | members.json |
| AC-5 tag AND | - | - | - | - | tag AND | members.json |
| AC-6 fallback | search-query-parser | - | - | - | invalid → default | - |
| AC-7 lastSync | - | stats | - | - | - | sync-jobs.json |
| AC-8 form-preview 31/6 | to-form-preview | form-preview | - | - | - | schema-questions.json |
| AC-9 未認証 200 | - | - | - | 4 endpoint | - | - |
| AC-10 検索対象限定 | search-query-parser | - | - | - | q が responseEmail 等を hit しない | members.json |
| AC-11 limit clamp | pagination | - | - | - | limit=200 | - |
| AC-12 圧縮 | - | - | - | - | - | Workers 自動 |
