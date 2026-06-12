# Phase 12: ドキュメント更新

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | admin-attendance-dashboard-jp-clarity-and-ux |
| Phase 番号 | 12 / 13 |
| Phase 名称 | ドキュメント更新 |
| 実行種別 | serial（単一 workflow / 1 サイクル完了） |
| 作成日 | 2026-06-11 |
| 担当 | web (apps/web 表現層) |
| タスク種別 | implementation（VISUAL / コード変更を伴う） |
| 上流 | Phase 11（手動テスト・VISUAL screenshot 計画） |
| 下流 | Phase 13（PR 作成） |
| 状態 | spec_created |
| 実装区分 | 実装仕様書（VISUAL） |

## 目的

本タスクのドキュメント更新を完遂する。implementation-guide（中学生レベル + 開発者レベル + 視覚証跡）、システム仕様更新方針（Step 1 / Step 2）、documentation-changelog（全 Step 個別記録）、unassigned-task-detection（current / baseline 分離）、skill-feedback-report、phase12 compliance check の **6 成果物 + main.md すべて**を出力する（0 件・該当なしでも出力必須）。本タスクは **文字列リネーム中心**（英語表記・エンジニア専門語の日本語化）であり、新規 interface / 型 / 定数 / API を一切追加しないため system contract Step 2 は **N/A** が正当である。apps/web 実装・focused vitest・token gate・typecheck・lint・workflow inventory sync は本サイクルで完了済み。commit・PR・authenticated staging capture は user-gated。Phase 11 の 6 canonical PNG は local Playwright admin fixture で取得済みとして記録する。

## 実行タスク（Task 12-1〜12-6）

1. **Task 12-1**: `outputs/phase-12/implementation-guide.md` を Part 1（中学生レベル）+ Part 2（開発者レベル）+ `## 視覚証跡`（Phase 11 screenshot canonical 名参照）で作成する。Part 1 は例え話必須・専門用語なし。Part 2 は変更ファイル 16 一覧 / 用語リネーム正本表（R/S/J/U）/ `formatDelta` 単位変更契約（pt→ポイント・計算不変）/ PERIOD_PRESETS label のみ変更 / ZONE_HELP 置換 / テスト追従 T-01〜T-06 / 検証コマンド / エッジケースを含む。
2. **Task 12-2**: `outputs/phase-12/system-spec-update-summary.md` に Step 1（タスク完了記録方針 1-A/1-B/1-C）/ Step 2（新規インターフェース追加判定 = N/A）を記録する。
3. **Task 12-3**: `outputs/phase-12/documentation-changelog.md` に全 Step（1-A/1-B/1-C/Step 2）を個別明記する（該当なしも記録）。workflow-local 同期と global skill sync を別ブロックで記録する（[Feedback BEFORE-QUIT-003]）。本タスクは spec_created のため LOGS / indexes 更新は実装 close-out 時 = 今回 N/A。
4. **Task 12-4**: `outputs/phase-12/unassigned-task-detection.md` に current / baseline を分離記録する（**0 件でも出力必須**。current は spec 段階のため 0 件想定 / baseline は MINOR M-2 / M-3 / M-4 を候補として記録判断・「関連タスク差分確認」欄で重複起票防止）。
5. **Task 12-5**: `outputs/phase-12/skill-feedback-report.md` にテンプレート / ワークフロー / ドキュメント改善観点を記録する（**改善点なしでも出力必須**。文字列リネーム中心タスクでの spec_created VISUAL 運用の知見を含む）。
6. **Task 12-6**: `outputs/phase-12/phase12-task-spec-compliance-check.md` に Task 12-1〜12-6 / canonical 9 見出し充足の root evidence を記録する（**本ファイルは作成済み・上書き禁止**。内容を他成果物と整合させる）。

## 参照資料

### タスク内部資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | _shared-context.md（§2 / §3 / §5 / §9） | 用語リネーム正本表（R/S/J/U）/ テスト追従（T-01〜T-06）/ AC / 実装ファイル 16 一覧 |
| 必須 | outputs/phase-11/screenshot-plan.json | 視覚証跡 canonical 名（6 PNG） |
| 必須 | outputs/phase-11/phase11-capture-metadata.json | capture status（captured_local_fixture） |
| 必須 | index.md | タスク全体像・Phase 一覧 |

