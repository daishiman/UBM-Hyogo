# Phase 11: 証跡 / Evidence

## 目的
NON_VISUAL automation のため、CLI / workflow logs / 出力 JSON を evidence として収集する。

## Evidence inventory

| ID | 種別 | 取得方法 | 配置 |
| --- | --- | --- | --- |
| EV-1 | unit test pass log | `pnpm test scripts/__tests__/fetch-cloudflare-analytics.test.ts` | `outputs/phase-11/unit-test.log` |
| EV-2 | typecheck / lint pass log | `pnpm typecheck` / `pnpm lint` | `outputs/phase-11/typecheck.log` / `lint.log` |
| EV-3 | redaction-check dummy fail | dummy JSON で exit 1 を確認 | `outputs/phase-11/redaction-check-fail.log` |
| EV-4 | redaction-check legitimate JSON pass | clean JSON で exit 0 | `outputs/phase-11/redaction-check-pass.log` |
| EV-5 | workflow_dispatch dry-run logs | `gh run view <ID> --log` | `outputs/phase-11/workflow-dryrun.log` |
| EV-6 | workflow_dispatch 本実行 PR URL | `gh pr view <N> --json url` | `outputs/phase-11/runtime-pr.json` |
| EV-7 | 本実行で生成された JSON 1 件 | E-2 で生成された export JSON | `outputs/phase-11/sample-export.json`（masked: zoneTag / accountTag は redact） |
| EV-8 | secret masking 確認 | workflow logs に `***` のみ token 値が出ない | `outputs/phase-11/secret-masking.log` |
| EV-9 | GraphQL schema introspection boundary | token-backed runtime access pending を明記 | `outputs/phase-11/graphql-introspection.log` |

## Captured local evidence

| File | Status |
| --- | --- |
| `outputs/phase-11/unit-test.log` | PASS: focused Vitest 19/19 |
| `outputs/phase-11/typecheck.log` | PASS: 5 workspace projects |
| `outputs/phase-11/lint.log` | PASS: lint command exit 0（stablekey warning 2 件は既存 warning mode） |
| `outputs/phase-11/redaction-check-pass.log` | PASS: clean aggregate-only JSON |
| `outputs/phase-11/redaction-check-fail.log` | PASS: `memberId` JSON blocks with `pattern=member-id` |
| `outputs/phase-11/graphql-introspection.log` | PENDING_USER_APPROVAL |

## 状態語彙

- `spec_created`: 本仕様書 commit 時点
- `implemented-local`: コード完成 + unit/typecheck/lint/redaction evidence captured、実 API 未実行
- `runtime_evidence_captured`: E-1 / E-2 完了
- `completed`: PR merge 後、翌月の schedule trigger を 1 回観測

## 苦戦見込み

- E-2 の本実行は token 配置が前提。token 未配置の場合は `implementation_completed_runtime_pending` で close-out し、token 配置タスクに引き継ぐ。
- 実出力 JSON を evidence に置く際、PII でない zoneTag / accountTag であってもプロジェクト識別子として外部に晒さないため masked 版を保存する。

## 成果物
- 本ファイル
- `outputs/phase-11/` 配下 EV-1〜EV-8

## 完了条件
- EV-1〜EV-4 / EV-9 が必須（implemented-local 段階）
- EV-5〜EV-8 は runtime evidence。token 未配置時は pending として明記

### システム仕様（aiworkflow-requirements）

- `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md` runtime evidence pending boundary
- `.claude/skills/aiworkflow-requirements/references/deployment-gha.md` workflow logs / GitHub Actions evidence
