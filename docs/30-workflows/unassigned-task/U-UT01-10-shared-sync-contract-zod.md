# U-UT01-10: shared sync 契約型 / Zod schema 化タスク

## メタ情報

| 項目 | 値 |
| --- | --- |
| ID | U-10 |
| タスク名 | shared sync 契約型（`SyncLogStatus` / `SyncTriggerType` / `SyncLogRecord`）の Zod schema 化 |
| 親タスク | UT-01 (Sheets→D1 同期方式定義) |
| 関連タスク | UT-09 (Sheets→D1 同期ジョブ実装) / UT-04 (D1 schema 設計) / U-7 (`sync_log` 物理名整合) / U-8 (status / trigger enum 統一) / U-9 (retry / offset resume 統一) |
| 優先度 | MEDIUM |
| 起票日 | 2026-04-29 |
| 起票元 | `docs/30-workflows/ut-01-sheets-d1-sync-design/outputs/phase-12/unassigned-task-detection.md` (U-10) |
| 状態 | unassigned |
| taskType | docs-only-contract |
| visualEvidence | NON_VISUAL |
| 既存タスク組み込み | なし |
| 組み込み先 | - |

## 目的

`packages/shared` に sync 契約型（`SyncLogStatus` / `SyncTriggerType` / `SyncLogRecord`）の TypeScript 型と Zod schema を一意の正本として配置し、UT-04（D1 schema）と UT-09（同期ジョブ実装）が独立に enum 値や record 構造を再定義することによる契約ドリフトを構造的に封じる。`apps/api`（D1 書き込み）と `apps/web`（管理 UI 表示・admin queue 連携）が同一の runtime 検証経路で同期 record を扱える状態を作る。

## スコープ

### 含む

- `SyncLogStatus` Zod schema の設計（canonical 値は U-8 で確定済みの 4 値 = `pending` / `in_progress` / `completed` / `failed` を前提に literal union として定義する仕様）
- `SyncTriggerType` Zod schema の設計（canonical 値は U-8 で確定済みの 3 値 = `manual` / `cron` / `backfill` を前提に literal union として定義する仕様）
- `SyncLogRecord` Zod schema の設計（`outputs/phase-02/sync-log-schema.md` の 13 カラム = `id` / `trigger_type` / `status` / `started_at` / `finished_at` / `processed_offset` / `total_rows` / `error_code` / `error_message` / `retry_count` / `created_at` / `idempotency_key` / `lock_expires_at` の論理マッピング）
- `packages/shared/src/` 内の配置位置決定（既存パターン: `zod/` に schema、`types/` に型 export 経路を持つ。本タスクでは `zod/sync.ts` 新設 + `zod/index.ts` への re-export 経路を提案）
- `apps/api` / `apps/web` 双方からの import 経路の正規化方針（`@repo/shared` 直下 export を使い、深い path import を禁止する設計ルール）
- 型 ↔ runtime 整合の検証方針（`z.infer` 由来型と `SyncLogRecord` 型の構造的等価性を unit test で固定する手順）

### 含まない

- 実装本体（schema コード追加・export 経路コード変更・test 追加は別タスクで行う）
- U-7（`sync_log` 物理名 vs 既存 `sync_job_logs` / `sync_locks` 整合）の canonical 物理名決定本体
- U-8（status / trigger enum 統一）の canonical 値決定本体（本タスクは U-8 確定値を前提として schema 化する立場）
- U-9（retry 回数 / offset resume 方針統一）の canonical 値決定本体（`retry_count` 上限値・`processed_offset` 単位は U-9 で確定）
- D1 物理 DDL の発行・マイグレーション（UT-04 / UT-09 担当）
- API ルート / 管理 UI 側の consumer 実装

## 依存関係

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流 | U-7 (`sync_log` 物理名整合) | record の物理カラム名・物理テーブル名が確定しないと `SyncLogRecord` の field 命名（snake_case 維持 vs camelCase 変換）を決定できない |
| 上流 | U-8 (status / trigger enum 統一) | literal union の値集合が確定しないと Zod schema を書けない |
| 上流 | U-9 (retry / offset resume 統一) | `retry_count` の最大値制約・`processed_offset` の単位（行 vs chunk）が確定しないと schema の制約条件を確定できない |
| 上流 | UT-01 outputs/phase-02/sync-log-schema.md | 13 カラムの論理スキーマを契約化の入力として参照 |
| 下流 | UT-04 (D1 schema 設計) | 物理 DDL を本 schema に整合させる |
| 下流 | UT-09 (Sheets→D1 同期ジョブ実装) | jobs/sync-sheets-to-d1 が `SyncLogRecord` を import して runtime parse する |
| 下流 | `apps/web` 管理 UI（admin queue / 監視ダッシュボード相当） | 同期 record を表示する UI が共通 schema を参照 |

## 着手タイミング

> **着手前提**: U-7 / U-8 / U-9 の canonical 値が**確定してから**本タスクに着手する。これら 3 件が unassigned のまま schema 化を先行させると、確定後に schema を再書き換えする手戻りが発生する。

