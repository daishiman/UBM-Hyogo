# Phase 12: ドキュメント更新

[実装区分: 実装仕様書]

| 項目   | 値                                                          |
| ------ | ----------------------------------------------------------- |
| Phase  | 12 / 13（ドキュメント更新）                                 |
| 依存   | Phase 11                                                    |
| 成果物 | outputs/phase-12/*.md（strict 7）                           |
| 種別   | NON_VISUAL implementation task / `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` |

> **このファイルの位置づけ**: 本 phase-12.md は Phase 12 の実行記録である。local 実装・決定論的証跡は
> current facts として反映済みで、残る Cloudflare staging runtime smoke / commit / push / PR は user-gated。
> docs-only / spec_created ラベルに寄せず、実態優先で `apps/web` 実コード、Phase 12 strict 7、正本仕様同期を
> same-wave sync で閉じた（task-specification-creator Phase 12 ルール）。

## Phase 12 着手前チェック（最初の作業）

実装サイクルで Phase 12 に着手する際、最初に以下を機械照合してから Task 12-1 へ進む。

1. `outputs/artifacts.json` の `phase12_strict_outputs`（7 件）と `outputs/phase-12/` 実体を 1 対 1 で突合する。
2. `docs/30-workflows/fix-admin-scr-err-stg-fu-001-auth-env-via-getenv/artifacts.json`（root）と
   `outputs/artifacts.json`（output）を diff し、`status` / `phases[].status` の同値性を確認する。
3. Phase 1 で記録したタスク分類（NON_VISUAL implementation task）が Phase 11 着手時から変わっていないかを確認する。
   コード実装が後から入った場合は Step 2 / screenshot 判定の再判定ルール（後述）を適用する。

## Task 12-1: 実装ガイド作成（2 パート構成）

`outputs/phase-12/implementation-guide.md` を以下 2 部構成で作成する。close-out 時の必須項目:

| パート | 対象読者         | 必須内容                                                                                       |
| ------ | ---------------- | ---------------------------------------------------------------------------------------------- |
| Part 1 | 中学生レベル     | 日常の例え話を必ず含める / 専門用語を避ける / 「なぜ必要か」→「何をするか」の順                  |
| Part 2 | 技術者レベル     | `AuthEnv` 型定義 / `getAuthEnv()` シグネチャ / 使用例 / エラーハンドリング / 設定パラメータ一覧 |

- Part 2 の識別子（`getAuthEnv` / `AuthEnvSchema` / `readRawEnv` / `AuthEnv`）はcurrent factsに現行コードで `grep` 確認し、
  型定義・interface から引用する（手書き snippet の identifier drift を避ける）。
- 末尾に `## 視覚証跡` セクションを設け、`UI/UX変更なしのため Phase 11 スクリーンショット不要` と明記する。
  代替証跡として `outputs/phase-10/phase-10.md` と `outputs/phase-11/manual-test-result.md`
  （`auth.spec.ts` / `env.spec.ts` の自動テスト結果）を参照する。
- NON_VISUAL 判定のため `outputs/phase-11/screenshots/.gitkeep` を削除し、PNG 0 件ディレクトリを残さない。

## Task 12-2: システム仕様書更新（Step 1-A / 1-B / 1-C + 条件付き Step 2）

`outputs/phase-12/system-spec-update-summary.md` を作成し、4 サブステップの判定を個別に記録する。

| Step     | 必須 | close-out 時の必須記録                                                                                              |
| -------- | ---- | ------------------------------------------------------------------------------------------------------------------ |
| Step 1-A | ✅   | 完了タスク記録 + 関連ドキュメントリンク + 変更履歴 + quick-reference / resource-map / task-workflow-active の same-wave 同期先を列挙 |
| Step 1-B | ✅   | 実装状況テーブルへ status を記録。local 実装済み・runtime user-gated として `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` を記録 |
| Step 1-C | ✅   | 関連タスクテーブル（親 #849/#877、先行単一ファイル仕様）のステータスを current facts へ更新                         |
| Step 2   | 条件 | 新規インターフェース追加時のみ。本タスクは `getAuthEnv()` / `AuthEnv` / `AuthEnvSchema` を新設 → **Step 2 該当**     |

- Step 2 該当根拠: `env.ts` に新規 public 関数 `getAuthEnv()` と export 型 `AuthEnv` を追加するため、
  「新規インターフェース追加」に該当する。current facts `apps/web` env アクセス契約（aiworkflow-requirements の
  architecture / interfaces 系正本）を `getAuthEnv()` 経由・safeParse partial・throw しない契約へ同期する。
- issue #862 字義からの deviation（`getEnv()` → `getAuthEnv()` 再解釈、throw 維持 → fail-closed 優先）を
  本 summary に必ず記録する（Phase 3 §2 の deviation 表を current facts として転記）。

## Task 12-3: documentation-changelog.md

`outputs/phase-12/documentation-changelog.md` を作成し、全 Step（1-A / 1-B / 1-C / Step 2）の結果を
**個別に明記**する（「該当なし」も記録）。workflow-local 同期と global skill sync を**別ブロック**で記録する
（[Feedback BEFORE-QUIT-003]）。

## Task 12-4: 未タスク検出レポート（0 件でも出力必須）

`outputs/phase-12/unassigned-task-detection.md` を作成する。

- 候補として `apps/web/src/lib/fetch/public.ts` の `getCloudflareContext().env` 直接参照を同型統一する
  follow-up を必ず記録する（本タスクは `auth.ts` 限定のため別 surface）。
- 「関連タスク差分確認」セクションを設け、既存タスク ID との重複を確認する（[FB-CANCEL-004-2]）。
- `current`（本サイクルで生じた gap）と `baseline`（元タスク仕様で scope 外宣言済み項目）を分離して記録する。

## Task 12-5: skill-feedback-report.md（改善点なしでも出力必須）

`outputs/phase-12/skill-feedback-report.md` を作成し、テンプレート改善 / ワークフロー改善 / ドキュメント改善の
3 観点を記録する。改善余地が既存 skill で吸収済みの場合は `no-op` と明記する。

## Task 12-6: phase12 compliance check（root evidence）

`outputs/phase-12/phase12-task-spec-compliance-check.md` を作成し、canonical heading / Phase 11 evidence /
6 成果物の充足を root evidence として残す。local close-out 済み項目は PASS、Cloudflare staging runtime smoke /
commit / push / PR は user-gated pending として分離して記述する。

## Phase 12 漏れ防止チェック（close-out 時に消化）

- [x] Step 1-C（関連タスクテーブル）を実行した
- [x] documentation-changelog.md に Step 全件（1-A/1-B/1-C/Step 2）を記載した
- [x] unassigned-task-detection.md を出力し `public.ts` follow-up 候補を同サイクルで実装済みとして記録した
- [x] skill-feedback-report.md を出力した
- [x] aiworkflow-requirements の quick-reference / resource-map / task-workflow-active / SKILL-changelog / artifact inventory を更新した
- [x] `artifacts.json` と `outputs/artifacts.json` の parity を確認した
- [x] implementation-guide.md 内の識別子を現行コードで grep 確認した
