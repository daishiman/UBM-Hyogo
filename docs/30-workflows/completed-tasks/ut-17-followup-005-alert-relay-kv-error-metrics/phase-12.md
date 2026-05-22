# Phase 12: 正本同期

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 12 / 13 |
| 名称 | 正本同期 |
| タスク | UT-17-FU-005 alert-relay KV 操作エラーの observability 計測（構造化ログ emit） |
| GitHub Issue | #701（CLOSED / completed marked / close時点では実コード未実装・本workflowでlocal実装済み） |
| 作成日 | 2026-05-16 |
| 担当 | delivery |
| 状態 | completed |
| タスク種別 | implementation / NON_VISUAL |
| 実装区分 | **実装仕様書** |
| 実装区分 判定根拠 | Phase 2-11 で設計・実装した `alert-relay.ts` の構造化ログ emit 追加、`alert-relay.spec.ts` テスト追加、monthly healthcheck runbook 追記の正本を、runbook 群 / unassigned-task index / aiworkflow-requirements skill（必要時）へ反映する Phase。UI を持たない NON_VISUAL 実装だが Phase 12 strict 7 outputs は省略しない。 |

---

## 目的

Phase 1〜11 で完成した「`apps/api` alert-relay KV 操作エラーの構造化ログ emit」実装と
runbook 追記を、システム仕様書群・skill 群・unassigned-task index に正本として引き継ぐ。

後段 logpush / Workers Logs フィルタの**契約**として `event: "alert_relay_kv_op_failed"` を
スキーマ固定文字列リテラルとして予約し、UT-17-FU-006（KV usage dashboard 化）に
渡せる状態にする。

---

## なぜ正本同期が必要か（中学生レベル）

「家のアラームが鳴らなかった理由を後から調べられるように、エラーが出た瞬間に
**決まった書式の日記**を残す」改修を入れた。

ただし、改修しただけだと半年後に「あれ、この `alert_relay_kv_op_failed` って
何の合言葉だっけ？ 名前を変えてもいいのかな？」と本人や別の開発者が混乱する。

Phase 12 では「**日記の書式と合言葉を、誰が見ても分かる正本ノートに書き写す作業**」を行う。

- runbook（取扱説明書）に「KV エラー日記の探し方」と grep コマンドを書く
- `event` の合言葉（`"alert_relay_kv_op_failed"`）は**後段の集計が参照する固定値**なので
  「将来勝手に書き換えない」と契約として明文化する
- unassigned-task の付箋を「次の dashboard 化（FU-006）の入口」として残す

---

## 必須 outputs（7 ファイル）

| # | output | 出力先 |
| --- | --- | --- |
| 1 | main.md | `outputs/phase-12/main.md` |
| 2 | implementation-guide.md | `outputs/phase-12/implementation-guide.md` |
| 3 | phase12-task-spec-compliance-check.md | `outputs/phase-12/phase12-task-spec-compliance-check.md` |
| 4 | system-spec-update-summary.md | `outputs/phase-12/system-spec-update-summary.md` |
| 5 | skill-feedback-report.md | `outputs/phase-12/skill-feedback-report.md` |
| 6 | unassigned-task-detection.md | `outputs/phase-12/unassigned-task-detection.md` |
| 7 | documentation-changelog.md | `outputs/phase-12/documentation-changelog.md` |

---

## 12-1. implementation-guide.md（要点 / Phase 13 PR 本文に直接転記）

詳細は `outputs/phase-12/implementation-guide.md` を参照。

### Part 1 — 技術契約（schema 固定）

| 項目 | 契約 |
| --- | --- |
| 構造化ログ schema | `{ event: "alert_relay_kv_op_failed", op: "get" \| "put", errorClass: string, dedupeKeyHash: string, isolateId: string, ts: string }` |
| `event` 文字列 | `"alert_relay_kv_op_failed"` 固定（後段 logpush filter 契約） |
| `op` 列挙 | `"get"` または `"put"` の 2 値のみ |
| `errorClass` | `err instanceof Error ? err.constructor.name : typeof err` 形式の文字列 |
| `dedupeKeyHash` | SHA-256 hash の first 12 hex chars（lowercase）。raw `dedupeKey` はログに出さない |
| `isolateId` | `crypto.randomUUID()` を module top で 1 回採番、handler 内で再採番しない |
| `ts` | `new Date().toISOString()` の RFC3339 形式 |
| 出力経路 | `console.warn(JSON.stringify(payload))` の 1 行 JSON 出力 |