| 条件 | 理由 |
| --- | --- |
| U-8 完了（status 4 値 / trigger 3 値の canonical 確定） | literal union の値集合が固定されないと Zod schema が書けない |
| U-9 完了（retry 上限 / offset 単位の確定） | `z.number().int().nonnegative().max(N)` 等の制約条件が固定されないと schema を書けない |
| U-7 完了（物理名・カラム命名の確定） | record の field 命名規則（snake_case vs camelCase 変換層の有無）が固定されないと export 形が決まらない |

## 苦戦箇所【記入必須】

**1. shared 型未定義による UT-04 / UT-09 の独自定義ドリフト（具体ケース）**

`packages/shared` に `SyncLogStatus` / `SyncTriggerType` / `SyncLogRecord` が存在しない現状では、UT-04（D1 schema 設計）と UT-09（同期ジョブ実装）が**それぞれ独自に**型・enum を定義する流れになる。具体的に想定される drift は次の 3 ケース。

- **ケース A: status 値の表記揺れ** — UT-09 担当者が既存実装 `apps/api/src/jobs/sync-sheets-to-d1.ts` の `running|success|failed|skipped` をそのまま型化し、UT-04 担当者が UT-01 仕様 `pending|in_progress|completed|failed` で型化した場合、`apps/api` 内で 2 系統の status enum が併存し、`apps/web` 表示側がどちらに合わせるか不明瞭になる。
- **ケース B: trigger 値の正規化漏れ** — UT-09 が既存 `admin` を保持、UT-04 が `manual` で型化、`apps/web` が独自 enum で表示。3 箇所すべての等価性が壊れる。
- **ケース C: SyncLogRecord の field 命名規則のずれ** — UT-04 が D1 物理カラム名に合わせ snake_case (`started_at` / `processed_offset`) で型化、UT-09 が application 層で camelCase (`startedAt` / `processedOffset`) に変換、`apps/web` が API レスポンスを別 interface で受け取る。3 箇所のいずれかで field 名 typo が混入しても compile-time に検出できない。

これらは shared 契約型を Zod schema として一意定義し、`apps/api` の D1 read 経路と `apps/web` の API 受信経路の双方で `safeParse` を強制することで構造的に封じる。

**2. Zod schema と TypeScript 型の二重定義による drift**

Zod schema を書いて `z.infer<typeof SyncLogRecordSchema>` で型を導出する経路を取らず、`type SyncLogRecord = { ... }` を別に書くと、schema 側に field を追加して型を更新し忘れた瞬間に runtime ↔ type の整合が崩れる。本タスクの schema 設計では `z.infer` 経路を強制し、独立した `type` 宣言を**禁止**する設計ルールを明記する。

**3. 既存 `packages/shared/src/zod/` 配置パターンとの整合**

既存 `zod/` 配下は `primitives` / `field` / `schema` / `response` / `identity` / `viewmodel` を `index.ts` から re-export する構成。`sync` を追加する場合、命名（`sync` か `sync-log` か）と test 配置（`viewmodel.test.ts` 同様の併設 unit test）を既存パターンに合わせないと leaning 違反となる。

## リスクと対策

| リスク | 影響 | 対策 |
| --- | --- | --- |
| U-8 / U-9 確定前に schema 化を先行し、確定後の値集合と乖離 | schema の手戻り・UT-04/UT-09 への二重通達 | 「着手タイミング」節で U-7 / U-8 / U-9 完了を着手 gate として明記。本タスクの完了条件にも依存 task の closed 状態を含める |
| `z.infer` 経由型と独立 `type` 宣言の併存 | runtime ↔ type drift の温床 | schema 設計章で `z.infer` 強制 + 独立 `type` 宣言禁止を設計ルールとして明記 |
| `apps/web` から `apps/api` の deep import を許す | shared 契約を経由しないドリフト経路が残る | 本タスクの設計ルール章で `@repo/shared` 経由のみ許容、`apps/api/**` への直接 import を ESLint で禁止する方針を後続タスク（実装担当）への申し送りとして残す |
| Zod schema による runtime parse の overhead | sync ジョブのホットパスで latency 増 | `safeParse` は境界（D1 read 直後 / API 入力受信時）でのみ実施し、内部関数間では `z.infer` 由来型での pass-through を許容する方針を schema doc に記載 |
| field 命名規則の snake_case / camelCase 揺れ | `apps/web` 表示時の typo を compile-time 検出できない | U-7 確定後に「物理層 = snake_case / application 層 = camelCase + 変換層を shared に置く」か「全層 snake_case 統一」のいずれかを schema doc に決定として記載 |

## 検証方法

