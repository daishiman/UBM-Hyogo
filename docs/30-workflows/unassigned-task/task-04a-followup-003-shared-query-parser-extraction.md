## メタ情報

| 項目         | 内容                                              |
| ------------ | ------------------------------------------------- |
| タスクID     | task-04a-followup-003-shared-query-parser-extraction |
| タスク名     | search-query-parser の `packages/shared` 配置 |
| 分類         | リファクタリング / monorepo 共有化 |
| 対象機能     | `apps/web` 公開ディレクトリ画面の query parser |
| 優先度       | 中 |
| 見積もり規模 | 小規模 |
| ステータス   | 未実施 |
| 発見元       | 04a Phase 12 |
| 発見日       | 2026-04-29 |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

04a で `apps/api/src/_shared/search-query-parser.ts` を実装した。06a で `apps/web` 側からも同じ query 文字列（`q/zone/status/tag/sort/density/page/limit`）をパースして API を叩く必要が出る。両側で同等実装すると drift が発生する。

### 1.2 問題点・課題

- API 側 parser と web 側 parser が drift すると、UI が組み立てた URL が API 側で reject される。
- 04a は `apps/api` 専用として実装した（`outputs/phase-12/unassigned-task-detection.md` U-3）。
- 06a で `apps/web/src/lib/url/members-search.ts` が追加され、`q/zone/status/tag/sort/density` の Web helper が実装済み。ただし shared package 抽出は未実施のため、本タスクは未解決として継続する。

### 1.3 放置した場合の影響

- 06a 着手時に重複実装が発生する。
- 検索条件のバリデーション仕様が分散する。

---

## 2. 何を達成するか（What）

### 2.1 目的

`apps/api/src/_shared/search-query-parser.ts` を `packages/shared` に移送し、`apps/api` と `apps/web` から同一実装を import できるようにする。

### 2.2 最終ゴール

- `packages/shared/src/public-search/` 配下に query parser が export されている
- `apps/api` 側 import 経路が `@repo/shared` に切り替わっている
- 06a で `apps/web` も同一 parser を利用可能

### 2.3 含まないもの

- query 仕様（許容パラメータ）の変更
- API endpoint の変更

---

## 3. どのように実行するか（How）

### 3.1 前提条件

- 06a が `apps/web` 公開ディレクトリ UI 実装に着手すること

### 3.2 推奨アプローチ

`packages/shared` には D1 や Workers binding に依存しない pure function のみを置く（既存方針に準拠）。zod schema も同梱する。

---

## 4. 完了条件チェックリスト

- [ ] `packages/shared/src/public-search/` に parser が移送されている
- [ ] `apps/api/src/_shared/search-query-parser.ts` は re-export または削除
- [ ] `LIMIT_MAX=100` / `LIMIT_MIN=1` / `Q_MAX_LENGTH=200` 等の定数が共有正本として維持されている
- [ ] unit test が共有側に移送され green
- [ ] 06a の `members-search.ts` と 04a の `search-query-parser.ts` が shared parser / shared fixtures を参照している

---

## 5. 参照情報

- `docs/30-workflows/completed-tasks/04a-parallel-public-directory-api-endpoints/outputs/phase-12/unassigned-task-detection.md`（U-3）
- `apps/api/src/_shared/search-query-parser.ts`
- `.claude/skills/aiworkflow-requirements/references/architecture-monorepo.md`
