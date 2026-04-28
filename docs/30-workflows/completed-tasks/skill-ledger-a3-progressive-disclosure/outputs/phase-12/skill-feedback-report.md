# Phase 12 — スキルフィードバックレポート

タスク: skill-ledger-a3-progressive-disclosure
Phase: 12 / 13
作成日: 2026-04-28

> 改善点なしでも出力必須。本タスクは task-specification-creator skill のドッグフーディング検証を兼ねるため、当該 skill 自身への 200 行未満化フィードバックを必ず含む。

---

## 1. 全体サマリー

| skill | 評価 | 主要フィードバック | 改善提案 PR |
| --- | --- | --- | --- |
| task-specification-creator | ★★★★☆ | ドッグフーディング矛盾を A-3 で解消（517 → 115 行） | PR-N（Anchor 恒久追記） |
| aiworkflow-requirements | ★★★★★ | 既に Progressive Disclosure 化済み。良好な参考事例 | topic-map 追記のみ |
| skill-creator | ★★★☆☆ | 新規 skill 作成時の 200 行制約が未実装 | 別タスク（U-6） |
| skill-fixture-runner / int-test-skill | ★★★★★ | 200 行未満で AC-1 を既に充足 | なし |
| github-issue-manager / automation-30 / claude-agent-sdk | ★★☆☆☆ | 200 行超のため次 PR で分割対象 | PR-2 / PR-3 / PR-4 / PR-5 |

---

## 2. skill 個別フィードバック

### 2-1. task-specification-creator（本 PR 対象）

| 観点 | フィードバック | 改善提案 |
| --- | --- | --- |
| ドッグフーディング | 自 skill の `SKILL.md` が 517 行と 200 行超で「200 行未満を推奨」と書きながら自身が破る矛盾があった。A-3 で 115 行に縮小し解消。 | テンプレに「200 行を超えたら分割」Anchor を恒久追記（PR-N で実施 / AC-10）。 |
| 構造 | Phase 12 タスクガイドが既に Progressive Disclosure 化されており参考事例として有効。 | `references/phase-12-tasks-guide.md` を A-3 のロールモデルとして README に明示する。 |
| 命名規約 | references の命名（`patterns-*` / `phase-*-guide` / `spec-update-*`）が機能。 | skill 横断の標準として U-9 で他 skill にも適用検討。 |
| Phase 12 必須 5 タスク | 仕様（implementation-guide / system-spec-update-summary / documentation-changelog / unassigned-task-detection / skill-feedback-report + compliance check）が一貫しており、本 Phase で完全充足。 | 改善提案なし（仕様は明快）。 |

### 2-2. aiworkflow-requirements

| 観点 | フィードバック | 改善提案 |
| --- | --- | --- |
| 構造 | 既に references/ 分割済みで A-3 の範囲外（参考例として良好）。 | topic-map に A-3 の「Progressive Disclosure / SKILL.md 分割」キーワード追加のみ。 |
| 行数 | 190 行で AC-1 充足。 | 改善提案なし。 |
| indexes 管理 | `generate-index.js` による生成物と手編集の責務分離が機能。 | 他 skill にも同方式を展開（skill-creator テンプレへ組込み = U-6）。 |

### 2-3. skill-creator

| 観点 | フィードバック | 改善提案 |
| --- | --- | --- |
| テンプレ | 新規 skill 作成時の 200 行制約 / references/ 受け皿初期化が未実装。 | skill-creator のテンプレに references/ 受け皿初期化を組み込む（別タスク U-6）。 |
| 自身の行数 | 402 行で AC-1 未充足。 | PR-3 で 200 行未満に分割（Collaborative / Orchestrate / Runtime 分離）。 |

### 2-4. github-issue-manager / automation-30 / claude-agent-sdk

| skill | 行数 | フィードバック | 改善提案 |
| --- | ---: | --- | --- |
| github-issue-manager | 363 | Part 1〜4 の 4 部構成で自然に分割可能 | PR-4 で 4 references に分離 |
| automation-30 | 432 | Layer 1〜7 の本文ブロックが 5〜174 / 200〜382 で二重化 | PR-2 で重複セクション整理 + references 切り出し（**意味変更を伴う整理は別タスクに分離**） |
| claude-agent-sdk | 324 | 実装パターン群（Direct SDK / SkillExecutor / AuthKeyService）が references 候補 | PR-5 で 3〜4 references に分離 |

### 2-5. skill-fixture-runner / int-test-skill

| skill | 行数 | 評価 |
| --- | ---: | --- |
| skill-fixture-runner | 99 | 200 行未満で AC-1 充足。改善提案なし |
| int-test-skill | 121 | 同上 |

---

## 3. skill 横断の改善提案

| # | 提案 | 理由 | 委譲先 |
| --- | --- | --- | --- |
| F-1 | skill loader doctor スクリプトの提供 | 行数 / リンク / mirror diff を自動 smoke 化し、Phase 11 manual smoke を CI 化 | U-7（後続 wave） |
| F-2 | references 命名規約の標準化 | A-3 で確立した命名パターンを skill 横断で揃える | U-9 |
| F-3 | skill-creator テンプレへの 200 行制約組込み | 再発防止 | U-6 |
| F-4 | skill 横断の共通 references 抽出（`_shared/`）の是非検討 | DRY と独立性のトレードオフ整理 | U-10（既に Phase 8 で別タスク化） |

---

## 4. ドッグフーディング所見（必須セクション）

`task-specification-creator` skill の Phase 12 仕様（必須 5 タスク + compliance check）を、A-3 タスク自身に適用してテストした結果、**仕様が一貫して機能** することを確認した。特に:

- 必須 5 タスク（実装ガイド / system-spec-update-summary / documentation-changelog / unassigned-task-detection / skill-feedback-report）は重複なく直交している。
- Step 1-A〜1-G + 条件付き Step 2 判定の構造が、docs-only タスクでも漏れなく適用できる。
- same-wave sync（LOGS×2 / SKILL×2 / topic-map）と二重 ledger の制約が drift 防止に機能する。
- 「改善点なしでも出力必須」のルールが、暗黙の見落としを構造的に防ぐ。

唯一の矛盾だった「自 skill が 200 行超」を A-3 自身が解消した点で、ドッグフーディングが完結した。

---

## 5. 改善提案サマリー

| 優先度 | 提案 | 起票先 |
| --- | --- | --- |
| 高 | task-specification-creator references への「200 行制約」Anchor 恒久追記 | PR-N |
| 高 | 残 4 skill（automation-30 / skill-creator / github-issue-manager / claude-agent-sdk）の 200 行未満化 | PR-2〜5 |
| 中 | skill-creator テンプレへの receptable 初期化 | U-6 |
| 中 | skill loader doctor スクリプト | U-7 |
| 低 | references 命名規約標準化 | U-9 |
| 低 | 旧アンカー追跡 | U-8 |
