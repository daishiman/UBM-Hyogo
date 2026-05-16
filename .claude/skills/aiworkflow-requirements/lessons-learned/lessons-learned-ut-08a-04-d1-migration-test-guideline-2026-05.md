# Lessons Learned — UT-08A-04 D1 Migration Test Guideline（2026-05-15）

> task: `ut-08a-04-d1-migration-test-guideline`
> 関連 spec: `docs/30-workflows/ut-08a-04-d1-migration-test-guideline/outputs/phase-12/implementation-guide.md`、`docs/30-workflows/ut-08a-04-d1-migration-test-guideline/outputs/phase-12/system-spec-update-summary.md`
> 関連 source: `apps/api/migrations/README.md`、`.github/workflows/d1-migration-verify.yml`、`scripts/d1/__tests__/migration-guideline-presence.bats`、`docs/30-workflows/runbooks/d1-migration-test-guideline.md`
> 関連 reference: `task-workflow-active.md`（UT-08A-04 行）、`workflow-ut-08a-04-d1-migration-test-guideline-artifact-inventory.md`
> 上流: 08a parallel API contract / repository / authorization tests → UT-08A unassigned ledger → Issue #323 successor

## 教訓一覧

### L-UT08A04-001: runtime-pending boundary を `workflow_state` の root と metadata 双方に明記して PR comment URL evidence を Phase 13 へ分離する

- **背景**: 本タスクは bats / yml / runbook までは Phase 11 local で検証可能だが、guarded PR reminder comment の **実 post URL** は GitHub Actions が PR 上で動いて初めて取得できる。Phase 11 evidence にこの URL を要求すると永久に close できず、逆に Phase 11 を free-pass にすると runtime-pending 状態が見えなくなる。
- **苦戦点**: artifacts.json の `workflow_state` を `implemented_local` にすると runtime evidence が完了したと誤読され、`runtime_pending` だけだと local 実装まで終わっていないように見える。Phase 11 と Phase 13 が evidence を取り合う形になった。
- **解決アプローチ**:
  - artifacts.json の root `workflow_state` と `metadata.workflow_state` の **両方** に `implemented_local_runtime_pending` を明示。
  - Phase 11 evidence は 4 ファイル（bats result / runbook evidence / yml diff / `ci-comment-static-evidence.log`）に限定。
  - 実 PR comment URL は Phase 13 の `outputs/phase-13/ci-comment-evidence.md`（user-gated）に分離する旨を implementation-guide / system-spec-update-summary 双方に書き込み、両ドキュメントの drift を防止。
- **将来同等課題への適用ヒント**: CI が PR 上でしか動かない種類の reminder / comment / status check を含むタスクは、Phase 11 を「static analysis evidence」、Phase 13 を「runtime URL evidence」と evidence boundary を最初に固定する。`implemented_local_runtime_pending` を 5 段階 close-out 判定の標準値として再利用する（L-08AB-006 参照）。

### L-UT08A04-002: PR comment step は 4 つの非ブロッキング条件を同一 step に同居させる必要がある

- **背景**: guarded PR reminder comment は「migration ファイルが PR diff に含まれる時だけ」「verify job を fail させずに」「同一 PR で重複しない」「再実行で内容更新可能」という 4 条件を同時に満たす必要がある。条件が分散すると step が肥大化し、片方の条件を満たすともう片方が壊れる典型的なトレードオフが発生した。
- **苦戦点**:
  1. `permissions` を job 全体に書くと verify job の他 step に過剰権限が伝播するリスク。
  2. `continue-on-error: true` を付け忘れると octokit エラーで verify job が落ちる。
  3. `files` API の page 切れで migration file が見落とされる。
  4. marker 文字列が body 内に複数現れると update fallback が誤ヒット。
- **解決アプローチ**:
  - workflow file 単位で `permissions: pull-requests: write` を追加し、scope を最小化。
  - comment step に `if: always() && github.event_name == 'pull_request'` と `continue-on-error: true` を併記して **non-blocking** を保証。
  - file filter は `files.some(f => f.filename.startsWith('apps/api/migrations/'))` を `paginate` 経由で取得し、page 切れを防止。
  - marker は **HTML コメント** 形式（`<!-- ut-08a-04-d1-migration-reminder -->`）にして本文先頭固定で配置、`comments.listForPullRequest` → marker hit → `comments.updateComment` の fallback で重複防止。
