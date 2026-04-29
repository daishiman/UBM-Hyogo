# Phase 7: AC マトリクス（受入条件 × Phase 1-13 マッピング）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | テストカバレッジ 80% 強制 (coverage-80-enforcement) |
| Phase 番号 | 7 / 13 |
| Phase 名称 | AC マトリクス（AC-1〜AC-14 を Phase 1-13 にマッピング） |
| 作成日 | 2026-04-29 |
| 前 Phase | 6 (異常系検証) |
| 次 Phase | 8 (DRY 化) |
| 状態 | pending |
| タスク種別 | implementation / NON_VISUAL / quality_governance |

## 目的

`index.md §受入条件` で確定した AC-1〜AC-14（一律 80% 閾値 / coverage-guard.sh / stderr 出力 / package script / CI 2 段階 gate / lefthook / baseline / 3 段階 PR / UT-GOV-004 連携 / 正本同期 / coverage-standards.md 反映 / `apps/web` `packages/*` 可視化 / 4 条件 / Phase 完全一致）を、Phase 1〜13 のどこで・どの T（Phase 4 / 6 由来）で・どの成果物で・どう満たすかを **マトリクスとして固定する**。本 Phase は AC の追跡可能性確保のみで、実走を伴わない。

## 実行タスク

1. AC-1〜AC-14 を一覧化し、対応 Phase / T / 成果物 / 検証方法を 1:N マッピング表として固定する。
2. AC × Phase の対応表を作成し空セルが無いことを確認する。
3. AC × T（Phase 4 happy + Phase 6 fail）の対応表で全 AC が最低 1 件の T で被覆されることを確認する。
4. AC × 成果物の対応表で全 AC が最低 1 件の成果物に紐付くことを確認する。
5. AC ごとの検証方法（unit test / integration test / manual smoke / CI artifact 確認 / grep）を分類し記述する。
6. AC 未カバー検出時の対応手順（Phase 戻し / unassigned-task 化 / blocker 化）を記述する。
7. `outputs/phase-07/main.md` にマトリクスを集約する。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/coverage-80-enforcement/index.md | AC-1〜AC-14 / Phase 一覧 |
| 必須 | docs/30-workflows/coverage-80-enforcement/phase-04.md | T1〜Tn（happy path / テスト戦略） |
| 必須 | docs/30-workflows/coverage-80-enforcement/phase-06.md | T（fail path / 異常系） |
| 必須 | docs/30-workflows/coverage-80-enforcement/outputs/phase-02/main.md | adapter / coverage-guard.sh I/O / 3 段階 PR |
| 必須 | docs/30-workflows/coverage-80-enforcement/outputs/phase-03/main.md | 設計レビュー結果 / R-1〜R-4 |
| 参考 | docs/30-workflows/ut-gov-001-github-branch-protection-apply/phase-07.md | AC マトリクス フォーマット参照 |
| 参考 | .claude/skills/task-specification-creator/references/quality-gates.md | Phase 完了ゲート |

## AC × Phase × T × 成果物 マトリクス（仕様確定先）

> 本表は `outputs/phase-07/main.md` に詳細展開する。本仕様書には観点・分類のみ記載。

