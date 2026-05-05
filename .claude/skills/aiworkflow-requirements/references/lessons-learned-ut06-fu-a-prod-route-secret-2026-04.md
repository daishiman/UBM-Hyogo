# Lessons Learned: UT-06-FU-A-PROD-ROUTE-SECRET-001（2026-04）

## 概要

UT-06-FU-A-PROD-ROUTE-SECRET-001 は OpenNext Workers production cutover 前の route / custom domain / secret key / observability target の split-brain 防止 runbook を docs-only / NON_VISUAL / `spec_created` で確定し、Phase 12 close-out で `docs/30-workflows/completed-tasks/ut-06-fu-a-prod-route-secret-001-worker-migration-verification/` 配下へ移動した。実際の Cloudflare 状態 mutation・production deploy・DNS 切替・旧 Worker 削除はすべて別承認に分離している。

## 教訓

### L-UT06FUA-001: Phase 12 canonical filename drift（`system-spec-update.md` ↔ `system-spec-update-summary.md`）

- 苦戦箇所: Phase 12 出力に `system-spec-update.md` と `system-spec-update-summary.md` の表記が混在し、どちらが canonical かが review wave で特定しづらかった。
- 再発防止: Phase 12 では `system-spec-update-summary.md` を canonical として固定し、`task-specification-creator` skill 側のテンプレ・チェックリスト・filename strict check に反映する。`system-spec-update.md` は alias として記録するか、撤去する。

### L-UT06FUA-002: NON_VISUAL infrastructure verification の Phase 11 境界

- 苦戦箇所: Phase 11 evidence template（`manual-verification-log.md` / `route-snapshot.md` / `secret-keys-snapshot.md` / `tail-sample.md` / `legacy-worker-disposition.md` / `runbook-walkthrough.md` / `grep-integrity.md`）が完了したことを「production 実測 PASS」と読み違えやすい。
- 再発防止: Phase 11 完了は「runbook と evidence template の format / 構造 PASS」のみを意味し、production 実測 PASS は別承認 operation である旨を runbook と Phase 12 implementation guide に明記する。`VerificationResult` 型に `TBD_APPROVED_VERIFICATION` を残し、未実測領域を fail-closed に表現する。

### L-UT06FUA-003: completed-tasks 配置タイミングと skill index のパス drift

- 苦戦箇所: workflow root を `docs/30-workflows/ut-06-fu-a-prod-route-secret-001-worker-migration-verification/` で起票したまま、close-out で `docs/30-workflows/completed-tasks/` 配下へ移動したため、`SKILL.md` / `quick-reference.md` / `resource-map.md` / `deployment-cloudflare-opennext-workers.md` / `task-workflow-active.md` の 5 ファイルにパス drift が残存した。
- 再発防止: 完了タスクを `completed-tasks/` 配下へ移動する wave では `rg -n "30-workflows/<workflow-id>"` を `.claude/skills/aiworkflow-requirements/{indexes,references,SKILL.md}` に対して必ず実行し、grep ヒットが 0 件になるまで同一 wave で補正する。原典 unassigned ファイルも同時に `completed-tasks/` 直下へ移動するなら同様にパス grep を再走させる。

### L-UT06FUA-004: secret 値非記録 / `bash scripts/cf.sh` ラッパー強制

- 苦戦箇所: route / secret / observability の preflight では production 値（API Token / OAuth client secret / cookie secret 等）の確認需要が発生するが、ログ・スクリーンショット・コミットに実値が混入する事故を起こしやすい。
- 再発防止: secret は **key 名のみ** を記録し、値は記録しない。Cloudflare 操作はすべて `bash scripts/cf.sh` ラッパー経由とし、`wrangler` 直叩きを runbook / Phase 12 implementation guide / lessons-learned で禁止する。`wrangler login` の persistent OAuth は使用禁止、1Password 経由 op run 注入を一本化する。

### L-UT06FUA-005: runbook walkthrough のみで PASS にしない

- 苦戦箇所: `runbook-walkthrough.md` evidence は「runbook を読んだ」だけでも生成可能で、production 実測なしに PASS と勘違いしやすい。
- 再発防止: runbook walkthrough は「runbook 自体が production cutover の意思決定境界を網羅しているか」の structural check であり、route / secret / observability の実測 PASS は `manual-verification-log.md` 側に承認付きで記録する。Phase 12 ステータスは `runbook walkthrough PASS` 単独で `completed` に昇格させない。

