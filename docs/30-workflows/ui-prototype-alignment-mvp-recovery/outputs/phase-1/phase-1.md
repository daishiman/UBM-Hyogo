# Phase 1: スコープ定義 / 全画面拡張版

> 改訂日: 2026-05-07
> 改訂理由: 当初 MVP 4 画面 (`/`, `/login`, `/profile`, `/(admin)/admin`) のみを対象としていたスコープを、UBM 兵庫支部会メンバーサイトの**全 routes（公開 6 / 会員 2 / 管理 8 / 共通 3 ≒ 19 routes）**へ拡張する。
> プロトタイプ（`docs/00-getting-started-manual/claude-design-prototype/`）に明示的な画面 mock が無い管理画面群・register・privacy・terms は、プロトタイプの**デザイン言語（OKLch トークン、primitives セット、レイアウトリズム）**から再構成する。
> 既存 Cloudflare Workers バックエンド (`apps/api/`) は**接続先として確定**しており、本ワークフローでは**新 API endpoint 追加・D1 schema 変更を非ゴール**とする。

---

## 1. ゴール / 非ゴール

### 1.1 ゴール（Definition of Done）

| カテゴリ | 条件 | 検証 |
|---------|------|------|
| カバレッジ | 19 routes すべてが 200 / 301 / 適切な auth リダイレクトを返す | Playwright smoke (task-18) |
| デザイン整合 | OKLch トークン (`--ubm-color-*`) が全画面で適用され、HEX 直書き 0 件 | `pnpm verify-design-tokens` (CI gate) |
| ランタイム | Cloudflare Workers 上で SSR / RSC / Server Action がエラー 0 で動作 | Sentry production / staging エラー 0 |
| API 接続 | 各画面が表 §3 のマッピングに従い既存 `apps/api/` の endpoint と接続 | 接続検証 e2e + 手動 smoke |
| アクセシビリティ | 主要 8 画面で axe critical violation 0 | Playwright + axe-core |
| パフォーマンス | LCP ≤ 2.5s / CLS ≤ 0.1（公開トップ・会員一覧） | Lighthouse CI（参考値） |

### 1.2 非ゴール（明示除外）

- D1 schema migration の追加・変更（既存 schema 固定）
- 新 API endpoint の追加（`apps/api/src/routes/` の現行 surface 外は触らない）
- Google Form schema の変更（`questionCount: 31` 固定）
- 認証フロー仕様の変更（Auth.js + Magic Link + Google OAuth は現行のまま）
- ネイティブ / モバイルアプリ化
- 多言語対応（i18n は将来の別ワークフロー）
- 新規 admin 機能ロジック（既存 endpoint の UI 接続のみ）

---

## 2. スコープ拡張の根拠

### 2.1 旧スコープ（MVP 4 画面）の限界

旧 phase-1 は次の 4 画面に絞っていた:

1. `/` トップ
2. `/login` ログイン
3. `/profile` マイプロフィール
4. `/(admin)/admin` 管理ダッシュボード

しかし以下 3 つの構造的問題が判明したため拡張する:

1. **Hero / 会員一覧 / 詳細の整合**: `/` の Stats と Zone 説明はプロトタイプ上、`/(public)/members` および `/(public)/members/[id]` への導線を前提に設計されており、トップだけ刷新しても会員一覧側のトークン不整合が残る。
2. **管理画面の実用性**: `/(admin)/admin` のダッシュボード KPI から各 admin 画面への遷移リンクが死リンクになると、ダッシュボードの存在意義が損なわれる。
3. **法務ページ・登録導線**: `/privacy` `/terms` `/(public)/register` は MVP 公開要件として avoidable ではなく、ヘッダー / フッターから常時参照される。

### 2.2 拡張後の 19 routes