### システム仕様（aiworkflow-requirements）

| 参照資料 | パス | 用途 |
| --- | --- | --- |
| UI/UX 文言指針 | `.claude/skills/aiworkflow-requirements/references/ui-ux-design-principles-core.md` | 平易な日本語ラベルの指針 |
| デザイントークン正本 | `docs/00-getting-started-manual/specs/09b-design-tokens.md` | token 追加なしの裏取り（AC-5） |
| 画面 blueprint（admin） | `docs/00-getting-started-manual/specs/09g-screen-blueprints-admin.md` | 出席ダッシュボード設計の正本整合 |

## 実行手順

### ステップ 1: implementation-guide.md 作成（Task 12-1）

- Part 1（中学生レベル）: 日常の例え話・専門用語なし。「なぜ英語のままだと困るか → どう日本語に直すか → 数字や機能は変えない約束」の順。本文 3 行以上・例え話必須。
- Part 2（開発者レベル）: 概要 / 変更ファイル 16 一覧（_shared-context §9）/ 用語リネーム正本表（R/S/J/U の要点）/ `formatDelta` の単位変更契約（pt→ポイント・計算不変・記号 ↑↓→ 維持）/ PERIOD_PRESETS label のみ変更 / ZONE_HELP 置換 / テスト追従 T-01〜T-06 / 検証コマンド / エッジケース（displayName 空時のメール表示維持 等）。
- `## 視覚証跡`: `outputs/phase-11/screenshots/` の 6 canonical PNG を参照する。local fixture screenshot は取得済み、authenticated staging baseline は user-gated と明記。

### ステップ 2: Step 1 / Step 2 判定（Task 12-2）

- Step 1（タスク完了記録方針 1-A/1-B/1-C）: feature ローカル表現層の文言改修のみで global skill 同期 N/A と記録。
- Step 2（新規インターフェース追加判定）: 本タスクは**文字列リネームのみ**で新規 interface / 型 / 定数 / API を追加しない（`PERIOD_PRESETS` / `ZONE_HELP` / `formatDelta` はいずれも既存・値のみ変更）。したがって aiworkflow-requirements 正本更新は **N/A** であることを明記。

### ステップ 3: changelog / unassigned / feedback / compliance（Task 12-3〜12-6）

- documentation-changelog: 全 Step（1-A/1-B/1-C/Step 2）の結果を個別明記（該当なしも記録）。workflow-local と global を別ブロック。spec_created のため LOGS / indexes は実装 close-out 時 = 今回 N/A。
- unassigned-task-detection: current（spec 段階ゆえ 0 件想定）/ baseline（MINOR M-2 visual baseline 再取得 / M-3「延べ」表記 / M-4「テーブル」表記）を分離記録。「関連タスク差分確認」欄で重複起票防止。
- skill-feedback-report: 改善点なしでも出力。文字列リネーム中心タスクでの spec_created VISUAL 運用の知見を記録。
- phase12-task-spec-compliance-check: **作成済み・上書きしない**。canonical 9 見出し充足の root evidence は既存ファイルを正とし、他成果物をそれに整合させる。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 4 | T-01〜T-06 追従テスト + 回帰テストを implementation-guide のテスト節へ反映 |
| Phase 7 | AC-1〜AC-10 マトリクスを compliance check の根拠にする |
| Phase 9 | token gate（HEX 0）/ typecheck / lint 結果を system-spec-update-summary へ反映 |
| Phase 11 | screenshot canonical 名（6 PNG）を implementation-guide `## 視覚証跡` に反映 |
| Phase 13 | implementation-guide を PR 本文（Phase 13 仕様）に反映 |

## 多角的チェック観点（AIが判断）

