# Implementation Guide — publish-state-backfill-admin-ui (Task A)

## Part 1: Concept

### なぜ必要か

公開を許可した会員が、内部スイッチ `publish_state` が `member_only` のまま残ることで公開一覧に出てこない場合がある。
これを後からまとめて救済する管理操作が **backfill** である。`admin/sync-status` 画面のパネルから 2 段階で実行する。

たとえば学校の掲示板に名前を出してよい人の名簿があるのに、掲示板へ貼る係のチェック欄だけ古いままになっている状態に近い。まず名簿を棚卸しして、貼ってよい人だけを確認してから掲示板側のチェック欄を直す。

### 何をするか

- **dry-run（試し計算）**: 「直したら何件直るか」を数えるだけで DB を変更しない。安全な下見。
- **apply（実行）**: dry-run で候補が見つかった後だけ押せる。`member_only` を `public` へ昇格する。実行前に confirm ダイアログで確認する。

「dry-run で下見 → 問題なければ apply」という二段構えにより、誤って一括公開する事故を防ぐ。

### 今回作ったもの

- `admin/sync-status` に公開状態 backfill パネルを追加した既存実装を正本化した。
- dry-run 結果、apply 結果、skipped 内訳、エラーを管理画面から確認できる契約を記録した。
- staging screenshot は認証付き実行が必要なため、Phase 11 では取得計画と pending boundary を明示した。

## Part 2: Technical Contract

### 実装スライス

| スライス | ファイル | 内容 |
|----------|----------|------|
| schema + path | `apps/web/src/features/admin/diagnostics/backfill.ts` | `BackfillResultSchema`（zod `.strict()`）+ `BackfillResult` 型 + `BACKFILL_PUBLISH_STATE_PATH` 定数 |
| panel | `apps/web/src/features/admin/components/_sync/BackfillPublishStatePanel.client.tsx` | dry-run / apply / confirm ガード / 結果 `<dl>` 描画 / parseError 分離 |
| page mount | `apps/web/app/(admin)/admin/sync-status/page.tsx` | `SyncStatusView` 末尾へ `<BackfillPublishStatePanel />` mount |
| tests | `BackfillPublishStatePanel.spec.tsx`（TC-A1..A7） / `sync-schemas.spec.ts`（TC-B1..B4） | パネル単体 + schema parse/reject |

### key facts

| key | value |
|-----|-------|
| path | `/api/admin/sync/backfill-publish-state` |
| endpoint（変更不要） | `POST /admin/sync/backfill-publish-state`（`apps/api`・差分 0） |
| mutation | `useAdminMutation`（`@/features/admin/hooks/...`・不変条件 #10） |
| dry-run/apply 切替 | `trigger(payload, endpointOverride)` 第2引数で `?dryRun=true|false` |
| apply ガード | `canApply`（dry-run 先行 + candidates>0）+ `globalThis.confirm` + `isSubmittingRef` |
| loading mode | `activeMode` で in-flight 操作を分離し、apply 実行中に apply 側だけ loading 表示する |
| tokens | OKLch（`--ubm-color-*` / `--ubm-color-danger`）のみ。HEX / `bg-[#...]` 禁止 |
| 結果描画 | `<dl className="grid grid-cols-2 md:grid-cols-4">`（mode/scanned/candidates/applied/skipped 4 種） |

### レスポンス契約（`BackfillResult`）

`dryRun` / `policy="auto-publish-on-consent"` / `scanned` / `candidates` / `applied` / `skipped.{alreadyPublic, adminExplicit, consentNotMet, deleted}`。
web は `BackfillResultSchema.safeParse` で検証し、endpoint を信頼しない（`.strict()` で余剰キー拒否）。

```ts
interface BackfillResult {
  dryRun: boolean;
  policy: "auto-publish-on-consent";
  scanned: number;
  candidates: number;
  applied: number;
  skipped: {
    alreadyPublic: number;
    adminExplicit: number;
    consentNotMet: number;
    deleted: number;
  };
}
```

### APIシグネチャ

```ts
POST /api/admin/sync/backfill-publish-state?dryRun=true
POST /api/admin/sync/backfill-publish-state?dryRun=false
```

web client は `useAdminMutation(BACKFILL_PUBLISH_STATE_PATH, "POST", { refreshOnSuccess: false })` を作り、`trigger({}, endpointOverride)` の第2引数で dry-run / apply を切り替える。

### 使用例

```ts
await mutation.trigger(
  {},
  `${BACKFILL_PUBLISH_STATE_PATH}?dryRun=true`,
);
```

```bash
pnpm vitest run --root=../.. --config=vitest.config.ts \
  apps/web/src/features/admin/components/_sync/__tests__/BackfillPublishStatePanel.spec.tsx \
  apps/web/src/features/admin/diagnostics/__tests__/sync-schemas.spec.ts
```

### エラーハンドリング

- HTTP / proxy error は `mutation.error.message` として表示する。
- response schema mismatch は `parseError="backfill result schema mismatch"` として表示し、`lastResult` を消す。
- apply confirm がキャンセルされた場合は `trigger` を呼ばず no-op にする。

### エッジケース

- dry-run 前、dry-run で `candidates=0`、または直近結果が apply の場合は apply button を disabled にする。
- endpoint が余剰 key を返した場合は `.strict()` schema が reject する。
- deleted / admin override / consent 未達 / already public は skipped 内訳として表示し、apply 対象にしない。

### 設定項目と定数一覧

| 定数 | 値 |
|------|----|
| `BACKFILL_PUBLISH_STATE_PATH` | `/api/admin/sync/backfill-publish-state` |
| policy | `auto-publish-on-consent` |
| dry-run query | `?dryRun=true` |
| apply query | `?dryRun=false` |

### テスト構成

| 層 | spec | 目的 |
|----|------|------|
| web panel | `BackfillPublishStatePanel.spec.tsx` | dry-run/apply/confirm/disabled/error/onApplied |
| web schema | `sync-schemas.spec.ts` | `BackfillResultSchema` parse/reject |
| API D1 endpoint | `sync-backfill-publish-state.spec.ts` | DB 副作用・skipped 分類 |
| sync contract | `backfill.contract.spec.ts` | backfill 経路の destructive 操作なし |

## Part 3: Evidence

| evidence | path / fact |
|----------|-------------|
| 実装 merge | PR #1064 / commit `745c95115`（dev landed） |
| review-cycle hardening | `BackfillPublishStatePanel.client.tsx` に `activeMode` を追加し apply loading 表示を補正 |
| 実装ファイル存在 | `backfill.ts` / panel / 2 spec / page mount を `ls` で確認済み |
| endpoint 不変 | `apps/api` 差分 0（親 AC-G2 / 不変条件 #5） |
| 3 層整合 | endpoint D1 spec / `sync-schemas.spec.ts` / `BackfillPublishStatePanel.spec.tsx` |
| AC | AC-A1（dry-run 内訳）/ AC-A2（apply 昇格）/ AC-A3（skipped 可視化）/ AC-A4（useAdminMutation） |
| corrupted path 補正 | 元タスク `?fullSync=true-publish-state` → 実コード `/api/admin/sync/backfill-publish-state` |
| runtime 証跡 | staging authenticated screenshot は user-gated（pending）。Phase 11 は manual test plan / interaction states / screenshot plan / smoke log / link checklist を deterministic plan evidence として整備 |
