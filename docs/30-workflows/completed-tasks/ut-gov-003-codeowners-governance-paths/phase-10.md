# Phase 10: 最終レビュー

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | `.github/CODEOWNERS` を governance パスへ拡張し doc/docs 表記揺れを解消 (UT-GOV-003) |
| Phase 番号 | 10 / 13 |
| Phase 名称 | 最終レビュー |
| 作成日 | 2026-04-29 |
| 前 Phase | 9 (品質保証) |
| 次 Phase | 11 (手動 smoke / レビュー観点) |
| 状態 | completed |
| タスク種別 | implementation / NON_VISUAL / infrastructure_governance |
| 親タスク | task-github-governance-branch-protection |
| 原典 | docs/30-workflows/completed-tasks/UT-GOV-003-codeowners-governance-paths.md |

## 目的

Phase 1〜9 で確定した要件・設計・DRY 化・QA をもとに、原典 §2.2 想定 AC 6 件と 4 条件（価値性 / 実現性 / 整合性 / 運用性）の最終判定を確定し、blocker 判定基準・PR レビュー observation points・関連 UT-GOV タスクへの影響再確認・想定残課題（unassigned-task-detection 用）を一括して整理する。

CODEOWNERS タスクは「実装の難易度は低い / 但し silently fail する仕様事故が起きやすい」という特性があるため、最終レビューは **「行 1 行ごとの review checklist」** + **「関連タスクとの整合再確認」** に重点を置く。

## 実行タスク

1. 原典 §2.2 AC 6 件すべてに PASS / FAIL / 仕様確定先を付与する（完了条件: 6/6 評価完了）。
2. 4 条件（価値性 / 実現性 / 整合性 / 運用性）に最終判定を付与し、PASS 維持を確認する（完了条件: 4/4 PASS）。
3. PR レビュー observation points（reviewer が必ず見る点）を 6 件以上列挙する（完了条件: review checklist 完成）。
4. 関連タスク UT-GOV-001 / UT-GOV-002 / UT-GOV-004 / UT-GOV-005 への影響を再確認する（完了条件: 4 タスク × 影響種別が表で確定）。
5. 想定残課題を unassigned-task-detection.md 形式で洗い出す（完了条件: 3 件以上の候補 ID）。
6. 最終 GO/NO-GO を確定し `outputs/phase-10/main.md` に記述する（完了条件: 「仕様書 PASS / 実装は実装 PR で適用」が明示）。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/completed-tasks/UT-GOV-003-codeowners-governance-paths.md | 原典 AC 6 件 / 落とし穴 6 件 |
| 必須 | docs/30-workflows/ut-gov-003-codeowners-governance-paths/phase-08.md | DRY 化結果 |
| 必須 | docs/30-workflows/ut-gov-003-codeowners-governance-paths/phase-09.md | QA 7 項目 |
| 必須 | docs/30-workflows/ut-gov-003-codeowners-governance-paths/outputs/phase-08/main.md | After CODEOWNERS |
| 必須 | docs/30-workflows/ut-gov-003-codeowners-governance-paths/outputs/phase-09/main.md | QA 結果プレースホルダ |
| 参考 | docs/30-workflows/skill-ledger-a1-gitignore/phase-10.md | 最終レビュー phase の構造参照 |
| 参考 | UT-GOV-001 / 002 / 004 / 005 仕様書（順次作成中） | 関連タスク影響評価 |

## AC × PASS/FAIL マトリクス（原典 §2.2 準拠）

