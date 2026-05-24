# task-specification-creator: dev sync merge conflict 解消パターン

タスク仕様書生成 skill 配下（SKILL.md / SKILL-changelog.md / outputs/ / references/）は複数並行ワークツリーから additive に更新されるため、`origin/dev` 取り込み時に merge conflict が頻発する。正本は `.claude/skills/aiworkflow-requirements/lessons-learned/lessons-learned-dev-sync-merge-conflict-resolution-2026-05.md`（L-DEVSYNC-001..011、2026-05-17 task-25-fu の二回目 dev sync で再 renumber: L-DEVSYNC-006 = gate-metadata schema / L-DEVSYNC-007 = 3 層予防 / L-DEVSYNC-008 = SKILL.md N 件規約 / L-DEVSYNC-009 = visual-full baseline 鮮度ドリフト恒久対応 / L-DEVSYNC-010 = dev HEAD ≠ feature HEAD 検知 / L-DEVSYNC-011 = HEAD fact migration `--ours` 例外）。

## 本 skill 固有の補足

### SP-DEVSYNC-001: SKILL.md / SKILL-changelog.md の表 conflict
- changelog 表は append-only。HEAD と dev の追加行を**両方採用**し、`||||||| base` セクションは破棄。
- 自動 regex（diff3 base optional）:
  ```
  <<<<<<< HEAD\n(?P<a>.*?)(?:\|\|\|\|\|\|\| [^\n]*\n.*?)?=======\n(?P<c>.*?)>>>>>>> dev\n  →  {a}{c}
  ```

### SP-DEVSYNC-002: outputs/phase-*/implementation-guide.md の conflict
- 各タスクの outputs は task ごとに固有 path のため通常 conflict しないが、root/output artifacts parity を持つメタファイルは衝突しうる。両側採用 → Phase 12 strict 7 validator (`pnpm validate:phase11-paths` 等) を再実行して整合確認。

### SP-DEVSYNC-003: merge commit ガード
- pre-commit `staged-task-dir-guard` は `MERGE_HEAD` 検出で自動 skip。`--no-verify` を付けないことが原則。`--no-verify` が必要だった場合は hook の `MERGE_HEAD` 判定漏れを疑う。

### SP-DEVSYNC-004: SKILL.md "最新 N 件のみ列挙" 表の特別扱い
- `SKILL.md` 本体の changelog 表は仕様で「最新 3 件のみ列挙」と書かれている。SP-DEVSYNC-001 の両側採用を機械適用すると 4 件以上残って規約違反となる。
- 解消: 両側結合 → 日付降順ソート → 上位 3 件に切り詰め。落ちた行は `SKILL-changelog.md` に既に full 保存されているため情報損失なし。
- Why: SKILL.md は context load size 抑制目的の summary。SKILL-changelog.md が full history の正本という役割分担を保つ。

### SP-DEVSYNC-005: dev sync 完了判定の二段
- `git rev-list --count origin/dev..dev = 0`（ローカル dev が origin/dev に追いついた）は dev 同期完了の指標であり、feature ブランチが dev を取り込んだことは保証しない。
- feature ブランチ伝搬完了は別に `git merge dev --no-edit` の成功 + `git rev-list --count dev..HEAD` で確認する。
- Why: dev-sync prompt の S-SUB / S-MAIN-DEV パターン適用時、両者を混同するとプロンプト誤動作の判断材料になる。

### SP-DEVSYNC-007: dev merge 後の visual-full baseline drift 恒久対応
- task-709 系（visual baseline 含む）feature ブランチで dev merge 後に `playwright-visual-full` が必ず失敗する recurring pattern を解消するため、以下を導入（2026-05-17）:
  - `apps/web/playwright/tests/visual-full/.baseline-meta.json` で baseline 捕捉 commit SHA / rendering_relevant_paths を provenance 化
  - `pnpm visual:baseline:status` (`scripts/visual-baseline-status.sh`) で baseline 鮮度を自己診断
  - `playwright-visual-full.yml` 失敗時の PR auto-comment（baseline 起因 vs 真の回帰の判定 + 復旧コマンド）
  - `playwright-visual-baseline-update.yml` で baseline を source ブランチへ直接 push（PR 作成権限が GitHub Actions に許可されていない問題を回避）+ `.baseline-meta.json` 自動更新
- task 仕様書を書く際、visual regression を含む task では Phase 5 (implementation) に「baseline 捕捉直後に `.baseline-meta.json` を更新する」ステップを明示する。Phase 11 evidence に `pnpm visual:baseline:status` の出力を含める。
- Why: visual baseline 系 task は dev evolution に追随する保守コストが高く、provenance がないと「なぜ失敗しているか」の判定に毎回時間が溶ける。

#### SP-DEVSYNC-007-A: baseline update workflow 完了後の CI 再起動必須（2026-05-22 追加）
- 症状: `playwright-visual-baseline-update.yml` が ✅ success で baseline 画像を source branch へ push しても、その commit に対する CI run が一切走らない（`gh run list --branch <branch>` で baseline commit を headSha とする run が 0 件）。結果として PR の `playwright-visual-full` / `playwright-smoke` の failed check が更新されず「baseline 更新したのに CI 失敗が直らない」状態になる。
- 原因: `GITHUB_TOKEN` を使った GitHub Actions からの push は GH 仕様で workflow を新規 trigger しない（無限ループ防止）。`peter-evans/create-pull-request@v7` 不採用の代償。
- 解消（手動 1 ステップ）:
  ```
  git pull --ff-only origin <branch>
  git commit --allow-empty -m "ci: re-trigger after baseline update (<baseline-sha> was pushed by GITHUB_TOKEN, no CI ran)"
  git push
  ```
  user 認証 push なので全 CI workflow が起動する。
- task 仕様書を書く際: visual regression を含む task の Phase 11 (manual test) に「baseline update workflow success 後、`gh run list --branch <branch> --json headSha,name` で baseline commit に対する CI run 件数を確認。0 件なら empty commit + push で re-trigger」を**逐語明示**する。
- 恒久対応 TODO: `playwright-visual-baseline-update.yml` の最終ステップに empty commit 自動追加を組み込むか PAT push に切替える。それまでは本手動回避策で運用。
- Why: GITHUB_TOKEN push の CI 非起動挙動は公式ドキュメント記載だが、L-DEVSYNC-009 / SP-DEVSYNC-007 本体の運用手順には欠落していたため利用者が「CI 動いていない」と気付かないと詰む盲点だった。
- 詳細は aiworkflow-requirements 配下の L-DEVSYNC-009-A を参照。

### SP-DEVSYNC-009: HEAD ブランチが fact migration の正本である場合の `--ours` 例外
- 症状: feature ブランチが secret 名・workflow 参照などの runtime fact migration を実装している場合（例: Issue #718 で `backend-ci.yml` が `CLOUDFLARE_API_TOKEN` → `CF_TOKEN_D1_*` / `CF_TOKEN_WORKERS_*` へ切替済）、dev 側 narrative（`references/deployment-gha.md` 等）は旧 fact のままで `--theirs` を機械適用すると事実後退する。
- 解消: `git diff origin/dev..HEAD -- .github/workflows/ apps/` で HEAD 側に当該 fact の workflow/code 変更が**コミット済み**であることを確認した上で `git checkout --ours -- <path>` を採用。merge commit 後に `pnpm indexes:rebuild` で派生 indexes を再生成する。
- 適用判断: HEAD 側に code 変更がない単なる narrative 衝突であれば従来通り `--theirs` + rebuild が安全。
- task 仕様書を書く際、fact migration を含む task では Phase 5 / Phase 11 evidence に「dev sync merge で narrative ファイルが衝突した場合は `--ours` 例外を適用する」を明示する。
- Why: 詳細根拠と事例は aiworkflow-requirements 配下の L-DEVSYNC-011 を参照（旧 L-DEVSYNC-009、2026-05-17 task-25-fu 二回目 dev sync で renumber）。

