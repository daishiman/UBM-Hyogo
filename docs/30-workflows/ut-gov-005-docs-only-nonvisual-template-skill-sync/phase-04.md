# Phase 4: テスト戦略

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | ut-gov-005-docs-only-nonvisual-template-skill-sync |
| Phase 番号 | 4 / 13 |
| Phase 名称 | テスト戦略 |
| 作成日 | 2026-04-29 |
| 上流 | Phase 3（設計レビュー） |
| 下流 | Phase 5（実装ランブック） |
| 状態 | pending |
| user_approval_required | false |

## 目的

本タスクは docs-only / NON_VISUAL であり、ランタイムコードの単体テストは追加しない。代わりに、追記する skill ファイル（`SKILL.md` + references 6 ファイル）と `.agents/` mirror 同期、及び縮約テンプレの自己適用妥当性を **検証コマンド集合** として定義する。Phase 5 実装ランブックで「Red → Green」を回せる粒度に分解し、Phase 7 AC マトリクスから一意に参照可能な TC ID を確定する。

## 入力

- `outputs/phase-02/main.md`（編集計画 / mirror 同期手順 / state ownership / 自己適用順序ゲート）
- `outputs/phase-03/main.md`（PASS 判定 / リスク R-1〜R-8 / MINOR TECH-M-01〜04）
- `outputs/phase-01/main.md`（AC-1〜AC-10）

## 検証カテゴリ

| カテゴリ | 概要 | 自動化可否 |
| --- | --- | --- |
| 構造 | skill ファイル群の追記内容が指定セクションに含まれること（grep / rg ベース） | 自動 |
| Mirror | `.claude/skills/task-specification-creator/` と `.agents/skills/task-specification-creator/` の差分 0 | 自動 |
| Lint | markdown lint / link check（既存リポジトリ規約準拠） | 自動 |
| 縮約テンプレ整合 | 縮約テンプレが 3 canonical artefact（`main.md` / `manual-smoke-log.md` / `link-checklist.md`）を必須化していること | 自動（grep） |
| Compliance Check | Phase 12 Part 2 必須 5 項目（C12P2-1〜5）が `phase-12-completion-checklist.md` に項目化 | 自動（grep） |
| 自己適用 | 本ワークフロー Phase 11 outputs が縮約テンプレ通り 3 点で構成されること | 半自動（Phase 11 で実測） |
| 副作用なし確認 | `mise exec -- pnpm typecheck` / `pnpm lint` が PASS（コード変更ゼロの証跡） | 自動 |

## TC（テストケース）

### TC-1 SKILL.md タスクタイプ判定フローの存在

| TC ID | 検証 | 期待 | コマンド |
| --- | --- | --- | --- |
| TC-1-1 | SKILL.md に「タスクタイプ判定フロー」セクションが追加 | 1 件以上ヒット | `rg -n "タスクタイプ判定フロー" .claude/skills/task-specification-creator/SKILL.md` |
| TC-1-2 | `visualEvidence: NON_VISUAL` 発火条件の明記 | 1 件以上ヒット | `rg -n "NON_VISUAL" .claude/skills/task-specification-creator/SKILL.md` |
| TC-1-3 | 状態分離（`spec_created` vs `completed`）の明記 | 両方とも 1 件以上 | `rg -n "spec_created" .claude/skills/task-specification-creator/SKILL.md && rg -n "completed" .claude/skills/task-specification-creator/SKILL.md` |

### TC-2 phase-template-phase11.md 縮約テンプレ追記

| TC ID | 検証 | 期待 | コマンド |
| --- | --- | --- | --- |
| TC-2-1 | 「docs-only / NON_VISUAL 縮約テンプレ」セクションの存在 | 1 件以上 | `rg -n "縮約テンプレ" .claude/skills/task-specification-creator/references/phase-template-phase11.md` |
| TC-2-2 | 3 canonical artefact の固定（`main.md` / `manual-smoke-log.md` / `link-checklist.md`） | 3 つすべてヒット | `rg -n "main\.md\|manual-smoke-log\.md\|link-checklist\.md" .claude/skills/task-specification-creator/references/phase-template-phase11.md` |
| TC-2-3 | screenshot 不要の明文化 | 1 件以上 | `rg -n "screenshot" .claude/skills/task-specification-creator/references/phase-template-phase11.md` |
| TC-2-4 | 発火条件 `visualEvidence == "NON_VISUAL"` の記述 | 1 件以上 | `rg -n "NON_VISUAL" .claude/skills/task-specification-creator/references/phase-template-phase11.md` |

### TC-3 phase-template-phase12.md / compliance-check の Part 2 5 項目

