# Phase 7 成果物: カバレッジ確認

> 本成果物は `docs/30-workflows/completed-tasks/issue-1059-public-members-fields-batch-fetch-n1-prevention/phase-07.md` を
> 正本とする。本ファイルは確定事項の要約であり、仕様の差分が生じた場合は phase-07.md を優先する。

## 確定事項の要約

- 評価対象は**変更 2 箇所に限定**する（全ファイル一律閾値にしない / Feedback BEFORE-QUIT-002）。
  - C-1: `apps/api/src/repository/responseFields.ts` の `listFieldsByResponseIds`（空配列ガード分岐 + IN 句分岐）
  - C-2: `apps/api/src/use-cases/public/list-public-members.ts` の fields groupBy ブロック（lookup hit/miss + SUMMARY_KEYS フィルタ）
- 単数 `listFieldsByResponseId` はスコープ外（温存のみ）。
- 対象 vitest（リポジトリルートから）:
  ```bash
  mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts \
    apps/api/src/repository/__tests__/responseFields.repository.spec.ts \
    apps/api/src/use-cases/public/__tests__/list-public-members.spec.ts
  ```
- coverage コマンド（apps/api・広域指定）:
  ```bash
  mise exec -- pnpm --filter @ubm-hyogo/api test:coverage:unit
  ```
  → 出力から `responseFields.ts` / `list-public-members.ts` の行を抽出し、C-1 / C-2 の line・branch
  実測値を表で記録する（Feedback 5）。
- C-1 は line / branch 100% を目標（空配列分岐 + IN 句分岐の網羅）。数値だけでなく分岐網羅の
  定性確認を併記し、「ファイル削除 / 数値達成」を唯一の PASS 基準にしない。

## 実測記録テンプレート（実行時に埋める）

| 対象 | line | branch | 空配列/IN 句・hit/miss 網羅 |
| --- | --- | --- | --- |
| C-1 `listFieldsByResponseIds` | （実測%） | （実測%） | （空配列分岐 / IN 句分岐 カバー有無） |
| C-2 use-case groupBy ブロック | （実測%） | （実測%） | （lookup hit/miss / SUMMARY_KEYS includes 真偽 カバー有無） |
