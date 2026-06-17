# Phase 4: テスト作成

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | admin-attendance-dashboard-jp-clarity-and-ux |
| Phase 番号 | 4 / 13 |
| Phase 名称 | テスト作成 |
| 実行種別 | serial（単一 workflow / 1 サイクル完了） |
| 作成日 | 2026-06-11 |
| 担当 | web (apps/web 表現層) |
| タスク種別 | implementation（VISUAL / コード変更を伴う） |
| 上流 | Phase 3（設計レビュー・GO 判定） |
| 下流 | Phase 5（実装） |
| 状態 | spec_created |

## 目的

Phase 2 の change-map（After 文言）を**テストで固定する**ための設計を行う。本タスクは文字列置換中心のため、検証対象は「(a) 既存テスト（T-01〜T-06）が After 文言へ追従すること」「(b) After 文言を固定する回帰テスト（PERIOD_PRESETS ラベル / `formatDelta` の `ポイント` / KpiPanel の `開催回数`・`一度でも参加した人の割合` / DetailTabs の `開催回ごと`・`出席が多い順` / AbsenteeAlert の `回つづけて欠席` / ZoneDistribution の `出席回数べつの人数`）」「(c) DOM contract（testid / role / aria キー / href）が不変であること」。本 Phase ではテストの設計（追従マップ + 回帰ケース TC-XX 採番 + focused vitest コマンド + visual baseline 要否 = MINOR M-2 判定）を文書化し、実テストコードの commit は行わない。

## 実行タスク

1. **テスト戦略の文書化**: `outputs/phase-04/main.md` に「追従（T-01〜T-06）」「回帰（After 文言固定）」「DOM contract 不変確認」の 3 分類を書く。テスト操作は `fireEvent.click`（`vi.stubGlobal` 不使用・[FB-VSCPKR-02]）、書式は既存 spec（`@testing-library/react` + `afterEach(cleanup)`）踏襲を宣言する。
2. **既存テスト追従マップの確定**: T-01〜T-06 を「対象ファイル・行 → 旧アサート → 新アサート → 対応リネーム ID」で固定する（change-map §12 と整合）。
3. **回帰テストケースの採番**: `outputs/phase-04/test-plan.md` に TC-XX を採番し、各 TC の対象・操作・期待値・配置 spec を書く。After 文言を逐語固定する。
4. **新規 spec / 既存編集の別を明記**: `KpiPanel.spec.tsx` / `format-attendance.spec.ts` は**既存ファイルの編集**（回帰 it 追加）。`AttendanceZoneDistributionChart.spec.tsx` / `AttendanceDetailTabs.spec.tsx` は**既存ファイルの追従編集**。新規 spec ファイルは作らない方針を確定する（既存 spec に describe / it を追記）。
5. **focused vitest コマンドの確定**: `mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts apps/web/src/features/admin/attendance/__tests__` 形式を明記する（repo ルートが root の既知の罠）。
6. **visual baseline 要否（MINOR M-2）の判定**: 文言変更により `playwright/tests/visual/admin-shell/dashboard-attendance.spec.ts` の baseline 差分が出るため、再取得が必要（意図的差分）であることを判定し、Phase 11 / 13（user-gated）へ申し送る。

## 参照資料

### タスク内部資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-02/change-map.md | After 文言 / 行アンカー / テスト追従マップの正本 |
| 必須 | outputs/phase-01/rename-map.md | R/S/J/U と影響先（テスト T-NN）列 |
| 必須 | outputs/phase-03/main.md | GO 判定 / MINOR M-1〜M-4（M-2 visual baseline 申し送り） |
| 必須 | _shared-context.md | AC-1〜AC-10 / §3 既存テスト T-01〜T-06 / §7 テスト方針 |

### システム仕様（aiworkflow-requirements）

| 参照資料 | パス | 用途 |
| --- | --- | --- |
| テスト コンポーネントパターン | `.claude/skills/aiworkflow-requirements/references/testing-component-patterns-core.md` | testing-library + happy-dom の component spec 書式 |
| テスト コンポーネントパターン詳細 | `.claude/skills/aiworkflow-requirements/references/testing-component-patterns-details.md` | `fireEvent` / internal state 検証パターン |
| アクセシビリティテスト | `.claude/skills/aiworkflow-requirements/references/testing-accessibility.md` | aria-label 文言変更時の role 維持確認 |
| Playwright E2E | `.claude/skills/aiworkflow-requirements/references/testing-playwright-e2e.md` | T-05/T-06 追従・visual baseline 要否 |

## 実行手順

### ステップ 1: テスト戦略概要の作成

- `outputs/phase-04/main.md` に 3 分類（追従 / 回帰 / DOM 不変）・既存書式踏襲・`fireEvent` 方針・focused vitest コマンド・visual baseline 要否を書く。

### ステップ 2: 追従マップ + 回帰 TC-XX の採番