### Part 2 — 変更ファイル一覧

| 種別 | パス | 役割 |
| --- | --- | --- |
| 編集 | `apps/api/src/routes/internal/alert-relay.ts` | module top で `isolateId` 採番、private helper `logKvOperationError` / `sha256Hex12` 追加、`KV.get` を try/catch で包み fail-open 化、`KV.put` catch を helper 呼び出しに置換 |
| 編集 | `apps/api/src/routes/internal/__tests__/alert-relay.spec.ts` | KV.get throw / KV.put throw / 成功パスでの emit assertion を 4 ケース追加、`afterEach(() => vi.restoreAllMocks())` 追加 |
| 編集 | `docs/30-workflows/runbooks/ut-17-alert-relay-monthly-healthcheck.md` | 「KV 操作エラーログの確認」セクションを追加（grep 例 / しきい値 / schema 表） |

### Part 3 — behaviour change（意図的変更）

| 観点 | 改修前 | 改修後 |
| --- | --- | --- |
| `KV.get(dedupeKey)` 失敗時 | try/catch 無し → 例外が handler まで伝播し 500 / unhandled | try/catch で囲い `logKvOperationError('get', err, dedupeKey)` 呼び出し後、`seen = null` 相当として通常処理を継続（**fail-open**） |
| `KV.put(...)` 失敗時 | 既存 catch 内で plain object を `console.warn` していた | 既存 catch 内を `await logKvOperationError('put', err, dedupeKey)` 呼び出しに置換。レスポンス（`dedupPersisted: false`）は不変 |
| Slack 配信路 | 不変 | 不変 |
| dedupe TTL | 不変 | 不変 |
| レスポンス body / status code | 不変 | 不変（`get` failure path は元々 unhandled 500 だったため、fail-open 化後は通常成功路と同じ 200 系を返す） |

### Part 4 — 主要関数シグネチャ

```ts
// apps/api/src/routes/internal/alert-relay.ts（module top）
const isolateId = crypto.randomUUID();

async function sha256Hex12(input: string): Promise<string>;

async function logKvOperationError(
  op: "get" | "put",
  err: unknown,
  dedupeKey: string,
): Promise<void>;
```

