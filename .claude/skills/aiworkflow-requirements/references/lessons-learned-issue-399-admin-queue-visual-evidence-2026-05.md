# Lessons Learned — Issue #399 Admin Queue Resolve Staging Visual Evidence

## L-I399-001: VISUAL_ON_EXECUTION は planned evidence と runtime evidence を分ける

- **状況**: `/admin/requests` の実 screenshot は admin session と staging D1 fixture が必要。
- **教訓**: `spec_created` では declared outputs と runbook を作り、実画像を PASS と書かない。
- **再発防止**: Phase 11 は `PENDING_RUNTIME_EVIDENCE`、Phase 12 は `DOC_PASS` として分離する。

## L-I399-002: staging seed識別は既存ID prefixを優先する

- **状況**: `seeded_for` 列は可読性が高いが、D1 schema変更禁止と衝突する。
- **教訓**: evidence用fixtureでは、既存schemaに収まる synthetic ID prefix（`ISSUE399-`）を優先する。
- **再発防止**: cleanup query とFR/NFRを同じprefix contractに統一する。

## L-I399-003: parent link はlink先実体化後に適用する

- **状況**: 親 workflow に evidence link を先に追記すると、未取得 screenshots への stale link が残る。
- **教訓**: parent implementation-guide の「delegated → captured」更新は Phase 11 runtime完了後に限定する。
- **再発防止**: parent への evidence link diff は Phase 12 で確定するが、適用は Phase 11 runtime evidence 完了をトリガにした runtime cycle で行う運用を artifact-inventory に明記する。

## L-I399-004: Phase 12 strict 7 files は仕様書作成時点でも実体化する

- **状況**: Phase 12が7 files必須と書きながら、実体がないとcompliance判断が曖昧になる。
- **教訓**: `spec_created` でも Phase 12 close-out を名乗るなら、`main.md` + 6補助の7 filesを必ず置く。
- **再発防止**: `outputs/phase-12/phase12-task-spec-compliance-check.md` で `ls outputs/phase-12/` 結果を直接記録し、7 ファイル parity を gate にする。

## L-I399-005: synthetic ID prefix の cleanup query 契約は seed と同 wave で固定する

- **状況**: `ISSUE399-` prefix を D1 schema 変更回避のために導入したが、cleanup 側で prefix 条件を取り違えると本物の admin queue データを巻き込む危険がある。
- **教訓**: seed SQL と cleanup SQL は同じ prefix 文字列を単一の正本（`apps/api/migrations/seed/issue-399-admin-queue-staging-{seed,cleanup}.sql`）に揃え、focused Vitest で prefix 不一致と「prefix なし行が cleanup 対象に入らない」ことの両方を assert する。
- **再発防止**: prefix 文字列を test fixture と SQL とで定数共有し、scripts/staging のラッパーは env guard で staging 限定実行に閉じ込める。
