# Phase 7: AC マトリクス

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | magic-link-provider-and-auth-gate-state |
| Phase 番号 | 7 / 13 |
| Phase 名称 | AC マトリクス |
| 作成日 | 2026-04-26 |
| 前 Phase | 6 (異常系検証) |
| 次 Phase | 8 (DRY 化) |
| 状態 | pending |

## 目的

Phase 1 で確定した AC-1〜AC-10 と、Phase 4 の test ID（T-XX / R-XX / Z-XX）、Phase 5 のランブック手順、Phase 6 の failure case（F-XX）を一対多で紐付ける表（AC matrix）を outputs/phase-07/ac-matrix.md に固定する。

## 実行タスク

1. AC × test ID × runbook step × failure case の対応表
2. 未トレース AC の検出
3. 重複 / 漏れの排除

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-01/main.md | AC |
| 必須 | outputs/phase-04/test-matrix.md | test ID |
| 必須 | outputs/phase-05/runbook.md | runbook step |
| 必須 | outputs/phase-06/main.md | failure case |

## 実行手順

### ステップ 1: AC matrix

| AC | 内容 | unit / contract / E2E test ID | runbook step | failure case |
| --- | --- | --- | --- | --- |
| AC-1 | 未登録 → unregistered | T (matrix R1)、Z-02 | S-02、ステップ 2 | F-03 |
| AC-2 | rules != consented → rules_declined | T (matrix R2) | S-04、ステップ 2 | F-04 |
| AC-3 | isDeleted → deleted | T (matrix R3) | S-03、ステップ 2 | F-05 |
| AC-4 | 有効 user → state="sent" + token 1 件 + mail 1 通 | T (matrix R4) | S-05、ステップ 3 | F-11（mail 障害逆検証） |
| AC-5 | 期限切れ token → 401 | T-02 | ステップ 3 | F-07 |
| AC-6 | 二重使用 → 401 | T-03 | ステップ 3 | F-08 |
| AC-7 | `/no-access` 不在 | Z-01 + fs check | S-06 | - |
| AC-8 | secrets が平文で含まれない | gitleaks | secret hygiene | - |
| AC-9 | 5 状態の contract test green | matrix 全行 | sanity check | F-01〜F-17 |
| AC-10 | session callback で memberId / isAdmin 解決 | Z-03 | ステップ 5 | F-15、F-16 |

### ステップ 2: 未トレース AC 検出

- AC-1 〜 AC-10 すべてが test ID と runbook step で対応済み
- 未トレースなし

### ステップ 3: 重複 / 漏れ排除

- AC-9 の「5 状態」は AC-1〜AC-4 + 通常の "input" 状態 = 5 状態を網羅すること
- AC-7 は fs check（`find apps/web/app/no-access -type d`）で 0 件、加えて lint rule で route 追加阻止

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 10 | GO/NO-GO 判定の根拠（全 AC が green か） |
| 08a | contract test 結果と本 matrix を突合 |
| 08b | E2E 結果と本 matrix を突合 |

## 多角的チェック観点

- 不変条件 #2: AC-1, AC-2 で publicConsent / rulesConsent 名称を逸脱していない
- 不変条件 #5: AC-7, AC-10 で apps/web → D1 / 内部 API 経路を担保
- 不変条件 #9: AC-7 で `/no-access` 不在を直接検証
- 不変条件 #10: AC-8 + Phase 9 で無料枠と secret hygiene を確認

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | AC matrix 表 | 7 | pending | 10 行 |
| 2 | 未トレース検出 | 7 | pending | 0 件確認 |
| 3 | 重複排除 | 7 | pending | - |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-07/main.md | Phase 7 サマリ |
| ドキュメント | outputs/phase-07/ac-matrix.md | AC × test ID × runbook × failure |
| メタ | artifacts.json | phase 7 status |

## 完了条件

- [ ] AC-1〜AC-10 すべてが対応関係を持つ
- [ ] 未トレース 0 件
- [ ] 重複なし

## タスク100%実行確認【必須】

- 全 3 サブタスクが completed
- 2 種ドキュメント配置
- 全 AC が表に含まれる
- 不変条件 #2, #5, #9, #10 が紐付け
- 次 Phase へ DRY 化対象を引継ぎ

## 次 Phase

- 次: 8 (DRY 化)
- 引き継ぎ事項: gate-state-resolver / magic-token-issuer / verifier の重複候補を抽出
- ブロック条件: 未トレース AC があれば進まない
