# Phase 7: AC マトリクス

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | ut-gov-005-docs-only-nonvisual-template-skill-sync |
| Phase 番号 | 7 / 13 |
| Phase 名称 | AC マトリクス |
| 作成日 | 2026-04-29 |
| 上流 | Phase 6（異常系検証） |
| 下流 | Phase 8（DRY 化） |
| 状態 | pending |
| user_approval_required | false |

## 目的

AC-1〜AC-10 と Phase 4 で定義した TC-1〜TC-8、Phase 6 で定義した FC-1〜FC-9 を **追跡可能行列** に統合する。各 AC について「内容 / 検証 phase / 検証 TC・FC / 検証コマンド / 受入合格条件 / 失敗時アクション / 証跡 path」を一意に対応付け、Phase 9 / Phase 10 / Phase 11 / Phase 12 で参照可能にする。

## 入力

- `outputs/phase-01/main.md`（AC-1〜AC-10 の確定）
- `outputs/phase-04/test-strategy.md`（TC-1〜TC-8）
- `outputs/phase-06/failure-cases.md`（FC-1〜FC-9）
- `artifacts.json`（`phases[].outputs` の正本）

## AC マトリクス

| AC ID | 内容 | 検証 Phase | 検証 TC / FC | 検証コマンド（代表）| 受入合格条件 | 失敗時アクション | 証跡 path |
| --- | --- | --- | --- | --- | --- | --- | --- |
| AC-1 | `references/phase-template-phase11.md` に docs-only / NON_VISUAL 縮約テンプレ追加 + 必須 artefact 3 点（`main.md` / `manual-smoke-log.md` / `link-checklist.md`）固定 + screenshot 不要明文化 | Phase 5 / 9 | TC-2-1, TC-2-2, TC-2-3 | `rg -n "縮約テンプレ\|main\.md\|screenshot" .claude/skills/task-specification-creator/references/phase-template-phase11.md` | 全 grep が 1 件以上ヒット | Phase 5 Step 2 を再実行し追記内容を補完 | `outputs/phase-05/implementation-runbook.md` Step 7 ログ |
| AC-2 | `visualEvidence == "NON_VISUAL"` を縮約テンプレ発火条件として SKILL.md と `phase-template-phase11.md` 両方に明記 | Phase 5 / 9 | TC-1-1, TC-1-2, TC-2-4 | `rg -n "NON_VISUAL" .claude/skills/task-specification-creator/SKILL.md .claude/skills/task-specification-creator/references/phase-template-phase11.md` | 両ファイルで 1 件以上 | Phase 5 Step 1 / 2 のいずれかを再実行 | `outputs/phase-05/implementation-runbook.md` Step 7 ログ |
| AC-3 | Phase 12 Part 2 必須 5 項目（型 / API / 例 / エラー / 設定値）を C12P2-1〜5 として一対一でチェック項目化 | Phase 5 / 9 | TC-3-1, TC-3-2 / FC-2 | `rg -n "C12P2-[1-5]" .claude/skills/task-specification-creator/references/phase-12-completion-checklist.md` | 5 件すべてヒット | Phase 5 Step 3 / 4 を再実行 | `outputs/phase-05/implementation-runbook.md` Step 7 ログ |
| AC-4 | `phase-12-completion-checklist.md` に docs-only 判定ブランチ + `spec_created`（workflow root）と `completed`（Phase 別）の状態分離記述 | Phase 5 / 9 | TC-3-3, TC-3-4 / FC-3 | `rg -n "docs-only\|workflow_state\|workflow root" .claude/skills/task-specification-creator/references/phase-12-completion-checklist.md` | 全パターンで 1 件以上 | Phase 5 Step 4 を再実行 | `outputs/phase-05/implementation-runbook.md` Step 7 ログ |
| AC-5 | `.claude/skills/task-specification-creator/` ↔ `.agents/skills/task-specification-creator/` mirror diff 0 | Phase 5 末 / 9 / 11 | TC-5-1, TC-5-2 / FC-4 | `diff -qr .claude/skills/task-specification-creator .agents/skills/task-specification-creator` | 出力 0 行 | Phase 5 Step 6 の `cp` ループを再実行 | `outputs/phase-05/implementation-runbook.md` Step 7 ログ / `outputs/phase-09/main.md` / `outputs/phase-11/manual-smoke-log.md` |
| AC-6 | `phase-template-phase1.md`（または `phase-template-core.md`）に「Phase 1 で `visualEvidence` を必須入力化」ルール追記 | Phase 5 / 9 | TC-4-1, TC-4-2 / FC-1 | `rg -n "visualEvidence.*必須\|必須入力" .claude/skills/task-specification-creator/references/phase-template-phase1.md` | 1 件以上ヒット | Phase 5 Step 5 を再実行 | `outputs/phase-05/implementation-runbook.md` Step 7 ログ |
| AC-7 | タスク種別（docs-only / NON_VISUAL / skill_governance）が Phase 1 で固定され `artifacts.json.metadata` と一致 | Phase 1 / 9 / 12 | metadata 整合 | `jq -r '.metadata \| .taskType, .visualEvidence, .scope' docs/30-workflows/ut-gov-005-docs-only-nonvisual-template-skill-sync/artifacts.json` | `docs-only` / `NON_VISUAL` / `skill_governance` を出力 | `artifacts.json` を Phase 1 仕様に合わせ修正 | `artifacts.json` / `index.md` / `phase-01.md` |
| AC-8 | 本ワークフロー Phase 11 / 12 が縮約テンプレを **自己適用**（drink-your-own-champagne）。Phase 11 outputs は 3 点で構成 + 第一適用例として参照リンク化 | Phase 11 | TC-7-1, TC-7-2, TC-8-2 / FC-9 | `ls docs/30-workflows/ut-gov-005-docs-only-nonvisual-template-skill-sync/outputs/phase-11/{main.md,manual-smoke-log.md,link-checklist.md}` + `rg -n "ut-gov-005" .claude/skills/task-specification-creator/references/phase-template-phase11.md` | 3 ファイル存在 + 参照リンク 1 件以上 | Phase 5 完了確認 → Phase 11 を再着手 | `outputs/phase-11/main.md` / `outputs/phase-11/manual-smoke-log.md` / `outputs/phase-11/link-checklist.md` |
| AC-9 | 代替案 4 案以上（A / B / C / D）を PASS / MINOR / MAJOR で評価し、base case D で確定 | Phase 3 | review | `rg -n "PASS\|MINOR\|MAJOR" docs/30-workflows/ut-gov-005-docs-only-nonvisual-template-skill-sync/outputs/phase-03/main.md` | 4 案すべての評価が記載 + D = PASS | Phase 3 main.md を補強 | `outputs/phase-03/main.md` |
| AC-10 | Phase 1〜13 が `artifacts.json.phases[]` と完全一致（1〜3 = `completed` / 4〜12 = `pending` / 13 = `blocked`） + 4 条件（価値性 / 実現性 / 整合性 / 運用性）が PASS | Phase 1 / 3 / 9 | validator | `jq -r '.phases[] \| "\(.phase) \(.status)"' docs/30-workflows/ut-gov-005-docs-only-nonvisual-template-skill-sync/artifacts.json` | 期待出力（13 行）と完全一致 | `artifacts.json` 修正 + Phase 1 / 3 main.md 修正 | `artifacts.json` / `outputs/phase-01/main.md` / `outputs/phase-03/main.md` |

