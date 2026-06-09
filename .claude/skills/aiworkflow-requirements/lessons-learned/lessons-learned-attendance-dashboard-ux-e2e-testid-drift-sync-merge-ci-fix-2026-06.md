---
task: branch-sync (dev → feature) e2e testid/DOM drift CI fix
recorded: 2026-06-09
topics: [ci-cd, branch-sync, merge-conflict, e2e, playwright, testid, ux-refactor, semantic-conflict]
related-references:
  - .claude/skills/aiworkflow-requirements/lessons-learned/lessons-learned-public-header-auth-slot-e2e-sync-merge-ci-fix-2026-05.md
  - .claude/skills/aiworkflow-requirements/lessons-learned/lessons-learned-dev-merge-ci-gates-2026-05.md
  - .claude/skills/task-specification-creator/lessons-learned/dev-sync-merge-conflict-resolution.md
classification: [operations/branch-sync, ci-cd/required-status-checks, testing/e2e-semantic-conflict]
---

# Lessons Learned — dev sync merge で顕在化する e2e testid / DOM 構造 drift の CI fix（2026-06-09）

`feat/admin-attendance-dashboard-ux-spec` へ `origin/dev` を取り込んだ後、`git merge` は
**コンフリクト 0・`pnpm typecheck` / `pnpm lint` / `verify-pr-ready.sh`（phase12-compliance /
gate-metadata / indexes drift）すべて緑**だったにもかかわらず、push 後の CI で
`e2e-tests-coverage-gate`（`e2e (desktop-chromium / mobile-webkit / desktop-firefox)` 3 matrix）
だけが fail した。`L-PHAS-CI-002`（middleware authz レスポンス変更 × dev 側 e2e の 403 期待）と
同じ「sync-merge でしか顕在化しない semantic conflict」の **DOM 構造 / data-testid drift 変種**を
1 件解消したので L-E2EDRIFT-001 として記録する。

## L-E2EDRIFT-001 — dev 側 e2e が assert する `data-testid` / ラベルを feature 側 UX リファクタが改名したら同一 sync-merge 内で spec を追従させる

**Rule:** feature ブランチが既存コンポーネントの `data-testid` / 見出しラベル / DOM 構造を
リファクタ（本件は出席ダッシュボードを PRIMARY/TREND/DETAIL の 3 層へ再構成し、旧
`attendance-kpi-unique` カード（ラベル「期間内出席者数」）をプライマリカード
`attendance-kpi-rate` の support 行「ユニーク出席率」へ統合）した場合、dev 取り込みで
合流してくる **別ブランチ由来の e2e spec** が旧 testid / 旧ラベルを assert していないかを
`git grep` で洗い出し、**同一 sync-merge コミット内で spec を新構造へ追従**させる。
このとき元 spec の検証意図（本件は issue #1101 の算出補正＝ユニーク出席者数 24 / 出席率
80.0% / zone「100 回以上」が正しく表示される、という calc-correctness ガード）を壊さず、
**同じ値を新しい testid 位置で assert し直す**。値そのものは変えない。

**Why:**
- feature 単体 commit の時点では dev 側 e2e（`issue-1101-attendance-analytics-calc-correction.spec.ts`）
  がまだ feature ブランチに無いため気付かない。dev sync merge で初めて
  「component: 新 testid（feature 側）」×「e2e: 旧 testid 期待（dev 側）」の
  semantic conflict が顕在化する。
- `pnpm sync:resolve` の union/ours は **構文衝突しか解消しない**。両ファイルが別ディレクトリで
  git conflict すら起こさないため `git ls-files -u` も 0 のまま通る。
- `pnpm typecheck` / `pnpm lint` は testid 文字列の不一致を型エラーにできない
  （`getByTestId('attendance-kpi-unique')` は文字列リテラルで合法）。
- 結果として **手元すべて緑 → CI の e2e job だけ FAIL** が成立する。`verify-pr-ready.sh` は
  e2e を回さないので pre-flight でも拾えない。

**How to apply:**
1. UX リファクタや shell/レイアウト改修で `data-testid` を改名・削除・移設する PR では、
   変更前に repo 全体（dev に既着の spec も含む想定で）を grep する:
   ```bash
   git grep -nE "getByTestId\('(<旧testid>)'\)|<旧ラベル文字列>" apps/web/playwright/
   ```
   本件なら `attendance-kpi-unique` / `期間内出席者数`。ヒットした spec を同一 commit で更新する。