| AC | 内容 | 達成状態 | 仕様確定先 | 判定 |
| --- | --- | --- | --- | --- |
| AC-1 | リポジトリ直下に `.github/CODEOWNERS` が存在 | 既存（Phase 8 で更新方針確定） | `.github/CODEOWNERS` / Phase 8 §After | PASS |
| AC-2 | governance 重要 5 パス（`docs/30-workflows/**` / `.claude/skills/**/references/**` / `.github/workflows/**` / `apps/api/**` / `apps/web/**`）owner 明示 | 仕様確定（実適用は実装 PR） | Phase 8 §After CODEOWNERS | PASS |
| AC-3 | 末尾に global fallback (`* @<owner>`) **1 行のみ** / 最終マッチ勝ち順序 | 仕様確定（**冒頭 1 行**に修正済み — 原典記述は「末尾 1 行」だが最終マッチ勝ち仕様上は **冒頭 1 行**が正解、Phase 8 §行順序で再確定） | Phase 8 §行順序 | PASS（原典との差異を Phase 10 §残課題で記録） |
| AC-4 | `gh api .../codeowners/errors` で `errors: []` | 仕様確定（実走は実装 PR の Phase 9） | Phase 9 観点 1 | PASS（仕様レベル） |
| AC-5 | `doc/` → `docs/` 統一、または不可避ケースのみ allow リスト | 仕様確定 | Phase 8 §表記統一 / Phase 9 観点 2 | PASS |
| AC-6 | main branch protection で `require_code_owner_reviews=false` 明文化 / CODEOWNERS は ownership 文書 | 仕様確定（UT-GOV-001 整合確認は Phase 9 観点 5） | 原典 §備考 / Phase 9 観点 5 | PASS |

**合計: 6/6 PASS（仕様レベル）**

> 重要メモ: 原典 §2.2 AC-3 は「ファイル末尾に global fallback (`* @<owner>`) を 1 行のみ」と書かれているが、CODEOWNERS の **最終マッチ勝ち** 仕様では `*` を末尾に置くと governance 行を全て上書きしてしまう。Phase 8 で **「冒頭 1 行」** に正しく訂正済み。原典記述の修正提案は §残課題 U-1 として登録する。

## 4 条件最終判定

| 条件 | 判定 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | governance 重要 5 パスの owner SSOT 化により、将来 contributor / 監査向けの owner 表明が確立。GitHub UI suggested reviewer 表示にも寄与 |
| 実現性 | PASS | `.github/CODEOWNERS` 10 行程度の編集で完結。`gh api` 検証も既存 GitHub REST API のみ |
| 整合性 | PASS | UT-GOV-001 の `require_code_owner_reviews=false` と矛盾せず / SSOT 宣言で CLAUDE.md / README に owner 列を作らない / 表記揺れ 0 |
| 運用性 | PASS | 行順序ポリシー（冒頭 `*` → 広い → 狭い）1 ルールで将来追加もブレない / `gh api` 1 行で再現可能 |

**最終判定: PASS（仕様書として）**

## blocker 判定基準

| ID | blocker | 種別 | 解消条件 | 確認方法 |
| --- | --- | --- | --- | --- |
| B-01 | `gh api codeowners/errors` が空でない | API 検証失敗 | errors=[] になるまで CODEOWNERS 修正 | Phase 9 観点 1 |
| B-02 | global `*` が末尾にある（最終マッチ勝ち事故） | 設計違反 | `*` を冒頭 1 行に移動 | Phase 9 観点 3 |
| B-03 | governance 重要 5 パスのいずれかが未指定 | 被覆漏れ | 欠落パスを追記 | Phase 9 観点 4 |
| B-04 | UT-GOV-001 で `require_code_owner_reviews=false` が未明文化 | 関連タスク不整合 | UT-GOV-001 仕様書に追記 | Phase 9 観点 5 |
| B-05 | `doc/` 残存が allow リスト未登録のまま残っている | 表記揺れ未解消 | 置換 or allow リスト記録 | Phase 9 観点 2 |

### blocker 優先順位

1. **B-01（codeowners/errors）**: silently skip の唯一の客観検出手段。最優先。
2. **B-02（`*` 位置）**: governance 行が無効化される事故。仕様事故では最致命。
3. **B-03（被覆漏れ）**: AC-2 直接違反。
4. **B-04 / B-05**: 関連タスク整合 / 表記揺れ。MAJOR ではないが残置不可。

## PR レビュー observation points

reviewer が `.github/CODEOWNERS` 差分 PR を見る際の必須確認項目:

1. **`*` の位置**: 冒頭 1 行のみか。末尾 / 中段に紛れ込んでいないか。
2. **行順序**: 「広い glob → 狭い glob」順か。`.github/**` より後に `.github/workflows/**` が来ているか。
3. **重要 5 パス被覆**: `docs/30-workflows/**` / `.claude/skills/**/references/**` / `.github/workflows/**` / `apps/api/**` / `apps/web/**` の 5 行が存在するか。
4. **glob 表記統一**: `**` で recursive を明示しているか。`/` 終端のみの古い表記が残っていないか。
5. **owner 表記**: `@daishiman` のスペル / 個人ハンドル使用（team handle 採用時は write 権限要件を別途確認）。
6. **コメント**: NOTE で SSOT 宣言と `require_code_owner_reviews=false` 方針が明記されているか。
7. **`doc/` 残存**: 差分内に `doc/` 旧表記が混入していないか（CHANGELOG 引用等の allow ケースを除く）。
8. **`gh api codeowners/errors` ログ**: PR description に実走出力（`{"errors": []}`）が貼られているか。

