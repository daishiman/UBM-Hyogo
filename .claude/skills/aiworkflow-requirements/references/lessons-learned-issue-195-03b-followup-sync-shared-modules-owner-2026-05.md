# lessons-learned: Issue #195 03b Follow-up Sync Shared Modules Owner 苦戦箇所（2026-05-02）

> 対象タスク: `docs/30-workflows/completed-tasks/issue-195-03b-followup-002-sync-shared-modules-owner/`
> 状態: `completed` / docs-only / `NON_VISUAL` / Phase 13 pending_user_approval
> 出典: `outputs/phase-12/{main,implementation-guide,system-spec-update-summary,documentation-changelog,unassigned-task-detection,skill-feedback-report,phase12-task-spec-compliance-check}.md`

03a / 03b 並列 wave で共有する `apps/api/src/jobs/_shared/{ledger,sync-error,index}.ts` skeleton を実体化し、owner / co-owner / 変更ルールを `docs/30-workflows/_design/sync-shared-modules-owner.md` に明文化したガバナンス整備タスク。次回の sync 系並列 wave / governance 系 code NON_VISUAL タスクで同じ判断を短時間で再現するため、苦戦箇所を promotion target 付きで固定する。

## L-ISSUE195FU002-001: workflow governance design 文書は `_design/` に分離する（classification-first）

**苦戦箇所**: 並列 wave で共有される `_shared/` モジュールの owner 表は、runtime spec（`apps/api/src/jobs/_shared/ledger.ts` 自体の API 仕様）でも、個別 task workflow の Phase 出力でもない。03a / 03b の `index.md` 末尾に追記する案を最初に検討したが、「どの workflow にも属さない governance」という分類軸が必要だった。

**5 分解決カード**: 「runtime spec」「task workflow output」「workflow governance design」の 3 軸で classification-first を行い、3 番目に該当する文書は `docs/30-workflows/_design/` に置く。先行例として `docs/30-workflows/02-application-implementation/_design/` の命名規約が存在する。runtime spec / Phase outputs と命名空間を分けることで future の owner 表追加（`_shared/` 以外の cross-task governance）を線形拡張できる。

**適用範囲**: 並列 wave で同一ファイルを編集する可能性がある全 sync / repository / shared module 系 governance。

**検出 guard 案**: classification-first の 3 軸チェックリストを `task-specification-creator/references/` に追加し、`_design/` 配下作成時のテンプレを用意する。

**promoted-to**: `task-specification-creator/references/`（governance design テンプレ）, `workflow-issue-195-03b-followup-002-sync-shared-modules-owner-artifact-inventory.md`

## L-ISSUE195FU002-002: current canonical path の削除差分は legacy mapping または move destination 必須（branch-level deletion guard）

**苦戦箇所**: 対象 workflow（issue-195 followup 002）自体は Phase 1-12 PASS だが、同 worktree のブランチ上に 06b-B / 06c-A / 08a / issue-346 / u-fix-cf / ut-09a など current canonical workflow root の `D` 差分（削除）が混在しており、aiworkflow-requirements の正本索引が指す path が消失する状態。Phase 12 task-spec-compliance-check で「対象 workflow PASS / ブランチ全体 FAIL」を分離して PASS と扱った。

**5 分解決カード**: branch-level の current canonical path 削除は必ず以下のいずれかで対応する: (a) `legacy-ordinal-family-register.md` の §Current Alias Overrides に move destination を行追加、(b) 新 path への実 `R` 移動、(c) deletion 撤回。`D` 単独はブランチ全体 4 条件（矛盾なし・漏れなし・整合性・依存関係整合）の自動 FAIL とし、対象 workflow PASS でも全体 PASS を主張しない。

**適用範囲**: 全 same-wave sync エージェント / Phase 12 close-out。

**検出 guard 案**: pre-commit / pre-merge hook で `git diff --diff-filter=D --name-only` の結果と `references/legacy-ordinal-family-register.md` / `indexes/resource-map.md` の citation を grep 突合し、legacy mapping 不在時は FAIL。CI 側に `verify-canonical-path-deletion-mapping` gate を追加する。

**promoted-to**: `references/legacy-ordinal-family-register.md`, `lessons-learned.md` hub, branch-level deletion guard 運用知見

## L-ISSUE195FU002-003: docs-only governance owner 表に専用テンプレが無い

**苦戦箇所**: docs-only / NON_VISUAL の governance 文書（owner 表）は、Phase 6 の markdown lint、Phase 7 の cross-ref、Phase 8 の AC 検証、Phase 9 の secret-hygiene、Phase 11 の NON_VISUAL evidence をそれぞれ独自に組み立てる必要があった。既存テンプレは「実装 task」「spec_created docs-only」を想定しており、owner 表 5 列固定（ファイル / owner / co-owner / 必須レビュアー / 備考）の AC 設計を都度書いた。

