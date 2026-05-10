# タスク仕様書: Issue #325 — UT-08A-06 既存 `*.test.ts` → suffix 規約 (`*.contract.spec.ts` / `*.authz.spec.ts` / `*.repository.spec.ts` / `*.spec.ts`) 段階的 rename

[実装区分: 実装仕様書]

判定根拠: 本タスクは `apps/api/src/**/*.test.ts` 計 132 ファイルの **物理 rename (git mv)** と、それに伴う `vitest.config.ts` / `package.json` / `lefthook.yml` / `.github/workflows/*.yml` の **glob 同期** を不可欠に伴う。「ファイル名規約」というドキュメントだけでなく、ファイル実体・ビルド/CI/coverage の実 glob を変更しなければ目的（suite 種別がファイル名から判別できる状態）を達成できないため、CONST_004 デフォルトの実装仕様書として作成する。Issue #325 は CLOSED 状態だがユーザー指示により close 操作は行わず、PR 本文には `Refs #325` のみで連携する。

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク ID | issue-325-test-suffix-rename-migration |
| 親 Issue | https://github.com/daishiman/UBM-Hyogo/issues/325 (CLOSED) |
| 元 unassigned-task | `docs/30-workflows/unassigned-task/UT-08A-06-test-suffix-rename-migration.md` |
| 元 workflow | `docs/30-workflows/08a-parallel-api-contract-repository-and-authorization-tests/` (Phase 10 §5 リスク表 / Phase 12 unassigned-task-detection §6) |
| 配置先 | `docs/30-workflows/issue-325-test-suffix-rename-migration/` |
| 作成日 | 2026-05-09 |
| 状態 | implementation_completed |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| 優先度 | LOW（issue label `priority:low`） |
| 規模 | 中規模（132 ファイル rename・1 PR 完結） |
| 想定 PR 数 | 1（rename 専用 PR・`git mv` のみで diff 0） |
| coverage AC | 適用外（リファクタ・内容変更なし。rename 前後で test 件数同一が DoD） |
| 関連 task | `docs/30-workflows/completed-tasks/08a-parallel-api-contract-repository-and-authorization-tests/`（suffix 規約導入元） |

## 着手判断（前提 Gate）

本タスクは **後追い rename** であり、08a で suffix 規約を導入した時点から「混在許容」状態が継続している。CONST_007 の例外条件には該当せず、本サイクル 1 PR 内で 132 ファイル全件を完結させる前提で仕様化する。先送り条件はない。

## 先送り理由（CONST_007 整合）

なし。本サイクル 1 PR 内で 132 ファイル全件を rename + glob 同期 + ADR 確定まで完結させる。「分量が多い」「複雑」「念のため切り出す」を理由に分割しない。

> **理由補強**: 本タスクは `git mv` のみの機械的 rename であり、test 内容を変更しないため、ファイル数 132 件であっても per-file 認知コストはほぼ均一。1 PR を分割すると逆に「rename 前後で test 件数が一致する」検証が PR 横断になり、glob 追従漏れの検出が困難になる。1 PR 完結の方が安全。

## 目的

08a で導入したテスト suffix 規約（`*.contract.spec.ts` / `*.authz.spec.ts` / `*.repository.spec.ts` / unit は `*.spec.ts`）を、既存 `apps/api/src/**/*.test.ts` 132 ファイル全件に段階適用し、suite 種別がファイル名から判別できる状態にする。同時に `vitest.config.ts` / `package.json` / `lefthook.yml` / `.github/workflows/*.yml` の glob を新 suffix に追従させ、rename 前後で test 件数・pass 件数が一致することを CI で保証する。

## scope in / scope out

### scope in（今サイクルで実装・検証）

- `apps/api/src/**/*.test.ts` 132 ファイル全件の `git mv` rename（test 内容は変更しない）
- 4 種 suffix 分類:
  - **contract**（41 件想定）: `apps/api/src/routes/**/*.test.ts` / `apps/api/src/sync/*-route.test.ts` / `apps/api/src/health-db.test.ts` / `apps/api/src/audit-correlation/__tests__/{contract,run-route}.test.ts` 等の HTTP route / contract suite → `*.contract.spec.ts`
  - **authz**（4 件想定）: `apps/api/src/__tests__/authz-matrix.test.ts` / `apps/api/src/middleware/{require-admin,me-session-resolver}.test.ts` / `apps/api/src/middleware/__tests__/rate-limit-magic-link.test.ts` 等の認可・セッション境界 → `*.authz.spec.ts`
  - **repository**（38 件想定）: `apps/api/src/repository/**/*.test.ts` 配下 → `*.repository.spec.ts`
  - **unit**（49 件想定）: 上記以外（`utils` / `_shared/__tests__` / `services` / `use-cases` / `view-models` / `jobs` / `workflows` / `sync/schema` / `schemas` / `env.test.ts` / `notification-mail-config.test.ts` / `__tests__/{brand-type,invariants}.test.ts` 等）→ `*.spec.ts`
  - 件数合計は 132 件と一致すること（Phase 2 で fixed list 凍結）