| 観点 | 方法 |
| --- | --- |
| 型 export 経路 | `packages/shared/src/zod/index.ts` から `SyncLogStatus` / `SyncTriggerType` / `SyncLogRecord` schema が re-export されていること、および `@repo/shared` 直下から import 可能であることを `pnpm typecheck` 通過と import 経路の grep で確認する設計を仕様書化する |
| runtime Zod parse | D1 read 直後の record に対し `SyncLogRecordSchema.safeParse(row)` が success を返すケース（13 カラム揃い）と failure を返すケース（status に未定義値、retry_count に負数、idempotency_key 欠落）を unit test で固定する手順を仕様書化する |
| 型 ↔ runtime 整合 | `z.infer<typeof SyncLogRecordSchema>` が `SyncLogRecord` 型と構造的等価であることを `expectTypeOf` 系 assertion（`vitest` の `expectTypeOf` または `tsd`）で固定する手順を仕様書化する |
| API ↔ web 共有テスト | `apps/api` の `/admin/sync/logs` 相当エンドポイントが返す JSON を `apps/web` 側で `SyncLogRecordSchema.safeParse` する contract test を `int-test-skill` 経由で実装する方針を後続実装タスクへの申し送りとして残す |
| canonical 値整合 | `SyncLogStatus` の literal union 値集合が U-8 確定値と一致、`SyncTriggerType` が U-8 確定値と一致、`retry_count` の制約が U-9 確定値と一致することを schema 設計レビューで確認する |

## 受入条件

- [ ] U-7 / U-8 / U-9 が completed-tasks 化されたことを着手前 gate として確認した記録が本仕様書に追記されている
- [ ] `SyncLogStatus` / `SyncTriggerType` / `SyncLogRecord` の 3 種について、Zod schema 設計（literal union 値集合・field 型・null 許容・制約条件）が本仕様書または outputs/ 配下の design doc として明文化されている
- [ ] `packages/shared/src/zod/` 配下の配置位置（ファイル名・既存 `index.ts` への re-export 行）が決定され、設計 doc に記載されている
- [ ] `z.infer` 由来型と TypeScript 型の構造的等価性を保証するテスト方針（`expectTypeOf` 等）と、`apps/api` D1 read / `apps/web` API 受信の境界で `safeParse` を強制する設計ルールが明記されている
- [ ] U-8 で確定する `SyncLogStatus` 4 値 / `SyncTriggerType` 3 値、U-9 で確定する `retry_count` 上限・`processed_offset` 単位、U-7 で確定する物理カラム命名規則が schema にどう反映されるかの対応表が記載されている

## 実行概要

- U-7 / U-8 / U-9 の canonical 値確定状態を確認し、未確定なら本タスクは着手 gate で待機する
- `packages/shared/src/zod/` の既存パターンを Read して `sync` ファイル新設の命名・test 併設方針を決定する
- `outputs/phase-02/sync-log-schema.md` の 13 カラムを Zod schema に 1:1 写像し、null 許容・既定値・制約を `z.string().min(1)` / `z.number().int().nonnegative()` / `z.literal()` の組み合わせで設計する
- `z.infer` 経由型 export と `index.ts` re-export 行を設計 doc 化する
- `apps/api` / `apps/web` 双方の境界 `safeParse` 強制ルールと深い path import 禁止を設計ルールとして記載する
- 設計レビュー後、実装着手は別タスク（実装フェーズ）として切り出す

## 完了条件

- [ ] 受入条件 5 件すべてに対応する記述が本仕様書または outputs/ 配下の design doc に揃っている
- [ ] UT-04 / UT-09 / `apps/web` の 3 経路が同一 schema を参照する設計が確定している
- [ ] 実装着手前の依存 gate（U-7 / U-8 / U-9 完了）が運用上守られる体制（仕様書冒頭の着手タイミング節）が文書化されている

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | `docs/30-workflows/unassigned-task/UT-01-sheets-d1-sync-design.md` | 親タスクの設計コンテキスト |
| 必須 | `docs/30-workflows/ut-01-sheets-d1-sync-design/outputs/phase-02/sync-log-schema.md` | 13 カラム論理スキーマ（schema 化の入力） |
| 必須 | `docs/30-workflows/ut-01-sheets-d1-sync-design/outputs/phase-12/unassigned-task-detection.md` | U-7 / U-8 / U-9 / U-10 の検出コンテキスト |
| 必須 | `packages/shared/src/zod/index.ts` および `packages/shared/src/zod/*.ts` | 既存 Zod 配置パターン（命名・re-export 形）の模倣元 |
| 必須 | `docs/30-workflows/completed-tasks/01b-parallel-zod-view-models-and-google-forms-api-client/index.md` | 既存 Zod 採用パターンの先行事例 |
| 参考 | `.claude/skills/aiworkflow-requirements/references/architecture-overview-core.md` | D1 / API route / packages/shared の責務境界 |
| 参考 | `.claude/skills/task-specification-creator/SKILL.md` | docs-only / NON_VISUAL 縮約テンプレ準拠 |

## 注意事項

- 本仕様書は **コード変更を伴わない docs-only タスク**である。schema 実装は別タスクで切り出す
- 本起票時点でのコミットは禁止（仕様書追加のみで PR 化は別判断）
- U-7 / U-8 / U-9 の canonical 値が決まる前に着手すると schema を書き直す手戻りが確実に発生するため、着手 gate を遵守すること
