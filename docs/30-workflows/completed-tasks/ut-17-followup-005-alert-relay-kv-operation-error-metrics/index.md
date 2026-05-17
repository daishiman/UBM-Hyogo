# ut-17-followup-005-alert-relay-kv-operation-error-metrics - タスク仕様書 index

[実装区分: 実装仕様書]

> **実装区分判定根拠**: `apps/api/src/routes/internal/alert-relay.ts` への構造化ログヘルパ実装・`KV.get` への try/catch 追加（現状未保護）・`KV.put` の `console.warn` 非構造化ログを構造化 JSON に置換・isolateId 採番・dedupeKeyHash 算出・新規テストケース追加（`alert-relay.spec.ts` 拡張）・runbook 追記を伴うコード実装タスク。設計単独では完結しない。

## メタ情報

| 項目 | 値 |
| --- | --- |
| ID | UT-17-FU-005 |
| タスク名 | alert-relay KV 操作エラーの observability 計測 |
| ディレクトリ | docs/30-workflows/ut-17-followup-005-alert-relay-kv-operation-error-metrics |
| 親タスク | UT-17 (`docs/30-workflows/ut-17-cloudflare-analytics-alerts/`) |
| 先行タスク | UT-17-FU-002 (`docs/30-workflows/completed-tasks/ut-17-followup-002-alert-relay-dedup-kv/`) |
| 原典 | docs/30-workflows/unassigned-task/ut-17-followup-005-alert-relay-kv-operation-error-metrics.md |
| 作成日 | 2026-05-16 |
| 担当 | delivery |
| 状態 | implemented_local_evidence_captured |
| タスク種別 | implementation / NON_VISUAL |
| visualEvidence | NON_VISUAL |
| 優先度 | LOW |
| GitHub Issue | #701 (OPEN) |

## 目的

`apps/api/src/routes/internal/alert-relay.ts` の Cloudflare KV (`ALERT_DEDUP_KV`) に対する `get` / `put` 操作失敗を、構造化 JSON ログとして `console.warn` 経由で emit し、後段 logpush / Workers Logs 検索で `event` 別・`op` 別の集計（dedup スキップ率 / KV 一時障害頻度）を取れる状態にする。既存の fail-closed / fail-open 挙動は維持し、観測可能性のみを追加する。

## スコープ

### 含む

- `apps/api/src/routes/internal/alert-relay.ts` への構造化ログヘルパ `logKvOperationError(op, err, dedupeKey)` 追加（module-local）
- module top で `crypto.randomUUID()` による `isolateId` 1 回採番
- `dedupeKeyHash` 算出（`SHA-256` の先頭 12 hex chars）
- `KV.get` 呼び出しの try/catch 化（現状未保護、例外時に request 落下）と fail-open 化（log 出力 + 配信継続）
- `KV.put` 既存 catch ブロックの `console.warn` 非構造化ログを構造化 JSON 1 行 emit に置換
- 既存テスト `apps/api/src/routes/internal/__tests__/alert-relay.spec.ts` への追加ケース（`get` throw / `put` throw / 成功時 emit 0 / payload shape assertion）
- monthly healthcheck runbook (`docs/30-workflows/runbooks/ut-17-alert-relay-monthly-healthcheck.md`) への「KV 操作エラーログ確認」セクション追記
- ログ schema の field 定義表（runbook 内）

### 含まない

- Cloudflare Dashboard / Analytics Engine 連携（UT-17-FU-004 領域）
- Workers Logpush 設定（別タスク）
- Slack / PagerDuty への自動通知ルート追加
- KV 失敗時の retry / 二重書き戦略の変更
- D1 / Durable Object への dedup ストア移行検討
- `apps/api/wrangler.toml` / `apps/api/src/env.ts` の変更（既存 `ALERT_DEDUP_KV` binding を流用）

## 主要な参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/unassigned-task/ut-17-followup-005-alert-relay-kv-operation-error-metrics.md | 原典タスク（本仕様書で具体化する元） |
| 必須 | docs/30-workflows/completed-tasks/ut-17-followup-002-alert-relay-dedup-kv-persistence.md | 親 followup（KV 永続化導入元） |
| 必須 | apps/api/src/routes/internal/alert-relay.ts | 実装対象本体 |
| 必須 | apps/api/src/routes/internal/__tests__/alert-relay.spec.ts | テスト拡張対象 |
| 必須 | docs/30-workflows/runbooks/ut-17-alert-relay-monthly-healthcheck.md | runbook 追記対象 |
| 必須 | CLAUDE.md | 不変条件（`*.spec.ts` 縛り、`scripts/cf.sh` 利用、平文 secret 禁止） |
| 参考 | https://developers.cloudflare.com/workers/observability/logs/workers-logs/ | Workers Logs / `console.warn` 経路 |
| 参考 | https://developers.cloudflare.com/kv/api/ | KV API（eventual consistency） |

