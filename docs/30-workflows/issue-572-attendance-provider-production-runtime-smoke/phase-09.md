# Phase 9: ビルド／品質ゲート

[実装区分: 実装仕様書（CONST_004 / CONST_005 準拠）]

## メタ情報

| 項目 | 値 |
| --- | --- |
| phase | 9 / 13 |
| Source | `outputs/phase-9/phase-9.md` |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| 親 Issue | #572 (CLOSED) |

## 目的

Phase 5-8 の差分（`apps/api/scripts/runtime-smoke/` 配下追加 / `docs/30-workflows/runbooks/` 追加 / aiworkflow-requirements への secret 命名整合）について、typecheck / lint / build / 既存 grep gate を全 PASS とする。さらに以下 2 つの本タスク固有 gate を新設する:

1. **shell 履歴漏洩 grep gate**: production session 値（cookie / Bearer / OAuth）が docs / outputs / smoke スクリプト・履歴に残らない。
2. **redact filter 偽陰性 0 hit gate**: production 固有値（`cf-ray` / `__Secure-*` / `_cfuvid` 等）まで redact 対象に含まれている。

## 実行タスク

詳細は `outputs/phase-9/phase-9.md` を正本とする。本 Phase ではコードの新規実装を増やさず、Phase 5-8 で確定した差分が gate を通る条件を仕様化する。

## 統合テスト連携

- Phase 8 で確定した staging リハーサル smoke の PASS が前提。
- Phase 10 (user gate / production 実行準備) 着手は本 Phase 全 gate clean が必須条件。

## 参照資料

- `outputs/phase-9/phase-9.md`
- 起票元 §「苦戦箇所」 4 項目（特に shell 履歴漏洩 / redact filter production 偽陰性）
- `.github/workflows/`（既存 CI gate との整合）

## 成果物

- `outputs/phase-9/phase-9.md`
- gate コマンド表（typecheck / lint / build / shell 履歴 grep / redact 拡張 grep）
- 失敗時の戻り先 mapping

## 完了条件

- `mise exec -- pnpm typecheck` / `pnpm lint` / `pnpm build` がすべて exit 0。
- shell 履歴漏洩 grep が 0 hit（cookie value / Bearer / `__Secure-*` 実値が docs / outputs / scripts / `.bash_history` / `.zsh_history` 同等位置に残らない）。
- redact filter 拡張ケース（`cf-ray` / `cf-cache-status` / `__Secure-` prefix / `_cfuvid` / `_cf_bm`）が 0 hit。
- 既存 grep gate（design tokens / d1-direct-access 等）が引き続き 0 hit。
- 各 gate の戻り先 Phase が明記されている。