- glob 同期:
  - `vitest.config.ts`（root + `apps/api/vitest.config.ts` がある場合）の `test.include` / `coverage.exclude` を `*.{test,spec}.ts` または `*.spec.ts` に揃える
  - `apps/api/package.json` の `scripts.test` 系 glob
  - ルート `package.json` の `scripts.test` 系 glob
  - `lefthook.yml` の `pre-commit` / `pre-push` の test path filter（`*.test.ts` / `*.spec.ts` 双方を許容するか、`*.spec.ts` のみへ移行するか Phase 3 で確定）
  - `.github/workflows/*.yml` で `apps/api` の test を回す全 job（実在 workflow: `ci.yml` / `backend-ci.yml` / `pr-build-test.yml` 等の glob）
- 規約 ADR:
  - `docs/30-workflows/issue-325-test-suffix-rename-migration/outputs/phase-12/test-file-suffix-adr.md` として suffix 規約を確定（後続 task が新規 test を追加する際の正本）
- rename 件数同一性 assert:
  - rename 前後で `find apps/api/src -name '*.test.ts' -o -name '*.spec.ts' | wc -l` の合計が一致 = 132 を Phase 11 evidence に記録
  - rename 後 `mise exec -- pnpm --filter @ubm-hyogo/api test` の test 件数 (vitest reporter) が rename 前と一致

### scope out（本サイクルでは扱わない）

- `apps/web/src/**/*.test.ts` の rename（Issue #325 / UT-08A-06 の親責務外。必要なら別要求で独立仕様化する）
- `packages/**/*.test.ts` の rename（Issue #325 / UT-08A-06 の親責務外。必要なら別要求で独立仕様化する）
- test 内容の修正・追加・削除（**禁止**: rename PR と test 内容変更を絶対に同 PR に混在させない）
- E2E (`tests/e2e/`) / Playwright spec の rename（既に `*.spec.ts` 命名のため対象外）
- vitest 以外の test runner 設定変更
- TypeScript path mapping の変更
- coverage 閾値の変更

## 不変条件・正本仕様との整合

- CLAUDE.md 不変条件 #5（D1 直接アクセスは `apps/api` に閉じる）と独立（テストファイル rename のみ）
- 08a Phase 10 §5 リスク表で確定した「混在許容方針」を本タスクで解消する
- 親 task 08a で導入された suffix 規約（`agents/test-suffix-policy.md` 等があれば参照）と完全互換
- `mise exec -- pnpm --filter @ubm-hyogo/api test` が rename 後も green であること
- secret leakage / hardcoded credential が test 内に存在しないこと（rename で内容を変えないため、既存のクリーン状態が維持される前提）

## 依存関係

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流 | `docs/30-workflows/completed-tasks/08a-parallel-api-contract-repository-and-authorization-tests/`（suffix 規約導入元） | 規約の正本 |
| 上流 | `docs/30-workflows/unassigned-task/UT-08A-06-test-suffix-rename-migration.md` | 元仕様（本仕様書で実装可能粒度に展開） |
| 上流 | `vitest.config.ts` / `apps/api/package.json` / `lefthook.yml` / `.github/workflows/*.yml` | glob 同期対象 |
| 並走 | なし（本タスクは 1 PR で完結） | — |
| 下流 | 後続の test 追加タスク全般 | 新 suffix 規約に従う |

