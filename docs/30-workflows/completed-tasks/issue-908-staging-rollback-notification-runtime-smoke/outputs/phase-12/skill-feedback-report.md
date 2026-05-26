# Skill Feedback Report — issue-908-staging-rollback-notification-runtime-smoke

## task-specification-creator への feedback

| Topic | Feedback |
| --- | --- |
| runtime evidence followup の雛形 | `ut-17-followup-001-alert-relay-runtime-smoke-evidence` と本タスクで共通する「helper script + evidence MD placeholder + 親 mutation」3 点セットを `references/patterns-runtime-evidence-followup.md` に促進候補とする |
| smoke helper の dry-run 必須化 | bash helper 系の `--dry-run` モード（副作用ゼロ・grep 検証可能）を runtime evidence followup の standard contract として推奨 |
| evidence_path 先行 placeholder | gate-metadata:validate を user-gated 実行前に通すために、evidence MD を placeholder 構造で先行作成する手順を Phase 5 standard step として推奨 |
| helper の command construction | alias 等の user-provided ID は URL / SQL 組み立て前に allowlist validation し、mutating HTTP call は redacted evidence に `http_status` を残す rule を runtime evidence followup pattern に昇格 |

## aiworkflow-requirements への feedback

| Topic | Feedback |
| --- | --- |
| 親タスク mutation の cross-link | 親 root の `manual-test-result.md` を後続 followup task が mutate する場合の cross-link 記法（`./evidence/staging-smoke.md` 形式）を共通化推奨 |

## lessons learned（本 cycle で aiworkflow-requirements に反映）

- L-I908-001: bash helper redact pipe = sed 3 pattern 最小集合
- L-I908-002: evidence MD placeholder 先行 commit で gate-metadata:validate を user-gated 前にも通せる
- L-I908-003: `--dry-run` 既定推奨は誤用助長、`[USER-GATE]` confirm prompt で本実行 gate が正解
- L-I908-004: runtime smoke helper は user-provided ID の allowlist validation と HTTP status capture を標準 contract に含める