- `outputs/phase-04/test-plan.md` に T-01〜T-06 の追従と TC-XX（回帰）を採番し、各 TC に対象 / 操作 / 期待値 / 配置 spec を書く。After 文言を逐語で固定する。

### ステップ 3: visual baseline 要否の判定（MINOR M-2）

- 文言変更は意図的差分のため、visual baseline 再取得が必要であることを判定し Phase 11 / 13 へ申し送る。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 5 | T-01〜T-06 追従 + 回帰 TC-XX を Green にする実装手順を runbook にマップ |
| Phase 6 | fail path / 専門語残存 0 の grep ガードを TC-E-XX として拡充 |
| Phase 7 | AC × TC × 実装ファイルのトレースに TC-XX を使う |
| Phase 9 | focused vitest で全 TC Green を確認 |
| Phase 11 | visual baseline 再取得要否（M-2）を screenshot-plan に反映（VISUAL） |

## 多角的チェック観点（AIが判断）

| 観点 | AC / 不変条件 | 確認内容 |
| --- | --- | --- |
| 追従の同一 wave | [FB-TASK-01/02] / AC-9 | T-01〜T-06 が Before 文字列依存のため同一 wave で After へ更新される設計になっている |
| DOM contract 不変 | AC-8 | テストが既存 testid / role を維持して取得する（aria-label 文言変更後も role で取得可能）ことを確認 |
| stubGlobal 不使用 | [FB-VSCPKR-02] | window モックを使わず props でデータを渡す。`vi.stubGlobal` を使わない |
| internal state | [VSCPKR-03] | DetailTabs のタブ操作は `fireEvent.click`。label 変更が `value` に波及しないことを TC で確認 |
| 回帰の逐語固定 | AC-1/AC-2/AC-3 | After 文言（`3か月` / `ポイント` / `開催回数` / `出席が多い順` 等）が回帰 TC で逐語アサートされる |
| visual baseline | M-2 | 文言変更が意図的差分であり baseline 再取得が user-gated であることを明記 |

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | テスト戦略概要（3 分類 / 書式 / コマンド） | 4 | spec_created | main.md |
| 2 | 既存テスト追従マップ（T-01〜T-06） | 4 | spec_created | test-plan.md |
| 3 | 回帰 TC-XX 採番（After 文言固定） | 4 | spec_created | test-plan.md |
| 4 | 新規 / 既存編集の別を明記 | 4 | spec_created | 新規 spec ファイル無し |
| 5 | focused vitest コマンド確定 | 4 | spec_created | `--root=. --config=vitest.config.ts` |
| 6 | visual baseline 要否（M-2）判定 | 4 | spec_created | 再取得必要・user-gated |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-04/main.md | テスト戦略概要（追従 / 回帰 / DOM 不変 / コマンド / baseline 要否） |
| ドキュメント | outputs/phase-04/test-plan.md | T-01〜T-06 追従マップ + 回帰 TC-XX（対象 / 操作 / 期待値 / 配置 spec） |
| メタ | artifacts.json | Phase 4 を spec_created に維持 |

## 完了条件

- [ ] `outputs/phase-04/main.md` にテスト 3 分類（追従 / 回帰 / DOM 不変）が記載されている
- [ ] テスト操作が `fireEvent.click` であり `vi.stubGlobal` を使わない方針（[FB-VSCPKR-02]）が明記されている
- [ ] T-01〜T-06 の追従マップ（旧アサート → 新アサート → リネーム ID）が `outputs/phase-04/test-plan.md` に記載されている
- [ ] After 文言を固定する回帰 TC-XX が採番され、各 TC に対象 / 操作 / 期待値 / 配置 spec が明記されている
- [ ] 新規 spec ファイルを作らず既存 spec へ追記する方針が明記されている
- [ ] focused vitest コマンド（`--root=. --config=vitest.config.ts apps/web/src/features/admin/attendance/__tests__`）が記載されている
- [ ] visual baseline 再取得要否（MINOR M-2）が判定され Phase 11 / 13 へ申し送られている

## タスク100%実行確認【必須】

- [ ] サブタスク 1〜6 が完了している
- [ ] `outputs/phase-04/{main,test-plan}.md` が指定パスに配置されている
- [ ] 全 TC が AC-1〜AC-10（特に AC-1/2/3/8/9）のいずれかにマップされている
- [ ] テスト書式が既存（happy-dom + testing-library + `afterEach(cleanup)` + `fireEvent`）を踏襲している
- [ ] 新規 test ファイルは `*.spec.{ts,tsx}` のみ（invariant #8）に整合している（本タスクは既存 spec 編集のみ）
- [ ] artifacts.json の Phase 4 ステータスが spec_created に整合している

## 次Phase

- 次: Phase 5（実装）
- 引き継ぎ事項: T-01〜T-06 追従マップ / 回帰 TC-XX / focused vitest コマンド / visual baseline 再取得要否（M-2）
- ブロック条件: TC が After 文言を逐語固定できない、または DOM contract 不変が保証できない場合は Phase 2（change-map）に戻る
