# Phase 12: ドキュメント同期

## メタ情報

- task_id: `responsive-mobile-tablet-ui-fixes`
- workflow_state: `implemented_local_visual_present_staging_pending`（Phase 1-13 実装仕様書と local PNG 証跡を作成。commit / PR / authenticated admin staging 視覚証跡は user-gated）
- taskType: `implementation` / visualEvidence: `VISUAL`
- 本 Phase の責務: strict 7 成果物を `outputs/phase-12/` に作成し、Phase 1-11 の設計・検証内容を正本として同期する

> **300 行超許容の理由**: 本タスクは全 19 ルートを対象とする `implemented_local_visual_present_staging_pending` の実装仕様書であり、
> root cause RC-1..RC-5 → AC-1..AC-10 → 変更ファイルの横断 trace を含む 9 必須見出しの compliance check は
> 意味的に分割すると追跡性を損なう。strict 7 の索引・Task 進捗・MINOR 追跡テーブルを直列記述する必要があるため、
> 条件付き超過許容（phase-template-phase12.md 参照）。

## 目的

全画面レスポンシブ（携帯・タブレット）UI/UX 是正仕様書（responsive-mobile-tablet-ui-fixes）の
Phase 1〜11 成果物を、Phase 12 strict 7 へ集約・正本同期する。

主な成果物:
- `apps/web` 表現層（CSS / breakpoint / レイアウト component）のみのスコープで、全 19 ルートの mobile/tablet 崩れ・はみ出し・隠れを是正する実装仕様
- 新規 interface / 型 / API / 定数の追加なし（CSS / breakpoint のみ）→ Step 2 = N/A（API/D1/Form 非変更・不変条件 #1 #5）

## 実行タスク

| Task | 成果物 | 説明 |
| --- | --- | --- |
| 12-1 | `outputs/phase-12/implementation-guide.md` | Part 1（中学生レベル例え話）+ Part 2（breakpoint 体系・変更ファイル Before→After・clamp/minmax・検証コマンド） |
| 12-2 | `outputs/phase-12/system-spec-update-summary.md` | Step 1 完了記録 / Step 2 = N/A（CSS / breakpoint のみ・ドメイン仕様無影響） |
| 12-3 | `outputs/phase-12/documentation-changelog.md` | Step 1-A/B/C 結果、workflow-local 同期 / global skill sync、validator 結果 |
| 12-4 | `outputs/phase-12/unassigned-task-detection.md` | 検出 0 件（1 サイクル完結 CONST_007）。current=0 / baseline 記録 |
| 12-5 | `outputs/phase-12/skill-feedback-report.md` | skill・テンプレート改善点 / 観察事項（改善点なしでも出力） |
| 12-6 | `outputs/phase-12/phase12-task-spec-compliance-check.md` | canonical 9 見出し準拠確認 |
| 12-7 | `outputs/phase-12/main.md` | Phase 12 全体サマリ・strict 7 索引 |

## 参照資料

| 種別 | Path | 内容 |
| --- | --- | --- |
| 要件定義 | `phase-1-requirements.md` | AC-1..AC-10・root cause RC-1..RC-5 |
| 設計 | `phase-2-design.md` | 変更ファイル一覧・breakpoint 体系・CSS ブロック・component 変更 |
| 設計レビュー | `phase-3-design-review.md` | 不変条件適合・設計判断・PASS 判定 |
| 共有 SSOT | `shared-context.md` | 19 ルート inventory / viewport / breakpoint / RC→AC trace |
| タスク索引 | `index.md` | Phase 構成・タスク概要 |
| artifacts | `artifacts.json` | gates / phase12_strict_outputs / verify_commands |
| テンプレート | `.claude/skills/task-specification-creator/references/phase-template-phase12.md` | Phase 12 規約 |
| compliance SSOT | `.claude/skills/task-specification-creator/references/phase12-compliance-check-template.md` | canonical 9 見出し |

### システム仕様（参照）

| 参照資料 | パス | 内容 |
| -------- | ---- | ---- |
| design-tokens | `docs/00-getting-started-manual/specs/design-tokens.md` | OKLch トークン正本・HEX 禁止 |
| ui-ux-navigation | `.claude/skills/aiworkflow-requirements/references/ui-ux-navigation.md` | admin ナビ構成 |

## 成果物

| ファイル | 役割 |
| --- | --- |
| `outputs/phase-12/main.md` | Phase 12 サマリ・strict 7 索引 |
| `outputs/phase-12/implementation-guide.md` | Part 1（例え話）+ Part 2（技術者向け breakpoint・CSS・変更ファイル詳細） |
| `outputs/phase-12/system-spec-update-summary.md` | Step 1 完了記録 / Step 2 N/A 理由 |
| `outputs/phase-12/documentation-changelog.md` | 変更ファイル・validator 結果・Step 結果 |
| `outputs/phase-12/unassigned-task-detection.md` | 未タスク検出（current 0 件・1 サイクル完結） |
| `outputs/phase-12/skill-feedback-report.md` | skill・テンプレート改善提案 |
| `outputs/phase-12/phase12-task-spec-compliance-check.md` | canonical 9 見出し準拠 / 4 条件 verdict |

## 統合テスト連携

| テスト種別 | 対象 Phase | 本 Phase との関係 |
| --- | --- | --- |
| focused vitest（SidebarDrawer 等の幅クラス / data-label 構造検証） | Phase 4/6/8/9 | 実装後に実行（user-gated）。結果は `outputs/phase-11/manual-test-result.md` と implementation-guide に転記予定 |
| pnpm verify:tokens | Phase 6/9 | AC-9 token gate。コマンドを implementation-guide に明記 |
| git diff apps/api | Phase 9 | AC-9 API 非変更確認。コマンドを documentation-changelog に記録 |
| Playwright visual（mobile 375 / tablet 768） | Phase 4/9/11 | local public/auth/common PNG は取得済み。authenticated admin staging baseline は user-gated |
| pnpm typecheck / pnpm lint | Phase 9 | 後続実装サイクルで実行 |

## Phase 10 MINOR 追跡テーブル

Phase 3 設計レビューにて MINOR 指摘なし（明示 0 件）。

| MINOR ID | 指摘内容 | 解決予定 Phase | 解決確認 Phase | 解決方法 | ステータス |
| -------- | -------- | ------------- | -------------- | -------- | ---------- |
| （なし） | — | — | — | — | 0 件 |

## 完了条件

1. strict 7 ファイルが `outputs/phase-12/` に実体として存在すること
2. `phase12-task-spec-compliance-check.md` の canonical 9 見出しが template 準拠であること
3. 新規 interface / 型 / API / 定数の追加がなく Step 2 = N/A と根拠付きで記録されていること
4. `artifacts.json` の Gate-A `evidence_path` が `outputs/phase-12/phase12-task-spec-compliance-check.md` を指していること
5. Phase 11 local PNG 5 files が存在し、Phase 13 が `pending_user_approval` 状態で、commit/push/PR/authenticated admin staging visual baseline が user-gated として明記されていること
