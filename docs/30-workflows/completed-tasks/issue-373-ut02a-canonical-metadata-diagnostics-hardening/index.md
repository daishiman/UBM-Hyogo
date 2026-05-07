# issue-373-ut02a-canonical-metadata-diagnostics-hardening

> 本タスクは UT-02A canonical metadata baseline（`apps/api/src/repository/_shared/metadata.ts` + `generated/static-manifest.json`）の **stale detection / 再生成決定論化 / diagnostics 構造化 / 03a alias queue adapter contract test 追加 / static manifest retirement 条件の正本反映** を一括で実装するためのスペックである。
> 現時点の workflow state は `implemented-local` であり、本ディレクトリは Phase 1-13 の実行仕様と、ローカル実装・Phase 11 evidence・Phase 12 strict outputs を保持する。Phase 13 の commit / push / PR はユーザー承認待ち。
> Issue #373 は CLOSED 状態だが、`UT-02A-FU-DIAG-001` として独立 spec 化する（元 unassigned task `task-ut02a-canonical-metadata-diagnostics-hardening-001.md` の正本仕様化）。

## task identity

| 項目 | 値 |
| --- | --- |
| task_id | UT-02A-FU-DIAG-001 |
| issue | #373 |
| source | ut-02a-section-field-canonical-schema-resolution |
| origin task spec | `docs/30-workflows/completed-tasks/task-ut02a-canonical-metadata-diagnostics-hardening-001.md` |

## wave / mode / owner

| 項目 | 値 |
| --- | --- |
| wave | ut-02a-fu |
| mode | sequential（Phase 1→13） |
| owner | - |
| 状態 | implemented-local / Phase 11 evidence captured / Phase 12 completed / Phase 13 blocked_pending_user_approval |
| visualEvidence | NON_VISUAL |
| priority | medium |
| scale | medium |
| taskType | implementation |

## purpose

UT-02A で `MetadataResolver` と static manifest baseline により旧 fallback（section 重複・label 流用・heuristic kind 判定）を root から排除した。一方で 03a alias queue 完成前は static manifest が暫定正本であり、(1) manifest stale detection、(2) 再生成手順の決定論化、(3) `buildSectionsWithDiagnostics()` の unknown stable key diagnostics の構造化ログ + evidence 化、(4) 03a alias queue adapter の contract test 追加、(5) static manifest retirement 条件の正本仕様反映、が運用化されていない。本タスクはこれら 5 項目を 1 つの実装サイクルで完結させる。

## why this is an independent task

- 元 unassigned task `task-ut02a-canonical-metadata-diagnostics-hardening-001.md` は UT-02A 完了後の hardening スコープであり、UT-02A 本体の re-spec とは独立している。
- 03a 本体実装（forms schema sync）に依存しない範囲（contract test の interface 側）まで本タスクで完結させ、03a 完成後は contract test の実装側（D1 backed adapter）を差し替えるだけで retirement に進めるよう切り分ける。
- 本タスクは API 層内部の diagnostics / contract test / 検証スクリプトが中心であり UI 副作用を伴わないため、`NON_VISUAL` として扱う。

## scope in / out

### Scope In

- `scripts/verify-static-manifest.mjs` 新規追加（manifest と source spec の hash 整合性検証）
- `scripts/regenerate-static-manifest.mjs` 新規追加（`docs/00-getting-started-manual/specs/01-api-schema.md` から決定論的に manifest 再生成）
- `apps/api/src/repository/_shared/generated/static-manifest.json` schema 拡張（`sourceSpecHash` / `sourceSpecVersion` 追加・既存 `generatedAt` / `regenerateCommand` / `retirementCondition` は維持）
- `apps/api/src/repository/_shared/builder.ts` の `buildSectionsWithDiagnostics()` の戻り値（unknown stable key 件数）を `apps/api/src/lib/logger.ts` 経由の構造化ログ（`code: "UBM-MANIFEST-UNKNOWN-KEY"`）として出力する経路追加
- `apps/api/src/repository/_shared/__tests__/alias-queue-adapter.contract.test.ts` 新規追加（`AliasQueueAdapter` interface の dryRun success / failure / unknownStableKey transit の契約テスト、in-memory fake）
- `metadata.test.ts` / `builder.test.ts` への diagnostics + manifest stale 検出テスト追加
- `.github/workflows/ci.yml` または既存 backend-ci に `pnpm verify:static-manifest` gate 追加
- `package.json` (`scripts.verify:static-manifest` / `scripts.regenerate:static-manifest`) 追加
- `docs/00-getting-started-manual/specs/01-api-schema.md`（または `08-free-database.md`）に static manifest retirement 条件を追記
- 上記すべての Phase 11 evidence + Phase 12 documentation update

### Scope Out

- 03a alias queue adapter の **本体実装**（D1 backed adapter）— contract test の interface 側のみ整備
- 03a forms schema sync の本体実装
- D1 `schema_questions` テーブルへの populate 実行
- 本番 D1 データ修正
- static manifest 自体の削除（retirement 条件は文書化するが、削除実行は 03a 完成後の別タスク）
- UI / Web 側の変更

