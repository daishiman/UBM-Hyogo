# Phase 3: 設計レビュー

## 1. レビュー観点と判定

| 観点 | 判定 | コメント |
|---|---|---|
| 単一責務 | OK | 「履歴閲覧 UI 追加 + 1 read helper 追加」の単一責務。mutation / rollback / bulk は別タスクに分離済み |
| SRP / 分離 | OK | server wrapper（route + search params）/ client component（初回 fetch + filter + pagination）/ api helper（fetch wrapper）の 3 層分離 |
| 既存資産再利用 | OK | `apps/api/src/routes/admin/audit.ts` 既存 endpoint + parallel-09 primitive を再利用、新規 0 件 |
| 新規 primitive 生成 | なし | Pagination / FormField / Breadcrumb / EmptyState のみ使用 |
| 新規 API endpoint | なし（案 A） | 既存 `/api/admin/audit` を `action=schema_diff.alias_assigned` で filter。case B は Phase 5 で payload 不足判明時のみ |
| 新規 D1 column / migration | なし | 既存 audit log table を再利用 |
| HEX 直書き | なし | OKLch token utility のみ。Phase 9 で grep 検証 |
| Client/Server 境界 | OK | 既存 `apps/web/src/lib/admin/api.ts` は同一 origin client helper のため、fetch は client component に集約する。`"use client"` の付与位置を厳密に分離 |
| Next.js App Router 規約 | OK | `app/(admin)/admin/schema/history/page.tsx` の default export 構成 / `dynamic = "force-dynamic"` で session 認証保護 |
| admin auth | OK | `/api/admin/*` 経由のため middleware で session 認証必須。component 内で再認証は行わない |
| テスト容易性 | OK | filter / pagination / 空状態 / fetch エラーの 4 観点を component spec で網羅、helper も 4 ケース |
| test suffix | OK | 新 spec はすべて `.spec.tsx` / `.spec.ts`。CLAUDE.md 不変条件 #8 適合 |

## 2. CLAUDE.md 不変条件チェック

### 2.1 UI prototype alignment / MVP recovery 不変条件

| # | 不変条件 | 本タスクでの遵守状況 |
|---|---|---|
| 1 | 既存 API のみ接続（新 endpoint 禁止） | 案 A 採用で **遵守**。案 B 昇格は Phase 5 で payload 不足判明時のみ、その場合も `apps/api/src/routes/admin/schema.ts` 内の最小拡張に留め、本 spec §1.2 監査要件を justify として記録する |
| 2 | OKLch トークン正本化 | OKLch utility (`bg-surface-2` / `text-foreground` / `--color-warning` 系) のみ使用、HEX 禁止。Phase 9 grep gate |
| 3 | プロトタイプ正本順位 | parallel-09 primitive のみ使用、新規 primitive 0 件 |
| 4 | D1 直接アクセス禁止 | `apps/web` から D1 binding を使わず `/api/admin/audit` proxy 経由のみ |

### 2.2 admin panel 不変条件

| # | 不変条件 | 本タスクでの遵守状況 |
|---|---|---|
| 9 | admin form input は `FormField` 経由 | filter 3 input（actorEmail / from / to）すべて `FormField` ラップ。`<input>` 直書きしない |
| 10 | admin mutation は `@/features/admin/hooks/useAdminMutation` 経由 | 本タスクは **read-only のため対象外**。fetch は `fetchSchemaAliasHistory()` 関数経由 |
| 14 | `SchemaDiffPanel` は `/admin/schema/page.tsx` 以外で import 禁止 | 本タスクで `SchemaDiffPanel` を import しない（隣接 `SchemaDiffHistoryPanel` を独立追加） |

### 2.3 シークレット / env / CLI

| 観点 | 遵守 |
|---|---|
| `.env` 値の Read / 出力禁止 | 本タスクは UI / helper のみで env 値に触れない |
| `wrangler` 直接実行禁止 | 本タスクで wrangler を呼ばない。deploy は別タスク |
| `scripts/cf.sh` ラッパー | 該当なし |

## 3. read 系 hook 方針の確定

本タスクは read-only fetch のみで mutation は無い。以下の方針を確定する:

- **新規 read 系 hook は追加しない**: `useSchemaAliasHistory()` のような hook を作らず、client component の `useEffect` 内で `fetchSchemaAliasHistory()` を直接呼ぶ。
- 理由:
  1. parallel-09 / parallel-10 に admin 用 read hook の共通基盤が無く、本タスク 1 件のために抽象を作ると premature abstraction になる
  2. mutation 経路 (`useAdminMutation`) と異なり、read 系は SWR / TanStack Query 等の依存追加が必要だが、本タスクのため依存を増やすのは over-engineering
  3. 将来 admin 全体で SWR を採用する PR が立った時点で `SchemaDiffHistoryPanel` の `useEffect` を hook 化する余地は残しておく（refactor 容易性は確保）

## 4. 案 A / 案 B 判断記録

