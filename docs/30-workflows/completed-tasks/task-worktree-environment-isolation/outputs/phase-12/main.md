# Phase 12: ドキュメント更新 — サマリ

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | task-worktree-environment-isolation |
| Phase | 12（ドキュメント更新） |
| タスク種別 | docs-only |
| visualEvidence | NON_VISUAL |
| workflow | spec_created |
| 上位依存 | task-conflict-prevention-skill-state-redesign |
| 後続ブロック | （なし） |

## 1. Phase 12 の位置づけ

Phase 1〜11 で確定した 5 つの設計決定（D-1〜D-5）を、後続実装タスクが迷わず再現できる形で **ドキュメントとして固定** する Phase。コード実装・commit・push・PR 作成は禁止。Phase 13 でユーザー承認を受けるまで `pending` を維持する。

## 2. 6 documents（implementation-guide を除く）への索引

| # | ファイル | 役割 |
| --- | --- | --- |
| 1 | [`implementation-guide.md`](./implementation-guide.md) | Part 1 中学生レベル + Part 2 技術者向け実装ガイド |
| 2 | [`system-spec-update-summary.md`](./system-spec-update-summary.md) | aiworkflow-requirements `references/` への追記サマリ |
| 3 | [`documentation-changelog.md`](./documentation-changelog.md) | CLAUDE.md / `scripts/new-worktree.sh` / 関連タスク仕様書への変更履歴 |
| 4 | [`unassigned-task-detection.md`](./unassigned-task-detection.md) | 派生未割当タスクの検出と登録案 |
| 5 | [`skill-feedback-report.md`](./skill-feedback-report.md) | task-specification-creator / aiworkflow-requirements skill のフィードバック |
| 6 | [`phase12-task-spec-compliance-check.md`](./phase12-task-spec-compliance-check.md) | artifacts.json / phase-12.md との準拠チェック |

## 3. 主要決定の再確認（Phase 2 設計より）

| ID | 決定 | 検証証跡 | 出力先 |
| --- | --- | --- | --- |
| D-1 | skill symlink 撤去（実体配置 or グローバル参照に統一） | EV-1 | implementation-guide §Part 2 / system-spec-update-summary |
| D-2 | tmux `update-environment` 最小化 + `-e` 注入による per-session state | EV-2, EV-3 | implementation-guide §Part 2 |
| D-3 | `.worktrees/.locks/<slug>-<sha8>.lockdir/owner` を mkdir lockdir 二系統で取得 | EV-4, EV-5 | implementation-guide §Part 2 / documentation-changelog |
| D-4 | `mise exec --` 経路統一・親シェル `OP_*` の unset・`hash -r` 義務化 | EV-7 | implementation-guide §Part 2 |
| D-5 | EV-1〜EV-7 を NON_VISUAL evidence として固定 | EV-1〜EV-7 | implementation-guide §Part 2 |

## 4. Phase 12 完了条件

`phase-12.md` の 3 項目に対応。

- [x] ドキュメント更新の成果物が `artifacts.json.phases[11].outputs`（7 ファイル）と完全一致する。
- [x] docs-only / spec_created / NON_VISUAL の分類が Phase 1〜11 から崩れていない。
- [x] ユーザー承認なしの commit / push / PR 作成を行っていない（コード実装ゼロ）。

詳細検証は [`phase12-task-spec-compliance-check.md`](./phase12-task-spec-compliance-check.md) を参照。

## 5. Phase 13 への申し送り

- Phase 13 では本 Phase の 7 成果物 + Phase 1〜11 全成果物のリンク健全性確認を行う。
- `change-summary.md` には D-1〜D-5 の決定、EV-1〜EV-7 の証跡、`unassigned-task-detection.md` で検出した派生タスクを盛り込む。
- `pr-template.md` は **Phase 13 でユーザー承認を受けてからのみ** 作成・送付する。
