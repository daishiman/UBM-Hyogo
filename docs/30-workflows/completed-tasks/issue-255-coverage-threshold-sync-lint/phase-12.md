# Phase 12: 実装ガイド / SSOT 同期 / skill feedback

## 12.1 strict 7 出力

| ファイル | 役割 |
| --- | --- |
| `outputs/phase-12/main.md` | close-out index |
| `outputs/phase-12/implementation-guide.md` | Part 1 中学生レベル + Part 2 技術者レベル（型/CLI/使用例/エラー/エッジ/設定定数/テスト構成） |
| `outputs/phase-12/documentation-changelog.md` | 変更パスと changed files の分類 |
| `outputs/phase-12/unassigned-task-detection.md` | unassigned=0 を明示 |
| `outputs/phase-12/skill-feedback-report.md` | skill 改善ルーティング |
| `outputs/phase-12/system-spec-update-summary.md` | SSOT 同期一覧 |
| `outputs/phase-12/phase12-task-spec-compliance-check.md` | 9 canonical headings の compliance |

## 12.2 same-wave 同期対象

| Area | 同期内容 |
| --- | --- |
| skill `aiworkflow-requirements` references/indexes | task-workflow-active / quick-reference / resource-map / artifact inventory / changelog / LOGS を同一 wave で追加し、`pnpm indexes:rebuild` 対象へ接続 |
| skill `task-specification-creator` | 同一 wave で edit なし（既存 Phase 12 strict 7 / 9 canonical heading ルールで本 spec を吸収可能） |
| CLAUDE.md | 編集なし |
| `docs/00-getting-started-manual/specs/00-overview.md` | 編集なし |

## 12.3 skill feedback ルーティング

| Item | promotion target | decision |
| --- | --- | --- |
| Markdown 表組みを SSOT として扱う際の正規表現抽出パターン | `task-specification-creator` references / future lessons | no same-wave edit（applied example として skill-feedback-report に記録） |
| CLOSED issue を Refs として spec 化するパターン | `task-specification-creator` SKILL.md / references | no same-wave edit（既存ルール `phase-01.md` でメタ情報セクションが Refs 運用を許容） |
| dynamic 2→3 source mode（任意 source の動的拡張）パターン | `task-specification-creator` references / future patterns-lessons | no same-wave edit |

## 12.4 unassigned task

本ワークフローで新規 unassigned task は**作らない**。理由:

- aiworkflow-requirements 正本側の機械可読化（YAML frontmatter 追加 / Anchor 埋め込み）は lint 側で正規表現抽出が成立しているため起票しない（CONST_007 / 本タスクで吸収）
- codecov.yml 導入は別タスクではあるが、本 lint が「存在時に動的拡張」する設計のため Codecov 側の意思決定タスクは本タスクと独立に進められる（=ここで起票不要）

詳細は `outputs/phase-12/unassigned-task-detection.md` に記載。

## 12.5 documentation changelog 計画

本サイクルで生成される changed paths:

| Path | Change |
| --- | --- |
| `docs/30-workflows/issue-255-coverage-threshold-sync-lint/` | Phase 1-13 spec + strict 7 outputs |
| `scripts/coverage-threshold-lint.ts` | new |
| `scripts/__tests__/coverage-threshold-lint.spec.ts` | new |
| `.github/workflows/coverage-threshold-lint.yml` | new |
| `package.json` | edit: `lint:coverage-threshold` と `test:scripts` 追記 |

## 12.6 system spec update summary 計画

| Area | Update |
| --- | --- |
| CI gate surface | `coverage-threshold-lint` job を追加 |
| coverage threshold SSOT | 変更なし（80% 維持） |
| Runtime boundary | n/a（runtime 影響なし） |
| Non-goals | D1, Auth.js, Cloudflare deploy, `apps/web` env |

## 12.7 boundary

| 層 | 状態 |
| --- | --- |
| workflow root | `implemented_local_evidence_captured` |
| implementation status | `LOCAL_IMPLEMENTATION_COMPLETE` |
| Phase 11 local evidence | present（lint + focused Vitest） |
| Phase 13 | blocked pending user approval for commit / push / PR |
