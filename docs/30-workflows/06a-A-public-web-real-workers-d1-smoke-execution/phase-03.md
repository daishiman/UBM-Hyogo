# Phase 3: 設計レビュー — 06a-A-public-web-real-workers-d1-smoke-execution

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | 06a-A-public-web-real-workers-d1-smoke-execution |
| phase | 3 / 13 |
| wave | 6a-fu |
| mode | parallel |
| 作成日 | 2026-05-01 |
| taskType | implementation-spec / docs-only |
| visualEvidence | VISUAL_ON_EXECUTION |

## 目的

Phase 2 の設計が CLAUDE.md ルール / 不変条件 / 上下流タスクと矛盾なく整合しているかを検証し、代替案・リスク・GO/NO-GO 条件を確定する。MAJOR が無いことを確認し、MINOR は Phase 5 runbook に持ち越す trace を残す。

## 判定: **PASS-MINOR**

Phase 2 設計は CLAUDE.md ルール（`scripts/cf.sh` 必須）と不変条件 #6（3 層分離）に整合し、目的（実 binding 経由 smoke）を達成可能。MINOR 指摘 3 点を Phase 5 runbook で吸収する。

## 代替案比較

### 案 A: 全部 staging で済ます（local smoke 省略）

| 観点 | 評価 |
| --- | --- |
| 利点 | esbuild mismatch 問題を回避できる。staging が production と同一 runtime のため信頼度高 |
| 欠点 | (1) staging deploy ごとにイテレーションが遅い。(2) staging D1 を smoke 用に汚す or seed 別途用意が必要。(3) local 開発体験が改善しないまま再発する。(4) `apps/web` の D1 直接 import 等の lint 失敗を CI まで遅延 |
| 不変条件適合 | #6 適合だが local 検証ループ無し |
| 判定 | **不採用**（CLAUDE.md は `scripts/cf.sh` 経由で local 起動可能と明記しているため local 省略は逃げ） |

### 案 B: local 必須 + staging 必須（**採用**）

| 観点 | 評価 |
| --- | --- |
| 利点 | local で素早く反復、staging で実 Cloudflare runtime（service binding / vars）確認の二段網羅。本タスクの「mock では検出不能領域」を完全カバー |
| 欠点 | esbuild mismatch を最初に解く必要があるが `scripts/cf.sh` で恒久解決済 |
| 不変条件適合 | #6 完全適合（経路自体を 2 環境で踏む + AC-7 rg 二重担保） |
| 判定 | **採用** |

### 案 C: vitest + miniflare で D1 in-memory smoke

| 観点 | 評価 |
| --- | --- |
| 利点 | CI 組込可能 / 高速 |
| 欠点 | (1) miniflare は実 Cloudflare runtime ではないため staging 固有問題（service binding / vars / asset binding / `@opennextjs/cloudflare` adapter）を検出できない。(2) 本タスクのスコープ（手動 smoke gate）を超える |
| 判定 | **不採用**（08a / 08b の test 戦略と責務が重複。本 followup は手動 smoke gate として独立価値がある） |

### 案 D: production で smoke

| 観点 | 評価 |
| --- | --- |
| 利点 | 最終形に最も近い |
| 欠点 | production deploy は本タスク scope 外。ユーザ承認 / blast radius / branch protection の観点で smoke 用途には過剰 |
| 判定 | **不採用** |

## MINOR 指摘事項

### M-1: D1 binding 未 apply 時の振る舞い

local `--local --persist-to .wrangler/state` で D1 migration が未 apply の場合、`/members` が空配列 `200` を返す可能性があり「mock と区別がつかない」状態になる。

**対応**: Phase 5 runbook の「事前準備」に migration 状況確認コマンドを必須ステップとして明記。

```bash
bash scripts/cf.sh d1 migrations list ubm-hyogo-db-prod --env production
# 全 migration が applied であることを確認
```

加えて、AC-4 で `SEED_ID=$(curl -s http://localhost:8787/public/members | jq -r '.items[0].id')` の取得を必須とし、空の場合は Phase 11 NO-GO とする。

### M-2: staging `PUBLIC_API_BASE_URL` の確認手順

