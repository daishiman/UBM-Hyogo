# Phase 7: 品質ゲート

`[実装区分: 実装仕様書]`

## メタ情報

| 項目 | 値 |
| --- | --- |
| workflow | issue-998-members-publish-state-production-rollout |
| phase | 07 |
| state | implemented_local_runtime_pending |
| implementation_mode | verify_existing + コード変更 1 点 |

## 目的

本タスク（production flag enablement + 既実装回帰確認 + staging/production runtime rollout runbook）の品質ゲートを 3 段（Gate-A / Gate-B / Gate-C）で定義し、各ゲートの PASS 基準と evidence path を検証可能な形へ固定する。コード変更は `apps/api/wrangler.toml` の production `MEMBERS_AUTO_PUBLISH_ON_CONSENT` を `"false"`→`"true"` にする 1 行のみであり、それ以外の実装（auto-publish policy / sync job / backfill endpoint / diagnostics / 公開フィルタ / ops scripts）は親ワークフロー `members-not-displaying-form-sync-investigation` で実装済み・不変である。

## 実行タスク

- flag 変更（Task A）の static review を Gate-A / Gate-B にマップする。
- 既実装の回帰確認（4 focused spec + typecheck + build）を Gate-B にマップする。
- staging（Task B）→ production（Task C）の runtime ops を Gate-C にマップし、user-gated であることを明示する。

## 参照資料

- [phase-05-implementation-guide.md](phase-05-implementation-guide.md) / Phase 5（実装ガイド）
- [phase-06-test-strategy.md](phase-06-test-strategy.md) / Phase 6（テスト戦略）
- [tasks/task-a-production-flag-enablement.md](tasks/task-a-production-flag-enablement.md)
- [tasks/task-b-staging-runtime-verification.md](tasks/task-b-staging-runtime-verification.md)
- [tasks/task-c-production-runtime-rollout.md](tasks/task-c-production-runtime-rollout.md)
- `artifacts.json`
- `outputs/phase-12/phase12-task-spec-compliance-check.md`

## 成果物

- 本 Phase ファイル

## 完了条件

- [x] 必須セクションが存在する。
- [x] Phase 固有本文が後続セクションに保持されている。

## CI gates（既存・本タスクで追加なし）

| Gate | 通過条件 | 本タスクでの扱い |
|------|---------|-----------------|
| `pnpm typecheck` | green | flag 変更は型に影響しないが回帰確認として実行 |
| `pnpm lint` | green | TOML / docs 変更のみ・回帰確認 |
| `pnpm --filter @ubm-hyogo/api test`（focused） | 4 focused spec green | 既実装の回帰確認（新規 spec 追加なし） |
| `pnpm build` | green | OpenNext Workers 互換ビルド回帰 |
| `verify-test-suffix` | `*.spec.ts` 命名のみ（不変条件 #8） | 新規 test ファイルなしで対象外 |
| `verify-design-tokens` | UI 変更なしで対象外 | 公開フィルタ・UI 不変のため対象外 |
| `verify:phase12-compliance` | 本 workflow root strict 7 / canonical 9 headings | 仕様書作成サイクルで検証 |
| `gate-metadata:validate` | artifacts.json zod schema OK | 同上 |
| `indexes-up-to-date` | drift なし | skill index 変更時のみ |

## Workflow gates

| Gate | 内容 | 対象 Task | 実行サイクル |
|------|------|----------|------------|
| Gate-A: spec review | Phase 1-13 + tasks 3 の全 file 存在、内部リンク有効、canonical 9 headings 整合、実装区分が `[実装区分: 実装仕様書]` で統一 | — | 仕様書作成サイクル |
| Gate-B: implementation review | `apps/api/wrangler.toml` production flag が `"true"` へ変更済み（git diff 1 hunk）＋ staging flag と drift なし。4 focused spec / typecheck / build が回帰なく green | Task A | 実装サイクル `03.実装.md` 内 |
| Gate-C: runtime smoke | staging→production の deploy / diagnose / backfill dry-run→approval→apply / `/members` browser smoke が完了し、`visiblePublicCount` 増加（または 0 件根拠の summary 記録）と admin override 保護 spot check が取得済み | Task B → Task C | user-gated runtime ops |

### Gate-A PASS 基準

- `index.md` / `phase-01..13` / `tasks/task-a..c` が全て存在する。
- 各 Phase ファイル冒頭に `[実装区分: 実装仕様書]` が記載されている。
- 内部リンク（tasks / phase 相互参照）が壊れていない。
- evidence: `outputs/phase-12/phase12-task-spec-compliance-check.md`（strict 7 / canonical 9 headings 整合）。

