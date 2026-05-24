# Phase 10: 最終レビュー

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 10 / 13 |
| 名称 | 最終レビュー（AC 最終充足判定 / リスク緩和状況 / blocker 判定） |
| 依存 | phase-07.md（カバレッジ）/ phase-08.md（リファクタ）/ phase-09.md（品質保証） |
| 成果物 | 本ファイル（phase-10.md） |
| 状態 | spec_created |

## 目的

Phase 1〜9 の成果（要件 → 設計 → テスト → 実装 → カバレッジ → リファクタ → 品質保証）を統合し、AC-1〜AC-13（Local Acceptance）の最終充足を判定する。index.md リスク表の各リスクが緩和されたかを確認し、Phase 11 runtime evidence（RAC-1〜RAC-3）が user-gated で pending であることを blocker として明示する。

## AC-1〜AC-13 最終充足判定

| AC | 要求要約 | 担保箇所 | 判定 |
| --- | --- | --- | --- |
| AC-1 | reverse-backfill 実行（stableKey → `__extra__:{qid}`） | `schemaAliasRecompute.ts` `reverseBackfillResponseFields` + POST endpoint。`schemaAliasRecompute.spec.ts` / `schema.recompute.spec.ts` happy path | ✅ 充足（spec） |
| AC-2 | idempotency（二重変動なし） | `(alias_id, stable_key, trigger_key)` UNIQUE（migration 0020）+ SQL レベル冪等。「2 回実行後 == 1 回実行後」テスト | ✅ 充足（spec） |
| AC-3 | audit_log 記録（`schema_alias.recompute`） | workflow audit insert + `after_json` に `{ jobId, affectedCount, processedCount, updatedCount, deletedCollisionCount, relatedRollbackAuditId, triggerKey, reason }`。endpoint test で audit 行検証 | ✅ 充足（spec） |
| AC-4 | GET status（不在時 null） | GET endpoint + `getLatestJobByAlias`。endpoint test で status / null 検証 | ✅ 充足（spec） |
| AC-5 | admin 明示操作のみ（自動連動なし） | `SchemaDiffPanel` ボタン押下 → `useAdminMutation`。rollback workflow を recompute から呼ばない。component test で配線検証 | ✅ 充足（spec） |
| AC-6 | warning(248-250) 置換 + submitting disable + running continue + status バッジ | `data-role="recompute-action"` 群へ置換。submitting 中のみ disable。server `running` は cursor 継続操作として再押下可能。component test で happy/submitting/running/failed | ✅ 充足（spec） |
| AC-7 | migration UNIQUE 制約 | `0020_schema_alias_recompute_jobs.sql` の `UNIQUE(alias_id, stable_key, trigger_key)`。**DDL 適用確認は RAC-1（runtime）** | ⏳ spec 完備 / runtime 検証 pending |
| AC-8 | CPU budget exhausted 継続 | `reverseBackfillResponseFields` exhausted → job `running` + cursor。「exhausted → 再開で完了」テスト | ✅ 充足（spec） |
| AC-9 | `useAdminMutation` 経由（legacy 不参照） | `@/features/admin/hooks/useAdminMutation` import。Phase 9 grep で legacy 不参照確認 | ✅ 充足（spec） |
| AC-10 | OKLch token のみ（HEX なし） | status バッジ token mapping 集約。`verify:tokens` pass | ✅ 充足（spec） |
| AC-11 | `*.spec.{ts,tsx}` 命名 | 新規 test 2 本が spec suffix。lefthook `block-test-suffix` pass | ✅ 充足（spec） |
| AC-12 | D1 直接アクセス禁止 | web は `lib/admin/api.ts` fetch helper のみ。D1 binding 直参照なし | ✅ 充足（spec） |
| AC-13 | spec 2 本追記 | `11-admin-management.md`（recompute 操作仕様）/ `01-api-schema.md`（endpoint 2 本）追記。Phase 12 で正本同期 | ✅ 充足（spec） |

> AC-7 の DDL **定義** は migration ファイルで spec 完備。実 D1 への **適用結果**（`PRAGMA table_info` / `PRAGMA index_list`）は RAC-1 の runtime evidence で確認する（user-gated）。

