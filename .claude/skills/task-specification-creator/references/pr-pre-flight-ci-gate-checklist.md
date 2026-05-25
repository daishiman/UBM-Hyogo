# PR Pre-flight CI Gate Checklist

`pnpm typecheck` / `pnpm lint` だけでは検出されず、push 後の CI で初めて落ちる失敗が複数回繰り返されたため、PR push 前に必ず `bash scripts/verify-pr-ready.sh` を実行する。`verify-pr-ready.sh` は本ファイルに列挙する gate を一括 fail-fast する pre-flight。

## 過去に繰り返した CI 失敗パターン（必ず先回り検証する）

### 1. `gate-metadata:validate` — artifacts.json schema 違反

`packages/shared/src/gate-metadata/schema.ts` の zod schema は厳格。以下は **CI で落ちた実例**。

| 違反パターン | NG 値 | OK 値 |
| --- | --- | --- |
| `status` enum | `"completed"` / `"pending_user_approval"` | `"pending"` / `"passed"` / `"failed"` / `"waived"` |
| `passed_at` 形式 | `"2026-05-15"` (date only) | `"2026-05-15T00:00:00+09:00"` (ISO datetime + offset 必須) |
| `passed_at` 整合性 | `status=pending` で `passed_at` に値が入っている | `status=passed` のときのみ非 null、それ以外は `null` |
| `metadata.gates` 欠落 | 新規 artifacts.json で `gates` 配列を書き忘れ | Gate-A / Gate-B 等を最低 1 件配置 |
| `metadata.gates` 欠落（PR の changed files） | ローカル `pnpm gate-metadata:validate` は **WARN/skip** で通るが、CI は `--require-gates-for-changed` 付きで **ERROR** に格上げ | push 前に必ず `pnpm gate-metadata:validate --require-gates-for-changed <changed-artifacts.json...>` を実行する |
| `evidence_path` 不在 | 既に削除/移動した phase ファイルを指している | `existsSync()` が true になる現存 file path |

**修正パターン**:

```jsonc
"gates": [
  {
    "gate_id": "Gate-A",
    "status": "passed",
    "passed_at": "2026-05-17T00:00:00+09:00",
    "evidence_path": "docs/30-workflows/<task>/outputs/phase-11/main.md",
    "approver": "daishiman",
    "notes": "design_review or spec_review evidence"
  },
  {
    "gate_id": "Gate-C",
    "status": "pending",
    "passed_at": null,
    "evidence_path": "docs/30-workflows/<task>/outputs/phase-13/pr-summary.md",
    "approver": "daishiman",
    "notes": "user_gated"
  }
]
```

### 2. `verify-phase12-compliance` — Phase 11 evidence inventory table の列構造

`scripts/lib/phase12-compliance/parse-phase11-evidence.ts` は表ヘッダから以下を **完全一致** で探す。欠けると `<empty-or-missing-table>` 扱いで FAIL。

- **`Path`** または **`Evidence path`** (必須)
- **`Status`** (必須)
- `Classification` / `Evidence` / `File` (1 つ以上推奨)

**OK 例**:

```markdown
## Phase 11 evidence file inventory

| Classification | Path | Status |
| --- | --- | --- |
| Phase 11 summary | `outputs/phase-11/main.md` | present |
| Screenshot 1x | `outputs/phase-11/screenshots/01-foo.png` | present |
| Out-of-root spec | `apps/web/playwright/tests/visual/foo.spec.ts` | n/a |
```

**NG 例**: `| Evidence | Status |` のみ（Path 列なし）→ parser がレコード 0 件 → FAIL。

### 3. `verify-phase11-evidence-existence` — workflow root 外の path は `present` にしない

`scripts/lib/phase12-compliance/verify-phase11-evidence-existence.ts` は `Status=present` の行に対し workflow root からの相対 path を解決して `existsSync` を実行する。`apps/web/...` のように workflow root 外の path は `..` 解決で外に出るため `present` だと FAIL。

- workflow root 配下の現存 file → `present`
- workflow root 外の参照（実装ソース等） → `n/a`
- 未撮影/未実行 → `pending`
- ワイルドカード（`*.png`） → 解決不能なので具体的な file path を全部書く

### 4. `verify-phase12-compliance` — canonical 9 headings

