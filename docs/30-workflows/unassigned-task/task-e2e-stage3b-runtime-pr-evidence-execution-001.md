# 3b e2e-tests-coverage-gate runtime PR 観測 + Phase-11 evidence 取得 - タスク指示書

## メタ情報

| 項目             | 内容                                                                                |
| ---------------- | ----------------------------------------------------------------------------------- |
| タスクID         | task-e2e-stage3b-runtime-pr-evidence-execution-001                                  |
| タスク名         | 3b e2e-tests-coverage-gate runtime PR 観測 + Phase-11 evidence 取得                 |
| 分類             | runtime evidence / CI 観測 / Phase-11 close-out                                     |
| 対象機能         | `feat/e2e-coverage-gate` PR + `e2e-tests-coverage-gate` workflow runtime evidence    |
| 優先度           | HIGH                                                                                |
| 見積もり規模     | 小〜中規模                                                                          |
| ステータス       | 未実施 (proposed / IMPLEMENTED_LOCAL_RUNTIME_PENDING)                               |
| 親タスク         | e2e-quality-uplift-stage-3-impl / 3b-e2e-tests-hard-gate                            |
| サブタスク識別子 | Stage 3b runtime evidence subtask                                                   |
| taskType         | runtime-evidence                                                                    |
| visualEvidence   | NON_VISUAL                                                                          |
| 発見日           | 2026-05-10                                                                          |
| 発見元           | 3b/outputs/phase-12/main.md `IMPLEMENTED_LOCAL_RUNTIME_PENDING`                     |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

e2e-quality-uplift Stage 3 サブタスク 3b（`task-e2e-stage3b-e2e-tests-hard-gate-001`）は実装フェーズが完了しており、`outputs/phase-12/main.md` で `state: implemented-local / IMPLEMENTED_LOCAL_RUNTIME_PENDING` として close-out されている。実コード（`.github/workflows/e2e-tests.yml` / `apps/web/playwright.config.ts` / `apps/web/src/lib/fetch/public.ts` / `scripts/coverage-gate-e2e.sh` / `scripts/e2e-mock-api.mjs` / `apps/web/package.json` / `pnpm-lock.yaml`）は `feat/e2e-coverage-gate` ブランチ上に揃っている。

一方で 3b の Phase 11 が要求する **draft PR を起点とした実 CI run の観測 + artifact 取得 + evidence ファイル一式の commit** は user-gated として残置されており、`docs/30-workflows/e2e-quality-uplift-stage-3-impl/3b-e2e-tests-hard-gate/outputs/phase-11/` 配下に canonical evidence が揃っていない状態である。

### 1.2 問題点・課題

- 3b/phase-11.md §3 が要求する B-01..B-07 の 7 種類 runtime evidence（`pr-b-url.txt` / `pr-b-e2e-run.txt` / `coverage/summary/coverage-summary.json` / `coverage-line-pct.txt` / `monocart/index.html` / `coverage-summary.json` / `server-fetch-mock-evidence.md`）が未取得。
- 3b/phase-11.md EX-02（Step 3-5 で green run 観測 + line.pct >= 80）、EX-04（HTML report 条件付き artifact 確認）、EX-05（evidence §6 全件揃い）が未達。
- 3c branch protection 適用は本 PR merge 後に `e2e-tests-coverage-gate` context が GitHub check-runs に登録されたことを `gh api repos/.../check-runs` で確認するのが前提となるため、本 runtime 完了が下流タスクの blocker になっている。
- ローカル fixture（`scripts/__tests__/coverage-gate-e2e.fixture/{pass,fail-79,missing}/`）の単体検証は通過しているが、CI 上で実際に green になることが観測されていないため、`monocart-reporter` と `c8` の v8 coverage 集計が CI ランナー（GitHub Actions ubuntu-latest）で再現するかが未検証。

### 1.3 放置した場合の影響

- 3c branch protection への required check `e2e-tests-coverage-gate` 追加が永久に着手不能（context 未登録の状態で required 化すると PR 永久 pending を招くため）。
- 3b の `state: implemented-local` がいつまでも `runtime / closed` に昇格せず、Stage 3 全体の close-out が滞る。
- CI runtime で fail した場合に検出するべき regression（Server Component server-side fetch の mock 経路、reporter 出力 path、`PLAYWRIGHT_EVIDENCE_DIR` の整合）を発見する機会が失われ、後続 PR で混入する可能性。
- coverage 80% baseline を CI 実 run で機械的に保証していない期間が伸び、`quality-gates.md §7.5` standard tier に対する drift が累積する。