2. dev sync merge 後は typecheck / lint だけで push せず、差分（`git diff --name-only dev...HEAD`）に
   **コンポーネントの testid / ラベルを触る変更**が含まれる場合、合流した
   `apps/web/playwright/tests/*.spec.ts` を必ず grep 検査する。とくに同じ画面ルート
   （本件 `/admin/dashboard/attendance`）を触る複数ブランチが並走しているときは要注意。
3. spec 修正は **検証意図を保存**する。testid を付け替えるだけで値（`24` / `80.0%` / zone ラベル）の
   assert は残し、元 spec が守っていた回帰（issue #1101 の算出補正）を引き続きガードする。
   何を assert していたかは元 spec の describe/コメントから読み取り、コメントで移設理由を残す。
4. 修正後は CI を待たず **該当 spec をローカルで実機検証**する。dev サーバを playwright と同じ env で
   先に起動 → `reuseExistingServer`（非 CI 時 true）で reuse させると 120s webServer build
   timeout を回避できる:
   ```bash
   # 1) 別シェルで dev サーバ起動（playwright.config.ts localEnv と同じ env）
   ENVIRONMENT=local PLAYWRIGHT_TEST=1 NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8787 \
   PUBLIC_API_BASE_URL=http://127.0.0.1:8787 INTERNAL_API_BASE_URL=http://127.0.0.1:8787 \
   AUTH_URL=http://localhost:3000 AUTH_SECRET=playwright-e2e-auth-secret-32-bytes PORT=3000 \
   mise exec -- pnpm --filter @ubm-hyogo/web dev:webpack
   # 2) Ready 後、apps/web から該当 spec のみ実行
   PLAYWRIGHT_BASE_URL=http://localhost:3000 mise exec -- npx playwright test \
     playwright/tests/<spec>.spec.ts --project=desktop-chromium
   ```

## L-E2EDRIFT-001-A — ローカル e2e の副作用生成物はコミットしない（monocart / screenshots / 旧 PHASE11_DIR）

**Rule:** ローカルで e2e を 1 本回すと monocart reporter が完了済タスクの evidence dir
（本件 `docs/30-workflows/completed-tasks/08b-A-playwright-e2e-full-execution/outputs/phase-11/evidence/`）を
書き換え、spec の `PHASE11_DIR`（writeFile/screenshot 出力先）が untracked dir を生む。
commit 前に **spec 変更のみ**を残し、これら生成物は `git checkout --` / `git clean -fdq` で破棄する。

**Why:** monocart の index.html/json・playwright-report は実行ごとに変わる巨大 diff で、
PR に混ぜると無関係ノイズになる。とくに spec の `PHASE11_DIR` が close-out 前の旧パス
（本件 `docs/30-workflows/issue-1101-...`／canonical は `completed-tasks/issue-1101-...`）を
指していると untracked screenshots が生まれる。これは CI 失敗の原因ではなく、CI では
artifact upload されるだけでコミットされないため放置可。最小差分を保つこと。

**How to apply:**
```bash
git checkout -- docs/30-workflows/completed-tasks/<...>/outputs/phase-11/evidence/...   # tracked 生成物を復元
git clean -fdq docs/30-workflows/<旧PHASE11_DIR の親>                                    # untracked 生成物を削除
git status --porcelain   # spec の 1 行だけ残ることを確認
```

## Anti-patterns

1. dev sync merge が conflict 0・typecheck/lint 緑だったので「CI も通る」と判断して push する
   （e2e semantic conflict は手元のどの pre-flight でも拾えない）。
2. testid を改名する PR で、dev に既着かもしれない e2e spec を grep せず feature 単体テストだけ確認する。
3. e2e fail を「flaky」と決めつけて再実行で済ませる（本件は決定的な testid 不一致＝再実行で直らない）。
4. spec を新 testid に追従させる際、元の値 assert（`24` / `80.0%`）まで消して検証意図を失う。
5. ローカル e2e 実行で出た monocart / screenshots を spec 修正と一緒にコミットする。
