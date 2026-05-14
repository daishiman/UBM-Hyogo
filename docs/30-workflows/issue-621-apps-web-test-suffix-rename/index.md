# タスク仕様書: Issue #621 — apps/web `*.test.ts(x)` → 種別別 `*.spec.ts(x)` rename

[実装区分: 実装仕様書]

判定根拠: 本タスクは `apps/web/**/*.test.ts(x)` 70 ファイルの **物理 rename (`git mv`)** と `apps/web/package.json:19` 内の glob 参照（`verify-design-tokens` script）の同期を不可欠に伴う。「ファイル名規約」というドキュメント（ADR）の追加だけでは目的（suite 種別がファイル名から判別される状態）を達成できないため、CONST_004 デフォルトの実装仕様書として作成する。Issue #621 は OPEN 状態だがユーザー指示により close 操作は行わず、PR 本文には `Refs #621` のみで連携する。

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク ID | issue-621-apps-web-test-suffix-rename |
| 親 Issue | https://github.com/daishiman/UBM-Hyogo/issues/621 (OPEN) |
| 上位 Issue | #325（apps/api 側 rename 完了タスク） |
| 元 unassigned-task | `docs/30-workflows/unassigned-task/task-issue-325-followup-001-apps-web-test-suffix-rename.md` |
| 元 workflow / 親完了タスク | `docs/30-workflows/completed-tasks/issue-325-test-suffix-rename-migration/`（フォーマット参照の正本） |
| 配置先 | `docs/30-workflows/issue-621-apps-web-test-suffix-rename/` |
| 作成日 | 2026-05-10 |
| 状態 | implemented_local_evidence_captured |
| taskType | implementation |
| implementation_mode | refactor-rename-only |
| visualEvidence | NON_VISUAL |
| 優先度 | LOW（issue label `priority:low` 想定） |
| 規模 | 中規模（70 ファイル rename + 1 glob 同期点 + 1 ADR・1 PR 完結） |
| 想定 PR 数 | 1（rename / config 同期 / ADR の 3 commit 構造） |
| coverage AC | 適用外（リファクタ・内容変更なし。rename 前後で test 件数同一が DoD） |
| 関連 task | `docs/30-workflows/completed-tasks/issue-325-test-suffix-rename-migration/`（apps/api 側 ADR 流用ベース） |

## 着手判断（前提 Gate）

本タスクは Issue #325 の **apps/web 側 follow-up** であり、apps/api 側の rename + ADR 確定（Accepted）が完了していることを前提にする。CONST_007 の例外条件には該当せず、本サイクル 1 PR 内で 70 ファイル全件を完結させる前提で仕様化する。先送り条件はない。

## 先送り理由（CONST_007 整合）

なし。本サイクル 1 PR 内で 70 ファイル全件を rename + glob 同期 + apps/web 用 ADR 確定まで完結させる。「分量が多い」「複雑」「念のため切り出す」を理由に分割しない。

> **理由補強**: 本タスクは `git mv` のみの機械的 rename であり、test 内容を変更しないため、ファイル数 70 件であっても per-file 認知コストはほぼ均一。1 PR を分割すると逆に「rename 前後で test 件数が一致する」検証が PR 横断になり、glob 追従漏れの検出が困難になる。`apps/web/package.json:19` の `verify-design-tokens` script は `apps/web/src/__tests__/tokens.test.ts` を直接参照しているため、同 PR 内で必ず追従させる。1 PR 完結の方が安全。

## 目的

Issue #325 で `apps/api` に導入した「テスト suffix 種別別命名規約」を `apps/web` に拡張する。apps/api ADR（contract / authz / repository / unit）を流用せず、UI 層に適した分類軸（component / route / action / hook / lib-unit / runtime の 6 種）を新設し、`apps/web/**/*.test.ts(x)` 70 ファイル全件を `*.spec.ts(x)` に rename する。同時に `apps/web/package.json:19` の `verify-design-tokens` script の glob 参照を新名に追従させ、rename 前後で test 件数・pass 件数が一致することを検証する。

## scope in / scope out

### scope in（今サイクルで実装・検証）

- `apps/web/**/*.test.ts(x)` 70 ファイル全件の `git mv` rename（rename commit は pure rename）
- rename 後に古いファイル名を直接参照するテスト/guard は、別の同期差分として新 suffix へ追従する
- 5 種 suffix 分類:
  - **component**（36 件）: React component / JSX suite → `*.component.spec.tsx`
  - **route**（4 件）: Next.js route handler suite → `*.route.spec.ts`
  - **page**（1 件）: Next.js page helper/render suite → `*.page.spec.ts`
  - **runtime**（5 件）: `apps/web/src/__tests__/{build-output,instrumentation,instrumentation-client,static-invariants,tokens}.test.ts` → `*.runtime.spec.ts`
  - **lib-unit**（24 件）: 上記以外の pure unit / helper suite → `*.spec.ts`
  - 件数合計は 70 件と一致すること（Phase 2 で fixed list 凍結）
