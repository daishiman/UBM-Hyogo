# Phase 12: ドキュメント同期

`[実装区分: 実装仕様書]`

実装サイクル完了後、`outputs/phase-12/` に以下 6 成果物を揃える（0 件でも出力必須）。

## 12.1 必須成果物

| Task | 成果物 | 内容 |
|------|--------|------|
| 12-1 | `implementation-guide.md` | Part 1（中学生レベル: 「複数の同じボタンを置いても説明が混ざらない仕組み」「ヘルプは外をクリック/Escape で閉じる」の例え話）+ Part 2（`useId` / 非制御 `<details>` / `detailsRef` / `Icon name="help"` の型・コード・エッジケース）。VISUAL のため Phase 11 screenshot references を明記 |
| 12-2 | `system-spec-update-summary.md` | Step 1-A〜1-C。新規 interface 追加は `IconName` への `"help"` 追加のみ（Step 2 = 該当）。`docs/00-getting-started-manual/specs/09-ui-ux.md` 等に icon catalog 記載があれば `help` を追記 |
| 12-3 | `documentation-changelog.md` | workflow-local 同期と global skill sync を別ブロックで記録 |
| 12-4 | `unassigned-task-detection.md` | スコープ外（汎用 Popover primitive 化）を未タスク候補として記録。新規 0 件でも出力 |
| 12-5 | `skill-feedback-report.md` | 改善点なしでも出力 |
| 12-6 | `phase12-task-spec-compliance-check.md` | canonical 9 見出し逐語 + Phase 11 evidence 表 + identifier grep 確認 |

## 12.2 identifier 整合（FB-W1-02b-3）

`implementation-guide.md` の識別子（`descId` / `useId` / `detailsRef` / `closeHelp` / `Icon name="help"` / `data-component="help-hint"`）を現行コードで grep 確認してから記述する。

## 12.3 parity / index

- `artifacts.json` と `outputs/artifacts.json` の `phase12_completed` / `phase13_blocked` を同値化。
- `IconName` 追加に伴い、spec 内 icon catalog の topic-map / index を再生成。

## 完了条件
- 6 成果物が揃い、artifacts parity と identifier 整合が取れていること。
