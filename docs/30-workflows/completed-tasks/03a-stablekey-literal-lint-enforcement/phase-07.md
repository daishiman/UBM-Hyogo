# Phase 7: 統合検証

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase 番号 | 7 / 13 |
| Phase 名称 | 統合検証 |
| 作成日 | 2026-05-01 |
| 前 Phase | 6 (異常系検証) |
| 次 Phase | 8 (パフォーマンス・運用) |
| 状態 | pending |
| taskType | implementation |
| visualEvidence | NON_VISUAL |

## 目的

03a 既存 lint stack（`apps/api` / `apps/web` / `packages/*`）への組込み境界を確定し、**AC × 不変条件 × evidence の 1:N トレース表** を `outputs/phase-07/ac-matrix.md` に固定する。
さらに 03a workflow の AC-7 ステータス遷移（規約 → lint enforced）が同 workflow の `implementation-guide.md` で確認できる状態へ整える。

## 統合観点（既存 lint stack との境界）

| 対象 | 既存設定 | 03a-lint 統合方法 | 境界 |
| --- | --- | --- | --- |
| `apps/api` | `apps/api/eslint.config.*`（flat / legacy 共存の可能性あり） | 共通 `packages/eslint-config` 経由で rule を `extends` | flat 側にのみ追加した場合 legacy 側で漏れる → Phase 6 F-6 で fallback |
| `apps/web` | `apps/web/eslint.config.*`（Next.js preset 上） | 同上 | Next.js plugin との rule ID 衝突がないことを確認 |
| `packages/shared` | `packages/shared/eslint.config.*` | 同上 + allow-list 正本モジュールが本 package 内にあるため self-allow を確認 | 自モジュール内のリテラルが PASS することを snapshot で固定 |
| `packages/integrations/google` | 同上 | allow-list 正本モジュールが本 package 内にあるため self-allow を確認 | 同上 |
| その他 `packages/*` | 既存設定継承 | 共通 config 経由で自動適用 | 例外 override（tests/fixtures/seed）が共通で効くこと |

## AC × 不変条件 × evidence × failure case トレース表

| AC | 内容 | evidence | 不変条件 | failure case | verify |
| --- | --- | --- | --- | --- | --- |
| AC-1 | CI が違反 PR で fail する | `dry-run-violation.log`（rule report 1 件以上） | #1 | F-3, F-9, F-10 | dry-run PR の lint exit code |
| AC-2 | 既存 03a 実装が suppression 無しで PASS | `lint-monorepo.log`（exit 0、disable コメント 0） | #1 | F-7, F-8 | `pnpm lint` + grep `eslint-disable` |
| AC-3 | AC-7 を「規約のみ」→「lint enforced」へ昇格 | `implementation-guide-update.diff`（03a 側 phase-12 の更新差分） | #1 | (process) | git diff verify |
| AC-4 | allow-list が `packages/shared/src/zod/field.ts` 等の正本モジュールに限定 | `unit-test.log`（U-1 / U-6 PASS） | #1 | F-2, F-7 | unit 結果 + 設定ファイル grep |
| AC-5 | tests / fixtures / migration seed が override で除外 | `unit-test.log`（U-3 / U-4 / U-5 PASS） | #1 | F-3 | unit 結果 |
| AC-6 | rule 本体の branch coverage 80%+ | `coverage-summary.txt` | (process) | F-9 | coverage threshold gate |
| AC-7 | rule が AST 種別（Literal / TemplateLiteral）を網羅 | `unit-test.log`（U-7 PASS） | #1 | F-9 | unit 結果 |

## 不変条件カバレッジ

| 不変条件 | 観測 evidence 数 | 充足 |
| --- | --- | --- |
| #1 stableKey 直書き禁止（lint enforced） | 4（dry-run-violation.log / lint-monorepo.log / unit-test.log / coverage-summary.txt） | ✓ |

不変条件 #1 を主軸とし、補助的な観点（lint 基盤健全性 / 運用規律）は Phase 6 / Phase 8 にてカバーされていることを記載する。

## 03a workflow AC-7 ステータス遷移確認

| 確認項目 | 確認方法 |
| --- | --- |
| 03a の `implementation-guide.md` で AC-7 行が「lint enforced」表記になっているか | `grep -n 'AC-7' docs/30-workflows/03a-parallel-forms-schema-sync-and-stablekey-alias-queue/outputs/phase-12/implementation-guide.md` |
| 03a の `artifacts.json` に本タスクの evidence 参照が追記されているか | jq で本タスクの `outputs/phase-11/evidence/*` パスが含まれることを確認 |
| 03a の `index.md` に本タスク（03a-stablekey-literal-lint-enforcement）への相互参照リンクがあるか | grep / 目視 |

これらの遷移は **本タスクの Phase 11 実行後** に発火する。本仕様書では確認方法のみ固定する。

## 統合テストの最終 verify 手順

1. `pnpm install --force` で依存解決
2. `pnpm typecheck` で型崩壊が起きていないこと
3. `pnpm lint` で全 monorepo PASS（exit 0）
4. `pnpm --filter <lint-package> test --coverage` で unit + coverage 取得
5. dry-run PR（故意違反）を一時 branch で作り `pnpm lint` が exit code 非 0 となることを確認
6. 03a workflow 側の `implementation-guide.md` 差分を `git diff` で取得し evidence 化

## 実行タスク

- [ ] `outputs/phase-07/main.md` にサマリ
- [ ] `ac-matrix.md` に 7 AC × evidence × 不変条件 × failure case のトレース表配置
- [ ] 不変条件カバレッジ表配置
- [ ] 既存 lint stack との境界表配置
- [ ] 03a AC-7 ステータス遷移確認手順を明記

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-04/evidence-checklist.md | evidence 一覧 |
| 必須 | outputs/phase-05/runbook.md | 実装 Step |
| 必須 | outputs/phase-06/main.md | failure case |
| 必須 | docs/30-workflows/03a-parallel-forms-schema-sync-and-stablekey-alias-queue/outputs/phase-12/implementation-guide.md | AC-7 遷移先 |

## 完了条件

- [ ] AC × evidence × 不変条件 × failure case の 4 軸トレース完成
- [ ] 不変条件 #1 が 4 件以上の evidence で観測
- [ ] 03a workflow AC-7 遷移確認手順を記述
- [ ] 既存 lint stack 境界表を配置

## タスク100%実行確認【必須】

- [ ] 全実行タスク completed
- [ ] artifacts.json の phase 7 を completed

## 次 Phase

- 次: Phase 8 (パフォーマンス・運用)
- 引き継ぎ: AC マトリクスの「想定異常」列、CI lint job の baseline 実行時間

## 成果物

| ファイル | 内容 |
| --- | --- |
| `outputs/phase-07/main.md` | 統合検証サマリ |
| `outputs/phase-07/integration-check.md` | apps / packages / suppression / allow-list snapshot 確認表 |

## 統合テスト連携

本 Phase は Phase 4〜6 の結果を統合し、Phase 11 の NON_VISUAL evidence 取得対象を確定する。
