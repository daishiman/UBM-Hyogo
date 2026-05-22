# Phase 11: 手動テスト / runtime evidence（NON_VISUAL / blocked_upstream_pending）

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 11 / 13 |
| Source | `outputs/phase-11/phase-11.md` |
| 状態 | `blocked_upstream_pending` |
| 親 Issue | #555 |
| 親タスク | issue-516 (FU-01) |
| visualEvidence | NON_VISUAL |

## 目的

staging で `AUDIT_CORRELATION_SALT` rotation 自動化（dual-hash 期間 7 日）を実行し、HIGH alert の連続性 ≥ 99% および dual-hash grep gate の evidence を取得する。

## ⚠️ blocked_upstream_pending（必須）

本 Phase は **親 FU-01 (issue-516) の live wiring が staging で完了するまで** `blocked_upstream_pending` を維持する。FU-01 の audit-correlation 実本番 wiring が未完では rotation 効果を観測できないため、着手解除条件を以下に固定する:

- `gh issue view 516` の最新 comment / state で FU-01 の staging evidence 取得済みが確認できる
- もしくは親タスク `issue-516-github-audit-log-cross-source-correlation` の `outputs/phase-11/` 配下に staging evidence の実体配置が確認できる

## 着手解除後の概要

1. staging dry-run: `bash scripts/audit-correlation/rotate-salt.sh --dry-run --env staging`
2. staging apply: `bash scripts/audit-correlation/rotate-salt.sh --apply --env staging`
3. dual-hash 期間（7 日）の HIGH alert 監視 — 連続性 ≥ 99%
4. 7 日経過後: `bash scripts/audit-correlation/rotate-salt.sh --end-rotation --env staging`

## 実行禁止事項

- production rotation は本タスクスコープ**外**（user gate 後の別タスク）

## 成果物

- `outputs/phase-11/phase-11.md`
- `outputs/phase-11/staging-evidence.md`
- `outputs/phase-11/dual-hash-grep-gate.log`

## 完了条件

詳細 DoD は `outputs/phase-11/phase-11.md` を正本とする。
