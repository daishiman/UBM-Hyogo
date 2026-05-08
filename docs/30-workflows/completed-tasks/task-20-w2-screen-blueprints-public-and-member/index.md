# task-20-w2-screen-blueprints-public-and-member — タスク仕様書 index

実装区分: ドキュメントのみ実装（CONST_004 適用 — コード変更なし、実 docs 2 件を同一サイクルで作成・検証）

## 判定根拠（docs-only 区分の根拠）

- 元タスクの目的は `docs/00-getting-started-manual/specs/09e-screen-blueprints-public.md` と `09f-screen-blueprints-member.md` の **2 markdown ファイル新規作成のみ**。
- 元タスク §3「変更対象ファイル表」で C（新規）は markdown 2 件のみ、コード変更（`apps/`, `packages/`）一切なし。
- 元タスク §0.5「不変条件」で `pages-public.jsx` / `pages-member.jsx` は **凍結正本** と明記、コード改変禁止。
- 検証は markdown 構造 grep / 視覚値混入 grep / コピー原文 grep / API trace check / mermaid block count のみで、ビルド・typecheck・unit test 不要。
- したがって本タスクは `taskType=docs-only` / `visualEvidence=NON_VISUAL` を採用する。ただし docs-only は「コード変更なし」を意味し、`09e` / `09f` 実ドキュメント成果物を後段へ送る理由にはしない。

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | task-20-w2-screen-blueprints-public-and-member |
| タスクID | task-doc-w2-screen-blueprints-public-and-member-001 |
| ディレクトリ | docs/30-workflows/task-20-w2-screen-blueprints-public-and-member |
| Issue |  |
| 親ワークフロー | ui-prototype-alignment-mvp-recovery |
| 元タスク | docs/30-workflows/ui-prototype-alignment-mvp-recovery/03-spec-source/task-20-w2-par-screen-blueprints-public-and-member.md |
| Wave | W2（03-spec-source） |
| 実行種別 | parallel-capable（task-06 / task-07 / task-08 / task-19 / task-21 / task-22 と並列実行可） |
| 作成日 | 2026-05-07 |
| 担当 | Tech Writer |
| 状態 | implemented-local / Phase 13 blocked_pending_user_approval |
| タスク種別 | docs-only / Spec authoring |
| 実装区分 | ドキュメントのみ実装（コード変更なし、09e / 09f 実体作成済） |
| 優先度 | priority:high（task-11 / task-12 / task-13 / task-14 の前提となる） |
| 推定工数 | 1.0 人日 |

## purpose

`docs/00-getting-started-manual/claude-design-prototype/pages-public.jsx`（472 行・凍結正本）と `pages-member.jsx`（373 行・凍結正本）の **公開層 6 routes + 会員層 2 routes（合計 8 画面）** を `09e-screen-blueprints-public.md` / `09f-screen-blueprints-member.md` の 2 ファイルに **完全再現**する。

各画面は次の 7 構成（X.1 〜 X.7）を持つ blueprint として 1 セクションに閉じ込め、後続 task-11..14 が「09e/09f §X を読んで 1 ファイル書ける」決定論的状態を作る。

- X.1 prototype 由来（JSX inline 一字一句転記）
- X.2 コピー原文（一字一句）
- X.3 状態遷移（mermaid stateDiagram-v2）
- X.4 API 接続表（現行 API 正本と一致）
- X.5 props / 内部 state
- X.6 a11y
- X.7 token / primitive / icon 参照（09b / 09c / 09d / 09a への link）

token は `--ubm-*` 名のみで参照する（値は 09b、primitive 仕様は 09c、icon は 09d）。視覚値（HEX / oklch / px / bg-arbitrary-class）は本タスクの成果物 markdown にも、本仕様書群にも 0 件で含めない。

## scope in / out

### scope in

