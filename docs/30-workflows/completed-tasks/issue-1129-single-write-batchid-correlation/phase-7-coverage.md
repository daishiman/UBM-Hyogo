# Phase 7: カバレッジ確認

## ステータス: completed

`[実装区分: 実装仕様書]`

## メタ情報

| 項目 | 値 |
| --- | --- |
| workflow_id | `issue-1129-single-write-batchid-correlation` |
| workflow_state | `implemented_local_evidence_captured` |
| 対象 | `apps/api`（route 層 `members.ts` の変更ブロックのみ） |

> 実測は Phase 11 / Phase 9 の focused D1 Vitest 2 files / 31 tests PASS と API typecheck PASS を正本証跡とする。
> カバレッジは **全体一律ではなく変更ブロック（batchId 生成行 + payload 埋め込み）に限定** して line / branch を担保する（FB-BEFORE-QUIT-002 / Feedback 5）。

---

## 1. カバレッジ対象（変更行に限定）

変更は `apps/api/src/routes/admin/members.ts` の以下 2 ブロックのみ。カバレッジ目標もこの 2 ブロックに限定する。

| ファイル | 変更ブロック | 行（Phase 2 §3 参照） | カバレッジ対象 |
| --- | --- | --- | --- |
| `members.ts` | 単一 assign の audit append（`if (applied) { const batchId = crypto.randomUUID(); ... after: { tagId, source: "manual", batchId } }`） | `members.ts:833-843` 付近 | `applied` 分岐の **真 / 偽** 両方（真 = batchId 生成 + after_json へ埋め込み / 偽 = noop で append 非実行） |
| `members.ts` | 単一 unassign の audit append（`if (removed) { const batchId = crypto.randomUUID(); ... before: { tagId, batchId } }`） | `members.ts:872-883` 付近 | `removed` 分岐の **真 / 偽** 両方（真 = batchId 生成 + before_json へ埋め込み / 偽 = noop で append 非実行） |

> repository（`memberTags.ts` / `auditLog.ts`）・migration・`apps/web` は本タスク非変更のため、
> カバレッジ目標を新たに課さない（既存水準を維持する）。

---

## 2. line / branch 実測目標

| 指標 | 対象 | 目標 |
| --- | --- | --- |
| line | assign 側 batchId 生成行（`const batchId = crypto.randomUUID()`）+ payload に `batchId` を含む `after` 行 | 100%（`applied=true` を踏む assign 成功テストで実行） |
| line | unassign 側 batchId 生成行 + payload に `batchId` を含む `before` 行 | 100%（`removed=true` を踏む unassign 成功テストで実行） |
| branch | `if (applied)` の真偽 | 真（assign 成功 = batchId 付与 audit 1 行）+ 偽（既に付与済み tag への再 assign で `applied=false` の noop） = 100% |
| branch | `if (removed)` の真偽 | 真（unassign 成功 = batchId 付与 audit 1 行）+ 偽（未付与 tag の unassign で `removed=false` の noop） = 100% |

---

## 3. 各分岐の踏破経路（新規 = 真分岐 / 既存 + 新規 = 偽分岐）

| 分岐 | 踏破テスト | 内容 |
| --- | --- | --- |
| assign 真（`applied=true`） | `members.tags.contract.spec.ts` 新規ケース | 新規 tag を assign → audit の `after_json.$.batchId` が UUID 文字列で存在することを assert。`audit.contract.spec.ts` で `GET /admin/audit?batchId=<uuid>` がその 1 行をヒットさせる。 |
| assign 偽（`applied=false`・noop） | `members.tags.contract.spec.ts` noop 非退化ケース | 既に付与済みの tag を再 assign → `applied=false` → audit_log 行数が増えない（batchId 生成も行われない）ことを assert（AC-5）。 |
| unassign 真（`removed=true`） | `members.tags.contract.spec.ts` 新規ケース | 付与済み tag を unassign → audit の `before_json.$.batchId` が UUID 文字列で存在することを assert。`audit.contract.spec.ts` で batchId フィルタがヒットさせる。 |
| unassign 偽（`removed=false`・noop） | `members.tags.contract.spec.ts` noop 非退化ケース | 未付与 tag を unassign → `removed=false` → audit_log 行数が増えないことを assert（AC-5）。 |

> 真分岐（batchId 付与）は新規テストで踏み、偽分岐（noop）は新規 noop 非退化テストで踏む。
> これにより 2 ブロックの line / branch を uncovered で残さない。

---

## 4. カバレッジ取得コマンド（変更範囲スコープ）

```bash
mise exec -- pnpm exec vitest run --config vitest.d1.config.ts \
  apps/api/src/routes/admin/members.tags.contract.spec.ts \
  apps/api/src/routes/admin/audit.contract.spec.ts \
  --coverage
```

> 全体カバレッジ閾値ではなく、上記 2 spec 実行時に **変更した batchId 生成行 + payload 行の line / branch が
> uncovered で残らない** ことをレポートで確認する。閾値 gate は既存 coverage-guard 方針に従う
> （sync-merge 時のスキップ等は CLAUDE.md の coverage-guard 節を参照）。

---

## 完了条件

- [x] カバレッジ対象が変更行（assign/unassign の batchId 生成 + payload 埋め込み 2 ブロック）に限定して明記されている
- [x] line / branch の真偽両分岐（真 = batchId 付与 / 偽 = noop）の踏破経路が記述されている
- [x] applied=true/false・removed=true/false の 4 経路がテストにマップされている
- [x] 取得コマンドが変更範囲スコープ（targeted 2 spec + `--coverage`）で記述されている
