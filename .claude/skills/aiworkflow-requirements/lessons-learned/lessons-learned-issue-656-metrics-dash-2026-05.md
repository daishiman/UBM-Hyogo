# Lessons learned — Issue #656 metrics dash（2026-05-14）

## Scope

`u-fix-cf-acct-01-deriv-04-fu-03-d-fu-01-metrics-dash` で Cloudflare 7day summary の週次ダッシュボード化（aggregator script 新規追加 / `cf-audit-log-7day-summary.yml` の `week_starting` 追加 / 静的 HTML ダッシュボード描画 / Phase-11 screenshot 4 点）を実装した際の非自明な判断点を記録する。Companion to:

- workflow root: `docs/30-workflows/u-fix-cf-acct-01-deriv-04-fu-03-d-fu-01-metrics-dash/`
- changelog: `.claude/skills/aiworkflow-requirements/changelog/20260514-u-fix-cf-acct-01-deriv-04-fu-03-d-fu-01-metrics-dash.md`
- task-workflow ledger: `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md`（U-FIX-CF-ACCT-01-DERIV-04-FU-03-D-FU-01 行）
- artifact inventory: `.claude/skills/aiworkflow-requirements/references/workflow-u-fix-cf-acct-01-deriv-04-fu-03-d-fu-01-metrics-dash-artifact-inventory.md`
- 起票元 unassigned-task: `docs/30-workflows/unassigned-task/u-fix-cf-acct-01-deriv-04-fu-03-d-fu-01-metrics-dash.md`

## L-656-001 — `schema_version` dispatch の 5 軸ハンドリング

| Item | Value |
| --- | --- |
| 苦戦点 | upstream `hourly-run-7day-summary.json` の `schema_version` が将来 `"2.0.0"` に上がる可能性を考慮しつつ、`schema_version` 自体が欠落している過去ファイル / 非 string で混入したファイル / 想定外バージョンを単一 dispatch で扱う必要があった。素朴な `if (v === '1.0.0')` 分岐では「version 欠落=想定外」と「version=未対応」を区別できず、復旧手順が一意にならない。 |
| 採用判断 | 5 軸に明示分岐: (a) `"1.0.0"` accept、(b) `"1.0.0"` だが `week_starting` 欠落→`generated_at` から ISO week derivation、(c) `schema_version` missing→warn + skip（過去ファイル互換）、(d) 非対応バージョン文字列→throw（明示的 fail-fast）、(e) 非 string→throw（schema 破損として明示）。warn と throw を分けることで「skip 可能な欠落」と「致命的破損」を運用者が即判断できる。 |
| 適用範囲 | `scripts/cf-audit-log/dashboard/aggregate-weekly.ts`（このタスクで新規）。implementation-guide-part2 の Schema Behavior 表に正規化。 |
| 再利用基準 | 上流 artifact に `schema_version` を導入する Cloudflare observability 系 aggregator では、warn-skip（missing）/ throw（unsupported / non-string）/ derive（partial）を最低 3 軸に分けること。単一 throw は migration 期の運用を硬直化させる。 |

## L-656-002 — `week_starting` の native ISO week derivation

| Item | Value |
| --- | --- |
| 苦戦点 | `week_starting` を `generated_at` から導出する必要があったが、`date-fns` / `dayjs` 等の外部 lib 追加は本タスクの最小スコープ（mini-PR 相当）に反する。一方、JS の `Date` だけで ISO 8601 週番号（月曜起点 / 年跨ぎでの "53 週" 補正）を正しく実装するのは典型的な落とし穴。 |
| 採用判断 | 外部 lib 非依存で ISO week derivation を実装。月曜 anchor 化（`getUTCDay()` 0=Sun を 7 に補正）→ 木曜 anchor へシフト → 年初木曜との週差分で `week-NN` 算出、の標準 ISO 8601 アルゴリズムを採用。Cloudflare Workers ランタイム（V8）でも `Intl` 非依存で動作する。 |
| 適用範囲 | aggregator 内部 helper。test fixture は phase-04 `test-cases.md` に列挙（年初週 / 年末週の boundary case）。 |
| 再利用基準 | mini-PR スコープで日付処理が必要な場合、まず native `Date` で書けるか検討する。ISO week / UTC 境界 / locale 非依存 fmt は lib 不要で書ける。lib 追加は bundle size と Workers compatibility の二重コストを伴う。 |

