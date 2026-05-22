# Phase 01: 要件定義

## サマリ

`docs/00-getting-started-manual/specs/09-ui-ux.md` を「契約のみ」版へ全面書き換える実装仕様書タスク。本 Phase で真の論点 4 件・依存境界 4 区分・4 条件 PASS・AC-1〜AC-14 を確定し、後続 task-07/08/09/10/11..17/19..22 が「契約 1 行 → 実装 1 ファイル」で並列着手できる土台を固定する。

## 真の論点（true issue）

| # | 論点 | 影響 |
| --- | --- | --- |
| issue 1 | 旧 160 行は視覚詳細（Hero 構成順序 / 密度切替値 / KPI 文言 / 行範囲 / 余白値）と契約（props / state / a11y）が混在。grep で「ある画面の API 接続」「ある primitive の variants」を一意に取り出せない | 22 並列タスクが衝突 |
| issue 2 | 視覚詳細値（HEX / oklch / px / `bg-[#...]`）が 09-ui-ux.md に残ると、task-08（09b 設計トークン）と二重正本になり同期事故が起きる | token 値の決定権が分散 |
| issue 3 | prototype の EDITMODE 専用要素（TweaksPanel / theme switcher / AvatarStoreProvider の localStorage / `data-theme="warm"/"cool"`）と gas-prototype 由来挙動の採否判定が未明示 | 不変条件 #6 と衝突 |
| issue 4 | login 5 状態（input/sent/unregistered/deleted/error）/ 申請 server-pending state / dialog/drawer の WAI-ARIA Authoring Practices 準拠が散在し grep 不可 | a11y 仕様の正本が不確定 |

## 依存境界

| 区分 | 正本 |
| --- | --- |
| 正本責務境界 | 契約（props / state / a11y / token 名 / API）= `09-ui-ux.md` / 視覚値 = `09b-design-tokens.md` / prototype mapping = `09a-prototype-map.md` / primitive 完全仕様 = `09c-primitives.md` / screen blueprint = `09e/09f/09g` / icon = `09d` / shell + fixture = `09h` / 正解スクリーンショット = Storybook VRT |
| API 接続境界 | `phase-3.md §2` を 1 字も改変せず転記。新 endpoint / D1 schema / Google Form schema 変更禁止 |
| token 名境界 | `--ubm-color-*` / `--ubm-radius-*` / `--ubm-shadow-*` / `--ubm-space-*` / `--ubm-text-*` / `--ubm-font-*` / `--ubm-dur-*` / `--ubm-ease-*` の 8 prefix 名のみ参照。値は記述しない |
| D1 境界 | `apps/web` から D1 直接アクセス禁止（CLAUDE.md 不変条件 #5）。契約上も `apps/api` 経由のみ記述 |

## 価値とコスト

| 観点 | 内容 |
| --- | --- |
| 初回価値 | 後続 22 task が「契約 1 行 → 実装 1 ファイル」で並列着手可能。grep で routes / primitives / a11y が一意取得可能 |
| 払うコスト | 19 routes × 統一 10 列の表を機械的に書き切る筋力、prototype.jsx 約 2,000 行から契約抽出する読解工数 |
| 払わないコスト | token 値の決定（task-08）/ prototype 行範囲 mapping（task-07）/ 実装コード変更（task-09 以降）/ 09c..09h 詳細記述（task-19..22） |

## 4 条件評価

| 条件 | 判定 | 根拠 |
| --- | :---: | --- |
| 価値性 | PASS | 22 並列タスクの衝突を物理分離で解消 |
| 実現性 | PASS | 1 サイクル / 約 1.0 人日 / 1 ファイル書き換えのみ |
| 整合性 | PASS | secrets 不使用、CLAUDE.md 不変条件 #2/#3/#5/#6 に整合 |
| 運用性 | PASS | git revert で完全 rollback、task-07/08 と link path のみで疎結合、Phase 12 で implementation-guide を残す |

## AC-1〜AC-14（quantitative）

| AC | 内容 | 判定方法 |
| --- | --- | --- |
| AC-1 | 09-ui-ux.md の H2（`## `）が 10 個 | `grep -c '^## ' = 10` |
| AC-2 | §2 配下 H3（`### 2.`）が 20 個（19 routes + global-error fallback） | `grep -c '^### 2\.' = 20` |
| AC-3 | HEX 直書き 0 件 | `grep -E '#[0-9a-fA-F]{3,8}' = 0` |
| AC-4 | oklch() 値直書き 0 件 | `grep -E 'oklch\(' = 0` |
| AC-5 | px 値直書き 0 件 | `grep -E '\b[0-9]+px\b' = 0` |
| AC-6 | `bg-[#...]` / `text-[#...]` 0 件 | `grep -E 'bg-\[#|text-\[#' = 0` |
| AC-7 | 19 routes + global-error fallback すべて記述 | trace-check の 20 件一致 |
| AC-8 | primitives 13 件すべて記述 | `### 3\.1\.` の 13 件一致 |
| AC-9 | login 5 状態を §4.2 で grep 1 行取得可能 | `grep -n '^### 4\.2' = 1` |
| AC-10 | dialog/drawer の `aria-modal` 記述を §5.2 で取得可能 | `grep -n '^### 5\.2'` 1 件 |
| AC-11 | token prefix 8 種すべて §6.3 に列挙 | `--ubm-{color,radius,shadow,space,text,font,dur,ease}-*` 8 件 |
| AC-12 | apps/web → D1 直接参照 0 件 | `grep -E 'D1\b.*binding' apps/web のみで 0` |
| AC-13 | gas-prototype 不採用記述あり | §4.6 に 4 行 |
| AC-14 | markdown lint exit 0 | `markdownlint outputs && echo $?` |

## 不変条件マッピング（#2 / #3 / #5 / #6）

- **#2 consent キー統一**: §2.1.4 register / §2.2.2 profile で `publicConsent` / `rulesConsent` 明示
- **#3 responseEmail = system field**: §2.2.2 / §2.3.2 で system field 注記
- **#5 apps/web → D1 禁止**: §2 全 routes の API 列で `apps/api` 経由のみ
- **#6 GAS prototype 非昇格**: §4.6 で gas-prototype 由来 4 項目を不採用明示

## 19 routes / primitives 網羅性

- 公開 6 + 会員 2 + 管理 8 + 共通 3 + global-error fallback 1 = 20 H3 → phase-1.md / phase-3.md と一致
- primitives 13: Button / Card / Badge / Input / Select / Table / Tabs / Sidebar / Toast / Skeleton / DataTable / EmptyState / ErrorState → phase-2.md と一致

## サブタスク完了状態

| # | サブタスク | 状態 |
| --- | --- | :---: |
| 1 | 真の論点 4 件確定 | completed |
| 2 | 依存境界 4 区分明文化 | completed |
| 3 | 4 条件 PASS 判定 | completed |
| 4 | AC-1〜AC-14 quantitative 化 | completed |
| 5 | 不変条件マッピング | completed |
| 6 | 19 routes / primitives 網羅性突合 | completed |
| 7 | outputs/phase-01/main.md 配置 | completed |

## 次 Phase

Phase 2（設計）へ。引き継ぎ: 真の論点 4 件 → 章立て差分（§1〜§10）/ §2 表 10 列 / §3 表 8 列 / §4.5 prototype 由来 19 行 / §4.6 不採用 4 項目。