### Gate-B PASS 基準

- `git diff apps/api/wrangler.toml` が production `MEMBERS_AUTO_PUBLISH_ON_CONSENT = "true"`（および付随コメント）のみの変更である。
- `rg -n 'MEMBERS_AUTO_PUBLISH_ON_CONSENT' apps/api/wrangler.toml` で staging（line 162 付近）／production（line 72 付近）がともに `"true"` で drift がない。
- `pnpm --filter @ubm-hyogo/api typecheck` / `build` が exit 0。
- 4 focused spec が green:
  - `src/lib/policies/auto-publish.spec.ts`
  - `src/routes/admin/sync-backfill-publish-state.spec.ts`
  - `src/routes/admin/sync-diagnostics.contract.spec.ts`
  - `src/jobs/sync-forms-responses.contract.spec.ts`
- evidence: Phase 10（ローカル検証）のコマンド出力（exit 0 ログ）。

### Gate-C PASS 基準（user-gated runtime）

- staging（Task B）: deploy 成功 / `diagnose-post` の `visiblePublicCount` が `diagnose-pre` より増加（または 0 件根拠を summary 記録）/ `backfill-apply` の `applied` が dry-run `candidates` と整合 / `skipped.adminExplicit` の hidden 維持 spot check / `/members` after screenshot で 1 件以上表示。
- production（Task C）: D1 backup 取得 / deploy 成功（version id 記録）/ dry-run→approval marker→apply の順守 / `applied` が dry-run と整合し staging 実績と矛盾しない比率 / admin override 保護 spot check / `/members` after screenshot で表示復旧 / rollback 手順を summary 記録。
- evidence: `outputs/phase-11/`（staging-/prod- の diagnose pre/post JSON, backfill dry-run/apply JSON, before/after screenshot, gate-c-summary / rollout-summary）。
- secret 非混入: 保存後 redaction grep（後述）でゼロ件。

## Coverage 方針（FB-BEFORE-QUIT-002 準拠）

| 区分 | 扱い | 根拠 |
|------|------|------|
| 対象範囲 | 既実装の policy / backfill / diagnostics / sync 統合の**既存 coverage を回帰確認**する（4 focused spec の green を再確認）。 | 親ワークフローで実装・カバー済み。本タスクは挙動を変えないため回帰確認に閉じる。 |
| 新規 coverage | **追加しない**。コード変更は `wrangler.toml` の config 1 行のみで、新規シンボル・分岐・型を追加しない。 | flag の挙動は既存 `auto-publish.spec.ts`（flag=false 維持 / flag=true 昇格）と sync contract spec で網羅済み。config 値そのものの unit test は不要（TOML 構文は deploy 時 `cf.sh` が検証）。 |
| 対象外範囲（明記） | (1) `wrangler.toml` の TOML 値に対する新規 unit test、(2) staging/production の runtime backfill 件数に対する自動テスト、(3) 公開フィルタ・UI コンポーネントの新規テスト。いずれも本タスクのスコープ外。 | runtime 件数は user-gated 検証（Gate-C）で evidence 化する。公開フィルタ・UI は不変条件で変更禁止のため新規テスト不要。 |

> 対象外範囲を明記することで「coverage 未達」を品質低下ではなく**スコープ外**として可視化する（FB-BEFORE-QUIT-002）。runtime 側の正しさは Gate-C の evidence（diagnose JSON / screenshot / spot check）で担保する。

## Manual review checklist

- [ ] production `MEMBERS_AUTO_PUBLISH_ON_CONSENT` が `"true"` に変更され、付随コメントが issue-998 production rollout の文脈に更新されている。
- [ ] staging flag と production flag が一致し drift がない。
- [ ] backfill script の default が `--dry-run`（明示 `--apply` 無しでは書き込まない）。
- [ ] admin override の判定が `member_status.updated_by`（非 `system:*`）と `publish_state='hidden'` だけで行われ、存在しない history table に依存していない。
- [ ] 公開フィルタ（`public_consent='consented' AND publish_state='public' AND is_deleted=0`）が不変であること。
- [ ] runtime ops（deploy / backfill / smoke）は user-gated であり、本サイクルでは runbook 確定のみで実行しないこと。
- [ ] evidence 保存後の redaction grep（`SYNC_ADMIN_TOKEN` 等）がゼロ件であること。

## 統合テスト連携

Gate-B は 4 focused spec の回帰（unit/contract 結合）で担保。Gate-C は staging→production の runtime smoke（end-to-end 結合）で担保し、user-gated で実行する。
