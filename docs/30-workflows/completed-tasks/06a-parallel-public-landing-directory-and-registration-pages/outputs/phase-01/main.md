# Phase 1 成果物 — 要件定義

## 概要

公開ディレクトリ 4 画面（`/`, `/members`, `/members/[id]`, `/register`）の責務 / URL contract / 検索仕様 / 04a API 連携を specs (05-pages, 09-ui-ux, 12-search-tags, 01-api-schema) から抽出し、AC-1〜AC-12 を確定する。

## 4 画面の責務マトリクス

| 画面 | 役割 | 主要要素 | 04a endpoint | キャッシュ revalidate |
| --- | --- | --- | --- | --- |
| `/` | ランディング | Hero / StatCard / About / 最近の支部会 Timeline / FAQ / CTA | `GET /public/stats`, `GET /public/members?limit=6` | 60s |
| `/members` | 公開メンバー一覧 | FilterBar (Search + Select(zone) + Select(status) + tag chips + Segmented(sort/density)) / MemberCard リスト / EmptyState | `GET /public/members?{q,zone,status,tag,sort,density,page,limit}` | 30s |
| `/members/[id]` | 公開メンバー詳細 | ProfileHero / KVList(public field) / LinkPills / 戻る CTA / 404 | `GET /public/members/:id` | 60s |
| `/register` | 登録案内 | 説明 / responderUrl リンク / FormPreviewSections (visibility 区分) | `GET /public/form-preview` | 600s |

## URL query contract（`/members`）

| key | 型 | 初期値 | 不正値の扱い | 備考 |
| --- | --- | --- | --- | --- |
| `q` | string (trim, max 200) | `""` | trim + `\s+` を 1 つに正規化、200 文字超は truncate | フリーワード |
| `zone` | enum `all | 0_to_1 | 1_to_10 | 10_to_100` | `all` | `catch("all")` | 01-api-schema |
| `status` | enum `all | member | non_member | academy` | `all` | `catch("all")` | spec |
| `tag` | string[] (repeated) | `[]` | 不正タグは API 側で無視、apps/web は最大 5 件 truncate | AND 検索 |
| `sort` | enum `recent | name` | `recent` | `catch("recent")` | 12-search-tags |
| `density` | enum `comfy | dense | list` | `comfy` | `catch("comfy")` | `comfortable` `compact` 不採用 |

## `/register` form-preview 表示仕様

- `GET /public/form-preview` の `manifest`, `fields`, `sectionCount`, `responderUrl` を取得
- `responderUrl` は spec 固定値 `https://docs.google.com/forms/d/e/1FAIpQLSeWfv-R8nblYVqqcCTwcvVsFyVVHFeKYxn96NEm1zNXeydtVQ/viewform` を最終フォールバックとして保持
- セクションごとに `fields` を `sectionKey` でグルーピング表示し、各 field の `visibility` を `public/member/admin` ラベルで明示
- `stableKey` のみ参照する（`questionId` 直書き禁止 = AC-8）

## 受入条件 AC-1〜AC-12

| AC | 内容 | 検証方法（Phase 4 で test ID 化） |
| --- | --- | --- |
| AC-1 | 4 ルートが App Router で動作（200 / 404 分岐） | E2E (E-01〜E-07) + contract C-03 |
| AC-2 | URL ベース遷移成立（history 戻り含む） | E2E |
| AC-3 | `q/zone/status/tag/sort/density` 全て URL query で表現、reload 復元 | unit U-01〜U-06 |
| AC-4 | density は `comfy/dense/list` のみ | unit U-03 + lint |
| AC-5 | `tag` repeated query で AND 検索 | unit U-04 |
| AC-6 | 不明値は初期値フォールバック | unit U-02/U-03 |
| AC-7 | `window.UBM` 参照ゼロ件 | grep S-01 |
| AC-8 | `questionId` 直書きゼロ件、`stableKey` のみ参照 | ESLint S-03 |
| AC-9 | `localStorage` を route/session/data 正本にしない | grep S-02 |
| AC-10 | `/members/[id]` は public visibility のみ表示 | contract C-04, F-09〜F-12 |
| AC-11 | `/register` で responderUrl + form-preview 表示 | C-05, S-05 |
| AC-12 | 09-ui-ux 検証マトリクス（desktop/mobile）pass | E2E |

## スコープ

### 含む
- 4 ルートの Server / Client 境界実装
- URL query zod schema と FilterBar の URL 連動
- 04a public API endpoints の fetch
- UI primitives 15 種を組み合わせた画面

### 含まない
- `/login` `/profile` 画面（06b）
- `/admin/*`（06c）
- 04a public API endpoints 本体（04a）
- localStorage / window.UBM / GAS prototype 由来の機能
- 編集 UI

## 不変条件への対応

| # | 名称 | 反映 |
| --- | --- | --- |
| #1 | 実フォーム schema 固定禁止 | stableKey 参照のみ、AC-8 |
| #5 | apps/web から D1 直接禁止 | 全データ 04a 経由、AC-1/AC-10 |
| #6 | GAS prototype 格上げ禁止 | window.UBM 不採用、AC-7 |
| #8 | localStorage 正本禁止 | URL query 正本、AC-3/AC-9 |
| #9 | `/no-access` 不採用 | `/register` から `/login` で吸収 |
| #10 | 無料枠 | revalidate + Cache-Control |

## 4 条件評価

| 条件 | 判定 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | URL ベースで全状態を共有可能 |
| 実現性 | PASS | RSC + Workers + 04a で完結 |
| 整合性 | PASS | spec 用語と一致（density 等） |
| 運用性 | PASS | Cache-Control + revalidate で無料枠内 |

## サブタスク

| # | サブタスク | 状態 |
| --- | --- | --- |
| 1 | 4 画面責務抽出 | completed |
| 2 | URL contract 抽出 | completed |
| 3 | form-preview 仕様 | completed |
| 4 | 04a I/O 確認 | completed |
| 5 | AC-1〜AC-12 草案 | completed |
| 6 | 4 条件評価 | completed |

## 完了条件チェック

- [x] AC-1〜AC-12 が記述
- [x] 4 画面責務が表で示される
- [x] URL contract が初期値 / 不正値処理を含めて確定
- [x] 4 条件評価 PASS

## 次 Phase 引き継ぎ

- Server / Client 境界の論点は Phase 2 に渡す
- `/register` form-preview の cache 期間は Phase 3 で代替案検討
