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
- 事例（2026-06-03 `feat/issue-1059-public-members-fields-batch-n1` dev sync）: conflict が `indexes/keywords.json` + `indexes/quick-reference.md` + `indexes/topic-map.md` の 3 件に収束。`pnpm sync:resolve` 1 回で `quick-reference.md` + `topic-map.md` を union 解消・`keywords.json` を `--ours` + 内部 `indexes:rebuild` で再生成し、追加手動編集ゼロで完走。**`indexes/quick-reference.md` も resolver の union 対象**である点を実証（従来 docs は topic-map / resource-map を主に挙げていた）。merge commit 後の `pnpm indexes:rebuild` は **no-op（`git status --porcelain` 空 = drift ゼロ）** で SP-DEVSYNC-028 の chore 分離コミットは不要 = resolver の内部 rebuild が既に deterministic 状態を作っている。typecheck / lint / `indexes:rebuild` drift いずれも初回 PASS。task spec 生成時、dev sync を Phase 5 に含む task は「`pnpm sync:resolve` 完走後 `git status --porcelain` が空なら chore(indexes) 分離は不要（merge commit 1 件で完結）」を併記する。
- 事例（2026-06-03 `fix/shell-collapse-cookie-secure-attribute` dev sync・5 回目再現 + 罫線 false-positive 実例）: conflict が `indexes/keywords.json`（`--ours`）+ `indexes/topic-map.md`（union）+ `references/task-workflow-active.md`（union）の 3 件に収束（`indexes/{quick-reference,resource-map}.md` は git auto-merge）。`pnpm sync:resolve` 1 回で全自動解消（keywords 5362 件 rebuild 内包）、merge commit `95fea5b08` 後の `pnpm indexes:rebuild` drift 0・追加 chore 不要。**残存マーカー検証の pitfall 実例**: `git grep -lE '^(<<<<<<<|=======|>>>>>>>)'` は `docs/30-workflows/completed-tasks/ut-08-monitoring-alert-design/outputs/phase-11/manual-smoke-log.md` を誤検出するが、実体は 60 個 `=` の markdown 罫線で前方一致が拾っただけ。実マーカー（`<<<<<<<` / `>>>>>>>`）は 0 件・HEAD/origin/dev 両方に同罫線が存在しマージ非変更。**残存判定は `git ls-files -u | wc -l` = 0 を正本にし、grep を使うなら `^=======$` 完全一致**（罫線長 7 超の区切り線を素朴前方一致は必ず拾う）。aiworkflow-requirements 配下 L-DEVSYNC-037 の 5 回目事例と対応。
- 事例（2026-06-03 `docs/japanese-ime-input-composition-search-spec` dev sync・同一ブランチ連続 sync の衝突集合再現）: conflict が `indexes/resource-map.md` + `indexes/topic-map.md` + `references/task-workflow-active.md` の 3 件に収束（`keywords.json` / `quick-reference.md` / 両 `SKILL.md` は Auto-merging で衝突せず）。`pnpm sync:resolve` 1 回で union 解消、merge 後 `indexes:rebuild` は no-op（drift 0・merge commit 1 件完結）、typecheck / lint 初回 PASS。**本ブランチの前回 sync も同一の 3-file 集合で衝突**しており、「**異なるブランチ間**では衝突 file が hunk 位置依存で変動するが（aiworkflow L-DEVSYNC-092-A）、**同一ブランチの連続 sync** では feature 側追記 hunk が固定のため衝突集合が同一に再現する」ことを実証。task spec 生成時、dev sync を Phase 5 に含む task は「衝突 file セットを前提にした分岐を書かず `pnpm sync:resolve` 直行で吸収する」旨を併記する（同一ブランチ再 sync でも初回と同じ手順で完結）。詳細は aiworkflow-requirements 配下の L-DEVSYNC-093 を参照。
- 事例（2026-06-04 `docs/admin-meetings-attendance-404-and-ia-spec` dev sync・union 件数 3 の最小 member 構成 + 同一ブランチ複数回 sync の累積記録）: conflict が `indexes/quick-reference.md` + `indexes/topic-map.md` + `references/task-workflow-active.md` の 3 件に収束（`indexes/keywords.json` / `indexes/resource-map.md` / `SKILL.md` / `SKILL-changelog.md` は全て Auto-merging で非衝突）。resolver ログは **`union-resolving 3 files`**（keywords 非衝突のため `taking --ours` 段なし）→ 内部 `indexes:rebuild`、`WARN unhandled` なし exit 0。merge commit `ca25f457b` 後の `pnpm indexes:rebuild` は drift 0（merge commit 1 件完結）、typecheck（7 packages Done）/ lint いずれも初回 PASS、install 省略可（dev デルタ 1 コミットに新 workspace package なし）。**union 件数は 3〜5 で振動する実測値**: 本ブランチは過去 sync で union 5（aiworkflow 4 + task-spec 1・L-DEVSYNC-095）・union 5（SKILL.md + map 3 + task-workflow-active）を記録しており、今回の union 3 が下限。`union-resolving N files` の N を事前予測せず resolver の実数で確認する。**残存マーカー判定の正本**: `git grep -lE '^(<<<<<<<|=======|>>>>>>>)'` は `ut-08-monitoring-alert-design/.../manual-smoke-log.md` の `=` 装飾線を `^=======` で偽陽性検出するが、`git diff --name-only --diff-filter=U`（本件 0）と実マーカー対 `<<<<<<<`/`>>>>>>>` の grep（0）の 2 条件を正本にすれば無害（L-DEVSYNC-093-B / 095-C と完全一致の再現）。task spec 生成時、dev sync を Phase 5 に含む task は「union 件数を見積りに固定せず `pnpm sync:resolve` 直行で全パターンを吸収し、残存判定は `diff-filter=U` を正本にする」旨を併記する。詳細は aiworkflow-requirements 配下の L-DEVSYNC-096 を参照。
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
- 事例（4 回目・keywords.json が再び CONFLICT 側の variant）: 2026-05-26 `feat/issue-900-workflow-permissions-audit` ← dev sync（ローカル dev = origin/dev 済で dev 同期は ff no-op、feature は 7 behind / 3 ahead）。conflict は **6 ファイル**（`aiworkflow-requirements/SKILL.md` + `indexes/{keywords.json, quick-reference.md, resource-map.md, topic-map.md}` + `references/task-workflow-active.md`）で case 2 と同一組合せに収束。`pnpm sync:resolve` 一発（union 5 + `--ours` 1 + 内包 `indexes:rebuild`）→ merge commit `9c9987ab3` → `bash scripts/verify-pr-ready.sh` で `verify:phase12-compliance` / `gate-metadata:validate` / `indexes:rebuild`（no drift）の 3 gate 全 PASS（ERROR=0）、typecheck / lint 初回 PASS、追加 chore commit 不要。**4 ブランチ連続でフォールバック不要結論を再現**。conflict 組合せ（5/6 ファイル・`keywords.json` の auto-merge 可否）は dev / feature の wave タイミング次第で揺れるが、解消テンプレ（`sync:resolve` → `verify-pr-ready` → push）は不変。
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

### SP-DEVSYNC-030: 修正済 `sync:resolve` 利用後は dev sync を「merge commit 単独 + 後追い rebuild 確認」に簡略化（2026-05-24 追加）
- 症状（運用更新）: SP-DEVSYNC-028 で「dev sync を含む task は merge commit + chore(indexes) commit の 2 コミット構成が標準」と明示していたが、`scripts/sync/resolve-skill-merge-conflicts.sh` の `need_rebuild` フラグ修正（L-DEVSYNC-036 2件目）以降、`apply_ours`（`indexes/keywords.json`）を含む conflict では `pnpm sync:resolve` 内で `indexes:rebuild` が自動実行され、merge commit 時点で drift ゼロになる。この場合 chore(indexes) commit は不要で、1 コミット構成で push まで完結する。
- 解消（更新後テンプレ）:
  1. `pnpm sync:resolve` → `git status --porcelain | grep '^UU'` で残コンフリクト確認（あれば `awk | xargs git add`）
  2. `git commit --no-edit` で merge commit 作成
  3. `pnpm indexes:rebuild` を後追い → **drift ゼロなら追加コミット不要**／drift 出現時のみ SP-DEVSYNC-028 の chore(indexes) commit にフォールバック
  4. `pnpm typecheck && pnpm lint` 確認 → push
- task 仕様書を書く際: dev sync を Phase 5 に含む task では「merge commit 後に `pnpm indexes:rebuild` を後追いし、drift ゼロを確認して push（resolver が rebuild 済のため 1 コミット構成が既定）。drift が残る場合のみ chore(indexes) commit を分離する」と記述する。SP-DEVSYNC-028 の「2 コミット構成が標準」は「resolver が rebuild できないケース（古い resolver / `apply_ours` も union 対象も無いケース）に限定したフォールバック」へ位置付けを更新する。
- 事例: 2026-05-24 `feat/mypage-prototype-alignment` ← dev sync-merge（8 behind / 3 ahead）。`pnpm sync:resolve` で 6 ファイル（`SKILL.md` + `indexes/{quick-reference,resource-map,topic-map}.md` union、`indexes/keywords.json` apply_ours、`references/task-workflow-active.md` union）解消、resolver 内 `indexes:rebuild` 自動実行 → merge commit 作成 → 後追い `pnpm indexes:rebuild` で drift ゼロ確認、chore commit 不要。typecheck / lint 全パッケージ初回 PASS。
- 詳細は aiworkflow-requirements 配下の L-DEVSYNC-037 を参照。

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

### SP-DEVSYNC-031: 並列 worktree の concurrent-merge race — 自律 sync は stale status で判断せず fresh 再確認（2026-05-24 追加）
- 並列 worktree 運用（9〜30 WT）では、同一ブランチに対し別ターミナル/エージェントが dev sync-merge を**同時進行**させることがあり、`git status` が「clean」→「conflicts fixed but still merging」→「merge committed」と観測タイミングで遷移して見える TOCTOU race が起きる。自律 branch-sync prompt の「現在 WT は単一アクター」前提が破れるケース。
- 解消: aiworkflow-requirements `lessons-learned-dev-sync-merge-conflict-resolution-2026-05.md` の **L-DEVSYNC-039** に従う。`git merge dev` が `MERGE_HEAD exists` で弾かれても **`--abort`/`--reset --hard` を自律実行しない**（別アクターの正当な進行中 merge を破壊しうる＝自律判断ルール D「破壊的判断は AI が行わない」に整合）。数秒おいて `git log`/`git rev-list --left-right --count HEAD...origin/dev`/`git grep` で fresh 再確認し、parents=`<旧HEAD>`+`origin/dev`・behind 0・conflict マーカー残存ゼロの正当 merge commit なら受容、CI gate を自分で再実行して緑なら push。
- task 仕様書を書く際の含意: 並列 wave で同一ブランチ/同一画面に触れる task を複数立てる場合、SCOPE に「dev sync は 1 WT 1 アクターで実施。並列 merge race を避けるため同一ブランチへの同時 sync を禁止」を明記する。CI gate（typecheck / lint / `gate-metadata:validate` / `indexes:rebuild` no drift）は**最終的に push する WT 側で必ず自分で回す**ことを Phase 13（PR）step に逐語化し、別アクターが作った merge commit を無検証で push しない。
- 事例: 2026-05-24 `feat/admin-topbar-primitive-extraction` ← dev sync。`git status` clean 確認直後の `git merge dev` が `MERGE_HEAD exists` で弾かれ、別アクターが同時に同一 WT で merge を完走させていた（merge commit `01b0434f9`、parents=`cb23c556d`+origin/dev `51c3cb3ce`）。`--abort` せず fresh 再確認で正当性検証（behind 0・marker 0）→ 受容。conflict は skill 系 union のみ（L-DEVSYNC-039 = union-only no-drift の 3 回目再現）で `indexes:rebuild` no drift、`gate-metadata` ERROR 0、typecheck / lint 初回 PASS。
- 詳細は aiworkflow-requirements 配下の L-DEVSYNC-039 を参照。

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

### SP-DEVSYNC-033: sync-merge 前に「stat-dirty な tracked」と「他タスク PR の stale untracked 漏れ込み」を切り分け、後者は CONST_019 から除外する（2026-05-24 追加）
- ブランチ主題と乖離した大量変更が `git status` に出た sync-merge では、commit/push 前に必ず以下の切り分けを実施する手順を運用知見として持つ。task 実装フローでも「PR 作成前の作業ツリー健全性チェック」として適用する。
  - **stat-dirty の除外**: ` M`（space-M）の tracked は `git diff HEAD --stat` が空なら実内容は HEAD 一致の stat-dirty（mtime のみ）。`git diff HEAD` を 1 回走らせれば index refresh で消える。汚れの実体は untracked 群、と最初に確定する。
  - **stale 漏れ込みの判定**: untracked 群が他タスク PR の成果物なら、`git log HEAD..dev` の取り込み対象コミットと照合し `git cat-file -e "dev:<path>"` + `diff -q <(git show dev:<path>) <path>` で **dev に committed 済 かつ IDENTICAL** を確認。一致すれば「並行 worktree から漏れ込み→当該 PR が dev へマージ済」の stale コピーと確定。
  - **除外の根拠**: CONST_019「全変更包含」は当該ブランチ起因の変更にのみ適用。dev に同一内容で既存の漏れ込みコピーを `git add -A` で commit すると**無関係 PR を汚染**するため除外する。
  - **退避手順**: 削除（`git clean -fd`）ではなく `git stash push -u`（内容は dev にあり非破壊・復元可能）で退避してから `git merge dev`。merge/verify/push 後に IDENTICAL 確認済みなら stash を drop。
- task 仕様書テンプレへの織り込み: 並行 worktree 運用前提の task は Phase 13（PR 作成）の pre-flight に「作業ツリーに主題外変更があれば stat-dirty / stale 漏れ込みを切り分け、stale は stash 退避してから merge」を逐語化する。`bash scripts/verify-pr-ready.sh` は untracked 漏れ込みを検出しないため、この切り分けは人/agent 側の手続きで担保する。
- 事例: 2026-05-24 `docs/issue-863-admin-runtime-alert-policy-spec` ← dev sync-merge。tracked 50+ ` M`（全 stat-dirty）+ untracked 20 件（#888/#887/#893/#892 の stale コピー、IDENTICAL 確認）を切り分け、untracked を `git stash push -u` 退避 → clean tree で `git merge dev` → `pnpm sync:resolve` で index conflict 自動解消 → merge `9d059ad00` → typecheck/lint 初回 PASS、無関係成果物の混入ゼロ。
- 詳細は aiworkflow-requirements 配下の L-DEVSYNC-040 を参照。

### SP-DEVSYNC-008: skill-index-only コンフリクトの最短経路（2026-05-24 再確認 / 2026-05-25 再々確認 / 2026-05-25 再々々確認）
- 再々々確認 (2026-05-25): `feat/admin-section-error-retry`（HEAD = AdminSectionErrorClient + L-ASR-001..005 / L-RSC-001..005 skill 反映）に dev（#869 CSP enforce / #871 CSP nonce / #872 Google brand icon の 3 PR 取り込み）を sync-merge。conflict は `.claude/skills/aiworkflow-requirements/indexes/{quick-reference,resource-map,topic-map}.md` の 3 ファイルのみで、`pnpm sync:resolve` 単体で残件 0、merge commit 完了。`MERGE_HEAD` 検出で pre-commit `staged-task-dir-guard` 自動 skip により `--no-verify` 不要。後続 `pnpm typecheck` / `pnpm lint` いずれも exit 0。本最短経路は累積 3 回の独立再確認を経ており、task 仕様書テンプレ Phase 11/12 の sync-merge 節は変更不要。詳細根拠は aiworkflow-requirements 側 L-DEVSYNC-042（happy-path 再確認エントリ）。
### SP-DEVSYNC-008: skill-index-only コンフリクトの最短経路（2026-05-24 再確認 / 2026-05-25 再々確認 / 2026-05-25 issue-874 で 3 回目確認）
- 3 回目確認 (2026-05-25 issue-874): `feat/issue-874-login-staging-visual-smoke` への dev sync-merge（behind 5 / ahead 2）。conflict は `indexes/topic-map.md`（union） + `indexes/keywords.json`（`--ours` + rebuild）の標準 2 ファイルのみ。`pnpm sync:resolve` 単体で残件 0。worktree で `.git` が file のため branch-sync prompt の `mkdir .git/branch-sync-logs` は直接失敗 → `git rev-parse --git-common-dir` 経由解決（L-DEVSYNC-041）の運用も再確認。task 仕様書テンプレ Phase 11/12 の sync-merge 節は本最短経路を 3 sprint 連続で変更不要。
- 再々確認 (2026-05-25): `docs/issue-863-admin-runtime-alert-policy-spec` の 2 回目の dev sync-merge（behind 9 / ahead 4）。conflict は `indexes/topic-map.md`（union） + `indexes/keywords.json`（`--ours` + rebuild）の標準 2 ファイル のみで、`pnpm sync:resolve` 単体で残件 0、merge commit `745d2dd6d` 完了。task 仕様書テンプレ Phase 11/12 の sync-merge 節は本最短経路を変更せず維持してよい。
- 事例: `feat/issue-837-schema-alias-bulk-rollback` の dev sync。コンフリクトが `aiworkflow-requirements/indexes/{quick-reference,resource-map,topic-map}.md`（union 対象）と `indexes/keywords.json`（`--ours` + rebuild 対象）に限定された場合、`pnpm sync:resolve` 単体で残件 0、`pnpm verify:pr-ready`（verify:phase12-compliance / gate-metadata:validate / indexes:rebuild drift）も全 PASS まで一気通貫。
- task 仕様書を書く際: skill 配下を触るタスクの Phase 11/12 で「dev sync は `pnpm sync:resolve` → `git commit`（`MERGE_HEAD` 検出で pre-commit auto skip。`--no-verify` 禁止）→ `pnpm verify:pr-ready`」を実行順として明示する。
- 詳細は aiworkflow-requirements 側 L-DEVSYNC-013 を参照。

### SP-DEVSYNC-033: legacy-ordinal-family-register.md の先頭 quote block 3-way conflict は spec 上「両側 NOTE 保持 + 最新日付統一」を逐語化（2026-05-24 追加）

- 事象: dev sync-merge で `references/legacy-ordinal-family-register.md` 先頭の `> 最終更新日: <date>` + `> NOTE (...)` 行群が両側追加の 3-way conflict として発生。`pnpm sync:resolve` は `WARN unhandled conflict` で手動 resolve に委ねる。
- Why: 本 register は wave ごとに「register-skip 宣言 NOTE」を先頭 quote block へ追記する SSOT 運用のため、base `> 最終更新日:` 行が複数 wave で同時更新されると diff3 hunk に膨らむ。table 本体（§Current Alias Overrides 等）は触らない wave が大半で、quote block 限定の union が安全。
- How to apply（task 仕様書での逐語化）:
  - Phase 5（実装）/ Phase 9（QA）の sync-merge 節に「`legacy-ordinal-family-register.md` の手動 resolve 手順」として以下を明記:
    1. `grep -n -E '^(<<<<<<<|=======|>>>>>>>|\|\|\|\|\|\|\|)'` で conflict 範囲が先頭 quote block 内か確認
    2. 範囲内なら両側 `> NOTE` 行を**両方保持**、`> 最終更新日:` 行はより新しい日付 1 本に統一（古い行は重複削除）
    3. 範囲が table 本体に及ぶ場合は L-DEVSYNC-032/033 の table-merge ルール（行単位の片側採用 union）に切替
- 検証: marker grep ゼロ + `verify:phase12-compliance` PASS + `indexes:rebuild` drift は別 chore commit で吸収（SP-DEVSYNC-029 既知パターン併発）。
- 参照: aiworkflow-requirements L-DEVSYNC-040。

### SP-DEVSYNC-034: branch-sync prompt の lock/log path は worktree-aware に解決する（2026-05-25 追加）

- 事象: branch-sync prompt の Pre-flight で `mkdir -p .git/branch-sync-logs` をそのまま発行すると、worktree 内では `.git` がテキストファイル（`gitdir: ...`）のため `mkdir: .git: Not a directory` で即失敗する。lock も同様に `.git/.branch-sync.lock` 直書きは破綻。
- Why: branch-sync の lock/log は「全 worktree 横断で単一」が必要（多重実行検出のため）。実体はメイン repo の `.git/` 配下に置く必要があるが、`git rev-parse --git-dir` は worktree 専用 dir（`.git/worktrees/<wt>/`）を返すため**不適**。`git rev-parse --git-common-dir` がメイン repo の `.git/` を一意に返す。
- How to apply（task 仕様書での逐語化）:
  - branch-sync / dev-sync 系プロンプトを task 仕様書に書く際、Pre-flight フェーズに以下 3 行を逐語埋め込む:
    ```
    GD=$(git rev-parse --git-common-dir)
    mkdir -p "$GD/branch-sync-logs"
    LOCK="$GD/.branch-sync.lock"
    ```
  - stale lock 判定は ISO8601 timestamp ではなく `stat -f %m "$LOCK"`（macOS）/ `stat -c %Y`（Linux）の mtime を `date +%s` と比較し 1800 秒境界で判定する。lock 内 timestamp はログ用に留める。
  - `.git/` 直書き path は worktree で破綻するため、task 仕様書の例示でも禁止する。
- 検証: 本パターンを再現する事例で `mkdir -p` が `Not a directory` で失敗するか、failure 後の `git rev-parse --git-common-dir` リトライで成功するかを Phase 11 evidence に記録する。
- 参照: aiworkflow-requirements L-DEVSYNC-041（同根の `index.lock` 問題は L-DEVSYNC-026）。

### SP-DEVSYNC-035: 並列 feature の同一 fetch 関数衝突は「Result wrapping 採用 × parser 拡張保持」で機械統合（2026-05-25 追加）

- 事象: dev sync-merge で `apps/web/app/(public)/members/[id]/page.tsx` の `fetchProfile` 内で 3-way conflict。HEAD = issue-883（adapter dev-warn unknown kind）が `PublicMemberProfileWithUnknownKindZ.parse(raw)` へ schema を差し替え、dev = issue-879（safeServerFetch 横展開）が同関数の戻り値を `{ ok: true, data } | { ok: false, error }` の Result 型へ wrapping。`>>>>>>> dev` 側の `result.data` を使う `return` 文と `<<<<<<< HEAD` 側の `raw`（既に削除済み変数）を参照する `return` 文が両側に並ぶ。
- Why: 「呼び出し規約変更（fetch 戻り値型）」と「副作用追加（unknown kind 警告のための parser 拡張）」は意味的に直交する。Result wrapping の方が呼び出し側 (page 本体) に波及するため上位レイヤーとして優先し、parser 拡張は wrapping 内部の `result.data` を新 parser に通す形で吸収すれば両意図とも保持できる。
- How to apply（task 仕様書での逐語化）:
  - fetch 関数 (`safeServerFetch` ラッパー化) と parser 拡張 (`*WithUnknownKindZ`) を同 sprint で並走させる task では、Phase 7 に「両者衝突時の統合手順」を明示する:
    1. 戻り値型は **dev 側 Result wrapping を採用**（呼び出し側の if 分岐が既に dev に存在するため）
    2. parse 行は **HEAD 側 `*WithUnknownKindZ.parse(result.data)`** を採用
    3. 呼び出し側 (page) では `!profileResult.ok` 分岐後、`toMemberDetailProps(profileResult.data, { onUnknownKind })` のように **dev 側 ok 分岐 × HEAD 側 option 引数** を結合
  - 検証: `grep -E '<<<<<<<|>>>>>>>|=======' <path>` 0 件 + `pnpm typecheck` PASS + 既存 page spec の SectionError 表示 + unknown-kind warn の両方の it ブロックが green。
- 参照: aiworkflow-requirements L-DEVSYNC-042（同事例の resolver 側パターン）。

### SP-DEVSYNC-035: `apps/web/src/lib/env.ts` への getter 追加 issue は Phase 5 で「並列 export 追加 conflict」を予告し、merge dry-run を推奨する（2026-05-25 追加）

- 事象: `env.ts` への新 getter / 新 `EnvSchema.pick(...)` 追加が短期間に 3 回連続 conflict した（#869 `getSecurityHeaderEnv` ↔ #862 `getAuthEnv`、#882 `getPublicEnvSafe` ↔ #869、後続 issue も同パターンが想定）。`pnpm sync:resolve` の `REGENERATE_TARGETS` で吸収可能な deterministic artifact と違い、`env.ts` は意味的差分を含むため自動解消対象外で必ず手動 resolve を要する。
- Why: `env.ts` は領域別 getter を継続追加する拡張点で、複数 issue が同 sprint で独立に新 export を生やす構造的問題。aiworkflow-requirements L-DEVSYNC-041 で「両側 export 保持 + import 集約」の機械統合パターンが確立済みなので、task 仕様書側はそれを Phase 5 で予告し、merge 前に conflict 範囲を確認する dry-run コマンドを Phase 9 / Phase 11 evidence に逐語埋め込む。
- How to apply（task 仕様書での逐語化）:
  - 対象判定: 仕様書の編集対象に `apps/web/src/lib/env.ts` が含まれる場合に本パターンを適用する。
  - Phase 5（実装）に「dev sync 時の env.ts 並列 export 追加 conflict 予告」節を追加し、L-DEVSYNC-041 の 3 ステップ（import 集約 / schema 両保持 / it ブロック両保持）を逐語コピーする。
  - Phase 9（QA）に dev sync dry-run 手順を埋め込む:
    ```
    git fetch origin dev
    git merge --no-commit --no-ff origin/dev || true
    git status --porcelain | grep "^UU apps/web/src/lib/env" && echo "env.ts conflict expected — apply L-DEVSYNC-041"
    git merge --abort
    ```
  - Phase 11 evidence に「`env.ts` conflict 解消後の `grep -nE '^(<<<<<<<|=======|>>>>>>>)' apps/web/src/lib/env.ts apps/web/src/lib/__tests__/env.spec.ts` 0 件」を必須項目化。