| AC | 内容（要約） | 仕様確定 Phase | 検証 Phase（T） | 主成果物 | 検証方法 |
| --- | --- | --- | --- | --- | --- |
| AC-1 | 全 package 一律 80%（4 metric）が `vitest.config.ts` で固定 | 2, 5 | 4 (T-thresholds), 11 | vitest.config.ts / outputs/phase-05 | CI artifact 確認 + jq |
| AC-2 | `coverage-guard.sh` 新設・`pnpm -r test:coverage` 集計・80% 未達時 exit 1 | 2, 5 | 4 (T-guard-happy), 6 (T-guard-fail), 11 | scripts/coverage-guard.sh / outputs/phase-05 | unit (bats / shellspec) + manual smoke |
| AC-3 | 80% 未達時、不足ファイル top10 + テスト雛形パスを stderr 出力 | 2, 5 | 6 (T-stderr-format), 11 | outputs/phase-05 / outputs/phase-11/manual-smoke-log.md | manual smoke + grep |
| AC-4 | 全 package に `test` / `test:coverage` script 統一フォーマット定義 | 2, 5 | 4 (T-script-presence) | apps/*/package.json / packages/*/package.json | jq による package.json 走査 |
| AC-5 | `.github/workflows/ci.yml` に `coverage-gate` job、PR① soft / PR③ hard 切替仕様 | 2, 5, 13 | 4 (T-ci-soft), 11 (T-ci-hard), 13 | .github/workflows/ci.yml / outputs/phase-13/pr1-runbook.md / pr3-runbook.md | CI artifact 確認 |
| AC-6 | `lefthook.yml` pre-push に coverage-guard 追加、skip 抜け道なし | 2, 5 | 6 (T-skip-blocked), 11 | lefthook.yml / outputs/phase-05 | manual smoke + grep |
| AC-7 | T0 baseline 計測手順（artifact / package 別未達リスト / Phase 11 証跡化） | 2, 11 | 11 (T-baseline) | outputs/phase-11/coverage-baseline-summary.md | manual smoke + artifact upload |
| AC-8 | 3 段階 PR 段取り（PR① soft / PR② テスト追加 / PR③ hard）と各 PR merge 前提 | 2, 5, 13 | 13 | outputs/phase-13/pr{1,2,3}-runbook.md | manual review |
| AC-9 | hard gate 化時 `required_status_checks.contexts` への coverage job 登録（UT-GOV-001 / 004 連携） | 2, 13 | 13 | outputs/phase-13/pr3-runbook.md | manual smoke + gh api 突合 |
| AC-10 | `quality-requirements-advanced.md` の差分（85%/65% → 一律 80%）が Phase 12 で正本反映 | 2, 12 | 12 | outputs/phase-12/system-spec-update-summary.md | grep + diff |
| AC-11 | `coverage-standards.md` から `scripts/coverage-guard.sh` 参照追記 | 2, 12 | 12 | outputs/phase-12/system-spec-update-summary.md | grep |
| AC-12 | `apps/web` / `packages/*` のテスト不足 baseline 可視化手順 | 2, 6, 11 | 6 (T-uncovered-list), 11 | outputs/phase-11/coverage-baseline-summary.md | manual smoke + jq 集計 |
| AC-13 | 4 条件（価値性 / 実現性 / 整合性 / 運用性）が Phase 1 / 3 で PASS | 1, 3 | - | outputs/phase-01/main.md / outputs/phase-03/main.md | manual review |
| AC-14 | Phase 1〜13 が `artifacts.json` `phases[]` と完全一致 | all | 9, 10 | artifacts.json | validate-phase-output.js |

> 空セルなし。AC-13 は仕様確定そのものが評価対象のため検証 Phase は無し（Phase 1 / 3 で評価済み）。

## 検証方法分類（AC ごと）

| 検証方法 | 対応 AC | 補足 |
| --- | --- | --- |
| unit test (bats / shellspec) | AC-2 | `coverage-guard.sh` の関数単位テスト |
| integration test (vitest --coverage) | AC-1, AC-4, AC-12 | 各 package の test:coverage 実走 |
| manual smoke | AC-2, AC-3, AC-6, AC-7, AC-9, AC-12 | Phase 11 で実走 |
| CI artifact 確認 | AC-1, AC-5, AC-7, AC-12 | `coverage-summary.json` upload + actions log |
| grep / jq | AC-3, AC-4, AC-6, AC-10, AC-11 | 仕様書 / package.json / config の文字列照合 |
| validate-phase-output.js | AC-14 | Phase output 整合の機械検証 |
| manual review | AC-8, AC-13 | 段取り / 4 条件評価 |

## AC 未カバー検出時の対応手順

| 検出タイミング | 対応 |
| --- | --- |
| Phase 7 マトリクス作成中に空セル発見 | 該当 AC を担当 Phase まで戻し、設計を補強。`outputs/phase-07/main.md` の TODO リストに記載 |
| Phase 9 / 10 の最終 GO/NO-GO で AC PASS 不能と判明 | blocker 化（Phase 10 §blocker 判定基準）し、Phase 5 / 6 へ差し戻し |
| Phase 11 smoke で AC-7 / AC-12 の baseline 取得失敗 | NO-GO 条件 #2（30% 下回り）を発動し、PR② を細分化 |
| Phase 12 で AC-10 / AC-11 の正本反映漏れ判明 | `documentation-changelog.md` で差分追記、Phase 13 PR description で再確認 |
| Phase 13 で AC-9 contexts 登録失敗 | UT-GOV-004 完了状況を再確認し、第 2 段階適用にフォールバック |
| MINOR 発生 | `outputs/phase-12/unassigned-task-detection.md` へ formalize、本ワークフロー内で抱え込まない |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 9 | AC × T × 成果物 マトリクスを QA チェックリストの入力に再利用 |
| Phase 10 | 全 AC PASS を最終 GO/NO-GO の根拠として使用 |
| Phase 11 | AC-7 / AC-12（baseline 計測）の実走根拠 |
| Phase 12 | AC-10 / AC-11 の正本同期トリガ |
| Phase 13 | AC-5 / AC-8 / AC-9 の 3 段階 PR 段取り根拠 |

## 多角的チェック観点