### SP-DEVSYNC-011: 新規 playwright spec 追加時の mock API endpoint 同時追加
- 症状: feature ブランチで新規 `apps/web/playwright/tests/*.spec.ts` を追加した際、対応する `apps/web/playwright/fixtures/auth.ts` の mock API endpoint を追加し忘れると CI の e2e (desktop-chromium / mobile-webkit) が 60s タイムアウトで失敗する。原因は `fetchAdmin('/admin/...')` 等が mock 404 で error.tsx に落ちて UI 要素が出現しないため。
- 解消: spec 内で叩く全 path（`fetchAdmin` / `apiClient` 経由を含む）を grep し、`fixtures/auth.ts` の GET/POST handler 列挙と差分照合。不足があれば fixture 関数を追加して `req.method === 'X' && url.pathname === '/...'` ブロックを生やす。
- mobile-webkit 対応: admin UI は desktop-primary。新規 admin spec は `playwright.config.ts` の `mobile-webkit` project の `testIgnore` に追加する（既存 `admin-pages.spec.ts` と同じ扱い）。
- task 仕様書を書く際: Phase 6 (test additions) に「新規 playwright spec を追加する場合、対応する mock API endpoint を `playwright/fixtures/auth.ts` に同時追加し、admin 系 spec は mobile-webkit `testIgnore` を更新する」を明示する。
- Why: e2e CI 失敗は dev sync 起因と誤認しやすいが、実体は新規 spec と mock fixture の coverage gap。事例: 2026-05-17 feat/admin-tags-queue-resolver-drawer-mvp-recovery で `admin-tags-resolve-drawer.spec.ts` 追加時、`/admin/tags/queue` GET endpoint 不在で desktop-chromium / mobile-webkit が timeout。

### SP-DEVSYNC-012: 追記型 SSOT 衝突は「両側採用」がデフォルト解
- 症状: changelog の表行 / lessons-learned の項番付き節 / `phase12-checklist-definition.md` のチェック項目 / `indexes/keywords.json` の配列要素のような「既存行に追記」する SSOT で dev 同期 merge を行うと、HEAD 側と dev 側が**異なる新規行を独立追加しただけ**の衝突が頻発する。
- 解消: マーカー 4 種（`<<<<<<<` / `|||||||` / `=======` / `>>>>>>>`）を除去し、HEAD ブロックと their ブロックを連結（順序は HEAD→dev）。base ブロックは破棄。JSON ファイルは連結後に valid JSON であることを `python3 -c "import json; json.load(open(...))"` で必ず検証する。最後に `pnpm indexes:rebuild` を実行する。
- 適用判断: 「両側とも新規追加行（既存行の変更ではない）」かつ「semantic に独立」のみ適用。同一論理項目（同じ Issue 番号の status 行など）を両側が違う値に変更している場合は本ルール非適用、SP-DEVSYNC-009（fact migration）または L-DEVSYNC-002（`--theirs`）の判定に従う。
- task 仕様書を書く際、dev 同期 merge を含む task では Phase 5 の手順に「追記型 SSOT 衝突は両側採用で解消し JSON validity を検証する」を明示する。
- 事例（2026-05-18 `feat/parallel-i03-dialog-refresh-order` dev sync）: `pnpm sync:resolve` を 1 回叩くだけで `indexes/topic-map.md` (union) と `indexes/keywords.json` (`--ours` + rebuild) が自動解消。task spec 生成時、`outputs/phase-11/` に「dev sync merge を含む task は `pnpm sync:resolve` の 1 コマンドで覆える」旨を Phase 5 手順に書いておくと再発時の摩擦が消える。
- 事例（2026-05-18 feat/issue-748-jest-axe-primitive-a11y-integration dev sync）: `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` で HEAD（Issue #748 entry）と dev（Issue #730 + i02-admin-error-type-unify entries）が独立追記、両側採用で解消。`indexes/*` 4 件は L-DEVSYNC-002 の `--theirs` + `pnpm indexes:rebuild` で deterministic 再生成。
- 事例（2026-05-20 feat/issue-775-serial-05-step-03-runtime-evidence-spec dev sync）: `indexes/resource-map.md` / `indexes/topic-map.md` の 2 件 conflict を `pnpm sync:resolve` で union 自動解消 → merge commit → `pnpm indexes:rebuild` で残 drift (`indexes/topic-map.md` L 番号 +8/-16) を吸収して単独 chore commit、の 3 ステップで完遂。`pnpm sync:resolve` → `pnpm indexes:rebuild` → 単独 chore commit のテンプレ手順が 5 度目の再現確認。task spec 生成時、dev sync を含む task の Phase 5 にこの 3 ステップを逐語明示する。
- 事例（2026-05-20 `feat/ui-prototype-design-system-foundation-parallel-03-appshell-layouts` dev sync 2 度目）: 同一 feature ブランチへの 2 度目の dev 取り込みで `indexes/topic-map.md` 1 件のみが conflict。`pnpm sync:resolve` で union 解消 → merge commit → pre-push `indexes-drift-guard` が drift 検出 → `pnpm indexes:rebuild` → 単独 `chore(indexes): rebuild skill indexes after dev sync union merge` commit で push PASS（6 度目の再現）。教訓: 「同一 feature ブランチで複数回 dev sync を行う場合でも、本 3 ステップが branch lifecycle 全期間で一貫して有効」。task spec 生成時、dev sync を Phase 5 に明示する task は「初回・2 回目以降を問わず同じ 3 ステップで完結する」旨を 1 文で補足する。
- 事例（2026-05-23 `fix/integration-fixes-parallel-i02b-admin-mutation-error-finalize` dev sync）: 短命 feature ブランチで dev 取り込み時 conflict が `indexes/topic-map.md` 1 件単独に収束する最小バリアントを確認。`pnpm sync:resolve` で即時 union 解消、続けて `pnpm indexes:rebuild` を merge commit と同 staging に含めて 1 コミット完結（chore 分離不要）。task spec 生成時、dev sync を Phase 5 に明示する task は「conflict 規模が小さい場合は indexes:rebuild の drift も同 merge commit に取り込んで 1 コミット完結としてよい」旨を併記する。
- Why: 追記型 SSOT は順序が意味を持たないか時系列で HEAD→dev が自然。`--theirs` / `--ours` の一方採用は片方の wave の作業ログを消すことになる。詳細は aiworkflow-requirements 配下の L-DEVSYNC-012 を参照。
- 事例（番号衝突リナンバー・2026-05-18 feat/admin-tags-queue-resolver-drawer-mvp-recovery）: 本ファイル自身が「同一 SP-DEVSYNC-013 を HEAD（共通の正本リンク）/ dev（Phase 11 .log negation）で別 semantic に使用」する典型的な番号衝突を起こした。解消ルール: 「後から dev へマージされた側（dev 側）の番号を優先採用し、HEAD 側の節は次の空き番号 (本件では SP-DEVSYNC-014) へ繰り上げる。本文・参照 [[link]] は壊さない」。task 仕様書を書く際は、Phase 5「skill 同 wave 同期」手順に「節 ID の番号衝突が発生したら HEAD 側を繰り上げる」を明示する。

### SP-DEVSYNC-012: task 作成時の canonical schema 遵守を pre-push で機械強制（2026-05-18 追加）

- 症状: 新規 task の `outputs/phase-12/phase12-task-spec-compliance-check.md` を独自命名（`## 1. Verdict` / `## 2. Strict 7 Output Existence` / …）で書いてしまうと、CI `verify-phase12-compliance` が canonical 9 heading（`## Summary verdict` / `## Changed-files classification` / `## \`workflow_state\` and phase status consistency` / `## Phase 11 evidence file inventory` / `## Phase 12 strict 7 file inventory` / `## Skill/reference/system spec same-wave sync` / `## Runtime or user-gated boundary` / `## Archive/delete stale-reference gate` / `## Four-condition verdict`）の欠落として fail する。同様に `artifacts.json` と `outputs/artifacts.json` から `metadata.gates` 配列を省くと `verify-gate-metadata` が fail する。毎タスク同じ修正を繰り返す再発パターンになっていた。
- 解消（恒久対応）:
  1. **canonical SSOT 厳守**: `outputs/phase-12/phase12-task-spec-compliance-check.md` は必ず `references/phase12-compliance-check-template.md` の `Required Sections` 1..9 の見出しテキストを変更せず使う。番号変更・見出し言い換え・節の追加削除は禁止（追加情報は section 内の本文または下位 `###` 見出しで表現する）。
  2. **artifacts.json テンプレ厳守**: `artifacts.json` / `outputs/artifacts.json` 両方の `metadata.gates` 配列は最低 Gate-A / Gate-B / Gate-C の 3 件、各エントリに `gate_id` / `status` (`passed` / `pending` / `failed` / `waived`) / `passed_at` (ISO8601 or null) / `evidence_path` (workflow root からの相対 path) / `approver` (`local` / `daishiman` 等) / `notes` を必須とする。参照実装: `docs/30-workflows/completed-tasks/ut-17-followup-005-alert-relay-kv-error-metrics/artifacts.json`。
  3. **pre-push gate 強化**: `scripts/hooks/phase12-compliance-guard.sh`（新設）と `scripts/hooks/gate-metadata-guard.sh`（merge commit 含む push でも `--no-merges` で feature 由来差分のみ評価するよう強化）により、push 段階で CI 同等チェックを実行する。
