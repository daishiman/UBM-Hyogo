# task-skill-ledger-t6-issue-state-gate-ci — Issue #130 / #129 状態検査の CI 化

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスクID | task-skill-ledger-t6-issue-state-gate-ci |
| 作成日 | 2026-04-29 |
| 起点 | docs/30-workflows/skill-ledger-t6-hook-idempotency/outputs/phase-12/unassigned-task-detection.md (U-2) |
| 種別 | infra / CI / NON_VISUAL |
| 優先度 | MEDIUM |
| 状態 | unassigned |
| GitHub Issue | 未起票（本タスクで起票予定） |

## 背景

T-6 hook 実装着手前の AC-5 gate（A-1 `#130` および A-2 `#129` の CLOSED 状態）は現状人手の事前確認に依存しており、実装 PR が誤って先行する事故余地が残る。Phase 1 / Phase 2 / Phase 11 のレビューでも「gate を CI で機械化すれば実装着手の前提が崩れない」点が共通課題として整理された。

## スコープ

### 含む

- `gh issue view <number> --json state` 等で `#130` `#129` の CLOSED を検査する小スクリプト
- 当該スクリプトを呼び出す GitHub Actions workflow（`.github/workflows/skill-ledger-gate.yml` 想定）
- `feat/issue-1XX-skill-ledger-t6-*` パターンのブランチに限定したジョブ条件
- gate 失敗時のエラーメッセージと runbook リンク

### 含まない

- T-6 hook 本体の実装
- Issue #130 / #129 の reopen 判定ロジック
- A-3 / B-1 系 Issue の状態検査

## 受入条件

- AC-1: T-6 系ブランチへの push で gate workflow が起動する。
- AC-2: `#130` と `#129` のいずれかが OPEN の場合は CI が fail する。
- AC-3: 両方 CLOSED の場合のみ gate ジョブが success になる。
- AC-4: gate 失敗時のメッセージから runbook（`references/skill-ledger-gitignore-policy.md` 等）に辿れる。
- AC-5: `gh` の認証トークンは `GITHUB_TOKEN` の最小権限（`issues: read`）で済む。

## 苦戦箇所（記入予定枠）

| 項目 | 内容 |
| ---- | ---- |
| 症状 | 実装着手時に記入 |
| 原因 | 実装着手時に記入 |
| 対応 | 実装着手時に記入 |
| 再発防止 | 実装着手時に記入 |

## 参照

- `docs/30-workflows/skill-ledger-t6-hook-idempotency/outputs/phase-12/unassigned-task-detection.md`
- `docs/30-workflows/skill-ledger-t6-hook-idempotency/outputs/phase-12/implementation-guide.md`
- `.claude/skills/aiworkflow-requirements/references/skill-ledger-gitignore-policy.md`