- 検証: `pr-pre-flight-ci-gate-checklist.md` §3（dev sync）の checklist に「env.ts に getter 追加がある場合は merge dry-run で conflict 範囲を確認した」項目を追加する。
- 参照: aiworkflow-requirements L-DEVSYNC-041 の再発事例。本知見は task 仕様書側の予防策（実装前の予告 + dry-run 推奨）であり、解消手順は L-DEVSYNC-041 を唯一の正本とする。

### SP-DEVSYNC-036: Playwright assertion で `console.error` / `pageerror` を**全件 toEqual([])** すると他 issue の副作用で fragile になる（2026-05-25 追加）

- 事象: 2026-05-25 `fix/issue-882` の e2e（`apps/web/playwright/tests/terms-prefetch.spec.ts`）が dev sync-merge 後の CI で `e2e (mobile-webkit)` / `e2e (desktop-firefox)` で失敗。test は `page.on("console")` で全 `console.error` を `errors[]` に push して `expect(errors).toEqual([])` していた。ローカルでは pass していたが、dev merge で取り込んだ **#869 CSP report-only モード**が「`[Report Only] Refused to apply a stylesheet...`」「`frame-ancestors' is ignored when delivered in a report-only policy`」等の console.error を多発させ、`toEqual([])` が破綻。
- Why: issue-882 の test 責務は「`/terms` RSC prefetch が env validation で 5xx / Zod throw を露出しない」こと。**全 `console.error` の不在**を assertion することは over-specification で、他 issue（CSP / nonce / a11y warning 等）が将来 console output を増やすたびに本 test が無関係に fragile に壊れる。Playwright e2e の assertion は「該当 issue が責任を持つ pattern のみ」に限定すべき。
- How to apply（task 仕様書での逐語化）:
  - 仕様書 Phase 5 / Phase 9 で「`console.error` / `pageerror` の broad-catch assertion 禁止」を明記する。
  - 必ず issue 固有の正規表現 patterns を配列で宣言し、`isXxxError(text: string): boolean` のヘルパで filter してから push する。例:
    ```ts
    const TERMS_ENV_ERROR_PATTERNS: RegExp[] = [
      /ZodError/i,
      /Invalid environment/i,
      /env\.ts/i,
      /terms.*prefetch/i,
    ];
    const isTermsEnvError = (text: string) => TERMS_ENV_ERROR_PATTERNS.some((p) => p.test(text));
    ```
  - Phase 11 evidence に「assertion patterns が issue 範囲に閉じている根拠（patterns 一覧 + 排除した他 issue 由来 noise の例）」を必須項目化。
  - test review 時の checklist 項目: `toEqual([])` / `toHaveLength(0)` が `page.on("console")` / `page.on("pageerror")` の **未 filter 配列**を対象としていないか。
- 検証: 本 spec を変更する PR の lefthook pre-push に既存 `verify-conflict-markers` / `lint` に加え、broad-catch pattern を grep する project local rule を追加（task-spec-creator 内では仕様書化のみ、実 hook は skill scope 外）。
- 事例: 2026-05-25 `fix/issue-882-terms-prefetch-env-validation` 修正で `TERMS_ENV_ERROR_PATTERNS` filter を導入し、CSP report-only の console.error を assertion 対象から除外。同種パターンは過去にも `axe` 系・`hydration warning` 系で経験あり（[[lessons-learned-dev-sync-merge-conflict-resolution-2026-05]] L-DEVSYNC-007-A の visual baseline drift と同根の「他 issue 副作用で fragile になる test」family）。
- 追加事例: 2026-05-25 PM `feat/issue-880-public-segment-error-loading-boundary` ← dev sync-merge で 77 分経過の stale lock を mtime 判定で検出・自動削除し再取得。conflict は skill index 6 ファイル（SKILL.md + indexes 4 + references/task-workflow-active.md + indexes/keywords.json）すべて `pnpm sync:resolve` で完結、手動介入ゼロ。後続 `pnpm typecheck` / `pnpm lint` / `bash scripts/verify-pr-ready.sh`（gate-metadata 445/0 + verify:phase12 + indexes drift なし）すべて green。本 SOP は単発実装ではなく 2 連続 session で同等条件を機械的に解決できる再現性を確保したため、Phase 5 / Phase 9 sync-merge 節の「逐語埋め込み 3 行」をデフォルトテンプレに昇格して問題ない。

### SP-DEVSYNC-037: spec ファイル EOF 末尾並列追加 conflict（HEAD = `describe` 追加 / dev = trailing comment block）は両側保持を明示する（2026-05-26 追加）

- 事象: 2026-05-26 `feat/issue-891-...` ← dev 二次 sync-merge で `apps/web/src/lib/adapters/__tests__/member-detail.spec.ts` のみ resolver の WARN unhandled。HEAD 側は KIND_ROUTE exhaustiveness `describe` 追加、dev 側は #941 issue-885 由来の `// === EXTENSION TEMPLATE ===` トレーリングコメントブロック追加。両者は同じ EOF 位置への純粋追記で、片側 take すると一方の意図が失われる。
- Why: spec / docs / README で「テスト追加」と「拡張テンプレートコメント」が同じ EOF 位置に並列追加されるのは構造的副産物。コード union（L-DEVSYNC-043 留意事項）と違い隣接挿入の順序のみが衝突するため、両側を直列に並べれば意味は保たれる。`UNION_MERGE_TARGETS` に spec / README を含めると意図しない describe 重複や comment 二重化を生むため、resolver で自動化せず手動 union を仕様書に明記する。
- How to apply（task 仕様書での逐語化）:
  - Phase 9 sync-merge 節に「spec EOF 末尾追記の両側保持ルール（aiworkflow-requirements L-DEVSYNC-044）」を逐語埋め込み。
  - 仕様書 Phase 5 で spec ファイルに大規模な末尾 `describe` 追加 / トレーリングコメント追加を予定する場合、Phase 9 dry-run checklist に「`git merge --no-commit --no-ff origin/dev || true` で当該 spec の conflict 範囲を事前確認」を追加。
  - resolver 拡張は不要（CONST: コード union は自動化しない）。
- 参照: aiworkflow-requirements [[lessons-learned-dev-sync-merge-conflict-resolution-2026-05]] L-DEVSYNC-044 を唯一の正本とする。本知見は task 仕様書側の予防 + 逐語埋め込み指針。

### SP-DEVSYNC-038: 同一 component で HEAD が**新 variant 追加** / dev が**旧 path 簡素化**の 3-way conflict は「HEAD 全採用」を default ルールとする（2026-05-27 追加）

- 事象: 2026-05-27 `feat/dashboard-prototype-alignment` ← origin/dev (11 commits behind) sync-merge で `apps/web/src/components/public/Hero.tsx` のみ resolver の `WARN unhandled conflict`。diff3 marker（`<<<<<<< HEAD` / `||||||| 7f651a083` / `=======` / `>>>>>>> origin/dev`）の 3 ブロック構造:
  - **base**: `<section data-component="hero" style={{ backgroundImage: "linear-gradient(...)" }}>` の inline-style 1 variant のみ
  - **HEAD (我側)**: prototype 整合の `<section data-variant="card">` + `<div data-role="accent" />` + `<div data-role="body">` + `<h1 data-role="title-serif">` を**新 variant として追加**（`variant === "panel"` 早期 return で旧 path 残置）
  - **dev (向側)**: 同じ base から inline-style 撤去（`<section data-component="hero">` のみ、token-css への移行）
- Why: 両側とも「inline-style backgroundImage を撤去する」方向性で**意味的に整合**しており、HEAD は「新 variant 追加 + 旧 path は panel variant として保持」、dev は「単一 path から inline-style 撤去」と粒度が違うだけ。HEAD 側で `variant === "panel"` 分岐が既に旧 inline-style path を保持しているため、dev の簡素化は HEAD の card variant 採用で自動的に supersede される。両者 union や dev take は重複 `<section>` 生成 / 既存 variant API 破壊につながる。
- How to apply（task 仕様書での逐語化）:
  - Phase 9 sync-merge 節に「**3-way conflict 判定フロー**」を追記:
    1. base / HEAD / dev の 3 ブロックを `grep -n -E '^(<<<<<<<|=======|>>>>>>>|\|\|\|\|\|\|\|)'` で位置確認
    2. dev の変更が base からの**単純化**かつ HEAD の変更が**新 variant / 新 entrypoint 追加**なら HEAD 全採用が default（dev の意図は HEAD の新 path に内包されるため）
    3. dev の変更が base からの**機能追加**（field 追加 / prop 追加）なら HEAD + dev の手動 union が必要
    4. 判定迷う場合は `git log -p origin/dev -- <path>` で dev 側 commit 意図を 1 行確認してから決定
  - 仕様書 Phase 5 で UI primitive 改修 task を予定する場合、Phase 9 dry-run checklist に「対象 primitive ファイルに対する `git log origin/dev ^HEAD -- <path>` で dev 側並列改修の有無を事前確認」を追加。
- 検証: `grep -nE '^(<<<<<<<|=======|>>>>>>>|\|\|\|\|\|\|\|)' <path>` 0 件 + `pnpm typecheck` PASS + `pnpm lint` PASS + 採用 variant の既存 spec / visual baseline が green。
- 事例: 2026-05-27 commit `57ff4402b` (`merge: sync ...`) は typecheck/lint green だが、**pre-push `verify-no-inline-style` (issue-924) が HEAD 残置の panel variant `style={{...}}` で fail**。追加 commit `f7b493456` で panel variant の inline-style も撤去（dev 側横断ルールを残 path にも適用）し push 成功。**判定フロー step 2.5**: dev 側 commit が refactor/chore 性質の横断撤去（hook gated CI rule 適用）なら、HEAD 採用 path にも同 rule を波及させる。`git log --oneline origin/dev ^HEAD -- <path>` で commit 性質確認 + `pnpm exec lefthook run pre-push --files <path>` で事前検証を Phase 9 dry-run checklist に追記。
- 参照: aiworkflow-requirements [[lessons-learned-dev-sync-merge-conflict-resolution-2026-05]] L-DEVSYNC-050 / L-DEVSYNC-050-A を併読。

### SP-DEVSYNC-040: shell contract 変更後は旧E2E contractとvisual-full横幅を同一waveで更新する（2026-05-28 追加）

- 事象: `feat/admin-shell-topbar-sidebar-integration` ← dev sync 後の PR #973 CI で `e2e (desktop-chromium / desktop-firefox / mobile-webkit)` と `visual-full (mobile/tablet)` が失敗。E2E は `parallel-03-admin-shell-scrape.spec.ts` が旧 contract の `[data-shell="topbar"]` visible を期待し続け、Task A spec は schema badge `3` を mock state 未seed のまま期待していた。visual-full は `/admin/members` table の intrinsic width が page screenshot の fullPage 幅を 390/768 から 640+/900+ に膨張させ、Linux baseline dimension mismatch になった。
- Why: shell 変更は layout DOM contract と page-local header ownership を同時に変えるため、実装だけでなく既存 runtime evidence spec の selector contract も更新対象。さらに admin shell 内の table は desktop-first columns をそのまま残すと mobile/tablet viewport で横 overflow し、Playwright `toHaveScreenshot({ fullPage: true })` が scrollable content width を撮るため baseline サイズが変わる。
- How to apply（task 仕様書での逐語化）:
  - Phase 4 test plan に「shell/topbar/sidebar contract を参照する既存 Playwright spec 一覧」を列挙し、廃止 DOM は `toHaveCount(0)`、新正本 DOM は `getByTestId` / `data-shell-mode` で検証する。
  - schema badge / KPI 等の server-layout fetch 由来値を assertion する場合、mock control endpoint と response route の両方を用意し、test 内で assertion 直前に seed する。
  - admin table を mobile/tablet visual-full 対象に含める場合、`table-fixed`、break/truncate、breakpoint 列非表示で **page screenshot width が viewport と一致**することを Phase 9 に入れる。`min-width` + horizontal scroll は fullPage screenshot では幅膨張の原因になるため避ける。
  - ローカル検証は Linux snapshot が無くても actual PNG の dimensions を確認する: tablet `768 x 1024`、mobile `390 x 844`。Darwin snapshot missing は CI Linux baseline 判定とは別扱い。
- 検証: focused Playwright `admin-shell-topbar-sidebar-integration.spec.ts` / `parallel-03-admin-shell-scrape.spec.ts` PASS、MembersTable Vitest PASS、actual PNG dimensions が viewport と一致。
- 参照: aiworkflow-requirements L-DEVSYNC-054。

### SP-DEVSYNC-039: feature 側 rename × dev 側 sibling 追加の playwright.config 3-way（2026-05-27 追加）

- 事象: 2026-05-27 `feat/members-list-prototype-alignment` ← origin/dev sync-merge で `apps/web/playwright.config.ts` の `EVIDENCE_DIR` 三項分岐が 3-way conflict。HEAD 側は workflow dir rename（`members-page-prototype-alignment` → `members-list-prototype-alignment`）、dev 側は同位置の三項に **新 sibling `isPublicDashboardPrototypeAlignment` 分岐を挿入**。base は旧名のみ。
- Why: rename と sibling 追加は意味的に独立で、`||||||| 04c569a48` block を捨てて HEAD の rename と dev の sibling を**両側手動 union**するのが正。片側 take すると path rename か sibling 分岐かのどちらかを失う。
- How to apply（task 仕様書での逐語化）:
  - Phase 9 sync-merge 節に「playwright.config の EVIDENCE_DIR / serverReadyURL 三項分岐は **base 削除 + HEAD path + dev sibling 全採用** の手動 union を default にする」を追記。
  - Phase 4 risk に「workflow dir rename を伴う UI feature は dev 側 sibling 追加と同位置で衝突する」を登録し、merge 前に `git log origin/dev ^HEAD -- apps/web/playwright.config.ts` で sibling 追加 commit の有無を確認するチェックを加える。
- 事例同時発生: `.claude/skills/task-specification-creator/references/patterns-lessons-and-pitfalls.md` EOF で HEAD 側 `## DOM 構造置換 PR ...` 節 + dev 側 `## accent on accent-soft chip ...` / `## L-DEVSYNC-051 visual baseline ...` / `## L-FETCHCACHE-001 ...` 3 節が並列追加。SP-DEVSYNC-037 同パターンで両側保持＋marker 物理除去で解消（resolver 非対応の手動 union）。
- 検証: `grep -nE '^(<<<<<<<|=======|>>>>>>>|\|\|\|\|\|\|\|)' <path>` 0 件 + `pnpm typecheck` PASS + `pnpm lint` PASS。

### SP-DEVSYNC-040: in-place 全面リデザイン feature × dev 側 followup 並列改修は「同一領域 component 群一括 take ours + spec drift 再復元」（2026-05-28 追加）

- 事象: 2026-05-28 `feat/admin-members-prototype-redesign` ← origin/dev sync-merge で /admin/members 周辺 6 ファイル（`page.tsx` / `MembersFilters.tsx` / `MembersTable.tsx` / `MemberDrawer.tsx` / `MembersClientShell.tsx` / `MembersFilters.spec.tsx`）が `WARN unhandled conflict`。HEAD は単一 commit `feat(admin-members): /admin/members prototype redesign` で primitive 群追加 + 既存 component の全面置換 + spec 全面書き換え。dev は `#968` followup-001 で同 component 群に漸進的整合（既存 prop API を維持しつつ MembersPageHead / Breadcrumb 分離追加）。
- Why: 両方とも「プロトタイプ整合」だが粒度が違う（一括 redesign vs 漸進的整合）。union 不可・dev take は redesign 全体破壊。HEAD 全採用が正解で、dev の本体機能（API 404 fix など）は conflict 外ファイルで既に auto-merge 済みのため失われない。
- How to apply（task 仕様書での逐語化）:
  - Phase 4 risk に「in-place redesign 単一 commit を含む feature は dev 側 followup と同一 component 群で構造的に衝突する」を登録。
  - Phase 9 sync-merge 節に「**redesign 一括 take ours 判定フロー**」を追記:
    1. `WARN unhandled conflict` 一覧が同一 feature 領域の component 群（5 file 以上）+ 対応する spec で構成されているか確認
    2. `git log --oneline HEAD ^dev -- <component path>` で HEAD 側が「全面 redesign 単一 commit」か判定
    3. 該当なら `for f in <files>; do git checkout --ours "$f"; git add "$f"; done` → `git commit --no-edit` で一括解消
    4. **必ず追加 typecheck**: auto-merge された spec/component 周辺で **prop drift error** が出る前提で `pnpm --filter @ubm-hyogo/web typecheck` を実行。drift 検出時は `git show <redesign tip>:<spec path> > <spec path>` で HEAD 側 spec を強制復元し追加 commit `fix(<scope>): restore redesign <name> spec after dev merge`
- 留意:
  - 「conflict marker なしで auto-merge された spec」が最大の罠。HEAD 側 component の prop が変わっているのに spec は dev 側 prop が残るパターンが頻発する
  - dev followup の本体機能（API path fix / route handler 等）は通常 conflict 外で auto-merge 済みのため、HEAD take しても保持される（安心して take ours できる）
- 事例: 2026-05-28 merge commit `709f13920` + spec restore commit `8f510ba33`。typecheck 初回 `MembersTable.spec.tsx` で `summariesByMember` / `tagsByMember` / `onTogglePublish` prop が存在しない error 3 件 → HEAD redesign tip から spec 復元で green。
- 参照: aiworkflow-requirements [[lessons-learned-dev-sync-merge-conflict-resolution-2026-05]] L-DEVSYNC-054 を併読。

### SP-DEVSYNC-041: 全面 redesign 直後の CI e2e 失敗 2 パターン — PillNav 兄弟 strict-mode collision と 複数 viewport suite の cold-compile timeout（2026-05-28 追加）

- 事象: SP-DEVSYNC-040 の redesign sync-merge 完了後の CI 再修正 wave で連続発生:
  1. `task15-admin-screenshots.spec.ts` の `getByRole('tab', { name: '公開' })` が `<select>` → PillNav 置換後に「公開」「非公開」両方マッチ → **strict mode violation**
  2. `admin-members-prototype-redesign.spec.ts` の 4 viewport × 4 state = 16 連続 `page.goto` が Next 16 dev cold-compile（各 >10s）累積で **Test timeout of 60000ms exceeded**（ローカルでは pre-warm cache で通り CI のみ顕在化）
- Why: PillNav に置換すると label が**他 label の prefix になり得る**（`公開` ⊂ `非公開`）。playwright `getByRole({ name })` は部分一致なので strict mode で必ず衝突する。`<select>` `<option>` だった頃は要素自体が分離していたため発覚しなかった。複数 route 訪問 suite は CI dev mode で構造的に timeout に到達する。
- How to apply（task 仕様書での逐語化）:
  - Phase 4 risk に「PillNav / Tab 置換は label が兄弟ラベルの prefix にならないか全テストを grep する」を登録
  - Phase 6 test additions 節に「複数 viewport × 複数 state の phase-11 screenshot suite は `test.slow()` 必須（Next dev cold-compile absorb 目的）」を逐語化
  - Phase 9 CI 再修正 runbook に以下手順を追記:
    1. `grep -rn "name: '<新 label>'" apps/web/playwright/tests/` で全テスト走査
    2. 兄弟 label の prefix になっている hit があれば `{ exact: true }` または `/^<label>$/` に書き換え
    3. 新規 phase-11 screenshot 16+ ナビゲーション suite は `test(...)` 関数先頭で `test.slow()` を宣言
    4. commit message: `fix(<scope>): use exact match for <label> tab to avoid strict-mode collision with <sibling>` / `fix(<scope>): mark <suite> test as slow to absorb Next dev cold-compile across NxM navigations`
- 留意:
  - `playwright.config.ts` の global `timeout` を上げるより**該当 test 単独で `test.slow()`** にするほうが他 suite への副作用がない
  - `playwright-visual-full` の baseline drift は redesign 後は必ず発生し、`playwright-visual-baseline-update` workflow の `environment: visual-baseline-approval` 経由のみで更新可能。CI 再修正対象外として user-gated escalation する
- 事例: 2026-05-28 commit `05c30022b` (PillNav exact 修正) + `5bbee59da` (test.slow 追加) で `e2e-tests-coverage-gate` 全 4 project green。`playwright-visual-full` は 8 admin route × mobile baseline drift で fail 継続 → user 報告のみ。
- 参照: aiworkflow-requirements [[lessons-learned-dev-sync-merge-conflict-resolution-2026-05]] L-DEVSYNC-055 を併読。

### SP-DEVSYNC-040: fetch wrapper の error-handler 内に「HEAD=dev限定 warn ログ」「dev=throw 文字列の body 付与」が同位置追加されたときの順次合成 default ルール（2026-05-28 追加）

- 事象: 2026-05-28 `feat/admin-tag-queue-ui-and-404` ← origin/dev sync-merge で `apps/web/src/lib/admin/server-fetch.ts` の `fetchAdmin()` `if (!res.ok)` block が `WARN unhandled conflict`。base は単純 throw、HEAD は dev 限定 404 warn、dev は error message に body snippet（先頭 256 文字）付与。両者とも機能直交な観測強化。
- Why: error-handler 同一 block への直交追加は構造的に再発する（fetch wrapper の error 拡張は monitoring / debug 強化目的で並列改修されやすい）。片側 take は他方の観測点喪失、両側 union は body 二重消費（`Response.body used` runtime error）の risk。順次合成（① body→snippet 取得 → ② dev-warn 404 ログ → ③ snippet 付き throw）が default。
- How to apply（task 仕様書での逐語化）:
  - Phase 9 sync-merge 節に「**error-handler block 3-way 判定フロー**」を追記:
    1. base / HEAD / dev を `grep -n -E '^(<<<<<<<|=======|>>>>>>>|\|\|\|\|\|\|\|)'` で位置確認
    2. base が「単純 throw / 単純 return」かつ HEAD / dev が**同 if-branch 内の独立観測 / 副作用追加**なら順次合成 default
    3. 並び順は「cheap な分岐先頭で副作用なし計算（body text 取得 等）」→「dev-only ログ等の condition 付き観測」→「throw / return」
    4. `Response` 等の **1 回消費 stream** は先頭で 1 度だけ消費し、変数共有
  - Phase 4 risk に「fetch wrapper の error 拡張は同 if-branch で並列改修されやすい」を登録。仕様書 Phase 9 dry-run checklist に `git log origin/dev ^HEAD -- <fetch wrapper path>` で error-handler 改修 commit の有無を事前確認するチェックを追加。
- 検証: `grep -nE '^(<<<<<<<|=======|>>>>>>>|\|\|\|\|\|\|\|)' <path>` 0 件 + `pnpm typecheck` PASS + `pnpm lint` PASS + 両 commit 由来の spec が green。
- 参照: aiworkflow-requirements [[lessons-learned-dev-sync-merge-conflict-resolution-2026-05]] L-DEVSYNC-054 を併読。

### SP-DEVSYNC-040: invariant 強化 refactor ブランチでの source conflict は HEAD 全採用が default（2026-05-28 追加）

- 事象: 2026-05-28 `feat/profile-server-components-render-error` ← origin/dev sync-merge で `apps/web/src/lib/fetch/authed.ts` のみ resolver `WARN unhandled`。3-way の HEAD は env unification (`getApiBaseEnv()` 単一 accessor + fallback 撤去 + 未設定 throw)、dev は中間形 (`getAuthEnv()` / `getPublicFetchEnv()` 別 accessor + fallback 据置)、base は `process.env` 直参照 + `127.0.0.1:8787` 焼き込み。
- Why: HEAD のほうが `apps/web` env invariant（CLAUDE.md「`apps/web` env アクセス不変条件」task-02 wrangler-env-injection）の最終形に到達しており、dev は HEAD が置換しようとしている中間状態。HEAD 採用で dev の意図も自動達成。手動 union は invariant 違反（`process.env` 直参照復活 / fallback 焼き込み復活）を招く。
- How to apply（task 仕様書での逐語化）:
  - Phase 9 sync-merge 節に「**invariant 強化 refactor 判定**」を SP-DEVSYNC-038 step 2.5 の前段として追記:
    - ブランチ名 / PR title / Phase 1 要件に **env unification / fallback retirement / invariant lock** 等の refactor 語彙があるかを確認
    - 該当する場合、source conflict は `git checkout --ours <path>` で **HEAD 全採用が default**
    - 採用後、HEAD で使う accessor が `apps/web/src/lib/env.ts` 等の dependency に実在することを `grep -n` で確認（dev 側に存在しない関数参照だと build 失敗）
  - Phase 4 risk に「invariant 強化 refactor ブランチは dev 側中間形と同位置で衝突する」を登録し、merge 前に `git log -p origin/dev ^HEAD -- <path>` で dev の中間形 commit を事前把握する checklist を加える。
