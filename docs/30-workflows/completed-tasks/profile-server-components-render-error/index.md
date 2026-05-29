# profile-server-components-render-error

[実装区分: 実装仕様書]

> 判定根拠: 報告事象は staging `/profile` の Server Components render error（digest=398449091、scope=profile）。
> Phase 5 でコード修正（`apps/web/src/lib/fetch/authed.ts` の env 参照経路の是正・`127.0.0.1:8787` fallback 撤去・
> `app/(member)/profile/page.tsx` の初回 `/me` 呼び出しを `safeServerFetch` 経由へ整流化）を行わない限り解消しないため、
> ドキュメント・調査のみで完結する余地はなく、CONST_004 のデフォルト（実装仕様書）に該当する。

## メタ情報

| 項目                  | 値                                                                       |
| --------------------- | ------------------------------------------------------------------------ |
| Task ID               | TASK-FIX-PROFILE-SCR-ERR-STG-001                                         |
| Feature 名            | profile-server-components-render-error                                   |
| Task type             | implementation                                                          |
| visualEvidence        | NON_VISUAL（runtime/infra bugfix、UI 表示物の意匠変更なし）              |
| implementation_mode   | `new`                                                                    |
| workflow_state        | `implemented_local_evidence_captured`                                    |
| 影響 surface          | apps/web `/profile` 配下（member route group の profile page + 共通 authed fetch） |
| 関連 PR               | `fix-admin-server-components-render-error-stg`（admin 側の同型違反解消、parity 参照） |
| 発生環境              | Cloudflare Workers staging (`ubm-hyogo-web-staging.daishimanju.workers.dev`) |
| エラー digest         | `398449091`                                                              |
| エラー scope          | `profile`                                                                |
| 想定 1 cycle 完了     | はい（調査→修正→staging 再現確認→regression spec 追加までを 1 PR）       |

## 報告事象（一次情報）

```
Error: An error occurred in the Server Components render.
The specific message is omitted in production builds to avoid leaking sensitive details.
A digest property is included on this error instance which may provide additional details
about the nature of the error.

profile error boundary log:
  scope: profile
  digest: 398449091
  event: error.boundary.caught
```

エラー画面: 「マイページの読み込みに失敗しました」（`/profile/error.tsx` boundary）。

## 真の論点（task-specification-creator 思考法）

1. **真の論点**: `apps/web/src/lib/fetch/authed.ts` の `resolveApiBase()` が `process.env["INTERNAL_API_BASE_URL"]` / `process.env["PUBLIC_API_BASE_URL"]` を直接参照しており、Cloudflare Workers + `@opennextjs/cloudflare` runtime では `[vars]` バインディングを参照できず、双方 undefined となり `FALLBACK_INTERNAL_API = "http://127.0.0.1:8787"` が採用される。Workers から 127.0.0.1 は到達不能のため `/me` 呼び出しが throw し、`page.tsx` L41 の `throw err;` が SCR を中断 → `/profile/error.tsx` boundary が `digest=398449091, scope=profile` でログ。
2. **依存関係・責務境界**: 本不具合は CLAUDE.md「**`apps/web` ランタイムでの env 参照は env.ts の用途別 accessor 経由のみ・`process.env.*` 直接禁止**」不変条件違反で、`fix-admin-server-components-render-error-stg` で `apps/web/src/lib/admin/server-fetch.ts` に対して既に解消した問題と同型。
3. **価値とコストの不均衡**: env 参照経路の是正は単一 helper 修正で済む。さらに `/me` 呼び出しの未捕捉 throw が SCR ハードクラッシュを誘発する設計の脆さがあるため、`safeServerFetch` 経由で SectionError 化することで二段防御を入れる（既存 `/me/profile` と一貫化）。
4. **改善優先順位**: ① `authed.ts` の env 参照を `getApiBaseEnv()` 経由に置換 → ② `127.0.0.1:8787` fallback 撤去 → ③ `profile/page.tsx` の `/me` を `safeServerFetch` 化 → ④ regression spec 追加 → ⑤ staging 再現確認。
5. **4条件評価**:
   - 価値性: `/profile` の staging 障害解消、admin 側との対称的な仕様統一、回帰防止
   - 実現性: 修正範囲は `authed.ts` + `profile/page.tsx` の 2 ファイル
   - 整合性: 既存 env.ts accessor contract・Cloudflare bindings・既存 API surface と整合。admin 側の前例と同設計
   - 運用性: focused regression spec + grep gate で再発検出可能

## Phase 構成

| Phase | 名称                 | 状態       | 出力先                                |
| ----- | -------------------- | ---------- | ------------------------------------- |
| 1     | 要件定義             | completed | outputs/phase-1/phase-1.md            |
| 2     | 設計                 | completed | outputs/phase-2/phase-2.md            |
| 3     | 設計レビュー         | completed | outputs/phase-3/phase-3.md            |
| 4     | テスト作成           | completed | outputs/phase-4/phase-4.md            |
| 5     | 実装                 | completed | outputs/phase-5/phase-5.md            |
| 6     | テスト拡充           | completed | outputs/phase-6/phase-6.md            |
| 7     | カバレッジ確認       | completed | outputs/phase-7/phase-7.md            |
| 8     | リファクタリング     | completed | outputs/phase-8/phase-8.md            |
| 9     | 品質保証             | completed | outputs/phase-9/phase-9.md            |
| 10    | 最終レビュー         | completed | outputs/phase-10/phase-10.md          |
| 11    | 手動テスト           | completed_local_runtime_pending | outputs/phase-11/phase-11.md          |
| 12    | ドキュメント更新     | completed | outputs/phase-12/phase-12.md          |
| 13    | PR作成               | pending_user_approval | outputs/phase-13/phase-13.md          |

## 不変条件（CLAUDE.md より）

- `apps/web` ランタイムの env 参照は `getEnv()` / `getApiBaseEnv()` / `getPublicEnv()` / `getAuthEnv()` / `getPublicFetchEnv()` 経由のみ（`process.env.*` 直接禁止）
- 127.0.0.1 等ローカル限定エンドポイントの `apps/web/src` 配下への焼き込み禁止
- D1 直接アクセスは `apps/api` に閉じる（`apps/web` から直接アクセス禁止）
- 新規 test ファイルは `*.spec.{ts,tsx}` のみ（`*.test.{ts,tsx}` 禁止）
- 既存 API endpoint surface のみ利用（新 endpoint 追加禁止）
- Cloudflare Workers production build (`next build --webpack`) 互換性維持

## DoD（Definition of Done）

- staging `https://ubm-hyogo-web-staging.daishimanju.workers.dev/profile` が 200 で render される
- `error.boundary.caught` (scope=profile) が runtime smoke で発生しない
- `apps/web/src/lib/fetch/authed.ts` 内で `process.env[` 文字列が 0 件（grep）
- `apps/web/src/lib/fetch/authed.ts` 内で `127.0.0.1` 文字列が 0 件（grep）
- 既存 regression spec (`apps/web/src/lib/fetch/authed.spec.ts`) が pass
- regression spec (`apps/web/app/(member)/profile/page.spec.tsx`) が pass し `/me` 5xx 時に throw せず error UI を返すことを固定
- `pnpm typecheck` / `pnpm lint` / `bash scripts/verify-pr-ready.sh` が pass