| TC ID | 検証 | 期待 | コマンド |
| --- | --- | --- | --- |
| TC-3-1 | C12P2-1〜C12P2-5 のチェック ID 全 5 件 | 5 件すべてヒット | `rg -n "C12P2-[1-5]" .claude/skills/task-specification-creator/references/phase-12-completion-checklist.md` |
| TC-3-2 | 5 項目のラベル（型 / API / 例 / エラー / 設定値）すべてヒット | 5 件以上 | `rg -n "型定義\|API シグネチャ\|使用例\|エラー処理\|設定" .claude/skills/task-specification-creator/references/phase-12-completion-checklist.md` |
| TC-3-3 | docs-only ブランチの存在 | 1 件以上 | `rg -n "docs-only" .claude/skills/task-specification-creator/references/phase-12-completion-checklist.md` |
| TC-3-4 | 状態分離（workflow root vs phase status）記述 | 1 件以上 | `rg -n "workflow_state\|workflow root" .claude/skills/task-specification-creator/references/phase-12-completion-checklist.md` |

### TC-4 phase-template-phase1.md / phase-template-core.md（visualEvidence 必須入力ルール）

| TC ID | 検証 | 期待 | コマンド |
| --- | --- | --- | --- |
| TC-4-1 | `phase-template-phase1.md` に「Phase 1 必須入力」記述 | 1 件以上 | `rg -n "visualEvidence.*必須\|必須入力" .claude/skills/task-specification-creator/references/phase-template-phase1.md` |
| TC-4-2 | `phase-template-core.md` から判定フローへの参照リンク | 1 件以上 | `rg -n "タスクタイプ判定フロー\|phase-template-phase11" .claude/skills/task-specification-creator/references/phase-template-core.md` |

### TC-5 Mirror parity（`.claude` ↔ `.agents`）

| TC ID | 検証 | 期待 | コマンド |
| --- | --- | --- | --- |
| TC-5-1 | mirror diff 0 | 出力 0 行 | `diff -qr .claude/skills/task-specification-creator .agents/skills/task-specification-creator` |
| TC-5-2 | 6 ファイルすべての存在確認（mirror 側） | 6 件すべて存在 | `ls .agents/skills/task-specification-creator/SKILL.md .agents/skills/task-specification-creator/references/{phase-template-phase11,phase-template-phase12,phase12-task-spec-compliance-check,phase-template-phase1,phase-template-core,phase-11-non-visual-alternative-evidence}.md` |

### TC-6 副作用なし確認（runtime 影響ゼロ）

| TC ID | 検証 | 期待 | コマンド |
| --- | --- | --- | --- |
| TC-6-1 | typecheck PASS | 終了コード 0 | `mise exec -- pnpm typecheck` |
| TC-6-2 | lint PASS | 終了コード 0 | `mise exec -- pnpm lint` |

### TC-7 自己適用（drink-your-own-champagne / Phase 11 で実測）

| TC ID | 検証 | 期待 | コマンド |
| --- | --- | --- | --- |
| TC-7-1 | 本ワークフロー Phase 11 outputs が 3 点で構成 | 3 ファイル存在 | `ls docs/30-workflows/ut-gov-005-docs-only-nonvisual-template-skill-sync/outputs/phase-11/{main.md,manual-smoke-log.md,link-checklist.md}` |
| TC-7-2 | screenshot 関連 outputs が存在しない | 0 件 | `ls docs/30-workflows/ut-gov-005-docs-only-nonvisual-template-skill-sync/outputs/phase-11/ \| rg -i "screenshot\|manual-test-result\|manual-test-checklist" \|\| true` |

### TC-8 縮約テンプレが既存「docs-only / spec_created 必須3点」セクションと整合

| TC ID | 検証 | 期待 | コマンド |
| --- | --- | --- | --- |
| TC-8-1 | 既存セクションと矛盾なし（VISUAL 必須 outputs 一覧と別セット明記） | 1 件以上 | `rg -n "別セット\|混在させない" .claude/skills/task-specification-creator/references/phase-template-phase11.md` |
| TC-8-2 | 自己適用第一例への参照リンク | 1 件以上 | `rg -n "ut-gov-005-docs-only-nonvisual-template-skill-sync" .claude/skills/task-specification-creator/references/phase-template-phase11.md` |

## 検証マトリクス（AC × TC）

| AC ID | 関連 TC | 自動化 |
| --- | --- | --- |
| AC-1 | TC-2-1, TC-2-2, TC-2-3 | 自動 |
| AC-2 | TC-1-1, TC-1-2, TC-2-4 | 自動 |
| AC-3 | TC-3-1, TC-3-2 | 自動 |
| AC-4 | TC-3-3, TC-3-4, TC-1-3 | 自動 |
| AC-5 | TC-5-1, TC-5-2 | 自動 |
| AC-6 | TC-4-1, TC-4-2 | 自動 |
| AC-7 | metadata 整合（artifacts.json ↔ index.md）| 自動（jq）|
| AC-8 | TC-7-1, TC-7-2, TC-8-2 | 半自動（Phase 11 実測）|
| AC-9 | Phase 3 PASS 判定 review | 手動 |
| AC-10 | artifacts.json `phases[].status` の機械チェック | 自動（jq）|