- 検証: `grep -nE '^(<<<<<<<|=======|>>>>>>>|\|\|\|\|\|\|\|)' <path>` 0 件 + `pnpm typecheck` PASS + `pnpm lint` PASS + 採用 accessor の export 実在を grep で確認。
- 適用範囲外: invariant に関係しない feature ブランチ（UI 整合 / 機能追加等）は SP-DEVSYNC-038 の 3-way 判定フロー（新 variant 追加 vs 簡素化）に戻る。
- 参照: aiworkflow-requirements [[lessons-learned-dev-sync-merge-conflict-resolution-2026-05]] L-DEVSYNC-054 を唯一の正本。


### SP-DEVSYNC-041: skill-only conflict shape 判定で resolver 単発確定（2026-05-28 追加）

- 事象: 2026-05-28 `feat/issue-958-h3-public-filter-ux` ← origin/dev sync-merge のコンフリクトが skill md 5 + derived 1 (`indexes/keywords.json`) の resolver 完全対応範囲のみ。`.ts/.tsx` source の hybridize 不要。
- Why: feature branch の実装範囲（H3 public filter UX = 新規 `apps/web/app/(public)/members/page.tsx` 系 + `BulkRepublishDrawer` + `useBulkRepublish`）が dev 側並列実装（admin-ui modernization wave）と path orthogonal なため file-level 衝突が skill 系のみに収束する shape になった。
- How to apply（task 仕様書での逐語化）:
  - Phase 9 sync-merge 節に「**skill-only conflict shape の早期判定**」を SP-DEVSYNC-038 step 1 の直後に追記:
    - `git status --porcelain | grep '^UU'` の全 path が `.claude/skills/aiworkflow-requirements/{SKILL.md,indexes/*.md,indexes/keywords.json,references/task-workflow-active.md}` のいずれかに該当するか確認
    - 全件該当なら `pnpm sync:resolve` 単発で確定し、手動 hybridize lesson (L-DEVSYNC-056/058 / SP-DEVSYNC-038..040) を**呼び出さない**
    - resolver stdout に `union-resolved` × N + `ours:` × keywords.json + `all skill / index conflicts resolved` が揃うことを必ず確認
  - Phase 4 risk: feature branch の実装範囲が dev の changed paths と orthogonal な場合に該当 shape が成立しやすいことを明記。逆に `apps/web/app/(admin)/admin/**` や共有 primitive (`AdminPageHeader` / `AdminSidebar`) を触る branch は手動 hybridize 前提に戻る。
- 検証: `git status --porcelain | grep -E '^(UU|AA|DD)'` 空 + `git diff --check` 空 + `pnpm typecheck` PASS + `pnpm lint` PASS。
- 参照: aiworkflow-requirements [[lessons-learned-dev-sync-merge-conflict-resolution-2026-05]] L-DEVSYNC-059。

### SP-DEVSYNC-041: barrel-import vs direct-path import の 3-way + 直交 props/UI 拡張は HEAD barrel + 両側 union が default（2026-05-28 追加）

- 事象: 2026-05-28 `feat/admin-audit-prototype-alignment` ← origin/dev sync-merge で `apps/web/app/(admin)/admin/audit/page.tsx` と `apps/web/src/components/admin/AuditLogPanel.tsx` の 2 ソースが `pnpm sync:resolve` 後に残る。HEAD は AdminPageHeader を **barrel `index.ts` 経由 import** + prototype 整合の Card+form filter UI 追加。dev は **`_layout/AdminPageHeader` 直接 path import** + AdminPageHeader に `eyebrow` prop 追加 + `showHeading` で `<h1>` 出し分け。base はそれぞれ旧 `Breadcrumb` import / 単純 header 構造。
- Why: barrel が当該 export を `export * from "./_layout/AdminPageHeader"` で既に再 export している場合、両 import 形は同一実体を指す（型・実装差なし）。barrel 経由のほうが internal layout の private path への lock-in を避けられるため安定 API。`eyebrow` prop は AdminPageHeader が optional として受けるため両側 props を union 可能。`showHeading` 条件 header と Card+form filter UI 追加は構造上 orthogonal で、section ラッパに両側属性 union + 内部 children 順次配置で両立する。
- How to apply（task 仕様書での逐語化）:
  - Phase 9 sync-merge 節に「**barrel vs direct-path import の 3-way 判定**」を SP-DEVSYNC-038 step 2 の派生として追記:
    1. HEAD と dev で同一 component の import path が異なる場合、まず `grep "from \"./<sub>/<Component>\"" <feature>/components/index.ts` で barrel に該当 export があるかを確認
    2. 存在する場合は **barrel 経由 import (HEAD) を default 採用**
    3. 存在しない場合は barrel に export を追加してから 1 に戻る
    4. import 行差分のみの 3-way は他の意味的衝突を伴わないため、import 解消後は残りの conflict block を独立評価する
  - 「**section ラッパ属性 + 子要素の両側 union パターン**」を追記:
    - HEAD `className` と dev `aria-labelledby`/`aria-label` 条件分岐は orthogonal なので 1 つの section opening tag に全属性を列挙
    - 内部 children は dev の条件付き `<header><h1>` を先頭、HEAD の新規 `<Card>` 以降を続けて配置（dev 側の出し分け契約を尊重しつつ HEAD の prototype 整合 UI を保持）
  - Phase 4 risk に「UI prototype 整合 feature ブランチは dev 側の primitive prop 拡張（eyebrow / showHeading 等）と同位置で衝突する」を登録し、merge 前に `git log origin/dev ^HEAD -- <component path>` で primitive 拡張 commit の有無を事前確認するチェックを加える。
- 検証: `grep -nE '^(<<<<<<<|=======|>>>>>>>|\|\|\|\|\|\|\|)' <path>` 0 件 + `pnpm typecheck` PASS + `pnpm lint` PASS + barrel 経由 import の export 実在を `grep "from \"./_layout/<Component>\"" .../components/index.ts` で確認。
- 参照: aiworkflow-requirements [[lessons-learned-dev-sync-merge-conflict-resolution-2026-05]] L-DEVSYNC-057 を唯一の正本。


## SP-DEVSYNC-039: `pnpm sync:resolve` 中断による stale `index.lock` 復旧手順（2026-05-29）

- 事象: sync-merge 中の `pnpm sync:resolve` がラッパー timeout で SIGTERM 受信、union-resolve 後の `git add` 段階で `.git/worktrees/<wt>/index.lock` が残留、以降の git 操作が「Another git process seems to be running」で全 block。
- How to apply（Phase 9 risk + Phase 10 verification 記載手順）:
  1. Phase 9 risk に「sync-merge wrapper timeout < 60s で `pnpm sync:resolve` を呼ぶと git index.lock orphan が確率的に発生」を登録。
  2. Phase 10 verification に lockfile 復旧手順を明記: `GITDIR=$(git rev-parse --git-dir)` → `ls -la "$GITDIR/index.lock"`（mtime と PID 列が空 / 他 git process 不在を確認）→ `rm -f "$GITDIR/index.lock"` → 中断時点の resolve 残件を `git checkout --ours <path>` / `git add <path>` で個別終端 → `pnpm indexes:rebuild` で keywords.json 整合性回復 → `git status --diff-filter=U` 0 件確認 → merge commit。
  3. lockfile の自動除去スクリプト化は禁止。SIGTERM 受信ログ等の明示的根拠なしに `rm -f index.lock` を流すと並走 git process との race を招く。
- 参照: aiworkflow-requirements [[lessons-learned-dev-sync-merge-conflict-resolution-2026-05]] L-DEVSYNC-059 を唯一の正本。

### SP-DEVSYNC-042: add-add で **異なる名前の独立 interface/type を同 module の同位置に追加** したら両方保持が default（2026-05-29 追加）

- 事象: 2026-05-29 `feat/fix-admin-fetch-cf-1042-service-binding` ← origin/dev sync-merge で `apps/web/src/lib/env.ts` の同位置に HEAD が `AdminFetchEnv` interface、dev が `ApiBaseEnv` interface を独立追加した add-add semantic conflict（同 module 下部で各々 `getAdminFetchEnv()` / `getApiBaseEnv()` が両 interface を referenced）。`pnpm sync:resolve` の汎用 union は `.ts` を対象外にしているため手動解消必須。
- Why: 名前空間が衝突しておらず、両 interface とも **同 module 内の別 getter で同時に referenced** されている。片側 take すると referencing getter が compile error。SP-DEVSYNC-038 の「新 variant 追加 vs 簡素化」とは別軸の **直交シンボル並列追加**パターン。
- How to apply（task 仕様書での逐語化）:
  - Phase 9 sync-merge 節に「**直交 export 並列追加の safe-union 判定**」を SP-DEVSYNC-038 step 3 の派生として追記:
    1. conflict block の HEAD/dev で **異なる名前** の `export interface` / `export type` / `export function` を確認
    2. 各シンボルを `grep -n "<シンボル名>" <module>` し、定義 1 件 + 他箇所 reference 1 件以上が両方に存在することを確認
    3. 全条件を満たすなら **conflict marker のみ撤去して両ブロックを縦に並べる**（HEAD → dev 順）
    4. `pnpm typecheck` で referencing 全 getter green を確認
  - Phase 4 risk に「`apps/web/src/lib/env.ts` 等の env accessor module は並列 wave で異なる context (admin / public / member) 用 interface が独立追加されやすい」を登録し、merge 前に `git log origin/dev ^HEAD -- apps/web/src/lib/env.ts` で並列追加 commit を事前確認するチェックを加える。
- 適用範囲外: 同名 interface への両側 field 追加は SP-DEVSYNC-041 系の field hybridize に分岐。barrel re-export の name collision がある場合は per-symbol 解消が必要。
- 検証: `grep -nE '^(<<<<<<<|=======|>>>>>>>|\|\|\|\|\|\|\|)' <module>` 0 件 + `pnpm typecheck` PASS + `pnpm lint` PASS + 両 referencing getter が両 interface を import せず inline 参照で green。
- 参照: aiworkflow-requirements [[lessons-learned-dev-sync-merge-conflict-resolution-2026-05]] L-DEVSYNC-059 を唯一の正本。

### SP-DEVSYNC-043: 4 index 派生物の同時 conflict でも resolver 単発で収束する（2026-05-29 確認）

- 事象: 2026-05-29 `feat/public-header-logged-login-redirect-when-authenticated` ← origin/dev sync-merge で conflict 7 件 = 両 skill の `SKILL.md` 2 + aiworkflow `indexes/{keywords.json,quick-reference.md,resource-map.md,topic-map.md}` 4 + `references/task-workflow-active.md` 1。本 branch の実装ファイル `apps/web/app/login/page.tsx` は `Auto-merging` で textual conflict なし（直交接触面）。
- Why: index 派生 4 件が一度に衝突しても、union-merge 対象（SKILL/quick-ref/resource-map/topic-map/task-workflow-active）と `--ours + rebuild` 対象（keywords.json）に綺麗に分かれるため、resolver の決定的 rebuild が 4 件同時でも単発で収束する。SP-DEVSYNC-042 の `.ts` 手動 hybridize 経路は **発火しない**（page-level 接触面が無い skill-only shape）。
- How to apply（task 仕様書での逐語化）: Phase 9 sync-merge 節の事前見積で「conflict 全件が skill index/SKILL/task-workflow-active/keywords.json に限定されるなら、index が複数同時衝突していても追加工数を見込まない（`pnpm sync:resolve` 単発）」を明記。`.tsx`/`.ts` の conflict が 1 件でも混在する場合のみ SP-DEVSYNC-038/042 の手動 hybridize 工数を Phase 11/13 に積む。
- 検証: `pnpm sync:resolve` stdout `union-resolved 6 files` + `ours: keywords.json` + `indexes:rebuild` 完走 → `git ls-files -u` 0 → `pnpm typecheck` 6 packages Done → `pnpm lint` Done → `pnpm indexes:rebuild` 再実行 no drift。merge commit `0ad9e3555`。
- 参照: aiworkflow-requirements [[lessons-learned-dev-sync-merge-conflict-resolution-2026-05]] L-DEVSYNC-060 再現事例（2026-05-29 第3例）。
- 再現（2026-05-30 `docs/web-worker-size-limit-fix-spec` ← origin/dev sync-merge）: dev 側 1 コミット（#1013 認証状態別ヘッダー表示基盤）取り込みで conflict 3 件 = aiworkflow `indexes/{resource-map.md,topic-map.md}` 2 + `references/task-workflow-active.md` 1（`SKILL.md`/`quick-reference.md`/`keywords.json` は `Auto-merging` で textual conflict なし）。`.tsx`/`.ts` 接触面ゼロの skill-only shape。`pnpm sync:resolve` で 3 件 union 自動解消 + `keywords.json` rebuild（5200 キーワード）→ `git ls-files -u` 0 → merge commit 単発 → `pnpm indexes:rebuild` 再実行 no drift（後追い chore commit 不要）→ `pnpm typecheck` 6 packages Done / `pnpm lint` Done。SP-DEVSYNC-043 の「index 複数同時衝突でも resolver 単発収束 / 追加工数不要」が conflict 件数 3〜7 のレンジで再現することを確認。merge commit は CLAUDE.md sync-merge ポリシーで `staged-task-dir-guard` が `MERGE_HEAD` 検出 auto-skip するため `--no-verify` 不要。


### SP-DEVSYNC-044: 同一 feature の **競合実装**（module 分割 vs inline + 相違 DOM 契約）は canonical branch の coherent unit を wholesale 採用 + consumer 対向契約の grep verify を仕様化（2026-05-30 追加）

- 事象: 2026-05-30 `feat/public-header-session-aware-auth-view-base` ← origin/dev sync-merge で、HEAD（auth-view base 担当 branch）が auth-view を `types.ts`/`getAuthView.ts`/`resolveAuthView.ts` に module 分割 + barrel re-export、dev が同 feature を sibling branch 経由で **index.ts インライン単一実装** として先取りしていた競合。session API（`getAuth()`+`memberId` vs `getSession()`+`SessionUser`）・DOM 契約（`data-component`+`member-cta`/`admin-cta`+`管理画面` vs `data-testid`+`管理`）すべて相違。page-level conflict 6 件（component/spec/module/layout/layout.spec）。
- Why: SP-DEVSYNC-038（新 variant 追加 vs 簡素化）/ SP-DEVSYNC-042（直交 symbol 並列追加）はいずれも「両側を残す/片側 take」で済む。本パターンは **同一機能を構造・API・契約すべて違う形で両側が完成させた** ため、行単位 hybridize は契約が混線して破綻する。test suite が揃っている canonical branch の coherent unit を丸ごと残す方が regression risk 最小。
- How to apply（task 仕様書での逐語化）:
  - Phase 9 sync-merge 節に「**同一 feature 競合実装の wholesale 解消判定**」を追記:
    1. conflict block の HEAD/dev が **同名 export だが import 元・session/data API・DOM 属性が相違** → 同一 feature の競合実装と判定（add/add も含む）。
    2. feature の dedicated/canonical branch（= 当該 feature を主題とする branch）側を `git checkout --ours <unit 全ファイル一括>` で wholesale 採用（component + spec + module 群 + layout + layout.spec を 1 単位）。
    3. **wholesale 採用前に unit 外 consumer の対向契約依存を grep**: `grep -rn '<dev側 DOM 契約 token>' apps/web/app apps/web/src`。mock 化された self-contained spec（`vi.mock(<component>)`）や両契約を併持する shared primitive（例 `SignOutButton` の `data-testid`）は regression 非該当として除外し、実 DOM 依存 consumer のみ残課題化。
  - Phase 4 risk に「auth/header 等の base feature branch は sibling branch が dev に別構造で先着取り込みしている可能性。merge 前に `git log origin/dev ^HEAD -- <feature dir>` で対向実装 commit を事前確認」を登録。
  - Phase 11/13 検証に「wholesale `--ours` 後は focused vitest を **unit + consumer route まで広げて実行**（unit のみだと mock 化 consumer の契約乖離を見逃す）」を明記。
- 適用範囲外: 同一構造で field/variant だけ違う場合は SP-DEVSYNC-038/041 系の hybridize。skill-only conflict は resolver 単発（SP-DEVSYNC-043）。
- 検証: `git diff --diff-filter=U` 0 件 + `pnpm typecheck` PASS + `pnpm lint` PASS + `vitest run apps/web/src/lib/<feature> apps/web/src/components/<area> apps/web/app`（本例 81 files / 383 tests PASS）。merge commit `060bab6bf`。
- 参照: aiworkflow-requirements [[lessons-learned-dev-sync-merge-conflict-resolution-2026-05]] L-DEVSYNC-063 を唯一の正本。

### SP-DEVSYNC-045: 同一 branch の N 回目 sync でも conflict 集合は毎回変動 — unmerged を毎回一次取得し、`references/patterns-lessons-and-pitfalls.md`（`merge=union` 対象外）も resolver 対象に含めて見積もる（2026-05-30 追加）

- 事象: 2026-05-30 `feat/admin-sidebar-public-return-link` ← origin/dev（HEAD `51ec9eb06` = PR #1032 Cloudflare Worker サイズ制限修正 = next/og 撤去 + 静的 OG 画像化 + CI サイズ gate）の **4 回目** sync-merge。conflict は 5 件 = aiworkflow `indexes/{quick-reference,resource-map,topic-map}.md` 3 + `references/task-workflow-active.md` 1 + task-specification-creator `references/patterns-lessons-and-pitfalls.md` 1。**3 回目（#1013）は conflict 2 件**だったが、同 branch・同接触面で集合が 2→5 件に変動した。#1032 が取り込む source（OG 画像撤去 + `og-default.png` + size gate script）は admin sidebar branch と path 直交のため全て `Auto-merging`、衝突は skill 同期ログ系のみに収束。
- Why: dev 側 skill 追記の diff 位置が PR ごとに移動するため、同一 branch を連続 sync しても conflict 集合は固定されない。SP-DEVSYNC-043 の「index 複数同時衝突でも resolver 単発収束」が conflict 件数のレンジ（1〜7 件）で再現する一方、**「前回 N 件だったから今回も N 件」という見積もりは外れる**。加えて `references/patterns-lessons-and-pitfalls.md` は `.gitattributes` の `merge=union` 4 glob（`SKILL-changelog.md`/`LOGS/_legacy.md`/`lessons-learned/*.md`/`docs/30-workflows/LOGS.md`）に**含まれない**ため、append-only history でも git は実 conflict marker を立てる。これは resolver の union 解消対象であり、手動 Edit は不要。
- How to apply（task 仕様書での逐語化）:
  - Phase 9 sync-merge 節に「**conflict 集合は sync ごとに変動する**前提を明記。前回 sync の conflict ファイル一覧を見積もりに流用せず、毎回 `git diff --name-only --diff-filter=U` を一次ソースとして取得する」を追記。
  - 同節の `merge=union` 説明に「**`references/patterns-lessons-and-pitfalls.md` / `references/task-workflow-active.md` は `merge=union` 対象外 → 実 conflict marker が立つが `pnpm sync:resolve` の解消対象**。`lessons-learned/*.md`（auto-merge・marker なし）と区別する」を併記。
  - Phase 11 見積で「dev が source code を大量取込していても、本 branch の接触 path と直交なら conflict は skill ログ系に収束 → resolver 単発・追加工数ゼロ・取込 source の visual baseline 再取得不要」を判定基準に追加（接触 path が交差する場合のみ SP-DEVSYNC-038/042/044 の手動工数を積む）。
- 適用範囲外: source `.ts/.tsx` の接触面が 1 件でもあれば SP-DEVSYNC-042（直交 symbol）/ SP-DEVSYNC-044（同一 feature 競合実装 wholesale）へ分岐。
- 検証: `git diff --diff-filter=U` 0 件 + `pnpm typecheck` 6 packages Done + `pnpm lint` exit 0（`stablekey-literal-lint` warning は mode=warning・既存由来で成否判定外）。merge commit `be5ce59ea`、`pnpm sync:resolve` 単発で 5 件 union 解消（`indexes:rebuild` drift ゼロ）。
- 参照: aiworkflow-requirements [[lessons-learned-dev-sync-merge-conflict-resolution-2026-05]] L-DEVSYNC-067 を唯一の正本（同 branch 3 回目原型は L-DEVSYNC-065）。


### SP-DEVSYNC-045: child-branch (e2e/test coverage 追加) が parent-feature の canonical landing と sync する場合は **dev 側 wholesale `--theirs`** を仕様化（2026-05-30 追加）