- `docs/00-getting-started-manual/specs/09e-screen-blueprints-public.md`（公開 6 画面 + §99 の完全 blueprint）の新規作成
- `docs/00-getting-started-manual/specs/09f-screen-blueprints-member.md`（会員 2 画面 + §99 の完全 blueprint）の新規作成
- 公開 6 routes（`/`, `/(public)/members`, `/(public)/members/[id]`, `/(public)/register`, `/privacy`, `/terms`）+ 会員 2 routes（`/login`, `/profile`）の合計 8 画面 blueprint
- 各画面の実装可能 schema（ルート / レイアウト / セクション分解 / JSX / 状態 / API / interaction / a11y / prototype 出典）の充足。派生静的画面は API なしを明記する compact schema 可
- §99「不採用要素」表（TweaksPanel / theme switcher / AvatarStoreProvider#localStorage / gas-prototype 由来振る舞い）
- 9 series 内 link 戦略（09a / 09b / 09c / 09d への参照ルール統一）

### scope out

- `pages-public.jsx` / `pages-member.jsx` の改変（凍結正本）
- 実装コード（task-11..14）
- token 値（task-08 / 09b）
- primitive 仕様（task-19 / 09c）
- icon カタログ（task-22 / 09d）
- admin 画面（task-21 / 09g）
- shell / fixtures（task-22 / 09h）
- 新 endpoint 追加 / API 仕様変更 / D1 schema 変更 / Google Form 仕様変更

## dependencies

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流（gate） | task-01 scope-gate-all-screens | 19 routes scope の確定 |
| 並列 | task-06 / task-07 / task-08 / task-19 / task-21 / task-22 | spec source wave 内の独立 markdown 作成タスク群 |
| 下流 | task-11（public top + member list） | 09e §1 / §2 を実装根拠として参照 |
| 下流 | task-12（detail + register） | 09e §3 / §4 を実装根拠として参照 |
| 下流 | task-13（login） | 09f §1 を実装根拠として参照 |
| 下流 | task-14（my profile + requests） | 09f §2 を実装根拠として参照 |
| 下流 | task-06（09-ui-ux.md） | 09e / 09f を link 先として参照 |

## refs

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ui-prototype-alignment-mvp-recovery/03-spec-source/task-20-w2-par-screen-blueprints-public-and-member.md | 元タスク（本仕様書の正本ソース） |
| 必須 | docs/30-workflows/ui-prototype-alignment-mvp-recovery/SCOPE.md | 19 routes scope / diff scope 規律 |
| 必須 | docs/30-workflows/ui-prototype-alignment-mvp-recovery/outputs/phase-1/phase-1.md | §3 routes 一覧 |
| 必須 | docs/30-workflows/ui-prototype-alignment-mvp-recovery/outputs/phase-3/phase-3.md | §2 API 接続表 / §3 §5.2 派生ルール |
| 必須 | docs/00-getting-started-manual/claude-design-prototype/pages-public.jsx | 転記元（L1-L472） |
| 必須 | docs/00-getting-started-manual/claude-design-prototype/pages-member.jsx | 転記元（L1-L373） |
| 参考 | docs/00-getting-started-manual/specs/09b-design-tokens.md | token 値の正本（link 先） |
| 参考 | docs/00-getting-started-manual/specs/09c-primitives.md | primitive 仕様（link 先） |
| 参考 | docs/00-getting-started-manual/specs/09d-icons.md | icon カタログ（link 先） |
| 参考 | docs/00-getting-started-manual/specs/09a-prototype-map.md | 行範囲 mapping（link 先） |

## AC（Acceptance Criteria）