---

## 2. 何を達成するか（What）

### 2.1 目的

`feat/e2e-coverage-gate` から dev 向け draft PR-B を作成し、`e2e-tests-coverage-gate` job の green run を観測した上で、3b/phase-11.md §3 / §6 が要求する canonical evidence 7 ファイルを `docs/30-workflows/e2e-quality-uplift-stage-3-impl/3b-e2e-tests-hard-gate/outputs/phase-11/` 配下に commit する。これにより 3b/phase-12 を `state: runtime-closed` に昇格させ、3c の前提条件（`e2e-tests-coverage-gate` context 登録）を整える。

### 2.2 最終ゴール（AC 引用）

`docs/30-workflows/e2e-quality-uplift-stage-3-impl/3b-e2e-tests-hard-gate/phase-11.md` の終了基準を引用する。

- **EX-02**: Step 3-5 で `e2e-tests-coverage-gate` の green run 観測 + `line.pct >= 80` を `coverage-line-pct.txt` で記録。
- **EX-03**: Step 6 オプション A（fixture）または B（実 CI fail）で `coverage<80%` 時に exit 1 となることを記録（既にローカル T-3b-6 で達成済み・evidence ファイルへ転記）。
- **EX-04**: Step 7 で green / failure 別の HTML report artifact 有無が確認され `html-report-conditional-evidence.md` に記録。
- **EX-05**: §6 の evidence 一覧（最小 7 ファイル）が outputs/phase-11/ に commit 済み。

### 2.3 検証エビデンス

| # | ファイル | 由来 |
|---|---------|------|
| E-01 | `outputs/phase-11/pr-b-url.txt` | B-01 `gh pr create --base dev --draft` の URL |
| E-02 | `outputs/phase-11/pr-b-e2e-run.txt` | B-02 `gh run view <run-id> --json conclusion,status,url,headSha` |
| E-03 | `outputs/phase-11/coverage/summary/coverage-summary.json` | B-03 `gh run download --name e2e-coverage-<sha>` |
| E-04 | `outputs/phase-11/coverage-summary.json` | B-06 直配置 copy |
| E-05 | `outputs/phase-11/coverage-line-pct.txt` | B-04 `jq '.total.lines.pct'` 抽出値（`>= 80`） |
| E-06 | `outputs/phase-11/monocart/index.html` | B-05 `gh run download --name e2e-monocart-<sha>` |
| E-07 | `outputs/phase-11/server-fetch-mock-evidence.md` | B-07 mock API / seed / `INTERNAL_API_BASE_URL` 差し替え証跡 |
| E-08 | `outputs/phase-11/coverage-gate-failure-fixture.txt` | Step 6 オプション A fixture fail 結果 |
| E-09 | `outputs/phase-11/html-report-conditional-evidence.md` | Step 7 green / failure artifact 有無 |
| E-10 | `outputs/phase-11/registered-context.txt` | §6.1 `gh api .../check-runs` の name 一覧（3c 連携） |

### 2.4 スコープ

#### 含むもの

- `feat/e2e-coverage-gate` から `dev` への draft PR 作成（`gh pr create --base dev --draft`）。
- `e2e-tests-coverage-gate` job の実 run 観測 + green 確認。
- 3b/outputs/phase-11/ への evidence 7 種以上の commit。
- §6.1 の context 登録確認（merge 後に dev HEAD の check-runs 名一覧を取得）。
- 3b/outputs/phase-12/main.md の state を `runtime-closed` に更新。

#### 含まないもの

- **3c branch protection 更新（`gh api -X PUT .../branches/dev/protection`）はこのタスク対象外**。本タスクで context 登録までを終え、3c spec に hand-off する。
- **3a lighthouse-ci / 3b 実装変更（コード差分の追加）は対象外**。runtime 観測と evidence 取得のみ。
- 新規 critical-route smoke の追加。
- `apps/api` の endpoint 変更 / D1 schema 変更。

### 2.5 成果物

- `docs/30-workflows/e2e-quality-uplift-stage-3-impl/3b-e2e-tests-hard-gate/outputs/phase-11/` 配下 §2.3 の E-01..E-10。
- `docs/30-workflows/e2e-quality-uplift-stage-3-impl/3b-e2e-tests-hard-gate/outputs/phase-12/main.md` の state 更新（`implemented-local` → `runtime-closed`）。
- 必要なら `outputs/phase-12/system-spec-update-summary.md` に context 登録記録を追記。

