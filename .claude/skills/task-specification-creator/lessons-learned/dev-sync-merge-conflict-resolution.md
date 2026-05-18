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

### SP-DEVSYNC-017: 共通の正本リンク
- 詳細は [[lessons-learned-dev-sync-merge-conflict-resolution-2026-05]] （aiworkflow-requirements 配下、L-DEVSYNC-001..017）を参照。