## 依存トレース

| AC | 上流 Phase | 下流 Phase | 自動化レベル |
| --- | --- | --- | --- |
| AC-1 | Phase 1 / 2 | Phase 9 / 10 / 11 | 自動（rg）|
| AC-2 | Phase 1 / 2 | Phase 9 / 10 | 自動（rg）|
| AC-3 | Phase 1 / 2 / 6（FC-2）| Phase 9 / 12 | 自動（rg）|
| AC-4 | Phase 1 / 2 / 6（FC-3）| Phase 9 / 12 | 自動（rg）|
| AC-5 | Phase 2 / 5 / 6（FC-4）| Phase 9 / 11 | 自動（diff）|
| AC-6 | Phase 1 / 2 / 6（FC-1）| Phase 9 | 自動（rg）|
| AC-7 | Phase 1 | Phase 9 / 12 | 自動（jq）|
| AC-8 | Phase 2 / 5 / 6（FC-9）| Phase 11 / 12 | 半自動（Phase 11 実測）|
| AC-9 | Phase 3 | Phase 10 | 手動（review）|
| AC-10 | Phase 1 / 3 | Phase 9 / 12 | 自動（jq）|

## TC × FC × AC 三項対応

| AC | 関連 TC | 関連 FC（防御線）|
| --- | --- | --- |
| AC-1 | TC-2-1〜TC-2-3 | FC-6（既存セクション矛盾）|
| AC-2 | TC-1-1, TC-1-2, TC-2-4 | FC-1（メタ未設定）|
| AC-3 | TC-3-1, TC-3-2 | FC-2（Part 2 漏れ）|
| AC-4 | TC-1-3, TC-3-3, TC-3-4 | FC-3（状態誤書換え）|
| AC-5 | TC-5-1, TC-5-2 | FC-4（mirror 同期忘れ）/ FC-8（CI gate 不在）|
| AC-6 | TC-4-1, TC-4-2 | FC-1（メタ未設定）|
| AC-7 | metadata 整合 | — |
| AC-8 | TC-7-1, TC-7-2, TC-8-2 | FC-9（自己適用循環）|
| AC-9 | review | — |
| AC-10 | jq 整合 | — |

## 証跡 path 命名（先取り）

Phase 11 / 12 で生成される証跡 path を本 Phase で先行確定（パスズレ防止）。