- glob 同期:
  - `apps/web/package.json:19` の `verify-design-tokens` script: `apps/web/src/__tests__/tokens.test.ts` → `apps/web/src/__tests__/tokens.runtime.spec.ts` への参照差し替え
  - root `vitest.config.ts` の `test.include` は `apps/**/src/**/*.{test,spec}.{ts,tsx}` 両許容のため変更不要だが、Phase 7 で grep 確認
  - root `vitest.config.ts` の `coverage.exclude` に `**/*.spec.{ts,tsx}` が含まれていることを Phase 7 で確認
  - `lefthook.yml` の `.test.` 直接参照: 既存 grep ヒット 0 件（変更不要）を Phase 7 で再確認
  - `.github/workflows/ci.yml:159` の `build-output.test.ts` 言及（コメント）を新名へ追従
- 規約 ADR:
  - `outputs/phase-12/test-file-suffix-adr-apps-web.md` として apps/web 用 6 分類 ADR を確定（apps/api ADR との対比表を含む）
- rename 件数同一性 assert:
  - rename 前後で `find apps/web -path '*/node_modules' -prune -o -type f \( -name '*.test.ts' -o -name '*.test.tsx' -o -name '*.spec.ts' -o -name '*.spec.tsx' \) | wc -l` の合計が一致 = 87 を Phase 11 evidence に記録（既存 Playwright/E2E `*.spec.ts` 17 件を含む）
  - rename 後 `mise exec -- pnpm --filter @ubm-hyogo/web test` の test 件数 (vitest reporter) が rename 前と一致

### scope out（本サイクルでは扱わない）

- `packages/**/*.test.ts` の rename（Issue #325 followup-002 として別 issue 化済み）
- `vitest.config.ts` の `*.{test,spec}` から `*.spec` 単一への収斂（followup-003 として別 issue 化済み）
- apps/api 側 ADR の改訂
- test 内容の修正・追加・削除（**禁止**: rename PR と test 内容変更を絶対に同 PR に混在させない）
- Storybook / Playwright (`tests/e2e/`) の suffix 統一（既に `*.spec.ts` 命名のため対象外）
- E2E `tests/integration/`、`apps/web/e2e/` 配下（vitest 範囲外）
- TypeScript path mapping の変更
- coverage 閾値の変更

## 不変条件・正本仕様との整合

- CLAUDE.md 不変条件 #5（D1 直接アクセスは `apps/api` に閉じる）と独立（テストファイル rename のみ）
- ルート CLAUDE.md ブランチ戦略: 本タスクの PR base は `dev`
- ルート `vitest.config.ts` の include glob `apps/**/src/**/*.{test,spec}.{ts,tsx}` は両許容のため、rename 中も rename 完了後も test discovery が壊れない
- `apps/web/package.json:19` の `verify-design-tokens` script が新 suffix を参照すること
- `mise exec -- pnpm --filter @ubm-hyogo/web test` が rename 後も green であること
- secret leakage / hardcoded credential が test 内に存在しないこと（rename で内容を変えないため、既存のクリーン状態が維持される前提）
- jsdom 環境前提のテスト（React コンポーネント）の `// @vitest-environment jsdom` 注釈は rename で破損しない（`git mv` はファイル本文を変更しない）

## 依存関係

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流 | `docs/30-workflows/completed-tasks/issue-325-test-suffix-rename-migration/`（apps/api 側完了） | 規約・フォーマット・ADR の参照元 |
| 上流 | `docs/30-workflows/unassigned-task/task-issue-325-followup-001-apps-web-test-suffix-rename.md` | 元仕様（本仕様書で実装可能粒度に展開） |
| 上流 | `apps/web/package.json:19` / root `vitest.config.ts` / `lefthook.yml` / `.github/workflows/*.yml` | glob 同期対象（grep evidence で確認） |
| 並走 | なし（本タスクは 1 PR で完結） | — |
| 下流 | followup-002（packages rename） / followup-003（vitest config 収斂） | 別 issue で独立進行 |
| 下流 | 後続の apps/web test 追加タスク全般 | 新 suffix 規約に従う |