## refs

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/unassigned-task/UT-08A-06-test-suffix-rename-migration.md | 元 unassigned-task 仕様 |
| 必須 | docs/30-workflows/completed-tasks/08a-parallel-api-contract-repository-and-authorization-tests/ | 親 workflow / 規約導入元 |
| 必須 | apps/api/src/**/*.test.ts (132 files) | rename 対象 |
| 必須 | vitest.config.ts | glob 同期対象 |
| 必須 | apps/api/package.json | glob 同期対象 |
| 必須 | lefthook.yml | glob 同期対象 |
| 必須 | .github/workflows/*.yml | glob 同期対象 |
| 参考 | docs/30-workflows/issue-548-ml-model-selection/ | 仕様書テンプレ |
| 参考 | .claude/skills/task-specification-creator/references/phase-templates.md | Phase 構成正本 |

## AC（Acceptance Criteria）

- AC-1: `apps/api/src/**/*.test.ts` 132 ファイル全件が下表の suffix 分類に基づき rename されている。Phase 2 で凍結する fixed list と完全一致する
- AC-2: rename は **`git mv` のみ**で実施され、test 内容（`describe` / `it` / `expect` / import path 含む）に **1 文字も変更がない**。`git diff --stat HEAD~1 -- '*.spec.ts'` の +/- 行数が rename 直前と直後で同一であること
- AC-3: rename 後 `mise exec -- pnpm --filter @ubm-hyogo/api test` が green。reporter 出力の test 件数が rename 前と完全一致
- AC-4: rename 後 `find apps/api/src \( -name '*.test.ts' -o -name '*.spec.ts' \) | wc -l` = 132（rename 前 132 と同一）
- AC-5: rename 後 `find apps/api/src -name '*.test.ts' | wc -l` = 0（残存ゼロ）
- AC-6: suffix 内訳が `find apps/api/src -name '*.contract.spec.ts' | wc -l` 等で確認でき、Phase 2 凍結 fixed list と一致
- AC-7: `vitest.config.ts` / `apps/api/package.json` / `lefthook.yml` / `.github/workflows/*.yml` の glob が `*.spec.ts` を網羅し、rename 前後で test job が静かに skip しないことを Phase 11 evidence に記録
- AC-8: `mise exec -- pnpm typecheck` exit 0
- AC-9: `mise exec -- pnpm lint` exit 0
- AC-10: suffix 規約 ADR が `outputs/phase-12/test-file-suffix-adr.md` に存在し、後続タスクが参照可能な状態
- AC-11: Phase 12 strict 7 files（`main.md` + 6 補助ファイル）が `outputs/phase-12/` に実体存在し、ADR も補助成果物として存在
- AC-12: PR 本文に `Refs #325` を含み、`Closes #325` を **使わない**（issue は CLOSED のままユーザーが管理）

## 実装ファイル一覧（抜粋・Phase 5/6 で詳細確定）

### A. rename 対象（132 ファイル）

| 分類 | 件数 | 例（先頭 3 件） | 完全列挙 |
| --- | --- | --- | --- |
| contract → `*.contract.spec.ts` | 41 | `routes/admin/attendance.test.ts` / `routes/me/index.test.ts` / `health-db.test.ts` | Phase 2 fixed list |
| authz → `*.authz.spec.ts` | 4 | `__tests__/authz-matrix.test.ts` / `middleware/require-admin.test.ts` / `middleware/__tests__/rate-limit-magic-link.test.ts` | Phase 2 fixed list |
| repository → `*.repository.spec.ts` | 38 | `repository/__tests__/members.test.ts` / `repository/_shared/builder.test.ts` / `repository/attendance.test.ts` | Phase 2 fixed list |
| unit → `*.spec.ts` | 49 | `env.test.ts` / `utils/with-retry.test.ts` / `_shared/__tests__/pagination.test.ts` | Phase 2 fixed list |

### B. glob 同期対象（編集）

| ファイル | 種別 | 概要 |
| --- | --- | --- |
| `vitest.config.ts`（root） | 編集 | `test.include` / `coverage.exclude` の glob を `*.{test,spec}.ts` から `*.spec.ts` 単独へ移行（または両許容） |
| `apps/api/vitest.config.ts`（存在する場合） | 編集 | 同上 |
| `apps/api/package.json` | 編集 | `scripts.test` / `scripts.test:run` の glob |
| `package.json`（root） | 編集 | `scripts.test` 系 glob（`apps/api` 経由のもの） |
| `lefthook.yml` | 編集 | `pre-commit` / `pre-push` の test path filter |
| `.github/workflows/ci.yml` | 編集 | `apps/api` test を回す step の glob（必要な場合） |
| `.github/workflows/backend-ci.yml` | 編集 | `apps/api` test を回す step の glob（必要な場合） |
| `.github/workflows/pr-build-test.yml` | 編集 | PR build / test step の glob（必要な場合） |

### C. 新規（ADR / evidence）

| ファイル | 種別 | 概要 |
| --- | --- | --- |
| `outputs/phase-11/main.md` | 新規 | NON_VISUAL evidence（typecheck / lint / test / rename count / glob coverage） |
| `outputs/phase-11/test-count-before.txt` | 新規 | rename 前 test 件数 snapshot |
| `outputs/phase-11/test-count-after.txt` | 新規 | rename 後 test 件数 snapshot |
| `outputs/phase-11/rename-mapping.csv` | 新規 | 132 ファイルの old → new rename マッピング（fixed list） |
| `outputs/phase-11/glob-coverage-grep.log` | 新規 | `vitest.config.ts` / `package.json` / `lefthook.yml` / `.github/workflows/*.yml` の glob grep evidence |
| `outputs/phase-12/implementation-guide.md` | 新規 | Part 1 中学生レベル + Part 2 技術者レベル |
| `outputs/phase-12/test-file-suffix-adr.md` | 新規 | suffix 規約 ADR（後続 task の正本） |
| `outputs/phase-12/system-spec-update-summary.md` | 新規 | SSOT 同期記録 |
| `outputs/phase-12/documentation-changelog.md` | 新規 | 更新履歴 |
| `outputs/phase-12/unassigned-task-detection.md` | 新規 | 未タスク検出（apps/web / packages 側 rename を未タスク化） |
| `outputs/phase-12/skill-feedback-report.md` | 新規 | skill 改善フィードバック |
| `outputs/phase-12/phase12-task-spec-compliance-check.md` | 新規 | コンプライアンスチェック |

## Phase 一覧

| Phase | 名称 | 出力 |
| --- | --- | --- |
| 1 | 要件定義 / Gate 整理 / 真の論点（diff 0 保証 / glob 漏れ検出 / 規約 ADR） | phase-01.md |
| 2 | 既存実装調査（132 ファイル fixed list 凍結 / 既存 glob inventory / 命名衝突調査） | phase-02.md |
| 3 | 設計（suffix 分類ルール / glob 移行戦略 / rename 順序 / `git mv` 専用 commit 戦略） | phase-03.md |
| 4 | I/O 契約（rename mapping CSV schema / test count snapshot 形式 / vitest reporter 比較契約） | phase-04.md |
| 5 | データモデル（fixed list の正規化 / mapping schema / config glob の AST 表現） | phase-05.md |
| 6 | 関数シグネチャ・スクリプト擬似コード（rename 実行・glob 同期スクリプト・件数 assert） | phase-06.md |
| 7 | 整合性検証（08a 規約 / vitest config / lefthook / CI / coverage 閾値） | phase-07.md |
| 8 | エラーハンドリング（命名衝突 / glob 漏れ / test 件数差異 / `git mv` 競合） | phase-08.md |
| 9 | テスト計画（rename script 単体 / glob coverage grep / 件数 assert / smoke vitest） | phase-09.md |
| 10 | デプロイ・rollback（PR 単位 commit 戦略 / hook bypass 禁止 / revert 手順） | phase-10.md |
| 11 | 実行 evidence（typecheck / lint / test / 件数 snapshot / glob grep / mapping CSV） | outputs/phase-11/main.md |
| 12 | 実装ガイド・ADR・SSOT 同期・未タスク（apps/web / packages 側 rename）・skill feedback | outputs/phase-12/* |
| 13 | PR 作成（`Refs #325`、close 操作なし、`git mv` のみ commit） | outputs/phase-13/main.md |

各 Phase 詳細は `phase-NN.md` を参照:

- [Phase 1](phase-01.md) ・ [Phase 2](phase-02.md) ・ [Phase 3](phase-03.md) ・ [Phase 4](phase-04.md) ・ [Phase 5](phase-05.md) ・ [Phase 6](phase-06.md) ・ [Phase 7](phase-07.md)
- [Phase 8](phase-08.md) ・ [Phase 9](phase-09.md) ・ [Phase 10](phase-10.md) ・ [Phase 11](phase-11.md) ・ [Phase 12](phase-12.md) ・ [Phase 13](phase-13.md)

## DoD（Definition of Done・全 Phase 共通）

- [ ] AC-1〜AC-12 全件 PASS
- [ ] 132 ファイル全件 rename 済み（残存 `*.test.ts` ゼロ）
- [ ] `mise exec -- pnpm --filter @ubm-hyogo/api test` green / 件数 rename 前と一致
- [ ] `mise exec -- pnpm typecheck` / `mise exec -- pnpm lint` exit 0
- [ ] glob 同期 4 種（vitest / package.json / lefthook / CI）すべて新 suffix を網羅
- [ ] suffix 規約 ADR が `outputs/phase-12/test-file-suffix-adr.md` に存在
- [ ] Phase 12 strict 7 files（`main.md` + 6 補助ファイル）全て存在し、ADR も存在
- [ ] PR 本文に `Refs #325` を含む。`Closes` は使わない
- [ ] 1 PR 内で `git mv` rename と glob 同期が完結
- [ ] hook bypass (`--no-verify`) を使っていない
