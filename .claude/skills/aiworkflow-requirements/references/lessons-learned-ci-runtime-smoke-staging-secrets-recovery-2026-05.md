# Lessons Learned: CI runtime-smoke staging secrets recovery (2026-05-15)

workflow root: `docs/30-workflows/completed-tasks/ci-runtime-smoke-staging-secrets-recovery/`
state: `runtime_pending` / `implemented_local_evidence_captured` / verdict `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING`
predecessor: `completed-tasks/ci-secret-alignment-and-runtime-smoke-recovery/`（task-02 runtime smoke secret provisioning）の follow-up patch。

## 苦戦箇所一覧

### L-CRSSSR-001: stale runbook path drift（completed-tasks 移動由来）

- **事象**: `.github/workflows/runtime-smoke-staging.yml` 内 missing-secret エラーメッセージが旧 runbook パス（`docs/30-workflows/ci-secret-alignment-and-runtime-smoke-recovery/...`）を指していた。workflow root が `completed-tasks/` 配下へ移動した際、workflow YAML の文字列リテラルが追従していなかった。同様の stale 参照が `incident-runbook-slack-delivery.yml` / `pr-build-test.yml` / `pr-target-safety-gate.yml` / `verify-indexes.yml` / `verify-test-suffix.yml` にも内在していた。
- **根本原因**: workflow YAML 内の `docs/...md` 参照は string literal として grep でしか検出できず、`completed-tasks/` への大規模 path 移動と CI lint の間に gate が存在しなかった。Phase 12 strict 7 や verify-test-suffix のような structural gate は doc reference の存在を検証しない。
- **対応**: `scripts/ci/verify-workflow-doc-refs.sh` を新設し、`.github/workflows/*.yml` 内の repository-local `docs/...md` 参照を全て走査して存在確認。URL / anchor-only / placeholder / `outputs/phase-11/evidence/...`（workflow runtime が生成する artefact）は対象外。`.github/workflows/verify-workflow-doc-refs.yml` を CI gate 化し、`ci.yml` の actionlint target にも追加。`runtime-smoke-staging.yml` の runbook path は `docs/30-workflows/completed-tasks/ci-runtime-smoke-staging-secrets-recovery/` に直接更新。
- **再発防止**: `verify-workflow-doc-refs` を push / PR で常時実行（lint gate）。`scripts/ci/__tests__/verify-workflow-doc-refs.spec.sh` で OK / missing / URL / anchor / missing dir / real repo の 6 ケースを shell test 化し regression を固定。`completed-tasks/` 移動を伴う今後の workflow 再分類で同種 drift を fail-loud に表面化する。
- **関連 reference**: `deployment-gha.md`（workflow lint scope）, `legacy-ordinal-family-register.md`（completed-tasks 移動の運用記録）。

### L-CRSSSR-002: shell test TC-04 の混在行 false negative

- **事象**: `verify-workflow-doc-refs.spec.sh` の TC-04（anchor-only references が ignore されること）で、initial drafting 時にアサーションが「`(anchor only)` を含むかどうか」のみを見て stdout 全体マッチに頼ったため、missing dir の error message に anchor 文字列が混在した時に false negative が出た。テストは pass するが実際は anchor handling と missing handling の境界が曖昧だった。
- **根本原因**: shell test における stdout pattern matching が粒度不足。1 行単位の構造化された exit code / stderr 分離ではなく、`grep -q` ベースの混在判定で行単位のセマンティクスが失われていた。
- **対応**: TC ケースを「assertion 1 行 = 1 セマンティクス」に分解。anchor / URL / placeholder の skip cause は stdout 行ごとに固有 prefix（`(anchor only)`, `(external url)`, `(placeholder)`）で識別し、`grep -c` で個数まで検証するように再構成。`bash -n` syntax check を `bash-syntax.txt` に固定 evidence として残す。
- **再発防止**: 新規 shell guard は必ず `__tests__/<name>.spec.sh` を併設し、TC 名 × アサーション 1:1 を維持。`outputs/phase-11/evidence/verify-workflow-doc-refs-test.txt` で TC ごとの PASS 行を artefact 化する命名 convention に統一。
- **関連 reference**: `deployment-gha.md`（actionlint scope）、本 lessons L-CRSSSR-005。

