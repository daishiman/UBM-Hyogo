# Lessons Learned: task-709 visual baseline runtime capture

task-18-fu の Playwright visual-full インフラを引き継ぎ、17 routes × 3 viewports = 51 baseline PNG の runtime 取得・取り込み・stability evidence・PR 作成 (`PR #760`) までを user-gated boundary で実施した。merge は PR DIRTY のため未完。本 lessons-learned は次回類似タスクで同じ苦戦を最短で抜けるための知見集。

## L-709-001: Actions の PR 書き込み権限失敗は branch push 済みなら cherry-pick で scope 最小化できる

`peter-evans/create-pull-request@v7` の baseline 自動 PR step が `GitHub Actions is not permitted to create or approve pull requests` で失敗した。ただし baseline branch (`chore/visual-baseline-update-25960870639`) と 51 PNG commit (`b3fb7f4a`) は push 済みだったため、task branch から `git cherry-pick b3fb7f4a` のみで取り込み、dev の追加コミットを巻き込まず scope を 51 PNG だけに絞れた。

**Why:** 自動 PR 経路に固執して再ラン待ちすると、その間に dev が進んで取り込み範囲が広がり、PR diff の主題が薄まる。push 済みなら commit hash 単位で cherry-pick した方が早く・きれい。

**How to apply:** `VISUAL` evidence を伴う baseline 自動化 workflow を新設するときは Phase 2 design 時点で「Actions PR-write 権限不在時の代替経路 = cherry-pick from baseline branch」を recovery path として明記。事後対応として repository settings → Actions → *Allow GitHub Actions to create and approve pull requests* の有効化も follow-up に積む。

## L-709-002: visual-full stability は workflow_dispatch 2 連続 PASS を Phase 11 evidence にする

`pull_request` トリガーを活性化する前に、`workflow_dispatch` で同一 baseline に対して 2 連続 run (`25961476237` / `25961551972`) を PASS させ、`outputs/phase-11/evidence/visual-full-stability.md` に run id を記録した。これで PR run の noise (font / time fluctuation) を排除できているという根拠が残る。

**Why:** baseline 取得直後の PR run は flaky 検出には不十分。同一 baseline で 2 連続 PASS して初めて「真の visual regression のみが diff として現れる」と言える。

**How to apply:** `VISUAL` evidence を必要とするタスクの Phase 11 では、`workflow_dispatch` で 2 run 以上の green を取り、run id と sha を `evidence/visual-full-stability.md` に記録することを必須化する。1 run しか取らない設計は Phase 12 strict 4 条件で reject。

## L-709-003: baseline 51 PNG の sha256 と count は Phase 11 evidence に固定する

`outputs/phase-11/evidence/baseline-list.md` に 51 PNG の path + sha256 を inventory として固定し、`outputs/phase-11/evidence/baseline-import-log.md` に cherry-pick commit hash を記録した。`expectedBaselineCount = EXPECTED_VISUAL_ROUTE_COUNT * 3` の不変条件と突合できる。

**Why:** baseline は CI runner OS に依存するため、後から「同じ環境で生成された 51 枚か」を再現確認できる証跡が必要。count だけだと改変検出ができず、sha256 だけだと欠落検出ができない。

**How to apply:** visual baseline を追加・更新するタスクでは Phase 11 evidence に「count + path + sha256」の 3 点セットを必ず置く。task-specification-creator の Phase 11 テンプレに `baseline-list.md` schema として組み込み済みであることを確認すること。

## L-709-004: PR が `mergeStateStatus=DIRTY` のまま着地する場合は `PR_OPEN_MERGE_DIRTY` を workflow_state に明示する

PR #760 は base (`dev`) との競合が解消できておらず `DIRTY` のまま PR 作成段階で着地した。`artifacts.json` の `metadata.workflow_state = PR_OPEN_MERGE_DIRTY`、`implementation_status = baseline_and_stability_evidence_captured_pr_open_merge_dirty` として明示し、Phase 13 を `completed_with_merge_dirty` で記録した。「PR があるから merged 相当」と誤読されるのを防ぐ。

**Why:** `PR_OPEN` だけだと「merge ready」と区別できず、後続タスクが parity 確認で誤判定する。merge-readiness の boundary を語彙レベルで分ける必要がある。

**How to apply:** PR 作成直後に `gh pr view --json mergeStateStatus` を取得し、`CLEAN` 以外は `PR_OPEN_MERGE_<STATE>` を workflow_state に挿入する規約を Phase 13 で適用。`PR_OPEN_MERGE_DIRTY` は task-specification-creator の許容語彙に登録済み。

## L-709-005: branch protection required check への昇格は別 follow-up task として formalize する

51 baselines と 2-run stability が green になっても、`playwright-visual-full` job を dev/main の required check に追加するには `gh api -X PUT repos/.../branches/.../protection` の governance mutation が必要で、別 evidence cycle (read-only before / user-approval marker / rollback boundary) を要する。task-709 内では混ぜず、`docs/30-workflows/unassigned-task/task-709-fu-branch-protection-required-check.md` として formalize した。

**Why:** runtime capture と governance mutation は user-gate の性質が違う。1 つの PR で混ぜると承認単位が曖昧になり、rollback boundary も巻き戻し範囲が大きくなる。

**How to apply:** required check 昇格は常に runtime evidence 完了後の独立 follow-up として切る。UT-GOV 系の既存ルール (CLAUDE.md branch strategy 節) と整合する形で `unassigned-task/` 配下に置く。task-709-fu はこの follow-up の正本。