| 項目 | 案 A（既定） | 案 B（fallback） |
|---|---|---|
| 採用条件 | audit log の `maskedBefore` / `maskedAfter` に `stableKey` / `questionText` が含まれる | 含まれない場合のみ昇格 |
| 確認タイミング | **Phase 5 着手時**、実 record を `bash scripts/cf.sh d1 ...` で grep（または preview env の audit_log table を D1 export して確認） |
| 確認手段 | `grep -n "schema_diff.alias_assigned\\|auditLogProvider.append" apps/api/src/workflows/schemaAliasAssign.ts` で resolve mutation の payload 構築箇所を特定し、`before` / `after` に `stableKey` / `questionText` が含まれることを spec / 実 record の 2 通りで確認 |
| 案 B 昇格時の追加対象 | `apps/api/src/routes/admin/schema.ts`（新 endpoint）/ `docs/00-getting-started-manual/specs/01-api-schema.md`（仕様書）/ `apps/web/src/lib/admin/api.ts`（helper URL 切替）/ artifacts.json の `decisions.endpoint_strategy.selected` 更新 |
| 案 B 採用時の justify | CLAUDE.md「既存 API endpoint surface 維持」不変条件に対する例外。serial-05 step-03 followup-003 §1.2 監査要件で justify |

**現時点の判断**: 案 A を既定とし、Phase 5 着手時の確認結果で artifacts.json を更新する。本仕様書は案 A 前提で記述している。

## 5. リスクと回避策

| リスク | 影響 | 回避策 |
|---|---|---|
| audit payload に before/after stableKey が無い | AC-2 未達 | Phase 5 着手時に `apps/api/src/routes/admin/schema.ts` の resolve mutation 実装を grep して payload 構造を確定。不足時は案 B 昇格 |
| `redactAuditPayload` で stableKey が masked される | UI 上で `[REDACTED]` 表示になる | `apps/api/src/lib/audit/redact.ts` を確認し、`stableKey` / `questionText` が mask 対象から除外されていることを Phase 5 で検証。mask されている場合は redact 例外として除外設定を追加 |
| cursor opaque string を UI 側で parse してしまう | API 仕様変更で破綻 | helper / component とも cursor は string のまま扱い、内部構造に依存しない |
| client-side filter (question text) で page 跨ぎ漏れ | UX 期待乖離 | UI に「現 page 内 50 件に対する filter です」と helpText を `FormField` 経由で明示 |
| 大量履歴時の table 描画パフォーマンス | 50 件固定のため問題なし | 仮想スクロール不要 |
| `actorEmail` 完全一致 filter | typo で 0 件になる | `EmptyState` で「該当する履歴がありません」明示 + filter を残したまま再入力できる UX |
| `redactAuditPayload` が `parseError=true` を返すレコード | 表示行が壊れる | `parseError === true` の行は before/after を `—` 表示にフォールバック、operator email + createdAt のみ表示する row として描画 |
| Next.js 16 Turbopack / Webpack 差異 | server / client 境界 mismatch | `"use client"` を client component の最上部に明示。server wrapper から渡す props は serializable な filter / cursor string のみに限定 |

## 6. CONST_005 必須項目チェック

| 項目 | Phase 1-2 での記載箇所 |
|---|---|
| 変更対象ファイル | Phase 1 §6 / Phase 2 §4 / index.md「変更対象ファイル」表 |
| 関数シグネチャ | Phase 2 §4.1 (`fetchSchemaAliasHistory`) / §4.3 (`SchemaDiffHistoryPanel`) |
| 入出力（API 契約） | Phase 2 §6（request / response） |
| テスト方針 | Phase 1 §5「テスト」/ Phase 2 §4.5 / artifacts.json `acceptance_criteria` AC-9 / AC-10 |
| 実行コマンド | Phase 2 §9 |
| DoD | Phase 2 §10 / artifacts.json `dod_commands` |

すべて充足。Phase 4 以降のテスト計画 / 実装 / レビュー / QA / Phase 12 documentation / Phase 13 PR へ進行可能。

## 7. CONST_007 スコープ確定チェック

| 項目 | 状態 |
|---|---|
| 含むもの | Phase 1 §6 in-scope に列挙 |
| 含まないもの | Phase 1 §6 out-of-scope に列挙 + index.md「スコープ外」セクションで先送りなし宣言 |
| 先送りタスクの分離先 | rollback → followup-004 / bulk → followup-002（いずれも既存分離タスク、本仕様で新規に発生していない） |
| 1 サイクル内完了 | Phase 1-13 を 1 PR で完結。`workflow_state` は `spec_created` → `implemented_local` → `completed` で遷移 |

CONST_007 適合。

## 8. 設計承認

- 設計上の論点（endpoint 戦略 / route 戦略 / read hook 方針 / payload 整合 / pagination 設計 / a11y / token 整合）はすべて Phase 1-3 で解消。
- Phase 4（テスト計画）に進む。
- 承認者: spec author（self-review / solo dev）
- 承認日: 2026-05-19（仕様書作成日）

> 案 B 昇格判断は **Phase 5 着手時** に audit payload を grep / spec で確認した上で artifacts.json の `decisions.endpoint_strategy.selected` を更新する。本 Phase 3 では案 A 前提で承認する。
