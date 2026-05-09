# Phase 9: runbook / SSOT 反映ドラフト

## メタ情報

| 項目 | 値 |
| --- | --- |
| Source | `outputs/phase-9/phase-9.md` |
| 実装区分 | runbook / SSOT 反映ドラフト仕様書 |

## 目的

`docs/runbooks/audit-correlation.md`（既存）に rotation 章を追記する草案、および `.claude/skills/aiworkflow-requirements/references/audit-correlation.md`（既存）と `references/deployment-secrets-management.md`（新規）への rotation policy / 1Password vault 構造の追記草案を確定する。`indexes/topic-map.md` / `indexes/keywords.json` への追加 keyword 候補を列挙し、実書き込みは Phase 12 で `mise exec -- pnpm indexes:rebuild` 経由で再生成する。

## 実行タスク

詳細は `outputs/phase-9/phase-9.md` を正本とする。runbook 章構成は以下 4 節:

1. 通常 rotation 手順（90 日周期想定）
2. 緊急 rotation 手順（salt 漏洩疑義時の即時実行）
3. fingerprintVersion=2 移行手順（dual-hash 期間 7 日）
4. rotation 終了手順（`rotate-salt.sh --end-rotation` → Worker 再 deploy）

## 統合テスト連携

- 実書き込みは Phase 12 で実施。本 Phase は草案のみ。
- Phase 12 compliance check で SSOT 反映が漏れないことを確認する。
- `mise exec -- pnpm indexes:rebuild` 後 `git status .claude/skills/aiworkflow-requirements/indexes/` で drift 無し確認する（CI gate `verify-indexes-up-to-date` 整合）。

## 参照資料

- `outputs/phase-9/phase-9.md`
- `docs/runbooks/audit-correlation.md`（既存）
- `.claude/skills/aiworkflow-requirements/references/audit-correlation.md`（既存）
- `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md`（既存・関連参照）
- index.md「目的」項 5 / 6 / 「想定変更ファイル一覧」runbook / references / indexes 行

## 成果物

- `outputs/phase-9/phase-9.md`
- runbook 章草案（4 節）
- `references/audit-correlation.md` 追記草案（rotation 章）
- `references/deployment-secrets-management.md` 新規草案（1Password vault 構造）
- 追加 keyword 候補一覧（`salt rotation` / `fingerprintVersion` / `dual-hash` / `AUDIT_CORRELATION_SALT_PREVIOUS` / `rotate-salt.sh`）

## 完了条件

- runbook 4 節の構成と本文ドラフトが確定。
- references への追記範囲が明示（既存ファイル箇所 / 新規ファイル雛形）。
- keyword / topic 候補が列挙され、Phase 12 で `pnpm indexes:rebuild` 後に drift 無しになる前提が明記。
- 実書き込みは Phase 12 で実施する責務分担が明記。