| 観点 | 確認内容 |
| --- | --- |
| Step 2 N/A 判定の正当性 | 文字列リネームのみで `PERIOD_PRESETS` / `ZONE_HELP` / `formatDelta` の signature・型・公開 surface を変えない（aiworkflow-requirements 正本へ昇格しない） |
| current/baseline 分離 | current = spec 段階ゆえ 0 件 / baseline = MINOR M-2/M-3/M-4（将来候補）を混同しない |
| 視覚証跡参照の一貫性 | implementation-guide の 6 canonical 名が screenshot-plan.json と一致 |
| same-wave sync 判定 | feature ローカル文言改修のみで global skill sync N/A と記録 |
| `formatDelta` 契約 | 単位 pt→ポイントの**表示のみ**変更・数値計算と記号（↑↓→）は不変であることを明記 |
| compliance check 不可侵 | 作成済み phase12-task-spec-compliance-check.md を上書きせず、他成果物をそれに整合させる |

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | implementation-guide.md（Part 1/2 + 視覚証跡） | 12 | spec_created | Task 12-1 |
| 2 | system-spec-update-summary.md（Step 1/2 = N/A） | 12 | spec_created | Task 12-2 |
| 3 | documentation-changelog.md（全 Step） | 12 | spec_created | Task 12-3 |
| 4 | unassigned-task-detection.md（current/baseline） | 12 | spec_created | Task 12-4 |
| 5 | skill-feedback-report.md | 12 | spec_created | Task 12-5 |
| 6 | phase12-task-spec-compliance-check.md | 12 | spec_created | Task 12-6（作成済み・上書き禁止） |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-12/main.md | Phase 12 総括・6 成果物インデックス |
| ドキュメント | outputs/phase-12/implementation-guide.md | Part 1（中学生）+ Part 2（開発者）+ 視覚証跡 |
| ドキュメント | outputs/phase-12/system-spec-update-summary.md | Step 1 / Step 2 判定（N/A） |
| ドキュメント | outputs/phase-12/documentation-changelog.md | 全 Step 個別記録（workflow-local / global 別ブロック） |
| ドキュメント | outputs/phase-12/unassigned-task-detection.md | current / baseline 分離 |
| ドキュメント | outputs/phase-12/skill-feedback-report.md | 改善観点 |
| ドキュメント | outputs/phase-12/phase12-task-spec-compliance-check.md | Task 12-1〜12-6 / canonical 9 見出し root evidence（作成済み） |

## 完了条件

- [ ] 6 成果物（implementation-guide / system-spec-update-summary / documentation-changelog / unassigned-task-detection / skill-feedback-report / phase12-task-spec-compliance-check）+ main.md がすべて実体ファイルとして存在する
- [ ] implementation-guide が Part 1（中学生レベル・例え話あり）+ Part 2（開発者レベル）+ `## 視覚証跡` を持つ
- [ ] Part 2 が変更ファイル 16 一覧 / 用語リネーム正本表（R/S/J/U）/ `formatDelta` 単位変更契約 / PERIOD_PRESETS / ZONE_HELP / テスト追従 T-01〜T-06 / 検証コマンド / エッジケースを含む
- [ ] system-spec-update-summary が Step 2 を「文字列リネームのみで新規 interface/型/定数/API なし」で N/A 明記している
- [ ] unassigned-task-detection が current（0 件想定）/ baseline（MINOR M-2/M-3/M-4）を分離記録している
- [ ] documentation-changelog が全 Step（1-A/1-B/1-C/Step 2）を個別明記している（該当なしも記録）
- [ ] global skill 同期が N/A である旨が明記されている

## タスク100%実行確認【必須】

- [ ] サブタスク 1〜6 が完了している
- [ ] outputs/phase-12/* の 7 ファイル（6 成果物 + main.md）が配置済み
- [ ] implementation-guide の視覚証跡 canonical 名が Phase 11 screenshot-plan.json と一致している（不一致 0 件）
- [ ] current / baseline が混同なく分離されている
- [ ] 作成済み phase12-task-spec-compliance-check.md を上書きしていない
- [ ] artifacts.json の Phase 12 ステータスが spec_created に整合している

## 次Phase

- 次: Phase 13（PR 作成）
- 引き継ぎ事項: implementation-guide（PR 本文の Phase 13 仕様）/ unassigned baseline / 視覚証跡 canonical 名（6 PNG）
- ブロック条件: 6 成果物のいずれかが欠落する場合は本 Phase に留まる
