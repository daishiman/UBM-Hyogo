# Phase 1: 要件定義

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | public-landing-directory-and-registration-pages |
| Phase 番号 | 1 / 13 |
| Phase 名称 | 要件定義 |
| 作成日 | 2026-04-26 |
| 前 Phase | なし |
| 次 Phase | 2 (設計) |
| 状態 | pending |

## 目的

公開ディレクトリ 4 画面（`/`, `/members`, `/members/[id]`, `/register`）の責務 / URL contract / 検索仕様 / 04a API 連携を、specs（05-pages, 09-ui-ux, 12-search-tags, 01-api-schema）から抽出し AC として固定する。

## 実行タスク

1. 4 画面の責務と表示要素を 05-pages.md / 09-ui-ux.md から抽出
2. `/members` 検索 query の正規化ルールを 12-search-tags.md から抽出
3. `/register` の form-preview と responderUrl を 01-api-schema.md から抽出
4. 04a API endpoint の I/O 形を確認し fetch 仕様を仮置き
5. AC-1〜AC-12 を確定
6. 4 条件評価

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/00-getting-started-manual/specs/05-pages.md | 4 ルート責務 |
| 必須 | docs/00-getting-started-manual/specs/09-ui-ux.md | 情報設計 |
| 必須 | docs/00-getting-started-manual/specs/12-search-tags.md | URL query 正規化 |
| 必須 | docs/00-getting-started-manual/specs/09-ui-ux.md | UI primitives |
| 必須 | docs/00-getting-started-manual/specs/01-api-schema.md | stableKey + responderUrl |
| 参考 | CLAUDE.md | 不変条件 #1, #5, #6, #8, #9, #10 |

## 実行手順

### ステップ 1: input と前提
- 04a の AC を確認（`GET /public/*` 4 endpoint の response schema）
- 00 task の UI primitives 15 種、tones.ts、view model 型が利用可能か

### ステップ 2: Phase 成果物の作成
- `outputs/phase-01/main.md` に
  - 4 画面の責務マトリクス
  - `q/zone/status/tag/sort/density` の URL contract
  - `/register` の form-preview 表示仕様
  - AC-1〜AC-12
  - スコープ in/out
  を記述

### ステップ 3: 4 条件と handoff
- 価値性: 公開導線が GAS prototype 並みの操作感で URL ベースに正規化される
- 実現性: Cloudflare Workers + RSC + 04a で完結
- 整合性: stableKey 参照のみ + URL query 正本（不変条件 #1, #8）
- 運用性: 04a の Cache-Control を活用すれば 100k req/day 以内（不変条件 #10）

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 2 | 4 画面の Server / Client 境界に展開 |
| Phase 4 | URL contract test 設計の入力 |
| Phase 7 | AC マトリクスの源 |
| Phase 11 | smoke の入力 |
| 08b | Playwright の入力 |

## 多角的チェック観点

| # | 不変条件 | 確認内容 | 反映場所 |
| --- | --- | --- | --- |
| #1 | 実フォーム schema を固定しすぎない | stableKey 参照のみ、questionId 直書き禁止 | AC-8 |
| #5 | apps/web から D1 直接禁止 | 全データは 04a 経由 | architecture |
| #6 | GAS prototype を本番仕様に格上げしない | `window.UBM` 不採用 | AC-7 |
| #8 | localStorage を正本にしない | density / sort も URL query | AC-9 |
| #9 | `/no-access` 不採用 | `/register` から `/login` 誘導 | scope out |
| #10 | 無料枠 | RSC キャッシュ + Cache-Control | Phase 9 |

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 4 画面責務抽出 | 1 | pending | 05-pages |
| 2 | URL contract 抽出 | 1 | pending | 12-search-tags |
| 3 | form-preview 仕様 | 1 | pending | 01-api-schema |
| 4 | 04a API I/O 確認 | 1 | pending | 04a |
| 5 | AC 草案 | 1 | pending | AC-1〜AC-12 |
| 6 | 4 条件 | 1 | pending | PASS / TBD |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-01/main.md | Phase 1 主成果物 |
| メタ | artifacts.json | phase 1 status |

## 完了条件

- [ ] AC-1〜AC-12 が記述
- [ ] 4 画面の責務が表で示される
- [ ] URL query contract が初期値 / 不正値処理を含めて確定
- [ ] 4 条件評価が PASS

## タスク100%実行確認【必須】

- 全 6 サブタスクが completed
- outputs/phase-01/main.md 配置
- 全完了条件にチェック
- 不変条件 #1, #5, #6, #8, #9, #10 への対応が明記
- 次 Phase へ Server / Client 境界の論点を引継ぎ
- artifacts.json の phase 1 を completed に更新

## 次 Phase

- 次: 2 (設計)
- 引き継ぎ事項: AC を Server / Client 境界・data fetching 設計に展開
- ブロック条件: AC が未確定なら進まない

## 真の論点

- `/members` の検索を Server Component で行うか、Client Component で行うか（URL query との連動性 vs SSR キャッシュ）
- `/register` の form-preview を ISR / RSC キャッシュにするか、毎回 fetch するか
- density 切替を URL query にするか、Cookie にするか（不変条件 #8 では URL query が正本）

## 依存境界

| 種別 | 境界 | 担当 | 越境禁止 |
| --- | --- | --- | --- |
| 上流 | `GET /public/*` 4 endpoint | 04a | 形を変えない |
| 上流 | UI primitives | 00 task | 直接 styles.css に依存しない |
| 上流 | view model 型 | 01b → packages/shared | 型を再定義しない |
| 並列 | 06b/06c | session 状態 | 共通 layout で吸収 |
| 下流 | 08b Playwright | 検証マトリクス | spec を変えない |

## 価値とコスト

| 軸 | 内容 |
| --- | --- |
| 価値 | 公開メンバー一覧で会員候補に「誰がいるか」を瞬時に伝える |
| コスト | 4 画面 × Server / Client 境界 + URL query 正規化 |
| 払わないコスト | 編集 UI、本人 / 管理者操作（別タスク） |

## 4 条件評価

| 条件 | 問い | 判定 | 根拠 |
| --- | --- | --- | --- |
| 価値性 | 公開導線が GAS prototype 同等の操作感を持てるか | PASS | URL query で全状態を表現 |
| 実現性 | RSC + Workers で成立するか | PASS | `@opennextjs/cloudflare` で保証 |
| 整合性 | stableKey + URL query 正本が specs と一致するか | PASS | 12-search-tags / 01-api-schema 一致 |
| 運用性 | 無料枠運用で耐えられるか | PASS | 04a の Cache-Control 活用 |