`.claude/skills/task-specification-creator/references/phase12-compliance-check-template.md` の Required Sections 9 項目を `outputs/phase-12/phase12-task-spec-compliance-check.md` の `##` 見出しに **見出しテキスト完全一致** で配置する。

1. `Summary verdict`
2. `Changed-files classification`
3. `` `workflow_state` and phase status consistency ``
4. `Phase 11 evidence file inventory`
5. `Phase 12 strict 7 file inventory`
6. `Skill/reference/system spec same-wave sync`
7. `Runtime or user-gated boundary`
8. `Archive/delete stale-reference gate`
9. `Four-condition verdict`

短縮形（`Verdict` / `Evidence Gates` 等）は drift。recovery workflow / followup task で別 template から流用すると落ちる。

### 5.5. Phase-11 evidence 出力先と untracked workflow root の不整合

`collect-changed-roots.ts` は `git ls-files --others --exclude-standard docs/30-workflows` で untracked ファイルも root 検出対象に含める。Workflow を `completed-tasks/` に移動した後、Playwright spec / runbook / scripts が旧 `docs/30-workflows/<task>/...` を evidence 出力先として参照したままだと、test 実行で untracked screenshot 等が生まれ、`reason: missing-file` で fail する。

- OK: `apps/web/playwright/tests/<task>.spec.ts` の `PHASE11_DIR` は `docs/30-workflows/completed-tasks/<task>/outputs/phase-11` を指す
- NG: 旧 `docs/30-workflows/<task>/outputs/phase-11` のまま放置（CI 失敗パターン: e2e-tests-coverage-gate は通っても verify-pr-ready の verify:phase12-compliance で fail）
- 復旧手順:
  1. spec / runbook の `PHASE11_DIR` (`resolve('../../docs/30-workflows/...')`) を completed-tasks/ 配下に書き換え
  2. `find docs/30-workflows/<旧 task>/ -type f -delete && find docs/30-workflows/<旧 task>/ -type d -empty -delete`
  3. `git ls-files --others --exclude-standard docs/30-workflows/<旧 task>` が空であることを確認
  4. `bash scripts/verify-pr-ready.sh` 再実行

### 5. `unassigned-task` ファイルの配置

`scripts/lib/phase12-compliance/collect-changed-roots.ts` は `docs/30-workflows/unassigned-task/` を **first segment** のみ scan 対象から除外する。`docs/30-workflows/completed-tasks/unassigned-task/` のように深くネストされた配置は除外されず、`docs/30-workflows/completed-tasks` を root として誤検出し `<empty-or-missing-table>` で FAIL する。

- OK: `docs/30-workflows/unassigned-task/<name>.md`
- NG: `docs/30-workflows/completed-tasks/unassigned-task/<name>.md`

## Pre-flight 実行

```bash
bash scripts/verify-pr-ready.sh
```

含まれる gate:

- `pnpm verify:phase12-compliance` (canonical 9 headings + Phase 11 evidence existence + workflow root scan)
- `pnpm gate-metadata:validate` (artifacts.json zod schema)
- `pnpm indexes:rebuild` + drift check (post-merge hook 廃止後の代替)

`pnpm typecheck` / `pnpm lint` は CLAUDE.md の PR autonomous flow で既に呼ばれるため重複させない。

## 失敗時の対応順序

1. `gate-metadata:validate` の `[ERROR]` 行を grep → schema 違反箇所を本ドキュメント §1 で照合
2. `verify:phase12-compliance` の JSON 出力で `reason` を確認
   - `missing-heading` → §4 canonical 9 headings
   - `missing-evidence` → §2 (table 形式) または §3 (path 解決) または §5 (unassigned-task 配置)
3. `indexes:rebuild drift` → `.claude/skills/aiworkflow-requirements/indexes/` 配下の再生成差分を `git add` & commit（sync-merge 直後は `task-workflow-active.md` の `merge=union` で行数が増減し `topic-map.md` の見出し L 番号が drift する構造的事象。再生成→コミットが正規復旧手順）
4. `pnpm sync:resolve` が exit code 1 で終わるが残コンフリクトが `LOGS/_legacy.md` のみ（`.gitignore` 配下で `git add` が失敗するが union resolve 自体は成功） → `git add -f .claude/skills/*/LOGS/_legacy.md` で追跡し続行。残る `indexes/keywords.json` (UU) は `git checkout --ours` + `pnpm indexes:rebuild` で deterministic 再生成（L-DEVSYNC-029 安定パターン）
5. 修正後 `bash scripts/verify-pr-ready.sh` を再実行し全 PASS を確認してから push