## L-656-003 — VISUAL タスクで public route を持たない場合の evidence pattern

| Item | Value |
| --- | --- |
| 苦戦点 | 本タスクは `visualEvidence: VISUAL`（dashboard screenshot 4 点必須）だが、現 worktree に admin audit route が未実装で、production route に dashboard を生やすのは scope 越え。public route に置くと未認証で監視結果が露出する compliance risk。 |
| 採用判断 | `docs/dashboards/cf-audit-log-7day-trend/index.html` を静的 HTML として local evidence のみに位置付け、production route は作らない方針を implementation-guide §"なぜこの設計か" で明示。Phase-11 screenshot は `file://` ローカル開示で 4 枚取得し、`outputs/phase-11/evidence/screenshots/*.png` に固定。runtime evidence は `implemented_local_runtime_pending` のまま user-gated。 |
| 適用範囲 | `docs/dashboards/cf-audit-log-7day-trend/index.html` + `outputs/phase-11/evidence/screenshots/`。本パターンは将来 admin UI 実装時に同 HTML を embed/promote 可能。 |
| 再利用基準 | VISUAL タスクで public/admin route が未整備の Cloudflare observability 系では、(1) public 露出禁止、(2) `docs/dashboards/<name>/index.html` を local-only static HTML として正本化、(3) Phase-11 で `file://` screenshot を evidence 化、(4) workflow_state を `implemented_local_runtime_pending` に保つ、の 4 点セットを採用すること。 |

## L-656-004 — CLOSED issue への PR 文脈は `Refs` のみ

| Item | Value |
| --- | --- |
| 苦戦点 | Issue #656 / #549 / #586 はいずれも CLOSED。通常の `Closes #N` / `Fixes #N` / `Resolves #N` を PR body に書くと GitHub が自動 reopen を試み、close 履歴が荒れる。 |
| 採用判断 | PR body / commit message では `Refs #549, Refs #586, Refs #656` の `Refs` keyword のみを使用。`Closes/Fixes/Resolves` は禁止語彙として `implementation-guide.md` の頭注に明示。 |
| 適用範囲 | 本タスクの全 artifact（`phase-13/pr-body.md`、implementation-guide 各部、changelog）で統一。 |
| 再利用基準 | CLOSED issue を follow-up 起点として参照する Workflow では、PR 連携 keyword は `Refs` 一択。再 open は user 明示承認時のみ、別 commit で `gh issue reopen` を実行する。 |

## L-656-005 — `outputs/artifacts.json` と root `artifacts.json` の byte-identical parity

| Item | Value |
| --- | --- |
| 苦戦点 | Phase-12 完了時に workflow root の `artifacts.json` と `outputs/artifacts.json` の二重管理が発生し、片方だけ state 遷移を更新して drift する事故が起きやすい。skill-feedback-report の検証で「parity が必須」と判定された。 |
| 採用判断 | 両 file を **byte-identical** に保つことを workflow rule とする。state 遷移時は両方を同時編集し、Phase-12 verification 終端で `diff -q artifacts.json outputs/artifacts.json` が exit 0 を返すことを必須 gate に組み込む。 |
| 適用範囲 | 本タスクの `artifacts.json` / `outputs/artifacts.json`（parity 確認済）。 |
| 再利用基準 | workflow root と outputs/ に同名 manifest を置く運用では、必ず byte-identical 規約を明示し、phase-12 compliance check 内で `diff -q` 結果を artifact として固定すること。片方を SoT とする運用は drift を必ず生む。 |
