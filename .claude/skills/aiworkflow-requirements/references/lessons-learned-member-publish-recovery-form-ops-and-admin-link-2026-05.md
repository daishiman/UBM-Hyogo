# Lessons Learned — member-publish-recovery-form-ops-and-admin-link（2026-05-31）

> task: `docs/30-workflows/member-publish-recovery-form-ops-and-admin-link/`（Task A/B/C/D, implementation, VISUAL_ON_EXECUTION）
> 関連 spec: `docs/00-getting-started-manual/specs/03-data-fetching.md`（反映 SLA）、`docs/00-getting-started-manual/google-form/02-result.md`（Form 編集/回答 URL）
> 関連 source: `apps/web/app/api/admin/[...path]/route.ts`、`apps/web/src/features/admin/{components/_sync,diagnostics}`、`apps/web/src/components/public/ReflectionTimingNote.tsx`、`apps/web/src/components/shell/{shell-config,SidebarNavItem,icons}.tsx`、`apps/web/src/lib/constants/form.ts`
> 関連 reference: [workflow-member-publish-recovery-form-ops-and-admin-link-artifact-inventory.md](workflow-member-publish-recovery-form-ops-and-admin-link-artifact-inventory.md)
> 関連 changelog: `changelog/20260531-member-publish-recovery-form-ops-and-admin-link.md`

| ID | Lesson |
| --- | --- |
| L-MPUB-001 | sync 系 proxy path への server-side Bearer 注入は path allowlist で限定する |
| L-MPUB-002 | proxy の `INTERNAL_API_BASE_URL` / secret は localhost fallback でなく env 別 fail-fast にする |
| L-MPUB-003 | 「backend 実装済み・UI 導線欠落」型は endpoint 実在ベースで再スコープし新規 backend 契約を 0 に寄せる |
| L-MPUB-004 | 同一 page を複数並列タスクが触る場合はパネルを `*.client.tsx` に分離して編集競合を構造排除する |
| L-MPUB-005 | Google Form 反映 SLA は cron 周期 + ISR revalidate + 最悪値の 3 段で文書化し surface ごとに文言分岐する |
| L-MPUB-006 | external nav link は `external?` フラグ分岐 + `<a target=_blank rel=noopener noreferrer>` + a11y 補助で実装する |
| L-MPUB-007 | 救済 backfill は公開 3 条件 AND を UI 文言と skip 分類の両方で一貫させ admin 明示設定を上書きしない |

## 教訓一覧

### L-MPUB-001: sync 系 proxy path への server-side Bearer 注入は path allowlist で限定する

- **背景**: Task B のフォーム手動再取込パネルは Next admin proxy（`apps/web/app/api/admin/[...path]/route.ts`）経由で `/admin/sync/*` を叩く。`needsSyncAdminBearer()`（route.ts:31-38）は `path[0]==="sync"` かつ `path[1] ∈ {schema, responses, backfill-publish-state, diagnostics}` の **4 path 限定 allowlist** で、ここに該当する時のみ server が `headers.authorization = Bearer ${SYNC_ADMIN_TOKEN}` を上書き注入する（route.ts:79-91）。並列 SubAgent 作成中、Task B がこの「sync 系だけ別認証経路」という横断的前提（A も巻き込む盲点）を発見した。
- **教訓**: client → proxy の Authorization は server で上書きされる前提。allowlist 漏れの新 sync endpoint は UI から呼ぶと Bearer 無しで 401/403 になる。
- **将来アクション**: sync 系 admin proxy endpoint を増やすときは必ず `needsSyncAdminBearer` の allowlist に追記する。client 側で Authorization を組み立てる設計に依存しない。発見した横断前提は親 phase（共通課題）と該当タスクへ同一 wave でクロスリファレンスする。

### L-MPUB-002: proxy の `INTERNAL_API_BASE_URL` / secret は localhost fallback でなく env 別 fail-fast にする

- **背景**: 旧 proxy は `INTERNAL_API_BASE_URL` 不在時に `http://127.0.0.1:8787` へ無条件 fallback し、staging で env が漏れると localhost へ空打ちして `ADMIN_FETCH_404` を誘発していた（route.ts:10-26 の followup-001 T-5.1 で撤去）。現実装は base URL 不在を `internal_api_base_url_missing` 500（:64-65）、`SYNC_ADMIN_TOKEN` 不在を `sync_admin_token_missing` 500（:85-86）で明示返却する。
- **教訓**: env/secret 不在を握り潰すと「localhost に届かないだけ」の 404 に化け、設定不備の原因特定が遅れる。
- **将来アクション**: proxy 系は本番/staging で env 不在を 500 + `*_missing` error code で表面化させ、ローカル開発時のみ限定 fallback する。secret 不在も error code を UI に伝播させる（invariant #11 fail-closed と整合）。

### L-MPUB-003: 「backend 実装済み・UI 導線欠落」型は endpoint 実在ベースで再スコープし新規 backend 契約を 0 に寄せる

- **背景**: backfill / manual-sync / diagnostics は既存 `/admin/sync/*` endpoint がすでに実装済みで、欠落していたのは admin UI 導線のみだった（index.md §0 ベースライン調査）。事前調査で endpoint/route の実在を確認した結果、新規 D1 migration・新 endpoint・Form schema 変更を 0 にし「UI wiring + 表示 schema（`BackfillResultSchema` / `SyncRunResponseSchema`）+ docs」へ再スコープできた（不変条件 #1）。
- **教訓**: CONST_004 の実装区分判定で「目的達成にコード変更が必要か」を endpoint 実在ベースで先に切り分けると、過剰実装を避けつつ実装仕様書化できる。
- **将来アクション**: タスク受領時に既存 endpoint surface を grep し、UI 導線追加で済むものは Phase 5 ランブックを「実装中心」でなく「配線 + 表示 schema 中心」へ切り替える。

