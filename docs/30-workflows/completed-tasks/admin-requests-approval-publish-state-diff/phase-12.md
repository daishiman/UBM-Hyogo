# Phase 12: ドキュメント更新

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | admin-requests-approval-publish-state-diff |
| Phase 番号 | 12 / 13 |
| Phase 名称 | ドキュメント更新 |
| 実行種別 | serial |
| 作成日 | 2026-06-11 |
| 上流 | Phase 11（手動テスト・VISUAL screenshot 計画） |
| 下流 | Phase 13（PR 作成） |
| 状態 | completed |
| 実装区分 | 実装仕様書（VISUAL） |

## 目的

本タスクのドキュメント更新を完遂する。implementation-guide（中学生レベル + 開発者レベル）、システム仕様更新方針（Step 1 / Step 2）、documentation-changelog、unassigned-task-detection（current / baseline 分離）、skill-feedback-report、phase12 compliance check の **strict 7 成果物すべて**を出力する（0 件・該当なしでも出力必須）。同一サイクルでコード実装・focused test・typecheck・lint・token gate まで完了し、commit・PR・staging capture は user-gated として残す。global skill 同期は公開 surface 変更なしのため N/A。Phase 11 の 3 canonical PNG は `staging_visual_pending_user_gate` として記録する。

## 実行タスク（Task 12-1〜12-6）

1. **Task 12-1**: `outputs/phase-12/implementation-guide.md` を Part 1（中学生レベル）+ Part 2（開発者レベル）+ `## 視覚証跡`（Phase 11 screenshot canonical 名参照）で作成する。CONST_005 必須項目（変更ファイル一覧 / 関数・型シグネチャ / 入出力・副作用 / テスト方針 / ローカル実行コマンド / DoD）を全て含める。
2. **Task 12-2**: `outputs/phase-12/system-spec-update-summary.md` に Step 1（タスク完了記録方針）/ Step 2（新規インターフェース追加判定 = N/A）を記録する。
3. **Task 12-3**: `outputs/phase-12/documentation-changelog.md` に本 wave で作成した workflow docs と全 Step（1-A/1-B/1-C/Step 2）の結果を個別明記する（該当なしも記録）。workflow-local 同期と global skill sync を別ブロックで記録する。
4. **Task 12-4**: `outputs/phase-12/unassigned-task-detection.md` に current（= 0 件）/ baseline（親 workflow 由来・参照のみ）を分離記録する。
5. **Task 12-5**: `outputs/phase-12/skill-feedback-report.md` にテンプレート / ワークフロー / ドキュメント改善観点を記録する（既存 rule 適用漏れを修正）。
6. **Task 12-6**: `outputs/phase-12/phase12-task-spec-compliance-check.md` に canonical 9 見出し充足の root evidence を記録する（**Lane 作成済・本 Phase は整合対象**）。

## 参照資料

### タスク内部資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | _shared-context.md（§4 / §6 / §10） | AC / 裏取り（`formatPublishStateLabel` / `buildPublishStateDiff` / 3 値限定契約） |
| 必須 | outputs/phase-11/phase11-capture-metadata.json | 視覚証跡 canonical 名（3 枚） |
| 必須 | outputs/phase-02/diff-design.md | diff DOM 設計 / 純粋関数シグネチャ根拠 |
| 必須 | outputs/phase-12/phase12-task-spec-compliance-check.md | canonical 9 見出し root evidence（整合対象・Lane 作成済） |

### システム仕様（aiworkflow-requirements）

| 参照資料 | パス | 用途 |
| --- | --- | --- |
| UI/UX primitives | `.claude/skills/aiworkflow-requirements/references/ui-ux-atoms-patterns-core.md` | Step 2 新規 primitive 非追加判定 |
| デザイントークン正本 | `docs/00-getting-started-manual/specs/09b-design-tokens.md` | token 追加なしの裏取り |
| 画面 blueprint（admin） | `docs/00-getting-started-manual/specs/09g-screen-blueprints-admin.md` | admin requests 画面 contract の正本整合 |

## 実行手順

### ステップ 1: implementation-guide.md 作成（Task 12-1）

- Part 1（中学生レベル）: 日常の例え話・専門用語なし。「なぜ必要か → 何をするか → 変えない約束」の順。
- Part 2（開発者レベル）: 変更ファイル一覧・純粋関数 TypeScript シグネチャ（`formatPublishStateLabel(state: string): string` / `buildPublishStateDiff(item): PublishStateDiff | null`）・globals.css `[data-diff-side]` クラス・テスト方針・実行コマンド・エッジケース・DoD を全て含める。
- `## 視覚証跡`: Phase 11 の 3 canonical 名を参照する。

### ステップ 2: Step 1 / Step 2 判定（Task 12-2）

- Step 1（タスク完了記録方針）: feature ローカル UI 改修のみで global skill 同期 N/A と記録。
- Step 2（新規インターフェース追加判定）: `formatPublishStateLabel` 純関数 + `buildPublishStateDiff` 純関数が `apps/web` admin 機能ローカルである → aiworkflow-requirements 正本更新は **N/A**・`pnpm indexes:rebuild` 不要であることを明記。

### ステップ 3: changelog / unassigned / feedback / compliance（Task 12-3〜12-6）

- documentation-changelog: 本 wave で作成した workflow docs 一覧と全 Step の結果を個別明記（該当なしも記録）。workflow-local と global を別ブロック。
- unassigned-task-detection: current = 0 件（全 AC-1〜AC-10 が単一 PR 1 サイクルで完了・CONST_007 分割なし）。baseline は親 workflow を参照のみ（新規 Issue 起票しない）。
- skill-feedback-report: 既存 rule 適用漏れの修正（owning skill 昇格 0 件）。理由明記。
- phase12-task-spec-compliance-check: **Lane が作成済**。本 Phase は編集せず、main / implementation-guide / system-spec-update-summary 等を当該ファイルの記述（strict 7 present / Part 1・2 が 3 行以上 / current 0 / Step 2 N/A）と整合させる。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 11 | screenshot canonical 名（3 枚）を implementation-guide `## 視覚証跡` に反映 |
| Phase 13 | implementation-guide を PR 本文（Phase 13 仕様）に反映 |