## index.md リスク表 緩和状況

| リスク | 緩和策（index.md） | 緩和状況 |
| --- | --- | --- |
| reverse-backfill の `__extra__:{qid}` 衝突で UNIQUE 違反 | backfill 対称の DELETE → UPDATE 衝突回避を Phase 02 algorithm で固定 + Phase 04 衝突ケース | ✅ 緩和済（recompute-algorithm.md の DELETE→UPDATE 順序 + 衝突回避テスト） |
| idempotency 設計ミスで二重変動 | `(alias_id, stable_key, trigger_key)` UNIQUE + completed job 検出 no-op + Phase 04 二重実行 | ✅ 緩和済（job レベル + SQL レベル二重防御） |
| rollback で soft-deleted のため alias 情報が取れない | `getById(c, id, { includeDeleted: true })` で取得 | ✅ 緩和済（Phase 02 で明記、`not_rolled_back` 分岐で deletedAt 検証） |
| 大量 response の同期 recompute で CPU budget timeout | chunk + exhausted 時 `running` 継続 + cursor 保存で再開（Queue fan-out は将来拡張） | ✅ 緩和済（AC-8 / exhausted continuation テスト） |
| audit relation が `cf_audit_log` と混同される | application `audit_log.after_json.relatedRollbackAuditId` に固定。`cf_audit_log` 不変更 | ✅ 緩和済（recompute-algorithm.md で application audit_log 固定） |
| Playwright visual baseline 追加忘れで visual-full CI fail | Phase 11 で baseline 取得手順を明文化、task-18 visual-full と整合 | ⏳ 緩和手順は明文化済 / baseline 取得は RAC-3（runtime）pending |

## blocker 判定

| 区分 | 状態 | 内容 |
| --- | --- | --- |
| Local Acceptance（AC-1〜AC-13） | ✅ spec として完備 | 設計・テスト・実装・カバレッジ・リファクタ・品質保証が spec レベルで全 AC を担保。AC-7 の DDL 定義も spec 完備 |
| Runtime Acceptance（RAC-1〜RAC-3） | ⏳ runtime_pending（user-gated） | migration apply / staging end-to-end / visual baseline は実 Cloudflare 操作が必要。CLAUDE.md「実 `gh api -X PUT` / deploy / push はユーザー明示承認後のみ」に従い、user 承認まで pending |
| blocker | RAC-1〜RAC-3 のみ | Local 実装は blocker なし。runtime evidence 取得が唯一の残作業で、これは user-gated（仕様上の正常状態） |

> RAC-1〜RAC-3 が pending であることは **欠陥ではなく user-gated な設計**。Phase 11 は `runtime_pending`、Phase 13（PR）は `blocked`（index.md Phase 一覧）で、runtime evidence は user が staging 操作を承認した時点で充足する。

## 最終レビュー結論

- **Local Acceptance は spec として完備**: AC-1〜AC-13 はすべて設計成果物 → テスト → 実装 → カバレッジ → 品質保証の連鎖で担保され、未担保 AC はゼロ。
- **Runtime Acceptance（RAC-1〜RAC-3）は user-gated で `runtime_pending`**: migration apply / staging recompute runtime / visual baseline は実 Cloudflare 操作を要し、user 明示承認後に Phase 11 evidence で充足する。
- CONST_007 スコープ分離（bulk / notification / Queue fan-out）は最後まで維持され、recompute 単体経路は本サイクル内で完結している。

## 完了条件 (DoD)

- [ ] AC-1〜AC-13 の最終充足判定が「担保箇所 / 判定」付きで列挙されている
- [ ] AC-7 が「spec 完備 / runtime 検証 pending」として正しく区別されている
- [ ] index.md リスク表の各リスクに対する緩和状況が記録されている
- [ ] blocker 判定で「Local は blocker なし / RAC-1〜3 が user-gated pending」が明示されている
- [ ] 「Local Acceptance は spec 完備、Runtime Acceptance(RAC-1〜3) は user-gated で runtime_pending」が結論として記述されている