## 関連タスク影響再確認

| 関連タスク | 影響種別 | 確認項目 | 結果（pending） |
| --- | --- | --- | --- |
| UT-GOV-001 (branch-protection-apply) | **強依存** | `require_code_owner_reviews=false` が UT-GOV-001 仕様書に明文化 | 整合確認は Phase 9 観点 5 |
| UT-GOV-002 (pr-target-safety-gate-dry-run) | 弱依存 | `.github/workflows/**` の owner が CODEOWNERS で明示され、UT-GOV-002 の workflow 編集 PR が suggested reviewer 表示される | 観点として十分 |
| UT-GOV-004 (required-status-checks-context-sync) | 弱依存 | CI 連携採否（Phase 9 観点 6: 不要）と整合し、CODEOWNERS lint 用の status check context は追加しない | 整合 |
| UT-GOV-005 (docs-only-nonvisual-template-skill-sync) | 中依存 | `docs/**` パスの owner 明示が docs-only template の owner SSOT として機能 | 整合 |

## 想定残課題（unassigned-task-detection 用）

| 候補 ID | 内容 | 受け皿 | 優先度 |
| --- | --- | --- | --- |
| U-1 | 原典 §2.2 AC-3 の「末尾 1 行」記述を「冒頭 1 行」に訂正する PR | UT-GOV-003 補足 PR / または unassigned-task-skill-ledger | 中（仕様精度向上） |
| U-2 | 将来 contributor 体制になった際の `require_code_owner_reviews=true` 移行手順書 | UT-GOV-006 候補（新規） | 低（将来課題） |
| U-3 | `.github/workflows/codeowners-lint.yml` 新設 PR（CI 連携採用判断時） | UT-GOV-004 拡張 | 低（base case では不要） |
| U-4 | team handle 採用時の write 権限事前付与チェックリスト | UT-GOV-006 / 組織側運用 | 低（将来） |
| U-5 | CLAUDE.md 主要ディレクトリ表に SSOT メモを追記し「owner 列は CODEOWNERS のみ」を明文化 | docs-only タスク | 低 |

## 最終 GO / NO-GO 判定

### 判定: **PASS（仕様書として）/ 実装は実装 PR で適用**

- 仕様書としての完成度: **PASS**（AC 6/6 / 4 条件 4/4 PASS / blocker 5 件 / observation points 8 件）
- 実装ステータス: **pending**（実 `.github/CODEOWNERS` 編集 / `gh api` 実走 / `doc/` 置換は実装 PR）
- Phase 11 進行可否: 「仕様レベルの review checklist」レビュー可。実走 `gh api` は実装 PR。
- Phase 12 進行可否: implementation-guide.md / unassigned-task-detection.md の整備は本ワークフロー内で可能。

### GO 条件（すべて満たすこと）

- [x] AC 6 件すべて PASS
- [x] 4 条件最終判定が PASS
- [x] blocker 判定基準が 3 件以上記述（本 Phase で 5 件）
- [x] PR レビュー observation points 6 件以上（本 Phase で 8 件）
- [x] 関連 UT-GOV タスク 4 件への影響評価済み
- [x] 想定残課題 3 件以上を unassigned-task 候補として登録（本 Phase で 5 件）

### NO-GO 条件（一つでも該当）

- 4 条件のいずれかに MAJOR が残る
- AC のうち PASS でないものがある
- blocker 判定基準が 3 件未満
- observation points が 6 件未満
- 関連 UT-GOV タスクの整合確認が未完

## 実行手順

### ステップ 1: AC マトリクス再評価
- 原典 §2.2 6 件 + Phase 8/9 確定事項を突合。

### ステップ 2: 4 条件最終判定
- Phase 9 QA 結果を引き継ぎ PASS 維持を確認。

### ステップ 3: blocker 判定基準確定
- B-01〜B-05 を確定、優先順位付き。

