# phase12 task spec compliance check

総合判定: `IMPLEMENTED_LOCAL_RUNTIME_PENDING`

## 4 条件

| 条件 | 判定 | 根拠 |
| --- | --- | --- |
| 矛盾なし | PASS | `implemented-local / implementation / VISUAL_ON_EXECUTION` で統一。runtime evidence は未取得として分離 |
| 漏れなし | PASS | Phase 1-13、Phase 12 strict 7、root/output artifacts parity、aiworkflow 導線を配置 |
| 整合性あり | PASS | output path、状態語彙、依存タスク、検証コマンドを同一表現へ統一 |
| 依存関係整合 | PASS | task-02/05/08/09/10 依存、task-18 blocks、task-12/13..17 parallel を保持 |

## 30 種思考法 compact evidence

| カテゴリ | 適用した思考法 | 結論 |
| --- | --- | --- |
| 論理分析系 | 批判的思考 / 演繹思考 / 帰納的思考 / アブダクション / 垂直思考 | Phase 12 が要求する outputs 実体欠落を最重要 blocker と判定 |
| 構造分解系 | 要素分解 / MECE / 2軸思考 / プロセス思考 | root phase と outputs mirror、仕様書と aiworkflow 導線を分離して補完 |
| メタ・抽象系 | メタ思考 / 抽象化思考 / ダブル・ループ思考 | 実コード差分を `implemented-local` として扱い、runtime evidence pending と分離 |
| 発想・拡張系 | ブレインストーミング / 水平思考 / 逆説思考 / 類推思考 / if思考 / 素人思考 | 実装を急がず、後続実装者が迷わない最小 evidence package を作成 |
| システム系 | システム思考 / 因果関係分析 / 因果ループ | outputs 欠落が Phase 12 false-green と aiworkflow 検索不能を引き起こすため同一 wave で修正 |
| 戦略・価値系 | トレードオン思考 / プラスサム思考 / 価値提案思考 / 戦略的思考 | skill 準拠を満たしつつ、app 実装済み範囲と user-gated runtime evidence を分離 |
| 問題解決系 | why思考 / 改善思考 / 仮説思考 / 論点思考 / KJ法 | 根本原因は「root 仕様だけ作成し outputs/ と aiworkflow sync を後置したこと」 |

## Strict Outputs

| file | status |
| --- | --- |
| `outputs/phase-12/main.md` | present |
| `outputs/phase-12/implementation-guide.md` | present |
| `outputs/phase-12/system-spec-update-summary.md` | present |
| `outputs/phase-12/documentation-changelog.md` | present |
| `outputs/phase-12/unassigned-task-detection.md` | present |
| `outputs/phase-12/skill-feedback-report.md` | present |
| `outputs/phase-12/phase12-task-spec-compliance-check.md` | present |

## Artifacts Parity

`artifacts.json` と `outputs/artifacts.json` は両方存在し、内容一致を `cmp -s artifacts.json outputs/artifacts.json` で確認する。root が編集正本、outputs 側は Phase evidence mirror として同値維持する。

## Test Executability DoD

| item | status |
| --- | --- |
| 対象 spec ファイル列挙 | PASS: Phase 4/5 に Vitest と Playwright path を列挙 |
| 1 行実行コマンド | PASS: Phase 5 に `mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test playwright/tests/public-top-and-list.spec.ts` |
| 実行前提と自動化 path | PASS: Phase 5/11 に Playwright install と webServer 前提を記録 |
| un-skip 不変条件 | PASS: Phase 9 grep gate に skip 禁止を記録 |
| browser binary install | PASS: Phase 5/11 に install コマンドを記録 |
| dev server 自動起動 | PASS: Phase 5 に Playwright config `webServer` で固定 |
| CI gate 化 | PASS_BOUNDARY: task-18 regression smoke / verify-design-tokens が下流 gate |
| E2E lines coverage >= 80% | PASS_BOUNDARY: Phase 9/11 に `coverage/e2e/coverage-summary.json` 閾値を要求 |

