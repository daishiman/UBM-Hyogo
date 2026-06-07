# staging-api-url-and-session-recovery

> ステージング (`ubm-hyogo-web-staging.daishimanju.workers.dev`) で観測された
> 「ローカルホストのアドレスになっている」「ログイン情報（セッション）を取得できていない」
> の 2 症状を、根本原因まで遡って恒久解消するための **実装仕様書群**。
>
> **実装区分: 実装仕様書**（CONST_004 デフォルト / コード変更を伴う）
> **implementation_mode: `new`**（既存 fallback を service-binding 経路へ置換・新規ガード追加）
> **taskType: implementation / NON_VISUAL**（transport・env・config の修正。視覚差分は副次的に
> 「/profile がエラーカード → 実コンテンツ」に変わるが UI レンダリングコードは変更しない）

| metadata | value |
|----------|-------|
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| workflow_state | implemented_local_evidence_captured |
| implementation_status | implemented_local |

---

## 0. 症状と観測ログ（Phase 1 への入力）

ユーザー報告のステージング画面 + DevTools console:

```
content.js:21  POST http://127.0.0.1:8888/ net::ERR_CONNECTION_REFUSED
index-BusXyNuZ.js:13319 [Sentry] You cannot use Sentry.init() in a browser extension ...
画面: 「セッション情報を取得できませんでした / アカウント情報を確認できませんでした。再ログインしてください。」
```

| # | 症状 | 一次切り分け |
|---|------|-------------|
| S1 | console に `POST http://127.0.0.1:8888/ ERR_CONNECTION_REFUSED` | `content.js` + `Sentry.init() in a browser extension` 警告 = **ブラウザ拡張由来**。当アプリのコード/ビルドではない（スコープ外・本文 §Phase1 で根拠提示） |
| S2 | `/profile` で「セッション情報を取得できませんでした」（再ログイン CTA 付き = `MEMBER_SESSION_404` 分岐） | **アプリの実害**。server component `fetchAuthed("/me")` が API `/me` から 404 を受領 → 主因は **同一 account workers.dev への plain `fetch()` loopback 404**（Lane A） |
| S3 | （潜在）client component から API を叩くと localhost へ飛ぶ | `PUBLIC_API_BASE_URL` が `NEXT_PUBLIC_` 接頭辞なしで client bundle に inline されず `http://localhost:8787` fallback（Lane B） |

> S1 は当アプリ無関係である一方、ユーザーの「ローカルホストになっている」懸念に対し、
> アプリ内に実在する localhost fallback（S3 / `:8787`）を Lane B で恒久根絶し、
> grep gate（task-18）を `:8888` だけでなく `:8787` / `localhost` まで広げる（Lane C）。

---

## 1. スコープ（3 レーン / 1 実装サイクル・1 PR / CONST_007）

| Lane | タイトル | 主因 → 対策 | 主変更 | 視覚 |
|------|---------|------------|--------|------|
| **A** | server-side fetch の service-binding 統一 | 同一 account workers.dev loopback 404 → `API_SERVICE.fetch()` 優先 | `apps/web/src/lib/fetch/authed.ts`, `app/api/me/[...path]/route.ts`, `app/api/admin/[...path]/route.ts`, `app/api/auth/*`, `src/lib/auth/verify-magic-link.ts`, `src/lib/env.ts` | NON_VISUAL |
| **B** | client bundle の localhost 焼き込み根絶 | `PUBLIC_API_BASE_URL` 非 inline → `NEXT_PUBLIC_API_BASE_URL` 統一 + fallback を local 限定ガード | `apps/web/src/lib/fetch/public.ts`, `src/lib/env.ts`, `apps/web/wrangler.toml`, `.github/workflows/web-cd.yml` | NON_VISUAL |
| **C** | CF staging secret parity + grep gate 強化 + runtime smoke | `AUTH_SECRET` web↔api parity 未保証 / gate が `:8888` のみ | `scripts/diagnose-auth-secret-parity.sh`(新), `scripts/cf-secret-put-auth-secret.sh`(新), grep gate (`.github/workflows` or `scripts/verify-no-localhost-bake.sh` 新), `scripts/smoke-staging-me.sh`(新) | NON_VISUAL |

