# Phase 12: 実装ガイド・SSOT 同期・skill feedback

## 目的

Phase 12 必須 6 タスクを実行し、`outputs/phase-12/` 配下に 7 ファイルを実体作成する。2026-05-09 の改善サイクルで strict 7 outputs、SSOT 同期、skill feedback、compliance check を同一 wave で生成した。

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 12 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| state | completed（local evidence + SSOT sync 完了、runtime deploy は user gate） |

## 必須タスク

### Task 12-1: 実装ガイド作成（`outputs/phase-12/implementation-guide.md`）

- **Part 1（中学生レベル）**: 「Next.js 16 ではビルドの仕組みが Turbopack に変わったが、それが Cloudflare Workers と相性が悪い」「webpack というもう一つの仕組みに切り替えると元どおり動く」「ファイルを 1 行直すだけで治る」
- **Part 2（技術者レベル）**: Turbopack の `[project]/...` virtual module path / OpenNext 1.19.4 の Worker bundling pipeline が webpack 出力前提であること / `--webpack` フラグの動作 / `next.config.ts` 内 `turbopack.root` が webpack 経路で無視される動作 / patch-open-next-worker の auth env bridge との互換性 / build 時間トレードオフ（NFR-1 +60s 以内）

### Task 12-2: SSOT 更新

| 対象 | 追記内容 |
| --- | --- |
| `CLAUDE.md` | 必要に応じて「`apps/web` ビルダ既定は webpack（`next build --webpack`）」を「apps/web env アクセス不変条件」近傍に追記。本不変条件は OpenNext との互換要件として恒久的 |
| `docs/00-getting-started-manual/specs/00-overview.md` | `apps/web` ビルダ欄を webpack 明示に更新（Turbopack はローカル `next dev` 限定） |

### Task 12-3: ドキュメント更新履歴作成

`outputs/phase-12/documentation-changelog.md` に編集 path / 編集理由 / Phase 11 evidence へのリンクを記録。

### Task 12-4: 未タスク検出レポート（`outputs/phase-12/unassigned-task-detection.md`）

| 候補 | 取扱 |
| --- | --- |
| `favicon.ico 404` 解消 | 別タスク化（軽微） |
| `next` / `@opennextjs/cloudflare` 追従更新 | 必要時に別ワークフローで実施 |
| Turbopack 復帰条件のモニタリング（OpenNext が `[project]/` 解決対応をリリースした場合） | release notes ウォッチタスクとして起票候補 |

> 0 件でも本ファイルは必須出力。

### Task 12-5: skill feedback report（`outputs/phase-12/skill-feedback-report.md`）

3 観点固定: テンプレ改善 / ワークフロー改善 / ドキュメント改善。改善点なしでも出力必須。本タスクで予想される feedback:
- 「Next.js メジャーバージョン更新時にデフォルトビルダ変更が後方互換破壊に繋がる事例」を `task-specification-creator` の Phase 1 真因チェックリストへ昇格候補として記録

### Task 12-6: タスク仕様書コンプライアンスチェック（`outputs/phase-12/phase12-task-spec-compliance-check.md`）

CONST_005 必須セクションの実体確認、Phase 11 evidence canonical path の確認、`implemented-local` + `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` 遷移の判定根拠を記録。

## 必須出力ファイル一覧（7 ファイル）

| ファイル |
| --- |
| `outputs/phase-12/main.md`（index） |
| `outputs/phase-12/implementation-guide.md` |
| `outputs/phase-12/documentation-changelog.md` |
| `outputs/phase-12/unassigned-task-detection.md` |
| `outputs/phase-12/skill-feedback-report.md` |
| `outputs/phase-12/system-spec-update-summary.md` |
| `outputs/phase-12/phase12-task-spec-compliance-check.md` |

## 完了条件（実装サイクルで判定）

- [x] 7 ファイルがすべて実体作成されている
- [x] CLAUDE.md / overview spec の追記が反映されている
- [x] documentation-changelog.md に Phase 11 evidence への canonical path link が記録されている

## 出力

- `phase-12.md`（本仕様）
- `outputs/phase-12/`（実装サイクルで生成）

## 参照資料

- `phase-11.md`
- `.claude/skills/task-specification-creator/references/phase-12-spec.md`