- 事象: 2026-05-30 `feat/public-header-auth-slot-e2e` ← origin/dev (PR #1013 = parent base の canonical landed) sync-merge。HEAD は parent base の forked-snapshot を持つだけで、固有貢献は Playwright e2e (`playwright/tests/auth-slot-coverage.spec.ts`) 追加のみ。auth-view + PublicHeader が同 feature の競合実装として 8 件 page-level conflict（types/getAuthView/resolveAuthView/index + spec + PublicHeader + spec + layout）。
- Why: SP-DEVSYNC-044 は canonical = HEAD 側だったため `--ours` wholesale だが、本パターンは **canonical が dev 側**（parent base が先に PR #NNNN で landing 済み）に反転。child branch の固有貢献が test/coverage 追加のみで prod code 変更を含まない場合、wholesale `--theirs` で固有貢献は失われない（test ファイルは別 path にあるため conflict 対象外）。
- How to apply（task 仕様書での逐語化）:
  - Phase 9 sync-merge 節に「**child-branch sync-merge の reverse-canonical 判定**」を追記:
    1. branch 命名が `feat/<parent-feature>-<child-suffix>` 形（例 `-e2e` / `-coverage` / `-visual` / `-runtime-smoke`）かつ `git diff dev...HEAD --stat -- <parent feature prod dir>` が **0 件または test-only** なら reverse-canonical（dev = canonical）と判定。
    2. dev 側 `git log -1 --oneline <conflict file>` に **PR 番号付き squash commit** が並んでいたら canonical landing 確定。
    3. 固有貢献の test/coverage ファイルが dev canonical の DOM/API 契約に依存しているかを `grep -nE 'data-role|data-component|data-testid|data-auth-state' <test files>` で抽出し、dev 側 (`git show :3:<component>`) に該当 attribute が存在するか cross-check。全 satisfy なら wholesale `--theirs` で regression risk なし。
    4. `git checkout --theirs -- <unit 全ファイル一括>` → `git add` → merge commit。
  - Phase 4 risk に「child branch が `-e2e`/`-coverage`/`-visual`/`-runtime-smoke` suffix を持つ場合は parent が PR landing 済みの可能性。merge 前に `git log origin/dev --oneline -- <parent feature dir>` で PR squash commit を確認」を登録。
  - Phase 11/13 検証は **focused vitest（unit + consumer）を中心**にし、e2e Playwright は staging deploy 後実行へ委譲（pre-push gate に e2e は含めない）。
- 適用範囲外: child branch が parent prod code にも踏み込んだ拡張をしている場合（`git diff dev...HEAD --stat -- <parent prod dir>` に modify がある）は SP-DEVSYNC-044（canonical=HEAD wholesale --ours）または hybridize に分岐。
- 検証: `git diff --diff-filter=U` 0 件 + `pnpm typecheck` PASS + `pnpm lint` PASS（dev 由来の mode=warning は CI 非 fail）+ focused vitest unit/spec PASS。merge commit `fdf2f4a42`。
- 参照: aiworkflow-requirements [[lessons-learned-dev-sync-merge-conflict-resolution-2026-05]] L-DEVSYNC-064 を唯一の正本。SP-DEVSYNC-044（対称反転パターン）。


### SP-DEVSYNC-045: `pnpm sync:resolve` の partial 失敗（`index.lock: File exists`）は手動 fallback で完結 — 仕様書の sync-merge 節に fallback 手順を必須記載（2026-05-30 追加）

- 事象: 2026-05-30 `feat/unified-sidebar-shell-public-admin` ← dev sync-merge で skill-only conflict 3 件（union 2 + derived 1）。`pnpm sync:resolve` が union 解消後の `--ours + rebuild` 段で `fatal: Unable to create '.git/worktrees/.../index.lock': File exists` で exit 128。並行 git プロセスは存在せず、`ls index.lock` も無しの偽陽性。手動 `git checkout --ours -- indexes/keywords.json` + `git add` + `pnpm indexes:rebuild` で 1 分以内に完結。
- Why: resolver は **idempotent** に設計されているため、partial 失敗時点で union 解消は既に commit-ready で残る（`UU` → `M` に降格済み）。失敗段の処理だけ手動再現すればよく、resolver 全段再走は不要。短時間の fs 競合（IDE auto-fetch、lefthook 他 hook 等）が偽陽性 lock を生むケースを許容する設計。
- How to apply（task 仕様書での逐語化）: Phase 9 sync-merge 節に「**resolver 失敗時の fallback 経路**」を必須記載:
  1. resolver が ELIFECYCLE で exit したら panic せず `git status --short` で残コンフリクトを確認。`UU` ファイルが derived（keywords.json 等）のみなら fallback 対象。
  2. 手動: `git checkout --ours -- <derived files>` → `git add <derived files>` → `pnpm indexes:rebuild`。
  3. `git diff --cached` で derived が rebuild 結果に差し替わっていること、`git ls-files -u` 0 件を確認。
- 適用範囲外: page-level `.ts/.tsx` の `UU` が残る場合は SP-DEVSYNC-038/042/044 経路（fallback では救えない）。
- 検証: merge commit `09d82ca20`、typecheck 6 packages Done、lint exit 0。
- 参照: aiworkflow-requirements [[lessons-learned-dev-sync-merge-conflict-resolution-2026-05]] L-DEVSYNC-065、`scripts/sync/resolve-skill-merge-conflicts.sh`。


### SP-DEVSYNC-046: dev sync merge 後 CI で初めて検出される semantic regression 3 種は仕様書 Phase 9 / Phase 11 pre-push checklist に固定化（2026-05-30 追加）

- 事象: 2026-05-30 `feat/public-header-auth-slot-e2e` ← origin/dev sync-merge 後 `pnpm sync:resolve` + `pnpm typecheck` + `pnpm lint` は PASS だが push 後 CI 5 job fail（verify-gate-metadata / coverage-gate (web) / e2e desktop-chromium / e2e desktop-firefox / e2e-tests-coverage-gate / validate）。ローカル `pnpm gate-metadata:validate`（require オプションなし）は `ERROR: 0` で見逃し、`--require-gates-for-changed` モードで初めて `metadata.gates absent on changed artifacts.json` を検出。
- Why: sync-merge は構文 conflict（pnpm sync:resolve / `--ours`/`--theirs` wholesale）に閉じてしまい、以下 3 種の semantic regression は CI のみで検出される:
  1. `outputs/artifacts.json` の gates が top-level（require モードのみ ERROR）
  2. async server component 化（layout.tsx）と layout.spec.tsx の非同期 render 不整合（jsdom render が Promise を子要素扱いし null）
  3. middleware 認可境界レスポンス（403 ↔ redirect）と e2e spec assert の semantic 反転
- How to apply（task 仕様書での逐語化）: Phase 9 sync-merge 節 + Phase 11 pre-push checklist に以下を必須記載:
  1. **gate-metadata require-mode 事前実行**:
     ```bash
     mise exec -- pnpm gate-metadata:validate --require-gates-for-changed \
       $(git diff --name-only origin/dev...HEAD -- '**/artifacts.json')
     ```
     `ERROR: 0` を確認するまで push しない。
  2. **async layout 移行 grep**: `git diff origin/dev...HEAD --name-only -- 'apps/web/app/**/layout.tsx'` で async 化された layout の同階層 `.spec.tsx` に `await <Layout>({ children })` パターンと `vi.mock('.../auth-view')` が入っているか手動 grep 確認。
  3. **認可境界 e2e 整合 grep**: `apps/web/middleware.ts` または `apps/web/app/(admin)/layout.tsx` が diff に含まれる場合は `git grep -nE 'expect\\(res.*\\)\\.toBe\\(403\\)' apps/web/playwright/` で stale assert を検出し、redirect 化 commit と同じ wave で書き換える。
  4. **redirect chain 最終 URL の特定**: middleware redirect 先が更に server-side で redirect される（例: `/login` page の `getSession()` 認証済 ⇒ `/profile`）場合、Playwright `page.goto()` は中間 URL では settle しない。`toHaveURL` の正規表現は **chain 終点**（本 case では `/profile`）に書く。redirect chain は `apps/web/app/<route>/page.tsx` の `redirect(...)` 呼び出しを再帰的に grep して特定する。
- 適用範囲外: ローカル `pnpm typecheck/lint` で検出される構文系 regression（既存 SP-DEVSYNC-001..045 に集約済み）。
- 検証: 本 sync-merge では fix commit で 3 修正（`outputs/artifacts.json` metadata.gates 化 / `app/(member)/layout.spec.tsx` async render 化 / `playwright/tests/admin-pages.spec.ts` redirect 期待化）+ pre-push hooks PASS + push 完了で CI 全 green 復帰見込み。
- 参照: aiworkflow-requirements [[lessons-learned-public-header-auth-slot-e2e-sync-merge-ci-fix-2026-05]] L-PHAS-CI-001..003。


### SP-DEVSYNC-047: merge=union の lessons / changelog 連結は duplicate-ID（同番号 2 本）を silent に生む — sync-merge 後に採番衝突を grep 検出して renumber する（2026-05-31 追加）

- 事象: 2026-05-31 `docs/issue-57-kv-r2-guardrail-degrade-task-spec` ← `git merge dev`（5 behind / 3 ahead）。衝突は `aiworkflow-requirements/indexes/{quick-reference,resource-map,topic-map}.md` + `references/task-workflow-active.md` の 4 file のみ（`keywords.json` は今回非衝突）で `pnpm sync:resolve` 単独収束。ところが取り込み後の aiworkflow lessons ファイルに **`## L-DEVSYNC-075` が 2 本**存在していた（issue-1008 と issue-1010 が各々独立に「次番号」として 075 を採番 → `.gitattributes merge=union` が両方を末尾連結）。
- Why: skill の lessons / changelog / inventory 連番系は `merge=union` で衝突回避する設計だが、union は**両側の追記を残すだけで採番の一意性を保証しない**。並行ワークツリーが同じ次番号を取ると duplicate-ID が silent に蓄積し、`[[#L-DEVSYNC-NNN]]` 参照が曖昧化する。task-spec 側の `SP-DEVSYNC-NNN` も同機序で衝突しうる。
- How to apply（task 仕様書 / sync-merge runbook での逐語化）:
  1. **採番直前に max を取り直す**: 連番を採る前に `grep -oE '(L-DEVSYNC|SP-DEVSYNC)-[0-9]+' <file> | sort -t- -k3 -n | tail -1` で実ファイル上の最大値を確認してから +1。記憶や直前 sync の番号で採らない。
  2. **sync-merge 後に duplicate-ID を検査**: merge commit 後 `grep -oE '(L-DEVSYNC|SP-DEVSYNC)-[0-9]+' <file> | sort | uniq -d` を両 skill（aiworkflow lessons / task-spec lessons）で実行。出たら**後から連結された側**を次の空き番号へ renumber し、`> 採番補正:` 注記で機械的に辿れるようにする。本体・サブ ID（`-A`/`-B`）・自己参照を一括置換。
  3. **衝突 file 集合を固定視しない**: `keywords.json` が衝突常連とは限らない（本 sync は map 系 markdown 3 + task-workflow-active）。毎回 `git diff --name-only --diff-filter=U` で確定し、resolver の `--ours`+rebuild 段は衝突 0 なら no-op で素通りする前提で `pnpm sync:resolve` をそのまま使う。
- 適用範囲外: source code（`apps/`/`packages/`）の `UU`（SP-DEVSYNC-038/042/044 経路）。本件は skill index/lessons のみ。
- 検証: `git merge dev` CONFLICT 4 → `pnpm sync:resolve` exit 0 → `git ls-files -u` 0 → merge commit `03a0e88ff` → `pnpm typecheck` 6 packages exit 0 / `pnpm lint` exit 0 / `pnpm indexes:rebuild` drift 0 → duplicate-ID 検査で旧 075×2 を検出し issue-1010 側を L-DEVSYNC-076 へ補正、本 sync を L-DEVSYNC-077 として追加。
- 参照: aiworkflow-requirements [[lessons-learned-dev-sync-merge-conflict-resolution-2026-05]] L-DEVSYNC-077（duplicate-ID 機序）, L-DEVSYNC-073（衝突 file 数可変）, L-DEVSYNC-075/076（duplicate-ID 当事者）。


### SP-DEVSYNC-048: 衝突集合は 3 file（index map 2 + task-workflow-active）まで縮退しうる — topic-map / keywords / 両 SKILL.md 全 Auto-merging の最小セットでも標準フロー不変（2026-06-02 追加）

- 事象: `docs/task-c-reflection-timing-sla-spec` を sub-worktree（`.worktrees/task-20260601-172605-wt-12`）から sync-merge。ローカル dev = origin/dev（独自コミット 0 / ff 不要）、feature は origin/dev に 1 behind / 3 ahead。`git merge origin/dev --no-edit` の content conflict は **3 file のみ**＝`aiworkflow-requirements/indexes/{quick-reference.md, resource-map.md}` + `references/task-workflow-active.md`。`indexes/topic-map.md` / `keywords.json` / `_legacy.md` / 両 `SKILL.md` はすべて Auto-merging。SP-DEVSYNC-047（5 file）より縮退した最小セット。
- How to apply（仕様書 sync-merge 節での逐語化）:
  1. **衝突 file 数は 3〜6 で毎回可変**。`pnpm sync:resolve` の `union-resolving N files` の N を固定で見込まず、`git diff --name-only --diff-filter=U` の実集合をそのまま resolver に渡す。topic-map / keywords / SKILL.md が衝突に出ないのは正常（欠落ではない）。
  2. **同種 index 3 兄弟（quick-reference/resource-map/topic-map）でも衝突可否は独立**。各 worktree が別行を触るため「index 系はまとめて衝突する」束ね前提は誤り。
  3. 最小 3 file でも標準フロー（`git merge` → `pnpm sync:resolve` → `git ls-files -u` 0 → `git commit` → `pnpm typecheck && pnpm lint`）は不変。source conflict 0・keywords 非衝突の回は手動介入ゼロで全自動収束し CI 修正も不要。
- 適用範囲外: source code（`apps/`/`packages/`）の `UU`（SP-DEVSYNC-038/042/044 経路）。本件は skill index/reference のみ。
- backlog 注記: 本 sync 時点で aiworkflow lessons 正本に真の duplicate heading（`## L-DEVSYNC-069`×3 等）が dev 由来で蓄積（SP-DEVSYNC-047 指摘事象）。本 sync は lessons 本体非衝突のため触れず、一括 renumber は sync→push タスク範囲外として別 cleanup へ送る。新規採番は実 max +1（SP-DEVSYNC-048 / L-DEVSYNC-083）。
- 検証: `git merge origin/dev` CONFLICT 3 → `pnpm sync:resolve` exit 0（`union-resolving 3 files`）→ `git ls-files -u` 0 → merge commit `a5789e7cd` → `pnpm typecheck` exit 0 / `pnpm lint` exit 0 / `pnpm indexes:rebuild` drift 0。
- 参照: aiworkflow-requirements [[lessons-learned-dev-sync-merge-conflict-resolution-2026-05]] L-DEVSYNC-083（本 lesson の正本・3 file 最小セット）, L-DEVSYNC-082（5 file・SKILL.md 片側衝突）, L-DEVSYNC-080-B（衝突集合は `--diff-filter=U` で都度確定）, SP-DEVSYNC-047（duplicate-ID backlog 機序）。


### SP-DEVSYNC-049: keywords.json は 3 連続非衝突の後に衝突集合へ再登場しうる — derived ファイルの衝突は意味解決不要で `pnpm sync:resolve` の `--ours`+rebuild に一任（2026-06-02 追加）

- 事象: `feat/task-d-admin-form-responses-link-spec` を sub-worktree（`.worktrees/task-20260601-183057-wt-16`）から sync-merge。ローカル dev = origin/dev（独自コミット 0 / ff 不要）、feature は origin/dev に 2 ahead / 3 behind。`git merge dev --no-edit` の content conflict は **6 file**＝`aiworkflow-requirements/indexes/{keywords.json, quick-reference.md, resource-map.md, topic-map.md}` + `references/task-workflow-active.md` + `task-specification-creator/SKILL.md`。`keywords.json` が衝突に入ったのは直近 3 sync（SP-DEVSYNC-048 系の 081/082/083）が連続非衝突だった後の再登場で、`aiworkflow-requirements/SKILL.md` は今回 Auto-merging（task-spec 側のみ SKILL.md 衝突の非対称・SP-DEVSYNC-048 の対比元 082 と同型）。
- How to apply（仕様書 sync-merge 節での逐語化）:
  1. **keywords.json の衝突可否に周期性はない**。直近数回が非衝突でも今回衝突する/しないは feature と dev の生成行の重なりだけで決まる。`git diff --name-only --diff-filter=U` の実集合をそのまま `pnpm sync:resolve` に渡す。
  2. **derived（生成物）の衝突は手動 3-way 不要**。keywords.json は最大の生成物ゆえ衝突頻度が高いが、resolver が `taking --ours for 1 derived files` → `indexes:rebuild` で正本再生成して機械収束する。意味解決を試みない。
  3. **衝突回は merge commit 後に独立 `pnpm indexes:rebuild` で drift 0 を再確認**してから push（本件は 5275 キーワードで drift 0）。非衝突回は resolver の `--ours` 段が no-op になるだけで標準フローは不変。
  4. 最小 3 file（SP-DEVSYNC-048）〜 6 file（本件）まで衝突 file 数は揺れるが、標準フロー（`git merge` → `pnpm sync:resolve` → `--diff-filter=U` 0 → `git commit` → `pnpm typecheck && pnpm lint`）は不変。source conflict 0 の回は CI 修正一切不要で全ゲート即緑。
- 適用範囲外: source code（`apps/`/`packages/`）の `UU`（SP-DEVSYNC-038/042/044 経路）。本件は skill index/reference/SKILL.md のみ。
- 検証: `git merge dev` CONFLICT 6（keywords.json + index map 3 + task-workflow-active + task-spec SKILL.md、aiworkflow SKILL.md は Auto-merging）→ `pnpm sync:resolve` exit 0（`union-resolving 5 files` + `taking --ours` keywords.json + `indexes:rebuild`）→ `git diff --diff-filter=U` 0 → merge commit `0931ab9cd` → `pnpm typecheck` exit 0 / `pnpm lint` exit 0 / `pnpm indexes:rebuild` drift 0。
- 参照: aiworkflow-requirements [[lessons-learned-dev-sync-merge-conflict-resolution-2026-05]] L-DEVSYNC-084（本 lesson の正本・keywords 再登場と `--ours` 実発火）, L-DEVSYNC-081-C（keywords 非衝突回は `--ours` no-op）, L-DEVSYNC-082（task-spec SKILL.md 片側衝突）, SP-DEVSYNC-048（3 file 最小セット）, SP-DEVSYNC-047（duplicate-ID backlog 機序）。


### SP-DEVSYNC-050: index map 3 兄弟（quick-reference/resource-map/topic-map）が揃って衝突しうる — keywords.json / 両 SKILL.md 全 Auto-merging の 4 file セットで衝突可否は兄弟独立（2026-06-02 追加）

- 事象: `feat/issue-1031-member-self-photo-upload` を sub-worktree（`.worktrees/task-20260601-055711-wt-2`）から sync-merge。ローカル dev = origin/dev（独自コミット 0 / ff 不要）、feature は dev に 6 ahead / 2 behind。`git merge dev --no-edit` の content conflict は **4 file**＝`aiworkflow-requirements/indexes/{quick-reference.md, resource-map.md, topic-map.md}`（index map 3 兄弟すべて）+ `references/task-workflow-active.md`。`keywords.json` / `task-specification-creator/SKILL.md` / `aiworkflow-requirements/SKILL.md` / `SKILL-changelog.md` / `_legacy.md` はすべて Auto-merging。SP-DEVSYNC-048（3 file・topic-map 非衝突）の逆相＝3 兄弟全衝突の実例。
- How to apply（仕様書 sync-merge 節での逐語化）:
  1. **index map 3 兄弟の衝突可否は完全独立**。SP-DEVSYNC-048 は quick/resource 衝突・topic-map 非衝突、本件は 3 兄弟全衝突。「3 つまとめて衝突 or まとめて非衝突」の束ね前提は両方向で誤り。`git diff --name-only --diff-filter=U` の実集合をそのまま `pnpm sync:resolve` に渡す。
  2. **衝突 file 数は 3〜6 で毎回可変**（3=SP-DEVSYNC-048 / 4=本件 / 5=SP-DEVSYNC-047 / 6=SP-DEVSYNC-049）。`union-resolving N files` の N を固定で見込まない。
  3. **keywords.json / SKILL.md が全非衝突の回も標準フロー不変**。resolver の `--ours`+rebuild 段は keywords に対し no-op で素通りするだけ。`git merge` → `pnpm sync:resolve` → `git diff --diff-filter=U` 0 → `git commit` → `pnpm typecheck && pnpm lint` は不変で、source conflict 0 の回は CI 修正一切不要・全ゲート即緑。
- 適用範囲外: source code（`apps/`/`packages/`）の `UU`（SP-DEVSYNC-038/042/044 経路）。本件は skill index/reference のみ。
- 検証: `git merge dev` CONFLICT 4（quick-reference/resource-map/topic-map + task-workflow-active、keywords.json/両 SKILL.md/SKILL-changelog/_legacy は Auto-merging）→ `pnpm sync:resolve` exit 0（`union-resolving 4 files`）→ `git diff --diff-filter=U` 0 → merge commit `f10a71d61` → `pnpm typecheck` 6 packages exit 0 / `pnpm lint` exit 0 / `pnpm indexes:rebuild` drift 0。
- 参照: aiworkflow-requirements [[lessons-learned-dev-sync-merge-conflict-resolution-2026-05]] L-DEVSYNC-085（本 lesson の正本・index 3 兄弟全衝突）, L-DEVSYNC-083（topic-map のみ非衝突・逆相）, L-DEVSYNC-084（keywords 衝突回・6 file 最大）, SP-DEVSYNC-048（3 file 最小セット）, SP-DEVSYNC-047（duplicate-ID backlog 機序）。


### SP-DEVSYNC-050: コンフリクトマーカー残存確認は `git diff --diff-filter=U` / `git diff --check` を正本にする — `git grep -E '^=======' ` は docs の区切り線（`=`×N）を誤検知する（2026-06-02 追加）

- 事象: `docs/issue-1029-public-member-photo-display-spec` を sub-worktree（`.worktrees/task-20260531-195607-wt-7`）から sync-merge。ローカル dev = origin/dev（独自コミット 0 / ff 不要）、feature は origin/dev に 2 behind / 5 ahead。`git merge dev --no-edit` の content conflict は **4 file**＝`aiworkflow-requirements/indexes/{quick-reference.md, resource-map.md, topic-map.md}` + `references/task-workflow-active.md`（keywords.json / 両 SKILL.md / SKILL-changelog は Auto-merging）。`pnpm sync:resolve` 単独収束（`union-resolving 4 files`）。残存マーカーの二次確認に `git grep -lE '^(<<<<<<<|=======|>>>>>>>)'` を回したところ `docs/30-workflows/completed-tasks/ut-08-monitoring-alert-design/outputs/phase-11/manual-smoke-log.md` が 1 件ヒットしたが、実体はコードブロック内のログ区切り線 `=`×60 で未解決マーカーではなかった（当該 file は merge 非対象＝`status` に M/A で出ない）。
- How to apply（仕様書 sync-merge 節での逐語化）:
  1. **残存マーカー確認の正本は index ベース 2 系統**: ①`git diff --name-only --diff-filter=U`（=0 が未解決ゼロの確定証跡）、②`git diff --check`（git 自身がマーカーを行/桁つきで判定）。この 2 つが緑なら残存ゼロ確定で grep 不要。
  2. **grep を使うなら厳格パターン＋ status 照合**: `git grep -nE '^(<{7}|={7}|>{7})( |$)'` に絞り（`=`×N≠7 の区切り線を除外）、ヒットしても `git status --porcelain -- <file>` が空（マージ非対象）なら誤検知として棄却する。`^=======`（行頭一致・後続自由）は `=`×60 等の ASCII 罫線/ログ separator を全件誤マッチするため単独では信頼しない。
  3. 衝突 file 数は 3〜6 で毎回可変（本件 4 = index map 3 + task-workflow-active）。`git diff --name-only --diff-filter=U` の実集合をそのまま `pnpm sync:resolve` に渡す原則は不変。
- 適用範囲外: source code（`apps/`/`packages/`）の `UU`（SP-DEVSYNC-038/042/044 経路）。本件は skill index/reference のみ。
- 検証: `git merge dev` CONFLICT 4 → `pnpm sync:resolve` exit 0（`union-resolving 4 files`）→ `git diff --name-only --diff-filter=U` 0 → merge commit `d65f7fbee` → `pnpm typecheck` exit 0 / `pnpm lint` exit 0 / `pnpm indexes:rebuild` drift 0（5275 キーワード）。grep 二次確認のヒット 1 件は status 非 M/A で誤検知と確定。
- 参照: aiworkflow-requirements [[lessons-learned-dev-sync-merge-conflict-resolution-2026-05]] L-DEVSYNC-085（本 lesson の正本・grep false-positive 機序）, L-DEVSYNC-080-B（衝突集合は `--diff-filter=U` で都度確定）, SP-DEVSYNC-049（keywords 再登場）, SP-DEVSYNC-048（3 file 最小セット）。


### SP-DEVSYNC-050: 衝突集合は 2 file（index map 2 のみ）まで縮退しうる — task-workflow-active.md も Auto-merging に回る新・最小セット／残マーカー検査は厳密パターンで装飾線偽陽性を排除（2026-06-02 追加）

- 事象: `docs/issue-1027-member-dynamic-og-worker-split` を sub-worktree（`.worktrees/task-20260531-173652-wt-10`）から sync-merge。ローカル dev = origin/dev（独自コミット 0 / ff 不要）、feature は origin/dev に 2 behind / 7 ahead。`git merge dev --no-edit` の content conflict は **2 file のみ**＝`aiworkflow-requirements/indexes/{quick-reference.md, resource-map.md}`。`references/task-workflow-active.md` / `indexes/topic-map.md` / `indexes/keywords.json` / `LOGS/_legacy.md` / `task-specification-creator/SKILL-changelog.md` / 両 `SKILL.md` はすべて Auto-merging。SP-DEVSYNC-048（3 file）よりさらに 1 file 縮退し、これまで衝突常連だった `task-workflow-active.md` が Auto-merging に回った最小セット。
- How to apply（仕様書 sync-merge 節での逐語化）:
  1. **衝突 file 数の下限は 2 まで観測**（本件 2・048 は 3・047 は 5/6）。`pnpm sync:resolve` の `union-resolving N files` の N を固定で見込まず `git diff --name-only --diff-filter=U` の実集合をそのまま渡す。衝突常連の `task-workflow-active.md` が衝突に出ないのも正常（欠落ではない）。
  2. **残マーカー検査は厳密パターンで**: 衝突解消後の残検査は `git grep -lE '^======='`（前方一致）ではなく `^(<<<<<<< |>>>>>>> |={7}$)`（`<<<<<<< `/`>>>>>>> ` は末尾スペース必須、`=` はちょうど 7 文字 1 行）。前方一致は `====…`（7 文字超の装飾区切り線）を偽陽性検出する。ヒットしても `git diff HEAD -- <file>` が空かつ前後に `<<<<<<<`/`>>>>>>>` が無ければ装飾線で無罪。一次正本は `git diff --name-only --diff-filter=U`（残 0）。
  3. 最小 2 file でも標準フロー（`git merge dev` → `pnpm sync:resolve` → `git diff --diff-filter=U` 0 → `git commit` → `pnpm typecheck && pnpm lint` → `pnpm indexes:rebuild` 冪等確認 → `bash scripts/verify-pr-ready.sh` → push）は不変。source conflict 0・keywords 非衝突の回は手動介入ゼロで全自動収束し CI 修正も不要。
- 適用範囲外: source code（`apps/`/`packages/`）の `UU`（SP-DEVSYNC-038/042/044 経路）。本件は skill index のみ。
- 検証: `git merge dev` CONFLICT 2（quick-reference/resource-map、task-workflow-active/topic-map/keywords/_legacy/両 SKILL.md は Auto-merging）→ `pnpm sync:resolve` exit 0（`union-resolving 2 files`・keywords 非衝突で `--ours` no-op）→ `git diff --diff-filter=U` 0 → merge commit `e2dd0cb60` → `pnpm typecheck` exit 0 / `pnpm lint` exit 0 / `pnpm indexes:rebuild` drift 0（5292 キーワード）/ `bash scripts/verify-pr-ready.sh` 全 PASS（gate-metadata ERROR 0）。
- 参照: aiworkflow-requirements [[lessons-learned-dev-sync-merge-conflict-resolution-2026-05]] L-DEVSYNC-085（本 lesson の正本・2 file 最小セットとマーカー偽陽性）, L-DEVSYNC-083（3 file 最小・本件はさらに縮退）, L-DEVSYNC-080-B（衝突集合は `--diff-filter=U` で都度確定）, SP-DEVSYNC-048（3 file 最小セット）, SP-DEVSYNC-049（keywords 再登場）。


### SP-DEVSYNC-051: 「source conflict 0 → CI 修正不要」は新規 workspace 取込時に破れる — dev マージで増えた workspace（`apps/og` #1084）が node_modules 未取得で typecheck 落ち。sync-merge 後は typecheck 前に `pnpm install` を固定で挟む（2026-06-02 追加）

- 事象: `feat/issue-1035-tag-master-write-endpoints` を sub-worktree（`.worktrees/task-20260601-055938-wt-1`）から sync-merge。ローカル dev = origin/dev（独自コミット 0 / ff 不要）、feature は dev に 11 behind / 2 ahead。`git merge dev --no-edit` の content conflict は **5 file**＝`aiworkflow-requirements/indexes/{keywords.json, quick-reference.md, resource-map.md, topic-map.md}` + `references/task-workflow-active.md`（両 `_legacy.md` / task-spec `SKILL-changelog.md` / `patterns-lessons-and-pitfalls.md` は Auto-merging）。`pnpm sync:resolve` 単独収束（`union-resolving 4 files` + `taking --ours` keywords.json + `indexes:rebuild`）→ `git diff --diff-filter=U` 0 → merge commit `0bda41a31`。**ここまで source conflict 0 で SP-DEVSYNC-048/049/050 と同型。しかし `pnpm typecheck` が exit 2**: `apps/og src/render.tsx(69,58): error TS2307: Cannot find module 'workers-og'` ＋ `Scope: 7 of 8 workspace projects` ＋ `node_modules missing` WARN。原因は dev マージで新規 workspace `apps/og`（#1084 OG 専用 Worker 分離）が初めて当該 worktree に出現したが、その依存が worktree-local `node_modules` に未インストールだったため。`mise exec -- pnpm install` 後に typecheck exit 0 / lint exit 0 / indexes:rebuild drift 0（5293 キーワード）。
- How to apply（仕様書 sync-merge 節での逐語化）:
  1. **sync-merge 後の標準フローに `pnpm install` を typecheck の前段として固定で挟む**: `git merge dev` → `pnpm sync:resolve` → `git diff --diff-filter=U` 0 → `git commit` → **`pnpm install`** → `pnpm typecheck && pnpm lint` → `pnpm indexes:rebuild`。SP-DEVSYNC-048/049/050 の「source 0 → CI 修正不要」は **既存 workspace 集合が不変な場合のみ**成立し、dev が workspace を増やすと破れる。
  2. **`Cannot find module '<外部依存>'` を型エラーと早合点しない**: TS2307 が特定 1 workspace に集中し、`Scope: N of M`（N < 総数）や `node_modules missing` WARN を伴うなら、原因は依存未取得。`git diff --name-only origin/dev..HEAD -- 'pnpm-workspace.yaml' 'apps/*/package.json' 'packages/*/package.json'` で新規 workspace 混入を確認し `pnpm install` で解消する。lockfile が up-to-date でも `node_modules` 物理生成は worktree 単位。
  3. 衝突集合 5 file（keywords + index map 3 + task-workflow-active）自体は SP-DEVSYNC-049（6 file）と同レンジで新規性なし。本 lesson の主眼は skill 衝突解消ではなく **マージ後 CI 失敗の新パターン（新規 workspace 依存未取得）**。
- 適用範囲外: source code（`apps/`/`packages/`）の `UU`（SP-DEVSYNC-038/042/044 経路）。本件はそもそもコンフリクトでも型エラーでもなく node_modules 未同期。
- 検証: `git merge dev` CONFLICT 5 → `pnpm sync:resolve` exit 0（`union-resolving 4 files` + `--ours` keywords.json）→ `git diff --diff-filter=U` 0 → merge commit `0bda41a31` → `pnpm typecheck` exit 2（`apps/og` TS2307）→ `mise exec -- pnpm install`（8 workspace・`+24 -126`）→ `pnpm typecheck` exit 0 → `pnpm lint` exit 0 → `pnpm indexes:rebuild` drift 0（5293 キーワード）。
- 参照: aiworkflow-requirements [[lessons-learned-dev-sync-merge-conflict-resolution-2026-05]] L-DEVSYNC-086（本 lesson の正本・新規 workspace 依存未取得で typecheck 落ち）, L-DEVSYNC-085（「source 0 → CI 修正不要」を記録・本件はその反例）, SP-DEVSYNC-050（2 file 最小セット）, SP-DEVSYNC-049（keywords 再登場・衝突集合 6 file）。

### SP-DEVSYNC-052: 衝突集合 5 file は dev デルタの大小に依存しない確定形 — 同一ブランチの連続 sync-merge（今回 dev 1 behind）でも前回と同じ 5 file が衝突し、`pnpm install` 先行 preflight の standing 化が有効（2026-06-02 追加）

- 事象: SP-DEVSYNC-051 と**同じ feature ブランチ**（`feat/issue-1035-tag-master-write-endpoints`・sub-worktree `task-20260601-055938-wt-1`）の二度目の sync-merge。前回 dev 11 behind に対し今回は dev が **1 behind**（取込は `a526f1a43 #1074 公開メンバー写真表示` の 1 件のみ）。ローカル dev = origin/dev（独自コミット 0）。それでも `git merge dev` の content conflict は前回と**完全に同一の 5 file**＝`aiworkflow-requirements/indexes/{keywords.json, quick-reference.md, resource-map.md, topic-map.md}` + `references/task-workflow-active.md`。`pnpm sync:resolve` 単独収束 → merge commit `2ca9f45ef` → `pnpm install`（no-op 級 `Done in 3.5s`）→ `pnpm typecheck` exit 0 / `pnpm lint` exit 0 / indexes drift 0。
- How to apply（仕様書 sync-merge 節での逐語化）:
  1. **衝突件数を dev 遅れ量から予測しない**: skill index（keywords / index map 3）+ `task-workflow-active.md` は `.gitattributes` `merge=union` 登録済の高頻度共有ファイル。dev が 1 コミットでも skill を触れば 5 file が確定的に衝突する。衝突は「dev 何コミット分か」でなく「skill index が片側で変わったか」で決まる。5 file は想定内なので `pnpm sync:resolve` に一任する。
  2. **`pnpm install` 先行 preflight を dev デルタの大小に関わらず固定で挟む**: 今回のように新規 workspace を伴わない小デルタでも install を typecheck 前に固定実行する運用が、SP-DEVSYNC-051 の CI 失敗（新規 workspace 依存未取得）を**構造的に予防**する。install は no-op 級で済むのでコストは小さい。小デルタで install をスキップしない。
  3. 同一ブランチを複数回 sync-merge すると毎回 skill index が衝突するが、これは union-merge 設計の正常動作であり異常ではない。
- 適用範囲外: source code（`apps/`/`packages/`）の `UU`（SP-DEVSYNC-038/042/044 経路）。本件は skill index union 衝突のみで CI も即緑。
- 検証: `git fetch --prune origin`（dev=origin/dev・独自 0）→ `git merge dev` CONFLICT 5 → `pnpm sync:resolve` exit 0（union 4 + `--ours` keywords.json + indexes:rebuild）→ `git diff --diff-filter=U` 0 / マーカー 0 → merge commit `2ca9f45ef` → `pnpm install` exit 0 → `pnpm typecheck` exit 0（全 8 package）→ `pnpm lint` exit 0 → indexes drift 0。
- 参照: aiworkflow-requirements [[lessons-learned-dev-sync-merge-conflict-resolution-2026-05]] L-DEVSYNC-087（本 lesson の正本）, SP-DEVSYNC-051（同一ブランチ前回・dev 11 behind・新規 workspace で typecheck 落ち）, SP-DEVSYNC-049（衝突集合 6 file・keywords 再登場）。

### SP-DEVSYNC-053: 生成 source 成果物（`static-manifest.json`）の衝突も `pnpm sync:resolve` の deterministic-regenerate 段で自動解消され、再生成のメタ drift は再コミット不要 — resolver は skill index 専用ではなく「決定論再生成可能な生成物」も対象（2026-06-02 追加）

- 事象: `feat/issue-1035-tag-master-write-endpoints` ← `dev`（#1042 dismiss楽観更新 + #1083 会員写真アップロードの 2 件取込）三度目 sync-merge。conflict は skill 5 file に加え **`apps/api/src/repository/_shared/generated/static-manifest.json`（生成物）が初登場**。`pnpm sync:resolve` が skill 5 件解消後にログ `deterministic-regenerating 1 generated artifacts ... via: pnpm regenerate:static-manifest` を出して manifest を再生成で解消（merge commit `e416fc3f5`）。merge 後に手で `regenerate:static-manifest` を再実行すると `sourceSpecVersion`（git ref）/`generatedAt`（timestamp）のみ変わり `sourceSpecHash` 不変・`verify:static-manifest` は両版 exit 0。
- How to apply（仕様書 sync-merge 節での逐語化）:
  1. **生成物の衝突は手動 3-way でなく resolver 一任**: `static-manifest.json` 等が衝突しても `pnpm sync:resolve` の deterministic-regenerate 段が再生成で解消する。resolver ログの `deterministic-regenerating N generated artifacts` 行で対象を確認。SP-DEVSYNC-080（別 optional field の手動併存）は「再生成できない source」の話で、生成物は別カテゴリ。
  2. **再生成の metadata-only drift は再コミットしない**: merge 後 `regenerate:*` で manifest が `M` 表示されても `git diff` が `sourceSpecVersion`/`generatedAt` のみで `sourceSpecHash` 不変なら CI 無問題（`verify:static-manifest` は hash 検証）。`git checkout -- <manifest>` で resolver 版へ戻し clean 維持。再生成版をコミットすると timestamp が毎回変わり無限 churn。
- 適用範囲外: 手動マージ必須の非生成 source conflict（SP-DEVSYNC-080 経路）。本件は決定論再生成で自動解消される生成物。
- 検証: `git merge dev` CONFLICT 6（skill 5 + static-manifest.json）→ `pnpm sync:resolve` exit 0（union 4 + keywords.json `--ours` + static-manifest deterministic-regenerate）→ `git ls-files -u` 0 / `git diff --check` 0 → merge commit `e416fc3f5` → `pnpm install` Done 37.1s → `pnpm typecheck` exit 0（全 8 package）→ `pnpm lint` exit 0 → indexes 冪等（5295 kw）→ `verify:static-manifest` exit 0。
- 参照: aiworkflow-requirements [[lessons-learned-dev-sync-merge-conflict-resolution-2026-05]] L-DEVSYNC-088（本 lesson の正本）, SP-DEVSYNC-052（同一ブランチ前回・衝突集合 5 file 確定形）, SP-DEVSYNC-080（手動 source 併存の対比）。


### SP-DEVSYNC-051: dev マージで新規 workspace package が入ると merge 後 typecheck が `Cannot find module` で落ち `pnpm install` が CI 失敗解消の前提になる — 衝突集合は 5 file（index map 3 + keywords 再衝突 + task-workflow-active）まで再拡大しうる（2026-06-02 追加）

- 事象: `feat/issue-1031-member-self-photo-upload` を sub-worktree（`.worktrees/task-20260601-055711-wt-2`）から sync-merge。ローカル dev = origin/dev（独自コミット 0 / ff 不要）、feature は dev に 2 behind / 10 ahead。取込 2 コミットは #1074（公開メンバー写真表示 issue-1029）+ #1084（member 動的 OG を `apps/og` Worker 分離 issue-1027）。content conflict は **5 file**＝`aiworkflow-requirements/indexes/{quick-reference.md, resource-map.md, topic-map.md, keywords.json}` + `references/task-workflow-active.md`（両 SKILL.md / SKILL-changelog / _legacy は Auto-merging）。SP-DEVSYNC-050（同一 branch・前回 sync は 2〜4 file・keywords 非衝突）から keywords が再衝突して 5 file に拡大し、resolver の `--ours`+rebuild 段が実発火。**さらに merge 確定後の `pnpm typecheck` が新 package `apps/og` で `error TS2307: Cannot find module 'workers-og'` + `node_modules missing` 警告を出して失敗 → `mise exec -- pnpm install`（`+24 -126`・lockfile up to date）後に 6 package 全 Done**。
- How to apply（仕様書 sync-merge 節での逐語化）:
  1. **dev マージ後 typecheck が `Cannot find module 'X'` で落ちたら、conflict ミスでなく dev 側の新 package / 新依存を最初に疑う**。症状（typecheck 赤）が conflict 解消失敗と紛らわしいが原因は別系統。`mise exec -- pnpm install` で worktree-local node_modules を更新してから再検証する（worktree は node_modules を共有しないため新 package 取込のたびに install が要る）。conflict 解消（resolver）と install は**独立した 2 系統**として順に当てる。
  2. **keywords.json の衝突可否は固定前提にしない**。「3 連続非衝突→再登場（049）→また非衝突（050）→再衝突（051）」と振動する。`git diff --name-only --diff-filter=U` の実集合を `pnpm sync:resolve` にそのまま渡し、resolver の `--ours`+rebuild 自動分岐に任せる。
  3. 標準フローは 5 file 衝突 + 新 package でも不変で、`pnpm install` を一段挟むだけ（`git merge dev` → `pnpm sync:resolve` → `git diff --diff-filter=U` 0 → `git commit` → **新 package 取込時のみ `pnpm install`** → `pnpm typecheck && pnpm lint` → `pnpm indexes:rebuild` 冪等確認 → push）。CI 修正コードの追加は不要。
- 適用範囲外: source code（`apps/`/`packages/`）の意味的 `UU`（SP-DEVSYNC-038/042/044 経路）。本件の conflict は skill index/reference のみで、apps 側は新 package の install 不足のみ（型/ロジック衝突なし）。
- 検証: `git merge dev` CONFLICT 5（quick-reference/resource-map/topic-map/keywords + task-workflow-active、両 SKILL.md/SKILL-changelog/_legacy は Auto-merging）→ `pnpm sync:resolve` exit 0（`union-resolving 4 files` + `taking --ours for 1 derived files`（keywords）+ rebuild）→ `git diff --diff-filter=U` 0 → merge commit `78dbf68d0` → `pnpm typecheck` が `apps/og` で `Cannot find module 'workers-og'` → `pnpm install` → `pnpm typecheck` 6 packages exit 0 / `pnpm lint` exit 0 / `pnpm indexes:rebuild` drift 0（5293 キーワード）。
- 参照: aiworkflow-requirements [[lessons-learned-dev-sync-merge-conflict-resolution-2026-05]] L-DEVSYNC-086（本 lesson の正本・新 package install + 5 file 衝突）, L-DEVSYNC-085（同一 branch 前回 sync）, SP-DEVSYNC-050（同一 branch・2〜4 file・keywords 非衝突回）, SP-DEVSYNC-049（keywords 再登場）, SP-DEVSYNC-045（resolver partial 失敗時の手動 fallback）。


### SP-DEVSYNC-052: sync-merge 後の検証は `pnpm typecheck | tail` 等のパイプ禁止 — pipeline 終了コードが末尾 tail の exit 0 になり真の失敗（新 package `apps/og` の module-not-found）を握り潰す。`cmd > file 2>&1; echo $?` でパイプ無し終了コードを取る／SP-DEVSYNC-051（新 package → install 前提）は別 branch でも再発（2026-06-02 追加）

- 事象: `feat/issue-1042-dismiss-optimistic-update-spec` を sub-worktree（`.worktrees/task-20260601-062438-wt-15`）から sync-merge。ローカル dev = origin/dev（独自コミット 0 / ff 不要）、feature は origin/dev に **13 behind**（本シリーズ最大の behind 数）。content conflict は **5 file**＝`aiworkflow-requirements/indexes/{quick-reference.md, resource-map.md, topic-map.md, keywords.json}` + `references/task-workflow-active.md`（両 SKILL.md / SKILL-changelog / _legacy は Auto-merging）。SP-DEVSYNC-051 と同形（5 file・keywords 再衝突・resolver `--ours`+rebuild 実発火）で、**新 package `apps/og` の install 前提も別 branch（#1031→#1042）で再発**。merge 後の最初の検証を `pnpm typecheck 2>&1 | tail -25`（run_in_background 併用）で回したところ、`apps/og` の `Cannot find module 'workers-og'`（node_modules missing）失敗が、パイプ末尾 `tail` の exit 0 に上書きされ、**バックグラウンドタスク通知まで "exit code 0" と偽報告**し緑に見えた。
- How to apply（仕様書 sync-merge 節での逐語化）:
  1. **検証コマンドはパイプ禁止・終了コードを直接取る**: `pnpm typecheck` / `pnpm lint` / `pnpm indexes:rebuild` の合否は `cmd > file 2>&1; echo $?` 形式で判定し、`cmd | tail` / `cmd | grep` で済ませない。pnpm の recursive run は失敗 package の非0を pipeline 末尾コマンド（tail/grep は通常 exit 0）が上書きして緑に偽装する。バックグラウンド実行の "exit code 0" 通知もパイプ経由なら信用せず本文か別途終了コードで確認する。
  2. **SP-DEVSYNC-051（新 package → `pnpm install` 前提）は一回性でなく再発クラス**: `Cannot find module 'X'` + `node_modules missing` を見たら conflict ミスでなく dev 側新 package の install 不足を最初に疑い `mise exec -- pnpm install`（lockfile up to date）→ 再検証。worktree は node_modules を共有しないため新 package 取込のたびに必要。
  3. **behind 数は衝突 file 数と無関係**（本件 13 behind でも衝突は 5 file）。衝突は feature と dev の編集行の重なりだけで決まる。標準フロー（`git merge dev` → `pnpm sync:resolve` → `git diff --diff-filter=U` 0 → `git commit` → **新 package 取込時 `pnpm install`** → パイプ無し終了コードで `pnpm typecheck && pnpm lint` → `pnpm indexes:rebuild` 冪等確認 → push）は behind 数に依らず不変。
- 適用範囲外: source code（`apps/`/`packages/`）の意味的 `UU`（SP-DEVSYNC-038/042/044 経路）。本件の conflict は skill index/reference のみで、apps 側は新 package の install 不足のみ（型/ロジック衝突なし）。
- 検証: `git merge dev` CONFLICT 5（quick-reference/resource-map/topic-map/keywords + task-workflow-active、両 SKILL.md/SKILL-changelog/_legacy は Auto-merging）→ `pnpm sync:resolve` exit 0 → `git diff --diff-filter=U` 0 → merge commit `454069aad` → `pnpm typecheck 2>&1 | tail`（偽陽性 exit 0・本体は `apps/og` module-not-found）→ 切り分けて `mise exec -- pnpm install`（`+24 -126`）→ `pnpm typecheck > /tmp/tc.out 2>&1; echo $?` = 0（6 packages Done）/ `pnpm lint > /tmp/lint.out 2>&1; echo $?` = 0 / `pnpm indexes:rebuild` drift 0（5294 キーワード）。CI コード修正なしで全緑。
- 参照: aiworkflow-requirements [[lessons-learned-dev-sync-merge-conflict-resolution-2026-05]] L-DEVSYNC-087（本 lesson の正本・パイプ終了コード隠蔽 + 086-B 再発クラス）, L-DEVSYNC-086（新 package install + 5 file 衝突）, SP-DEVSYNC-051（同形の前回・新 package install 前提）, SP-DEVSYNC-050（同 file 群・2 file 最小セット）, SP-DEVSYNC-045（resolver partial 失敗時の手動 fallback）。

### SP-DEVSYNC-054: 2 feature が同一 repository へ別々の additive DB 列群を足した sync-merge は SQL リテラルだけ衝突し型は両群必須化 → 片群しか渡さない呼び出し元/fixture が typecheck で連鎖崩壊する。SQL を両群の和に解消後、全呼び出し元へ他方の列群の既定値を補完する（install では直らない実 source 衝突）（2026-06-02 追加）

- 事象: `docs/issue-1030-member-photo-transcode-resize-variant-pipeline-spec` を sub-worktree（`.worktrees/task-20260531-215534-wt-13`）から sync-merge。ローカル dev = origin/dev（独自コミット 0 / ff 不要）、feature は origin/dev に **5 behind / 10 ahead**。未コミット 97 file を先に 1 commit してから `git merge origin/dev`。content conflict は **7 file**＝skill 系 6 + **source 1（`apps/api/src/repository/memberPhotos.ts`）**。`pnpm sync:resolve` は skill 6 を解消し source 1 を `WARN unhandled conflict: apps/api/src/repository/memberPhotos.ts` と明示して **exit 1**（未解決 source 残存の正常な非0・resolver 失敗ではない）。`memberPhotos.ts` は HEAD 側が issue-1030 の thumb 系 4 列、origin/dev 側が issue-1031 の `source` 列を同一テーブルへ足した直交 additive 変更で、**interface / snake↔camel 写像は両群含みで Auto-merge・SQL リテラル（SELECT 列並び/INSERT 列並び/VALUES/`.bind()`）だけが衝突**。SQL を両群の和に解消すると `MemberPhotoRow` が thumb 系 4 列と source の双方を必須化し、`routes/me/index.ts:391`（source のみ）と repo test 2 ファイルが `TS2345/TS2741 missing properties` で 9 件崩壊。新 package 由来でないため install では直らず、呼び出し元/fixture に他方の列群の既定値補完が必要（self-upload は thumb 系 null + `processingStatus: "original_fallback"`、thumb test は `source: "admin"`、source test は `VARIANT_DEFAULTS` spread で DRY 補完）。
- How to apply（仕様書 sync-merge 節での逐語化）:
  1. **additive 列群衝突は SQL のみ・型 cascade を予期する**: 2 feature が同一 repository へ別々の DB 列群を足した回は interface/camel 写像が Auto-merge（両群併存）し SQL 列リスト/プレースホルダ/`.bind()` だけ衝突する。SQL は「**両群の和**」に解消する（片側採用は他機能を消す）。和にした瞬間 row 型が両群必須化するので `grep -rn '<repo関数>(' apps/ packages/ | grep -v __tests__` で全呼び出し元/fixture を洗い、他方列群の既定値を補完する。typecheck が `TS2345/TS2741` で確実に検出する。
  2. **`pnpm sync:resolve` の exit 1 + `WARN unhandled conflict` は source 残存の正常シグナル**: resolver は skill index/reference 専任で、source code 衝突は警告列挙 + exit 1 で抜ける。非0を失敗と誤読せず `git diff --diff-filter=U` で残 source を手動解消 → `git add` → merge commit（skill=resolver / source=人手 の 2 系統分業）。
  3. **SP-DEVSYNC-051/052（source 0 → install で全緑）の反例**: 本件は実 source 衝突 + 型 cascade で、install では閉じず呼び出し元修正が要る。「source conflict 0 → CI 修正不要」は additive 列群の併合では成立しないことを仕様書に明記する。
- 適用範囲外: optional field 同士の併存（aiworkflow L-DEVSYNC-081 系）。optional は required でないため呼び出し元 cascade が出ず手当て不要。本件は **DB 列群（row 型上 required）** ゆえに cascade する点が分岐。
- 検証: `git merge origin/dev` CONFLICT 7（skill 6 + `memberPhotos.ts`）→ `pnpm sync:resolve`（skill 6 解消 + `WARN unhandled conflict` + exit 1）→ `memberPhotos.ts` SELECT/INSERT を両群の和へ手動解消 + 呼び出し元 3 ファイル既定値補完 → `git diff --diff-filter=U` 0 → `pnpm typecheck` exit 0（初回 `apps/api` 9 件 `TS2345/TS2741` → 補完後全 Done）→ `pnpm lint` exit 0 → 影響 test 緑（memberPhotos repo 18 + me/photo contract 21）→ merge commit `5dcf34d1e`。
- 参照: aiworkflow-requirements [[lessons-learned-dev-sync-merge-conflict-resolution-2026-05]] L-DEVSYNC-089（本 lesson の正本・additive 列群 SQL 衝突 + 型 cascade）, L-DEVSYNC-081（optional field 併存の対比元）, L-DEVSYNC-086/087/088（source 0 → install 系列・本件はその反対）, SP-DEVSYNC-051/052（新 package install 前提・本件は実 source 衝突の別系統）, SP-DEVSYNC-038/042/044（source code 意味的 `UU` 経路）。


### SP-DEVSYNC-053: 同一 issue を dev と feature が並行実装した sync-merge は **コード本体（component + spec 2 file）＋ rename/rename** が衝突 — `pnpm sync:resolve` は skill index だけ畳んで apps/docs を `unhandled conflict` WARN で残す（exit 1 は異常でなく残集合の通知）。**機能衝突=上位集合採用 / テスト=加算統合 / rename=新内容×被参照配置**の 3 ヒューリスティクスを種別ごとに当てる（2026-06-02 docs/issue-1042-identity-conflicts-dismiss-optimistic-update ← dev 6 behind / 2 ahead, merge `e997b434f`）

- 事象: `docs/issue-1042-identity-conflicts-dismiss-optimistic-update` を sub-worktree から sync-merge。dev に **6 behind / 2 ahead**。取込に #1072（identity-conflicts dismiss の**楽観的更新化**＝本 feature と同一 issue #1042 の dev 側実装）を含むため、従来の skill-index 限定衝突と異なり **コード 3 file**（`apps/web/src/components/admin/IdentityConflictRow.tsx` + `__tests__/IdentityConflictRow.spec.tsx` + `playwright/tests/admin-identity-conflicts.spec.ts`）と **rename/rename 1 件**（同一 followup-004 単票が HEAD=workflow dir 配下 `unassigned-task-specs/` co-locate、dev=`completed-tasks/` ルート）が衝突。`pnpm sync:resolve` は skill index（union 3 + keywords `--ours`+rebuild）のみ処理し、apps/docs を `WARN unhandled conflict` で残して exit 1。
- How to apply（仕様書 sync-merge 節での逐語化）:
  1. **resolver の exit 1 = 異常終了でなく「残集合の通知」**: `[resolve-skill-merge-conflicts] WARN unhandled conflict: <path>` 列挙は手動解消対象リスト。resolver は skill index 専用設計で、コード/一般 docs は意図的に触らない。中断せず `git diff --diff-filter=U` の残を種別ごとに解消する。
  2. **機能衝突（同一 issue 並行実装）= 上位集合採用**: component 本体で片側 `if (optimisticMerged) return null`（dev: dismiss も return null へ）、片側 `optimisticStatus`（merge/dismiss 両方から導出）を `role=status aria-live=polite` sr-only `<p>` で通知＋focus（HEAD）。HEAD は dev の hide 意図を内包しつつ a11y を上乗せした厳密上位集合なので HEAD 1 本に畳む（両残しは二重 return）。
  3. **テスト= 加算統合**: 同名テストは assertion 上位集合（status text + focus 追加検証）を採り、互いに排他でない新規 `it()`（HEAD の `it.each` パラメタライズ vs dev の "再確定で 2 回目 trigger" / "rollback は merge 経路に影響しない"）は**両方残す**。解消後 `dismissRollbackCases` 等の HEAD 参照シンボルが衝突外領域に定義済みかを grep 確認してから add。
  4. **rename/rename= 新内容×被参照配置**: `diff <(git show HEAD:A) <(git show dev:B)` で内容差（本件 dev 側が "consumed / canonical workflow 実装完了" へ status 更新済）と `grep -rl <path>` で各パス参照を確認。**新内容かつ skill から参照される側（dev ルート）を採用**し、参照ゼロの重複 co-located を `git rm`。`git checkout dev -- <root>` + add、`git rm -f <coloc>`、両側削除 original も `git rm` で `UA`/`AU`/`DD` 解消。
- 適用範囲外: skill index/keywords のみの衝突回（SP-DEVSYNC-050/051/052 経路）。本件はそれにコード本体 + rename/rename が加わった上位ケース。
- 検証: `git merge dev` CONFLICT（skill index 4 + code 3 + rename/rename）→ `pnpm sync:resolve`（union 3 + `--ours` keywords + rebuild、apps/docs は `unhandled` WARN exit 1）→ 残 6 を手動解消 → `git diff --diff-filter=U` 0 → merge commit `e997b434f` → `pnpm install --force` exit 0 → `pnpm typecheck > file 2>&1; echo $?` = 0（6 packages）→ `pnpm lint` = 0 → focused vitest（`--root=. --config=vitest.config.ts apps/web/.../IdentityConflictRow.spec.tsx`）17/17 pass → `pnpm indexes:rebuild` 冪等（drift 0・5295 キーワード）。CI コード修正なしで全緑。
- 参照: aiworkflow-requirements [[lessons-learned-dev-sync-merge-conflict-resolution-2026-05]] L-DEVSYNC-088（本 lesson の正本・コード本体衝突 + rename/rename の 3 ヒューリスティクス）, SP-DEVSYNC-052（直近・パイプ偽陽性 + 新 package install）, SP-DEVSYNC-038/042/044（source code 意味的 `UU` の前例）, SP-DEVSYNC-045（resolver partial 失敗時の手動 fallback）。

### SP-DEVSYNC-081: `pnpm sync:resolve` は union 完了後 `git add` 段で stale `index.lock` 落ち（SP-DEVSYNC-039/045 再発）→ lock 除去 + 残マーカー 0 確認 + 手動 add + `indexes:rebuild` で完結／新 package 取込なしの dev デルタは install 不要で全緑（2026-06-03 追加）
- 事象: `docs/japanese-ime-input-composition-search-spec` を sub-worktree から sync-merge。`git fetch --prune origin` 後ローカル dev=origin/dev 一致（ff 不要・独自コミット 0）、現在ブランチ dev に **4 behind / 2 ahead**。`git merge origin/dev` で衝突 **3 file**（`indexes/resource-map.md` + `indexes/topic-map.md` + `references/task-workflow-active.md`）。`keywords.json` / `quick-reference.md` / 両 SKILL.md は全て Auto-merging。`pnpm sync:resolve` は `union-resolving 3 files` を完了表示後、`git add` 段で `fatal: Unable to create '.git/worktrees/<wt>/index.lock': File exists`（exit 128）。dev デルタは大型 feature 複数（#1030 / #1042 / #1043 / sidebar-visibility）を含むが docs-only ブランチと apps/ ソース非重複で source conflict 0。
- How to apply（仕様書 sync-merge 節での逐語化）:
  1. **`index.lock` 失敗は union 完了「後」の `git add` 段で起き得る恒常クラス**: 直前の中断 git 操作が残した stale lock が原因で resolver のバグではない。`.git/worktrees/<wt>/index.lock` を `rm -f` で除去。
  2. **union 書込は lock 失敗前に worktree 反映済**: `grep` 厳密パターン（`^<<<<<<< ` / `^>>>>>>> ` / `^=======$`）でマーカー残無し + `git ls-files -u`=0 を確認後、3 file を手動 `git add`（マーカー検査は `git diff --diff-filter=U` / `git diff --check` 正本に整合・装飾線偽陽性を排除）。
  3. **resolver が keywords rebuild 段未到達なら `pnpm indexes:rebuild` を明示**: topic-map + keywords.json を再生成（本件 5325 キーワード・冪等）→ `git add -A` → `git commit --no-edit`。
  4. **install 要否は「新 workspace package の有無」だけで決まる（SP-DEVSYNC-051/052 の対偶）**: 取込 feature が既存 workspace のみを触る回は merge 後 `pnpm typecheck`（全 package Done）/ `pnpm lint`（OK）が install 無しで通る。`apps/og` 等の新 package を持ち込む回に限り install 前提。dev デルタの新 `apps/*` / `packages/*` 有無を `git diff --name-only` で判定する。
- 適用範囲外: 新 package を持ち込む dev 取込（SP-DEVSYNC-051/052 経路・install 必須）／コード本体衝突を伴う回（SP-DEVSYNC-053）。本件は skill index 3 file のみ + index.lock 復旧 + install 不要の最小経路。
- 検証: `git merge origin/dev` CONFLICT 3 → `pnpm sync:resolve`（union 完了後 `index.lock` exit 128）→ lock 除去 + マーカー 0 + `git ls-files -u`=0 → 手動 add 3 file → `pnpm indexes:rebuild`（冪等・5325 キーワード）→ `git add -A` → merge commit `44246ab43` → `pnpm typecheck`（install 無しで全 package Done）→ `pnpm lint`（OK）。CI コード修正なしで全緑。
- 参照: aiworkflow-requirements [[lessons-learned-dev-sync-merge-conflict-resolution-2026-05]] L-DEVSYNC-092（本 lesson の正本）, SP-DEVSYNC-039/045（resolver partial 失敗時の手動 fallback 初出）, SP-DEVSYNC-050（残マーカー検査の厳密パターン）, SP-DEVSYNC-051/052（新 package → install 前提・本件はその対偶確認）。


### SP-DEVSYNC-083: **skill-index のみ衝突のクリーン基準ケース** — `pnpm sync:resolve` が `unhandled conflict` を出さず **exit 0 で完全自己完結**（手動解消フェーズ不要）。resolver の出口コード（exit 0 + WARN なし＝skill-index 限定 / exit 1 + WARN 列挙＝apps/docs 残）で衝突種別を resolver 実行直後に一次切り分けできる（2026-06-03 docs/issue-1054-wrangler-binding-drift-ci-gate-spec ← dev 4 behind / 2 ahead, merge `5f7087352`）

- 事象: `docs/issue-1054-wrangler-binding-drift-ci-gate-spec` を sub-worktree から sync-merge。dev に **4 behind / 2 ahead**。取込 4 コミット（#1095 identity-conflicts dismiss+fade / #1086 admin/audit preset datalist / #1073 tag master write / #1085 bulk member tag assign）は本 feature（wrangler binding drift CI gate＝`.mjs` + workflow docs）と**編集ファイルが没交渉**。`git merge dev` の content conflict は **5 file**＝`aiworkflow-requirements/SKILL.md` + `indexes/{keywords.json, quick-reference.md, resource-map.md, topic-map.md}` のみ（apps/docs 全て非衝突）。`pnpm sync:resolve` は `union-resolving 4 files` + keywords `--ours` + rebuild のみで **`WARN unhandled conflict` を一切出さず exit 0**、`git diff --diff-filter=U` 0 で手動解消なしに収束。
- How to apply（仕様書 sync-merge 節での逐語化）:
  1. **resolver の出口コードを衝突種別の一次切り分けに使う**: `pnpm sync:resolve` が **exit 0 かつ `unhandled conflict` 行なし**なら衝突は skill-index に閉じる（本ケース）→ `git diff --diff-filter=U` 0 を確認して即 merge commit。**exit 1 + `WARN unhandled conflict` 列挙**なら apps/docs にコード/rename 衝突が残る（SP-DEVSYNC-053 経路）→ 種別別の手動解消へ分岐。出口コードを見れば手動フェーズの要否を resolver 直後に判定でき、`--diff-filter=U` を引く前に経路確定できる。
  2. **「取込数が多い＝コード衝突」ではなく編集ファイルの重なりで決まる**: behind 4 でも feature と dev が無関係領域なら衝突は「複数 worktree が同じ skill index/changelog を追記する」構造要因だけに収束する。取込 PR 数ではなく**編集ファイルの交わり**を見て衝突種別を予測する。
  3. **install が no-op でも 3 ゲートは毎回当てる**: dev 側に新 workspace package 持込がなく `pnpm install --force` が `Already up to date`、`apps/og` module-not-found（SP-DEVSYNC-052）非発生でも、`pnpm typecheck`（7 packages Done）/ `pnpm lint`（verify-no-inline-style OK + eslint）/ `pnpm indexes:rebuild`（drift 0・5306 キーワード）を直接終了コードで確認する。
- 適用範囲外: apps/docs にコード本体 / rename/rename が混在する回（SP-DEVSYNC-053 経路・resolver exit 1 + WARN）。本件はそれの**下位＝skill-index 限定のクリーンケース**で、resolver 単独完結する基準形。
- 検証: `git merge dev` CONFLICT 5（SKILL.md + indexes 4）→ `pnpm sync:resolve` exit 0（`union-resolving 4 files` + keywords `--ours` + rebuild・**unhandled WARN なし**）→ `git diff --diff-filter=U` 0 → merge commit `5f7087352`（pre-commit hook 全 pass）→ `pnpm install --force`（`Already up to date`）→ `pnpm typecheck > file 2>&1; echo $?` = 0（7 packages）→ `pnpm lint` = 0 → `pnpm indexes:rebuild` 冪等（drift 0・5306 キーワード）。CI コード修正なしで全緑。
- 参照: aiworkflow-requirements [[lessons-learned-dev-sync-merge-conflict-resolution-2026-05]] L-DEVSYNC-089（本 lesson の正本・skill-index 限定クリーン基準ケースと出口コード切り分け）, SP-DEVSYNC-053（対照・apps/docs unhandled WARN exit 1 の 3 ヒューリスティクス）, SP-DEVSYNC-050/051/052（skill-index 衝突の前例）。


### SP-DEVSYNC-084: 衝突 5 file で **SKILL.md と `task-workflow-active.md` が同時衝突・keywords.json は非衝突** の第 3 member 構成 — resolver ログが `union-resolving 5 files`（4 でなく 5）で `--ours`+rebuild 段は不発火。`union-resolving N files` の N を 4 固定で見積もらず resolver ログの実数で確認する。`--ours` 行が出ない＝derived 未更新ではなく keywords 自動結合の正常ケース（2026-06-03 docs/profile-reload-session-404-fix-spec ← dev 6 behind / 2 ahead, merge `f15b27cbb`）

- 事象: `docs/profile-reload-session-404-fix-spec` を sub-worktree（`.worktrees/task-20260602-183629-wt-2`）から sync-merge。ローカル dev = origin/dev 一致（独自コミット 0 / ff 不要）、feature は origin/dev に **6 behind / 2 ahead**。取込 6 コミット（#1097 issue-1056 KV/alert drift / #1098 issue-1059 公開 members N+1 / #1096 issue-1054 wrangler binding gate / #1099 issue-1043 row fade / #1100 sidebar 表示条件 / #1082 issue-1030 member 写真 variant）は `apps/api`（migration `0024_member_photos_variants.sql` + `memberPhotos.ts` + repo test）等に広く触れるが**本 feature（/profile reload 時 GET /me 404 解消）の編集ファイルと没交渉**で apps 衝突ゼロ。content conflict は **5 file**＝`aiworkflow-requirements/SKILL.md` + `indexes/{quick-reference, resource-map, topic-map}` + `references/task-workflow-active.md`。**`indexes/keywords.json` / 両側 `LOGS/_legacy.md` / `SKILL-changelog.md` / task-spec `SKILL.md` は Auto-merging（非衝突）**。`pnpm sync:resolve` ログは **`union-resolving 5 files`**（SKILL.md + map 3 + task-workflow-active を全 union・keywords 非衝突ゆえ `taking --ours` 段なし）+ rebuild で `WARN unhandled conflict` なし exit 0 → `git diff --diff-filter=U` 0 で手動解消なし収束。
- How to apply（仕様書 sync-merge 節での逐語化）:
  1. **`union-resolving N files` の N を 4 固定で見積もらない**: skill-index 衝突回の resolver union 件数は member 構成で 3〜5 に振動する。SP-DEVSYNC-083（union 4 + keywords `--ours`）や aiworkflow L-DEVSYNC-091（union 4・keywords 非衝突）と異なり、本件は SKILL.md と task-workflow-active が同時衝突して **union 5** に増えた。`git diff --name-only --diff-filter=U` の実集合と resolver ログの実 N を毎回読み、前回の件数を予測子にしない。N が 5 でも resolver は同一 1 パスで畳む。
  2. **`taking --ours for derived files` 行が出ない＝derived 未再生成ではない**: keywords.json が Auto-merge で非衝突だった回は resolver の `--ours` 行が出ない。これは「keywords 追記行が両側で重ならず git 自動結合できた」正常ケースで、resolver 末尾の `indexes:rebuild`（union 解消後に常時走る）が drift 0 を担保する。`--ours` 不在を「indexes 未更新」と誤読せず、rebuild の冪等で確認する。
  3. **`--force` でなく `--frozen-lockfile` install でも skill-index クリーン回は即緑**: dev デルタ 6 コミットは `apps/api` を広く触るが新 workspace package 持込なし。`pnpm install --frozen-lockfile`（`Lockfile is up to date`・`-126` は不要 package prune）後、`apps/og` module-not-found（SP-DEVSYNC-052）非発生で `pnpm typecheck`（7 packages Done）/ `pnpm lint`（dep-cruiser 0 violations + verify-no-inline-style OK）をパイプ無し終了コードで確認。CI コード修正なしで全緑。
- 適用範囲外: apps/docs にコード本体 / rename/rename が混在する回（SP-DEVSYNC-053 経路・resolver exit 1 + WARN）。本件はそれの下位＝skill-index 限定クリーンケース（SP-DEVSYNC-083 と同系統で member 構成だけ異なる）。
- 検証: `git merge origin/dev` CONFLICT 5（SKILL.md + map 3 + task-workflow-active・keywords は Auto-merging）→ `pnpm sync:resolve` exit 0（**`union-resolving 5 files`**・`--ours` 段なし・rebuild・unhandled WARN なし）→ `git diff --diff-filter=U` 0 / 実マーカー 0 → merge commit `f15b27cbb`（pre-commit hook 全 pass）→ `pnpm install --frozen-lockfile`（`Lockfile is up to date`）→ `pnpm typecheck > file 2>&1; echo $?` = 0（7 packages）→ `pnpm lint > file 2>&1; echo $?` = 0。CI コード修正なしで全緑。
- 参照: aiworkflow-requirements [[lessons-learned-dev-sync-merge-conflict-resolution-2026-05]] L-DEVSYNC-093（本 lesson の正本・第 3 member 構成 union 5）, L-DEVSYNC-091/092（他 2 member 構成）, SP-DEVSYNC-083（skill-index 限定クリーン基準・出口コード切り分け）, SP-DEVSYNC-050/051/052（skill-index 衝突の前例）。

### SP-DEVSYNC-084: **resolver の `indexes:rebuild` 段は共有 `.git/index.lock` 競合で単独失敗しうる — sync:resolve 後は `indexes:rebuild` を手で再実行して drift 0 を確認する** — かつ片側が className を変数化・他側が同 className に utility 追記した 3-way コード衝突は「変数補間へ utility を再付与」で両意図を残す（2026-06-03 feat/sidebar-footer-pinning-and-account-popover-ux ← dev 5 behind / 2 ahead）

- 事象: `feat/sidebar-footer-pinning-and-account-popover-ux` を sub-worktree から sync-merge。dev に **5 behind / 2 ahead**。`git merge dev` の content conflict は **7 file**＝`aiworkflow-requirements/SKILL.md` + `indexes/{keywords.json, quick-reference.md, resource-map.md, topic-map.md}` + `references/task-workflow-active.md` + **`apps/web/src/components/shell/SidebarNavItem.tsx`（コード本体・unhandled）**。`SidebarUserMenu.tsx` / その spec / `styles/legacy-public.css` は Auto-merging。`pnpm sync:resolve` は `union-resolving 5 files` + keywords `--ours` まで成功したが、最終段 `pnpm indexes:rebuild` が **`fatal: Unable to create '.git/worktrees/<wt>/index.lock': File exists` (exit 128)** で落ち、**union/`--ours` は済みだが index map は未再生成のまま**残った。lock の主は同 `.git` を共有する他 worktree の lazygit / wt-health-check フック。手で `pnpm indexes:rebuild` を再実行して 5317 キーワードを生成し直し drift 0 に収束。
- How to apply（仕様書 sync-merge 節での逐語化）:
  1. **sync:resolve 後は `indexes:rebuild` を手で再実行して drift 0 を確認する**: resolver の最終段 indexes:rebuild は **共有 `.git/index.lock` 競合（並列 worktree の lazygit / health-check フックが同 `.git` を触る）で exit 128 で落ちうる**。9 並列 worktree 運用ではこの競合が常時起こりうる前提で、sync:resolve のログ末尾を indexes 再生成済みの証拠にせず、必ず手で `pnpm indexes:rebuild` を再実行して冪等（drift 0）を確認してから merge commit する。lock が残る場合のみ `ls .git/worktrees/<wt>/index.lock` 実在確認 + `ps aux | grep git` で実プロセス不在を確かめてから除去（再 rebuild は union/`--ours` 済みなので安全な冪等操作）。
  2. **片側が className を変数化・他側が utility 追記した 3-way 衝突は「変数補間へ utility を再付与」で両意図を残す**: `SidebarNavItem.tsx` は HEAD が collapse 対応で `itemClassName` 変数を抽出、dev が同 className に `border-l-2` + active インジケータ utility を追記。`merge.conflictstyle=diff3` の base 節（`||||||| <sha>`）で「変数化 vs 追記」を判定し、**一方採用でなく dev の utility を HEAD の変数補間へ移植**（`` `${itemClassName} border-l-2 ... data-[active=true]:border-...` ``）。一方を選ぶと collapse 対応か active インジケータのどちらかが消える。
  3. **構造上 `!collapsed` が保証される site の collapse 三項は dead 枝を畳む**: badge span は `showBadge && item.badge && !collapsed` 内なので `collapsed ? "sr-only" : X` の `"sr-only"` 枝は到達不能（collapsed 時は別途ドット表示）。三項を畳んで dev 側の値（`font-semibold`）のみ採用。到達不能枝は誤誘導になるため最小形に畳む。
- 適用範囲外: skill-index のみの衝突で resolver が exit 0 完結する回（SP-DEVSYNC-083）。本件は apps コード本体が unhandled で残る SP-DEVSYNC-053 経路の派生で、加えて resolver の indexes 段が lock 競合で単独失敗した稀ケース。
- 検証: `git merge dev` CONFLICT 7（skill 6 + `SidebarNavItem.tsx`）→ `pnpm sync:resolve`（union/`--ours` 成功・最終 indexes:rebuild が `index.lock: File exists` exit 128 で落ち未生成）→ `SidebarNavItem.tsx` 手解消 → `git diff --diff-filter=U` 0 → `pnpm indexes:rebuild` 再実行（5317 キーワード・drift 0）→ `pnpm typecheck > file 2>&1; echo $?` = 0（7 packages）→ `pnpm lint` = 0 → focused vitest（SidebarNavItem 4 + SidebarUserMenu 8 + SidebarShell 10 = 22 passed）。CI コード修正なしで全緑。
- 参照: aiworkflow-requirements [[lessons-learned-dev-sync-merge-conflict-resolution-2026-05]] L-DEVSYNC-092（本 lesson の正本・index.lock 競合と 3-way className 衝突の手解消）, SP-DEVSYNC-053（apps/docs unhandled WARN exit 1 の手解消経路）, SP-DEVSYNC-083（対照・skill-index 限定 exit 0 完結ケース）。

### SP-DEVSYNC-088: **feature が dev の churn したファイルを行領域レベルで触っていなければ sync-merge は完全 auto-merge（コンフリクト 0・`pnpm sync:resolve` 不要）** — 衝突スペクトラムの下限端。判別子は「ファイル重なり」でなく「同一ファイル内の行領域重なり」（2026-06-03 docs/issue-1065-shell-collapse-cookie-naming-drift ← dev 5 behind / 2 ahead, merge `2afda00e7`）

- 事象: `docs/issue-1065-shell-collapse-cookie-naming-drift` を sub-worktree から **2 回目**の sync-merge（前回 `5eb69e4eb` で earlier dev 取込済）。dev に **5 behind / 2 ahead**。取込 5 コミット（#1098 公開 members N+1 / #1096 wrangler binding gate / #1099 row fade 等＋直近 skill 同期）は `aiworkflow-requirements/{SKILL.md, LOGS/_legacy.md, SKILL-changelog.md}` を churn。だが feature 側コミット `88a789efc` は `task-specification-creator/`（SKILL.md / SKILL-changelog.md / references×4）と `apps/web/.../shell-collapse-cookie.ts` のみを編集し **`aiworkflow-requirements/**` は 0 file 未接触**。`git merge dev --no-edit` は **CONFLICT 0・完全 auto-merge**（`git diff --diff-filter=U` 空・post-merge hook の stale-worktree-notice のみ発火）で **`pnpm sync:resolve` を起動する必要すらなかった**。
- How to apply（仕様書 sync-merge 節での逐語化）:
  1. **衝突は「ファイル重なり」でなく「同一ファイル内の行領域重なり」で決まる**: SP-DEVSYNC-083（skill-index 限定衝突・resolver exit 0）のさらに下に **コンフリクト 0** の端がある。dev が `SKILL.md` を churn しても、feature がそのファイルを未編集、または編集していても行領域非重複なら git 3-way が全自動結合する。本件は feature が aiworkflow を 0 file 編集（disjoint）、かつ feature 自身が触った task-spec `SKILL.md` も dev 側編集と行領域非重複で auto-merge。「dev が SKILL.md を変えた＝衝突必須」と決め打たない。
  2. **union .gitattributes と行領域 auto-merge の二段で衝突 0 が成立する**: `merge=union`（`SKILL-changelog.md` / `LOGS/_legacy.md` / `lessons-learned/*.md`）は両側追記を機械結合。union 対象外の `SKILL.md` / `indexes/*-map.md` / `references/*.md` も行領域非重複なら git 標準 3-way で自動解決。両段成立で `--diff-filter=U` が空になり resolver 不要。`SKILL.md` が union 対象外なのを「常に手動衝突」と誤読しない。
  3. **resolver 非起動でも 3 ゲートは省かない**: `sync:resolve` を走らせない＝indexes 再生成段を経ていないので、`pnpm typecheck`（7 packages Done・exit 0）/ `pnpm lint`（dep-cruiser 0 violations + verify-no-inline-style OK + eslint・exit 0）を直接終了コードで確認。feature が indexes を触っていれば別途 rebuild 要否を判断（本件は aiworkflow indexes 未接触ゆえ不要）。
- 適用範囲外: feature が dev の churn した skill-index ファイルの同一行領域を編集した回（衝突発生＝SP-DEVSYNC-083 経路 resolver exit 0、または apps 混在で SP-DEVSYNC-084 経路）。本件はそれらの**下位＝衝突 0 の基準形**。
- 仕様書を書く際: docs-spec タスクの sync-merge 節で「dev が skill index を churn していても feature がその行領域を触っていなければ `git merge dev` は衝突 0 で auto-merge する。`--diff-filter=U` が空なら resolver を起動せず typecheck/lint を直接当てる」を明示する。
- 検証: `git rev-list --left-right --count dev...HEAD` = 5/2 → `git merge dev --no-edit` **CONFLICT 0**（`--diff-filter=U` 空・post-merge stale-worktree-notice のみ）→ merge commit `2afda00e7`（parents `5eb69e4eb` + `6611a92a7`）→ `git merge-base --is-ancestor dev HEAD` = yes / `dev..HEAD` = 3 → `pnpm install`（`Lockfile is up to date`）→ `pnpm typecheck` = 0（7 packages）→ `pnpm lint` = 0。`pnpm sync:resolve` 非起動。CI コード修正なしで全緑。
- 参照: aiworkflow-requirements [[lessons-learned-dev-sync-merge-conflict-resolution-2026-05]] L-DEVSYNC-095（本 lesson の正本・衝突 0 の下限端と行領域判別子）, SP-DEVSYNC-083（直上＝skill-index 限定衝突 resolver exit 0）, SP-DEVSYNC-084（apps 混在 unhandled 経路）。

### SP-DEVSYNC-085: **union 集合がスキル横断 — 5 番目の union member が task-spec-creator 配下 `patterns-lessons-and-pitfalls.md`・keywords.json は衝突して `--ours` 発火** — clean-case の member 構成は「aiworkflow 4 file + 本スキル 1 file (union 5) + keywords `--ours`」も取りうる。`merge=union` は `.claude/skills/**` をパス glob で横断登録するため union member は aiworkflow 配下に閉じない。`union-resolving N files` の N と内訳・`--ours` 行の有無をログで実確認し、aiworkflow 限定と決め打たない。install 省略で `pnpm typecheck`（7 packages exit 0）/`pnpm lint`（exit 0）/`pnpm indexes:rebuild`（5345 キーワード・drift 0）直行で CI 修正なしの全緑（2026-06-03 docs/admin-meetings-attendance-404-and-ia-spec ← dev 1 behind / 3 ahead, merge `35d30c910`・衝突 6 file = aiworkflow SKILL.md + index{quick-reference, resource-map, keywords} + task-workflow-active + 本ファイル `patterns-lessons-and-pitfalls.md`、topic-map/SKILL-changelog/_legacy/lessons は Auto-merging）。aiworkflow-requirements [[lessons-learned-dev-sync-merge-conflict-resolution-2026-05]] L-DEVSYNC-095（本 lesson の正本）, SP-DEVSYNC-084（keywords 非衝突・union 5 全て aiworkflow 配下の前回型）, SP-DEVSYNC-083（skill-index 限定クリーン基準）を参照。

### SP-DEVSYNC-085: **behind 9（apps/api migration/repository/route の実コード取込）でも feature と編集領域が没交渉なら衝突は skill-index 6 file に閉じ resolver exit 0 完結** — behind の深さ・取込コード量は衝突種別の予測子にならず、編集ファイルの交わりだけが決める。union 段は SKILL.md と task-workflow-active が同時衝突して 5 files になる member 構成もある（2026-06-03 fix/admin-member-detail-status-404 ← dev 9 behind / 2 ahead, merge `71f27d714`）

- 事象: `fix/admin-member-detail-status-404` を sub-worktree から sync-merge。dev に **9 behind / 2 ahead**。取込 9 コミットは apps/api 実コード変更を多数含む（migration `0024_member_photos_variants.sql`・`memberPhotos.ts`・`responseFields.ts`・`member-photo-presign.ts`・`routes/admin/members.ts` 等）が、本 feature（admin 会員詳細 status 404 耐性化）の編集ファイルと**没交渉**。`git merge dev` の content conflict は **6 file**＝`aiworkflow-requirements/SKILL.md` + `indexes/{keywords.json, quick-reference.md, resource-map.md, topic-map.md}` + `references/task-workflow-active.md`（apps/** は migration/repository/route が全て Auto-merging・コード衝突ゼロ）。`pnpm sync:resolve` は `union-resolving 5 files`（**SKILL.md + map 3 + task-workflow-active が同居**）+ keywords `--ours` + rebuild のみで `WARN unhandled conflict` を出さず **exit 0**、`git diff --diff-filter=U` 0 で手動解消なしに収束。
- How to apply（仕様書 sync-merge 節での逐語化）:
  1. **behind の大小・apps/api コード量で衝突種別を予測しない — 編集領域の交わりが唯一の決定要因**: behind 9 で migration/repository/route を多数取り込んでも feature と没交渉なら衝突は skill-index に閉じる。SP-DEVSYNC-083 #2（取込数でなく編集ファイルの交わりで決まる）を深 behind まで延長したケース。9 behind でも resolver exit 0 で即 merge commit してよい。
  2. **union 段 5 files = SKILL.md と task-workflow-active の同時衝突も正常な 1 パターン**: 過去回は「SKILL.md 衝突 ↔ task-workflow-active Auto-merge」の片側振動で union 4 files だったが、本件は両方が衝突して 5 files。member 構成・件数を前回の予測子にせず、毎回 `git diff --name-only --diff-filter=U` で実集合を確定して resolver に委ねる（全 member が union 登録済みなので件数に依らず 1 パスで畳む）。
  3. **lock 競合なく indexes 段が完走した回でも rebuild 冪等を手で確認する**: 本回は resolver の indexes:rebuild が `index.lock` 競合（SP-DEVSYNC-084）を起こさず完走したが、merge commit 後に手で `pnpm indexes:rebuild` を再実行し drift 0（5344 キーワード）を確認した。lock 競合は確率的外部要因なので「今回落ちなかった」を恒常前提にしない。
- 適用範囲外: apps/docs にコード本体 / rename/rename が混在し resolver が exit 1 + WARN を出す回（SP-DEVSYNC-053/084 経路）。本件は skill-index 限定 exit 0 完結の基準形（SP-DEVSYNC-083）を、深 behind + apps/api 実コード取込下でも成立することを示す上位データポイント。
- 検証: `git merge dev` CONFLICT 6（SKILL.md + indexes 4 + task-workflow-active・apps/** は Auto-merging）→ `pnpm sync:resolve` exit 0（`union-resolving 5 files` + keywords `--ours` + rebuild・**unhandled WARN なし**）→ `git diff --diff-filter=U` 0 → merge commit `71f27d714`（pre-commit hook 全 pass）→ `pnpm typecheck > file 2>&1; echo $?` = 0（全 packages Done）→ `pnpm lint` = 0（apps/web tsc + eslint Done）→ `pnpm indexes:rebuild` 冪等（drift 0・5344 キーワード）。CI コード修正なしで全緑。
- 参照: aiworkflow-requirements [[lessons-learned-dev-sync-merge-conflict-resolution-2026-05]] L-DEVSYNC-093（本 lesson の正本・behind 9 でも skill-index 限定 + 両衝突 member 構成）, SP-DEVSYNC-083（対照・skill-index 限定 exit 0 完結の基準形）, SP-DEVSYNC-084（index.lock 競合と 3-way className 衝突の手解消経路）。

### SP-DEVSYNC-086: **本スキル `patterns-lessons-and-pitfalls.md` が 5 番目 union member として衝突した union 3 + keywords `--ours` のスキル横断ケース** — `merge=union` は `.claude/skills/**` をパス glob 横断登録するため、本スキルの reference が dev 追記で union member になる（SP-DEVSYNC-085 と同型・本件で再現）。同じ union 3 でも L-DEVSYNC-096 型（quick-reference + topic-map + task-workflow-active・keywords 非衝突）と本件型（resource-map + topic-map + **本スキル patterns-lessons-and-pitfalls**・keywords `--ours`）は member 集合も keywords 衝突有無も別解。union member を aiworkflow 配下限定と決め打たず `git diff --name-only --diff-filter=U` で本スキル配下を含むか毎回実確認する。`pnpm sync:resolve` 1 回（`union-resolving 3 files` + `--ours` 1 + rebuild）で exit 0 完結、install→typecheck（7 packages exit 0）→lint（exit 0）→indexes:rebuild（5393 キーワード・drift 0）で CI 修正なし全緑（2026-06-04 feat/issue-1070-tag-reactivate-physical-delete ← dev 7 behind, merge `b85cb643f`・衝突 4 file = keywords `--ours` + resource-map + topic-map + 本ファイル `patterns-lessons-and-pitfalls.md`、quick-reference/task-workflow-active/SKILL.md は Auto-merging）。残存判定の正本は `--diff-filter=U` = 0、素朴 `git grep '^======='` は ut-08 `manual-smoke-log.md` 装飾線を誤検出（本回も再現）。aiworkflow-requirements [[lessons-learned-dev-sync-merge-conflict-resolution-2026-05]] L-DEVSYNC-097（本 lesson の正本）, SP-DEVSYNC-085（5 番目 union member が本スキル配下になる初観測）, SP-DEVSYNC-083（skill-index 限定クリーン基準）を参照。

- 追補（同一ブランチ直後の doc-only delta は衝突ゼロ）: SP-DEVSYNC-086 の merge `b85cb643f` 直後、同じ `feat/issue-1070-tag-reactivate-physical-delete` の再 sync-merge は dev デルタ 1 コミット（#1120 issue-1065 workflow doc 追加のみ・`docs/30-workflows/**` 限定で `.claude/skills/**` 非接触）ゆえ content conflict **0**・`pnpm sync:resolve` 不発火・非衝突 merge commit `d7254598e`。SP-DEVSYNC-083 の「skill-index に触れない dev デルタは衝突しない」を最小ケースで再確認（doc-only なら union member すら出ない）。`--diff-filter=U` 0 / indexes drift 0 / typecheck・lint exit 0 で全緑。aiworkflow-requirements [[lessons-learned-dev-sync-merge-conflict-resolution-2026-05]] L-DEVSYNC-097 追補と対。

### SP-DEVSYNC-086: **union コア最小（2 files = SKILL.md + topic-map のみ）+ keywords.json `--ours` 衝突という member 集合の下端ケース** — quick-reference / resource-map / task-workflow-active が全 Auto-merge でも keywords.json は独立に衝突しうる。`union-resolving N files` の N は過去回の 5 でなく resolver ログ実数で読み、`taking --ours` 行の有無は union 件数と無相関（2026-06-03 feat/issue-1068-admin-tag-inline-create-ui ← dev 6 behind / 3 ahead, merge `dd4d048fe`）
### SP-DEVSYNC-089: **union 5 = 全 aiworkflow コア（SKILL.md + map 3 + task-workflow-active）+ keywords.json `--ours` 発火、という member 構成も正常パターン** — union 件数・内訳は dev × feature 交差で振動するが resolver は集合非依存に exit 0 で畳む（2026-06-05 docs/issue-1076-member-og-design-token-alignment-spec ← dev 4 behind / 2 ahead, merge `c7d4ac0a2`）
- 事象: ローカル dev = origin/dev 一致（独自コミット 0 / ff 不要・dev 同期 no-op）、feature は dev に **4 behind / 2 ahead**。取込 4 コミット（#1120 issue-1065 cookie 命名 SSOT / #1115 admin 開催日 404 + 出席 UX / #1114 issue-1063 cookie Secure / #1109 会員詳細 status 404 耐性化）が skill 同期 + apps を churn。`git merge dev --no-edit` の content conflict は **6 file**＝`aiworkflow-requirements/SKILL.md` + `indexes/{keywords.json, quick-reference.md, resource-map.md, topic-map.md}` + `references/task-workflow-active.md`（**全て aiworkflow 配下・本スキル配下 0**）。`SKILL-changelog.md` / `LOGS/_legacy.md` / `lessons-learned/*.md` は Auto-merging（`merge=union`）。`pnpm sync:resolve` ログは **`union-resolving 5 files`**（SKILL.md + map 3 + task-workflow-active ＝ aiworkflow コア丸ごと）+ **`taking --ours for 1 derived files: keywords.json`** + rebuild + `all skill / index conflicts resolved`、`WARN unhandled` なし exit 0 → `git diff --diff-filter=U` 0 で手動解消なしに収束。
- How to apply（仕様書 sync-merge 節での逐語化）:
  1. **union member 集合は 3 軸で独立に振れる — 件数・内訳を前回比で固定しない**: (a) どの aiworkflow file が衝突するか (b) 本スキル配下が混じるか（SP-DEVSYNC-085 は混じる回）(c) keywords が衝突するか（SP-DEVSYNC-084 は非衝突）の 3 軸。本件は aiworkflow コア 5 全衝突 + keywords 衝突という組み合わせ。L-DEVSYNC-096（union 3 縮退）／SP-DEVSYNC-085（task-spec 混在）と並ぶ第 N 変種で、`union-resolving N files` の N と内訳・`--ours` 行をログで実確認するのが正運用。
  2. **本スキル（task-specification-creator）配下が衝突 0 でも resolver 経路は同じ**: 本件は本スキル配下が 1 file も衝突しなかったが、`.gitattributes` の `merge=union` は `.claude/skills/**` をスキル横断登録するため、衝突が aiworkflow に閉じても task-spec に散っても resolver は同一 1 パスで畳む。「自スキルが衝突していないから sync:resolve 不要」と誤読せず、`--diff-filter=U` が非空なら resolver 直行。
  3. **検証 3 ゲートを終了コードで直接当てる**: merge commit 後 `pnpm typecheck`（7 packages exit 0）/ `pnpm lint`（dep-cruiser 0 violations・verify-no-inline-style OK・eslint exit 0）/ `pnpm indexes:rebuild`（5375 キーワード・drift 0）。keywords 件数は dev デルタ累積で前回比増減が正常（`--ours` 後に決定論再生成）。
- 適用範囲外: apps/docs にコード本体 / rename が混在し resolver が exit 1 + WARN を出す回（SP-DEVSYNC-053/084 経路）。本件は skill-index 限定 exit 0 完結の基準形。
- 検証: `git fetch --prune origin`（dev=origin/dev 一致・ff 不要・独自コミット 0）→ `git rev-list --left-right --count origin/dev...HEAD` = 4/2 → `git merge dev --no-edit` CONFLICT 6（aiworkflow SKILL.md + indexes 4 + task-workflow-active・changelog/_legacy/lessons は Auto-merging）→ `pnpm sync:resolve` exit 0（`union-resolving 5 files` + `taking --ours for 1 derived files: keywords.json` + rebuild・unhandled WARN なし）→ `git diff --diff-filter=U` 0 / 実マーカー `<<<<<<<`・`>>>>>>>` 0 件 → merge commit `c7d4ac0a2`（pre-commit hook 全 pass: main-branch-guard / staged-task-dir-guard（MERGE_HEAD auto-skip）/ block-test-suffix / block-stable-key-update）→ `pnpm typecheck` = 0（7 packages）→ `pnpm lint` = 0 → `pnpm indexes:rebuild` 冪等（5375 キーワード・drift 0）。CI コード修正なしで全緑。
- 参照: aiworkflow-requirements [[lessons-learned-dev-sync-merge-conflict-resolution-2026-05]] L-DEVSYNC-097（本 lesson の正本）, SP-DEVSYNC-085（union 5 に本スキル配下が混じる対照変種）, SP-DEVSYNC-084（keywords 非衝突・union 5 全 aiworkflow の前回型）, SP-DEVSYNC-083（skill-index 限定 exit 0 完結の基準形）。

### SP-DEVSYNC-086: **union コア最小（2 files = SKILL.md + topic-map のみ）+ keywords.json `--ours` 衝突という member 集合の下端ケース** — quick-reference / resource-map / task-workflow-active が全 Auto-merge でも keywords.json は独立に衝突しうる。`union-resolving N files` の N は過去回の 5 でなく resolver ログ実数で読み、`taking --ours` 行の有無は union 件数と無相関（2026-06-03 feat/issue-1068-admin-tag-inline-create-ui ← dev 6 behind / 3 ahead, merge `dd4d048fe`／**2026-06-05 docs/issue-1076-member-og-design-token-alignment-spec ← dev 1 behind / 4 ahead, merge `c70726663` で同一 member 構成（union 2 = SKILL.md + topic-map + keywords `--ours`）を再現** — 同ブランチ一度目 SP-DEVSYNC-089 の union 5 から二度目で union 2 へ縮退。**3度目: 2026-06-05 同ブランチ ← dev 1 behind / 6 ahead, #1123 取込, merge `bb1dffb3b` でも union 2 を再々現**（三度目以降も浅 sync では union 2 安定反復で新規教訓なし → 累積再現は merge hash 追記のみで新エントリを作らない方針）。aiworkflow-requirements [[lessons-learned-dev-sync-merge-conflict-resolution-2026-05]] L-DEVSYNC-098 が正本）

- 事象: `feat/issue-1068-admin-tag-inline-create-ui` を sub-worktree から sync-merge。`git fetch --prune origin` 後ローカル dev = origin/dev 一致（`2d76f7c4a`・独自コミット 0・ff 不要）、feature は origin/dev に **6 behind / 3 ahead**。取込 6 コミット（#1098 公開 members N+1 IN 句バッチ / #1096 wrangler binding drift CI gate 等）は本 feature（admin 会員ドロワーのタグ inline 作成 UI）と没交渉で apps/** 衝突ゼロ。`git merge dev --no-edit` の content conflict は **3 file**＝`aiworkflow-requirements/SKILL.md` + `indexes/{keywords.json, topic-map.md}` のみ。`indexes/{quick-reference, resource-map}` + `references/task-workflow-active.md` + `SKILL-changelog.md` + 両 `LOGS/_legacy.md` は全て Auto-merging（非衝突）。`pnpm sync:resolve` ログは **`union-resolving 2 files`**（SKILL.md + topic-map）+ **`taking --ours for 1 derived files`（keywords.json）** + rebuild で `all skill / index conflicts resolved`・unhandled WARN なし exit 0、`git diff --diff-filter=U` 0 で手動解消なし収束。
- How to apply（仕様書 sync-merge 節での逐語化）:
  1. **union コアは 2 file まで縮退しうる — `union-resolving N files` の N を過去回の 5 で見積もらない**: SP-DEVSYNC-084/085 は union 5 file（SKILL.md + map 3 + task-workflow-active）だったが、本件は dev 側が topic-map のみ追記し quick-reference / resource-map / task-workflow-active を触らなかったため **union が SKILL.md + topic-map の 2 file まで縮退**した。member 集合は「feature 編集集合 × dev 側がどの index file を追記したか」で 2〜5 file に振動する。毎回 `git diff --name-only --diff-filter=U` の実集合と resolver の `union-resolving N files` 実数を読み、前回件数を予測子にしない。
  2. **keywords.json の `--ours` 衝突は union 件数と無相関の独立変数**: 前回 SP-DEVSYNC-085 は深 behind で keywords 衝突 6 file、L-DEVSYNC-095 は浅 behind で keywords 非衝突 union 5。本件は **union 2（最小）なのに keywords は衝突（`--ours` 発火）**で、union コアの大小と keywords 衝突有無は逆相関すらしない 2 独立軸であることを下端データで確認。`taking --ours for 1 derived files` 行の有無を union 件数で予断せず、keywords は dev 累積追記行が両側で重なったかだけで決まる（重なれば ours 採用 → rebuild が真値再生成）。
  3. **resolver を background task で回した回の成否は task 完了通知 + `all skill / index conflicts resolved` + `--diff-filter=U` 0 の 3 点で確定する**: 長め（~25s）の `pnpm sync:resolve` を background 起動した回は前景 wrapper（`sleep && cat`）が SIGTERM(143) で切れても resolver 本体とは無関係。①task 完了通知 exit code、②出力末尾の `all skill / index conflicts resolved`、③`git diff --name-only --diff-filter=U` 0 の 3 点で成功確定し、wrapper の 143 を resolver 失敗と誤読しない。
- 適用範囲外: apps/docs にコード本体 / rename/rename が混在し resolver が exit 1 + WARN を出す回（SP-DEVSYNC-053/084 経路）。本件は skill-index 限定 exit 0 完結の基準形（SP-DEVSYNC-083）の **union 下端ケース**で、SP-DEVSYNC-085（深 behind・keywords 衝突 6 file）と (union 件数, keywords 衝突有無) の両軸で対をなす。
- 検証: `git fetch --prune origin`（dev=origin/dev 一致 `2d76f7c4a`・ff 不要・独自コミット 0）→ `git rev-list --count HEAD..origin/dev` = 6 / `origin/dev..HEAD` = 3 → `git merge dev --no-edit` CONFLICT 3（SKILL.md + keywords.json + topic-map・quick-reference/resource-map/task-workflow-active は Auto-merging）→ `pnpm sync:resolve` exit 0（**`union-resolving 2 files`** + **`taking --ours`（keywords.json）** + rebuild・`all skill / index conflicts resolved`・unhandled WARN なし）→ `git diff --diff-filter=U` 0 / 実マーカー 0 → merge commit `dd4d048fe`（pre-commit hook 全 pass）→ `pnpm install`（新 package 持込なし・59s）→ `pnpm typecheck` = 0（7 packages 全 Done）→ `pnpm lint` = 0（dep-cruiser 0 violations・verify-no-inline-style OK・apps/web tsc+eslint Done）→ `pnpm indexes:rebuild` 冪等（drift 0・5385 キーワード）。CI コード修正なしで全緑。
- 参照: aiworkflow-requirements [[lessons-learned-dev-sync-merge-conflict-resolution-2026-05]] L-DEVSYNC-096（本 lesson の正本・union 2/keywords 衝突の逆コーナー）, L-DEVSYNC-095（対をなす union 5/keywords 非衝突）, SP-DEVSYNC-083（skill-index 限定 exit 0 完結の基準形）, SP-DEVSYNC-085（深 behind・keywords 衝突 6 file の対）。

### SP-DEVSYNC-091: **本スキル（task-specification-creator）の SKILL.md が aiworkflow 配下と同一 merge batch で同時衝突する「2 スキル横断 SKILL.md 衝突」変種**（旧採番 SP-DEVSYNC-090 → dev 側並行セッションの static-manifest lesson と番号衝突したため 091 へ採番替え・SP-DEVSYNC-012/077 renumber 規則）— union 5 = aiworkflow SKILL.md + map 3 + **task-spec/SKILL.md**。SP-DEVSYNC-089（union 5 が全 aiworkflow 配下・本スキル配下 0）に対し、本件は task-workflow-active が離脱し task-spec/SKILL.md が衝突集合へ加入。本スキル配下が衝突しても resolver は `.gitattributes` union 登録に閉じて同一 1 パス exit 0（2026-06-05 docs/issue-1079-bulk-tag-audit-batch-filter-spec ← dev 5 behind / 2 ahead, merge `2c7102b33`）
- 事象: ローカル dev = origin/dev 一致（独自コミット 0 / ff 不要・dev 同期 no-op）、feature は dev に **5 behind / 2 ahead**。取込 5 コミット（#1132 issue-1076 OG design token / #1123 issue-1069 tag code rename / #1121 issue-1068 admin tag inline create / #1120 issue-1065 cookie 命名 SSOT / #1115 admin 開催日 404 + 出席 UX）が両スキル同期 + apps/{api,web,og} を churn。`git merge dev --no-edit` の content conflict は **6 file**＝`aiworkflow-requirements/{SKILL.md, indexes/keywords.json, indexes/quick-reference.md, indexes/resource-map.md, indexes/topic-map.md}` + **`task-specification-creator/SKILL.md`**。`references/task-workflow-active.md`（SP-DEVSYNC-089 では衝突）は今回 Auto-merging 側へ転び、代わりに本スキル SKILL.md が加入。`SKILL-changelog.md` / `LOGS/_legacy.md` / `lessons-learned/*.md` は両スキルとも Auto-merging。`pnpm sync:resolve` ログは **`union-resolving 5 files`**（aiworkflow SKILL.md + quick-reference + resource-map + topic-map + **task-spec SKILL.md**）+ **`taking --ours for 1 derived files: keywords.json`** + rebuild + `all skill / index conflicts resolved`、`WARN unhandled` なし exit 0 → `git diff --diff-filter=U` 0 で手動解消なし収束。
- How to apply（仕様書 sync-merge 節での逐語化）:
  1. **本スキルの SKILL.md は衝突する回と衝突しない回がある — SP-DEVSYNC-089「本スキル配下 0」を一般則化しない**: SP-DEVSYNC-089 は本スキル配下が 1 file も衝突しなかったが、本件は task-spec/SKILL.md が衝突した。dev デルタが本スキルの SKILL.md（changelog 本体行や見出し）を追記したかで決まり、両スキルの SKILL.md が同一 batch で同時衝突しうる。「衝突は aiworkflow に閉じる」前提を置かず `--diff-filter=U` の実集合で判定する。
  2. **union 件数が前回と同じ 5 でも内訳 member は入れ替わる**: SP-DEVSYNC-089 と本件はともに union 5 だが、内訳は task-workflow-active ⇄ task-spec/SKILL.md で 1 member 差し替わっている。`union-resolved <path>` 各行を読み、件数 5 を「前回と同じ構成」と短絡しない。どの member でも resolver の挙動・exit code は不変（畳み先だけが違う）。
  3. **2 スキル横断衝突でも resolver は 1 パス**: `pnpm sync:resolve` は `.claude/skills/**` をスキル非依存に走査するため、衝突が aiworkflow と task-spec を跨いでも追加操作なしに同一 1 パスで畳む。横断衝突を理由に手動解消や分割実行を挟まない。
- 適用範囲外: apps/docs にコード本体 / rename が混在し resolver が exit 1 + WARN を出す回（SP-DEVSYNC-053/084 経路）。本件は skill-index 限定 exit 0 完結の基準形（SP-DEVSYNC-083）で、SP-DEVSYNC-089（全 aiworkflow 配下 union 5）と内訳変種の対をなす。
- 検証: `git fetch --prune origin`（dev=origin/dev 一致・ff 不要・独自コミット 0）→ `git rev-list --count HEAD..dev` = 5 / `dev..HEAD` = 2 → `git merge dev --no-edit` CONFLICT 6（aiworkflow SKILL.md + indexes 4 + task-spec SKILL.md・task-workflow-active/changelog/_legacy/lessons は Auto-merging）→ `pnpm sync:resolve` exit 0（**`union-resolving 5 files`** + **`taking --ours for 1 derived files: keywords.json`** + rebuild・unhandled WARN なし）→ `git diff --name-only --diff-filter=U` 0 / 実マーカー `<<<<<<<`・`>>>>>>>` 0 件 → merge commit `2c7102b33`（pre-commit hook 全 pass: staged-task-dir-guard（MERGE_HEAD auto-skip）/ main-branch-guard / lefthook-edit-guard / block-test-suffix / block-stable-key-update）→ `pnpm typecheck` = 0（7 packages 全 Done）→ `pnpm lint` = 0（dep-cruiser 0 violations・verify-no-inline-style OK・stablekey OK）→ `pnpm indexes:rebuild` 冪等（5402 キーワード・drift 0）。CI コード修正なしで全緑。
- 参照: aiworkflow-requirements [[lessons-learned-dev-sync-merge-conflict-resolution-2026-05]] L-DEVSYNC-100（本 lesson の正本・同じく 099→100 採番替え）, SP-DEVSYNC-089（全 aiworkflow 配下 union 5・内訳の対照変種）, SP-DEVSYNC-085（union 5 に本スキル配下が混じる前変種）, SP-DEVSYNC-083（skill-index 限定 exit 0 完結の基準形）。

- 追補2（union 1 = 下限更新）: doc-only 回（merge `d7254598e`）直後の同ブランチ再 sync-merge は dev デルタ #1121（admin タグ inline 作成導線・apps コード + skill 同期）で content conflict **2 file**＝keywords.json（`--ours`）+ topic-map.md（union）のみ。`pnpm sync:resolve` は **`union-resolving 1 files`**（topic-map 単独＝union 件数の下限 1 を実測・L-DEVSYNC-096 の下限 3 を更新）+ keywords `--ours` + rebuild で exit 0。apps コードは feature と没交渉で Auto-merge（衝突 0）。SP-DEVSYNC-083/085 の「skill-index 衝突は dev デルタ×feature 編集集合の交差で決まる」に union N=1 の最小実データを追加。`--diff-filter=U` 0 / drift 0 / typecheck・lint exit 0 で全緑、merge `f360f4de0`（2026-06-05）。**同パターン再現: 2026-06-05 `docs/issue-1079-bulk-tag-audit-batch-filter-spec` ← dev 1 behind / 4 ahead, #1122 取込, merge `0935798b4` でも union 1（topic-map 単独 + keywords `--ours`）を再現。取込デルタに `01-api-schema.md` + `static-manifest.json` を含むが dev が manifest 同時再生成済で `pnpm verify:static-manifest` OK（SP-DEVSYNC-090 の drift は manifest 未再生成 land 限定、を裏取り）。本 sync で前回 sync（merge `2c7102b33`）追加の自分の SP-DEVSYNC-090（cross-skill SKILL.md）が dev 並行セッションの SP-DEVSYNC-090（static-manifest, merge `e423f0af0`）と union merge で同番号二重化 → SP-DEVSYNC-012/077 renumber 規則で自分の 090→091 へ採番替えで解消。union 1 再現は新番号を起こさず本追補へ merge hash 追記のみ。** aiworkflow-requirements [[lessons-learned-dev-sync-merge-conflict-resolution-2026-05]] L-DEVSYNC-097 追補2 と対。
## SP-DEVSYNC-089: union コア 4 file が「SKILL.md + map 3 全部」で task-workflow-active が Auto-merge 側へ転ぶ第 4 member 構成（keywords は `--ours`）

- 事象: `feat/issue-1077-bulk-tag-authenticated-staging-visual` を sub-worktree（`.worktrees/task-20260603-132054-wt-8`）から sync-merge。`git fetch --prune origin` 後ローカル dev = origin/dev 一致（`302e10679`・独自コミット 0・ff 不要）、feature は origin/dev に **5 behind / 2 ahead**。取込 5 コミット（#1121 会員ドロワー tag inline 作成 / #1120 shell-collapse-cookie 命名 SSOT / #1115 開催日追加 404 / #1114 collapse cookie Secure / #1109 会員詳細 status 404 耐性化）は本 feature（認証付き staging bulk tag picker visual baseline spec = apps/web playwright spec 追加）と没交渉で apps/** 衝突ゼロ。`git merge dev --no-edit` の content conflict は **5 file**＝`aiworkflow-requirements/SKILL.md` + `indexes/{keywords.json, quick-reference.md, resource-map.md, topic-map.md}`。`references/task-workflow-active.md` + `SKILL-changelog.md` + 両 `LOGS/_legacy.md` は全て Auto-merging（非衝突）。`pnpm sync:resolve` ログは **`union-resolving 4 files`**（SKILL.md + quick-reference + resource-map + topic-map・task-workflow-active を含まない）+ **`taking --ours for 1 derived files`（keywords.json）** + rebuild で `all skill / index conflicts resolved`・unhandled WARN なし exit 0、`git diff --diff-filter=U` 0 で手動解消なし収束。
- How to apply（仕様書 sync-merge 節での逐語化）:
  1. **union コアから抜けるのは map とは限らず task-workflow-active のこともある**: SP-DEVSYNC-084/085 と前回 SP-DEVSYNC-088 は task-workflow-active が union に入り map のいずれかが抜ける構成だったが、本件は逆に **task-workflow-active が Auto-merge 側へ転び map 3（quick-reference + resource-map + topic-map）が全て union に揃った**。union コア member は固定順序を持たず「SKILL.md ± task-workflow-active ± map{1..3} の任意部分集合」で 2〜5 file に振れる。Phase 11 見積りでは衝突 file 名を列挙固定せず「union コア 2〜5 + keywords 0/1」のレンジで出す。
  2. **keywords.json `--ours` 発火は union コア member 構成と無関係（SP-DEVSYNC-088-2 の再確認）**: 本件は union コア 4・keywords 衝突。union コアの大小・member 内訳と keywords 衝突有無は独立 2 変数。`taking --ours for 1 derived files` の有無を union member 構成から予断しない。
  3. **background task で回した resolver の成否は wrapper の 143 でなく 3 点で確定（SP-DEVSYNC-088-3 再現）**: ①task 完了通知 exit code 0、②出力末尾 `all skill / index conflicts resolved`、③`git diff --name-only --diff-filter=U` 0。前景 `sleep` wrapper の SIGTERM(143) は resolver 本体と無関係。
- 適用範囲外: apps/docs にコード本体 / rename が混在し resolver が exit 1 + WARN を出す回（SP-DEVSYNC-053/084 経路）。本件は skill-index 限定 exit 0 完結の基準形（SP-DEVSYNC-083）の union 中位ケース。
- 検証: `git fetch --prune origin`（dev=origin/dev 一致 `302e10679`・ff 不要・独自コミット 0）→ `git rev-list --count HEAD..origin/dev` = 5 / `origin/dev..HEAD` = 2 → `git merge dev --no-edit` CONFLICT 5（SKILL.md + keywords.json + quick-reference + resource-map + topic-map・task-workflow-active は Auto-merging）→ `pnpm sync:resolve` exit 0（**`union-resolving 4 files`** + **`taking --ours`（keywords.json）** + rebuild・`all skill / index conflicts resolved`・unhandled WARN なし）→ `git diff --diff-filter=U` 0 / 実マーカー 0（`=======` 装飾線 false-positive のみ・無視）→ merge commit `59a6bc0ad`（pre-commit hook 全 pass）→ `pnpm install`（新 package 持込なし・13.6s）→ `pnpm typecheck` = 0（contracts/shared/og/integrations/google/web/api 全 Done）→ `pnpm lint` = 0（dep-cruiser / stable-key / no-inline-style / 全 tsc 緑）。CI コード修正なしで全緑。
- 参照: aiworkflow-requirements [[lessons-learned-dev-sync-merge-conflict-resolution-2026-05]] L-DEVSYNC-097（本 lesson の正本）, L-DEVSYNC-096（union 2〜3 下端・keywords 独立軸）, SP-DEVSYNC-088（union 2 下端・本件の対）, SP-DEVSYNC-083（skill-index 限定 exit 0 完結の基準形）。

## SP-DEVSYNC-090: union コア 2 file（SKILL.md + topic-map）が別ブランチで再現 — union member は feature 非依存・dev 追記 index 依存

- 事象: `feat/issue-1077-bulk-tag-authenticated-staging-visual` の 2 回目 sync-merge。ローカル dev = origin/dev 一致（`a2c502623`・独自コミット 0・ff 不要）、feature は origin/dev に 1 behind / 4 ahead。取込 1 コミット（#1123 tag master code rename）は本 feature と没交渉。`git merge dev --no-edit` の content conflict は 3 file＝`aiworkflow-requirements/SKILL.md` + `indexes/{keywords.json, topic-map.md}`。残りは全 Auto-merging。`pnpm sync:resolve` は **`union-resolving 2 files`**（SKILL.md + topic-map）+ **`taking --ours`（keywords.json）** + rebuild で exit 0、`git diff --diff-filter=U` 0 で手動解消なし収束。
- How to apply（仕様書 sync-merge 節での逐語化）:
  1. **union コア member は「どの feature か」でなく「dev 側が今回どの index file を追記したか」で決まる**: 同一ブランチ前回（SP-DEVSYNC-089）は union 4（SKILL.md + map 3）だったが、今回 dev デルタが topic-map のみ追記に変わり union が 2 に縮退。さらに別ブランチ SP-DEVSYNC-088（feat/issue-1068）の union 2 と同一構成が本ブランチで再現した。Phase 11 見積りは feature 単位でなく dev デルタ単位で union レンジ（2〜5 + keywords 0/1）を出す。
  2. **background task で回した resolver / typecheck / lint の成否は出力ファイルでなく task 完了通知 exit 0 が正本**: 前景 `sleep` wrapper の SIGTERM(143)・出力ファイル空は本体成否と無関係。①task 完了通知 exit 0、②resolver は末尾 `all skill / index conflicts resolved`、③`git diff --diff-filter=U` 0 で確定（SP-DEVSYNC-088-3 再現）。出力空に見えたら同期再実行で exit 0 を再確認する。
- 検証: `git merge dev --no-edit` CONFLICT 3 → `pnpm sync:resolve` exit 0（`union-resolving 2 files` + `--ours`(keywords)）→ `git diff --diff-filter=U` 0 → merge commit `b43d4fed6`（pre-commit hook 全 pass）→ install なしで `pnpm typecheck` = 0 / `pnpm lint` = 0。CI コード修正なしで全緑。
- 参照: aiworkflow-requirements [[lessons-learned-dev-sync-merge-conflict-resolution-2026-05]] L-DEVSYNC-098（本 lesson の正本）, L-DEVSYNC-096（union 2 初観測）, SP-DEVSYNC-089（同一ブランチ前回・union 4）, SP-DEVSYNC-088（別ブランチ union 2 の対）。

## SP-DEVSYNC-091: 同一ブランチ 3 連続 sync-merge で union コアが 4→2→4 と交替 — member は dev デルタ依存・前回予断禁止

- 事象: `feat/issue-1077-bulk-tag-authenticated-staging-visual` の 3 回目 sync-merge。ローカル dev = origin/dev 一致（`c8919cd75`・独自コミット 0・ff 不要）、feature は 1 behind / 6 ahead。取込 1 コミット（#1132 member OG design token 整合・apps/og）は本 feature と没交渉。`git merge dev --no-edit` の content conflict は 5 file＝`aiworkflow-requirements/SKILL.md` + `indexes/{keywords.json, quick-reference.md, resource-map.md, topic-map.md}`。残り（task-workflow-active / lessons-learned/* / SKILL-changelog / LOGS）は全 Auto-merging。`pnpm sync:resolve` は **`union-resolving 4 files`**（SKILL.md + map 3）+ **`taking --ours`（keywords.json）** + rebuild で exit 0、`git diff --diff-filter=U` 0 で手動解消なし収束。
- How to apply（仕様書 sync-merge 節での逐語化）:
  1. **同一ブランチでも union コアは毎回変動 — 4→2→4 の交替を実測**: 本ブランチ 3 連続が union 4（SP-DEVSYNC-089）→ 2（SP-DEVSYNC-090）→ 4（本件）と交替。feature 編集集合が不変でも各 dev コミットが触る index file が変われば union member も変わる。「同一ブランチだから前回と同じ」と予断せず、毎回 resolver の `union-resolving N files` 実数で確認する。
  2. **前回追記した lesson file は次回 sync の衝突源にならない**: 前 2 回で本 lesson file に追記したが本回は Auto-merging。`.gitattributes merge=union` 登録対象（lessons-learned/*）は連続追記しても自動結合され、ナレッジ追記が次回の手解消コストを増やさない。
- 検証: `git merge dev --no-edit` CONFLICT 5 → `pnpm sync:resolve` exit 0（`union-resolving 4 files` + `--ours`(keywords)）→ `git diff --diff-filter=U` 0 → merge commit `e3cd7a371`（pre-commit hook 全 pass）→ install なしで `pnpm typecheck` = 0 / `pnpm lint` = 0。CI コード修正なしで全緑。
- 参照: aiworkflow-requirements [[lessons-learned-dev-sync-merge-conflict-resolution-2026-05]] L-DEVSYNC-099（本 lesson の正本）, SP-DEVSYNC-089（1 回目 union 4）, SP-DEVSYNC-090（2 回目 union 2）。

- 追補2（union 1 = 下限更新）: doc-only 回（merge `d7254598e`）直後の同ブランチ再 sync-merge は dev デルタ #1121（admin タグ inline 作成導線・apps コード + skill 同期）で content conflict **2 file**＝keywords.json（`--ours`）+ topic-map.md（union）のみ。`pnpm sync:resolve` は **`union-resolving 1 files`**（topic-map 単独＝union 件数の下限 1 を実測・L-DEVSYNC-096 の下限 3 を更新）+ keywords `--ours` + rebuild で exit 0。apps コードは feature と没交渉で Auto-merge（衝突 0）。SP-DEVSYNC-083/085 の「skill-index 衝突は dev デルタ×feature 編集集合の交差で決まる」に union N=1 の最小実データを追加。`--diff-filter=U` 0 / drift 0 / typecheck・lint exit 0 で全緑、merge `f360f4de0`（2026-06-05）。aiworkflow-requirements [[lessons-learned-dev-sync-merge-conflict-resolution-2026-05]] L-DEVSYNC-097 追補2 と対。


### SP-DEVSYNC-089: **同一 tag master CRUD surface への両側追加（dev #1123 code rename / feature #1070 reactivate+physical delete）の apps コード衝突は全て additive — union-of-both で解消し 1 点（immutable→rename 可）だけ dev 優先** — `pnpm sync:resolve` は skill-index を畳むが apps 3 + docs 1 を `WARN unhandled` で残す。残りは (1) ERROR enum（`tag_has_references` + `tag_stale_conflict` 両方残す）(2) audit action union（reactivated/physically_deleted + code_renamed を 1 union 統合）(3) test helper（`latestAudit` + `auditPayload` 両方残す）(4) doc 本文（code immutable を破棄し rename 可 + reactivate/physical delete を合成）で機械解消。route handler 本体は別 hunk で git auto-merge 済。手解消後 `pnpm typecheck`（全 package Done）+ api 全 suite（82 files / 534 tests passed）+ `pnpm lint`（exit 0）で意味的整合を確認してから merge commit `747c6af82`（2026-06-05 feat/issue-1070-tag-reactivate-physical-delete ← dev 1 behind）。**教訓: 同 issue 系列（#1035 tag master）の followup が並列 worktree で別々に landed すると同一ファイルで必ず衝突するが、各々が機能を足す方向なので additive union に収束する。例外は旧 invariant を新仕様が緩める 1 点のみで、そこだけ dev 優先の意味判断が要る。残存判定は `git diff --diff-filter=U` 0 + 実マーカー grep 0、`=======` 装飾線は false-positive。** aiworkflow-requirements [[lessons-learned-dev-sync-merge-conflict-resolution-2026-05]] L-DEVSYNC-098（本 lesson の正本・98-A/B/C 詳細）, SP-DEVSYNC-053（apps unhandled WARN の手解消経路）, SP-DEVSYNC-085（skill 横断 union member）を参照。

### SP-DEVSYNC-090: **sync-merge の skill-index 衝突を `pnpm sync:resolve` で exit 0 完結させても、取込デルタが `01-api-schema.md`（tag CRUD spec）を含むと CI `verify:static-manifest` が `sourceSpecHashDrift` で fail-closed する別系統 CI 失敗が残る — 解消は `pnpm regenerate:static-manifest`（生成物再生成）で「sync:resolve exit 0 = CI 全緑」の短絡が崩れる初記録** — `apps/api/src/repository/_shared/generated/static-manifest.json` の `sourceSpecHash` は spec markdown の canonical hash を凍結した生成物で、spec を変えた feature/dev が manifest 未再生成で land すると drift が累積する。skill-index 衝突（resolver で機械解消）と spec-derived 生成物 drift（regenerate で再生成）は別レイヤーの故障で、`git merge` も `sync:resolve` も後者を検知しない。CI 側 `ci` job の `Verify static manifest (UT-02A-FU-DIAG-001)` ステップが exit 1 → 下流 `coverage-gate-shard` が `skipped` → `coverage-gate` が `Fail closed on failed shard` で連鎖 fail という二段崩れになる（2026-06-05 feat/issue-1070-tag-reactivate-physical-delete ← dev 1 behind / 10 ahead, #1132（issue-1076 member OG design token 整合）取込, merge `e423f0af0`）
- 事象: ローカル dev = origin/dev 一致（独自コミット 0 / ff 不要）、feature は dev に 1 behind / 10 ahead。`git merge dev --no-edit` content conflict 3 file = keywords.json（`--ours`）+ resource-map.md（union）+ topic-map.md（union）。SKILL.md / quick-reference / task-workflow-active / SKILL-changelog / lessons は Auto-merging。`pnpm sync:resolve` exit 0（**`union-resolving 2 files`**＝resource-map + topic-map / **`taking --ours for 1 derived files: keywords.json`** / rebuild / `all skill / index conflicts resolved`・unhandled WARN なし）で skill-index 衝突は手解消なし収束。**だが PR は merge 前から CI `ci` job が `Verify static manifest` exit 1（reason=sourceSpecHashDrift）で fail**しており、skill-index 解消だけでは全緑にならなかった。
  - **SP-DEVSYNC-090-A (union 2 の member 構成に (resource-map + topic-map) という SKILL.md なしの別解)**: SP-DEVSYNC-086 の union 2 は (SKILL.md + topic-map)、本件は (resource-map + topic-map)。同じ union 2 でも member 集合は別で、SKILL.md が Auto-merge 側へ転んで resource-map が衝突側に来る。件数だけでなく内訳も予測子にしない（L-DEVSYNC-097-A の独立 3 変数に union 2 第 2 構成を追加）。
  - **SP-DEVSYNC-090-B (skill-index 解消後の CI 失敗は failed step 名で切り分け → `verify:static-manifest` 再現 → `regenerate:static-manifest`)**: sync-merge 後の CI 失敗を skill-index drift に短絡せず `gh run view --job <id>` の failed step / annotation で一次故障を特定する。本件 failed step = `Verify static manifest (UT-02A-FU-DIAG-001)`。ローカル `pnpm verify:static-manifest` で `FAIL reason=sourceSpecHashDrift`（expected/actual sha256 出力）を再現し、`pnpm regenerate:static-manifest` で `sourceSpecVersion`（`9f7a29925`→`747c6af82`）・`sourceSpecHash`（`c159cf32…`→`1409a1ab…`）が最新 spec に追従し re-verify OK。生成物再生成は merge commit に含める。
  - **SP-DEVSYNC-090-C (`coverage-gate` FAILURE は二次故障 — `needs:` 依存を辿り一次故障 `ci` job を直す)**: `coverage-gate` の `Fail closed on failed shard` / `coverage artifacts unavailable; aborting before aggregate (MISSING)` は上流 `ci` job 失敗で `coverage-gate-shard` matrix が `skipped` になった連鎖。coverage 閾値の問題ではないので coverage を触らず `ci` の failed step を直せば再 push で解ける。
- Why: tag master CRUD（#1035 系列）の followup が並列 worktree で `01-api-schema.md` を編集し続け、各々 manifest 未再生成で dev に積むと取込 feature 側で hash drift が顕在化する。「sync:resolve が exit 0 = CI 全緑」と短絡せず、取込デルタに `01-api-schema.md` が含まれたら `verify:static-manifest` を必ず確認する。
- 検証: `git merge dev --no-edit` CONFLICT 3 → `pnpm sync:resolve` exit 0（union-resolving 2 + `--ours` 1 + rebuild）→ `--diff-filter=U` 0 / 実マーカー 0（`=======` 装飾線 false-positive は ut-08 `manual-smoke-log.md` で再現）→ **`pnpm verify:static-manifest` FAIL → `pnpm regenerate:static-manifest` → re-verify OK** → merge commit `e423f0af0`（pre-commit hook 全 pass）→ `pnpm typecheck` = 0（全 package Done）→ `pnpm lint` = 0 → `pnpm indexes:rebuild` 冪等（drift 0）。**従来の「CI コード修正なしで全緑」は崩れ、生成物再生成 1 手を要した初ケース。** aiworkflow-requirements [[lessons-learned-dev-sync-merge-conflict-resolution-2026-05]] L-DEVSYNC-099（本 lesson の正本・99-A/B/C 詳細）, SP-DEVSYNC-086（union 2＝SKILL.md + topic-map の member 別構成）, SP-DEVSYNC-089（同ブランチ apps additive 衝突の前回）を参照。

## SP-DEVSYNC-092: union コア 2 file が resource-map + topic-map のみ（SKILL.md すら Auto-merge）— 固定 union anchor は存在しない

- 事象: `feat/issue-1077-bulk-tag-authenticated-staging-visual` の 4 回目 sync-merge。ローカル dev = origin/dev 一致（`5dcf934c5`・独自コミット 0・ff 不要）、feature は 1 behind / 8 ahead。取込 1 コミット（#1122 tag reactivate + physical delete エンドポイント・apps/api）は本 feature と没交渉。`git merge dev --no-edit` の content conflict は 3 file＝`indexes/{keywords.json, resource-map.md, topic-map.md}`。SKILL.md + quick-reference + task-workflow-active + lessons-learned/* + SKILL-changelog + LOGS は全 Auto-merging。`pnpm sync:resolve` は **`union-resolving 2 files`**（resource-map + topic-map）+ **`taking --ours`（keywords.json）** + rebuild で exit 0、`git diff --diff-filter=U` 0 で手動解消なし収束。
- How to apply（仕様書 sync-merge 節での逐語化）:
  1. **union member に固定 anchor は存在しない — SKILL.md も Auto-merge 側へ転ぶ**: SP-DEVSYNC-088〜091 は union に SKILL.md か task-workflow-active が必ず含まれたが、本件は両方とも Auto-merge 側に転び union コアが index map 2 file（resource-map + topic-map）のみに縮退。特定 file の衝突を前提化せず毎回 `git diff --diff-filter=U` 実集合で確認する。
  2. **同じ union 2 でも member 内訳は dev コミット次第**: 本ブランチ 4 連続で union 4→2(SKILL.md+topic-map)→4→2(resource-map+topic-map) と推移。「union 2」が再現しても member が同じとは限らない。各 dev コミットが触る index file だけが member を決める。
- 検証: `git merge dev --no-edit` CONFLICT 3 → `pnpm sync:resolve` exit 0（`union-resolving 2 files` + `--ours`(keywords)）→ `git diff --diff-filter=U` 0 → merge commit `dd31b8a58`（pre-commit hook 全 pass）→ install なしで `pnpm typecheck` = 0 / `pnpm lint` = 0。CI コード修正なしで全緑。
- 参照: aiworkflow-requirements [[lessons-learned-dev-sync-merge-conflict-resolution-2026-05]] L-DEVSYNC-100（本 lesson の正本）, SP-DEVSYNC-091（3 回目 union 4→2→4 交替）, SP-DEVSYNC-090（union 2:SKILL.md+topic-map）。
