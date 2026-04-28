# Phase 2 成果物 — 200 行超 SKILL.md 棚卸し inventory.md

タスク: skill-ledger-a3-progressive-disclosure
Phase: 2 / 13（設計：分割設計表）
作成日: 2026-04-28
状態: spec_created（docs-only / NON_VISUAL）

---

## 1. 棚卸しコマンド

```bash
for f in .claude/skills/*/SKILL.md; do
  printf '%5d  %s\n' "$(wc -l < "$f")" "$f"
done | sort -nr
```

実行日: 2026-04-28（本タスク Phase 1〜3 担当エージェント）

## 2. 棚卸し結果（行数降順）

| 順位 | 行数 | パス |
| ---: | ---: | --- |
| 1 | 517 | `.claude/skills/task-specification-creator/SKILL.md` |
| 2 | 432 | `.claude/skills/automation-30/SKILL.md` |
| 3 | 402 | `.claude/skills/skill-creator/SKILL.md` |
| 4 | 363 | `.claude/skills/github-issue-manager/SKILL.md` |
| 5 | 324 | `.claude/skills/claude-agent-sdk/SKILL.md` |
| 6 | 190 | `.claude/skills/aiworkflow-requirements/SKILL.md` |
| 7 | 121 | `.claude/skills/int-test-skill/SKILL.md` |
| 8 |  99 | `.claude/skills/skill-fixture-runner/SKILL.md` |

---

## 3. 分類表

| skill 名 | 現行行数 | 分類 | 分割優先度 | 所有 / 担当 | 依存（参照される側） | 備考 |
| --- | ---: | --- | --- | --- | --- | --- |
| task-specification-creator | 517 | **対象（最優先）** | highest | skill-creator メタスキル系 | github-issue-manager / 全 task workflow | ドッグフーディング矛盾の現物。AC-9 の単独 PR 対象。Phase 12 関連の詳細仕様が肥大化の主因 |
| automation-30 | 432 | 対象 | high | thinking 30種運用 | （独立） | Layer 1〜7 の重複（5〜174 と 200〜382 で本文ブロックが二重化）あり。分割と同時に重複セクションの cut & paste 整理が必要 |
| skill-creator | 402 | 対象 | high | メタスキル本体 | 全 skill 改修フロー | Collaborative / Orchestrate モード詳細・Runtime 状態遷移が肥大化主因 |
| github-issue-manager | 363 | 対象 | medium | Issue 連携運用 | task-specification-creator | Part 1（クイックスタート）/ Part 2（コマンドリファレンス）/ Part 3（スコアリング）/ Part 4（リソースマップ）の 4 部構成で自然に分割可能 |
| claude-agent-sdk | 324 | 対象 | medium | Claude SDK 統合 | （独立） | 実装パターン群（Direct SDK / SkillExecutor / AuthKeyService）が references 候補 |
| aiworkflow-requirements | 190 | スコープ外（分割済み） | — | アプリ仕様参照 | — | 既に `references/` に分割済み（200 行未満）。本タスクでは触らない |
| int-test-skill | 121 | 対象外 | — | テスト系 | — | 200 行未満で AC-1 を既に満たす |
| skill-fixture-runner | 99 | 対象外 | — | テスト系 | — | 200 行未満で AC-1 を既に満たす |

---

## 4. 分類サマリー

| 分類 | 件数 | skill 名 |
| --- | ---: | --- |
| 対象（最優先） | 1 | task-specification-creator |
| 対象 | 4 | automation-30 / skill-creator / github-issue-manager / claude-agent-sdk |
| 対象外（既に 200 行未満） | 2 | int-test-skill / skill-fixture-runner |
| スコープ外（分割済み） | 1 | aiworkflow-requirements |

総対象数: **5 skill** → 1 PR / skill = **5 PR**（+ Anchor 追記の小 PR 1〜N 件）

---

## 5. 分割優先度の根拠

| skill | 優先度 | 根拠 |
| --- | --- | --- |
| task-specification-creator | highest | 行数最大（517）+ ドッグフーディング矛盾解消が AC-9 で最優先指定。本 skill の規約説得力に直結 |
| automation-30 | high | 重複セクション（Layer 1〜7 が 5〜174 と 200〜382 でほぼ二重化）の整理を伴うため、cut & paste 規律の検証ケースとして有効 |
| skill-creator | high | メタスキル本体で他 skill 改修フローの中心。早期分割で改修フローの摩擦を減らす |
| github-issue-manager | medium | Part 1〜4 構造が既に明確で機械的分割が容易。低リスクで実績を積める |
| claude-agent-sdk | medium | パターン例の独立性が高く分割ロスが小さい |

---

## 6. 並列実装時の announce ルール（再掲）

- 1 PR = 1 skill 分割を厳守する。
- 着手時に対象 skill を team へ announce し、他改修タスクの並列編集を一時停止させる。
- 推奨 PR 順: `task-specification-creator` → `automation-30` → `skill-creator` → `github-issue-manager` → `claude-agent-sdk`。

---

## 7. 完了条件チェック

- [x] inventory.md に全 SKILL.md が「対象（最優先）/ 対象 / 対象外 / 分割済み」の 4 分類で記載されている
- [x] `task-specification-creator` が表の先頭で highest / 単独 PR と固定されている
- [x] 各対象 skill に分割優先度・所有・依存が記述されている