## Runtime Boundary

Phase 11 local evidence は `outputs/phase-11/evidence/` に保存済み。

| evidence | result |
| --- | --- |
| `typecheck.log` | PASS: `pnpm --filter @ubm-hyogo/web typecheck` |
| `lint.log` | PASS: `pnpm --filter @ubm-hyogo/web lint` |
| `test.log` | PASS: focused Vitest 6 files / 29 tests |
| `build.log` | PASS: `pnpm --filter @ubm-hyogo/web build` |
| `grep-gate.log` | PASS: HEX / arbitrary color / D1 direct import / Sentry direct import / process.env / Playwright skip / force-dynamic gate |
| `e2e-list.log` | PASS: Playwright 5 cases discovered |
| `home-screenshot.png` | captured with local mock public API |
| `members-*.png`, `axe.json` | PENDING_RUNTIME_EVIDENCE: local D1 API is missing `member_identities`; mock screenshot attempt did not produce member grid/list runtime state |

Full Playwright screenshot / axe / coverage remains `PENDING_RUNTIME_EVIDENCE` and must not be described as runtime PASS. commit / push / PR are user-gated.

## lint gate 4要素同期 checklist

ESLint gate を AC に持つ task-11 において、以下 4 要素が同一 wave で同期しているか確認する。1 要素でも欠けたら PASS にしない（phase-12-documentation-guide.md L256-L266 準拠）。

| 要素 | 確認内容 | 検証コマンド | 結果 |
| --- | --- | --- | --- |
| package.json `lint` script | `apps/web/package.json` の `scripts.lint` が `tsc --noEmit && eslint .` 等価で ESLint を実 invoke | `cat apps/web/package.json \| jq -r '.scripts.lint'` | [x] PASS（`scripts.lint` で eslint 実行を確認） |
| dependency | `eslint` / `@typescript-eslint/*` / `eslint-config-next` が `apps/web` の devDependencies に存在 | `pnpm --filter @ubm-hyogo/web ls eslint @typescript-eslint/parser eslint-config-next` | [x] PASS（版数つきで存在確認） |
| config | `apps/web/eslint.config.mjs`（または `.eslintrc.*`）に `no-restricted-globals` / `no-restricted-imports` 等の rule 有効化 | `rg -n 'no-restricted-globals\|no-restricted-imports' apps/web/eslint.config.mjs` | [x] PASS（rule 名が grep hit） |
| evidence | `outputs/phase-11/evidence/lint.log` に exit 0 と eslint stdout（rule 名 / 対象ファイル）の両方が記録 | `tail -n 20 docs/30-workflows/task-11-public-top-and-member-list/outputs/phase-11/evidence/lint.log; grep -c eslint docs/30-workflows/task-11-public-top-and-member-list/outputs/phase-11/evidence/lint.log` | [x] PASS（exit 0 + eslint stdout 記録あり） |

## placeholder token grep 0 件 gate

| validator | コマンド | exit code | 件数 |
| --- | --- | --- | --- |
| placeholder token (token-sized) | `rg -n -F 'token-sized' apps/web/src` | 1 | 0 件（PASS gate） |
| placeholder token (extended set) | `rg -n -F -e 'token-sized' -e '09b-token-value' -e 'token-mix' apps/web/src` | 1 | 0 件（PASS gate） |

> rg の exit 1 は「match なし」の正常終了。`rg -q` での 0 件確定 + 文書上 `match 0件` の対記録（phase-12-documentation-guide.md L153 準拠）。

## planned wording 0 件 gate

```
rg -n "計画|予定|TODO|will be|を予定|仕様策定のみ|保留として記録" outputs/phase-12/*.md
```

→ 想定 0 件（commit 直前に再走して確定）。`PENDING_RUNTIME_EVIDENCE` は phase-12-documentation-guide.md L243-L250 準拠の正規語彙であり planned wording には該当しない。