### Part 5 — 検証コマンド

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm --filter @ubm-hyogo/api test
```

`@ubm-hyogo/api` は `apps/api/package.json` の実パッケージ名に一致する。

### Part 6 — DoD（Definition of Done）

- [x] AC-1〜AC-10 が `outputs/phase-09/acceptance.md` で OK 判定
- [x] `mise exec -- pnpm typecheck` PASS
- [x] `mise exec -- pnpm lint` PASS
- [x] `mise exec -- pnpm --filter @ubm-hyogo/api test` PASS
- [x] `console.warn` spy が後続テストに leak しない（`vi.restoreAllMocks()` で抑止）
- [x] `apps/web/` 配下に変更なし
- [x] D1 / Google Form schema / Slack 配信路に変更なし

---

## 12-2. system-spec-update-summary.md（要点）

詳細は `outputs/phase-12/system-spec-update-summary.md` を参照。

| Step | 対象 | 内容 |
| --- | --- | --- |
| Step 1-A | 完了タスク記録 | `docs/30-workflows/unassigned-task/ut-17-followup-005-*.md` を `completed-tasks/` 配下へ移動（外部 deploy 完了後）|
| Step 1-B | 実装状況 | `implemented_local_evidence_captured` / `implementation_complete_pending_pr`。external deploy と PR merge 後に `completed` |
| Step 1-C | 関連タスク | UT-17 親 / followup-001/002/003/004 は本タスクと独立。followup-006（dashboard 化）が本タスクの emit を入力に取る後続関係 |
| Step 2 | 後段契約予約 | `event: "alert_relay_kv_op_failed"` を logpush filter / Workers Logs 集計の固定文字列契約として記録。改名は互換性 break を伴うため、UT-17-FU-006 以降での命名変更は事前に follow-up issue を立てる |
| Step 3 | behaviour change 記録 | `KV.get` 失敗時の従来 unhandled → fail-open 化を意図的な挙動変更として記録 |

---

## 12-3. unassigned-task-detection.md（要点）

詳細は `outputs/phase-12/unassigned-task-detection.md` を参照。

- 本サイクルで新たに発見した unassigned task: **UT-17-FU-006**（KV usage dashboard / `event: alert_relay_kv_op_failed` を集計する dashboard 化）
- 親 UT-17 / followup-001/002/003/004 との独立性確認: 本タスクは FU-002 (`ALERT_DEDUP_KV` 永続化) の後続であり、FU-006 の前段。FU-001/003/004 とは完全独立
- Issue #701 の扱い: state=closed のまま、本仕様書での実装完了を以て documentation 上 `completed` 化

---

## 12-4. skill-feedback-report.md（要点）

詳細は `outputs/phase-12/skill-feedback-report.md` を参照。

- aiworkflow-requirements skill / task-specification-creator skill への変更は **本タスクスコープ外**（contract 予約のみで skill structural change なし）
- 運用ノートとして「`event` field 固定文字列契約」のような後段集計の前提となる文字列リテラルは
  `unassigned-task/` 原典側に明記済みのため、skill references への二重記載はしない

---

## 12-5. documentation-changelog.md（要点）

詳細は `outputs/phase-12/documentation-changelog.md` を参照。

| ドキュメント | 変更内容 |
| --- | --- |
| `docs/30-workflows/runbooks/ut-17-alert-relay-monthly-healthcheck.md` | 「KV 操作エラーログの確認」セクション追加。grep 例 / 直近 1 時間で 10 件超のしきい値 / schema 表（field 名・型・例値）を含む |
| `docs/30-workflows/ut-17-followup-005-alert-relay-kv-error-metrics/` 配下 | phase-01〜13 / outputs/* の Phase 1-13 仕様書群を新規作成 |

---

## 12-6. phase12-task-spec-compliance-check.md（要点）

詳細は `outputs/phase-12/phase12-task-spec-compliance-check.md` を参照。

strict 7 outputs / 中学生レベル概念説明 / Phase 12 canonical heading / artifacts.json 整合の
4 観点で全 PASS を確認する compliance チェック表を保持する。

---

## 完了条件

- [x] strict 7 outputs が `outputs/phase-12/` に配置されている
- [x] `implementation-guide.md` に技術契約 / 変更ファイル / behaviour change / シグネチャ / 検証 / DoD が揃っている
- [x] `system-spec-update-summary.md` に Step 1-A〜3 と「`event` 文字列契約予約」が明記されている
- [x] `unassigned-task-detection.md` に UT-17-FU-006 への引き継ぎが記録されている
- [x] `documentation-changelog.md` に runbook 追記内容が記録されている
- [x] artifacts.json / outputs/artifacts.json が parsable JSON で整合している

---

## 次 Phase 引き継ぎ事項

- 次 Phase: Phase 13 (PR・振り返り)
- 引き継ぎ:
  - `implementation-guide.md` Part 1〜6 → PR 本文「変更ファイル / 技術契約 / behaviour change / 検証手順 / DoD」
  - `unassigned-task-detection.md` → PR 本文「post-merge アクション」 / FU-006 への引き継ぎ
  - `system-spec-update-summary.md` Step 2 → PR 本文「`event` 文字列契約予約」セクション
- ブロック条件: strict 7 outputs に欠落、または `apps/web` への変更混入が検出された場合は実行しない

---

## 参照

- `docs/30-workflows/unassigned-task/ut-17-followup-005-alert-relay-kv-operation-error-metrics.md`（原典）
- `docs/30-workflows/ut-17-followup-003-alert-relay-healthcheck-cron/phase-12.md`（フォーマット参考）
- `docs/30-workflows/ut-17-followup-003-alert-relay-healthcheck-cron/outputs/phase-12/`（フォーマット参考）
- `.claude/skills/task-specification-creator/references/phase-12-spec.md`（strict 7 outputs ルール）

## 実行タスク

- Phase 12 strict 7 outputs、system spec sync、skill feedback、unassigned detection を完了する。

## 参照資料

- `.claude/skills/task-specification-creator/references/phase-12-spec.md`
- `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md`

## 成果物/実行手順

- `outputs/phase-12/` 配下の strict 7 files を正本成果物とする。
