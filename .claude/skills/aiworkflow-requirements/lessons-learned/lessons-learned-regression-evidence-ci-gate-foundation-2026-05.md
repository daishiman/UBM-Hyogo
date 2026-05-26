# Lessons Learned — regression-evidence-ci-gate-foundation (2026-05)

> workflow: `docs/30-workflows/regression-evidence-ci-gate-foundation/`
> state: `spec_created / implementation / VISUAL / runtime_pending`
> upstream design source: `docs/30-workflows/ui-prototype-design-system-foundation/serial-07-regression-evidence/`

## L-RECGF-001 — top-level 昇格は archive ではなく upstream 並存

旧 sub-workflow `ui-prototype-design-system-foundation/serial-07-regression-evidence/` を archive せず、設計出典として保持しながら top-level `regression-evidence-ci-gate-foundation/` を実行 root として昇格させた。

- **Why**: 旧 sub-workflow は parallel-01..09 と並ぶ「設計章」の位置にあり、移動すると兄弟 workflow 群との設計参照整合が崩れる。
- **How to apply**: top-level 化する際は legacy-ordinal-family-register に「upstream source 並存」ケースとして NOTE 追記（§Current Alias Overrides 行追加は不要）。新規 citation は必ず top-level root を起点にする。
- **Pitfall**: archive と勘違いして `completed-tasks/` に移動すると upstream design 参照が断絶する。

## L-RECGF-002 — Playwright visual baseline は CI artifact 不採用、コミット必須

baseline PNG を CI artifact のみで管理する運用は採用せず、commit 必須とした。

- **Why**: artifact retention 期限切れで baseline 消失→regression 検出不可になる事故を防ぐ。Phase 9 §2 で明記。
- **How to apply**: visual regression workflow では `*-snapshots/*.png` を `.gitignore` から除外、PR review で diff 確認できる体制に倒す。
- **Pitfall**: CI artifact 運用は短期的に diff が軽くなるが、長期的に baseline 真正性が失われる。

## L-RECGF-003 — runtime evidence は user-gated を明示する

Playwright baseline 生成 / Phase 11 evidence 取得 / commit / push / PR / branch protection mutation の全てを user-gated に固定。

- **Why**: solo 開発でも runtime mutation を AI 自動実行に倒すと、誤 baseline コミットや誤 required check 設定が回避不能になる。
- **How to apply**: artifacts.json `metadata.runtime_boundary` に明示文を入れ、index.md / Phase 11 / Phase 13 の各箇所で user-gated を繰り返し明記する。
- **Pitfall**: spec_created で gate が green 表示されると runtime 取得まで自動で進んだと誤読されやすい。`runtime_pending` を artifacts.json と index.md の `workflow_state` に並記する。

## L-RECGF-004 — Phase 12 strict 7 outputs は実装前から雛形配置

`outputs/phase-12/{main, implementation-guide, system-spec-update-summary, documentation-changelog, unassigned-task-detection, skill-feedback-report, phase12-task-spec-compliance-check}.md` の 7 ファイルを spec_created 段階で全配置。

- **Why**: Phase 12 strict gate は 7 ファイルの物理存在を検証するため、後付け配置だと CI が常時 fail する。
- **How to apply**: artifacts.json `metadata.phase12_strict_outputs` で 7 path を SSOT 化し、`verify:phase12-compliance` が path リストと突合できる構造に揃える。
- **Pitfall**: 7 ファイルの中身が空でも path 存在で gate は通る。中身の充実は spec review で別途担保する。

## L-RECGF-005 — staging project から visual baseline spec は除外する

`apps/web/playwright.config.ts` で staging project の `testIgnore` に本 4 visual spec を追加。

- **Why**: staging は API smoke 専用 project であり、visual baseline は chromium project 単独で実行する設計境界。staging で混走させると baseline が staging URL に依存して再現性が壊れる。
- **How to apply**: visual regression spec を新規追加する際は、`playwright.config.ts` で staging から除外する 1 行を Phase 5 の実装ファイル一覧に明記する。spec 単独配置では運用が壊れる。
- **Pitfall**: config 編集を spec の「副産物」扱いにすると Phase 5 仕様書と diff drift を起こす。実装ファイル表に必ず明記。

## L-RECGF-006 — artifacts.json gates 構造は zod schema 通過と Phase 11 例示を二段で守る

artifacts.json は実 2 gates（Gate-A spec compliance / Gate-B runtime visual）構成で zod 通過。Phase 11 §4 schema 例の `G1..G6` 6 entry 構成は「拡張余地の例示」として残し、実 artifacts は最小実用構成に倒す。

- **Why**: 全 workflow を 6 gate に揃えると spec_created 段階で空 gate が大量に残り、`pending` が常態化して gate 健全性のシグナルが死ぬ。
- **How to apply**: artifacts.json は実行時点で意味のある gate のみ列挙。Phase 11 例示はテンプレートとして残し、実 artifacts と diff drift する場合は Phase 11 側に「実 artifacts は最小実用構成」と注記する。
- **Pitfall**: gate を 6 個並べると CI 不通過項目の優先度がぼやける。