- 適用判断: task 仕様書生成時、Phase 12 spec の見出しは必ず canonical 9 を **逐語** で使う（番号を付けたければ section 内本文側で表現）。`artifacts.json` の `metadata.gates` を生成しないテンプレ亜種が見つかったら直ちに修正する。
- Why: task 作成時の漏れが PR 到達時に必ず CI を fail させる recurring pattern は、テンプレ逸脱の機械検出が無いことが根本原因。pre-push gate で前倒すと PR 上のラリーが消えて作業速度が改善する。
- 詳細は aiworkflow-requirements 配下の L-DEVSYNC-013 を参照。

### SP-DEVSYNC-013: Phase 11 evidence `.log` ファイルは `.gitignore` negation 必須（2026-05-18 追加）

- 症状: task 仕様書の Phase 11 evidence で `outputs/phase-11/*.log` を `present` 宣言しても、`.gitignore` の `*.log` 一律除外でリポジトリに含まれず CI `verify-phase12-compliance`（issue-730 evidence existence validator）が `missing-evidence` で fail。ローカルでは file が存在するため `pnpm verify:phase12-compliance` は PASS してしまうため、push して初めて気付く。
- 解消: リポジトリの `.gitignore` に `!docs/30-workflows/**/outputs/phase-11/*.log` と `!docs/30-workflows/**/outputs/phase-11/**/*.log` の negation pattern を既に追加済（恒久対応）。task 作成者は通常 `.log` 拡張子を使ってよい。
- task spec 生成時の確認: 新規 task の Phase 11 evidence で `.log` を使う場合は `git check-ignore -v <log path>` で「除外されていないこと」（exit code 1）を確認する。除外されていれば `.gitignore` の negation が壊れたか、negation の path pattern が当該 task root をカバーできていない（例えば `outputs/phase-11/sub-dir/*.log` 以外の構造）。後者なら `.gitignore` の negation を拡張する。
- Why: Phase 11 evidence は CI で物理実在検証されるため tracked でなければならない。grep されにくい盲点だが毎タスクで再発しうるので、`.gitignore` のグローバル negation + task spec での `git check-ignore` 確認手順で恒久解消する。
- 詳細は aiworkflow-requirements 配下の L-DEVSYNC-014 を参照。

### SP-DEVSYNC-014: dev 取り込みで native binary（esbuild 等）が version bump した場合の二段復旧（2026-05-18 追加）

- 症状: dev sync merge で `esbuild` 等の native optional dep が version bump すると、(1) `pnpm install` が `ERR_PNPM_OUTDATED_LOCKFILE` で fail、(2) lockfile 更新後も `verify-esbuild` pre-push が `@esbuild/<host-arch> resolved outside cwd` で fail（worktree 内 `node_modules` に host arch 用 binary が抜けて親 worktree 側を解決してしまう）。
- 解消（必ず二段）:
  1. `CI=true pnpm install --no-frozen-lockfile` で lockfile を新 specifier に追随 → `pnpm-lock.yaml` のみを chore commit
  2. `CI=true pnpm install --force` で worktree-local の `@esbuild/<host-arch>` optional dep を再配置 → `node -e "console.log(require.resolve('@esbuild/darwin-arm64/bin/esbuild'))"` が worktree 内 path を返すことを確認 → push
- 適用判断: task 仕様書側では「dev sync を含む task の Phase 11 evidence で `pnpm install` が出力する `ERR_PNPM_OUTDATED_LOCKFILE` / `verify-esbuild` 失敗ログがあった場合は本ルールで二段復旧する」を明示する。Phase 12 implementation-guide には commit を `merge: ...` と `chore: update pnpm-lock for <pkg> <new-ver> after dev sync` の 2 件構成にする旨を記載。
- Why: pnpm の optional dep 解決は lockfile snapshot 依存で、`--no-frozen-lockfile` は specifier 同期はするが platform binary 再配置までは保証しない。順序を入れ替えると lockfile mismatch が残るリスクがあるため二段必須。
- 詳細は [[lessons-learned-dev-sync-merge-conflict-resolution-2026-05]] L-DEVSYNC-017 を参照。

### SP-DEVSYNC-015: Phase 11 evidence inventory テーブルは `Classification | Path | Status` 3列必須（2026-05-18 追加）

- 症状: 新規 task の `outputs/phase-12/phase12-task-spec-compliance-check.md` で `## Phase 11 evidence file inventory` テーブルを `Evidence | State` や `ファイル | 状態 | 用途` 等の独自カラムで書くと CI `verify-phase12-compliance` が `<empty-or-missing-table>` で fail。parser (`scripts/lib/phase12-compliance/parse-phase11-evidence.ts`) は header 行で `cell === "path" || cell === "evidence path"` および `cell === "status"` を必須検出し、見つからなければ全行スキップ → 空配列 → 空テーブル判定。
- 解消（task spec 生成時の絶対ルール）:
  1. テーブル見出しは **`| Classification | Path | Status |`** で固定（小文字統一、列順自由だが上記 3 語必須）
  2. `Classification` 列: `screenshot` / `axe report` / `manual test result` / `capture metadata` 等の自由文字列
  3. `Path` 列: workflow root からの相対 path（例: `outputs/phase-11/screenshots/foo.png`）。`status=present` 行は CI で物理実在検査される
  4. `Status` 列: `present` / `pending` / `n/a` のいずれか（小文字）
  5. spec_created 段階の docs-only root でも最低 1 行を `n/a` で書いてテーブルを成立させる（空テーブル禁止）
- 適用判断: task spec の Phase 12 template と各 task の `phase12-task-spec-compliance-check.md` 生成時に **逐語** で適用する。日本語見出しを使うと CI が必ず fail するため言語化の自由は無い。
- task-specification-creator skill 側 reference 更新: `.claude/skills/task-specification-creator/references/phase12-compliance-check-template.md` の Phase 11 evidence inventory セクションに正本テーブル例（present 行 / n/a 行 両方）を提示する。
- Why: parser のヘッダ語彙が固定なため見出し変更は即 fail。spec 作成段階で正本テーブル例を提示できれば毎タスクの recurring fail を防げる。詳細は aiworkflow-requirements 配下の L-DEVSYNC-015 を参照。

### SP-DEVSYNC-016: admin 系 server-side fetch の mock fixture は `scripts/e2e-mock-api.mjs` に追加（2026-05-18 追加）

- 症状: admin 画面の Playwright spec が「page heading は表示されるが list / button が出ず timeout」。`apps/web/playwright/fixtures/auth.ts` の `page.route()` で mock body は書いたのに反映されない。
- 解消（task spec 生成時に明示する手順）:
  1. admin 画面の data flow を特定: server component の `fetchAdmin` (`apps/web/src/lib/admin/server-fetch.ts`) 経由 → server-to-server fetch → `scripts/e2e-mock-api.mjs` がレスポンダ
  2. browser component の `apiClient` 経由 → `auth.ts` の `page.route()` がレスポンダ
  3. server-side fetch path（admin の多くがこれ）には `scripts/e2e-mock-api.mjs` 側に handler を追加し `safeJson(res, 200, body, schemas.XxxZ)` で zod 検証を通すこと
  4. spec 作成時 Phase 5 に「playwright spec を追加するときは fixtures/auth.ts と scripts/e2e-mock-api.mjs の **両方** で endpoint coverage を確認する」を明示
- Why: `page.route()` は browser network のみ intercept する仕様。Next.js server component から発する fetch は browser を経由しないため intercept 不能。fixture 整合性は server-side mock-api 側にも必要。
- 詳細は aiworkflow-requirements 配下の L-DEVSYNC-016 を参照。

### SP-DEVSYNC-018: `pnpm sync:resolve` 対象外ファイルは手動 union 自律継続（2026-05-18 追加）