## dependencies

### Depends On

- 元 UT-02A spec（`docs/30-workflows/ut-02a-section-field-canonical-schema-resolution/`）
- 既存 `MetadataResolver` / `static-manifest.json` baseline（merged 済）
- `docs/00-getting-started-manual/specs/01-api-schema.md`（manifest source spec）

### Blocks

- static manifest retirement 実行（03a 完成後の別タスク）
- 03a alias queue adapter 本体実装（contract test を先行配備することで unblock 可能になる）

## refs

- spec dir: `docs/30-workflows/issue-373-ut02a-canonical-metadata-diagnostics-hardening/`
- 元 unassigned task spec（正本完了条件）: `docs/30-workflows/completed-tasks/task-ut02a-canonical-metadata-diagnostics-hardening-001.md`
- 対象コード: `apps/api/src/repository/_shared/metadata.ts` / `apps/api/src/repository/_shared/builder.ts` / `apps/api/src/repository/_shared/generated/static-manifest.json`
- 既存テスト: `apps/api/src/repository/_shared/metadata.test.ts` / `apps/api/src/repository/_shared/builder.test.ts`
- 仕様正本: `docs/00-getting-started-manual/specs/01-api-schema.md` / `docs/00-getting-started-manual/specs/08-free-database.md`
- ロガー: `apps/api/src/lib/logger.ts`
- CI: `.github/workflows/ci.yml` / `.github/workflows/backend-ci.yml`
- `CLAUDE.md`（branch 戦略 / pnpm workspace / mise exec ルール）

## AC（Acceptance Criteria）

- [ ] `pnpm verify:static-manifest` が manifest 健全時 PASS、source spec hash drift 時 FAIL を返す
- [ ] `pnpm regenerate:static-manifest` が決定論的に同一バイト出力を生成する（同一入力で 2 回連続実行して diff 0）
- [ ] `static-manifest.json` に `sourceSpecHash` / `sourceSpecVersion` が追加されている
- [ ] `buildSectionsWithDiagnostics()` の unknown stable key 件数が `code: "UBM-MANIFEST-UNKNOWN-KEY"` の構造化ログとして出力されることをテストで検証
- [ ] `alias-queue-adapter.contract.test.ts` が dryRun success / dryRun failure / unknownStableKey transit の最低 3 ケースで PASS
- [ ] `metadata.test.ts` に manifest stale 検出（hash drift simulation）テストが追加され PASS
- [ ] CI に `verify-static-manifest` gate が追加され PR 上で実行されている
- [ ] `docs/00-getting-started-manual/specs/01-api-schema.md`（または `08-free-database.md`）に static manifest retirement 条件が追記されている
- [ ] `mise exec -- pnpm typecheck` / `pnpm lint` / `pnpm --filter @ubm/api test` が all PASS
- [ ] 不変条件 #1（実フォームschema固定しすぎない）/ #5（D1 直アクセス境界）に違反しない

## 13 phases

- [phase-01.md](phase-01.md) — 要件定義
- [phase-02.md](phase-02.md) — 設計
- [phase-03.md](phase-03.md) — 設計レビュー
- [phase-04.md](phase-04.md) — テスト戦略
- phase-05.md — 実装ランブック
- phase-06.md — 異常系検証
- phase-07.md — AC マトリクス
- phase-08.md — DRY 化
- phase-09.md — 品質保証
- phase-10.md — 最終レビュー
- phase-11.md — 手動 / 自動 evidence
- phase-12.md — ドキュメント更新
- phase-13.md — PR 作成

## outputs

- `outputs/phase-01/main.md` 〜 `outputs/phase-13/*` は Phase 実行成果物パス。
- `artifacts.json` の `phases[].outputs` が成果物パスを管理する。Phase 13 の user-gated PR 作成だけは `blocked` のまま維持する。

## invariants touched

- **#1 実フォーム schema をコードに固定しすぎない** — manifest は source spec hash と verify gate で常に spec 由来であることを担保し、コード側でハードコードを増やさない
- **#5 apps/api に D1 直接アクセスを閉じる** — diagnostics ログは `apps/api` 内で完結し、apps/web には漏らさない
- 不変条件 #14（無料 tier 維持） — CI gate 1 つ追加のみで Cloudflare 課金枠には影響しない

## completion definition

- 元 unassigned task の完了条件チェックリスト 5 項目（manifest 再生成決定論性 / stale 検出 / diagnostics evidence / 03a contract test / retirement 条件正本反映）がすべて充足
- 上記 AC 全項目が PASS
- CONST_007 に従い、本タスク内で「Phase XX で対応」「将来タスク」「別 PR」の先送り記述を残さない（03a 本体実装は scope out として明示済みで、先送りではない）
- Phase 13 の G1/G2 承認後に commit / push / PR 作成が可能な状態。ただし本 implemented-local cycle では commit / push / PR は実行しない。