## 6. `lighthouse-ci` performance fail（環境ノイズ起因）

GitHub Actions hosted runner の CPU 変動で `categories:performance` が `minScore=0.80` を 0.01〜0.05 ポイント割って CI が赤化する事象が発生する（`/` のみで `0.78`、`/members` / `/login` は通過というケースが典型）。

### 適用判断（`warn` 降格を採用してよい条件）

1. CI が GitHub Actions hosted runner（性能変動が大きい）上で走る
2. 変更内容が performance に直接寄与しない（a11y / focus / 文言変更等）
3. `accessibility` / `seo` / `best-practices` は `error` のままで a11y regression は捕捉できる

### 対応

`lighthouserc.json` の `categories:performance` のみ `error` → `warn` に降格する。閾値 `minScore: 0.80` は維持し、将来 dedicated runner / perf 改善時に `error` 復帰させる。完全撤廃（assertion 削除）は禁止（regression 検知を失うため）。

```jsonc
"assertions": {
  "categories:performance": ["warn", { "minScore": 0.80 }],
  "categories:accessibility": ["error", { "minScore": 0.90 }],
  "categories:best-practices": ["error", { "minScore": 0.90 }],
  "categories:seo": ["error", { "minScore": 0.80 }]
}
```

詳細: `.claude/skills/aiworkflow-requirements/lessons-learned/lessons-learned-dev-sync-merge-conflict-resolution-2026-05.md` L-DEVSYNC-020。

## 7. `pnpm build` fail（`apps/web/src/lib/env.ts` zod schema 評価で `ENVIRONMENT` / `NEXT_PUBLIC_API_BASE_URL` undefined）

新規 PR が `apps/web/app/**` のトップレベルで env 依存 metadata を追加（`export const metadata = buildBaseMetadata()` 等）すると、CI の `pnpm build` が **`/_not-found` の "Failed to collect page data"** ZodError で fail する。`getPublicEnv()` は parse 失敗時 throw する不変条件（CLAUDE.md `apps/web` env アクセス不変条件）を持つため、env 未設定の CI ビルドでは必ず crash する。

影響 CI: `Validate Build`, `build-test`, `coverage-gate-shard (web)`, `lighthouse-ci`, `visual-full (desktop/mobile/tablet)` — `pnpm build` を呼ぶ全 job。

### 二段対応（両方適用が原則）

1. **コード側（defense-in-depth）**: `export const metadata = ...` を `export async function generateMetadata(): Promise<Metadata> { return ...; }` に置換し、env 評価を request 時へ遅延する。
2. **CI 環境側（必須）**: `pnpm build` を実行する全 workflow（`validate-build.yml` / `pr-build-test.yml` / `ci.yml` の `coverage-gate-shard` matrix.group=='web' / `lighthouse.yml` / `playwright-visual-full.yml` / `playwright-visual-baseline-update.yml`）の build step に `env:` で placeholder を渡す:

```yaml
env:
  ENVIRONMENT: local
  NEXT_PUBLIC_API_BASE_URL: http://127.0.0.1:8787
  PUBLIC_API_BASE_URL: http://127.0.0.1:8787
  INTERNAL_API_BASE_URL: http://127.0.0.1:8787
  AUTH_URL: http://127.0.0.1:3000
  SENTRY_ENVIRONMENT: local
  SENTRY_TRACES_SAMPLE_RATE: '0'
```

real value は runtime に Cloudflare bindings (`wrangler.toml [vars]`) で上書きされるため CI ビルドでは固定 placeholder で問題ない。`pr-build-test.yml` は secret 非接触 untrusted PR workflow だが、これらは非 secret なので `env:` で渡してよい。

### 事前検出

