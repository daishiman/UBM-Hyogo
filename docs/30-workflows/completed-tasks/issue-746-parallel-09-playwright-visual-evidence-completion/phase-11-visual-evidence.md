# Phase 11: Visual Evidence

[実装区分: 実装仕様書]

## 1. Evidence 正本

`docs/30-workflows/completed-tasks/parallel-09-ux-cross-cutting/outputs/phase-11/screenshots/`

12 PNG（6 primitive × 1x/2x）。各 PNG は Phase 1 §3 の表に対応。

## 2. 本 workflow root の Phase 11 output

`docs/30-workflows/issue-746-.../outputs/phase-11/`

| ファイル | 内容 |
|---------|------|
| `screenshots/README.md` | 正本パス pointer |
| `playwright-run.txt` | Playwright 実行ログ（line reporter 出力、tracked canonical evidence） |
| `disk-space.txt` | 実行前後の disk 空き snapshot |
| `png-inventory.txt` | `ls -l` による PNG 一覧 |

## 3. claim 状態

| 観点 | claim |
|------|-------|
| spec / config | committed（既存） |
| 12 PNG 物理生成 | completed（2026-05-17 に本タスクで取得） |
| 視覚的整合（不変条件3） | completed（PNG non-empty / target locator visibility / prototype primitive contract と照合） |
| pixel diff baseline | established（後続 task-18/22 で利用可能） |

## 4. 視覚的整合チェック

各 primitive について以下を目視確認:

- [x] **01 FormField error**: prototype `docs/00-getting-started-manual/claude-design-prototype/` の FormField error variant と spacing / color が整合
- [x] **02 Icon 4sizes**: 4 サイズの aspect ratio と grid spacing が整合
- [x] **03 Breadcrumb**: separator / aria-label / 余白が整合
- [x] **04 Focus visible**: outline color / width / offset が tokens.css と整合
- [x] **05 Pagination disabled**: disabled state の opacity / cursor 表示が整合
- [x] **06 Empty state**: icon + headline + body の階層が整合

不整合発見時の対応: 本タスクスコープ外。別 followup issue として起票する（primitive 実装側の修正）。

## 5. CI への取り込み

本タスクでは CI 追加しない。task-18 / task-22 で別途取り込む（不変条件: 「CI workflow への visual job 追加は task-18/22 で扱う」）。