### L-CRSSSR-003: `.gitignore` と evidence path の整合（trackable / non-trackable boundary）

- **事象**: Phase 11 evidence が `outputs/phase-11/evidence/` 配下に置かれる一方、workflow YAML 内に `outputs/phase-11/evidence/summary.json` のような runtime 生成パスを参照する文字列も存在し、verify-workflow-doc-refs が「存在しない doc」として false fail を出す risk があった。実 evidence は git tracked、runtime 生成 artefact は untracked という二重存在。
- **根本原因**: `outputs/phase-11/evidence/` という同一 prefix の下に (a) Phase 11 提出物として commit する evidence と (b) workflow run 時に生成し artefact upload するのみの runtime 出力が混在し、CI doc-ref guard が両者を同じルールで扱おうとした。
- **対応**: `verify-workflow-doc-refs.sh` は `outputs/phase-11/evidence/...` を **workflow runtime が生成する non-trackable artefact** として明示的に skip。Phase 11 提出物（`verify-workflow-doc-refs.txt` / `verify-workflow-doc-refs-test.txt` / `actionlint.txt` / `phase12-compliance.txt` / `bash-syntax.txt` / `runtime-pending.md`）は task root の `outputs/phase-11/evidence/` に commit し、`artifacts.json` の `actual_read_only_evidence_files` に列挙。
- **再発防止**: workflow YAML 内で `outputs/phase-11/evidence/...` を参照する場合は「runtime-generated」コメントを併記し、doc-ref guard の skip rule（`outputs/phase-(\d+)/evidence/`）を `verify-workflow-doc-refs.sh` の正規表現として permanent 化。`artifacts.json` には trackable evidence のみ列挙する convention を維持。
- **関連 reference**: `deployment-secrets-management.md`（runtime artefact と secret 値の同種扱い）、`task-workflow-active.md`（phase-11 evidence inventory schema）。

### L-CRSSSR-004: secret inventory 5 vs workflow early-fail 4 の boundary 文書化

- **事象**: `artifacts.json#mutation_commands` には 5 つの `gh secret set ...` が並ぶ（`STAGING_API_BASE` / `STAGING_ADMIN_BEARER` / `STAGING_MEMBER_ID` / `STAGING_ME_BEARER` / `SLACK_WEBHOOK_INCIDENT`）が、`runtime-smoke-staging.yml` の早期 fail check は 4 つの smoke-body credential しか guard しない。レビュー時に「5 個必要なら 5 個 fail-loud に check すべきでは」と疑問が浮上したが、これは意図的な設計差分。
- **根本原因**: smoke 本体（HTTP call）と failure-summary post step（Slack 通知）は責務が異なる。前者は smoke 実行前に `${VAR:?}` で連鎖失敗するので「smoke 起動 gate に 4 secret を name-only で先行 check」する（L-CIPR-009 確立）。後者は `if: ${{ failure() && hashFiles(...) }}` で guard 済みで、Slack webhook が無い場合は通知 step が skip されるだけで smoke 結果自体に影響しない。よって `SLACK_WEBHOOK_INCIDENT` を smoke pre-flight に混ぜると false-fail を生む。
- **対応**: provisioning inventory（オペレータが用意すべき secret 全集合）= 5 個、smoke pre-flight early-fail = 4 個、Slack post-step guard = 1 個 という三層 boundary を `outputs/phase-12/implementation-guide.md#secret-boundary` に明文化。`deployment-secrets-management.md` 側にも cross-reference を追加して同種 review で同じ疑問が再発しないようにする。
- **再発防止**: `runtime-smoke-staging.yml` 内 pre-flight check block 直上に「Slack webhook は post-step が guard するため除外」コメントを永続化。secret inventory を変更する PR は `outputs/phase-12/implementation-guide.md#secret-boundary` 表とコメント、両方を同一 commit で更新する convention を `task-workflow-active.md` に追加。
- **関連 reference**: `deployment-secrets-management.md` §Environment secret 0 件問題、`lessons-learned-ci-pipeline-recovery-2026-05.md` L-CIPR-009。

### L-CRSSSR-005: actionlint scope 拡張の同期