## 受入条件 (AC)

- **AC-1**: `KV.get` 例外時に **構造化ログ 1 行** が `console.warn` で emit される（fail-open は維持し Slack 配信は継続する）。
- **AC-2**: `KV.put` 例外時に **構造化ログ 1 行** が `console.warn` で emit される（既存の `dedupPersisted=false` レスポンスは維持）。
- **AC-3**: ログ schema は固定: `{ event: "alert_relay_kv_op_failed", op: "get"|"put", errorClass: string, dedupeKeyHash: string, isolateId: string, ts: string }`。`JSON.stringify` で 1 行に整形される。hash 生成自体が失敗した場合のみ `dedupeKeyHash="hash_error"` とし、ログ helper は再 throw しない。
- **AC-4**: `dedupeKeyHash` は `SHA-256(dedupeKey)` の先頭 12 hex chars。同一 key に対し決定的に同じ hash になる。
- **AC-5**: `isolateId` は module top で `crypto.randomUUID()` により 1 isolate あたり 1 回採番される（emit ごとには採番しない）。
- **AC-6**: 成功パス（`get` 命中なし → `put` 成功）では `console.warn` が 0 回呼ばれる（false positive 防止）。
- **AC-7**: 既存の挙動（dedup hit 時 `{ ok: true, deduped: true }`、Slack 失敗時 502、put 失敗時 `{ ok: true, attempts, dedupPersisted: false }`）は変更されない。
- **AC-8**: `mise exec -- pnpm --filter @ubm-hyogo/api test -- alert-relay` / `mise exec -- pnpm --filter @ubm-hyogo/api typecheck` / `mise exec -- pnpm --filter @ubm-hyogo/api lint` / `mise exec -- pnpm --filter @ubm-hyogo/api build` が PASS する。
- **AC-9**: monthly runbook に「KV 操作エラーログ確認手順」セクションが追記され、`scripts/cf.sh tail ... | grep alert_relay_kv_op_failed` の検索例と field 定義表が記載されている。
- **AC-10**: 新規/変更テストは `*.spec.ts` 拡張子のみ（CLAUDE.md 不変条件 8）。

## Phase 一覧