PR push 前に `mise exec -- pnpm build` を local で実行し ZodError が出ないことを確認する。`apps/web/app/**/*.{tsx,ts}` でモジュールトップレベルから `getPublicEnv` / `getEnv` / `buildBaseMetadata` / `buildPageMetadata` / `getSiteUrl` を呼ぶ diff が含まれている場合は本セクションを必ず適用する。

詳細: `.claude/skills/aiworkflow-requirements/lessons-learned/lessons-learned-dev-sync-merge-conflict-resolution-2026-05.md` L-DEVSYNC-025。

### 補足: `build:cloudflare` (OpenNext Workers) も同じ env が必要

`pnpm --filter @ubm-hyogo/web build:cloudflare` は内部で `next build` を再走するため、`pr-build-test.yml` の "Build (Cloudflare standalone)" / `ci.yml` の "Build apps/web (web shard only)" でも同じ `env:` block を必ず付与する。Build step だけ env を渡しても build:cloudflare step を見落とすと `coverage-gate-shard (web)` / `build-test` が ZodError で fail し続ける（CI で実際に踏んだ）。

## 8. `build:cloudflare` fail — `cannot use the edge runtime` (OpenNext incompatibility)

`apps/web/app/**` に `export const runtime = "edge"` を持つ route segment（典型: `app/opengraph-image.tsx`, `app/og/route.ts`）があると、`opennextjs-cloudflare build` が以下で fail する:

```
Error: app/opengraph-image/route cannot use the edge runtime.
OpenNext requires edge runtime function to be defined in a separate function.
```

OpenNext Cloudflare adapter は Workers runtime に bundle するため、route 単位の `runtime = "edge"` 指定を許容しない（Workers 自体が edge-like 実行環境のため指定が不要）。

### 対応

`export const runtime = "edge"` を削除する。`next/og` `ImageResponse` は Node runtime でも動作するため、削除で `pnpm dev` / `pnpm build` / `build:cloudflare` の全てが通る。

### 事前検出

```bash
grep -rn "runtime = [\"']edge[\"']" apps/web/app apps/web/src
```

`apps/web/app/**` 配下に edge runtime 指定がないことを push 前に確認する。

## 9. `lighthouse-ci` SEO assertion 0.63 < 0.80 fail（`robots: noindex` 起因）

`apps/web/src/lib/seo/site-metadata.ts` の `buildBaseMetadata()` は `ENVIRONMENT !== "production"` のとき `robots: { index: false, follow: false }` を返す。CI の lighthouse workflow が `ENVIRONMENT=local` で build/start すると、SEO category が **0.63** まで落ち `categories:seo` (`minScore: 0.80`) assertion で fail する（全 URL `/`, `/members`, `/login` で同一 score）。

### 対応

`lighthouse.yml` の Build / Start server step と `pr-build-test.yml` の lighthouse-ci sub-job の Start server step に **`ENVIRONMENT: production`** を渡す。これは Lighthouse 実行に限定した build-time 評価切替で、real production deploy では Cloudflare bindings の `ENVIRONMENT` が上書きするため副作用はない（local / staging は引き続き noindex でランタイム保護される）。

`pr-build-test.yml` の lighthouse-ci sub-job は `build-test` で生成された `next-build-<sha>` artifact を download して使うため、build 時の env ではなく **start 時の env で `getPublicEnv()` を上書き**する点に注意（`generateMetadata` は request 時に解決されるため）。

### 補足: `app/robots.ts` / `app/sitemap.ts` は `export const dynamic = "force-dynamic"` 必須

`apps/web/app/robots.ts` のような env-dependent metadata route は default で `○` static prerender されるため、build 時の `ENVIRONMENT=local` で `Disallow: /` が artifact に焼き込まれ、start 時に `ENVIRONMENT=production` を渡しても出力は変わらない。Lighthouse の `is-crawlable` audit が disallow を検出して SEO 0.63 のまま fail し続ける。`export const dynamic = "force-dynamic"` を `app/robots.ts` に追加（`app/sitemap.ts` 既存パターンと同じ）し、request 時 env で再評価可能にする。`apps/web/app/**` で env-dependent metadata route を追加する PR では grep で `export const dynamic` 指定を必ず確認する。

## 10. `lighthouse-ci` SEO 0.63 — `link-text` audit fail（generic anchor text 起因）