## refs

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/unassigned-task/task-issue-325-followup-001-apps-web-test-suffix-rename.md | 元 unassigned-task 仕様 |
| 必須 | docs/30-workflows/completed-tasks/issue-325-test-suffix-rename-migration/ | 親完了タスク / フォーマット正本 |
| 必須 | apps/web/**/*.test.ts(x) (70 files) | rename 対象 |
| 必須 | apps/web/package.json | glob 同期対象（`verify-design-tokens` script） |
| 必須 | vitest.config.ts (root) | include / coverage.exclude 確認対象 |
| 必須 | lefthook.yml | 直接参照ゼロ確認対象 |
| 必須 | .github/workflows/*.yml | コメント / job 名追従確認対象 |
| 参考 | docs/30-workflows/completed-tasks/issue-325-test-suffix-rename-migration/outputs/phase-12/test-file-suffix-adr.md | apps/api ADR（対比表ベース） |
| 参考 | .claude/skills/task-specification-creator/references/phase-templates.md | Phase 構成正本 |

## AC（Acceptance Criteria）

- AC-1: `apps/web/**/*.test.ts(x)` 70 ファイル全件が下表の suffix 分類に基づき rename されている。Phase 2 で凍結する fixed list と完全一致する
- AC-2: rename commit は **`git mv` のみ**で実施され、対象 70 ファイルの rename diff は全行 `0\t0` であること。古いファイル名を直接参照する `apps/web/package.json`、CI 表示名、static invariant 自己除外、lint guard は別同期差分として新 suffix へ追従する
- AC-3: rename 後 `mise exec -- pnpm --filter @ubm-hyogo/web test` が green。reporter 出力の `Tests` 件数が rename 前と完全一致
- AC-4: rename 後 `find apps/web -path '*/node_modules' -prune -o -type f \( -name '*.test.ts' -o -name '*.test.tsx' -o -name '*.spec.ts' -o -name '*.spec.tsx' \) -print | wc -l` = 87（rename 前 87 と同一。既存 Playwright/E2E spec 17 件を含む）
- AC-5: rename 後 `find apps/web -path '*/node_modules' -prune -o -type f \( -name '*.test.ts' -o -name '*.test.tsx' \) -print | wc -l` = 0（Vitest 対象残存ゼロ）
- AC-6: suffix 内訳が `find apps/web -path '*/node_modules' -prune -o -type f -name '*.component.spec.tsx' -print | wc -l` 等で確認でき、Phase 2 凍結 fixed list と一致
- AC-7: `apps/web/package.json:19` の `verify-design-tokens` script が `apps/web/src/__tests__/tokens.runtime.spec.ts` を参照する。`mise exec -- pnpm --filter @ubm-hyogo/web run verify-design-tokens` が exit 0
- AC-8: `mise exec -- pnpm typecheck` exit 0
- AC-9: `mise exec -- pnpm lint` exit 0
- AC-10: apps/web 用 suffix 規約 ADR が `outputs/phase-12/test-file-suffix-adr-apps-web.md` に存在し、apps/api ADR との対比表を含む
- AC-11: Phase 12 strict 7 files（`main.md` + 6 補助ファイル）が `outputs/phase-12/` に実体存在し、apps/web 用 ADR も補助成果物として存在
- AC-12: PR 本文に `Refs #621` を含み、`Closes #621` を **使わない**（issue close 操作はユーザーが管理）
- AC-13: `rg -n "apps/web.*\.test\." -g '!**/node_modules/**' -g '!docs/**'` のヒットが 0 件（コードベース内の apps/web `.test.` 直接参照ゼロ）

## 実装ファイル一覧（抜粋・Phase 2/6 で詳細確定）

### A. rename 対象（70 ファイル）

| 分類 | 件数 | 例（先頭 3 件） | 完全列挙 |
| --- | --- | --- | --- |
| component → `*.component.spec.tsx` | 36 | `components/admin/__tests__/AuditLogPanel.test.tsx` / `components/public/__tests__/MemberCard.test.tsx` / `components/ui/__tests__/primitives.test.tsx` | Phase 2 fixed list |
| route → `*.route.spec.ts` | 4 | `app/api/me/[...path]/route.test.ts` / `app/api/me/delete-request/route.test.ts` / `app/api/me/visibility-request/route.test.ts` | Phase 2 fixed list |
| page → `*.page.spec.ts` | 1 | `app/(admin)/admin/audit/page.test.ts` | Phase 2 fixed list |
| runtime → `*.runtime.spec.ts` | 5 | `__tests__/build-output.test.ts` / `__tests__/instrumentation.test.ts` / `__tests__/tokens.test.ts` | Phase 2 fixed list |
| lib-unit → `*.spec.ts` | 24 | `lib/__tests__/env.test.ts` / `lib/api/__tests__/public.test.ts` / `test-utils/fetch-mock.test.ts` | Phase 2 fixed list |