| 層 | route | プロトタイプ掲載 | 設計指針 |
|----|-------|-----------------|---------|
| 公開 | `/` | 有 (`pages-public.jsx`) | プロトタイプ忠実 |
| 公開 | `/(public)/members` | 有 | プロトタイプ忠実（密度切替を追加） |
| 公開 | `/(public)/members/[id]` | 有 | プロトタイプ忠実 |
| 公開 | `/(public)/register` | 無 | デザイン言語ベース：Hero + CTA card（Google Form リダイレクト） |
| 公開 | `/privacy` | 無 | デザイン言語ベース：legal-prose primitive |
| 公開 | `/terms` | 無 | デザイン言語ベース：legal-prose primitive |
| 会員 | `/login` | 有 (`pages-member.jsx`) | プロトタイプ忠実（5 状態を実装） |
| 会員 | `/profile` | 有 | プロトタイプ忠実 |
| 管理 | `/(admin)/admin` | 有 (`pages-admin.jsx`) | プロトタイプ忠実 |
| 管理 | `/(admin)/admin/members` | 部分 (table primitive) | デザイン言語ベース：DataTable + Filter |
| 管理 | `/(admin)/admin/tags` | 無 | デザイン言語ベース：Queue list + Detail panel |
| 管理 | `/(admin)/admin/meetings` | 無 | デザイン言語ベース：Calendar / List + Form |
| 管理 | `/(admin)/admin/schema` | 無 | デザイン言語ベース：Diff view + Apply CTA |
| 管理 | `/(admin)/admin/requests` | 無 | デザイン言語ベース：Queue + Detail + Action bar |
| 管理 | `/(admin)/admin/identity-conflicts` | 無 | デザイン言語ベース：Side-by-side compare |
| 管理 | `/(admin)/admin/audit` | 無 | デザイン言語ベース：Filterable timeline |
| 共通 | `error.tsx` | 無 | デザイン言語ベース：Error state primitive |
| 共通 | `not-found.tsx` | 無 | デザイン言語ベース：Empty state primitive |
| 共通 | `loading.tsx` | 無 | デザイン言語ベース：Skeleton primitive |

> 「デザイン言語ベース」とは、`primitives.jsx` で定義されている Card / Badge / Button / Input / Table / Sidebar / Tabs などの primitive 群と、`styles.css` の OKLch tokens / spacing rhythm / typography ramp を組み合わせて画面を**新規構成する**ことを指す。プロトタイプに mock 画面が無いことは、プロトタイプ準拠を放棄する免罪符にはならない。

---

## 3. 既存バックエンド接続マッピング

`apps/api/src/routes/` のディレクトリ構造を正本とし、各画面が利用する endpoint を確定する。

### 3.1 公開層

| 画面 | API endpoint (現行) | response shape 概要 | 備考 |
|------|--------------------|---------------------|------|
| `/` | `GET /public/stats`, `GET /public/members?limit=N`, `GET /public/form-preview` | `{ totalMembers, byZone, byStatus }` / `{ items: PublicMember[] }` / `{ sectionCount, questionCount }` | Hero stats と Timeline で合計 3 endpoint 並列フェッチ |
| `/(public)/members` | `GET /public/members?zone=&status=&q=&page=` | `{ items, page, pageSize, total }` | 検索・絞り込み・密度切替は client-side state のみ、API call はクエリ反映 |
| `/(public)/members/[id]` | `GET /public/member-profile/:id` | `PublicMemberDetail`（公開 visibility のみ） | 非公開項目は API 側で既に除外済み |
| `/(public)/register` | なし（外部リダイレクト） | — | `responderUrl` に 302 |
| `/privacy` | なし | — | 静的 |
| `/terms` | なし | — | 静的 |

### 3.2 会員層

| 画面 | API endpoint | response shape | 備考 |
|------|-------------|----------------|------|
| `/login` (input) | `POST /auth/magic-link` | `{ ok: true }` | Auth.js Email provider と直結 |
| `/login` (sent) | — | — | Magic Link 送信後の確認画面 |
| `/login` (unregistered/deleted/error) | `GET /auth/gate-state?email=` | `{ state: "unregistered"\|"deleted"\|"active", reason? }` | 5 状態のうち情報状態を確定 |
| `/login` (Google OAuth) | `GET /auth/session-resolve` | `{ userId, role }` | Auth.js session callback 後の補完 |
| `/profile` | `GET /me`, `GET /auth/schemas`, `POST /me/visibility-request`, `POST /me/delete-request` | `MeProfile` / `FormSchemaSnapshot` / `{ ok }` / `{ ok }` | 公開状態バナー + 公開範囲サマリ + 申請パネル + 削除申請の 4 領域で利用 |

### 3.3 管理層