---

## 3. どのように実行するか（How）

### 3.1 前提条件

- `feat/e2e-coverage-gate` ブランチ上に 3b 実コード差分が commit 済みであること（既に達成）。
- `mise exec -- pnpm install` / `pnpm typecheck` / `pnpm lint` / `pnpm dlx actionlint` / `pnpm dlx shellcheck scripts/coverage-gate-e2e.sh` がローカル green。
- `gh auth status` で push / PR 作成権限が利用可能。
- `dev` ブランチがリモートと同期済み（`pnpm sync:check`）。

### 3.2 依存関係

- **depends-on**: `task-e2e-stage3b-e2e-tests-hard-gate-001`（実装フェーズ）
- **blocks**: 3c branch protection 適用 spec（`e2e-tests-coverage-gate` を required check に追加）
- **関連**: `task-e2e-stage3b-fetch-public-service-binding-priority-regression-001`（fetch/public.ts の HTTP fallback 優先化に対する production regression test 追加）

### 3.3 実行手順

```bash
# Step 1: ブランチ最新化
mise exec -- pnpm sync:check
git fetch origin dev
git checkout feat/e2e-coverage-gate
git merge --no-ff origin/dev   # コンフリクト時は CLAUDE.md「コンフリクト解消の既定方針」に従う

# Step 2: ローカル品質ゲート再実行
mise exec -- pnpm install
mise exec -- pnpm --filter @ubm-hyogo/web typecheck
mise exec -- pnpm --filter @ubm-hyogo/web lint

# Step 3: draft PR 作成（B-01）
git push -u origin feat/e2e-coverage-gate
gh pr create --base dev --draft \
  --title "feat(ci): e2e-tests hard gate (3b)" \
  --body-file docs/30-workflows/e2e-quality-uplift-stage-3-impl/3b-e2e-tests-hard-gate/outputs/phase-12/implementation-guide.md
gh pr view --json url -q .url \
  > docs/30-workflows/e2e-quality-uplift-stage-3-impl/3b-e2e-tests-hard-gate/outputs/phase-11/pr-b-url.txt

# Step 4: e2e-tests-coverage-gate run 観測（B-02）
RUN_ID=$(gh run list --workflow=e2e-tests.yml --branch=feat/e2e-coverage-gate --limit=1 --json databaseId -q '.[0].databaseId')
gh run watch "$RUN_ID"
gh run view "$RUN_ID" --json conclusion,status,url,headSha \
  > docs/30-workflows/e2e-quality-uplift-stage-3-impl/3b-e2e-tests-hard-gate/outputs/phase-11/pr-b-e2e-run.txt

# Step 5: artifact 取得（B-03..B-06）
SHA=$(gh run view "$RUN_ID" --json headSha -q .headSha)
PHASE11=docs/30-workflows/e2e-quality-uplift-stage-3-impl/3b-e2e-tests-hard-gate/outputs/phase-11
gh run download "$RUN_ID" --name "e2e-coverage-${SHA}"  --dir "$PHASE11/coverage/"
gh run download "$RUN_ID" --name "e2e-monocart-${SHA}"  --dir "$PHASE11/monocart/"
cp "$PHASE11/coverage/summary/coverage-summary.json" "$PHASE11/coverage-summary.json"
jq -r '.total.lines.pct' "$PHASE11/coverage-summary.json" > "$PHASE11/coverage-line-pct.txt"

# Step 6: fixture fail 再現を evidence 化（既にローカル T-3b-6 で達成）
THRESHOLD_FIXTURE=scripts/__tests__/coverage-gate-e2e.fixture/fail-79 \
  bash scripts/coverage-gate-e2e.sh \
  > "$PHASE11/coverage-gate-failure-fixture.txt" 2>&1 || echo "exit=$?" >> "$PHASE11/coverage-gate-failure-fixture.txt"

# Step 7: HTML report 条件付き artifact 確認（D-01..D-03 を md に転記）
# green run で e2e-html-report-<sha> が存在しないこと（if: failure() 条件）を gh api で確認

# Step 8: server-fetch-mock-evidence.md 作成（B-07）
# scripts/e2e-mock-api.mjs の起動コマンド・INTERNAL_API_BASE_URL 設定箇所・期待 response shape を 1 ページにまとめる
```

### 3.4 PR merge 後の context 登録確認（§6.1）

