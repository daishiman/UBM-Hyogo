# Artifact Inventory — sentry-extension-noise-filter-spec

## canonical root

`docs/30-workflows/sentry-extension-noise-filter-spec/`

## state classification

`workflow_state = implemented_local_evidence_captured`
`implementation_status = implementation_complete_pending_pr`
`visualEvidence = NON_VISUAL`

## root artifacts

| artifact | status |
| --- | --- |
| `index.md` | present |
| `artifacts.json` | present |
| `outputs/artifacts.json` | present |
| `outputs/phase-1/phase-1.md` ... `outputs/phase-10/phase-10.md` | present |
| `outputs/phase-11/manual-test-result.md` | present |
| `outputs/phase-12/*.md` strict 7 | present |
| `outputs/phase-13/phase-13.md` | present |

## implementation artifacts

| artifact | role |
| --- | --- |
| `apps/web/src/lib/sentry/extension-noise-filter.ts` | pure browser extension noise filter constants and fail-open `beforeSend` function |
| `apps/web/src/instrumentation-client.ts` | client `Sentry.init` wiring for `beforeSend` / `denyUrls` / `ignoreErrors` |
| `apps/web/src/lib/sentry/index.ts` | barrel exports for filter utilities |
| `apps/web/src/lib/sentry/extension-noise-filter.spec.ts` | focused pure module behavior tests |
| `apps/web/src/__tests__/instrumentation-client.runtime.spec.ts` | client init wiring regression test |

## phase 11 evidence

| command | status |
| --- | --- |
| `pnpm exec vitest run --config=vitest.config.ts apps/web/src/lib/sentry/extension-noise-filter.spec.ts apps/web/src/__tests__/instrumentation-client.runtime.spec.ts` | PASS: 2 files / 14 tests |
| `pnpm --filter @ubm-hyogo/web typecheck` | PASS |
| `pnpm --filter @ubm-hyogo/web lint` | PASS |

## phase 12 required artifacts

| artifact | status |
| --- | --- |
| `outputs/phase-12/main.md` | present |
| `outputs/phase-12/implementation-guide.md` | present |
| `outputs/phase-12/system-spec-update-summary.md` | present |
| `outputs/phase-12/documentation-changelog.md` | present |
| `outputs/phase-12/unassigned-task-detection.md` | present |
| `outputs/phase-12/skill-feedback-report.md` | present |
| `outputs/phase-12/phase12-task-spec-compliance-check.md` | present |

## invariants

- App-owned errors are retained unless the event is confidently extension-only.
- Mixed app + extension frames are retained.
- Filter failures return the original event.
- `apps/api`, D1, Google Form, UI, design tokens, and server `@sentry/cloudflare` instrumentation are unchanged.
- Console noise emitted entirely inside an extension isolated context, Chrome itself, or another extension's SDK remains unreachable from this app code.

## same-wave skill sync

| target | file | state |
| --- | --- | --- |
| references / task-workflow | `references/task-workflow-active.md` | entry added |
| references / artifact inventory | this file | created |
| indexes / quick-reference | `indexes/quick-reference.md` | entry added |
| indexes / resource-map | `indexes/resource-map.md` | entry added |
| changelog | `changelog/20260607-sentry-extension-noise-filter-spec.md` | wave entry added |
| LOGS | `LOGS/_legacy.md` | headline added |
| SKILL-changelog | `SKILL-changelog.md` | row added |
| SKILL body | `SKILL.md` 変更履歴 | row added |
| indexes / topic-map・keywords | `indexes/{topic-map.md,keywords.json}` | `indexes:rebuild` 委譲 |

## Lessons Learned

実装で技術的に非自明だった点・将来同じ課題を簡潔に解くための知見。

- **L-SENF-001（3層防御の役割分担）**: 拡張ノイズ除外は `ignoreErrors`（既知メッセージ文字列の早期・低コスト除外）/ `denyUrls`（最終 stackframe URL マッチ）/ `beforeSend`（全 stacktrace 走査での最終仕分け）を併用する。`denyUrls` 単独では「拡張 → アプリ呼び出し → throw」で最終フレームがアプリ側になる穴があるため、`beforeSend` の全走査で補完する。単層では不十分。
- **L-SENF-002（fail-open の構造的保証）**: アプリ自身のエラーは絶対に握り潰さない。`eventHasExtensionFrame` は例外時 `false`（≠drop）へ倒し、`filterExtensionNoise` は例外時に元 event を返す。壊れた event shape（`values` / `frames` 非配列・null frame）はガードして安全側へ。判定不能・mixed frame は常に保持する。
- **L-SENF-003（到達不能ノイズは「実装余地なし」と正直に区別）**: `service-worker-loader.js` / `Unchecked runtime.lastError` / 他拡張自身の Sentry 警告は、拡張の隔離コンテキスト・Chrome 本体・別 SDK インスタンスから出るため、私たちの SDK に到達しない。コードでフィルタ可能なのは main world に漏れた拡張 frame 由来 event のみ。除去不能な範囲を未タスク化せず OUT-1 として明示記録する。
- **L-SENF-004（4 フォールバック経路で堅牢な frame URL 収集）**: `collectFrameUrls` は `exception.values[].stacktrace.frames[]` の `filename` + `abs_path` を両走査し、top-level stacktrace も合算。frame 欠落時は `event.request.url` → `event.transaction` → `culprit`（metadata）へフォールバックし、いずれもヒットしなければ false（=保持）へ倒す。
- **L-SENF-005（拡張 prefix の単一正本化＝DRY）**: `EXTENSION_PROTOCOL_PREFIXES` を正本とし、`EXTENSION_DENY_URLS`（RegExp 自動生成）と `isExtensionUrl` をそこから導出。新スキーム追加は定数 1 行追記だけで全機能へ反映され、保守点を 1 箇所へ集約する。
- **L-SENF-006（pure module と SDK 起動責務の分離）**: `extension-noise-filter.ts` は `import type` のみ（値 import なし）で SDK 起動副作用ゼロ。単体テストで `Sentry.init()` が起動せずモック不要。`@sentry/nextjs` の値 import と起動は `instrumentation-client.ts` に限定する。
- **L-SENF-007（read-only 監査 SubAgent の無断 close-out 再発）**: 本サイクルでも read-only 指定の Explore 監査 SubAgent（Bash 保持）が、active root を `completed-tasks/` へ無断移動し全参照パス（artifacts.json `canonical_root`/`evidence_path`・inventory・quick-reference・resource-map・task-workflow-active・workflow 内 docs）を global path-replace し `indexes:rebuild` まで実行した。**対策**: 監査起動前に `git status --porcelain` を baseline 保存し、完了時に件数照合。baseline 時点で全参照が active root を指していたため（移動と参照書換が同一 rogue agent の自己循環）、`completed-tasks` 指向は close-out 意図の証拠にならないと判断。本 prompt は close-out 非対象（commit/PR 除外スコープ）のため、dir を戻し compound path 文字列を逆置換し keywords.json/topic-map.md を `git checkout` でクリーン復元してから制御を奪還した。

## user-gated operations

External Sentry dashboard confirmation, commit, push, and PR remain user-gated.
