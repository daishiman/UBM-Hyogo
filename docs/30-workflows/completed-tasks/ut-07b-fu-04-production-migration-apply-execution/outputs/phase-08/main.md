# Phase 8: 品質ゲート — ut-07b-fu-04-production-migration-apply-execution

[実装区分: 実装仕様書（operations verification + evidence writing）]

## メタ情報

| 項目 | 値 |
| --- | --- |
| phase | 8 / 13 |
| 作成日 | 2026-05-04 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| issue | #424 (CLOSED) |

## 目的

本タスクは migration apply（DDL 実行）が中心でコード変更は spec / docs / evidence 限定のため、通常の coverage / typecheck / lint gate は対象外とする。代わり、運用品質を担保する以下 5 ゲートを定義する。

## 品質ゲート定義（既適用検証専用）

| Gate | 確認内容 | PASS 条件 |
| --- | --- | --- |
| G1 wrapper-only | `bash scripts/cf.sh` 経由のみ | spec / 実行ログに `wrangler` 直接呼び出しがない |
| G2 preflight-pass | `migrations list` で既適用確認 | Phase 6 単体検証 PASS または `blocked_until_user_approval` |
| G3 duplicate-apply-prohibited | apply command が実行されていない | Phase 11 Step 3 PASS |
| G4 post-check-pass | hardening 2 カラムが期待結果 | Phase 7 統合検証 PASS または `blocked_until_user_approval` |
| G5 evidence-redaction-pass | account_id / token / UUID / PII が redact 済み | redaction-checklist.md PASS |
| G6 system-spec-sync-pass | aiworkflow-requirements の applied fact 同期 | Phase 12 で同期差分が記録 |

## 通常 gate との関係

| 通常 gate | 本タスクでの扱い |
| --- | --- |
| `pnpm typecheck` | コード変更なしのため対象外。ただし PR 時に CI で実行される範囲は通る |
| `pnpm lint` | 同上 |
| coverage | 対象外（operations verification / docs / evidence のみ） |
| coverage-guard hook | merge commit / docs-only スコープなので skip 設計内で誤発動しないことを確認 |
| staged-task-dir-guard hook | 本ワークツリー内のタスク dir のみを stage しているため通る |

## CI gate 確認（Phase 13 PR 作成時）

- `verify-indexes-up-to-date`: aiworkflow-requirements 側を更新した場合は `pnpm indexes:rebuild` を Phase 12 で実行し drift をなくす
- `required_status_checks` が green であること
- `required_linear_history` / `required_conversation_resolution` 遵守

## 参照資料

- CLAUDE.md「sync-merge (main 取り込み) 時の hook 挙動」
- scripts/coverage-guard.sh
- scripts/hooks/staged-task-dir-guard.sh
- .github/workflows/verify-indexes.yml

## 多角的チェック観点

- 通常 gate を「対象外」と一括除外していないか（一部は CI で必ず通る）
- G5 redaction が後工程で漏れない手順になっているか
- G6 system spec 同期が Phase 12 で確実に行われる導線か

## サブタスク管理

- [ ] G1〜G6 を確定
- [ ] 通常 gate との関係を整理
- [ ] CI gate 確認項目を整理
- [ ] outputs/phase-08/main.md を作成

## 成果物

- outputs/phase-08/main.md

## 完了条件

- G1〜G6 と通常 gate の関係が明示
- CI gate との接続が明示

## タスク100%実行確認

- [ ] G1 wrapper-only が遵守される設計
- [ ] G5 redaction の徹底
- [ ] secret 値を含めていない

## 次 Phase への引き渡し

Phase 9 へ、staging parity 確認を渡す。
## 実行タスク

1. production ledger 既適用 fact と本仕様書の AC を照合する。
2. duplicate apply が gate で停止されることを確認する。
3. Phase 11 placeholder と Phase 12 strict outputs の実体有無を確認する。

## 統合テスト連携

品質ゲートでは runtime test を実行せず、file existence / AC mapping / redaction policy を確認する。