```bash
# 3b PR merge 後（3c spec の前提条件）
HEAD_SHA=$(gh api repos/daishiman/UBM-Hyogo/branches/dev | jq -r '.commit.sha')
PHASE11=docs/30-workflows/e2e-quality-uplift-stage-3-impl/3b-e2e-tests-hard-gate/outputs/phase-11
gh api "repos/daishiman/UBM-Hyogo/commits/$HEAD_SHA/check-runs" \
  | jq -r '.check_runs[].name' \
  | sort -u \
  > "$PHASE11/registered-context.txt"
grep -F 'e2e-tests-coverage-gate' "$PHASE11/registered-context.txt"  # hit 1 で 3c 開始可
```

### 3.5 Phase 12 state 更新

evidence commit 後、`outputs/phase-12/main.md` の state 行を以下に書き換える。

```diff
- State: `implemented-local / implementation / NON_VISUAL / IMPLEMENTED_LOCAL_RUNTIME_PENDING`
+ State: `runtime-closed / implementation / NON_VISUAL / RUNTIME_OBSERVED`
```

---

## 4. 苦戦箇所【記入必須】

### 4.1 Server Component の server-side fetch を `page.route()` で intercept できない

- Next.js App Router の Server Component が server プロセス内で発火する `fetch()` は Playwright の `page.route()` では捕捉できない。`apps/web/src/lib/fetch/public.ts` 経由の D1→public API 呼び出しはすべてこの経路に乗るため、`page.route()` mock は public API path に対しては無効。
- 解決策として 3b 実装では `scripts/e2e-mock-api.mjs` を別プロセスで起動し、`INTERNAL_API_BASE_URL=http://127.0.0.1:8787` / `PUBLIC_API_BASE_URL=http://127.0.0.1:8787` を CI job env に渡して deterministic mock を成立させている。本タスクではこの起動・環境変数差し替えが CI ランナー上で正常に動いていることを `server-fetch-mock-evidence.md` に明示する必要がある。
- 注意: ローカルで `next dev` を使う検証だけでは「`getCloudflareContext()` が throw → `process.env.PUBLIC_API_BASE_URL` を読む」経路にしか乗らないため、Cloudflare Workers 互換 build（OpenNext）下での挙動は CI でしか観測できない。

### 4.2 ローカル PASS のみで Phase 11 を close すると EX-02 / EX-05 が未達

- 3b/phase-12/main.md は明確に `IMPLEMENTED_LOCAL_RUNTIME_PENDING` を残置しており、ローカル fixture 検証だけで Phase 11 終了基準（EX-02 = green run 観測 + line.pct >= 80）を満たすことはできない。CI 実 run の `gh run view` 結果と artifact が必須。
- `outputs/phase-11/pr-b-e2e-run.txt` は `conclusion: success` を含む raw JSON のため、後追い検証可能な形で commit する。

### 4.3 `e2e-coverage-<sha>` / `e2e-monocart-<sha>` artifact 名のハッシュ依存

- `.github/workflows/e2e-tests.yml` の artifact 名は `${{ github.sha }}` で suffix されるため、Step 5 の `gh run download --name` 引数は run の `headSha` から動的に組み立てる必要がある。固定文字列で download すると 404 になる。

### 4.4 monocart-reporter の HTML 出力 path と `PLAYWRIGHT_EVIDENCE_DIR` の整合

- `apps/web/playwright.config.ts` の reporter 配列末尾に `monocart-reporter` を追加した結果、出力先は `playwright-report/monocart/index.html` となる。一方、CI workflow は `PLAYWRIGHT_EVIDENCE_DIR=playwright/evidence` を job env に設定している。upload artifact path がこの env と reporter outputFolder の双方を参照するため、download 後の `outputs/phase-11/monocart/index.html` が空にならないことを確認する。

### 4.5 green run で HTML report artifact が存在しない（`if: failure()`）

- `e2e-html-report-<sha>` は failure 時のみ upload される条件付き artifact（3b/phase-11.md §5 D-01..D-03）。green run の evidence 取得時に `gh run download --name e2e-html-report-<sha>` を叩くと 404 になるが、これは仕様通り。`html-report-conditional-evidence.md` に「green では存在しない」「failure 時のみ retention 7 日で取得可」と明記する。

### 4.6 PR merge 前の context 登録確認はできない

- §6.1 の `gh api .../commits/<sha>/check-runs` は merge 後の dev HEAD で実行する必要がある。merge 前の PR head sha では `e2e-tests-coverage-gate` が pull_request トリガーの check として記録されるが、`branches/dev` の HEAD には反映されない。3c spec に hand-off する `registered-context.txt` は merge 完了後に取得する。