3 レーンは責務分離されているが、実装順序は **Lane A → Lane B → Lane C → verification** とする。Lane B は Lane A が追加する `getEnvironment()` / transport 方針へ順序依存する。すべて 1 実装サイクル内で完了し、先送り・別 PR・バックログ送りは行わない。未タスク分離は §Phase 12 の検出結果に従い 0 件。

### スコープ外

- S1（`127.0.0.1:8888` / Sentry-in-extension）= ブラウザ拡張のコンテンツスクリプト。当リポジトリの変更対象ではない。
- 新規 API endpoint 追加 / D1 schema 変更 / Google Form 仕様変更（不変条件）。
- Auth provider（Google OAuth / Magic Link）の認証ロジック自体の再設計。

---

## 2. 不変条件（本 workflow 共通）

1. D1 直接アクセスは `apps/api` に閉じる（`apps/web` から D1 binding 禁止）— 不変条件 #5。
2. `apps/web` の env 参照は `apps/web/src/lib/env.ts` の公開アクセサ経由のみ。`process.env.*` 直接参照禁止 — task-02 invariant。
3. 認証境界は fail-closed を優先（invariant #11）。
4. `127.0.0.1` / `localhost` のローカル限定エンドポイントを `apps/web/src` 配下へ無条件で焼き込まない（task-18 grep gate を Lane C で強化）。
5. `apps/web` production build は `next build --webpack`（OpenNext Workers 互換）を維持。
6. Cloudflare 系 CLI は `scripts/cf.sh` ラッパー経由のみ。`wrangler` 直呼び禁止。`.env` 実値は読まない。
7. commit / push / PR / `cf.sh secret put` 実行・staging deploy・runtime smoke の実走は **すべて user-gated**（CONST_002 / CONST_007 例外）。

---

## 3. フェーズ構成（Phase 1–13）

| Phase | 成果物 | 状態 |
|-------|--------|------|
| 1 要件定義 | `outputs/phase-1/phase-1.md` | completed |
| 2 設計 | `outputs/phase-2/phase-2.md` | completed |
| 3 設計レビュー | `outputs/phase-3/phase-3.md` | completed |
| 4 テスト作成 | `outputs/phase-4/phase-4.md` | completed |
| 5 実装 | `outputs/phase-5/phase-5.md` | completed |
| 6 テスト拡充 | `outputs/phase-6/phase-6.md` | completed |
| 7 カバレッジ確認 | `outputs/phase-7/phase-7.md` | completed |
| 8 リファクタリング | `outputs/phase-8/phase-8.md` | completed |
| 9 品質保証 | `outputs/phase-9/phase-9.md` | completed |
| 10 最終レビュー | `outputs/phase-10/phase-10.md` | completed |
| 11 手動テスト | `outputs/phase-11/phase-11.md` + `manual-test-result.md` | completed |
| 12 ドキュメント更新 | `outputs/phase-12/phase-12.md` + `outputs/phase-12/`（strict 7） | completed |
| 13 PR 作成 | `outputs/phase-13/phase-13.md` | blocked（user-gated） |

### レーン別実装仕様書（CONST_005 必須項目を満たす実装指示書）

- `tasks/task-a-server-fetch-service-binding.md`
- `tasks/task-b-client-localhost-bake-eradication.md`
- `tasks/task-c-cf-secret-parity-and-gates.md`

---

## 4. 完了条件（DoD・workflow 全体）

- 3 レーンの実装仕様書が CONST_005 必須 6 項目（変更ファイル一覧 / シグネチャ / 入出力・副作用 / テスト方針 / 実行コマンド / DoD）をすべて含む。
- `verify:phase12-compliance` PASS（canonical 9 見出し + Phase 11 evidence inventory）。
- `gate-metadata:validate` ERROR 0（artifacts.json zod schema）。
- 後続 03.実装.md の 1 サイクルでコードを書き切れる粒度であること。

---

## 5. 参照

- 調査根拠: 本文 `outputs/phase-1/phase-1.md` §因果分析。
- 関連先行: `task-05a-fetchpublic-service-binding-001`（public.ts のみ service-binding 化した取りこぼしを本 workflow が完結）。
- 関連 lessons: `task-staging-auth-secret-binding-recovery-001`（L-AUTHSECRET-001..003）。