| 画面 | API endpoint | response shape | 備考 |
|------|-------------|----------------|------|
| `/(admin)/admin` | `GET /admin/dashboard` | `{ kpis: KPI[], byZone, byStatus, recentActions }` | KPI 4 + chart 2 + actions list を 1 endpoint で集約 |
| `/(admin)/admin/members` | `GET /admin/members?...`, `POST /admin/member-status`, `POST /admin/member-delete` | `{ items, total }` / `{ ok }` / `{ ok }` | テーブル + 詳細 drawer + status / delete action |
| `/(admin)/admin/tags` | `GET /admin/tags-queue`, `POST /admin/tags-queue/:id/decision` | `{ items: TagCandidate[] }` / `{ ok }` | キュー一覧 + 採否操作 |
| `/(admin)/admin/meetings` | `GET /admin/meetings`, `POST /admin/meetings`, `PATCH /admin/meetings/:id` | `{ items }` / `{ id }` / `{ ok }` | 開催日 CRUD |
| `/(admin)/admin/schema` | `GET /admin/schema`, `POST /admin/sync-schema` | `{ current, latest, diff }` / `{ ok }` | 差分表示 + apply |
| `/(admin)/admin/requests` | `GET /admin/requests`, `POST /admin/requests/:id/decision` | `{ items }` / `{ ok }` | visibility / delete 申請統合キュー |
| `/(admin)/admin/identity-conflicts` | `GET /admin/identity-conflicts`, `POST /admin/identity-conflicts/:id/resolve` | `{ items }` / `{ ok }` | 同一人物候補ペア比較 + 統合操作 |
| `/(admin)/admin/audit` | `GET /admin/audit?actor=&action=&from=&to=` | `{ items: AuditEvent[] }` | filter + timeline |

### 3.4 共通

| route | 接続 | 備考 |
|-------|------|------|
| `error.tsx` | Sentry `captureException` | API call なし |
| `not-found.tsx` | なし | 静的 |
| `loading.tsx` | なし | Suspense fallback |

> 重要: 上記マッピングはすべて既存 `apps/api/src/routes/` 内に endpoint が存在する前提で書いている。task 実装時に endpoint shape が表と乖離する場合は、**API 側を変更せず UI 側で adapter を挟む**方針とする（非ゴール §1.2 参照）。

---

## 4. 成功条件マトリクス

| ID | 条件 | 検証コマンド / 手段 | 担当 task |
|----|------|--------------------|----------|
| S-01 | 全 19 routes が HTTP 200 / 301 / 適切な auth リダイレクトを返す | `pnpm test:e2e:smoke` (Playwright) | task-18 |
| S-02 | OKLch tokens が全画面で適用、HEX 直書き 0 件 | `pnpm verify-design-tokens` (CI) | task-09, task-18 |
| S-03 | Sentry production エラー 0（24h 観測） | Sentry dashboard | task-03, task-05 |
| S-04 | `apps/web` ビルドが Cloudflare Workers で成功 | `pnpm --filter web build` | task-02 |
| S-05 | `window` 直接参照の SSR runtime error 0 | task-04 lint rule + Sentry | task-04 |
| S-06 | error boundary が staging で smoke 確認済み | task-05 手動チェックリスト | task-05 |
| S-07 | Tailwind v4 + primitives が全画面で参照可能 | import graph 検査 | task-09, task-10 |
| S-08 | UI/UX 契約ドキュメントが 19 routes 全てを網羅 | doc presence check | task-06 |
| S-09 | プロトタイプ → 本番画面マッピング表が完成 | task-07 deliverable | task-07 |
| S-10 | Phase 12 implementation guide に全 18 task の差分 hint が反映 | doc review | phase-3 |

---

## 5. 制約と前提

### 5.1 技術制約

- **ランタイム**: Cloudflare Workers + Next.js App Router via `@opennextjs/cloudflare`。Node.js API は polyfill 経由のみ。
- **D1 access**: `apps/api` 経由のみ。`apps/web` から direct binding は禁止。
- **Auth.js**: Magic Link + Google OAuth。session 取得は `apps/api/auth/session-resolve` で正規化済みのものを使う。
- **Tailwind v4**: `@theme` block で OKLch tokens を宣言。Tailwind v3 syntax は使わない。
- **Sentry**: Workers SDK (`@sentry/cloudflare`) と Browser SDK の両方を unify する（task-03）。

### 5.2 プロセス制約

- 単一実装サイクル（CONST_007）で完結する見込み。phase-2 §単一サイクル工数見積を参照。
- branch 戦略は `feature/* → dev → main` の三段。本ワークフローは feature ブランチ 1 本に集約する。
- PR レビュー必須数は 0（solo 開発ポリシー）。CI gate のみで品質保証。

### 5.3 デザイン制約

- OKLch カラースペース固定。`--ubm-color-primary` `--ubm-color-accent` `--ubm-color-zone-{a..e}` などのトークン名はプロトタイプ `styles.css` に従う。
- spacing rhythm は 4px base、type ramp は `text-xs` から `text-3xl` までの 7 段階。
- dark mode は MVP では非対応（将来トークンで切替できる構造のみ確保）。

---

## 6. リスクと緩和策

