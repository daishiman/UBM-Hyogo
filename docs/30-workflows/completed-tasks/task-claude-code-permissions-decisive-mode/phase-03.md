# Phase 3: 設計レビュー

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase 番号 | 3 / 13 |
| Phase 名称 | 設計レビュー |
| 作成日 | 2026-04-28 |
| 上流 | Phase 2 |
| 下流 | Phase 4 (テスト設計) |
| 状態 | pending |

## 目的

Phase 2 設計を Phase 4 へ進める前にレビューゲートを通す。**特にグローバル `~/.claude/settings.json` 変更の波及範囲**を確定する。

## レビュー観点

### R-1: グローバル settings 変更の波及範囲

| 確認項目 | 判定基準 |
| --- | --- |
| 他プロジェクトで `defaultMode` を override していないか | 他 worktree / 他リポジトリの `<project>/.claude/settings.json` を grep（メタ情報のみ）して確認 |
| プロジェクト未定義のリポジトリで bypass が常時適用される副作用 | リスト化し、許容可否を判定 |
| `permissions.allow` をグローバルへ追記しない方針が守れているか | 案 A（全層明示）でも `permissions` は project 層のみに置く |

### R-2: `--dangerously-skip-permissions` の挙動範囲

| 確認項目 | 判定基準 |
| --- | --- |
| MCP server 起動時の permission も skip されるか | 公式 docs を再確認 |
| Hook（PreToolUse 等）は依然動作するか | hook は permission とは独立であることを確認 |
| skip 対象から外れる prompt が存在するか | 残存リスクを明記 |

### R-3: whitelist の整合性

| 確認項目 | 判定基準 |
| --- | --- |
| 既存 `<project>/.claude/settings.json` の `permissions` 既存項目との衝突 | diff で重複 / 矛盾を確認 |
| `Bash(wrangler *)` deny と `scripts/cf.sh` 内部での wrangler 呼び出しの整合 | スクリプト内呼び出しは shell 内で完結し allow 不要 |

### R-4: 代替案フォールバック条件

案 A（全層 `bypassPermissions`）が他プロジェクトに許容できない波及を持つ場合、案 B（上位層からキー削除し local 委譲）にフォールバックする。**判定は本 Phase で実施**。

## レビューチェックリスト

- [ ] R-1 の波及範囲が明文化されている
- [ ] R-2 の残存リスクが列挙されている
- [ ] R-3 の whitelist 衝突が 0 件、または解消方針が決まっている
- [ ] 案 A / 案 B の最終決定が記録されている
- [ ] Phase 4 着手の Go/No-Go 判定が明示されている

## 既知の落とし穴

| パターン | 防止策 |
| --- | --- |
| **[FB-SDK-07-2]** Phase 1 で IPC surface を定義する際の Preload API 経由明記 | 本タスクは IPC 非対象。N/A |
| **[FB-SDK-07-4]** 既存命名パターン未確認 | `permission-mode` / `dangerously-skip-permissions` は Anthropic 公式命名のため drift なし |
| グローバル設定変更が他プロジェクトに silent 波及 | R-1 で必須確認 |

## 主成果物

- `outputs/phase-3/main.md`（レビュー結論）
- `outputs/phase-3/impact-analysis.md`（他プロジェクトへの波及範囲）

## ゲート条件

- 全 R-1〜R-4 が PASS、または「許容可能なリスクとして記録」と判定された場合のみ Phase 4 へ進む
- いずれか NG の場合は Phase 2 にループバック

## Skill準拠補遺

## 実行タスク

- 本文に記載済みのタスクを実行単位とする。
- docs-only / spec_created の境界を維持する。

## 参照資料

- `.claude/skills/task-specification-creator/SKILL.md`
- `.claude/skills/aiworkflow-requirements/SKILL.md`
- `artifacts.json`

## 成果物

- `artifacts.json` の該当 Phase outputs を正本とする。

## Blocker

- `--dangerously-skip-permissions` 使用時に `permissions.deny` が実効するか未確認の場合、実装タスクへ進めない。
- 実効しない場合は「deny が保険になる」という表現を削除し、alias 中心案または project-local settings 案へ戻す。
- global settings を変更する案は、他プロジェクト影響レビューが完了するまで採用しない。

## 完了条件

- [ ] 本文と `artifacts.json` の Phase outputs が矛盾しない。

## 統合テスト連携

本タスクは docs-only / NON_VISUAL のため、統合テストは実装タスクで実行する。ここでは手順、証跡名、リンク整合を固定する。
