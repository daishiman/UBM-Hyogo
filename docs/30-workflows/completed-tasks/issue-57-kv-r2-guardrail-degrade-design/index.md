# KV / R2 Guardrail Detail and Executable Degrade Design — Issue #57

> Task spec workflow root（Phase 1-13）。NON_VISUAL（インフラ guardrail / runbook 同期 + apps/api degrade ガード実装）。
> **実装区分: 実装仕様書**（CONST_004 デフォルト。コード変更を伴う。ユーザー確認で degrade kill-switch を含む方針を選択済み）

| 項目 | 値 |
| --- | --- |
| Issue | #57（GitHub 上 **OPEN**。ユーザー認識「クローズド」と乖離。クローズドのまま spec 作成方針） |
| タスクID | issue-57-kv-r2-guardrail-degrade-design |
| タスク名 | KV / R2 guardrail detail and executable degrade design |
| タスク種別 | NON_VISUAL |
| 状態 | implemented_local_evidence_captured |
| 優先度 | 中 |
| visualEvidence | NON_VISUAL |
| implementation_mode | new |
| 起票元 | 05a Phase 12 unassigned-task-detection U-01 / `docs/30-workflows/unassigned-task/ut-05a-kv-r2-guardrail-detail-001.md` |

## 背景（なぜ今これが必要か）

05a（observability + cost guardrails）では KV / R2 の無料枠を観測対象として整理したが、当時 `apps/api` には KV / R2 binding が存在しなかった。
その後 **Issue #514 / #315 で R2 audit cold-storage binding（`UBM_AUDIT_COLD_STORAGE` / `UBM_AUDIT_APP_COLD_STORAGE`）が production / staging 両方に追加**され、`scripts/audit-log/export-to-r2.ts` が `bucket.put()` で実 R2 書き込みを行うようになった。

しかし正本仕様・runbook はこの変化に追従しておらず、**この Issue が予防しようとしたドリフトが現実化**している:

1. `specs/08-free-database.md` の無料枠表に KV / R2 行が無く、reads/writes / storage / Class A/B の数値 limit が正本未記録。
2. `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md` が「R2 binding 未適用」「KV binding 未追加」と断言したまま（コード実体と矛盾）。
3. `cost-guardrail-runbook.md` §2-7 は KV/R2 に数値閾値が無く、§4-2 の degrade は「R2 未利用」「KV binding がない場合」前提で実行不能。本 task 自身を実装先として TODO 参照している。
4. `apps/api/src/env.ts` は `ALERT_DEDUP_KV: KVNamespace` を必須型で宣言する一方、`wrangler.toml` の KV block はコメントアウト（型 ↔ toml 不整合）。

## 真の論点 / 4条件評価（要件レビュー思考法）

| 観点 | 結論 |
| --- | --- |
| 真の論点 | spec↔code ドリフトの解消と、実稼働中 R2 export の degrade を「手動コード変更が必要」のまま放置しない（実行可能化） |
| 依存・境界 | D1 直接アクセスは `apps/api` に閉じる（不変条件 #5）。binding 追加実装は scope 外（UT-12/UT-13 の別 spec 射程） |
| 価値とコスト | 高価値=ドリフト解消 + executable degrade。低コスト=正本/runbook 編集 + env フラグ 1 本。新規 binding 追加は将来層として分離 |
| 改善優先順位 | (1) 正本 limit 記録 → (2) binding 棚卸し是正 → (3) runbook degrade 実行可能化 → (4) env.ts 型整合 → (5) kill-switch 実装 |
| 4条件 | 価値性=○ / 実現性=○（1サイクル内） / 整合性=○（binding 追加なし・型整合あり） / 運用性=○（CI gate で drift 再発検知可能） |

## 受け入れ基準（AC）

- **AC-1**: KV / R2 の current official free-tier limits が確認日付きで `specs/08-free-database.md` の無料枠表と `deployment-cloudflare.md` に記録されている。
- **AC-2**: binding 棚卸し表が作成され、コード実体（`apps/api/wrangler.toml` / `apps/api/src/env.ts`）と仕様記述が一致する。特に `deployment-cloudflare.md` の「R2 binding 未適用」「KV binding 未追加」の stale 記述が、実在する `UBM_AUDIT_COLD_STORAGE` / `UBM_AUDIT_APP_COLD_STORAGE` を反映する形へ是正されている。
- **AC-3**: `cost-guardrail-runbook.md` §2-7 に KV/R2 の数値閾値が入り、§4-2 の degrade が実稼働中の R2 audit cold-storage export に対して実行可能な手順になっている。
- **AC-4**: `apps/api/src/env.ts` の `ALERT_DEDUP_KV` 型と `wrangler.toml` のコメントアウト状態の不整合が是正されている（runtime optional を型に反映）。
- **AC-5**: env フラグ `AUDIT_COLD_STORAGE_EXPORT_PAUSED` による degrade kill-switch が実装され、`export-to-r2.ts` がこれを尊重し、テストが追加されている。
- **AC-6**: 05a runbook と 05a/05b handoff の表記が current facts に同期されている。

## Phase 進捗

| Phase | 名称 | 状態 |
| --- | --- | --- |
| 1 | 要件定義 | completed |
| 2 | 設計 | completed |
| 3 | 設計レビュー | completed |
| 4 | テスト作成 | completed |
| 5 | 実装 | completed |
| 6 | テスト拡充 | completed |
| 7 | カバレッジ確認 | completed |
| 8 | リファクタリング | completed |
| 9 | 品質保証 | completed |
| 10 | 最終レビュー | completed |
| 11 | 手動テスト | completed |
| 12 | ドキュメント | completed |
| 13 | PR作成 | pending_user_approval |

## スコープ外（CONST_007 に基づく明示的分離）

| 項目 | 分離理由 | 実施場所 |
| --- | --- | --- |
| 新規 R2 binding（`R2_BUCKET`）追加 | UT-12 の独立 spec が射程 | `docs/30-workflows/ut-12-cloudflare-r2-storage/` |
| 新規 KV binding（`SESSION_KV`）追加 | UT-13 の独立 spec が射程 | `docs/30-workflows/ut-13-cloudflare-kv-session-cache/` |
| `ALERT_DEDUP_KV` namespace の実活性化 | ut-17-followup-002 が user-gated として保有。本 task は型整合のみ | ut-17-followup-002 |
| 有料プラン切替判断 / Slack アラート基盤 | 元 Issue スコープ外 | — |

> 上記以外はすべて本 1 サイクル内で完了するスコープに収めている（先送りなし）。

## 関連リンク

- 仕様書: `phase-01.md` 〜 `phase-13.md`
- 成果物: `outputs/phase-*/`
- 元 unassigned spec: `docs/30-workflows/unassigned-task/ut-05a-kv-r2-guardrail-detail-001.md` / `docs/30-workflows/unassigned-task/task-imp-05a-kv-r2-guardrail-detail-001.md`
- 05a runbook: `docs/30-workflows/completed-tasks/05a-parallel-observability-and-cost-guardrails/outputs/phase-05/cost-guardrail-runbook.md`

## Phase Links

- [Phase 1](phase-01.md)
- [Phase 2](phase-02.md)
- [Phase 3](phase-03.md)
- [Phase 4](phase-04.md)
- [Phase 5](phase-05.md)
- [Phase 6](phase-06.md)
- [Phase 7](phase-07.md)
- [Phase 8](phase-08.md)
- [Phase 9](phase-09.md)
- [Phase 10](phase-10.md)
- [Phase 11](phase-11.md)
- [Phase 12](phase-12.md)
- [Phase 13](phase-13.md)
