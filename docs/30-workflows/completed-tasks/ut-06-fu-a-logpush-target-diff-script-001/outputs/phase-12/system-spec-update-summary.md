# system spec update summary

## 影響範囲
- システム仕様書 (`docs/00-getting-started-manual/specs/`) への影響: なし
  - 本タスクは observability ツール追加であり、API スキーマ・認証・DB 構成に変更を加えない
- 不変条件への影響: なし (#5 D1 直接アクセス制限など触らず)

## 新規導入

| 項目 | 場所 |
| --- | --- |
| observability target diff script | `scripts/observability-target-diff.sh` |
| redaction module | `scripts/lib/redaction.sh` |
| script unit / integration test | `tests/unit/redaction.test.sh`, `tests/integration/observability-target-diff.test.sh` |
| 親タスク runbook 導線 | `docs/30-workflows/completed-tasks/ut-06-fu-a-prod-route-secret-001-worker-migration-verification/outputs/phase-12/observability-diff-runbook.md` |

## CLAUDE.md 整合
`Cloudflare 系 CLI 実行ルール` 「`bash scripts/cf.sh` 経由」を厳守。本 script は `cf_call` allowlist で wrapper 一本化を強制している。