| 証跡 path | 生成 Phase | 紐付く AC |
| --- | --- | --- |
| `outputs/phase-05/implementation-runbook.md` | Phase 5 | AC-1, AC-2, AC-3, AC-4, AC-5, AC-6 |
| `outputs/phase-06/failure-cases.md` | Phase 6 | FC 全件 |
| `outputs/phase-09/main.md` | Phase 9 | AC-5, AC-7, AC-10（再確認）|
| `outputs/phase-11/main.md` | Phase 11 | AC-8 |
| `outputs/phase-11/manual-smoke-log.md` | Phase 11 | AC-5（mirror 再確認）/ AC-8 |
| `outputs/phase-11/link-checklist.md` | Phase 11 | AC-8 |
| `outputs/phase-12/implementation-guide.md` | Phase 12 | AC-3（自己適用 C12P2-1〜5 検証）|
| `outputs/phase-12/phase12-task-spec-compliance-check.md` | Phase 12 | AC-4 |
| `outputs/phase-12/unassigned-task-detection.md` | Phase 12 | TECH-M-02, TECH-M-03, TECH-M-04（FC-8 等）|

## ゲート連携

| Phase | ゲート条件 | 関連 AC |
| --- | --- | --- |
| Phase 5 → 6 | TC-1〜TC-6 全 GREEN | AC-1〜AC-6 |
| Phase 9 → 10 | mirror diff 0 + typecheck/lint PASS + jq 整合 | AC-5, AC-7, AC-10 |
| Phase 10 → 11 | base case D PASS 維持 + 縮約テンプレ skill 反映済 | AC-9, AC-1, AC-2 |
| Phase 11 → 12 | 自己適用 3 点 outputs 完了 | AC-8 |
| Phase 12 → 13 | C12P2-1〜5 全 PASS + 状態分離維持 | AC-3, AC-4 |

## 実行タスク

1. AC-1〜AC-10 × 検証コマンド × 証跡 path 対応表を作成
2. 依存トレース（上流 / 下流 Phase / 自動化レベル）を作成
3. TC × FC × AC 三項対応表を作成
4. 証跡 path 命名を先取り確定
5. ゲート連携表を作成
6. Phase 9 / Phase 10 で参照可能な形式に整理

## 参照資料

| 種別 | パス |
| --- | --- |
| 必須 | `outputs/phase-01/main.md` |
| 必須 | `outputs/phase-04/test-strategy.md` |
| 必須 | `outputs/phase-06/failure-cases.md` |
| 必須 | `artifacts.json` |
| 参考 | `docs/30-workflows/skill-ledger-b1-gitattributes/phase-07.md`（フォーマット模倣元）|

## 依存Phase明示

- Phase 1 / 4 / 6 成果物を参照する。

## 成果物

| パス | 役割 |
| --- | --- |
| `outputs/phase-07/ac-matrix.md` | AC × 検証 × 証跡 / 依存トレース / TC×FC×AC 三項対応 / 証跡 path 命名 / ゲート連携 |

## 完了条件 (DoD)

- [ ] AC-1〜AC-10 全てがマトリクスに含まれる
- [ ] 各 AC に検証コマンドが紐付く
- [ ] 各 AC に証跡 path が紐付く（Phase 11 / 12 未生成分は path 命名のみ）
- [ ] 依存トレース表が作成済
- [ ] TC × FC × AC 三項対応表が作成済
- [ ] ゲート連携表が作成済

## 苦戦箇所・注意

- **証跡 path の先取り**: Phase 11 / 12 の成果物は未生成だが、`artifacts.json.phases[].outputs` と一致する path を Phase 7 で確定。Phase 11 / 12 で実体作成時にパスズレが起きないよう本 Phase で命名固定
- **AC-9 の機械検証困難**: 「PASS / MINOR / MAJOR の評価が妥当か」は機械検証できない。`rg "PASS|MINOR|MAJOR"` の minimal grep で「記述存在」のみ自動化し、内容妥当性は Phase 10 review で担保
- **AC-8 の循環参照**: 自己適用は Phase 11 着手後に初めて GREEN。Phase 7 時点では「Phase 11 で初回 GREEN を取る」と明記しないと、Phase 9 で AC-8 を強制的に GREEN にしようとして失敗する
- **TECH-M との混同**: AC は本タスクで GREEN にする項目。TECH-M-01〜04（Phase 8 / 12 解決）は AC ではなく追跡項目。マトリクスに混ぜない
- **`jq` 期待出力の硬直化**: Phase 数増減があった場合 AC-10 の期待出力が変わる。`artifacts.json` を正本として参照する形にして、ハードコードを避ける

## タスク100%実行確認【必須】

- [ ] 本 Phase の実行タスクをすべて確認する。
- [ ] 成果物パスと `artifacts.json` の outputs が一致していることを確認する。
- [ ] 未実行項目は pending または blocked として明示し、完了済みと誤読される表現を残さない。

## 統合テスト連携

- 本タスクは docs-only / NON_VISUAL の skill 改善であり、アプリケーション統合テストは追加しない。
- 統合検証は `diff -qr` mirror parity、`mise exec -- pnpm typecheck` / `pnpm lint` の副作用なし確認、Phase 11 縮約テンプレ自己適用 smoke で代替する。

## 次 Phase

- 次: Phase 8（DRY 化）
- 引き継ぎ: AC マトリクス / 証跡 path 命名 / ゲート連携 / TC×FC×AC 三項対応