Phase 2 では `apps/web/wrangler.toml [env.staging.vars]` を grep / Read する手順を採用しているが、deployed vars の実値（Cloudflare 側に反映済の値）と toml が乖離する可能性がある。

**対応**: Phase 5 runbook で以下の二段確認を明記:
1. `apps/web/wrangler.toml` の `[env.staging.vars]` 該当行を Read（toml 上の宣言値）
2. staging `/` の HTML レスポンス内に `localhost` 文字列が含まれないこと、もしくは staging API へのリクエストが 200 を返すことで間接確認

### M-3: `INTERNAL_API_BASE_URL` の扱い

`apps/web/wrangler.toml [env.staging.vars]` には `PUBLIC_API_BASE_URL` と `INTERNAL_API_BASE_URL` の両方が定義されている。Phase 2 では主に `PUBLIC_API_BASE_URL` を扱ったが、server-side fetch 経路で `INTERNAL_API_BASE_URL` が参照される場合の挙動を確認する必要がある。

**対応**: Phase 5 runbook で local 起動時に両方の env を渡すこと、staging vars 確認時に両方の値が staging API URL を指すことを check する手順を明記。

## MAJOR 指摘事項

なし。

## リスク評価

| リスク | 発生確率 | 影響 | 緩和策 |
| --- | --- | --- | --- |
| esbuild mismatch 再発 | 低 | 中 | `scripts/cf.sh` 経由起動を唯一の経路として強制（CLAUDE.md ルール） |
| local D1 空（mock と区別不能） | 中 | 高 | M-1 対応で migration list / SEED_ID 取得を必須化 |
| staging deploy が必要になり approval が遅延 | 中 | 中 | Phase 1 で approval gate を明記済。本タスクは smoke のみで deploy を含まない |
| staging Worker の cold start 失敗 | 低 | 中 | Phase 11 NO-GO 条件として明記、再試行手順を Phase 6 で吸収 |
| `apps/web` 配下に D1 直接 import が紛れ込む | 低 | 高 | AC-7 で `rg` 検査を二重担保 |
| staging `PUBLIC_API_BASE_URL` が `localhost` を指す | 低 | 高 | M-2 対応 + AC-6 evidence で gate |

## 上下流タスクとの整合性レビュー

| 関係 | 対象 | 整合性 |
| --- | --- | --- |
| 上流 | 04a public API | `/public/members` `/public/members/:id` の 200/404 contract を前提に AC-4 を組んでおり整合 |
| 上流 | 06a public web implementation | 公開4 route の存在を前提とし、新機能追加は scope out で整合 |
| 上流 | Cloudflare D1 binding | `apps/api/wrangler.toml [[d1_databases]]` を前提とし、既存 binding を流用するのみで整合 |
| 下流 | 09a staging deploy smoke | 本タスクが staging vars 健全性 (`PUBLIC_API_BASE_URL` の正値設定) を確認することで 09a の前提条件を満たす |
| 下流 | 08b Playwright E2E | 本タスクが実 binding 経路の baseline (HTTP status / seeded ID 経由 200) を確定することで 08b の比較基準として機能 |

## 不変条件 trace 再確認

| # | 設計での担保 |
| --- | --- |
| #5 | 公開 route のみ smoke 対象、member / admin は触らない |
| #6 | smoke 経路自体が `apps/web → apps/api → D1` を踏む。さらに AC-7 で `apps/web` 配下の D1 直接 import 0 件を `rg` で確認 |
| #8 | smoke 対象は `apps/api` 実体のみ、GAS endpoint / localStorage 状態は触らない |
| #14 | local は wrangler local mode、staging は既存 staging Worker のみ使用、新規リソース作成なし |
| 実フォーム formId | `119ec539YYGmkUEnSYlhI-zMXtvljVpvDFMm7nfhp7Xg` を `apps/api` `[vars]` で参照、本タスクで上書きしない |

## GO / NO-GO 条件

### GO

