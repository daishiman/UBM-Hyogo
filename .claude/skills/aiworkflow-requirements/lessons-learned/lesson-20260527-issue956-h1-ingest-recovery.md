# Lessons Learned — Issue #956 H1 ingest recovery runbook 化（2026-05-27）

> task: `issue-956-h1-ingest-recovery`
> 関連 workflow: `docs/30-workflows/completed-tasks/issue-956-h1-ingest-recovery/`
> 関連 unassigned-task (consumed): `docs/30-workflows/completed-tasks/issue-956-h1-ingest-recovery/unassigned-task-specs/google-form-reflection-diagnostics-followup-001-h1-ingest-recovery.md`
> 関連 skill 反映: `.claude/skills/aiworkflow-requirements/changelog/20260527-issue956-h1-ingest-recovery.md`
> 関連 inventory: `references/workflow-issue-956-h1-ingest-recovery-artifact-inventory.md`

## 背景

Issue #956（H1 ingest 未稼働解消）は GitHub 上で既に CLOSED だったが、production runtime での recovery 実行手順と evidence boundary が canonical workflow として未登録だった。診断 endpoint / cron / sync-lock TTL / classifier の **実装本体は parent workflow `google-form-reflection-diagnostics` で完了済み** のため、今回の wave は「実装 task」ではなく「runtime-ops runbook 化 + evidence-dependent followup boundary 確定」になる。`docs-only / NON_VISUAL / spec_created` のまま production mutation を一切伴わずに strict 7 + Phase 11 pending ledger を整備した。

苦戦どころは次の 3 点に集約される:

1. **「closed + parent 実装済み」状態で何を作るべきか判断しづらい**: 実装 diff が無いため「workflow 不要では?」と判断しがちで、runbook canonicalization の必要性を見落としやすい。
2. **runtime-dependent followup の起票境界が曖昧**: stale lock 自動 abort / classifier 拡張 / TTL チューニングは production runtime evidence が出現してから初めて確定する課題で、speculative に起票すると backlog 汚染、未起票で放置すると runtime 発火時に skip される。
3. **source unassigned task の扱い**: 既存 proto-spec を削除すると issue 本文リンクが dead link 化し、削除せず放置すると重複実行のリスクが残る。

## 教訓一覧

### L-I956-001: closed issue + parent 実装済み でも runtime ops runbook は canonical workflow として独立化する

- **背景**: 実装 diff が無いため「不要 workflow」と誤判断しやすいが、production で secret 投入 / cron 観測 / D1 SELECT/UPDATE を「次に誰が」「どの順で」「何を evidence として残して」実行するかが skill 側で参照できないと、recovery 操作が ad-hoc 化し evidence が散逸する。
- **教訓**: parent workflow が実装責務を持ち、子 workflow が runtime ops responsbility を持つ場合、子は `docs-only / NON_VISUAL / runtime-ops-runbook` として独立 canonical root を持たせる。`implementation_files: []` / `test_files: []` を明示し、`implementationCategory: runtime-ops-runbook` を artifacts.json metadata に置く。Phase 5 は「実装手順」ではなく「runtime 実行手順 + redaction 契約」を記述する。
- **将来アクション**: task-specification-creator skill の patterns-lessons に「runtime-ops-runbook 子 workflow」パターンを追記し、`implementation_files` 空配列 + `runtime_boundary` 明示 + parent 実装 workflow への pointer を必須項目化する。

### L-I956-002: runtime-dependent followup は「観測で初めて確定」境界を spec に書き込む

- **背景**: H1 recovery 系には stale lock 自動 abort / classifier 拡張 / sync-lock TTL チューニング のような「runtime 発火しないと真に必要か分からない」候補が複数存在する。speculative に起票すると backlog 汚染、未起票で放置すると runtime 発火時に skip されるリスクが残る。
- **教訓**: Phase 12 unassigned-task-detection で候補を**列挙したうえで `Not created — runtime evidence dependent` と decision を明記**する。同一 detection 表に「if observed during the approved runtime cycle, escalate or formalize before close-out」の運用契約を併記する。spec_created の段階では 0 件、runtime 発火後に escalation gate で再評価。
- **将来アクション**: task-specification-creator の `unassigned-task-detection.md` template に `runtime-evidence-dependent` decision 列と escalation 契約行を組み込む。observation-then-formalize の運用 hook を quick-reference に登録する。

### L-I956-003: source unassigned proto-spec は `status: consumed` + canonical pointer で物理保持

- **背景**: GitHub issue 本文や parent workflow Phase 12 detection report は unassigned task ファイルへの相対リンクを保持しているため、物理削除すると dead link が永続化する。一方、状態未更新で放置すると AI agent が再度「未着手 task」と誤解し重複 workflow を生成する。
- **教訓**: unassigned task は **削除せず**、frontmatter に `status: consumed` / `canonical_workflow: docs/30-workflows/<id>/` / `consumed_at: <date>` / `issue_reference_mode: refs-only` を追記し、本文冒頭に canonical workflow への pointer 行を残す。index walker は `status: consumed` を skip 対象として扱う。
- **将来アクション**: `references/deployment-secrets-management.md` または unassigned-task 運用 reference に「consumed pointer 契約」を明示し、`docs/30-workflows/unassigned-task/` 内の `status: consumed` ファイルは active 候補 listing から自動除外する gate を追加検討する。

### L-I956-004: runtime PASS は AC-1..AC-6 物理 evidence 出現まで claim 禁止

- **背景**: `spec_created` 段階で runtime ops 手順を整備したことを「workflow 完了」と誤って report しがち。production secret 投入や D1 mutation が未実行のまま `workflow_state` を `completed` に進めると evidence-less PASS となり、skill 正本性が壊れる。
- **教訓**: Gate-B / Gate-C は `outputs/phase-11/snapshot-after.json` と `snapshot-diff.md` の物理ファイル存在 + AC-1..AC-6 mapping を必須条件とし、未充足の間は `pending` 固定。`runtime PASS is not claimed` を Phase 12 main.md / inventory / compliance-check 全てで一貫表記する。
- **将来アクション**: `verify:phase12-compliance` 系 gate に「runtime-ops-runbook かつ Gate-B/C pending の workflow は `workflow_state ∈ {spec_created, runtime_pending_user_approval}` のみ許容」のチェックを追加検討する。

### L-I956-005: redaction 契約 — secret 値 / token preview / D1 行内容は evidence に転写しない

- **背景**: Cloudflare secret 投入 / cron tail / D1 SELECT の生出力には service-account local part、token preview、回答者メールアドレス（responder email）等の機密情報が含まれる可能性が高い。Phase 11 evidence ledger 整備時に「とにかく出力を貼る」方向に流れると、機密が docs/ にコミットされる事故が起きる。
- **教訓**: evidence には **secret 名 / exit code / row count / cron next-run timestamp のみ** を残し、token 値・OAuth token file path・service-account local part・responder email・回答本文は `<REDACTED>` 表記で残す。Phase 11 ledger の各行に redaction 規約を明記し、`scripts/verify-redaction.sh` 仮称で `docs/30-workflows/issue-956-*` 配下を grep する future gate を提案する。
- **将来アクション**: `references/deployment-secrets-management.md` の redaction contract セクションに上記 5 種（secret 値 / token preview / SA local part / responder email / 回答本文）を「evidence 禁止情報」として追記する。
