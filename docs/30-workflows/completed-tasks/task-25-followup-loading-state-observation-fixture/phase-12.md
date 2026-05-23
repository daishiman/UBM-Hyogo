# Phase 12: ドキュメント更新

`[実装区分: 実装仕様書]`

## 目的

実装結果を中学生レベルで読める implementation-guide にまとめ、`SMOKE-COVERAGE-MATRIX.md` を含む parent ドキュメント側を最終整合させる。

## 中学生レベルの概念説明

このタスクでやることは「**`loading.tsx` がちゃんと表示されているかを、テストで確認できるようにする**」ことです。

- Web ページを開くとき、ページの中身が用意できるまで「読み込み中」と書かれた小さな画面が出ます。これが `loading.tsx`。
- 今までのテストは本物のページしか見ていなくて、「読み込み中」画面が出ているかをチェックできていませんでした。
- そこで、**わざとちょっとだけ遅く返事をする特別なページ**を用意します（`/smoke/loading-state`）。
- このページに行くと、必ず先に「読み込み中」画面が出てから本物の中身が出るので、テストで両方の画面を確認できます。
- ただし、この特別なページは**本番では絶対に出さない**ように、env（環境変数）で 2 重に鍵をかけます。鍵が無いと 404（ページが無い）を返します。

## 変更対象ファイル（Phase 12 で確定）

| パス | 種別 | 概要 |
|------|------|------|
| `docs/30-workflows/task-25-followup-loading-state-observation-fixture/outputs/phase-12/implementation-guide.md` | 新規 | 上記中学生レベル説明 + 技術詳細 + 既存 implementation-guide との関係 |
| `docs/30-workflows/completed-tasks/ui-prototype-alignment-mvp-recovery/SMOKE-COVERAGE-MATRIX.md` | 編集（最終確定） | 行 19 / Coverage summary / Outstanding gaps の最終文言確定（Phase 7 の暫定確定を Phase 11 evidence で確証して書き直す） |
| `docs/30-workflows/completed-tasks/task-25-ui-mvp-w8-par-routes-smoke-coverage/outputs/phase-12/implementation-guide.md` | 編集（参照追記） | 「loading.tsx の N/A-runtime-observation は task-25-followup-loading-state-observation-fixture で resolved」旨を 1 行追記 |

## implementation-guide に含める strict 成果物

1. 中学生レベル概念説明（本 Phase 上部）
2. 変更ファイル一覧（最終確定版）
3. fixture の env ガード仕様（二重ガードの根拠）
4. clampDelay の境界値テーブル
5. Playwright spec 一覧（TC-01..TC-08）と所要時間
6. matrix 行 19 の Before / After
7. Issue #711 検証方法 3 項目との対応マトリクス

## ローカル検証コマンド

```bash
mise exec -- pnpm run docs:link-check   # （存在する場合）リンク切れチェック
grep -n "N/A-runtime-observation" docs/30-workflows/completed-tasks/ui-prototype-alignment-mvp-recovery/SMOKE-COVERAGE-MATRIX.md
# 期待: loading.tsx 行に該当しない、または error.tsx 行のみ（本タスクスコープ外）
```

## DoD（Phase 12）

- `outputs/phase-12/implementation-guide.md` が存在し、上記 7 項目が記載済。
- matrix の `loading.tsx` 行に `N/A-runtime-observation` が含まれない。
- 親 task-25 の implementation-guide に follow-up resolved 行が追記済。