- 完了済み類似タスク（06a-followup-001）と同一の AC trace 構造で AC-1〜AC-9 が evidence path と 1:1 で対応している
- `scripts/cf.sh` 経由起動が唯一の経路として明記されている
- 不変条件 #6 が経路 + rg の二重担保で守られている
- approval gate（staging deploy / migration apply）が user 明示承認待ちとして分離されている

### NO-GO

- AC のいずれかが evidence path 未確定で残っている
- wrangler 直叩きの手順が混入している
- approval gate を超える操作（deploy / push / PR）が仕様書作成 task に含まれている
- mock と実 D1 の区別が SEED_ID 検証で確保されていない

## レビュー結論

- **採用案**: 案 B（local 必須 + staging 必須）
- **MINOR 3 件**（M-1 / M-2 / M-3）を Phase 5 runbook へ持ち越し
- **MAJOR**: なし
- 次フェーズ（Phase 4 テスト戦略）では curl matrix を route × env × expected status の 8 セル以上で明示し、AC-4 の seeded ID 経路を独立行として追加する

## 参照資料

- docs/30-workflows/completed-tasks/06a-followup-001-public-web-real-workers-d1-smoke/phase-03.md
- docs/30-workflows/completed-tasks/06a-parallel-public-landing-directory-and-registration-pages/
- docs/00-getting-started-manual/specs/05-pages.md
- docs/00-getting-started-manual/specs/09-ui-ux.md
- docs/00-getting-started-manual/specs/12-search-tags.md
- docs/00-getting-started-manual/specs/08-free-database.md
- CLAUDE.md
- apps/web/wrangler.toml / apps/api/wrangler.toml

## 実行手順

- 対象 directory: `docs/30-workflows/06a-A-public-web-real-workers-d1-smoke-execution/`
- 本仕様書作成ではアプリケーションコード、deploy、commit、push、PR 作成を行わない。
- 実装・実測時は Phase 5 / Phase 11 の runbook と evidence path に従う。

## 統合テスト連携

- 上流: 04a public API, 06a public web implementation, Cloudflare D1 binding
- 下流: 09a staging deploy smoke, 08b Playwright E2E

## 多角的チェック観点

- #5 public/member/admin boundary
- #6 apps/web から D1 直接アクセス禁止
- #8 localStorage/GAS prototype を正本にしない
- #14 Cloudflare free-tier
- 未実装/未実測を PASS と扱わない
- placeholder と実測 evidence を分離する
- 上下流タスク（04a / 06a / 09a / 08b）の前提条件 / 期待結果と整合する

## サブタスク管理

- [ ] 代替案 A / B / C / D を比較し採用案を確定する
- [ ] MINOR 指摘 M-1 / M-2 / M-3 を Phase 5 へ trace する
- [ ] MAJOR が無いことを確認する
- [ ] GO / NO-GO 条件を明記する
- [ ] 上下流タスクとの整合性を確認する
- [ ] outputs/phase-03/main.md を作成する

## 成果物

- outputs/phase-03/main.md

## 実行タスク

この Phase の実行タスクは本文中のタスク表、検証手順、またはチェックリストに記載済み。

## 完了条件

- 採用案が確定し代替案との比較が記録されている
- MAJOR が無いことが明示されている
- MINOR が Phase 5 runbook へ trace される形で記録されている
- 上下流タスクとの整合性が確認されている
- GO / NO-GO 条件が明記されている

## タスク100%実行確認

- [ ] この Phase の必須セクションがすべて埋まっている
- [ ] 完了済み本体タスクの復活ではなく follow-up gate の仕様になっている
- [ ] 実装、deploy、commit、push、PR を実行していない
- [ ] PASS / MINOR / MAJOR の判定が明示されている
- [ ] 上下流タスクの前提 / 期待結果と矛盾がない

## 次 Phase への引き渡し

Phase 4 へ以下を渡す:
- 採用設計（案 B: local + staging 二段）
- MINOR 3 件の trace 先（M-1 / M-2 / M-3 → Phase 5 runbook）
- curl matrix を route × env × expected で 8 セル以上にする要件
- AC-4 の seeded ID 経路を独立検証行として明示する要件
- 上下流タスクとの依存契約（04a の API contract / 09a の staging baseline）