### ステップ 4: observation points 列挙
- reviewer 視点で 8 件以上。

### ステップ 5: 関連タスク影響再確認
- UT-GOV-001 / 002 / 004 / 005 に対し 1 行ずつ影響種別と確認項目を記述。

### ステップ 6: 想定残課題洗い出し
- U-1〜U-5 を unassigned-task-detection.md 用に整形。

### ステップ 7: GO/NO-GO 確定
- `outputs/phase-10/main.md` に記述。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 11 | observation points をレビュアー手順として使用 |
| Phase 12 | unassigned-task 候補を formalize / implementation-guide.md に転記 |
| Phase 13 | GO/NO-GO 結果と blocker / observation points を PR description に転記 |
| 実装 PR | blocker B-01〜B-05 を着手前ゲートとして再確認 |

## 多角的チェック観点

- 価値性: governance 5 パス owner SSOT 化 + 表記統一の二重価値が確定。
- 実現性: 既存 `.github/CODEOWNERS` の編集と `gh api` 検証で完結。
- 整合性: UT-GOV-001 の `require_code_owner_reviews=false` 整合 / SSOT 宣言で他媒体 owner 列ゼロ。
- 運用性: 行順序 1 ルール / 検証コマンド 6 行 / blocker 5 件で運用基盤確立。
- 認可境界: secret 導入なし、対象外明記。
- 無料枠: GitHub API 無料枠内。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | AC 6 件評価 | 10 | pending | 6/6 PASS |
| 2 | 4 条件最終判定 | 10 | pending | 4/4 PASS |
| 3 | blocker 5 件確定 | 10 | pending | B-01〜B-05 |
| 4 | observation points 8 件 | 10 | pending | reviewer checklist |
| 5 | 関連 UT-GOV タスク影響評価 | 10 | pending | 4 タスク |
| 6 | 残課題 5 件洗い出し | 10 | pending | U-1〜U-5 |
| 7 | GO/NO-GO 判定 | 10 | pending | 仕様 PASS / 実装 pending |
| 8 | outputs/phase-10/main.md 集約 | 10 | pending | 1 ファイル |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-10/main.md | AC × 4 条件 × blocker × observation × 関連タスク × 残課題 × GO/NO-GO |

## 完了条件

- [ ] AC 6 件すべて PASS で評価
- [ ] 4 条件最終判定が PASS
- [ ] blocker 判定基準が 5 件記述
- [ ] PR レビュー observation points が 8 件記述
- [ ] 関連 UT-GOV タスク 4 件すべての影響評価済み
- [ ] 残課題 5 件が unassigned-task 候補として登録
- [ ] 最終判定が「仕様書 PASS / 実装 pending」で確定
- [ ] outputs/phase-10/main.md が作成済み

## タスク100%実行確認【必須】

- 全実行タスク（8 件）が `pending`
- 成果物 `outputs/phase-10/main.md` 配置予定
- 「AC × 4 条件 × blocker × observation × 関連タスク × 残課題 × GO/NO-GO」の 7 観点すべて記述
- 原典 §2.2 AC-3 の修正提案（U-1）が残課題として記録されている

## 苦戦防止メモ

- 原典 AC-3 の「末尾 1 行」記述に **そのまま従わないこと**。CODEOWNERS の最終マッチ勝ち仕様上は **冒頭 1 行**が正解。本 Phase で訂正提案を U-1 として残す。
- `gh api codeowners/errors` は **デフォルトブランチ** を見るため、実装 PR の dev ブランチで先に検証する場合は `?ref=<branch>` を付ける。
- team handle 採用衝動が出やすいが、solo 運用では **個人ハンドル一択**。team は将来組織側で write 権限を整備してから切替する。

## 次 Phase への引き渡し

- 次 Phase: 11 (手動 smoke / レビュー観点)
- 引き継ぎ事項:
  - 最終判定: 仕様書 PASS / 実装 pending
  - blocker 5 件（実装着手前ゲート）
  - observation points 8 件（PR レビュー checklist）
  - 残課題 5 件（U-1〜U-5）の受け皿 Phase
  - 原典 AC-3 訂正提案（U-1）
- ブロック条件:
  - 4 条件のいずれかが MAJOR
  - AC PASS でないものが残る
  - blocker / observation / 残課題のいずれかが規定数未満
  - 関連 UT-GOV タスク影響評価が未完