### B. glob 同期対象（編集）

| ファイル | 種別 | 概要 |
| --- | --- | --- |
| `apps/web/package.json` | 編集 | `:19` の `verify-design-tokens` script で `tokens.test.ts` → `tokens.runtime.spec.ts` |
| `.github/workflows/ci.yml` | 編集（軽微） | `:159` 付近の `build-output.test.ts` 言及（コメント）を新名へ追従 |
| `apps/web/src/__tests__/static-invariants.runtime.spec.ts` | 編集 | self-test 除外と Request component 除外を新 suffix へ追従 |
| `scripts/lint-boundaries.mjs` / `scripts/lint-stablekey-literal.mjs` | 編集 | `.spec` test files を旧 `.test` と同じ例外扱いへ追従 |
| `vitest.config.ts`（root） | 確認のみ | include / coverage.exclude が両許容なので変更不要 |
| `lefthook.yml` | 確認のみ | `.test.` 直接参照ゼロを Phase 7 で grep 再確認 |

### C. 新規（ADR / evidence）

| ファイル | 種別 | 概要 |
| --- | --- | --- |
| `outputs/phase-11/main.md` | 新規 | NON_VISUAL evidence（typecheck / lint / test / rename count / glob coverage） |
| `outputs/phase-11/test-count-before.txt` | 新規 | rename 前 test 件数 snapshot |
| `outputs/phase-11/test-count-after.txt` | 新規 | rename 後 test 件数 snapshot |
| `outputs/phase-11/rename-mapping.csv` | 新規 | 70 ファイルの old → new rename マッピング（fixed list） |
| `outputs/phase-11/glob-coverage-grep.log` | 新規 | `apps/web/package.json` / `vitest.config.ts` / `lefthook.yml` / `.github/workflows/*.yml` の glob grep evidence |
| `outputs/phase-12/main.md` | 新規 | Phase 12 close-out summary |
| `outputs/phase-12/implementation-guide.md` | 新規 | Part 1 中学生レベル + Part 2 技術者レベル |
| `outputs/phase-12/test-file-suffix-adr-apps-web.md` | 新規 | apps/web 用 suffix 規約 ADR（後続 task の正本・apps/api ADR 対比表含む） |
| `outputs/phase-12/system-spec-update-summary.md` | 新規 | SSOT 同期記録 |
| `outputs/phase-12/documentation-changelog.md` | 新規 | 更新履歴 |
| `outputs/phase-12/unassigned-task-detection.md` | 新規 | 未タスク検出（packages 側 rename / vitest 収斂は別 issue 化済みを記録） |
| `outputs/phase-12/skill-feedback-report.md` | 新規 | skill 改善フィードバック |
| `outputs/phase-12/phase12-task-spec-compliance-check.md` | 新規 | コンプライアンスチェック |

## 関数シグネチャ相当（rename mapping 方針）

新規スクリプトは作成しない。`outputs/phase-11/rename-mapping.csv`（ヘッダ 1 + データ 70 = 71 行）を **データ正本** とし、Phase 6 の bash one-liner で機械的に流す:

```ts
type SuffixClass = "component" | "runtime" | "lib-unit"; // route/action/hook は Phase 2 で必要時のみ追加
interface RenameEntry {
  oldPath: string;       // "apps/web/src/...test.ts(x)"
  newPath: string;       // "apps/web/src/...{component|runtime}.spec.ts(x)" or "...spec.ts"
  suffixClass: SuffixClass;
  justification: string;
}
type RenameManifest = readonly RenameEntry[]; // length === 70
```

不変条件: `dirname(oldPath) === dirname(newPath)` / `Set(newPath).size === 70` / 4 分類件数の合計が 70。

## 入出力

- 入力: 現在の `apps/web/**/*.test.ts(x)` 70 ファイル / `apps/web/package.json:19` / 親 ADR
- 出力: 70 ファイル rename / `apps/web/package.json` 1 行更新 / `.github/workflows/ci.yml` コメント追従 / 新規 ADR 1 ファイル / Phase 11-12 evidence 一式

## テスト方針

新規 test は追加しない。既存 70 件の test が rename 後も green であることで rename 自体の正しさを保証し、件数 assert（`Tests Y` 値の rename 前後一致）と `find` 件数 assert で glob 同期の正しさを保証する（Phase 9 V-1〜V-8）。

## 実行コマンド（要約）

