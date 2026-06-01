# workflow-issue-229-indexes-rebuild-fail-fast artifact inventory

## Metadata

| Item | Value |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/issue-229-indexes-rebuild-fail-fast/` |
| status | `implemented_local_evidence_captured / implementation / NON_VISUAL` |
| issue | #229 CLOSED（reopen / mutation は user-gated） |
| task type | tooling / infrastructure_governance |

## Implementation Targets

| Path | Role |
| --- | --- |
| `.claude/skills/aiworkflow-requirements/scripts/generate-index.js` | `pnpm indexes:rebuild` の単一実行経路。fail-fast / atomic write / decisive log / import-safe export を実装 |
| `.claude/skills/aiworkflow-requirements/package.json` | skill-local ESM marker。`generate-index.js` の正常系 stderr に Node module-type warning を出さないための実行環境境界 |
| `scripts/__tests__/generate-index-fail-fast.spec.ts` | write failure / rename failure / rollback / tmp cleanup / ENOENT / decisive log の focused regression spec |

## Workflow Artifacts

| Path | Role |
| --- | --- |
| `docs/30-workflows/completed-tasks/issue-229-indexes-rebuild-fail-fast/index.md` | workflow root summary / AC / dependency boundary |
| `docs/30-workflows/completed-tasks/issue-229-indexes-rebuild-fail-fast/artifacts.json` | root machine-readable ledger |
| `docs/30-workflows/completed-tasks/issue-229-indexes-rebuild-fail-fast/outputs/artifacts.json` | output mirror ledger |
| `docs/30-workflows/completed-tasks/issue-229-indexes-rebuild-fail-fast/outputs/phase-11/manual-test-result.md` | local focused evidence |
| `docs/30-workflows/completed-tasks/issue-229-indexes-rebuild-fail-fast/outputs/phase-11/manual-smoke-log.md` | CLI smoke evidence |
| `docs/30-workflows/completed-tasks/issue-229-indexes-rebuild-fail-fast/outputs/phase-12/phase12-task-spec-compliance-check.md` | Phase 12 strict compliance check |

## Evidence

| Command | Result |
| --- | --- |
| `pnpm exec vitest run scripts/__tests__/generate-index-fail-fast.spec.ts` | PASS（1 file / 6 tests） |
| `pnpm indexes:rebuild -- --quiet` | PASS（exit 0） |
| immediate second `pnpm indexes:rebuild -- --quiet` | PASS; index diff unchanged（idempotent） |

## User-Gated

Commit, push, PR creation, and GitHub Issue #229 mutation remain user-gated.

## Lessons

実装ガイド（`outputs/phase-12/implementation-guide.md`）から抽出した、同種タスク（生成スクリプトの fail-fast / atomic write 化）を将来簡潔に解決するための知見。

- **L-I229-001（byte-identical 不変条件）**: 出力 `indexes/topic-map.md` / `indexes/keywords.json` の文字列生成（`generateTopicMap` / `generateKeywordIndex`、`JSON.stringify(..., null, 2)` 含む）は一切変更せず、変えるのは「書き込み経路 / catch ログ / silent catch 分離 / CLI 実行ガード / export 化」のみに限定する。回帰は `pnpm indexes:rebuild` 後 `git diff --quiet -- .claude/skills/aiworkflow-requirements/indexes` で担保する。
- **L-I229-002（atomic write は同一 dir の tmp→rename）**: 全 entry を出力先と**同一の `indexes/` dir** の `.<basename>.tmp` へ書き、全 tmp 成功後に `rename` で commit する。POSIX `rename(2)` は同一ファイルシステム上でのみ atomic（中間状態が観測されない）なため、tmp を別 dir に置くと `EXDEV`（cross-device）で失敗する。tmp は必ず出力先と同一 dir に置く。
- **L-I229-003（all-or-nothing rollback）**: いずれかで throw したら残存 tmp を force 削除し、commit 済みは事前に読んだ `previousContent` で reverse 順に復元する（元ファイル不在時は削除で戻す）。`fsOps` 依存注入で write failure / rename failure を spec から注入してこの分岐を被覆する。
- **L-I229-004（silent catch 分離）**: `extractHeadings` の `catch { return []; }` は「ENOENT のみ空継続、その他 I/O は context 付き throw」に分離する。silent success を作らないことで、後段の hook / CI が失敗を取りこぼさない。
- **L-I229-005（実走で発覚: ESM warning）**: `generate-index.js` を ESM 化すると、skill-local `package.json {"type":"module"}` が無い場合に正常系 `pnpm indexes:rebuild` でも Node の `MODULE_TYPELESS_PACKAGE_JSON` warning が stderr に混入する。成功時 stderr が noisy だと decisive log の観測性が落ちるため、skill-local `package.json` を追加して warning-free 化する。
- **L-I229-006（import-safe CLI guard + named export）**: top-level 実行は `import.meta.url === pathToFileURL(process.argv[1] || "").href` でガードし、helper / generator を named export 化する。これで import 副作用なしに spec から直接 unit test でき、CLI 実行時のみ `process.exit(1)` させられる。
- **L-I229-007（decisive log の形）**: 失敗は `withIndexContext(indexFile, step, error)` で `[generate-index] <skill> / <index-file> <step> 失敗: <message>` 形式に正規化して throw し、CLI ガード `main().catch` が stderr 出力 + 非ゼロ exit する。「どの index の・どの step で・何が」を 1 行で特定できる形を守る。
