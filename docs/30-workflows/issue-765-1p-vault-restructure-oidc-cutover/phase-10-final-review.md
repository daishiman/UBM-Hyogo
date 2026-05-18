# Phase 10: 最終レビュー

## メタ情報

- phase: 10 / final-review
- prev: phase-9-qa
- next: phase-11-manual-test
- 実装区分: 実装仕様書
- user_approval_required: true（Gate-B / 後続 mutation 実行可否判定）

## 目的

Phase 1-9 の全成果物の整合性を最終レビューし、Phase 11 で実施する user-gated mutation（1Password vault item archive / `bash scripts/cf.sh whoami` canonical 検証 / grep gate 確認）の Go/No-Go を判定する。legacy item 物理 delete は Gate B' として本 workflow の実行対象外に残す。

## 実行タスク

1. Phase 1〜9 の成果物と gate 境界を最終確認する
2. runtime mutation / PR creation の user approval 条件を確認する
3. NO-GO 条件に該当する stale wording や secret leakage がないか確認する

## レビュー対象

| Phase | 対象成果物 | 確認観点 |
|------|----------|---------|
| Phase 1 | 要件定義 | canonical 2 path / legacy 6 path の inventory が網羅的 |
| Phase 2-3 | 設計 / 設計レビュー | archive → 物理 delete を 2-stage に分離し sub-gate を明示 |
| Phase 4-6 | テスト計画 / 実装 / テスト追加 | `verify-onepassword-op-uri-canonical.sh` の grep gate が legacy path を検出 fail させる |
| Phase 7-8 | coverage / refactor | deploy token op:// path 参照が canonical 2 path のみに統一され、WAF / audit / historical references と混同されない |
| Phase 9 | QA | CI gate / 文書静的検査 / Pre-mutation 前提すべて green |

## GO 判定基準（Gate-B pass 条件）

| 判定軸 | 基準 |
|------|------|
| 実装差分 | Phase 5 DoD すべて green（canonical path 統一 / inventory 更新 / grep gate 追加） |
| CI gate | typecheck / lint / verify-onepassword-op-uri-canonical / verify:phase12-compliance / gate-metadata:validate / indexes:rebuild drift すべて exit 0 |
| Pre-merge | 親タスク Issue #762 / #763 / #718 すべて `closed` |
| 運用前提 | operator approval 取得済み。1Password vault item の archive / delete 経路を operator が把握 |
| 手動 path 監査 | `bash scripts/cf.sh whoami` が canonical path 経由で動作することを Phase 11 で検証可能な状態 |
| redaction | evidence / spec / script に token 値・URI 値が含まれていない（path 識別子のみ） |

## NO-GO 条件（最終確認）

- 親タスク Issue #762 / #763 / #718 のいずれかが closed でない
- `verify-onepassword-op-uri-canonical.sh` が legacy path を検出して fail する箇所が残っている
- canonical 2 path 以外の deploy-token op:// path 参照が operational surface に残存する
- redaction check で token 値・URI 値・vault item secret 中身の混入が検出された
- operator approval が未取得
- 1Password vault item の archive / delete 経路（dashboard 経路 / `op item delete` 経路など）が operator 間で未合意

## Gate 構造

| Gate | Scope | 承認 |
|------|------|------|
| Gate A | spec / artifacts / Phase 12 strict 7 close-out 整合 | docs merge approval |
| Gate B | Phase 11 manual mutation 実施（archive + canonical verify + grep gate） | user 明示承認（commit / push / PR 別ゲート） |
| Gate B' | legacy item 物理 delete（archive 後の deprecation window 経過後） | 別 sub-gate user 明示承認 |

## 参照資料

- `artifacts.json`
- `outputs/phase-11/evidence-ledger.md`
- `outputs/phase-12/phase12-task-spec-compliance-check.md`

## 統合テスト連携

- Final review は integration command の実行可否と evidence location を確認する
- user approval 前の runtime command 未実行を completed と書かない

## 成果物

- `outputs/phase-10/go-decision.md`
- `outputs/phase-10/sign-off-record.md`
- `outputs/phase-10/user-gate-checklist.md`

## 完了条件

- [ ] GO 判定が記録されている
- [ ] NO-GO 条件すべてが該当しないことが確認されている
- [ ] Gate B 実行のための user approval checklist が作成されている

## タスク100%実行確認【必須】

- [ ] 成果物 3 ファイル作成
- [ ] Gate A / B / B' の境界が user-gate-checklist に明示されている

## 次Phase

phase-11-manual-test.md