- **事象**: workflow shell lint gate（actionlint）を追加した際、既存 `ci.yml` の actionlint target list に新規 `verify-workflow-doc-refs.yml` を加える反映が漏れる可能性があった。target list が手書き列挙のため、新 workflow を追加するたびに drift が発生する構造になっていた。
- **根本原因**: `ci.yml` の actionlint job が `*.yml` glob ではなく明示列挙を採用していたのは、actionlint 出力 noise を抑制し focused workflow set のみ strict gate するため。設計上の trade-off だが、新規 workflow 追加時の sync が手作業に依存していた。
- **対応**: 本 workflow で `verify-workflow-doc-refs.yml` を `ci.yml` の actionlint target list に追加。Phase 11 で `actionlint` evidence (`outputs/phase-11/evidence/actionlint.txt`) を取得し exit 0 を固定。新規 workflow 追加チェックリストを `task-workflow-active.md` に「新 workflow YAML 追加時は `ci.yml` actionlint target list へ追記」として明記。
- **再発防止**: 中期的には `ci.yml` actionlint step を「全 `.github/workflows/*.yml` を対象にして既知の noise だけ ignore rule で抑制」する形へ移行検討（本タスクの scope-out）。短期は task-workflow-active.md のチェックリスト + Phase 11 evidence の actionlint exit 0 で gate する。
- **関連 reference**: `deployment-gha.md`（actionlint scope policy）、本 lessons L-CRSSSR-001（doc-ref guard の similar target list 設計）。

## Secret Boundary 三層構造（L-CRSSSR-004 派生・参照用）

| 層 | 対象 secret | 検証方法 | 失敗時の挙動 |
| --- | --- | --- | --- |
| Provisioning inventory | `STAGING_API_BASE` / `STAGING_ADMIN_BEARER` / `STAGING_MEMBER_ID` / `STAGING_ME_BEARER` / `SLACK_WEBHOOK_INCIDENT` の 5 個 | `gh api repos/.../environments/staging-runtime-smoke/secrets --jq '.secrets[].name'` で name-only inventory | オペレータが追加投入（user-gate） |
| Smoke pre-flight early-fail | 上記から `SLACK_WEBHOOK_INCIDENT` を除く 4 個 | `runtime-smoke-staging.yml` の pre-flight `[ -n "$VAR" ]` boolean check | smoke 起動前に fail-loud（どの secret が欠落かを明示露出） |
| Slack post-step guard | `SLACK_WEBHOOK_INCIDENT` のみ | `if: ${{ failure() && hashFiles('ci-evidence/summary.json') != '' }}` | post step が skip され smoke 本体結果に影響しない |

## Mutation user-gate 境界

`artifacts.json#metadata.governance_mutation_user_gate=true` により以下は user 明示承認後のみ実行：

- `gh secret set ... --env staging-runtime-smoke`（5 命令）
- `gh workflow run runtime-smoke-staging.yml --ref dev`

read-only evidence（`bash scripts/ci/verify-workflow-doc-refs.sh` / 同 test / `gh api ... secrets --jq '.secrets[].name'`）は pre-gate でも取得可能。secret 値そのものは絶対に doc / log / commit に残さない（`MEMORY.md#feedback_no_doc_for_secrets.md` 不変条件）。

## 関連リソース

- workflow root: `docs/30-workflows/completed-tasks/ci-runtime-smoke-staging-secrets-recovery/`
- predecessor workflow: `docs/30-workflows/completed-tasks/ci-secret-alignment-and-runtime-smoke-recovery/`
- artifact inventory: `workflow-ci-runtime-smoke-staging-secrets-recovery-artifact-inventory.md`
- changelog: `.claude/skills/aiworkflow-requirements/changelog/20260515-ci-runtime-smoke-staging-secrets-recovery.md`
- references: `deployment-secrets-management.md`, `deployment-gha.md`, `legacy-ordinal-family-register.md`, `task-workflow-active.md`
- 関連 lessons-learned: `lessons-learned-ci-pipeline-recovery-2026-05.md`（L-CIPR-006 / L-CIPR-008 / L-CIPR-009 系譜）
- 主要成果物: `scripts/ci/verify-workflow-doc-refs.sh`, `scripts/ci/__tests__/verify-workflow-doc-refs.spec.sh`, `.github/workflows/verify-workflow-doc-refs.yml`
