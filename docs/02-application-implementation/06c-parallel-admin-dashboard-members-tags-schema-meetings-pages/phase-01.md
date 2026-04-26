# Phase 1: 要件定義

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 06c-parallel-admin-dashboard-members-tags-schema-meetings-pages |
| Phase 番号 | 1 / 13 |
| Phase 名称 | 要件定義 |
| Wave | 6 (parallel) |
| 作成日 | 2026-04-26 |
| 前 Phase | なし |
| 次 Phase | 2 (設計) |
| 状態 | pending |

## 目的

`/admin` 配下 5 画面（dashboard / members / tags / schema / meetings）の責務範囲を確定し、上流 04c の admin API と 05a の admin gate に対する UI 側の契約を一意化する。本人 profile 直接編集禁止・タグ queue 経由・schema 集約の 3 不変条件を UI レベルで担保する scope を Phase 2 以降に渡す形で固定する。

## 実行タスク

1. 上流 wave 04c, 05a, 05b, 00 が提供する API / session / UI primitives 一覧を index 化（完了条件: 各 endpoint と props を列挙）
2. 5 画面それぞれの「scope in / scope out / data 入力 / mutation」を確定（完了条件: outputs/phase-01/main.md に表で記述）
3. 不変条件 #4, #5, #11, #12, #13, #14, #15 が UI 上どう破られうるかリスト化（完了条件: anti-pattern 列挙）
4. AC 10 件の quantitative 条件をレビュー（完了条件: 各 AC に「測定方法」を付記）
5. 真の論点（true issue）を 3 件以上抽出（完了条件: priority 付き）

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | doc/00-getting-started-manual/specs/05-pages.md | `/admin/*` 5 画面の責務 |
| 必須 | doc/00-getting-started-manual/specs/09-ui-ux.md | 管理 UX 原則と Playwright 検証マトリクス |
| 必須 | doc/00-getting-started-manual/specs/11-admin-management.md | 管理者権限と運用ルール |
| 必須 | doc/00-getting-started-manual/specs/12-search-tags.md | タグ queue 仕様 |
| 必須 | doc/00-getting-started-manual/specs/16-component-library.md | UI primitives と admin component |
| 必須 | doc/02-application-implementation/04c-parallel-admin-backoffice-api-endpoints/index.md | 上流 API 一覧 |
| 必須 | CLAUDE.md | 不変条件 #1〜#15 |
| 参考 | doc/00-getting-started-manual/claude-design-prototype/ | 視覚品質下限 |

## 実行手順

### ステップ 1: input と前提の確認
- 04c, 05a, 05b, 00 の AC を確認（未達なら Phase 10 で NO-GO 判定の前提）
- specs 11 と 12 の運用ルールを照合し、admin 画面に持ち込まない UI を全列挙
- prototype（claude-design-prototype / gas-prototype）から取り込まないものを明示（unauth localStorage 永続化、theme 切替、placeholder Form URL）

### ステップ 2: scope 表の作成
- 5 画面 × {data 入力 API / mutation API / 表示 component / disabled 操作} の表を `outputs/phase-01/main.md` に記述
- AC ごとに「合格判定の方法（screenshot / lint / Playwright assertion）」を付記

### ステップ 3: 真の論点と handoff の確認
- 価値性 / 実現性 / 整合性 / 運用性 を再評価
- Phase 2 へ渡す blocker（例: 04c で未確定の endpoint）と open question を記録

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 2 | scope 表を入力に画面 component / data flow を設計 |
| Phase 4 | AC × 検証手段の対応を test 戦略へ反映 |
| Phase 7 | AC マトリクスのトレース元 |
| Phase 10 | gate 判定の根拠 |
| Phase 12 | spec sync の判断根拠 |

## 多角的チェック観点