- 症状: dev sync merge で `.claude/skills/aiworkflow-requirements/LOGS/_legacy.md` がコンフリクトし、`pnpm sync:resolve` が `[resolve-skill-merge-conflicts] WARN unhandled conflict: .../LOGS/_legacy.md` を出して exit 1 で終わる。resolver の明示対象は SKILL.md / `indexes/*-map.md` / `references/task-workflow-active.md` のみで、`LOGS/_legacy.md` は `.gitattributes` の `merge=union` 設定があっても 3-way marker (`<<<<<<<` / `|||||||` / `=======` / `>>>>>>>`) として残る。
- 解消（task spec 生成時の絶対ルール）:
  1. resolver 完走後 `git diff --diff-filter=U --name-only` で残余を確認
  2. 残余が `LOGS/_legacy.md` または `changelog/*.md` 等の追記型 markdown のみ → HEAD entry と dev entry を**両方保持**して連結（marker 4 種を除去、重複 entry のみ除去）
  3. 残余に semantic conflict（同一論理項目に両側が違う値を入れた変更）が含まれる場合は SP-DEVSYNC-009（fact migration `--ours`）または L-DEVSYNC-002（`--theirs`）の判定に従う
- task 仕様書を書く際: dev 同期 merge を含む task の Phase 5 手順に「`pnpm sync:resolve` 完了後 `git diff --diff-filter=U --name-only` で残余を取り、LOGS/changelog のみなら手動 union で自律継続」を明示する。Phase 11 evidence にも resolver 出力ログ + 手動解消 diff 内容を含める。
- Why: resolver スクリプトが LOGS を対象外にしている設計理由は、entry の順序（時系列・logical order）が文脈依存で機械判定できないため。追記型 SSOT は両側 entry を保持するのがデフォルト解（SP-DEVSYNC-012 と整合）。
- 事例: 2026-05-18 feat/issue-769-root-error-focus ← dev sync で `LOGS/_legacy.md` 単独残余を 30 秒以内に union 解消。resolver の `WARN unhandled` メッセージで対象を即特定できた。
- 事例（2026-05-19 `feat/parallel-02-prototype-css-rules-port` dev sync）: `pnpm sync:resolve` が `LOGS/_legacy.md` を union resolve した直後の `git add` で exit 1（`.gitignore` 配下のため `Use -f if you really want to add them.`）。**union resolve 自体は成功しており**、`git status --short` で確認すると `LOGS/_legacy.md` は `M` 表示で UU 残りなし。残るは `indexes/keywords.json` のみで `git checkout --ours` + `pnpm indexes:rebuild` の標準手順で解消可能。task spec の Phase 5 手順に「`pnpm sync:resolve` の exit code 非ゼロは即 fail とせず、`git status --short | grep '^UU'` で実残余を確認する」ことを明示する。
- 事例（2026-05-20 `feat/issue-776-schema-alias-bulk-resolve` dev sync）: 同一 LOGS/_legacy.md gitignore exit-1 + keywords.json UU 残り。手順テンプレ（`sync:resolve` → exit code 無視 → `^UU` grep で `keywords.json` のみ確認 → `checkout --ours` + `indexes:rebuild` → `git add indexes/`）が 1 分以内で完走することを再確認。SP-DEVSYNC-018 はテンプレ化済み・再発 case で手動編集ゼロ。
- 詳細は aiworkflow-requirements 配下の L-DEVSYNC-018 を参照。

### SP-DEVSYNC-019: 新規タスク root/outputs `artifacts.json` には `metadata.gates` を必ず付与（2026-05-18 追加）

