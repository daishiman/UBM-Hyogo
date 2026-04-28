# Phase 12 — 未割当タスク検出レポート

タスク: skill-ledger-a3-progressive-disclosure
Phase: 12 / 13
作成日: 2026-04-28
種別: docs-only / NON_VISUAL

> 0 件でも出力必須。本タスクの「苦戦箇所」（既存リンク参照切れ / 責務境界揺れ / 並列衝突 / ドッグフーディング矛盾 / mirror 同期漏れ / 意味的書き換え混入）を踏まえて漏れなく検出する。

---

## 1. 検出サマリー

| 区分 | 件数 |
| --- | ---: |
| 必須（次 wave で着手すべき） | 5 |
| 推奨（再発防止） | 3 |
| 観測のみ（本タスクで close、追跡不要） | 0 |
| 合計 | 8 |

---

## 2. 検出項目（必須 5 件）

| # | 検出項目 | 種別 | 推奨対応 | 割り当て先候補 | 苦戦箇所との対応 |
| --- | --- | --- | --- | --- | --- |
| U-1 | `automation-30/SKILL.md` の 432 行 → 200 行未満化 | 実作業 | PR-2 で重複セクション（Layer 1〜7 の二重化）整理 + references 切り出し | 別タスク `task-skill-ledger-a3-split-automation-30` | #3 並列衝突回避 / 機械的 cut & paste |
| U-2 | `skill-creator/SKILL.md` の 402 行 → 200 行未満化 | 実作業 | PR-3 で Collaborative / Orchestrate / Runtime 状態遷移を references 化 | 別タスク `task-skill-ledger-a3-split-skill-creator` | #2 責務境界判断 |
| U-3 | `github-issue-manager/SKILL.md` の 363 行 → 200 行未満化 | 実作業 | PR-4 で Part 1〜4 構造を 4 references に分離 | 別タスク `task-skill-ledger-a3-split-github-issue-manager` | #2 責務境界判断 |
| U-4 | `claude-agent-sdk/SKILL.md` の 324 行 → 200 行未満化 | 実作業 | PR-5 で Direct SDK / SkillExecutor / AuthKeyService パターン群を references 化 | 別タスク `task-skill-ledger-a3-split-claude-agent-sdk` | #2 責務境界判断 |
| U-5 | skill 改修ガイドへの「fragment で書け」「200 行を超えたら分割」Anchor 恒久追記 | 設計 | task-specification-creator references 配下に skill-improvement Anchor を追記し、外部から参照される固定 ID を発行 | 別 PR（PR-N、本 PR とは独立） | #4 ドッグフーディング矛盾 / AC-10 |

---

## 3. 検出項目（推奨 3 件 / 再発防止）

| # | 検出項目 | 種別 | 推奨対応 | 割り当て先候補 | 苦戦箇所との対応 |
| --- | --- | --- | --- | --- | --- |
| U-6 | skill-creator テンプレへの「200 行未満」必須項目組込み | 設計 | skill-creator のテンプレ生成時に references/ 受け皿を初期作成、SKILL.md 雛形を entry 10 要素のみで初期化 | 別タスク `task-skill-creator-progressive-disclosure-template`（再発防止） | #4 ドッグフーディング矛盾 |
| U-7 | skill loader doctor スクリプトの提供 | 実作業 | 行数 / リンク健全性 / 未参照 references / mirror diff の自動 smoke 化（CI 化検討） | 別タスク `task-skill-loader-doctor`（後続 wave） | #1 リンク参照切れ / #5 mirror 同期漏れ |
| U-8 | 旧アンカー名で外部ドキュメントから来る深いリンクの追跡 | 検証 | 全 docs を `rg` で grep し、旧 → 新マッピング表を作成・redirect ノートを追加 | 別タスク `task-doc-link-audit-skill-anchors` | #1 リンク参照切れ |

---

## 4. 検出項目（追加検討 / 必要に応じて起票）

| # | 検出項目 | 種別 | 推奨対応 | 割り当て先候補 |
| --- | --- | --- | --- | --- |
| U-9 | `references/<topic>.md` 命名規約の skill 横断標準化 | 設計 | A-3 で得た topic 命名パターン（`patterns-*` / `phase-*-guide` / `spec-update-*`）を skill 横断ルール化 | 別タスク `task-skill-naming-convention` |
| U-10 | skill 横断の共通 reference 抽出（DRY） | 設計 | 複数 skill で共通する Phase 12 ガイド等を `.claude/skills/_shared/` に抽出する是非を検討 | 別タスク `task-skill-shared-references-feasibility`（Phase 8 で別タスク化済み） |

---

## 5. 該当なしセクション（テンプレ準拠）

- 本 Phase 単位での Phase 12 内 close の MINOR / MAJOR は **該当なし**（Phase 10 GO 判定時点で MINOR 0 件 / MAJOR 0 件）。
- 本タスクで抱え込む未対応項目は **該当なし**（全項目を別タスク / 別 PR に委譲）。

---

## 6. 起票方針

- U-1〜U-4: skill-ledger wave 内の serial 後続として GitHub Issue 起票（A-3 を 1 wave とし、各 skill 分割を子タスク化）。
- U-5: PR-N として本 PR と独立に提出（AC-10 / ロールバック独立性確保）。
- U-6〜U-8: 後続 wave / 別 wave で着手（再発防止系）。
- U-9 / U-10: skill-ledger 完了後に必要性を再評価。

---

## 7. 苦戦箇所カバー状況（漏れチェック）

| 苦戦箇所（index.md より） | 対応する検出項目 | カバー状況 |
| --- | --- | --- |
| #1 既存リンクが SKILL.md 内部アンカーを大量に指している | U-7（loader doctor） / U-8（旧アンカー追跡） | ✅ |
| #2 entry / references の責務境界判断が skill ごとに揺れる | U-2 / U-3 / U-4 / U-9（命名規約標準化） | ✅ |
| #3 並列で同一 SKILL.md を編集する他タスクとの衝突 | U-1（1 PR = 1 skill 厳守の継続） | ✅ |
| #4 ドッグフーディング矛盾（task-specification-creator の 200 行超） | U-5（Anchor 追記） / U-6（skill-creator テンプレ整備） | ✅（本 PR で 517 → 115 行 解消済み + 再発防止 2 件） |
| #5 canonical / mirror 同期漏れ | U-7（loader doctor で自動 smoke 化） | ✅ |
| #6 意味的書き換えがメカニカル分割に混入 | （本 PR で「機械的 cut & paste のみ」原則を確立 / 残 4 skill の PR-2〜5 でも継承） | ✅ |

> 全 6 苦戦箇所に対し検出項目が 1 件以上紐づいていることを確認。