- 価値性: 14 件全 AC が Phase × 成果物に紐付き、追跡漏れによる品質劣化が構造的に発生しない。
- 実現性: 全 AC の検証方法が既存ツール（vitest / jq / grep / bats / validate-phase-output.js）で完結。
- 整合性: AC-13（4 条件）/ AC-14（artifacts.json）が他 AC のメタ条件として 2 重に作用。
- 運用性: AC 未カバー検出時の対応手順を 6 シナリオに分けて明文化。
- 表記ドリフト: 「全 package 一律 80%」「3 段階 PR」「coverage-guard.sh」を Phase 1〜13 で固定表記。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | AC × Phase 表（空セル 0） | 7 | spec_created | 14 行 |
| 2 | AC × T 表（happy + fail 被覆） | 7 | spec_created | Phase 4 / 6 由来 |
| 3 | AC × 成果物 表 | 7 | spec_created | outputs/phase-NN/main.md |
| 4 | 検証方法分類 | 7 | spec_created | 7 分類 |
| 5 | 未カバー検出時の対応手順 | 7 | spec_created | 6 シナリオ |
| 6 | outputs/phase-07/main.md 集約 | 7 | spec_created | プレースホルダ可 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-07/main.md | AC-1〜AC-14 × Phase 1〜13 × T × 成果物 マッピング表 + 検証方法分類 + 未カバー対応手順 |
| メタ | artifacts.json | Phase 7 状態 = pending |

## 検証コマンド（仕様確認用 / NOT EXECUTED）

```bash
# AC-1〜AC-14 の行が outputs/phase-07/main.md に全件存在
grep -cE '^\| AC-(1[0-4]|[1-9]) ' \
  docs/30-workflows/coverage-80-enforcement/outputs/phase-07/main.md
# => 14 以上

# 空セル検出（"- |" のみのセル）
grep -nE '\| - \|' \
  docs/30-workflows/coverage-80-enforcement/outputs/phase-07/main.md || echo "no empty cell"

# Phase 一覧 と artifacts.json 整合
ls docs/30-workflows/coverage-80-enforcement/phase-*.md | wc -l
# => 13
```

## 完了条件

- [ ] AC-1〜AC-14 が `outputs/phase-07/main.md` に写経されている
- [ ] AC × Phase の対応マトリクスが空セル 0
- [ ] AC × T（Phase 4 / 6 由来）の対応マトリクスで全 AC が最低 1 件の T で被覆
- [ ] AC × 成果物の対応マトリクスで全 AC が最低 1 件の成果物に紐付く
- [ ] 検証方法が 7 分類で記述（unit / integration / smoke / CI artifact / grep / validate-phase-output.js / manual review）
- [ ] 未カバー検出時の対応手順が 6 シナリオ以上記述
- [ ] AC-13（4 条件 PASS）の引用箇所が Phase 1 / Phase 3 の 2 箇所揃う
- [ ] AC-14（artifacts.json 整合）の検証手段が validate-phase-output.js で確定

## タスク100%実行確認【必須】

- 全実行タスク（7 件）が `spec_created`
- 成果物 `outputs/phase-07/main.md` 配置予定
- 空セル 0 / AC 全件被覆
- artifacts.json の `phases[6].status` が `pending`

## 苦戦防止メモ

1. **空セルゼロを機械チェック**: 1 セルでも空だと Phase 9 / 10 で再掘り起こし。`grep -nE '\| - \|'` で「-」セルを再点検。
2. **happy / fail 両側被覆**: AC-2（coverage-guard.sh 動作）は Phase 4 happy + Phase 6 fail 両方の T で被覆していることを表で示す。
3. **AC-9（UT-GOV-004 連携）の取りこぼし**: contexts 登録は Phase 13 で実走するが、仕様確定は Phase 2 / 13 双方に明記。
4. **AC-12 の baseline 30% 下回り検出**: NO-GO 条件 #2 を Phase 7 の対応手順にも明記し、Phase 11 で再点検。
5. **本 Phase は実走しない**: マッピング作業のみ。実 coverage 計測は Phase 11 で実走。

## 次 Phase への引き渡し

- 次 Phase: 8 (DRY 化)
- 引き継ぎ事項:
  - AC-1〜AC-14 × Phase × T × 成果物 マトリクスを Phase 9 / 10 GO/NO-GO の根拠に再利用
  - 未消化 AC が無いことを Phase 8 DRY 化レビューでも再確認
  - 未カバー検出時の 6 シナリオ対応手順を Phase 9 QA チェックの入力にする
- ブロック条件:
  - AC × Phase / AC × T / AC × 成果物 のいずれかで空セル
  - AC-1〜AC-14 のうち被覆漏れ
  - AC-13（4 条件 PASS）の引用箇所が Phase 1 / Phase 3 で揃わない