| リスク | 影響 | 緩和策 |
|--------|------|--------|
| プロトタイプ未掲載画面の解釈ぶれ | 管理画面のデザインが分散 | task-07 でマッピング表を確定、task-10 primitives を全画面で再利用させ強制的に統一 |
| 既存 API の response shape 不整合 | 画面実装が止まる | UI 側に adapter 層を置き、API 変更なしで吸収（§3 末尾の方針） |
| Cloudflare Workers SSR で window 参照エラー | 本番 500 | task-04 で lint rule + runtime guard を入れる |
| OKLch サポートしない古いブラウザ | 色化け | `@supports` fallback を tokens に同梱（task-08 で記述） |
| 18 タスクの並列実行で primitives 競合 | merge 競合多発 | task-09→10 を直列、画面群（task-11..17）は task-10 完了後に並列化 |
| Sentry 二重初期化 | event 重複 | task-03 で Workers SDK / Browser SDK の guard を統一 |

---

## 7. 想定ユーザーストーリー（受け入れ観点）

### 7.1 公開層

- 訪問者が `/` を開くと、ヘッダー・Hero・KPI stats（実 D1 集計）・Zone 説明・Timeline が OKLch tokens で表示される
- 訪問者が `/(public)/members` で zone / status / 自由検索を組み合わせて絞り込める
- 訪問者が会員カードをクリックすると `/(public)/members/[id]` で公開項目のみが表示される
- 訪問者が `/(public)/register` から Google Form に遷移できる
- 訪問者が `/privacy` `/terms` を読める

### 7.2 会員層

- 未登録メールで Magic Link 要求 → `unregistered` 状態画面が出る
- 削除済みメールで Magic Link 要求 → `deleted` 状態画面が出る
- 登録済みメールで Magic Link → メール受信 → クリックでログイン → `/profile` に着地
- `/profile` で公開状態バナー（公開中 / 一部非公開 / 非公開）が見える
- 公開範囲変更を申請 → 申請パネルに pending として表示される
- 削除申請 → 確認モーダル → submit で API 呼出

### 7.3 管理層

- 管理者が `/(admin)/admin` で KPI 4 + Zone 分布 + Status 分布 + 直近アクションを 1 画面で把握
- `/(admin)/admin/members` で全会員を絞り込み、status 変更 / 削除を実行できる
- `/(admin)/admin/tags` でタグキューの採否を判断できる
- `/(admin)/admin/meetings` で開催日を CRUD できる
- `/(admin)/admin/schema` で Form schema 差分を確認し sync を実行できる
- `/(admin)/admin/requests` で会員からの申請を裁定できる
- `/(admin)/admin/identity-conflicts` で同一人物候補を統合できる
- `/(admin)/admin/audit` で監査ログをフィルタして閲覧できる

---

## 8. 19 routes × 8 責務 dir 概観

| 責務 dir | 主担当 routes | task 番号 |
|---------|--------------|----------|
| 01-scope | 全 routes | task-01 |
| 02-runtime | 全 routes（基盤） | task-02..05 |
| 03-spec-source | 全 routes（仕様基盤） | task-06..08 |
| 04-design-system | 全 routes（UI 基盤） | task-09..10 |
| 05-screens-public | `/`, `/(public)/members`, `/(public)/members/[id]`, `/(public)/register`, `/privacy`, `/terms` | task-11, task-12 |
| 06-screens-member | `/login`, `/profile` | task-13, task-14 |
| 07-screens-admin | `/(admin)/admin/*` × 8 | task-15, task-16, task-17 |
| 08-regression | 全 routes（検証） | task-18 |

詳細な DAG と並列マトリクスは phase-2 §3, §4 を参照。

---

## 9. 用語集

| 用語 | 定義 |
|------|------|
| OKLch トークン | `oklch(L C H)` 形式で `:root` に宣言する CSS 変数。例: `--ubm-color-primary: oklch(0.62 0.18 254)` |
| primitive | `apps/web/src/components/ui/` 直下に置く、再利用 UI 部品（Card / Button / Badge / Input / Table 等） |
| zone | 会員区分（A〜E）。color tokens `--ubm-color-zone-a` 〜 `-e` で表現 |
| gate-state | login 時の 5 状態（input / sent / unregistered / deleted / error） |
| visibility-request | 会員が公開範囲を変更する申請 |
| identity-conflict | 同一人物候補（重複登録）を統合する admin 機能 |
| デザイン言語ベース | プロトタイプの primitives + tokens + rhythm を組み合わせて画面を構成する方針 |

---

## 10. 次フェーズ参照

- phase-2: 8 責務 dir / 18 タスク一覧、DAG、並列マトリクス、工数見積
- phase-3: 18 タスク × 想定変更ファイル俯瞰、API 接続 hint、プロトタイプ未掲載画面の設計指針