### L-UT06FUA-006: route mismatch 検出時の deploy block

- 苦戦箇所: `[env.production].name = "ubm-hyogo-web-production"` を使う cutover では、route / custom domain が旧 Worker（Pages 含む）を指したまま deploy すると split-brain になる。「とりあえず deploy して切り戻し」は許容できない。
- 再発防止: route / custom domain が新 Worker (`ubm-hyogo-web-production`) を指していない場合は、preflight 段階で deploy 承認を block する。runbook の error handling table に「route mismatch」「missing secret key」「secret value visible」「old Worker deletion requested」を明示し、いずれも deploy block / redact / 別承認に分岐させる。

### L-UT06FUA-007: legacy worker 削除は別承認

- 苦戦箇所: cutover 完了後の旧 Pages project / 旧 Worker 削除の判断を、本タスクの runbook 内で完結させてしまう誘惑が発生する。
- 再発防止: `legacy-worker-disposition.md` は `retain` / `separate-approval-required` の 2 値のみを記録対象とし、削除実行・rollback 経路の閉塞は本タスクで実施しない。削除は別タスク（route inventory script / Logpush target diff script の follow-up とは独立）で起票する。

## 2026-05 / route-inventory-design 追記

UT-06-FU-A-ROUTE-INVENTORY-SCRIPT-001（Cloudflare route inventory 自動化スクリプトの design workflow / docs-only / NON_VISUAL / `spec_created`）の Phase 12 close-out で得た苦戦箇所を、同タスクファミリー (UT-06-FU-A) の延長として追記する。実 command / script path / 実測 output path の正本昇格は `UT-06-FU-A-ROUTE-INVENTORY-SCRIPT-IMPL-001`（implementation follow-up）に分離している。

### L-UT06FUA-008: docs-only design workflow が新 workflow root + open follow-up を作る場合の no-op 誤判定

- 苦戦箇所: 既存正本（`deployment-cloudflare-opennext-workers.md` 他）に automation follow-up が登録済みである一方、本 design workflow は新 workflow root（`docs/30-workflows/ut-06-fu-a-route-inventory-script-001-cloudflare-route-inventory/`）と implementation follow-up（`UT-06-FU-A-ROUTE-INVENTORY-SCRIPT-IMPL-001`）を新規に発生させる。Phase 12 で「実 command 昇格は no-op」だけを記述すると、workflow tracking 同期と implementation follow-up 登録まで no-op と読み違える。
- 再発防止: Phase 12 system-spec-update-summary では「実 command 昇格 no-op」と「workflow tracking / open follow-up 登録 (workflow root / quick-reference / resource-map / artifact inventory / task-workflow-active への登録)」を別行で並べる。両者は別判定として残し、後段は同一 wave で必ず同期する。

### L-UT06FUA-009: Phase 12 canonical filename strict 7 files 実体確認の維持

- 苦戦箇所: `system-spec-update.md` 等の別名 drift は今回の design workflow でも誤生成しやすい。Phase 12 の strict 7 files (`main.md` / `system-spec-update-summary.md` / `implementation-guide.md` / `documentation-changelog.md` / `skill-feedback-report.md` / `unassigned-task-detection.md` / `phase12-task-spec-compliance-check.md`) を `wc -l` / `ls` で実体確認しないまま進めると、compliance check 表上は PASS でも別名混入を見逃す。
- 再発防止: Phase 12 close-out では `outputs/phase-12/` を必ず ls 等で実体一覧化し、canonical 7 files のみが存在することを compliance check 表 (`phase12-task-spec-compliance-check.md`) と整合させる。`system-spec-update.md` 等の alias は使用しない（Step 2 stale contract withdrawal で明文化）。

### L-UT06FUA-010: `InventoryReport` schema SSOT を Phase 2 に固定し `mismatches[]` を `RouteInventoryEntry` と同一 schema に揃える