- 症状: 新規 task workflow root を作成して PR を出すと、`verify-gate-metadata` workflow の `validate` ジョブが `[ERROR] <task>/artifacts.json: metadata.gates absent on changed artifacts.json` で fail。validator (`scripts/gate-metadata/validate.ts`) は `--require-gates-for-changed` に列挙された artifacts.json に対してのみ ERROR を出すため、既存 task の WARN は無視されるが新規 task は必ず ERROR になる。
- 解消（task spec 生成時の絶対ルール）:
  1. **root** `artifacts.json` と **outputs/** `artifacts.json` の **両方** の `metadata` に `gates` 配列を追加する（artifacts parity 不変条件）
  2. 最低 3 件: Gate-A (spec_review) / Gate-B (implementation_review) / Gate-C (external_ops)。`status` は `passed` / `pending` / `failed` / `waived`、`passed` のときは `passed_at: "YYYY-MM-DDTHH:MM:SSZ"` 必須・`pending` のときは `passed_at: null` 必須
  3. `gate_id` は `^Gate-[A-Z](-[A-Z0-9]+)*$` 正規表現に一致（例: `Gate-A`、`Gate-B-API`）
  4. `evidence_path` は repo-root 相対 POSIX path で、`status=passed` の場合 CI が物理実在を検査する。`outputs/phase-3/design.md` (Gate-A) / `outputs/phase-10/ac-verification.md` (Gate-B) / `outputs/phase-13/diff-to-pr.md` (Gate-C) を default にする
  5. `approver` は `^(CODEOWNERS:[A-Za-z0-9._/-]+|[A-Za-z0-9](?:[A-Za-z0-9-]{0,37}[A-Za-z0-9])?)$`（GitHub username 形式または `CODEOWNERS:<path>`）
- ローカル事前検証: `mise exec -- pnpm gate-metadata:validate -- --require-gates-for-changed <root>/artifacts.json <root>/outputs/artifacts.json` で `ERROR: 0` を確認する
- Schema 正本: `packages/shared/src/gate-metadata/schema.ts` の `GateEntrySchema` / `GatesArraySchema`
- Why: 新規 task では `git diff` で必ず両 artifacts.json が変更扱いになるため、`metadata.gates` 不在は merge 直前まで気付かず PR DIRTY / CI fail のリードタイム要因になる。spec 生成テンプレート段階で 3-gate skeleton を埋め込むことで recurring fail を抑止する。
- 詳細は aiworkflow-requirements 配下の L-DEVSYNC-018 を参照。

### SP-DEVSYNC-021: `lefthook.yml` の inline run ⇔ 外部 script 進化 case の 3-way conflict 解消（2026-05-19 追加）
- 症状: dev sync で `lefthook.yml` の同一 hook（例: `pre-push.verify-esbuild`）が conflict。HEAD 側は inline `run: |` ブロック、dev 側は外部 script 切り出し + sync-merge skip 内蔵という **段階の異なる実装**。両側 union すると YAML 構造（同一キー重複）が破壊される。
- 解消: **外部 script 側を正本採用**し、`lefthook.yml` は `run: bash scripts/hooks/<guard>.sh` 1 行に収束。HEAD 側 inline の付加ロジック（例: mise-aware node 解決 / 追加 env / 追加 verify）は **script 本体へ統合**する。
- 自動化可否: YAML structured config は L-DEVSYNC-001 の table-union ルール対象外。手動 merge 必須。`pnpm sync:resolve` も非対応。
- 適用判断: `lefthook.yml` / `.github/workflows/*.yml` / `*.json` 等の structured config で「inline → 外部 script への切り出し」が片側で行われ、他方に未統合の付加ロジックがある case。
- 詳細は aiworkflow-requirements 配下の L-DEVSYNC-023 を参照。

### SP-DEVSYNC-022: references 配下「変更履歴」append-only 表の両側 row 衝突（2026-05-20 追加）
- 症状: feature ブランチと dev が `references/deployment-*.md` 等の `## 変更履歴` 表に **同日同 version** で別々の row を独立追加 → `pnpm sync:resolve` が unhandled としてスキップし `[WARN] unhandled conflict` + exit 1。
- 解消: 両 row を保持し HEAD→dev 時系列順で連結（version 重複可、append-only として両側採用）。conflict marker のみ除去。
- 適用判断: `references/*.md` の append-only 変更履歴表ブロック全般。narrative 衝突（fact migration）は SP-DEVSYNC-009 / L-DEVSYNC-002A の判定に従う。
- task spec を書く際: dev 同期を含む Phase 5 手順に「`pnpm sync:resolve` の `unhandled` リストが `references/deployment-*.md` のみなら、変更履歴表ブロックの両側保持で自律継続」を明示。
- 事例: 2026-05-20 `feat/issue-765-1password-vault-restructure` ← dev sync で `deployment-secrets-management.md` 1.4.5 が HEAD（issue-765 vault restructure）+ dev（PR #795 CI recovery）の独立追加 → 両 row union で解消。
- 詳細は aiworkflow-requirements 配下の L-DEVSYNC-022 を参照。

### SP-DEVSYNC-023: 同一 import ブロック内 別行追加の 3-way conflict は両側 import 統合（2026-05-20 追加）
- 症状: feature ブランチ（root chrome）が `apps/web/app/error.tsx` に `Card` 系 import を追加、dev 側（issue-799 / parallel-i06）が同一 import ブロックに `useAutoFocusOnMount` を追加 → 同一論理「import 文集合」への独立追加が 3-way marker として残り、`pnpm sync:resolve` の対象外（src コード）。
- 解消: marker 4 種を除去し HEAD ブロックと dev ブロックの import 文を**両方残す**。本体が両 symbol を実使用しているため意味的競合は無く、機械的 union で完結。`logger` 等 base ブロックに既存していた import は重複を作らないよう既存行を再利用する。
- 適用判断: `*.tsx` / `*.ts` の同一 import ブロック内で「両側が異なる symbol を追加」「本体コードが両 symbol を実使用」「export shape は変更されていない」case。複数行 import statement は HEAD→dev の順で連結し alphabetical 整理は別 commit に分離する。
- task spec を書く際: dev 同期を含む Phase 5 手順に「`apps/web/**` の import 衝突は本体での symbol 使用有無を grep（例: `grep -n useAutoFocusOnMount apps/web/app/error.tsx`）で確認し、両側使用なら union、片側のみ使用ならその側を採用」を明示する。
- 事例: 2026-05-20 `feat/parallel-04-shared-page-chrome` dev sync で `apps/web/app/error.tsx` が `Card`（HEAD）と `useAutoFocusOnMount`（dev）を同時要求 → union で解消、typecheck 通過。
- 詳細は aiworkflow-requirements 配下の L-DEVSYNC-024 を参照。

### SP-DEVSYNC-024: Phase 12 evidence inventory 表は dev 側列構造（4-col with Classification）を正本採用（2026-05-20 追加）
- 症状: feature 側（旧 3-col: Path / Status / Note）と dev 側（新 4-col: Classification / Path / Status / Note）が `phase12-task-spec-compliance-check.md` の Phase 11 evidence inventory 表で構造的に衝突。HEAD は feature 自タスクの present 行を含み、dev は別タスクの present 行と新カラムを含む。
- 解消: **dev 側の 4-col schema を正本採用**し、HEAD 側に列挙されていた feature 行を `Classification = visual` 付きで再構成して dev 側行集合に union する。Phase 11 inventory parser（issue-730 系）が `Classification` 列の有無を許容する仕様であっても、新規ファイルでは必ず 4-col で書く。
- 自動化可否: `pnpm sync:resolve` は markdown table の構造判別をしないため対象外。Phase 12 evidence parser の現行仕様は `references/phase11-evidence-existence-validator-input-contract.md` 参照。
- 適用判断: `outputs/phase-12/phase12-task-spec-compliance-check.md` / `outputs/phase-12/main.md` の structured table セクション全般。
- task spec を書く際: Phase 12 template の Phase 11 evidence inventory セクションを 4-col（Classification / Path / Status / Note）に統一し、`Classification` 列の語彙集合（`visual` / `coverage` / `gate` 等）を `references/phase12-compliance-check-template.md` に併記する。
- 事例: 2026-05-20 `feat/parallel-04-shared-page-chrome` dev sync で `ui-prototype-design-system-foundation/outputs/phase-12/phase12-task-spec-compliance-check.md` の Phase 11 表が 3-col vs 4-col で衝突 → 4-col 採用 + HEAD row 再付与で解消。
- 事例（2026-05-20 再現・parallel-03 wave 2 度目 dev 取り込み）: `feat/ui-prototype-design-system-foundation-parallel-03-appshell-layouts` で `phase-12/main.md` の `## Boundary` と `phase12-task-spec-compliance-check.md` の `## 7. Runtime or user-gated boundary` の 2 ファイルが narrative 3-way conflict。HEAD（parallel-03 AppShell + parallel-02 CSS port）と dev（parallel-04 root fallback）の異なる sub-workflow 群を独立追記しただけで意味的競合は無く、結合 1 段落で解消。task spec を書く際: ui-prototype-design-system-foundation 配下の sub-workflow ブランチでは Phase 12 narrative セクション（`main.md` `## Boundary` / `phase12-task-spec-compliance-check.md` `## 7. Runtime or user-gated boundary`）が再現的に narrative conflict 化することを Phase 5 手順に明記し、両 wave のキー語彙（`parallel-02 CSS rules port` / `parallel-03 AppShell layout` / `parallel-04 root fallback` / `serial-07 visual regression` 等）を保持した結合段落を作る方針を採る。
- 詳細は aiworkflow-requirements 配下の L-DEVSYNC-025 を参照。

### SP-DEVSYNC-026: integration-fixes/index.md の i06/i07 status 行 3-way conflict（2026-05-21 追加）
- 症状: `docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/integration-fixes/index.md` の `## 7. 残タスク追跡` 表で HEAD 側と dev 側が **異なる i** 行（HEAD: i06 を `completed-tasks/issue-769-root-error-focus/` に格上げ / dev: i07 を `completed-tasks/profile-loading-skeleton-oklch/` に格上げ）を独立に更新したため、`pnpm sync:resolve` が unhandled として残す。
- 解消: 両側の昇格状態を保持する。i06 行は HEAD 側採用、i07 行は dev 側採用で 1 行ずつ採択する union（重複行除去）を手動適用。`||||||| <base>` の base 行は破棄。
- 自動化可否: 表中の行単位での「片側採用」は resolver スクリプト対象外（行レベル意味判断が必要）。手動解消ルールとして `lessons-learned-dev-sync-merge-conflict-resolution-2026-05.md` に追記する。
- 適用判断: `integration-fixes/index.md` / 類似の status 追跡表（i01..i07 / parallel-NN status / serial-NN status）。
- task spec を書く際: status 追跡表を更新する場合は **更新対象の i 番号を 1 行に限定し PR を分離**することで再発を抑制。やむを得ず複数 i を 1 PR で更新する場合は、各行をコメントで `<!-- updated-by: branch-name -->` マーキングして merge 時の片側採用判断を機械化可能にする方針を Phase 5 ガイドラインに追加する。
- 事例: 2026-05-21 `feat/issue-800-profile-error-focus-transfer` ← dev sync で i06=HEAD / i07=dev の両側採用 union で解消、`<<<<<<< / ||||||| / =======` の 3 ブロックから 2 行を抽出して 1 ブロックに統合。
- 詳細は aiworkflow-requirements 配下の L-DEVSYNC-033 を参照。

### SP-DEVSYNC-020: 共通の正本リンク
- 詳細は [[lessons-learned-dev-sync-merge-conflict-resolution-2026-05]] （aiworkflow-requirements 配下、L-DEVSYNC-001..025）を参照。
- 詳細は [[lessons-learned-dev-sync-merge-conflict-resolution-2026-05]] （aiworkflow-requirements 配下、L-DEVSYNC-001..032）を参照。

### SP-DEVSYNC-021: completed-task Phase 11 evidence inventory の 3-way conflict（2026-05-20 追加）
- `docs/30-workflows/completed-tasks/**/outputs/phase-1[12]/*.md` で発生する 3-way conflict は、HEAD 側が `pending`/`runtime_pending`/`placeholder`、dev 側が `present`/`captured`/`PASS` を含む場合は **dev 側採用**（recovery 完了後の正本を尊重）。両側 union は evidence existence validator の二重カウントを誘発するため禁止。
- 事例: 2026-05-20 `feat/issue-776-schema-alias-bulk-resolve` ← dev sync で `serial-05-step-03-schema-diff-resolve/outputs/phase-12/phase12-task-spec-compliance-check.md` の Phase 11 inventory 表を dev 側採用で解消。
- 詳細は aiworkflow-requirements 配下の L-DEVSYNC-032 を参照。

### SP-DEVSYNC-022: improvements/integration-fixes/index.md の HEAD/dev 別行更新衝突（2026-05-22 追加）
- `docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/integration-fixes/index.md` は 7 件の i01..i07 行を持つ表で、HEAD（自スコープ task）と dev（並行 wave の完了）が**別 i 行**を更新するため `pnpm sync:resolve` が `unhandled conflict` を残す。
- 解消: L-DEVSYNC-030 の行単位両側採用を適用。HEAD が更新した行は HEAD 版、dev が更新した行は dev 版で残し、`||||||| base` セクション（旧未着手状態）は破棄する。
- 事例: 2026-05-22 `feat/issue-801-admin-error-focus` ← dev sync で i06（HEAD: admin route segment 拡張）と i07（dev: design-token skeleton 完了 / canonical_workflow `completed-tasks/profile-loading-skeleton-oklch/`）が同じ表内で衝突。i06=HEAD 版、i07=dev 版を採用して解消。
- 詳細は aiworkflow-requirements 配下の L-DEVSYNC-030 を参照。

### SP-DEVSYNC-028: `verify-pr-ready` の `indexes:rebuild drift` は merge commit 後の独立 chore commit テンプレで吸収（2026-05-23 追加）
- 症状: dev sync-merge 後の `bash scripts/verify-pr-ready.sh` で `verify:phase12-compliance` / `gate-metadata:validate` は PASS だが `FAIL indexes:rebuild drift` のみが残る。`pnpm sync:resolve` の union 解消で merge commit に入った `indexes/topic-map.md` 等が、deterministic 再生成（カテゴリソート・重複除去）で +N / -2N の差分を生じる。
- 解消（テンプレ 3 ステップ）:
  1. `pnpm sync:resolve` → conflict 解消 → merge commit 作成
  2. `pnpm indexes:rebuild` → drift 出現を確認
  3. `git add .claude/skills/aiworkflow-requirements/indexes/ && git commit -m "chore(indexes): rebuild skill indexes after dev sync union merge"`
- 適用判断: `verify-pr-ready` 失敗が `indexes:rebuild drift` 単独の場合のみ機械適用してよい。複数 gate fail なら `references/pr-pre-flight-ci-gate-checklist.md` §1〜§5 で原因切り分け。
- task 仕様書を書く際: dev sync を Phase 5 に含む task では「merge commit + chore(indexes) commit の 2 コミット構成が標準。`verify-pr-ready` を merge commit 直後と chore commit 直後の 2 回叩いて drift 吸収を機械確認する」を逐語明示する。
- 事例: 2026-05-23 `feat/ut-25-deriv-02-sa-key-expiry-monitoring` ← dev sync で aiworkflow indexes 3 ファイル + `task-workflow-active.md` を `pnpm sync:resolve` で union 自動解消、merge commit 後の `indexes/topic-map.md` +8/-16 drift を単独 chore commit で吸収、typecheck / lint 初回 PASS。
- 詳細は aiworkflow-requirements 配下の L-DEVSYNC-036 を参照。

### SP-DEVSYNC-029: 修正済 `sync:resolve` で skill union-only conflict は追加コミット不要（2026-05-24 追加）
- SP-DEVSYNC-028 では「merge commit + chore(indexes) commit の 2 コミット構成が標準」としていたが、`scripts/sync/resolve-skill-merge-conflicts.sh` の rebuild トリガ修正（aiworkflow L-DEVSYNC-036）以降、conflict が skill 系（`indexes/*` + `references/task-workflow-active.md`）のみの union-only ケースでは `pnpm sync:resolve` が `indexes:rebuild` まで内包するため、merge commit **1 コミットで drift ゼロ**に収まる。
- task 仕様書を書く際: dev sync step では「`pnpm sync:resolve` → `git commit`（merge）→ `pnpm indexes:rebuild` が no drift を返すか確認。drift が出た場合のみ SP-DEVSYNC-028 の chore(indexes) commit にフォールバック」と条件分岐で明示し、常時 2 コミットを強制しない。
- 適用判断: conflict 一覧が `.claude/skills/*/indexes/*` + `references/task-workflow-active.md` に閉じる場合のみ。ソースコード / completed-tasks doc を含む場合は L-DEVSYNC-003 等の個別ルールを併用。
- 事例: 2026-05-24 `feat/home-page-prototype-alignment` ← dev sync で skill 系 5 ファイル（`indexes/{keywords.json, quick-reference.md, resource-map.md, topic-map.md}` + `references/task-workflow-active.md`）のみ conflict。`pnpm sync:resolve` 一発で全自動解消（union 4 + ours 1 + 内包 rebuild）、merge commit 後 no drift、`verify-pr-ready` / push 初回 PASS、追加 chore commit 不要。
- 事例（2 回目・再現確認）: 2026-05-24 `feat/issue-827-member-detail-adapter-and-visibility-defense` ← dev sync。conflict は前事例と**同一の 5 ファイル**（`aiworkflow-requirements/SKILL.md` + `indexes/{keywords.json, quick-reference.md, resource-map.md, topic-map.md}` + `references/task-workflow-active.md`）に閉じ、`pnpm sync:resolve` 一発で全自動解消、merge commit 1 コミット後 `pnpm indexes:rebuild` no drift、`verify-pr-ready` 全 gate PASS（ERROR 0）、typecheck / lint / push 初回 PASS、追加 chore commit 不要。条件分岐（drift 出現時のみ SP-DEVSYNC-028 フォールバック）が 2 ブランチ連続で「フォールバック不要」側に倒れたことを確認。
- 事例（3 回目・rebuild トリガが indexes/*.md union 側の variant）: 2026-05-24 `feat/issue-832-admin-topbar-primitive-extraction` ← dev sync（ローカル dev = origin/dev 済で dev 同期は no-op、feature は 3 ahead / 2 behind）。conflict は **4 ファイル**（`aiworkflow-requirements/SKILL.md` + `indexes/{quick-reference.md, resource-map.md, topic-map.md}`、すべて union）で、**`indexes/keywords.json` は git auto-merge され CONFLICT に含まれなかった**点が前 2 事例と異なる。それでも `pnpm sync:resolve` は indexes/*.md の union 解消が `need_rebuild` を発火させ `pnpm indexes:rebuild`（keywords 5091）を内包実行、merge commit `0a8c15f71` 後の確認 rebuild は drift 0、typecheck / lint 初回 PASS、追加 chore commit 不要。**rebuild トリガは「keywords.json ours」だけでなく「indexes/*.md union」でも発火する**ことを確認し、SP-DEVSYNC-029 の「フォールバック不要」結論が conflict ファイル組合せに依らず成立することを 3 ブランチ連続で裏付け。
- 詳細は aiworkflow-requirements 配下の L-DEVSYNC-037 を参照。

### SP-DEVSYNC-008: 同一 React Component への並行 feature 追加 conflict は L-DEVSYNC-033 適用
- task 仕様書 Phase 4-5（implementation）で同一 React component に hook / state / JSX modal を追加する task が並行する場合、dev sync-merge で 3-way conflict が必発する。
- 解消: aiworkflow-requirements `lessons-learned-dev-sync-merge-conflict-resolution-2026-05.md` の **L-DEVSYNC-033** に従い、hook 命名・JSX 子要素が disjoint であれば SP-DEVSYNC-001 と同じ regex で機械的両側採用。
- task 仕様書側の予防策: Phase 5 step で「対象 component 内 state 追加位置」を明示し、既存 hook ブロックの末尾追記とする（先頭/中間挿入を避ける）ことで sync-merge 時の機械的解消成功率を上げる。
- 事例: 2026-05-21 Issue #778（rollback/undo） ← dev (#776 bulk resolve) の SchemaDiffPanel.tsx / spec / api.ts / specs ×2 全 5 ファイル両側 union 解消、typecheck/lint/verify-pr-ready 全 PASS。

### SP-DEVSYNC-030: `.ts` curated list/array の「dedup × entry追加」3-way conflict は和集合（重複排除）＋検証スクリプト確認（2026-05-24 追加）
- task 仕様書 Phase 4-5 で CI gate スクリプト（`scripts/verify-design-tokens.ts` の `colorLiteralExcludes` 等の exclude/allowlist 配列）を複数の並行 task が編集する場合、dev sync-merge で `.ts` ソースの curated list に 3-way conflict が必発する。`.gitattributes` union 対象外かつ `pnpm sync:resolve` の glob 対象外のため手動 semantic union が必要。
- 解消: 片側が重複行を dedup・もう片側が entry/コメントを追加する典型では、(1) entry 集合を和集合化し配列内重複を排除、(2) コメントは両側追加分を保持、(3) 該当 list を消費する verify スクリプト（`pnpm verify:tokens` 等）を実行して機能担保。純粋 append-only（SP-DEVSYNC-001/008 の import/hook 両側採用）と違い「重複排除を伴う和集合」である点が差分。
- task 仕様書を書く際: CI gate スクリプトの curated list を変更する task では Phase 5 step に「list への追記は配列末尾の正規ブロックに集約し、既存 entry の重複追加を避ける」「dev sync 後に当該 verify スクリプトを叩いて list 機能を確認する」を逐語明示し、sync-merge 時の機械的解消成功率を上げる。
- 事例: 2026-05-24 `feat/members-page-prototype-alignment-spec` ← dev (`fix/verify-design-tokens-og-route-exclude`) の `colorLiteralExcludes` 配列衝突を、HEAD の重複 regex 削除（dedup）と dev のコメント追加を両立させて解消。`pnpm verify:tokens` が `88 tracked in sync` を返し PASS、typecheck / lint / gate-metadata / phase12-compliance 全 PASS。
- 詳細は aiworkflow-requirements 配下の L-DEVSYNC-037 を参照。

### SP-DEVSYNC-029: `process.env` 直読み → `getEnv()` 移行は dev cloudflare-context 優先で e2e が 401 になる（2026-05-24 追加）
- 症状: `apps/web` の server-side fetch を `process.env["INTERNAL_API_BASE_URL"]` 直読みから `getEnv().INTERNAL_API_BASE_URL` へ統一する task の後、e2e (mobile-webkit 等) で `admin api /admin/meetings/sess-1 failed: 401` が多発。fixture (`PLAYWRIGHT_*_FIXTURE`) を持つ admin spec は実 fetch 前に short-circuit するため緑のまま、fixture の無い meetings detail / attendance / issue-819 系だけが落ちるため「特定 spec 群だけ謎の 401」に見える。
- 原因: `next.config.ts` の `initOpenNextCloudflareForDev()` により dev:webpack でも `getCloudflareContext()` が機能し、`env.ts` の `readRawEnv()` が cloudflare context（= `wrangler.toml [vars]` の**本番** `INTERNAL_API_BASE_URL`）を **process.env より優先**する。Playwright webServer が process.env へ注入する `INTERNAL_API_BASE_URL=http://127.0.0.1:8787`（mock API）が無視され、SSR fetch が本番 API へ飛んで認証なし 401。
- 解消（恒久対応）: `readRawEnv()` で `PLAYWRIGHT_TEST=1`（Playwright `localEnv` が必ず注入）のときだけ `{ ...cloudflareEnv, ...processEnv }` と process.env override を優先する。本番 Workers は process.env に config を持たないので no-op。unit は `apps/web/src/lib/__tests__/env.spec.ts` に override / non-override 両ケースを追加。
- task 仕様書を書く際: `apps/web` の env 参照経路を変更する（`process.env` → `getEnv()` 統一を含む）task は、Phase 5 に「dev:webpack の cloudflare-context が process.env より優先される点を確認し、e2e mock API 切替が壊れないことを `PLAYWRIGHT_TEST` 経路で担保する」、Phase 11 evidence に「fixture を持たない SSR fetch 系 spec（meetings detail / attendance）の e2e 緑」を明示する。
- 関連: fixture 追加経路は [[SP-DEVSYNC-016]]（`scripts/e2e-mock-api.mjs` server-side mock）。env 正本仕様は aiworkflow-requirements `references/architecture-admin-api-client.md` §2.2。
- Why: 「env アクセスを getEnv に一本化」という正しい invariant 遵守が、dev local の env 解決順序という別レイヤの仕様と衝突して e2e のみ壊す盲点。grep で気付けないため lessons-learned 化して再発時の切り分け時間を消す。

### SP-DEVSYNC-030: `SKILL.md` union + `keywords.json` ours の最頻 conflict は `sync:resolve` 1 発完遂で手動 rebuild commit 不要（2026-05-24 追加）
- 症状（正常系の確定）: dev sync-merge の content conflict が `SKILL.md`（union）+ `indexes/keywords.json`（ours = JSON 派生物）の 2 件だけのとき、`mise exec -- pnpm sync:resolve` が union 結合・`--ours` 採用・`pnpm indexes:rebuild` の自動呼び出しまでを 1 回で完遂する。完了後は UU 残置 0、merge commit 後に確認 rebuild しても drift 0。
- task 仕様書を書く際: dev sync を Phase 5 に含む task では、conflict 解消手順を「① `pnpm sync:resolve` → ② `git diff --name-only --diff-filter=U` が空を確認 → ③ `git add -A && git commit --no-edit` → ④ 確認用 `pnpm indexes:rebuild` で `git status --porcelain` 空を検証」の 4 ステップで逐語明示する。**SP-DEVSYNC-028 の手動 chore(indexes) commit は本パターンでは不要**（resolver が rebuild 済み）と但し書きを置き、`keywords.json` を ours 採用した場合は L-DEVSYNC-036 の `need_rebuild` が発火するため後追い drift が出ない理由まで書く。
- 分岐判断: 解消後に `indexes:rebuild` で drift が出る → SP-DEVSYNC-028（union-only で keywords.json が conflict に含まれなかったケース）。drift が出ない → 本 SP-DEVSYNC-030（keywords.json が ours 解消されたケース）。判別は「`sync:resolve` ログに `taking --ours for ... keywords.json` が出たか」で機械確定。
- 事例: 2026-05-24 `feat/serial-06-form-response-binding` ← dev sync-merge。`SKILL.md` + `keywords.json` の 2 conflict を `pnpm sync:resolve` で完遂（keywords 5072 件再生成）、UU 残置 0、merge commit `85ca3619f`、確認 rebuild drift 0、typecheck / lint 初回 PASS。
- 詳細は aiworkflow-requirements 配下の [[L-DEVSYNC-037]] を参照。

### SP-DEVSYNC-031: conflict が `SKILL.md` 単独（indexes は auto-merge）の場合も `sync:resolve` 後 drift 0 で手動 rebuild commit 不要（2026-05-24 追加）
- 症状（正常系の確定）: dev sync-merge の content conflict が **`SKILL.md`（union）1 件のみ**で、`indexes/keywords.json` 含む派生物は git の auto-merge で衝突せず結合済み（`git merge` 出力に `Auto-merging indexes/...` は出るが `CONFLICT` 行は `SKILL.md` だけ）のケース。`mise exec -- pnpm sync:resolve` は `SKILL.md` を union 解消するが **`indexes:rebuild` は呼ばない**（`apply_ours` 0 件・`apply_union` が `indexes/*` 非該当で `need_rebuild` 不発火）。それでも確認用 `pnpm indexes:rebuild` は no-op で drift 0、pre-push `indexes-drift-guard` も通過する。
- task 仕様書を書く際: dev sync を Phase 5 に含む task では、SP-DEVSYNC-030 の 4 ステップ手順に「**conflict が `SKILL.md` 単独で indexes が `Auto-merging` のみ（CONFLICT なし）の場合も、indexes は既に正しく結合済みのため確認 rebuild は no-op・手動 chore commit 不要**」という分岐を併記する。SP-DEVSYNC-028 の手動 rebuild が必要なのは indexes 派生物**自体が CONFLICT した**場合に限る、と境界を明示する。
- 分岐判断（3 分岐に整理）: ① indexes/* が CONFLICT → 解消後 rebuild で drift 出る → SP-DEVSYNC-028（手動 chore commit 要）。② `keywords.json` が ours 解消された → resolver 自動 rebuild 済み → SP-DEVSYNC-030（drift 0）。③ conflict が `SKILL.md` 単独・indexes は auto-merge → resolver rebuild 呼ばずとも確認 rebuild が no-op → 本 SP-DEVSYNC-031（drift 0）。いずれも「確認用 `pnpm indexes:rebuild` → `git status --porcelain` 空」を最終ゲートにすれば取りこぼさない。
- 事例: 2026-05-24 `feat/serial-06-form-response-binding` ← dev sync-merge（1 commit behind: login page #890 取り込み）。`aiworkflow-requirements/SKILL.md` のみ CONFLICT、`SKILL-changelog.md` / `indexes/{keywords.json,topic-map.md,resource-map.md,quick-reference.md}` は Auto-merging で衝突回避。`pnpm sync:resolve` で union 解消（rebuild 呼び出しなし）→ UU 残置 0 → 確認 rebuild drift 0 → typecheck PASS。
- 詳細は aiworkflow-requirements 配下の [[L-DEVSYNC-038]] を参照。

### SP-DEVSYNC-030: design-token 並行 a11y 修正衝突は task 仕様書で「3 SSOT 統一 + visual baseline 再生成」を逐語化（2026-05-24 追加）
- prototype alignment / a11y contrast 系 task が並行すると、`--ubm-color-text-muted` 等の design-token が HEAD/dev 双方で**異なる HEX 値**へ darken される並行修正衝突が dev sync-merge で発生する。append-only 両側採用（SP-DEVSYNC-001）は同一 token 二重宣言になるため**適用禁止**。
- 解消: aiworkflow-requirements `lessons-learned-dev-sync-merge-conflict-resolution-2026-05.md` の **L-DEVSYNC-038** に従い、(1) canonical dev 値へ 1 値統一、(2) `apps/web/src/styles/tokens.css` + `docs/00-getting-started-manual/specs/09b-design-tokens.md` の table 行 + 同 JSON `value` の **3 SSOT すべて**へ同値適用、(3) `verify-design-tokens` gate（tokens.css ↔ spec 一致検査）で担保。
- task 仕様書を書く際の予防策:
  - design-token を変更する task は Phase 5 step に「token 値の正本は 3 箇所（tokens.css / spec table / spec JSON）。1 箇所変更時は必ず 3 箇所同時更新し `verify-design-tokens` 相当を pre-push 確認」を逐語明示する。
  - prototype alignment / token 変更を含む task は Phase 4 (test-plan) と Phase 11 (evidence) に「visual baseline (`-linux.png`) が token 変更で stale 化する。darwin ローカル再生成不可のため dev sync 後 push で CI fail したら `playwright-visual-baseline-update.yml` を workflow_dispatch 再生成」を必ず織り込む（[[L-VISBASE-001]] 連携）。
  - 並行衝突の予防として、同種の a11y contrast 修正 task を複数 wave で走らせる場合は「token 値は dev を待って 1 本化」を SCOPE に明記し、HEAD/dev 二重 darken を避ける。
- **⚠️ a11y 退行の盲点（task 仕様書に必ず織り込む）**: design-token のコントラスト値は「根拠コメントに書かれた surface」だけでなく **その token が実際に乗る全 surface のうち最暗のもの**で AA を検証する。`text-muted` を AppShell footer (`surface-bg-2 #eee5d5`) 上の copyright に使うと、panel 想定で calibrate された値（dev `#7d6a4d`=5.08:1 on panel）でも **4.16:1 で AA 未達**になる。token 衝突を「値統一」だけで閉じると、pre-flight gate（`verify-pr-ready` は axe 非実行）を素通りし push 後 e2e `a11y.spec.ts` で初めて落ちる。
  - 正しい修正方針: token を更に darken せず **usage 面（footer の color を `text-muted` → `text-secondary`）で修正**する。token は dev canonical 値を維持でき、将来 feature→dev 再衝突回避 + visual baseline blast radius 最小化の二重メリット。
  - task 仕様書を書く際: design-token / AppShell surface（`data-shell="footer"` 等）を触る task の Phase 4 (test-plan) に「token × surface の全組合せ contrast を最暗 surface まで列挙し AA 検証。最暗 surface で未達なら usage 面修正（より濃い token へ）を優先」を逐語明示する。
- 事例: 2026-05-24 `feat/home-page-prototype-alignment` ← dev sync で `--ubm-color-text-muted` を HEAD `#76664a` / dev `#7d6a4d` の並行 darken 衝突として検出、dev `#7d6a4d` を 3 SSOT へ統一。push 後 e2e a11y が footer copyright on bg-2（4.16:1）で fail（home ブランチに pre-merge から潜在）→ public-footer の color を `text-secondary`（5.31:1）へ変更して解消、token は dev 値維持。
- 詳細は aiworkflow-requirements 配下の L-DEVSYNC-038 を参照。

### SP-DEVSYNC-031: union 解消した手動 ledger の重複 entry は「merge 由来 / upstream 既存」を両親 count で判別してから直す（2026-05-24 追加）
- 症状: `pnpm sync:resolve` が `indexes/{quick-reference,resource-map}-map.md`（= `indexes:rebuild` 非生成の**手動 ledger**）を `merge=union` で連結した後、同一見出し ID（例 `TASK-RT-06`）が 2 回出現する。SP-DEVSYNC-018 / L-DEVSYNC-012 の「重複 entry のみ除去」を反射的に適用すると、dev 正本に元からあった重複まで消して scope 外 diff を生む危険がある。
- 判別: merge commit の両親 SHA を `git log --format=%P -1 <merge-sha>` で取り、`git show <parent>:<path> | grep -c '<token>'` を HEAD / dev 双方で計測 → merge 結果の `grep -c` と比較。**結果数 == max(両親) なら upstream 既存重複（本ブランチで直さない）／結果数 == 両親の和 なら union が作った新規重複（新しい版を残し旧版を削除）**。
- task 仕様書を書く際: dev 同期 merge を含む task の Phase 5 手順に「`pnpm sync:resolve` 後、手動 ledger（quick-reference / resource-map）に重複見出しが出たら両親 count 比較で merge 由来か判定し、upstream 既存重複は是正しない」を逐語明示する。Phase 11 evidence に両親 count と結果 count の数値を残す。
- 事例: 2026-05-24 `docs/runtime-smoke-staging-mint-recurrence-spec` ← dev sync で conflict 4 件を `pnpm sync:resolve` が 1 発解消。`quick-reference.md` の `TASK-RT-06` が 2 回出現したが HEAD=2 / dev=2 / 結果=2 で upstream 既存重複と確定し是正せず。`keywords.json` JSON valid・`indexes:rebuild` drift ゼロ。詳細は aiworkflow-requirements 配下の L-DEVSYNC-039 を参照。

### SP-DEVSYNC-032: SSR fetch 画面の task は「e2e server mock fixture (`e2e-mock-api.mjs`) を `auth.ts` shape + zod enum へ整合」「描画変更後の visual baseline 再撮影順序」を仕様書に逐語化（2026-05-24 追加）
- server component の `fetch`（`fetchPublicOrNotFound` 等）を持つ画面の task では、dev sync 後に **e2e が「mock fixture と画面期待値の不一致」で落ちる**構造的リスクがある。task 仕様書（特に Phase 4 test-plan / Phase 5 implementation）に以下を逐語で織り込む。
  - **2 系統 mock の使い分け明示**: SSR `fetch` は Playwright `page.route()`（`apps/web/playwright/fixtures/auth.ts`）を**経由しない**。server-side mock `scripts/e2e-mock-api.mjs` の fixture が SSR 画面の正本。「画面が SSR fetch なら `e2e-mock-api.mjs` を直す／CSR fetch なら `auth.ts` の `page.route()` を直す」を Phase 4 に明記（[[L-DEVSYNC-016]] / L-DEVSYNC-039 連携）。
  - **zod enum 制約**: 画面に `*.parse()`（例 `PublicMemberProfileZ`）を入れる task は、mock fixture の値が **`FieldKindZ` enum（`packages/shared/src/zod/primitives.ts`）に厳格一致**することを Phase 5 step に必須化（`longText` は不在＝`paragraph` が正）。parse 導入で fixture の正しさが顕在化する点を注記。
  - **fixture の単一正本化**: e2e が参照する `data-stable-key` / `data-section` は `auth.ts` の body 関数が canonical。`e2e-mock-api.mjs` の対応 `build*()` を field 単位（`stableKey`/`label`/`value`/`kind`/`visibility`/`source`）で 1:1 に揃える、を Phase 5 に明示。
  - **strict-mode 二重マッチ回避**: component が attendance 等から自動生成する section（`MemberActivity` の `data-section="activity"`）と mock の `publicSections` が同じ `data-section` を出さないよう、mock 側から重複 section を削る、を Phase 4 の test-plan 注意点に明記。
- **visual baseline 再撮影の順序を SCOPE に明記**: rendering を変える task で baseline 再撮影が必要な場合、「dev に rendering_relevant_paths を触る後続コミットが控えているなら **dev を先に取り込んでから baseline をキャプチャ**」を SCOPE/Phase 11 に逐語化（撮影後の dev merge で再 stale 化を防ぐ）。baseline commit は GITHUB_TOKEN push で CI 未トリガ（[[L-DEVSYNC-009-A]]）→ pull 後 user push で再トリガ、も注記。
- **並行 worktree 運用の注記**: 同一ブランチを複数 worktree/agent で触る task は「`git push` reject（`cannot lock ref ... is at X but expected Y`）時はまず `git fetch` → `git diff HEAD origin/<branch> --stat` が空なら remote が等価コミット保有、`--set-upstream-to` 追従で足りる（force-push 不要）」を運用注記に入れる。
- 事例: 2026-05-24 `feat/serial-06-form-response-binding`（PR #888）。`scripts/e2e-mock-api.mjs` を `auth.ts publicMemberProfileBody()` に整合（`member_display_name`/`session_task18`/`kobe(zone)`、重複 activity section 削除、`longText`→`paragraph`）→ dev #892/#893 を 2 段 sync-merge → baseline 再撮影 → 最終 head で e2e/smoke/visual-full 全 PASS、PR `CLEAN`。
- 詳細は aiworkflow-requirements 配下の L-DEVSYNC-039 を参照。