| 不変条件 | チェック | 理由 |
| --- | --- | --- |
| #4 | profile 本文の input/textarea が出る画面が無いか | 本人更新は Form 再回答に一本化 |
| #5 | apps/web から D1 import / wrangler binding 直叩きが無いか | apps/api 経由のみ許可 |
| #11 | admin がドロワー内で本文編集できる UI がないか | 管理者は公開状態 / タグ / 開催日のみ管理 |
| #12 | 管理メモが public/member view へ漏れる API 呼び出しがないか | admin_member_notes は管理スコープ限定 |
| #13 | `/admin/members` ドロワーでタグ追加 form がないか | tag は queue → resolve 経由 |
| #14 | dashboard / members から schema 解消 UI が呼べないか | schema 変更は `/admin/schema` 集約 |
| #15 | attendance 候補に削除済み会員が混ざる UI がないか | DB constraint と UI 側 filter の二重防御 |
| 認可境界 | 未認証 / 非 admin で `/admin/*` にアクセスして blank page が出ないか | redirect or forbidden で明示 |
| 無料枠 | 1 ページあたりの fetch 数を押さえているか（dashboard 1 endpoint 集約） | Workers 100k req/日 |
| UI/UX | 09-ui-ux.md の「管理は情報密度を高くし landing 装飾を持ち込まない」原則 | 視覚品質維持 |

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 上流 API / session / primitives 一覧化 | 1 | pending | 04c index と 05a/b index 参照 |
| 2 | 5 画面 scope 表 | 1 | pending | outputs/phase-01/main.md |
| 3 | 不変条件 anti-pattern リスト | 1 | pending | #4 #5 #11 #12 #13 #14 #15 |
| 4 | AC quantitative 化 | 1 | pending | screenshot / lint / Playwright |
| 5 | true issue 抽出 | 1 | pending | priority 付き 3 件 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-01/main.md | 5 画面 scope 表 + AC quantitative + 真の論点 |
| メタ | artifacts.json | Phase 1 を completed に更新 |

## 完了条件

- [ ] 5 画面 scope 表（data 入力 / mutation / 表示 / disabled）が完成
- [ ] 不変条件 anti-pattern が 7 個以上列挙
- [ ] AC 10 件すべてに測定方法が付与
- [ ] 真の論点 3 件以上が priority 付きで記録
- [ ] 4 条件（価値性 / 実現性 / 整合性 / 運用性）が PASS

## タスク100%実行確認

- 全実行タスクが completed
- outputs/phase-01/main.md が指定構造を満たす
- 上流 wave AC 未達時のリスクが記録済み
- artifacts.json で phase 1 が completed

## 次 Phase

- 次: 2 (設計)
- 引き継ぎ: scope 表 + 不変条件 anti-pattern リストを Phase 2 設計の入力にする
- ブロック条件: 上流 04c / 05a / 05b の AC 一覧が確定していない場合は Phase 1 で blocker として記録

## 真の論点

1. `/admin/members` ドロワー内のタグ「表示」と「編集」をどう視覚分離するか（編集は queue 経由のみ、誤操作させない UI 文言）
2. `/admin` dashboard の KPI を `GET /admin/dashboard` 1 回で取れる設計を 04c に要請するか、UI で複数 fetch を許容するか
3. schema diff の back-fill dry-run 結果をどこに表示するか（07b の workflow 結果を `/admin/schema` で受け取る UI 契約）

## 依存境界

- 04c: 全 admin API（必須）
- 05a: admin gate と session.adminFlag（必須）
- 05b: 未認証時の `/login` 誘導（必須）
- 00: UI primitives + tones.ts
- responsibility 分離: workflow 本体は 07a/b/c、UI はその呼び出しと結果表示のみ

## 価値とコスト

- 初回価値: 管理者が「誰の何を処理すべきか」が一画面で把握できる、運用作業のセルフサービス化
- 初回で払わないコスト: 管理者管理 UI、profile 直接編集 UI、タグ辞書編集 UI、物理削除 UI（運用要請が出てから別 task で追加）

## 4 条件評価

| 条件 | 問い | 判定 |
| --- | --- | --- |
| 価値性 | 管理者が処理待ちタスクをすぐ把握できるか | TBD（Phase 2 で確定） |
| 実現性 | 上流 04c API + 05a gate のみで成立するか | TBD |
| 整合性 | 不変条件 #4, #5, #11, #12, #13, #14, #15 が UI 設計で破られないか | TBD |
| 運用性 | tag / schema / attendance workflow を 07a/b/c へ正しく handoff できるか | TBD |
