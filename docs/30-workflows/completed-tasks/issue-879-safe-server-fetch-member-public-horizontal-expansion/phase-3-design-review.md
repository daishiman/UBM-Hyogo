# Phase 3: 設計レビュー（Gate-A）

## メタ情報

| 項目 | 値 |
|---|---|
| Phase | 3 / 13 |
| Gate | Gate-A (spec_review) — **passed** |
| approver | daishiman |
| passed_at | 2026-05-24 |

## 1. レビュー観点と判定

| # | 観点 | 判定 | 根拠 |
|---|---|---|---|
| 1 | CONST_007 1 サイクル完了スコープ | OK | 全 8 AC が単一 PR で達成可能。先送りタスクなし |
| 2 | 既存 import path 不変 | OK | admin re-export 層で `safeServerFetch(path, opts)` signature と `ADMIN_FETCH_*` error code 維持 |
| 3 | error.tsx 到達経路の保護 | OK | `rethrowOn` に `AuthRequiredError` / `FetchPublicNotFoundError` 等を明示。SafeResult が page-fatal を握り潰さない |
| 4 | OKLch token 正本性 | OK | 既存 `--ubm-color-*` のみ参照。新規 token / HEX 直書きなし |
| 5 | 不変条件 #1（既存 API endpoint surface） | OK | 既存 `fetchAuthed` / `listMembers` / `fetchPublicOrNotFound` を call site で wrap するのみ |
| 6 | 不変条件 #5（D1 直接禁止） | OK | apps/web → API Worker 経路は不変 |
| 7 | 不変条件 #3（プロトタイプ正本順位） | OK | SectionError は public/member で同 props shape、admin 既存 API 維持で primitive 追加なし |
| 8 | NON_VISUAL 分類の妥当性 | OK | 視覚的に新規要素は SectionError のみ、token 内で表現。playwright visual baseline 更新不要 |

## 2. 主要設計判断の最終確認

### 2.1 案 A vs 案 B → **案 B 確定**

理由:
- admin と member/public で `safeServerFetch` の意味的等価性が SSOT 化される
- admin 既存 import path は re-export で完全互換維持できるため、admin 側 PR コストはほぼゼロ
- 将来の更新（rethrowOn 拡張・error code 整備）が 1 か所で完結

### 2.2 SectionError の実装分散 → **layer ごとに実装、public/member props shape のみ統一**

理由:
- admin cool / member warm / public default の theme 差分を OKLch token 経由で吸収する都合上、layer ごとの実装が token 参照を素直にする
- public/member の props shape を統一することで、将来共通 primitive へ畳む選択肢は維持される
- admin は既存 `_shared/AdminSectionError` の `sectionLabel/code/correlationId/message` API を維持し、既存 import path と call site を壊さない
- public/member 6 ケース（2 layer × 3 variant）と admin 既存 regression spec で境界を assert

### 2.3 `rethrowOn` の必要性 → **必須**

理由:
- `AuthRequiredError` を握り潰すと `redirect("/login")` 経路が消える
- `FetchPublicNotFoundError` を握り潰すと 404 UX が壊れる
- Next.js の `redirect()` / `notFound()` は内部で throw する frame work signal なので、明示的 allowlist で守る

## 3. リスクと緩和

| リスク | 緩和策 |
|---|---|
| admin re-export 層の signature drift | Phase 6 で `apps/web/src/lib/admin/__tests__/safe-server-fetch.spec.ts` を維持し、error code prefix `ADMIN_FETCH_*` を回帰検知 |
| `rethrowOn` allowlist 漏れ | Phase 4 のテスト計画で `AuthRequiredError` / `FetchPublicNotFoundError` 両方の re-throw を必須ケースとして列挙 |
| SectionError theme drift | Phase 6 で 3 layer × default/with-detail/with-retry の 9 ケース＋HEX 直書き 0 件 assert |
| Next.js 16 server component の async error trapping 仕様変更 | helper は plain try/catch でフレームワーク非依存。React Server Component 仕様に依存しない |

## 4. Gate-A 結論

**passed**。Phase 4 へ進む条件を満たす。

## 成果物

- 本ファイル

## 完了条件

- 全レビュー観点が OK 判定で記録されている
- Gate-A の判定理由・approver・日時が artifacts.json と一致している