| Phase | 名称 | ファイル | 状態 | 主成果物 |
| --- | --- | --- | --- | --- |
| 1 | 要件定義 | phase-01.md | completed | outputs/phase-01/requirements.md |
| 2 | 設計 | phase-02.md | completed | outputs/phase-02/{log-schema,helper-design,emit-points,isolate-id-strategy}.md |
| 3 | 設計レビュー | phase-03.md | completed | outputs/phase-03/design-review.md |
| 4 | タスク分解 | phase-04.md | completed | outputs/phase-04/{task-breakdown,critical-path}.md |
| 5 | 実装計画 | phase-05.md | completed | outputs/phase-05/implementation-plan.md |
| 6 | 実装手順 | phase-06.md | completed | outputs/phase-06/implementation-steps.md |
| 7 | テスト計画 | phase-07.md | completed | outputs/phase-07/test-plan.md |
| 8 | ドキュメント更新 | phase-08.md | completed | outputs/phase-08/docs-updates.md |
| 9 | 受入確認 | phase-09.md | completed | outputs/phase-09/acceptance.md |
| 10 | リファクタ | phase-10.md | completed | outputs/phase-10/refactor-summary.md |
| 11 | NON_VISUAL evidence | phase-11.md | completed | outputs/phase-11/visual-verification-skip.md + evidence/*.txt |
| 12 | 正本同期 | phase-12.md | completed | outputs/phase-12/{main,implementation-guide,system-spec-update-summary,documentation-changelog,unassigned-task-detection,skill-feedback-report,phase12-task-spec-compliance-check}.md |
| 13 | PR・振り返り | phase-13.md | blocked | outputs/phase-13/pr-summary.md |

## 不変条件

1. **behaviour change なし**: ログ emit 追加のみ。既存 fail-open / fail-closed 経路は変えない。`KV.get` の throw を catch する変更は fail-open 化を伴うが、これは「観測不能な fail-closed → 観測可能な fail-open」への明示的な改善であり、Phase 2 で意思決定として固定する。
2. **`*.spec.ts` 縛り**: 新規テストは `__tests__/alert-relay.spec.ts` に追加する。`*.test.ts` 新規作成禁止（CLAUDE.md 不変条件 8）。
3. **D1 直接アクセス境界**: 本タスクで D1 binding は使用しない。
4. **`wrangler` 直接禁止**: deploy / secret は `bash scripts/cf.sh` 経由のみ。本タスクでは secret 追加なし。
5. **平文 secret 禁止**: 本タスクでは secret 追加なし。
6. **CONST_007 遵守**: 本サイクル内で Phase 1〜12 と local implementation を完了させる。Phase 13 の commit / push / PR は user-gated。
7. **ログ schema 安定化**: AC-3 の schema は後段 logpush / dashboard 契約の正本。field 追加は後方互換 (additive) のみ許容し、削除・rename は禁止。
8. **PII non-leak**: `dedupeKey` raw を出さず hash に短縮する。stack trace は emit しない（Workers Logs 1 行容量・PII 観点）。

## リスクと緩和策

| リスク | 緩和策 |
| --- | --- |
| `KV.get` を try/catch 化することで「KV 一時障害時に dedup 効かず Slack 重複配信」が増える | 元々 throw で request 全体が落ちていた現状より、fail-open の方が運用インパクト小と判断。重複配信は構造化ログ + 後段 dashboard で検出可能化（UT-17-FU-004 領域）。Phase 2 設計レビューで明示的に意思決定 |
| `console.warn` spy が test 間で leak | `beforeEach` で `vi.clearAllMocks()`、`afterEach` で `vi.restoreAllMocks()` を統一適用 |
| `crypto.subtle.digest` が同期 path に追加で重い | hash 算出は失敗時のみ実行（成功 hot path には乗らない）。`get`/`put` 失敗頻度は低いため negligible |
| dedupeKey 短縮 hash で衝突 | 12 hex = 48 bit 空間。policy_id × minute bucket × metric の組合せでは衝突確率 ≪ 1e-9。後段 dashboard 用途では実用上問題なし |
| Workers Logs プレーンテキスト混在で構造化検索しにくい | 1 行 JSON 固定で `JSON.parse` 可能、`grep alert_relay_kv_op_failed` で先絞り可能。logpush 設定（UT-17-FU-004）で完全構造化に昇格できる |
| `isolateId` を request ごとに採番してしまう実装ミス | Phase 2 で「module top で 1 回」を明文化、Phase 7 テストで「同一 isolate 内 2 emit が同じ `isolateId`」を assertion 化 |

## Phase マップ

```
phase-01 (要件定義)
  └─ outputs/phase-01/requirements.md
       │
       ▼
phase-02 (設計)
  ├─ outputs/phase-02/log-schema.md
  ├─ outputs/phase-02/helper-design.md
  ├─ outputs/phase-02/emit-points.md
  └─ outputs/phase-02/isolate-id-strategy.md
       │
       ▼
phase-03 (設計レビュー)
  └─ outputs/phase-03/design-review.md
       │
       ▼
phase-04〜12 (実装〜正本同期 / local complete 目標)
     │
     ▼
phase-13 (PR・振り返り / user approval gate)
```

## 注意点

- GitHub Issue #701 は OPEN。本 followup は親 UT-17-FU-002 が完了済み（completed-tasks 配下）であることを前提とする。
- 原典 unassigned task は test file path を `__tests__/alert-relay.test.ts` と記載しているが、CLAUDE.md 不変条件 8（`*.spec.ts` 縛り）に従い本仕様書では `alert-relay.spec.ts` を正本とする。Phase 2 設計でこの差分を明記する。
- 現コード `KV.get` には try/catch が存在しないため、原典の「既存 try/catch の catch ブロックに emit 追加」記述は実態と乖離する。本仕様書では try/catch 化と fail-open 化を Phase 2 設計で意思決定する。
- 本タスクは behaviour change を「ログ emit 追加 + `KV.get` を fail-closed throw から fail-open + log」に拡張する。Phase 3 design review で意思決定を承認する。
