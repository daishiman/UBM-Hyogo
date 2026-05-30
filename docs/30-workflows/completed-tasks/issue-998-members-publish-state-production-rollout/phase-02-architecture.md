# Phase 2: 設計（アーキテクチャ）

## 2.1 既存コンポーネント再利用可否（FB-SDK-07-1）

本タスクは**新規 UI / 新規モジュール実装ゼロ**。すべて既存実装の再利用 + config 1 行変更で達成する。

| レイヤ | 既存資産（再利用） | 本タスクでの扱い |
|--------|-------------------|-----------------|
| policy | `apps/api/src/lib/policies/auto-publish.ts` `decidePublishState` | 不変・再利用 |
| sync job | `apps/api/src/jobs/sync-forms-responses.ts`（flag 分岐） | 不変・再利用（flag 値で挙動切替） |
| backfill | `apps/api/src/routes/admin/sync-backfill-publish-state.ts` `runBackfillPublishState` | 不変・再利用 |
| diagnostics | `apps/api/src/routes/admin/sync-diagnostics.ts` | 不変・再利用 |
| 公開フィルタ | `apps/api/src/_shared/public-filter.ts`（条件定義）+ `apps/api/src/repository/publicMembers.ts`（適用） | 不変（表示条件変更禁止） |
| ops scripts | `scripts/diagnose-members-pipeline.sh`, `scripts/backfill-publish-state.sh` | 不変・再利用 |
| config | `apps/api/wrangler.toml` production `[vars]` | **唯一の変更点** |

## 2.2 状態所有権 / データフロー

```
[Google Form 回答]
      │ (cron sync /15min)
      ▼
sync-forms-responses.ts
  ├─ setConsentSnapshot()          → member_status.public_consent
  └─ if flagEnabled:               → decidePublishState()
       member_only + consented ⇒ public  (updated_by='system:sync')
      │
      ▼
member_status.publish_state  ──(既存 record は未昇格)──► backfill apply
      │                                                     (runBackfillPublishState)
      ▼
repository/publicMembers.ts (_shared/public-filter.ts): WHERE public_consent='consented' AND publish_state='public' AND is_deleted=0
      │
      ▼
GET /public/members → apps/web /members 表示
```

- **状態所有権**: `publish_state` の正本は D1 `member_status`。書き込み主体は (1) sync job（flag 有効時）(2) backfill endpoint (3) admin UI。本タスクは (1)(2) を runtime で発火させる。
- **flag の所有権**: `wrangler.toml` の env var が正本。`getEnv()`/sync job が読み取り。

## 2.3 因果ループ

- **強化ループ（価値）**: flag ON → consent 済が public 昇格 → `/members` 可視増 → 会員価値向上。
- **バランスループ（安全）**: 本番 mutation リスク → dry-run + approval marker + admin override 保護（`decidePublishState` が hidden / 非 system updated_by を上書きしない）→ 段階 rollout（staging→production）→ 影響限定。

## 2.4 SubAgent lane / validation path（仕様書作成時のオーケストレーション）

- 設計 lane（Phase 1-3）: 直列（本 Phase で完了）。
- 仕様書 lane（Phase 4-13）: 3 並列以下。
  - lane 1: Phase 4-6（データ契約 / 実装ガイド / テスト戦略）。
  - lane 2: Phase 7-10（品質ゲート / DoD / リスク / ローカル検証）。
  - lane 3: Phase 11 + Phase 12 strict 7 + Phase 13。
- validation lane: 直列で締め（`validate-phase-output.js` / `verify:phase12-compliance` / gate-metadata）。

## 2.5 runtime ops の責務境界

| 区分 | 実行サイクル | 承認 |
|------|------------|------|
| `wrangler.toml` flag 変更（Task A） | 実装サイクル `03.実装.md` 内 | commit/push は user-gated |
| staging deploy/backfill/smoke（Task B） | user-gated runtime ops | 実行ごとに承認・approval marker |
| production deploy/backfill/smoke（Task C） | user-gated runtime ops | staging evidence + 承認後のみ |

> verify fail 後の意思決定権: backfill dry-run の件数が想定外（staging 実績比で大きく乖離）の場合、apply を中止しユーザーへエスカレーションする（自動 apply しない）。

## メタ情報

| 項目 | 値 |
|------|-----|
| Phase | 2（設計） |
| 実装区分 | 実装仕様書 |
| 新規モジュール | なし（既存再利用 + config 1 行） |

## 目的

既存コンポーネントの再利用範囲、状態所有権、因果ループ、runtime ops の責務境界を設計として固定する。

## 実行タスク

1. 既存コンポーネント再利用可否を判定する（新規実装ゼロ）。
2. publish_state の状態所有権とデータフローを図示する。
3. runtime ops（Task A/B/C）の実行サイクルと承認境界を定義する。

## 参照資料

- `apps/api/src/jobs/sync-forms-responses.ts`
- `apps/api/src/routes/admin/sync-backfill-publish-state.ts`
- `apps/api/src/_shared/public-filter.ts`

## 成果物

- 本 `phase-02-architecture.md`（再利用表・データフロー・責務境界）。

## 完了条件

- [ ] 既存再利用可否が表で示されている。
- [ ] データフローと状態所有権が図示されている。
- [ ] runtime ops の承認境界が定義されている。

## 統合テスト連携

データフロー（sync → publish_state → 公開フィルタ → `/members`）の結合点はすべて既存。Phase 11 で staging→production の end-to-end smoke を user-gated で実行し結合を検証する。