---

## 5. 影響範囲

| パス | 変更内容 |
|------|---------|
| `docs/30-workflows/e2e-quality-uplift-stage-3-impl/3b-e2e-tests-hard-gate/outputs/phase-11/pr-b-url.txt` | 新規（PR URL 1 行） |
| `outputs/phase-11/pr-b-e2e-run.txt` | 新規（`gh run view --json` 出力） |
| `outputs/phase-11/coverage/summary/coverage-summary.json` | 新規（CI artifact から download） |
| `outputs/phase-11/coverage-summary.json` | 新規（B-06 直配置 copy） |
| `outputs/phase-11/coverage-line-pct.txt` | 新規（`jq` 抽出） |
| `outputs/phase-11/monocart/index.html` | 新規（CI artifact から download） |
| `outputs/phase-11/server-fetch-mock-evidence.md` | 新規（B-07） |
| `outputs/phase-11/coverage-gate-failure-fixture.txt` | 新規（fixture fail 結果転記） |
| `outputs/phase-11/html-report-conditional-evidence.md` | 新規（D-01..D-03） |
| `outputs/phase-11/registered-context.txt` | 新規（§6.1・merge 後取得） |
| `outputs/phase-12/main.md` | edit（state を runtime-closed に昇格） |

> 実コード差分は本タスクで追加しない。`apps/web/` / `.github/workflows/` / `scripts/` への新規変更が必要になった場合は別タスクで切り出す。

---

## 6. 推奨タスクタイプ

runtime-evidence / NON_VISUAL（CI 観測と evidence ファイル commit のみで UI 描画変更を含まない）

---

## 7. 不変条件

1. **`wrangler` 直叩き禁止**: 本タスクは Cloudflare CLI を呼ばない想定だが、必要が出た場合は `bash scripts/cf.sh` 経由のみ。
2. **E2E coverage 80% は `quality-gates.md §7.5` standard tier 正本**: `coverage-line-pct.txt` の値が 80 を下回る場合、本タスクは PASS としない。
3. **`apps/web` env アクセスは `getEnv()` / `getPublicEnv()` 経由のみ**: evidence 作成のため一時的に `apps/web/src/lib/env.ts` をバイパスするコード差分は禁止。
4. **D1 直接アクセス禁止**: `apps/web` から D1 を叩く差分を生まない。
5. **`apps/api` endpoint surface 不変**: 本タスクは UI / API いずれの surface も変更しない。
6. **OKLch トークン正本化**: 本タスクは UI を編集しない（NON_VISUAL）。
7. **既定 PR base は `dev`**: PR-B は `--base dev --draft` で作成し、`main` は merge 対象としない。
8. **secrets を outputs/ に転記しない**: `gh run view --json` には URL とハッシュのみ含まれるよう、`--json conclusion,status,url,headSha` で fields を限定する。

---

## 8. 参照情報

- 仕様根拠: `docs/30-workflows/e2e-quality-uplift-stage-3-impl/3b-e2e-tests-hard-gate/phase-11.md`
- 実装サマリ: 同 `outputs/phase-12/implementation-guide.md`
- close-out 状態: 同 `outputs/phase-12/main.md`
- 親 spec: `docs/30-workflows/completed-tasks/e2e-quality-uplift-stage-3/`
- AC 根拠: 3b/phase-11.md EX-02..EX-05
- 関連: `quality-gates.md §7.5` standard tier = 80%
- フォーマット参照: `docs/30-workflows/unassigned-task/task-e2e-stage3b-e2e-tests-hard-gate-001.md`
- 関連スキル: `task-specification-creator` / `aiworkflow-requirements` / `github-issue-manager`

---

## 9. 備考

- 本タスクは「実装は完了済み・runtime 観測のみが残っている」という構造のため、コード差分追加を伴わない。runtime 失敗で実装変更が必要になった場合は、本タスクを一旦停止して別 spec（regression / fix）として切り出す方針を取る。
- 3c spec（branch protection 更新）は本タスク完了後の `registered-context.txt` を入力として開始する。`gh api -X PUT .../branches/dev/protection` のような destructive 操作は本タスク内では一切行わない。
- 1Password / Cloudflare secrets を `outputs/phase-11/` に転記しないこと（CLAUDE.md「シークレット管理」 / MEMORY.md `feedback_no_doc_for_secrets.md`）。
