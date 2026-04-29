# System spec update summary — 04a

## 結論

04a の API 実装内容は `.claude/skills/aiworkflow-requirements/references/` の正本仕様へ追記済み。
旧 `docs/00-getting-started-manual/specs/` 系は参照元として確認したが、本ワークツリーの正本更新先は `aiworkflow-requirements` である。

## 確認した仕様ファイル

| ファイル | 変更要否 | 備考 |
| --- | --- | --- |
| `.claude/skills/aiworkflow-requirements/references/api-endpoints.md` | 更新済み | `/public/*` 4 endpoint、認証不要、Cache-Control、公開フィルタ、query 契約を追記 |
| `.claude/skills/aiworkflow-requirements/references/architecture-monorepo.md` | 更新済み | `apps/api` の Wave 0 health scaffold 記述に 04a public API 追加済み事実を追記 |
| `.claude/skills/aiworkflow-requirements/references/task-workflow.md` | 更新済み | 04a Phase 1-12 close-out、Phase 11 runbook 境界、Phase 13 承認待ちを追記 |
| `docs/00-getting-started-manual/specs/12-search-tags.md` | 変更不要 | `density=comfy/dense/list` に実装を合わせた |

## 実装側で確定した値（仕様変更ではなく実装決定）

- `FALLBACK_FORM_ID = "119ec539YYGmkUEnSYlhI-zMXtvljVpvDFMm7nfhp7Xg"`（CLAUDE.md と同値）。
- `FALLBACK_RESPONDER_URL = "https://docs.google.com/forms/d/e/1FAIpQLSeWfv-R8nblYVqqcCTwcvVsFyVVHFeKYxn96NEm1zNXeydtVQ/viewform"`。
- `LIMIT_MAX = 100`、`LIMIT_MIN = 1`、`Q_MAX_LENGTH = 200`。
- `FORBIDDEN_KEYS = ['responseEmail','rulesConsent','adminNotes']`。
- `Cache-Control` 値 (`public, max-age=60` / `no-store`)。

これらは `api-endpoints.md` と `implementation-guide.md` に反映済み。