- AC-1: `09e-screen-blueprints-public.md` が新規作成され、公開 6 画面 + §99 の完全 blueprint として存在する。
- AC-2: `09f-screen-blueprints-member.md` が新規作成され、会員 2 画面 + §99 の完全 blueprint として存在する。
- AC-3: 09e に §1〜§6 + §99（公開 6 画面 + 不採用）が揃う（`grep -cE '^## [0-9]+\. ' 09e-...md` → 7）。
- AC-4: 09f に §1〜§2 + §99（会員 2 画面 + 不採用）が揃う（`grep -cE '^## [0-9]+\. ' 09f-...md` → 3）。
- AC-5: 全 8 画面で実装に必要な 7 以上の節が揃い、節タイトルの責務がルート / レイアウト / JSX / 状態 / API / interaction / a11y / 出典のいずれかに対応する。
- AC-6: login 5+1 状態（input / sent / unregistered / deleted / rules_declined / error）が 09f §1.3 mermaid に列挙される。
- AC-7: `/profile` の 4 領域（banner / summary / request / delete）が 09f §2 で網羅される。
- AC-8: register / privacy / terms は phase-3 §3 §5.2 派生ルールを正本転記する（独自 primitive 生成禁止）。
- AC-9: 視覚値 grep gate（`#[0-9a-fA-F]{3,8}\b` / `oklch\(` / `\b[0-9]+px\b` / `\bbg-\[`）は fenced JSX prototype 転記ブロックを除く仕様本文で 0 件。凍結 prototype の一字一句転記を優先し、prototype 内の既存値は drift として扱わない。
- AC-10: 現行 API 正本（`apps/api/src/routes/*`、apps/web BFF、`aiworkflow-requirements/references/api-endpoints.md`）と §X.4 の API 表が一致する。古い phase-3 §2 endpoint 名は historical input として扱い、現行実装で上書きする。
- AC-11: consent キー（`publicConsent` / `rulesConsent`）/ `responseEmail` system field / `apps/web` から D1 直接アクセス禁止 等の不変条件が反映される。
- AC-12: markdown structural validation は実行済。project に markdown lint script が未定義の場合は `PASS_WITH_SUBSTITUTION` として artifacts JSON parse / grep gates / link checklist を代替証跡にする。
- AC-13: 09c / 09b / 09d / 09a への link が全画面 X.7 で記述される。

## 13 phases

| Phase | 名称 | ファイル | 概要 |
| --- | --- | --- | --- |
| 1 | 要件定義 | phase-01.md | 真の論点 Q1〜Q6 / Schema Ownership 宣言 / AC-1〜13 確定 / automation-30 4 条件評価 |
| 2 | 設計 | phase-02.md | 09e / 09f 章立て fixed schema / 8 画面 prototype 行範囲 mapping / mermaid template / 不採用要素表 / CONST_005 docs-only 適用 |
| 3 | 設計レビュー | phase-03.md | 代替案比較（A 統合 / B 画面ごと / C 公開・会員分離=採用）/ 並列タスク調整（task-06/07/08/19/21/22） |
| 4 | テスト戦略 | phase-04.md | markdown 構造検証 grep / 視覚値混入禁止 grep / API trace check / コピー原文 grep / mermaid block count |
| 5 | 実装ランブック | phase-05.md | prototype 読み込み → 09e §1〜§6 / §99 → 09f §1〜§2 / §99 → 検証 grep 実行 |
| 6 | 異常系検証 | phase-06.md | コピー原文ドリフト / API 表ドリフト / 視覚値混入 / login 5+1 状態欠落 / 不採用要素混入 / mermaid 構文エラー |
| 7 | AC マトリクス | phase-07.md | DoD §8 各項目 × 検証コマンド × 不変条件 × evidence の N:M トレース |
| 8 | DRY 化 | phase-08.md | 9 series 内 link 戦略 / X.7 参照節 format 固定 |
| 9 | 品質保証 | phase-09.md | grep gate / markdown validation / link check / 行数 inventory |
| 10 | 最終レビュー | phase-10.md | GO/NO-GO 判定基準（元タスク §8 DoD 全項目） |
| 11 | 実装 smoke（NON_VISUAL 縮約版）| phase-11.md | 09e/09f 新規作成 + grep gate evidence 取得 |
| 12 | ドキュメント更新 | phase-12.md | implementation-guide / system-spec-update / changelog / unassigned / skill-feedback / compliance-check |
| 13 | PR 作成 | phase-13.md | approval gate / PR template / commit-push / PR open ゲート分離 |

