# M-02 — required status check 候補（dev / main branch protection）

phase-07 §2 から確定。実 `gh api -X PUT` は **user 明示承認後のみ**実行（CLAUDE.md branch protection note）。本タスクは候補リスト確定までを担う。

| context 名 | 出所 workflow | 想定 status |
|-----------|-------------|------------|
| `verify-design-tokens / verify-design-tokens` | `verify-design-tokens.yml` | required |
| `playwright-smoke / smoke (chromium)` | `playwright-smoke.yml` | required |
| `playwright-smoke / visual (chromium, 4 screens)` | `playwright-smoke.yml` | required（既存 local visual） |
| `verify-phase12-compliance / verify` | `verify-phase12-compliance.yml` | required |
| `verify-gate-metadata / verify` | `verify-gate-metadata.yml` | required |
| `verify-indexes-up-to-date / verify` | `verify-indexes.yml` | required |
| `verify-test-suffix / verify` | `verify-test-suffix.yml` | required（既存有効化済の可能性高） |

## staging-visual を required に含めない理由

`staging-visual (chromium, 4 screens)` job は手動 deploy 後の `workflow_dispatch`（`staging_visual_base_url` 指定時）でのみ走る。
PR 毎に staging URL が常時 deploy 済とは限らないため、PR required status check には**含めず ops gate（G2）として扱う**（phase-07 §2）。
