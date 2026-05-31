# Phase 01 — 要件定義: cron schedule free-tier 回帰ガード

## メタ情報

| 項目 | 値 |
|------|-----|
| workflow 名 | `issue-264-cron-schedule-free-tier-guard` |
| 由来 | GitHub Issue #264（**CLOSED のまま**・GitHub mutation 禁止） |
| 親 issue | #50（UT-01） |
| 実装区分 | **実装仕様書（implementation spec）** |
| taskType | `implementation` |
| visualEvidence | `NON_VISUAL` |
| workflow_state | `implemented_local_evidence_captured` |
| base_branch | `dev` |
| free-tier 制約 | 依存追加 0 / paid Cloudflare 機能なし / 本サイクルで runtime deploy なし |

---

## 実装区分の判定根拠（CONST_004）

**実装区分: 実装仕様書**

CONST_004 に従い判定する。原 issue #264 は「staging で 24h 実測して ADR を書く」という一見 docs 寄りの調査タスクだった。しかし最新コード確認の結果、その前提（Sheets→D1 同期を 6h/1h/5min で実測）は**陳腐化(obsolete)**しており、現行 Forms ベース構成に最適化した**根本解決**には、デプロイ済み 3-cron スケジュールを固定する**新規 guard test（コード実装）が必要**と判断した。

すなわち本タスクの成果物の中核は `apps/api/src/sync/wrangler-cron-schedule.guard.spec.ts` という**新規テストコード**であり、docs（ADR/無料枠予算）はその補助である。コード実装を伴うため**実装仕様書**として作成する。

---

## 目的

デプロイ済みの 3 本の cron スケジュール

```
["0 18 * * *", "*/15 * * * *", "*/5 * * * *"]
```

を **Cloudflare free-plan の account cron 上限（env あたり 3 本）に収まる正本**として固定し、
4 本目の追加や legacy `0 * * * *`（Sheets hourly）の再混入によって **free-plan デプロイが静かに壊れる**ことを、CI のテストで自動検知できるようにする。

あわせて、現行 Forms ベース構成における cron→ジョブ対応と無料枠予算を**正本 ADR / 解析的予算表**として整備し、24h 実測なしに「無料の範囲内である」ことを裏付ける。

---

## 再スコープ根拠（obsolete 判定）

原 issue #264 の前提と最新コードの乖離を以下に整理する。

| 原 issue #264 の前提 | 最新コードの実態 | 判定 |
|----------------------|------------------|------|
| Sheets→D1 同期の cron を実測する | 同期は Google Sheets→**Forms API へ完全移行**（`apps/api/src/jobs/sync-forms-responses.ts`, `index.ts:477-481`） | 前提崩壊 |
| 既定 `0 */6 * * *`（6h）を採用 | wrangler.toml に**未デプロイ**（採用されず） | obsolete |
| Sheets hourly `0 * * * *`（1h）を採用 | **手動限定に撤回**（cron 非登録, `index.ts:539`, `wrangler.toml` L85-91 コメント） | obsolete |
| `5min` 段を実測 | デプロイ済み cron は**確定済み 3 本** `["0 18 * * *", "*/15 * * * *", "*/5 * * * *"]`（`wrangler.toml` L14/91/173, 3 セクション一致） | 確定済み |
| 24h 実測で間隔を決める | 間隔決定理由は **Cloudflare free-plan の account cron 上限 3 本**への統合（`deployment-cloudflare.md` L85-89/269） | 解析で確定 |
| quota 競合懸念 | `*/5` は外部 API 非依存の D1-only tick（`runTagQueueRetryTick` + `runNotificationDispatchTick`）で**解消済み** | 解消済み |

**結論**: 原 issue の「Sheets を 6h/1h/5min で 24h 実測」タスクは**不要(obsolete)**。
一方で、確定済み 3-cron 間隔を守る**回帰ガード(テスト)が未存在**であり、現行 Forms ベース構成の**正本 ADR / 無料枠予算も未整備**。4 本目追加や legacy `0 * * * *` 再混入で free-plan デプロイが静かに壊れるまで検知不能。
→ 本ワークフローを「**デプロイ済み 3-cron スケジュールの free-tier 回帰ガード（新規 spec test）+ ADR / 無料枠予算**」へ再定義する。

---

## デプロイ済み cron → ジョブ対応（参考）