## 実行順序（fail-fast）

1. **TC-5（mirror diff）先行** — 同期忘れを最速で検出
2. **TC-1〜TC-4（構造 grep）** — 6 ファイルの追記内容を確認
3. **TC-6（typecheck / lint）** — 副作用なしの最終確認
4. **TC-7（自己適用）** — Phase 11 着手後に実測
5. **TC-8（整合）** — Phase 8 DRY 化後に再確認

> **fail-fast 設計**: TC-5 を最初に走らせることで、`.claude` のみ更新して `.agents` に同期忘れた典型ケースを最短で検出する。

## skill-fixture-runner との関係

skill-fixture-runner による SKILL.md 構造検証（YAML フロントマター / Anchors / セクション構造）は本タスクスコープ外（Phase 3 MINOR TECH-M-04 として別タスク化）。本 Phase の TC-1〜TC-8 は rg / diff / pnpm の標準コマンドのみで完結する。

## 実行タスク

1. TC-1〜TC-8 を `outputs/phase-04/test-strategy.md` に展開
2. AC × TC 検証マトリクスを作成
3. fail-fast 順序を確定
4. 各 TC に対する具体的な rg / diff / pnpm コマンドを記載
5. skill-fixture-runner との境界を明文化（スコープ外宣言）

## 参照資料

| 種別 | パス |
| --- | --- |
| 必須 | `outputs/phase-01/main.md` |
| 必須 | `outputs/phase-02/main.md` |
| 必須 | `outputs/phase-03/main.md` |
| 必須 | `.claude/skills/task-specification-creator/SKILL.md` |
| 必須 | `.claude/skills/task-specification-creator/references/phase-template-phase11.md` |
| 参考 | `docs/30-workflows/skill-ledger-b1-gitattributes/phase-04.md`（フォーマット模倣元）|

## 依存Phase明示

- Phase 1 / 2 / 3 成果物を参照する。

## 成果物

| パス | 役割 |
| --- | --- |
| `outputs/phase-04/test-strategy.md` | TC-1〜TC-8 / AC×TC マトリクス / fail-fast 順序 / コマンド集合 |

## 完了条件 (DoD)

- [ ] TC-1〜TC-8 が成果物に記述
- [ ] 各 TC に対する rg / diff / pnpm コマンドが書かれている
- [ ] AC × TC マトリクスが作成済
- [ ] fail-fast 実行順序確定
- [ ] skill-fixture-runner スコープ外宣言が明記

## 苦戦箇所・注意

- **mirror diff の見落とし**: TC-5 を後回しにすると、6 ファイル中 1 ファイル同期漏れに最後まで気付かない。**必ず最初に TC-5 を実行**
- **rg と grep の挙動差**: 本 Phase の検証コマンドは `rg`（ripgrep）前提。CI 等で grep 環境差が出る場合は `grep -rn` への置換手順を Phase 5 で明記
- **screenshot 不要の検証**: TC-7-2 は「存在しないこと」を確認するため、`|| true` で終了コードを保護しないとシェル落ちする
- **Phase 11 未実行時の TC-7**: TC-7 は本ワークフロー Phase 11 着手後でないと FAIL する。Phase 4 では「Phase 11 で実測」と明記し、Phase 7 AC マトリクスでも「Phase 11 で初回 GREEN」を残す
- **fixture-runner との境界曖昧化**: 「ついでに fixture-runner にも乗せられそう」と判断すると本タスクが膨張する。MINOR TECH-M-04 として別タスクで切り出す

## タスク100%実行確認【必須】

- [ ] 本 Phase の実行タスクをすべて確認する。
- [ ] 成果物パスと `artifacts.json` の outputs が一致していることを確認する。
- [ ] 未実行項目は pending または blocked として明示し、完了済みと誤読される表現を残さない。

## 統合テスト連携

- 本タスクは docs-only / NON_VISUAL の skill 改善であり、アプリケーション統合テストは追加しない。
- 統合検証は `diff -qr` mirror parity、`mise exec -- pnpm typecheck` / `pnpm lint` の副作用なし確認、Phase 11 縮約テンプレ自己適用 smoke で代替する。
- skill 構造の機械検証（YAML フロントマター / Anchors）は skill-fixture-runner で別タスクとして実施する。

## 次 Phase

- 次: Phase 5（実装ランブック）
- 引き継ぎ: TC-1〜TC-8 / AC×TC マトリクス / fail-fast 順序 / コマンド集合