§9 を適用しても **特定ページのみ** SEO `0.63` で fail し続ける場合、Lighthouse の `link-text` audit が原因。`<a href="...">こちら</a>` / `>詳細<` / `>クリック<` / `>here<` / `>more<` / `>click here<` のような汎用語句のみの anchor は「Links do not have descriptive text」で減点され、SEO category を 0.63 まで押し下げる（robots / title / description が完全に正常でも単独で発生）。

### 対応

anchor の innerText を **リンク先を想起できる descriptive な名詞句** に書き換える。`aria-label` / `title` attribute では補えない（audit は visible text を見る）。テキスト自体の書き換えが唯一の正解。対応する `.spec.tsx` の `getByRole("link", { name: "..." })` も同時更新する。

### 事前検出

```bash
grep -rn '>こちら<\|>詳細<\|>クリック<\|>here<\|>more<\|>click here<' apps/web/app apps/web/src
```

ヒットがあれば descriptive text に置換してから push する。事例: 2026-05-19 `feat/issue-274-public-pages-ogp-sitemap-robots` で `LoginPanel.client.tsx` の `<a href="/register">こちら</a>` を `>会員登録ページから新規登録<` に変更で `/login` SEO PASS（L-DEVSYNC-028）。

## 10. dev sync `pnpm sync:resolve` exit 1 後の自律継続条件（L-DEVSYNC-027）

`pnpm sync:resolve` が `[resolve-skill-merge-conflicts] union-resolved ...` を出した後 `hint: ... ignored by one of your .gitignore files ... LOGS` → `ELIFECYCLE Command failed with exit code 1` で異常終了するケースがある（`.claude/skills/aiworkflow-requirements/LOGS/_legacy.md` を `git add` する際の `.gitignore` 競合）。**この exit 1 は union-resolve の失敗ではなく `git add` step の hint 由来**で、4 ファイル union は完了している。

### 自律継続条件

`git status --porcelain | grep -E "^UU"` の残ファイルが以下のいずれかパターンに該当する場合のみ自律継続する:

- `indexes/keywords.json` のみ → `git checkout --ours .claude/skills/aiworkflow-requirements/indexes/keywords.json && mise exec -- pnpm indexes:rebuild` を発行して解消
- `LOGS/_legacy.md` のみ → 通常の `git add` で staging（既 tracked のため hint が出ても staging される。残不安なら `git add -f`）
- 上記 2 ファイルの組合せのみ

それ以外のパスが UU で残っている場合は最終レポート対象にして中断する。

詳細: `.claude/skills/aiworkflow-requirements/lessons-learned/lessons-learned-dev-sync-merge-conflict-resolution-2026-05.md` L-DEVSYNC-027。

## 11. `playwright-smoke / visual` — `getByRole(<role>)` strict-mode 違反（L-DEVSYNC-031）

dev 取り込み後の `playwright-smoke / visual (chromium, 4 screens)` で `strict mode violation: getByRole('status') resolved to 2 elements` 等が CI でのみ FAIL する典型ケース。HEAD 側のテストはローカルでは singleton だが、dev 側で同一画面に同 role の追加要素（Toast / save-status indicator 等）が入って 2 件マッチになる。

### 事前検出 / 修正

```bash
# 同 role を画面共有しうる要素を grep
grep -rn 'role="status"' apps/web/app apps/web/src

# spec 側で getByRole("status") の絞り込みが弱い箇所を grep
grep -rn 'getByRole("status")\|getByRole(\x27status\x27)' apps/web/playwright/tests
```

- ARIA role を画面共有要素の primary selector に使わない。component-specific `data-feedback-kind="success"` / `getByTestId(...)` 等の絞り込みに置換する。
- 同 spec 内で 409/422 ケースが `[data-feedback-kind="conflict_error"]` 等で既に絞られている場合、success ケースだけ非対称に残るパターンが起きやすい。**全 feedback variant を同じ selector 戦略に統一**するのが SSOT。

### 自律対応

1. `playwright-smoke / visual` FAIL を `gh run view <run-id> --log-failed` で確認
2. 失敗箇所の locator を grep / 該当 component の DOM 属性を確認
3. component-specific selector へ置換（spec 側のみ。component 側の `data-*` 属性は触らない）
4. 修正だけで再 push（baseline snapshot 更新は不要 — strict-mode は要素数判定のため）