| cron | 頻度/日 | JST | 起動ジョブ | 外部 API |
|------|---------|-----|-----------|----------|
| `0 18 * * *` | 1 | 03:00 | `runSchemaSync`(Forms batchGet) + `runRetentionPurge` + `runAlertRelayHealthcheck` | Forms API ×1/日 |
| `*/15 * * * *` | 96 | — | `runResponseSync`(Forms responses.list, cursor high-water, 200 write cap) + `runSheetsAuthHealthcheck` + `scheduledAuditCorrelation`(条件付) | Forms API ≤96/日, D1 write ≤200×96=19,200/日 < 100k/日 |
| `*/5 * * * *` | 288 | — | `runTagQueueRetryTick` + `runNotificationDispatchTick`(条件付) | D1-only |
| `0 * * * *` (legacy Sheets) | — | — | `runScheduledSync`(`apps/api/src/sync/scheduled.ts`) | **手動限定・cron 非登録・guard が登録禁止を強制** |

合計 cron 起動 ≈ **385/日 ≪ free Workers 100k req/日**。env あたり cron 数 = **3 = free-plan 上限（余裕 0 本）**。

---

## 機能要件（FR）

### FR-1: `extractCrons` 純粋関数の実装
`apps/api/src/sync/wrangler-cron-schedule.guard.spec.ts` から export する純粋関数を実装する。
- シグネチャ: `extractCrons(tomlText: string, sectionHeader: string): string[]`
- `[header]` 直後〜次の `[` までの範囲から `crons = [ ... ]` の配列要素を抽出して返す。
- **依存追加せず regex で抽出**（TOML ライブラリ追加禁止＝free/minimal、NFR-1）。
- クォート除去・コメント行除外・section 不在時は空配列を返す（エッジケースは phase-02 で定義）。

### FR-2: assertion (a) — 3 セクション deepEqual CANONICAL
`top-level` / `staging` / `production` の 3 セクション各々の crons が
`CANONICAL = ["0 18 * * *", "*/15 * * * *", "*/5 * * * *"]` と **deepEqual**（順序込み一致）であることを assert する。

### FR-3: assertion (b) — 各セクション length ≤ 3（free-plan 上限）
各セクションの crons 配列長が **3 以下**であることを assert する。4 本目追加を検知する。

### FR-4: assertion (c) — legacy `"0 * * * *"` を含まない
どのセクションの crons にも `"0 * * * *"`（legacy Sheets hourly）を**含まない**ことを assert する。手動限定方針の cron 再混入を検知する。

### FR-5: assertion (d) — parity（top === staging === production）
3 セクションの crons が**相互に一致**することを assert する。env 間で drift しないことを保証する。

### FR-6: ADR / 無料枠予算文書
workflow outputs に、(i) **ADR**「3-cron schedule を free-plan 上限として固定する決定」(背景/決定/根拠/代替案却下/影響) と、(ii) **無料枠予算表**（各 cron 頻度 × API/D1 コスト × free 枠距離の解析的表）を記載する。**24h 実測は不要**（解析的に成立、理由は phase-02 で明記）。

---

## 非機能要件（NFR）

| ID | 要件 |
|----|------|
| NFR-1 | **zero-dep**: 新規 npm 依存を追加しない。TOML パースは regex で行う（free/minimal）。 |
| NFR-2 | **free-tier**: paid Cloudflare 機能を使わない。本サイクルで runtime deploy を行わない。テストは `node:fs` でローカル wrangler.toml を読むのみ。 |
| NFR-3 | **実行時間**: テストは I/O 1 回（wrangler.toml 読み込み）+ regex のみで、ミリ秒オーダーで完了する。 |
| NFR-4 | **可読性**: `extractCrons` は純粋関数として export し、入力 toml 文字列に対する単体テストで挙動を固定する。CANONICAL は単一定数で定義する。 |
| NFR-5 | **不変条件遵守**: 新規テストは `*.spec.ts` のみ（不変条件 #8）。D1 直接アクセスは `apps/api` のみ（#5）。enum 整合(#266): `SyncLogStatus=running\|success\|failed\|skipped`, `SyncTriggerType=cron\|admin\|backfill`。 |

---

## スコープ境界

### 含む
- 新規 guard test `apps/api/src/sync/wrangler-cron-schedule.guard.spec.ts`（FR-1..FR-5）。
- ADR / 無料枠予算表（FR-6, workflow outputs）。

### 含まない
- **wrangler.toml の cron 値変更**（既に正しい。3 セクション一致済み）。
- **24h staging 実測**（obsolete。解析で代替）。
- **Sheets コード削除**（別タスク。legacy `runScheduledSync` は手動限定として温存）。
- runtime deploy / paid 機能 / 依存追加。

---

## 参照

- `CLAUDE.md` #5（D1 直接アクセスは `apps/api` のみ）/ #8（`*.spec.ts` のみ）
- `docs/00-getting-started-manual/specs/deployment-cloudflare.md` L85-89, L171, L259-269
- enum 整合: issue #266
