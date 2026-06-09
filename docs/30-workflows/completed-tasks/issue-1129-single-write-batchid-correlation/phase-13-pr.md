# Phase 13: PR作成

## ステータス: pending_user_approval

## 実行条件（CONST_002）

**commit / push / PR 作成は user の明示承認後のみ実行する。** 本 workflow は
`docs/30-workflows/completed-tasks/issue-1129-single-write-batchid-correlation/` 配下の仕様書に加え、
`apps/api` の audit payload 変更 + contract test 拡充まで同一サイクルで実装済み。

| 項目 | 値 |
| --- | --- |
| PR base ブランチ | `dev` |
| 作業ブランチ | `docs/issue-1129-single-write-batchid-correlation-spec` |
| related issue | #1129（CLOSED 維持） |
| 承認ゲート | user の明示承認（「PR作成」等）後のみ commit / push / `gh pr create` を実行 |

---

## PR タイトル案

```
feat(api): 単一 tag write の audit payload に batchId 相関キーを付与 (issue-1129)
```

> 実コード・テスト・仕様書・正本同期を同一 PR に含める想定。

---

## PR 本文骨子

### 変更概要

- issue #1129「単一 tag write endpoint への batchId 相関キー付与」の Phase 1-13 実装仕様書と実装を追加。
- 設計確定: 単一 write（assign / unassign）の `audit_log` append payload に `batchId`（`crypto.randomUUID()`・
  リクエスト単位 correlation）を route 層（`apps/api/src/routes/admin/members.ts`）で付与する。
  assign→`after_json` / unassign→`before_json` の非対称配置を bulk（#1036）と完全一致させ、
  `GET /admin/audit?batchId=` の既存 `json_extract` OR 検索が**改修なし**でそのまま効く状態にする。
- **NON_VISUAL**: API audit payload のみ変更。UI/UX 変更なし・`apps/web` 非接触・screenshot 不要。
- **implemented_local_evidence_captured**: `members.ts` 編集 +
  `members.tags.contract.spec.ts` / `audit.contract.spec.ts` 拡充まで local evidence captured。
- schema 変更・新 endpoint 追加・Google Form 仕様変更・`apps/web` 変更は一切伴わない。

### 受け入れ基準（AC）

| ID | 受け入れ基準 |
| --- | --- |
| AC-1 | 単一 write の相関「まとまり」（= リクエスト単位 / 群サイズ 1）が定義され付与方針が確定 |
| AC-2 | 単一 assign の audit payload に `batchId` が付与され `GET /admin/audit?batchId=` でヒット |
| AC-3 | 単一 unassign の audit payload（before_json 側）に `batchId` が付与されフィルタでヒット |
| AC-4 | payload キー名・所在が bulk と揃い `json_extract` after/before OR 検索が改修なしで効く |
| AC-5 | 実 mutation 時のみ audit を残す既存挙動を維持し、noop は audit を残さない（非退化） |
| AC-6 | bulk の batchId 意味論（request-scoped correlation）と衝突しない |

### テスト

NON_VISUAL のため screenshot は無し。主証跡 = targeted vitest 2 ファイル（31 tests PASS）。

```bash
mise exec -- pnpm exec vitest run --config vitest.d1.config.ts \
  apps/api/src/routes/admin/members.tags.contract.spec.ts \
  apps/api/src/routes/admin/audit.contract.spec.ts
mise exec -- pnpm --filter @ubm-hyogo/api typecheck
```

| ファイル | 追加ケース |
| --- | --- |
| `members.tags.contract.spec.ts` | A-T1b（assign after_json に batchId）/ A-T7b（unassign before_json に batchId）/ A-T2b・A-T8b（noop 非退化） |
| `audit.contract.spec.ts` | AU-1129-1（assign 由来 batchId フィルタヒット）/ AU-1129-2（unassign 由来 batchId フィルタヒット・別 uuid） |

### 視覚証跡

UI/UX 変更なしのため Phase 11 スクリーンショット不要（NON_VISUAL）。
代替証跡は `outputs/phase-11/manual-test-result.md`（自動テスト計画）を参照。

### Refs

- Refs #1129（CLOSED 維持）
- 親 workflow: `docs/30-workflows/completed-tasks/issue-1079-bulk-tag-audit-batch-filter/`（batchId 検索導線）
- 起点: `docs/30-workflows/unassigned-task/task-issue-1079-followup-002-single-write-batchid-correlation.md`

---

## 実行手順（user 承認後のみ）

1. `git fetch origin dev` → ローカル `dev` を `origin/dev` に fast-forward 同期
2. 作業ブランチ `docs/issue-1129-single-write-batchid-correlation-spec` に `dev` をマージ（コンフリクトは既定方針で解消）
3. `git add -A` で本 workflow ディレクトリの全 docs を含めてコミット
4. `git push -u origin docs/issue-1129-single-write-batchid-correlation-spec`
5. `gh pr create --base dev` で PR 作成（タイトル・本文は上記骨子）

> 上記はすべて **user の明示承認後のみ** 実行する（CONST_002）。本 Phase の作成時点では commit / push / PR は実行しない。

---

## 完了条件

- [x] PR base = `dev`・作業ブランチ・related issue #1129（CLOSED 維持）を明記した
- [x] commit / push / PR は user の明示承認後のみ（CONST_002）と明記した
- [x] PR タイトル案・本文骨子（変更概要 / AC / テスト / 視覚証跡 / Refs #1129）を記載した
- [x] implemented_local_evidence_captured として実コード・テスト・仕様書・正本同期を同一サイクルで完了した旨を明記した
- [ ] （user 承認後）commit / push / `gh pr create --base dev` を実行する
