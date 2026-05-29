# Task B: Auto-publish on consent policy

`[実装区分: 実装仕様書]`

## 目的

`public_consent='consented'` で sync された会員を feature flag 配下で `publish_state='public'` にする。Admin が明示的に非公開化した records は保護する。

## 変更対象ファイル

| Path | 種別 |
| --- | --- |
| `apps/api/src/lib/policies/auto-publish.ts` | 新規 |
| `apps/api/src/lib/policies/auto-publish.spec.ts` | 新規 |
| `apps/api/src/jobs/sync-forms-responses.ts` | 編集 |
| `apps/api/src/jobs/sync-forms-responses.contract.spec.ts` | 編集 |
| `apps/api/src/env.ts` | 編集 |
| `apps/api/wrangler.toml` | 編集 |

## 関数

```ts
export type PublishState = "public" | "member_only" | "hidden";
export type ConsentValue = "consented" | "declined" | "unknown";

export function decidePublishState(input: AutoPublishInput): PublishState;

export function isAdminOverrideStatus(input: {
  currentPublishState: PublishState;
  updatedBy: string | null;
}): boolean;
```

`member_status_history` は存在しないため使わない。`currentPublishState === "hidden"` または `updatedBy` が non-null かつ `system:` prefix でない場合を admin override とする。

## sync 統合

`ResponseSyncEnv` に `MEMBERS_AUTO_PUBLISH_ON_CONSENT?: string` を追加する。`setConsentSnapshot()` 後に current status を再取得し、policy が `public` を返した時だけ `member_status` を UPDATE する。

追加 UPDATE は `writeCount` に加算し、`estimateResponseWrites()` の見積もりにも 1 write を足す。history INSERT はしない。

## テスト

- truth table 全ケース。
- flag=false で既存 sync の `member_only` 維持。
- flag=true + consented + no override で `public` + `updated_by='system:sync'`。
- flag=true + `hidden` / admin updated_by で更新スキップ。

## DoD

- [ ] canonical publish state は `public | member_only | hidden`
- [ ] legacy `private/published` は入力境界で正規化または診断のみで可視化
- [ ] env 型、wrangler staging/prod vars、write cap 見積もりが同期
- [ ] focused tests green