## outputs

```
outputs/phase-01/main.md
outputs/phase-02/main.md
outputs/phase-02/section-schema.md
outputs/phase-02/changed-files.md
outputs/phase-03/main.md
outputs/phase-03/alternatives-comparison.md
outputs/phase-04/main.md
outputs/phase-04/test-matrix.md
outputs/phase-05/main.md
outputs/phase-05/runbook.md
outputs/phase-06/main.md
outputs/phase-07/main.md
outputs/phase-07/ac-matrix.md
outputs/phase-08/main.md
outputs/phase-09/main.md
outputs/phase-09/grep-gate-result.md
outputs/phase-10/main.md
outputs/phase-11/main.md
outputs/phase-11/manual-smoke-log.md
outputs/phase-11/link-checklist.md
outputs/phase-11/evidence/grep-visual-values.log
outputs/phase-11/evidence/grep-api-trace.log
outputs/phase-11/evidence/grep-copy-text.log
outputs/phase-11/evidence/markdown-lint.log
outputs/phase-11/evidence/wc-lines.log
outputs/phase-12/main.md
outputs/phase-12/implementation-guide.md
outputs/phase-12/system-spec-update-summary.md
outputs/phase-12/documentation-changelog.md
outputs/phase-12/unassigned-task-detection.md
outputs/phase-12/skill-feedback-report.md
outputs/phase-12/phase12-task-spec-compliance-check.md
outputs/phase-13/main.md
outputs/phase-13/local-check-result.md
outputs/phase-13/change-summary.md
outputs/phase-13/pr-info.md
outputs/phase-13/pr-creation-result.md
outputs/phase-13/pr-template.md
```

## services / secrets

| 区分 | 値 | 配置 | 備考 |
| --- | --- | --- | --- |
| Web | apps/web (Next.js via @opennextjs/cloudflare) | Worker | 本タスクは触らない（参照のみ） |
| API | apps/api (Hono) | Worker | 接続先のみ（変更なし） |
| Secrets | なし | — | 本タスクは markdown 2 件のみ、secret 取扱なし |

## invariants touched

- **#1** 実フォームの schema をコードに固定しすぎない: 09e §4 register で responderUrl link を扱う際に form schema を spec に焼き付けない（phase-3 §3 §5.2 派生ルール正本転記）
- **#2** consent キーは `publicConsent` / `rulesConsent` 統一（09e §4 register / 09f §2 profile で参照）
- **#3** `responseEmail` は system field（09e §4 / 09f §2 で参照時に明記）
- **#4** admin-managed data 分離（09e/09f は public+member layer のみ、admin schema に触れない）
- **#5** D1 への直接アクセスは `apps/api` に閉じる（09e/09f §X.4 API 表は `/public/*` `/me/*` `/auth/*` のみ参照、D1 binding に触れない）
- **#6** GAS prototype を本番仕様に昇格させない（§99 不採用要素表で明示）
- **#7** MVP では Google Form 再回答を本人更新の正式な経路とする（09e §4 register で responderUrl link を扱う）
- **CLAUDE.md secrets 管理**: 本タスクは markdown のみで secret に触らない

## Schema / 共有コード Ownership 宣言