### L-MPUB-004: 同一 page を複数並列タスクが触る場合はパネルを `*.client.tsx` に分離して編集競合を構造排除する

- **背景**: Task A/B はどちらも `/admin/sync-status/page.tsx` に UI を足す。`features/admin/components/_sync/` に `BackfillPublishStatePanel.client.tsx` / `ManualFormResyncPanel.client.tsx` を分離し、page.tsx は mount のみのコンテナにすることで並列 SubAgent の編集競合を回避した。diagnostics ロジックも `diagnostics/{backfill,manual-sync}.ts` に分離し path 定数 / schema を co-locate した。
- **教訓**: 共有 page を複数並列タスクが触る設計は、仕様段階でパネル分離を確定しておくと実装時の衝突をゼロにできる。
- **将来アクション**: 共有 page を複数タスクが触る設計では、各タスクの担当 UI を `*.client.tsx` に切り出し、page をコンテナ化する方針を Phase 1-3 設計で明記する。

### L-MPUB-005: Google Form 反映 SLA は cron 周期 + ISR revalidate + 最悪値の 3 段で文書化し surface ごとに文言分岐する

- **背景**: ユーザー質問「何分で反映されるか」を恒久回答化するため、`ReflectionTimingNote.tsx:14-16` に `RESPONSE_SYNC_MAX_DELAY_MINUTES=15`（cron `*/15`）/ `MEMBERS_ISR_MAX_SECONDS=30`（ISR `revalidate=30`）/ `WORST_CASE_MAX_MINUTES=45`（hourly scheduled sync 待ち）を定数化し、`03-data-fetching.md` に反映 SLA を追記した。`/members` は ISR キャッシュ待ちを足す文言、`/profile` は `no-store` で同期完了後即時反映の文言に surface 分岐する（:30, :42）。
- **教訓**: 反映遅延は cron 周期 / ISR revalidate / 最悪値の 3 段に分解しないと「最悪何分か」に答えられない。surface ごとにキャッシュ有無で体感が違う。
- **将来アクション**: 反映遅延を UI 表示するときは 3 段を定数化し、spec doc（`03-data-fetching.md`）と component 定数を双方向同期させる。surface ごとにキャッシュ有無の文言を分岐する。

### L-MPUB-006: external nav link は `external?` フラグ分岐 + `<a target=_blank rel=noopener noreferrer>` + a11y 補助で実装する

- **背景**: shell nav は内部 `<Link>` 専用だった。`shell-config.ts:33` に `readonly external?: boolean` を足し、`:95-98` に `FORM_RESPONSES_EDIT_URL` を href とする Form 回答 item を定義。`SidebarNavItem.tsx:53-67` で external 時は `next/link` でなく素の `<a>` に切替え `target="_blank" rel="noopener noreferrer"`、`<span class="sr-only">（外部リンク）</span>`（:39）と `↗` 視覚インジケータ（:41-45, collapsed 時は隠す）を付与した。URL 正本は `docs/.../google-form/02-result.md`。
- **教訓**: shell nav に外部リンクを混ぜるときは Link/`<a>` 出し分けと `rel="noopener noreferrer"` + sr-only ラベルを必須にしないと a11y / セキュリティが抜ける。
- **将来アクション**: 外部リンク nav は `external?` 分岐で実装し、URL はハードコードでなく `lib/constants` 経由で正本ドキュメント参照に固定する。

### L-MPUB-007: 救済 backfill は公開 3 条件 AND を UI 文言と skip 分類の両方で一貫させ admin 明示設定を上書きしない

- **背景**: 公開フィルタは `public_consent='consented' AND publish_state='public' AND is_deleted=0` の 3 条件 AND（`apps/api/src/repository/publicMembers.ts`）。`ReflectionTimingNote.tsx:47` の「公開許可（公開同意 + 公開設定 + 未削除）」文言もこれに一致させた。backfill の skip 分類は `alreadyPublic / adminExplicit / consentNotMet / deleted`（backfill.ts:11-16）で、`adminExplicit`（管理者が明示的に非公開化したもの）を救済対象から除外する。
- **教訓**: 「同意済み × member_only」を public へ救済する backfill は、admin が明示設定した状態まで上書きしてはいけない。公開境界の 3 条件を UI 説明文と skip 分類でずらすと挙動とユーザー説明が乖離する。
- **将来アクション**: 救済 backfill 実装時は base WHERE の 3 条件を UI 文言・skip 分類・spec の 3 箇所で一致させ、admin 明示操作を保護する skip カテゴリを必ず設ける。

## skill-feedback 申し送り

- **S-MPUB-1**: 「backend 実装済み・UI 導線欠落」型タスクの再スコープ判定（endpoint 実在 grep → 新規 backend 契約 0 へ寄せる）を task-specification-creator の Phase 0 事前調査チェックリスト化すると、過剰実装の予防が再現可能になる（L-MPUB-003 起点）。

## 確認パス

- `apps/web/app/api/admin/[...path]/route.ts:31-38`（allowlist）、`:79-91`（Bearer 注入）、`:10-26`/`:64-65`/`:85-86`（fail-fast）
- `apps/web/src/features/admin/diagnostics/backfill.ts:10-16`（skip 分類）
- `apps/web/src/components/public/ReflectionTimingNote.tsx:14-16`（SLA 定数）、`:42`/`:47`（surface 文言）
- `apps/web/src/components/shell/shell-config.ts:33`/`:95-98`、`SidebarNavItem.tsx:39`/`:41-45`/`:53-67`（external 分岐）
