# Change Summary

## 変更内容

A-2 skill ledger fragment 化の **13 Phase 仕様書 + 実装コード + 92 ファイル legacy 退避** を 1 ブランチで作成。

## 主要変更

| 種別 | 件数 | 詳細 |
| ---- | ---- | ---- |
| 仕様書 | 14 | `phase-01.md` 〜 `phase-13.md` + `index.md` |
| Phase outputs | 36 | 各 phase の main.md と補助成果物（`outputs/artifacts.json` 除く） |
| 実装スクリプト | 2 | `scripts/skill-logs-{render,append}.ts` |
| 共通ライブラリ | 5 | `scripts/lib/*.ts` |
| テスト | 2 ファイル / 16 件 | `scripts/skill-logs-*.test.ts` |
| 受け皿 .gitkeep | 24 | 8 skills × {LOGS, changelog, lessons-learned} |
| legacy 退避 | 92 | git mv による rename（履歴連続性保持） |
| package.json | 1 | scripts 追加 / `tsx` 追加 |
| vitest.config.ts | 1 | `scripts/**/*.test.ts` include |

## 影響範囲

- `docs/30-workflows/task-skill-ledger-a2-fragment/`：仕様書一式（新規）
- `scripts/`：render/append helper + lib（新規）
- `.claude/skills/*/`：fragment 受け皿 + `_legacy.md` 退避（rename）
- `package.json` / `vitest.config.ts`：scripts/include 追加
- `apps/`：**変更なし**（D1 / API 等への影響なし）

## 互換性

- skill 本体機能: 不変
- 既存 SKILL.md / references: 不変
- `log_usage.js` 4 件: fragment writer へ切替済み

## ロールバック手順

1. `git revert <commit-hash>` で本タスクの commit を打ち消す
2. または: `git mv .claude/skills/<skill>/LOGS/_legacy.md .claude/skills/<skill>/LOGS.md` を 92 ファイル分逆行
3. 受け皿 `.gitkeep` の削除
4. `scripts/skill-logs-*.ts` / `scripts/lib/*` の削除
5. `package.json` / `vitest.config.ts` の差分 revert

## リスク

| リスク | 影響 | 対策 |
| ------ | ---- | ---- |
| `log_usage.js` 4 件の書込み失敗 | 4 skill で log 自動記録が止まる | 本レビューで fragment writer へ切替済み |
| 4 worktree smoke 未実機 | 並列衝突 0 件は理論値のみ | 後続 implementation タスクで実機検証 |
| `pnpm lint` フルラン未実施 | lint-boundaries 違反の見逃し可能性 | UT-A2-LINT-001 で対応 |

## Phase 11 への evidence plan 残置

実機 smoke は `outputs/phase-11/4worktree-smoke-evidence.md` のフォーマットに従い後続 implementation タスクで記録する。