| 範囲 | 編集権 | 備考 |
| --- | --- | --- |
| `docs/00-getting-started-manual/specs/09e-screen-blueprints-public.md` | **本タスク** | 新規作成（公開 6 画面 + §99、行数は evidence 記録のみ） |
| `docs/00-getting-started-manual/specs/09f-screen-blueprints-member.md` | **本タスク** | 新規作成（会員 2 画面 + §99、行数は evidence 記録のみ） |
| `docs/00-getting-started-manual/specs/09-ui-ux.md` | task-06 | 09e / 09f は link 先として参照されるのみ |
| `docs/00-getting-started-manual/specs/09a-prototype-map.md` | task-07 | 09e / 09f §X.1 から行範囲 link で参照のみ |
| `docs/00-getting-started-manual/specs/09b-design-tokens.md` | task-08 | 09e / 09f §X.7 から token 名で参照のみ |
| `docs/00-getting-started-manual/specs/09c-primitives.md` | task-19 | 09e / 09f §X.7 から primitive 名で参照のみ |
| `docs/00-getting-started-manual/specs/09d-icons.md` | task-22 | 09e / 09f §X.7 から icon 名で参照のみ |
| `docs/00-getting-started-manual/specs/09g-screen-blueprints-admin.md` | task-21 | 本タスクは触らない（admin 画面） |
| `docs/00-getting-started-manual/claude-design-prototype/pages-public.jsx` | （凍結） | 本タスクで改変しない |
| `docs/00-getting-started-manual/claude-design-prototype/pages-member.jsx` | （凍結） | 本タスクで改変しない |

## completion definition

- Phase 1〜12 が completed、Phase 11 で 09e / 09f 新規作成 + grep gate evidence が `PASS_DOCS_ONLY_ARTIFACTS_SYNCED`
- AC-1〜13 が Phase 7 マトリクスで完全トレース
- automation-30 4 条件評価（矛盾なし / 漏れなし / 整合性あり / 依存関係整合）が Phase 1 / Phase 12 で整合
- task-11 / task-12 / task-13 / task-14 の前提が満たされ、09e / 09f が「§X を読んで 1 ファイル書ける」決定論的状態で提供されている
- Phase 13 は user 承認待ち。commit / push / PR 作成は未実行で `blocked_pending_user_approval`

## lifecycle states

| state | 意味 | completed 判定 |
| --- | --- | --- |
| spec_created | Phase 1〜13 の仕様書のみ作成済み（09e / 09f 未作成） | 不可 |
| design_locked | Phase 1〜3 完了、設計レビュー PASS | 不可 |
| implementation_in_progress | Phase 5 ランブック実行中（09e / 09f を執筆中） | 不可 |
| implemented | 09e / 09f が新規作成され、Phase 9 全ゲート PASS | 不可 |
| smoke_passed | Phase 11 evidence 取得、AC-1〜13 充足 | Phase 11 完了可 |
| completed | smoke_passed + Phase 12 same-wave sync + Phase 13 user approval | 可 |

現在状態は `implemented-local / blocked_pending_user_approval`（09e / 09f 本体と Phase 11/12 evidence は同一サイクルで同期済み、commit / push / PR は user 承認待ち）。

## CONST_007（先送り禁止）の遵守

全 15 ファイル（index.md / artifacts.json / phase-01〜13.md）に加え、09e / 09f 実ドキュメント成果物と Phase 11/12 outputs を本サイクル内で完成させる。「Phase 2 で対応」「将来タスク」「バックログ送り」等の先送り表現を使用しない。

## diff scope 規律（task-01 反映 / 2026-05-07）

`SCOPE.md §6 diff scope 規律 / archive rule` を遵守する。本 task 完了前に以下を必ず確認:

- `git diff --name-only main...HEAD` の出力が、本 task 仕様 §3「変更対象ファイル」 + 本 task package（`docs/30-workflows/task-20-w2-screen-blueprints-public-and-member/`）配下のみで構成されていること
- 完了済み workflow dir を整理する場合は `git mv <dir> docs/30-workflows/completed-tasks/<dir>` でアーカイブ（`git rm -r` 純削除は禁止）

## 補足

- 元タスク §0.7 で宣言された 09e / 09f の章立てを本仕様書 phase-02 で再掲し、§X.1〜§X.7 fixed schema として lock する。
- 視覚値（HEX / oklch / px / bg-arbitrary-class）は元タスク §0.5 不変条件 3 を仕様書自身にも適用し、本仕様書群（index.md / artifacts.json / phase-01〜13.md）にも 0 件で含めない。
- 9 series 内 link 戦略（X.7 参照節 format 固定）は phase-08 で統一する。