## 依存Phase成果物参照

| 依存Phase | 必須成果物 | 本Phaseでの使用 |
| --- | --- | --- |
| Phase 2 | `outputs/phase-02/diff-design.md` | implementation-guide の変更ファイル・DOM 構造・純粋関数シグネチャへ反映 |
| Phase 5 | `outputs/phase-05/runbook.md` | 実装内容と検証手順をドキュメント化 |
| Phase 6 | `outputs/phase-06/edge-cases.md` | 未タスク検出と境界ケース記録へ反映 |
| Phase 7 | `outputs/phase-07/ac-matrix.md` | AC matrix を compliance check の根拠にする |
| Phase 9 | `outputs/phase-09/token-audit.md` | token gate / lint / typecheck 方針を system-spec-update-summary へ反映 |

## 多角的チェック観点（AIが判断）

| 観点 | 確認内容 |
| --- | --- |
| Step 2 N/A 判定の正当性 | `formatPublishStateLabel` / `buildPublishStateDiff` が feature ローカルで、公開 surface（aiworkflow-requirements 正本）に昇格しないこと |
| current/baseline 分離 | current = 0 件（単一 PR で完了）/ baseline = 親 workflow 由来を混同しない |
| 視覚証跡参照の一貫性 | implementation-guide の canonical 名（3 枚）が Phase 11 capture-metadata と一致 |
| compliance-check 整合 | Lane 作成済 phase12-task-spec-compliance-check.md の記述（strict 7 present / current 0 / Step 2 N/A / Part 1・2 が 3 行以上）と本 Phase 成果物が矛盾しないこと |

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | implementation-guide.md（Part 1/2 + 視覚証跡 + CONST_005） | 12 | completed | Task 12-1 |
| 2 | system-spec-update-summary.md（Step 1/2） | 12 | completed | Task 12-2 |
| 3 | documentation-changelog.md（全 Step） | 12 | completed | Task 12-3 |
| 4 | unassigned-task-detection.md（current 0 / baseline 参照） | 12 | completed | Task 12-4 |
| 5 | skill-feedback-report.md | 12 | completed | Task 12-5 |
| 6 | phase12-task-spec-compliance-check.md | 12 | completed | Task 12-6（Lane 作成済・整合対象） |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-12/main.md | Phase 12 総括 |
| ドキュメント | outputs/phase-12/implementation-guide.md | Part 1（中学生）+ Part 2（開発者）+ 視覚証跡 + CONST_005 |
| ドキュメント | outputs/phase-12/system-spec-update-summary.md | Step 1 / Step 2 判定 |
| ドキュメント | outputs/phase-12/documentation-changelog.md | 本 wave docs 一覧 + 全 Step 個別記録（workflow-local / global 別ブロック） |
| ドキュメント | outputs/phase-12/unassigned-task-detection.md | current 0 / baseline 参照 |
| ドキュメント | outputs/phase-12/skill-feedback-report.md | 改善観点（no-op） |
| ドキュメント | outputs/phase-12/phase12-task-spec-compliance-check.md | canonical 9 見出し root evidence（Lane 作成済） |

## 完了条件

- [ ] strict 7 成果物（implementation-guide / system-spec-update-summary / documentation-changelog / unassigned-task-detection / skill-feedback-report / phase12-task-spec-compliance-check）+ main.md がすべて実体ファイルとして存在する
- [ ] implementation-guide が Part 1（中学生レベル）+ Part 2（開発者レベル）+ `## 視覚証跡` を持ち、各 Part が非空本文 3 行以上 + 必須 key section を満たす
- [ ] implementation-guide が CONST_005 必須項目（変更ファイル一覧 / 関数・型シグネチャ / 入出力・副作用 / テスト方針 / ローカル実行コマンド / DoD）を全て含む
- [ ] system-spec-update-summary が Step 2 を `formatPublishStateLabel` / `buildPublishStateDiff` の feature ローカル判定で N/A 明記している
- [ ] unassigned-task-detection が current = 0 件 / baseline = 親 workflow 参照のみ（新規 Issue 起票しない）を記録している
- [ ] documentation-changelog が本 wave docs 一覧と全 Step（1-A/1-B/1-C/Step 2）を個別明記している（該当なしも記録）
- [ ] global skill 同期が N/A である旨が明記されている
- [x] 本サイクルが `implemented_local_runtime_pending` であり local PASS と runtime pending を分離している

## タスク100%実行確認【必須】

- [ ] サブタスク 1〜6 が完了している
- [ ] outputs/phase-12/* の 7 ファイル（6 成果物 + main.md）が配置済み
- [ ] implementation-guide の視覚証跡 canonical 名が Phase 11 capture-metadata と一致している（不一致 0 件）
- [ ] current（0 件）/ baseline（参照のみ）が混同なく分離されている
- [ ] phase12-task-spec-compliance-check.md（Lane 作成済）と本 Phase 成果物が矛盾しない
- [ ] artifacts.json の Phase 12 ステータスが `completed` に整合している

## 次Phase

- 次: Phase 13（PR 作成・user_approval_required=true）
- 引き継ぎ事項: implementation-guide（PR 本文の Phase 13 仕様）/ baseline 参照 / 視覚証跡 canonical 名（3 枚）
- ブロック条件: strict 7 成果物のいずれかが欠落する場合は本 Phase に留まる