**5 分解決カード**: governance owner 表専用の Phase 6-11 AC テンプレを `task-specification-creator/references/phase-templates/` に追加する。最低限必要なのは: (a) 表の 5 列 schema 検証、(b) リンク 1-hop 到達 grep、(c) secret-hygiene grep、(d) NON_VISUAL evidence の 3 ファイル定型（`main.md` + `manual-verification-log.md` + `link-checklist.md`）。

**適用範囲**: 全 governance / cross-task owner 表 / cross-task variable mapping 系 docs-only タスク。

**検出 guard 案**: `validate-phase-output.js` に `taskType=docs-only-governance` の判定を追加し、owner 表 schema 必須化。

**promoted-to**: `task-specification-creator/references/phase-templates/`, `task-specification-creator/scripts/validate-phase-output.js`

## L-ISSUE195FU002-004: Phase 12 filename drift 検出 guard が無い

**苦戦箇所**: Phase 12 strict 7 files の正本 filename は `main.md` / `implementation-guide.md` / `system-spec-update-summary.md` / `documentation-changelog.md` / `unassigned-task-detection.md` / `skill-feedback-report.md` / `phase12-task-spec-compliance-check.md`。過去 wave で `system-spec-update.md` / `docs-update-history.md` などの旧名が混入する事案があり、本 wave でも初稿で 1 件 drift が発生した。`validate-phase-output.js` で検知できる箇所だが、エディタ補完で旧名を入力しやすい。

**5 分解決カード**: `validate-phase-output.js` の strict 7 files 表を「許容 filename」「禁止 filename（過去 drift 例）」の 2 列に拡張し、禁止 filename を検知したら明示エラーで止める。Phase 12 開始前のエージェント prompt にも 7 files の正本 filename を貼り付ける。

**適用範囲**: 全 Phase 12 close-out。

**検出 guard 案**: `validate-phase-output.js` に禁止 filename テーブルを追加。CI 側で `verify-phase12-strict-filenames` gate。

**promoted-to**: `task-specification-creator/scripts/validate-phase-output.js`, `task-specification-creator/references/phase12-strict-filenames.md`

## L-ISSUE195FU002-005: 「主担当 / サブ担当」と「owner / co-owner」の用語不整合

**苦戦箇所**: 03a / 03b 既存 spec 文中では「主担当 / サブ担当」という日本語、本 owner 表で新規導入したのは「owner / co-owner」という英語。両者の正本 mapping を明示しないと、PR レビューや未来の検索 grep で表記揺れが発生する。本 wave 内では用語統一を行わず、後続未割当タスク `task-issue195-owner-coowner-terminology-normalization-001.md` で吸収する形にした。

**5 分解決カード**: 用語統一を本 wave に含めると scope 越境（03a / 03b の Phase 12 を再 open する必要がある）。governance design 文書には「owner = 主担当 / co-owner = サブ担当」の対応表を 1 行加え、用語統一は別 task として formalize するのが scope-correct。

**適用範囲**: 用語導入を含む全 governance / 仕様 wave。

**検出 guard 案**: governance design 文書テンプレに「既存用語 alias 表」セクションを必須化。

**promoted-to**: `docs/30-workflows/unassigned-task/task-issue195-owner-coowner-terminology-normalization-001.md`

## OP-ISSUE195FU002-1: 同一 wave 同期の漏れ無し基準（governance docs-only 版）

docs-only governance タスクの same-wave sync で必ず確認する 5 同期点:
1. `LOGS/_legacy.md` 最新更新ヘッドラインに 1 行追加（branch-level blocker の有無を明記）
2. `indexes/quick-reference.md` に 13-Phase 仕様 / governance design 文書 path / formalize 後続 / branch-level blocker をセクション追加
3. `indexes/resource-map.md` に canonical task root 行追加（lessons-learned / artifact-inventory 導線含む）
4. `references/task-workflow-active.md` に対象 workflow の active 行追加
5. `references/legacy-ordinal-family-register.md` の最終更新日更新 + NOTE + Current Alias Overrides 行追加（初回登録時は新 category を明示）

新規作成: `references/lessons-learned-<task>-<yyyy-mm>.md` + `references/workflow-<task>-artifact-inventory.md` + `references/lessons-learned.md` hub への追記。

## OP-ISSUE195FU002-2: current canonical deletion 検知の運用

same-wave sync エージェントは作業開始時に `git status --porcelain | grep '^ D'` の結果を確認し、削除対象に `docs/30-workflows/` 配下の current canonical path が含まれる場合は:
1. 対象 workflow の Phase 12 task-spec-compliance-check に branch-level FAIL を分離記録
2. branch-level reconciliation を別 unassigned task として formalize
3. 自身の wave の対象 workflow PASS と分けて Phase 12 main.md に「対象 workflow PASS / ブランチ全体 FAIL blocker 残存」を明示

これにより対象 workflow の close-out と branch-level の整合性確保が混在せず、後続 PR レビューで blocker が見落とされない。