```bash
# rename 前 evidence
find apps/web -path '*/node_modules' -prune -o -type f \( -name '*.test.ts' -o -name '*.test.tsx' \) -print | sort > outputs/phase-11/find-test-before.txt
find apps/web -path '*/node_modules' -prune -o -type f \( -name '*.spec.ts' -o -name '*.spec.tsx' \) -print | sort > outputs/phase-11/find-spec-before.txt

# rename（CSV を流す bash one-liner — 詳細は Phase 6）
while IFS=, read -r old new _ _; do git mv "$old" "$new"; done < outputs/phase-11/rename-mapping.csv

# config 同期
# apps/web/package.json:19: tokens.test.ts → tokens.runtime.spec.ts

# rename 後 evidence
mise exec -- pnpm --filter @ubm-hyogo/web test --reporter=verbose 2>&1 | tee outputs/phase-11/test-after-full.log
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm --filter @ubm-hyogo/web run verify-design-tokens
```

## Phase 一覧

| Phase | 名称 | 出力 |
| --- | --- | --- |
| 1 | 要件定義 / Gate 整理 / 真の論点（diff 0 保証 / glob 漏れ検出 / 規約 ADR） | phase-01.md |
| 2 | 既存実装調査（70 ファイル fixed list 凍結 / 既存 glob inventory / 命名衝突調査） | phase-02.md |
| 3 | 設計（apps/web 用 suffix 分類ルール / glob 移行戦略 / rename 順序 / `git mv` 専用 commit 戦略） | phase-03.md |
| 4 | I/O 契約（rename mapping CSV schema / test count snapshot 形式 / vitest reporter 比較契約） | phase-04.md |
| 5 | データモデル（fixed list の正規化 / mapping schema / config glob の AST 表現） | phase-05.md |
| 6 | 関数シグネチャ・スクリプト擬似コード（rename 実行・glob 同期・件数 assert） | phase-06.md |
| 7 | 整合性検証（apps/api ADR 対比 / vitest config / lefthook / CI / coverage 閾値） | phase-07.md |
| 8 | エラーハンドリング（命名衝突 / glob 漏れ / test 件数差異 / `git mv` 競合 / `.tsx` 漏れ） | phase-08.md |
| 9 | テスト計画（rename script 単体 / glob coverage grep / 件数 assert / smoke vitest） | phase-09.md |
| 10 | デプロイ・rollback（PR 単位 commit 戦略 / hook bypass 禁止 / revert 手順） | phase-10.md |
| 11 | 実行 evidence（typecheck / lint / test / 件数 snapshot / glob grep / mapping CSV） | outputs/phase-11/main.md |
| 12 | 実装ガイド・ADR・SSOT 同期・未タスク・skill feedback | outputs/phase-12/* |
| 13 | PR 作成（base: dev、`Refs #621`、close 操作なし、`git mv` のみ commit） | phase-13.md |

各 Phase 詳細は `phase-NN.md` を参照:

- [Phase 1](phase-01.md) ・ [Phase 2](phase-02.md) ・ [Phase 3](phase-03.md) ・ [Phase 4](phase-04.md) ・ [Phase 5](phase-05.md) ・ [Phase 6](phase-06.md) ・ [Phase 7](phase-07.md)
- [Phase 8](phase-08.md) ・ [Phase 9](phase-09.md) ・ [Phase 10](phase-10.md) ・ [Phase 11](phase-11.md) ・ [Phase 12](phase-12.md) ・ [Phase 13](phase-13.md)

## DoD（Definition of Done・全 Phase 共通）

- [ ] AC-1〜AC-13 全件 PASS
- [ ] 70 ファイル全件 rename 済み（残存 `*.test.ts(x)` ゼロ）
- [ ] `mise exec -- pnpm --filter @ubm-hyogo/web test` green / 件数 rename 前と一致
- [ ] `mise exec -- pnpm typecheck` / `mise exec -- pnpm lint` exit 0
- [ ] `mise exec -- pnpm --filter @ubm-hyogo/web run verify-design-tokens` exit 0
- [ ] glob 同期: `apps/web/package.json:19` の `verify-design-tokens` script が新 suffix を参照
- [ ] apps/web 用 suffix 規約 ADR が `outputs/phase-12/test-file-suffix-adr-apps-web.md` に存在し、apps/api ADR との対比表を含む
- [ ] Phase 12 strict 7 files（`main.md` + 6 補助ファイル）すべて存在し、apps/web 用 ADR も存在
- [ ] PR 本文に `Refs #621` を含む。`Closes` は使わない
- [ ] 1 PR 内で `git mv` rename と glob 同期 と ADR 確定が完結（3 commit 構造）
- [ ] hook bypass (`--no-verify`) を使っていない