- **将来同等課題への適用ヒント**: CI から PR にメッセージを書き込む step を実装する時は、上の 4 条件を **チェックリスト化**して同一 step 内で satisfy する。`permissions` は workflow-level に上げず、必要 job だけに付与。marker は必ず HTML コメントで body 先頭固定にする。

### L-UT08A04-003: 02b miniflare suite を initial schema 専用にロックし、後続 migration test の責任移譲を runbook で固定する

- **背景**: 02b で導入済みの miniflare-based D1 schema integration suite に、今後の migration ごとに test を継ぎ足していくと、schema drift が起きた時に「02b suite が落ちたのか / 当該 migration task が責務を果たさなかったのか」の責任所在が曖昧になる。
- **苦戦点**: 02b suite が "全 migration の health check" を兼ねる構造になると、新 migration を追加するたびに 02b の AC が肥大化し、Phase 12 compliance check で 02b 側の不整合が頻発する。逆に各 task に丸投げすると、初期 schema の baseline が誰の管轄か分からなくなる。
- **解決アプローチ**:
  - `docs/30-workflows/runbooks/d1-migration-test-guideline.md` の §Scope に「**02b miniflare suite は initial schema baseline 専用**」と明記。
  - 後続 migration test の追加責任は **各 migration task** に明示移譲（runbook の §Responsibility Matrix で 02b vs per-migration を 2 列で対照表化）。
  - migration README （`apps/api/migrations/README.md`）からこの runbook をリンクし、PR reminder comment にも runbook URL を含めて発見可能性を確保。
- **将来同等課題への適用ヒント**: integration suite を "baseline 専用" と "増分 evolution 用" に最初から分離する。runbook で responsibility matrix を 2 列以上で書き、AC のスコープ漏れを Phase 2 の段階で塞ぐ。同様の責任移譲パターンは E2E quality uplift Stage 2 / migration / observability で再利用可能。

### L-UT08A04-004: Phase 11 NON_VISUAL evidence は 4 ファイル分割 + Phase 13 URL evidence の二段構成にする

- **背景**: 本タスクは UI を持たない governance / runbook 整備タスクのため、Phase 11 に screenshot は不要。ただし「evidence が 0」と扱うと PR レビュー時に何を見れば良いかわからず、逆に "全部 phase-11 に詰め込む" と PR comment URL のような runtime 限定 evidence の到達日が永遠に来ない。
- **苦戦点**: NON_VISUAL タスクの evidence file 構造を都度 ad hoc で決めると、後続タスクが同じ構造を再発明し、レビュー側も毎回読み方を学習し直すコストが発生する。
- **解決アプローチ**:
  - Phase 11 evidence を以下 4 ファイルに**分割**して `outputs/phase-11/evidence/` 直下に固定:
    1. `bats-result.log`（`scripts/d1/__tests__/migration-guideline-presence.bats` の出力）
    2. `runbook-evidence.md`（runbook 内容と migration README link の整合 grep 結果）
    3. `yml-diff.patch`（`.github/workflows/d1-migration-verify.yml` の追加差分）
    4. `ci-comment-static-evidence.log`（comment step の static dry-run / actionlint 結果）
  - Phase 13 で `outputs/phase-13/ci-comment-evidence.md` を user-gated evidence として後追い追加する旨を implementation-guide に明示。
  - artifacts.json の `evidence_split_strategy` フィールド（または equivalent metadata）に "phase-11: static / phase-13: runtime-url" の二段構成を記録。
- **将来同等課題への適用ヒント**: NON_VISUAL governance / runbook / CI 増分タスクの evidence は「Phase 11 static evidence（最大 4 ファイル）+ Phase 13 runtime URL evidence」の二段構成を標準フォーマットとする。同パターンは branch-protection apply / verify-gate-metadata / migration verify など runtime-pending を含む governance 系で広く使える。

## 横断的 takeaway

- runtime-pending を含むタスクは **Phase 11 / Phase 13 の evidence boundary を Phase 2 設計時点で固定**する。後付けで分離しようとすると artifacts.json と implementation-guide の drift が必発する。
- CI workflow に 1 step 追加するタスクでも、`permissions` / `continue-on-error` / file filter / marker dedup の 4 条件は最初から **チェックリスト化**して同居設計する。
- integration suite は "baseline 専用" と "増分用" を runbook の responsibility matrix で必ず明示分離する。
- NON_VISUAL タスクの Phase 11 evidence は **4 ファイル分割パターン**（test result / runbook grep / yml diff / static dry-run）を default テンプレートとする。