- 苦戦箇所: `InventoryReport` の compete schema として「`reason` カラム」「`notes` カラム」が併存しがちで、`mismatches[]` に endpoint-scope drift（account-scoped / zone-scoped 混在）の理由を入れる際にカラム命名が分裂する。
- 再発防止: schema の SSOT は **Phase 2 設計** に固定する。`mismatches[]` の各要素は `RouteInventoryEntry` と同一 schema を再利用し、理由分類は **任意 `notes` フィールド**として表現する。`reason` 専用カラムは新設しない。Cloudflare route endpoint は account-scoped / zone-scoped を allowlist で並列許容し、エンドポイント混在は drift ではなく仕様（`mismatches[]` で `notes` に記録）として扱う。

### L-UT06FUA-011: docs-only design での「実測 PASS」と「Design PASS」の混在防止

- 苦戦箇所: docs-only / NON_VISUAL の design workflow で Phase 10 / Phase 11 を埋めると、テンプレ次第で「実測 PASS と Design PASS が同列」に読まれる。runtime 実行は implementation follow-up にあるにもかかわらず、design 完了で route inventory 実測まで PASS と誤読されるリスクがある。
- 再発防止: phase 10 / phase 11 のテンプレに **Design GO / runtime GO 分離節**を残す。Design GO は design contract / schema SSOT / Cloudflare endpoint allowlist / safety grep scope / runbook handoff の構造評価のみで成立し、runtime GO（実 inventory 実行 + diff PASS）は implementation follow-up 側で別承認とする。

### L-UT06FUA-012: Phase 欠落 / Phase index parity の早期 gate

- 苦戦箇所: 本 workflow では Phase 03 / 06 / 12 / 13 が initial draft で欠落しており、後続参照（root artifacts / outputs artifacts / phase index）と整合しない状態が長く残ると、Phase 12 close-out 直前に大きな修正 wave を発生させる。
- 再発防止: Phase index と root / outputs `artifacts.json` の Phase parity を **early gate** として Phase 02-03 段階で検証する。`index.md` の phase 表と `artifacts.json` の phases 配列の差分を `documentation-changelog.md` で「missing phases restored」として明文化することで、後続 reviewer が Phase 欠落を即座に検出できる。

### L-UT06FUA-013: 30種思考法 compact evidence の patch 化（4カテゴリ）

- 苦戦箇所: automation-30 の 30種思考法分析が long-form のままだと「実装パッチ」に落とし込めず、Phase 12 review でアクションアイテムが流れる。
- 再発防止: 30種思考法 review の compact evidence は **4カテゴリ patch** で束ねる: (1) Phase topology（欠落 phase 復元 / index parity）、(2) schema SSOT（`InventoryReport` competing schema 解消 / `mismatches[]` 統一）、(3) safety grep scope（Cloudflare endpoint allowlist と account-scoped / zone-scoped の正規化）、(4) handoff formalization（implementation follow-up 起票 / 親 runbook 追記の implementation 後送り / docs-only design GO と runtime GO の分離）。`phase12-task-spec-compliance-check.md` 末尾の「30種思考法 compact evidence」節にカテゴリ化結論を残す。

## 関連リソース

- `references/deployment-cloudflare-opennext-workers.md`
- `references/workflow-ut-06-fu-a-prod-route-secret-001-artifact-inventory.md`
- `references/task-workflow-active.md`
- `indexes/quick-reference.md`（§UT-06-FU-A Production Worker Preflight / §Route inventory design (UT-06-FU-A-ROUTE-INVENTORY-SCRIPT-001)）
- `indexes/resource-map.md`（OpenNext Workers production cutover preflight 行 / route inventory design workflow 行）
- `LOGS/20260430-ut06-fu-a-prod-route-secret-close-out.md`
- workflow root: `docs/30-workflows/completed-tasks/ut-06-fu-a-prod-route-secret-001-worker-migration-verification/`（prod-route-secret 親）
- workflow root: `docs/30-workflows/ut-06-fu-a-route-inventory-script-001-cloudflare-route-inventory/`（route-inventory design / 2026-05）
- implementation follow-up: `docs/30-workflows/unassigned-task/UT-06-FU-A-route-inventory-script-impl-001.md`
- runbook: `outputs/phase-05/runbook.md`
- Phase 12 出力: `outputs/phase-12/{system-spec-update-summary.md, implementation-guide.md, documentation-changelog.md, skill-feedback-report.md, unassigned-task-detection.md, phase12-task-spec-compliance-check.md, main.md}`