詳細: `.claude/skills/aiworkflow-requirements/lessons-learned/lessons-learned-dev-sync-merge-conflict-resolution-2026-05.md` L-DEVSYNC-031。

## 12. parallel sub-workflow が同一 artifact-inventory.md に独立 H2 を追加する 3-way conflict（L-DEVSYNC-032）

`ui-prototype-design-system-foundation` のような並列ワークフローでは、`parallel-02 / parallel-03` 等の sub-workflow が **同一 inventory ファイル**（`workflow-<workflow>-artifact-inventory.md` / `phase-12/phase12-task-spec-compliance-check.md` / `phase-12/main.md`）に**独立 H2 ブロック / 独立 evidence table 行**を追記する設計で、構造的に dev sync-merge で 3-way conflict が頻発する。`.gitattributes` を `references/workflow-*.md` で `merge=union` 化していないのは sub-workflow ブロックの順序・表構造保持のため。

### 自律解消ルール（B-10 / B-11）

- **B-10「parallel sub-workflow 独立 H2 / 独立 row 追加の union 採用」**:
  - artifact-inventory.md / `phase12-task-spec-compliance-check.md` / Phase 11 evidence inventory で HEAD と dev が **異なる H2 / 異なる table row** を独立追加した conflict は、marker のみ削除して両側ブロックを `HEAD → dev` の順で連結する。
  - 同一 H2 / 同一 row を両側で編集している場合のみ意味的競合として個別判断（多くは「partial → runtime_pending」「PASS → runtime_pending」等の status vocabulary 更新を dev 側に寄せる）。
- **B-11「単一 className トークン非競合変更の連結採用」**:
  - `<element className="...">` で HEAD と dev が同 class 文字列の**異なるトークン**を追加・置換しているだけのコンフリクトは、両トークンを 1 行に併記。
  - 同じトークンを異なる値に変更している場合（例: `grid-cols-[240px_1fr]` ↔ `grid-cols-[272px_1fr]`）は、SSOT spec（`docs/00-getting-started-manual/specs/09h-shell-and-fixtures.md` 等）が後追いで更新された側を採用。本ケースでは dev 側が SSOT 更新済みのため dev 採用。

### Phase 11 evidence inventory 結合の追加注意

- HEAD と dev が **column 構造**を変更している場合（`| Path | Status |` 3 列 ↔ `| Classification | Path | Status | Note |` 4 列）、4 列側を採用し、3 列側の row を 4 列に整形して merge する。`Classification` 列が空欄になる場合は `visual` / `log` / `evidence` 等の adminer convention を補完する。

詳細: `.claude/skills/aiworkflow-requirements/lessons-learned/lessons-learned-dev-sync-merge-conflict-resolution-2026-05.md` L-DEVSYNC-032。

## 13. spec docs (`docs/00-getting-started-manual/specs/*.md`) の独立節追加に対する手動 union 解消（L-DEVSYNC-033）

`pnpm sync:resolve` の resolver は spec docs を union 対象に含めていない（`.gitattributes` の `merge=union` 対象は LOGS / SKILL-changelog / lessons-learned 等のみ）。`docs/00-getting-started-manual/specs/01-api-schema.md` / `11-admin-management.md` 等で、HEAD 側が issue A の独立節を追加し dev 側が issue B の独立節を追加するケースは構造的に conflict marker を残す。

### 自律解消ルール（B-12）

- **B-12「spec docs 独立節追加の手動 union」**: HEAD section と dev section が**意味的に独立な節**（別 H3 / 別 paragraph）の追加だった場合、conflict marker (`<<<<<<<` / `|||||||` / `=======` / `>>>>>>>`) のみ除去して **HEAD section + dev section** の順で残す手動 union を採用する。base section (`||||||| <sha>`) は通常空（両側追加のため）なので削除のみで足りる。
- 同一節内の同一行 / 同一 sentence への両側変更は独立節追加ではない。最新 SSOT（後追い変更があった側、通常 dev）を採用するか、両方の意図を保持する書き換えを行う。

### 推奨処方（Edit ツール bytes mismatch 回避）

JP 全角括弧（`（` `）`）等を含む長文 conflict block は Edit ツールで bytes-level mismatch が頻発する。`python3 + re` でブロック単位置換する以下のワンライナーが確実:

```python
import re
pattern = re.compile(r'<<<<<<< HEAD\n(.*?)(?:\|\|\|\|\|\|\| [^\n]*\n(.*?))?=======\n(.*?)>>>>>>> dev\n', re.DOTALL)
new = pattern.sub(lambda m: m.group(1) + m.group(3), text)
```

詳細: `.claude/skills/aiworkflow-requirements/changelog/20260522-dev-sync-issue777-spec-docs-union-manual-resolve.md`。

## 14. dev sync 直後の `verify-indexes-up-to-date` drift 先回り（標準フロー）

`pnpm sync:resolve` で `.claude/skills/aiworkflow-requirements/SKILL.md` / `indexes/topic-map.md` を union 解消した直後は、`pnpm indexes:rebuild` を実行すると `topic-map.md` に正規化差分（行順 / 重複除去）が出ることがある。push してから CI で `verify-indexes-up-to-date` gate に落ちる事故を防ぐため、以下を**マージコミット作成後・push 前**に必ず実行する:

```bash
pnpm sync:resolve              # conflict 解消
git commit --no-edit           # マージコミット
pnpm indexes:rebuild           # ← drift があれば差分が出る
git diff --quiet || git commit -am "chore: rebuild aiworkflow indexes after dev sync merge"
git push
```

詳細: `.claude/skills/aiworkflow-requirements/changelog/20260522-dev-sync-skill-md-topic-map-content-conflict-resolved.md`。

## 15. dev sync `static-manifest.json` unhandled は `pnpm sync:resolve` が自動再生成で吸収（SP-DEVSYNC-027 / L-DEVSYNC-034・035・036）

`apps/api/src/repository/_shared/generated/static-manifest.json` は conflict 時、正本 spec から deterministic 再生成して `git add` するだけで吸収できる（手動 union は JSON 構造破壊のため禁止）。2026-05-24 の再発（`docs/issue-842-admin-mutation-reliability-policy-spec` ← dev sync-merge）を受け、`scripts/sync/resolve-skill-merge-conflicts.sh` に `REGENERATE_TARGETS` を新設し、本ファイルが unhandled 候補に出た場合は `git checkout --theirs` → `mise exec -- pnpm regenerate:static-manifest` → `git add` を**自動実行**するよう拡張済み。以後 `pnpm sync:resolve` 一発で完了する。

### 自律手順（拡張版 sync:resolve で 1 step 化）

```bash
# 1) sync:resolve 完走（union resolve + keywords.json --ours + indexes:rebuild
#    + static-manifest.json 自動再生成を一気に実行）
mise exec -- pnpm sync:resolve

# 2) 残 ^UU が 0 であることを確認してから commit
test -z "$(git status --porcelain | grep '^UU')" && git commit --no-edit
```

旧手順（手動 regenerate）は 2026-05-24 の `scripts/sync/resolve-skill-merge-conflicts.sh` 拡張で不要化。`REGENERATE_TARGETS` 配列にエントリ追加すれば、他の deterministic generated artifact も同様に自動吸収できる。

### Why

- `static-manifest.json` は `apps/api/src/repository/_shared/source-spec/*` から hash 化生成される deterministic artifact。両側の conflict 内容に意味はなく、正本 spec が同一なら再生成で必ず一意になる
- `pnpm sync:resolve` の exit code は `git add` 副作用（gitignore 競合等）に影響され信頼できない。`^UU` 件数を単一の真実とする
- `regenerate:static-manifest` / `indexes:rebuild` はいずれも冪等な deterministic 再生成で副作用ゼロ。conflict 残存時の常用処方として安全

詳細: `.claude/skills/aiworkflow-requirements/lessons-learned/lessons-learned-dev-sync-merge-conflict-resolution-2026-05.md` §L-DEVSYNC-034 / §L-DEVSYNC-035 / §L-DEVSYNC-036。事例: 2026-05-21 `feat/issue-276-mobile-filterbar-tag-picker` ← dev sync-merge（初回）、2026-05-24 `docs/issue-842-admin-mutation-reliability-policy-spec` ← dev sync-merge（再発を受け sync:resolve に自動化を取り込み）。
