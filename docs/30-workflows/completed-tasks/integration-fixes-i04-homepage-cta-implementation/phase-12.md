# Phase 12: ドキュメント更新

## 必須成果物 6 件

| Task | 成果物 | 必須 |
|------|--------|------|
| 12-1 | `outputs/phase-12/implementation-guide.md`（Part 1 + Part 2） | ✅ |
| 12-2 | `outputs/phase-12/system-spec-update-summary.md` | ✅ |
| 12-3 | `outputs/phase-12/documentation-changelog.md` | ✅ |
| 12-4 | `outputs/phase-12/unassigned-task-detection.md`（0件でも必須） | ✅ |
| 12-5 | `outputs/phase-12/skill-feedback-report.md`（改善点なしでも必須） | ✅ |
| 12-6 | `outputs/phase-12/phase12-task-spec-compliance-check.md` | ✅ |

## Task 12-1: 実装ガイド（2パート構成）

### Part 1（中学生レベル）

「ホームページの一番下に、メンバー登録のフォームへ案内する黒い帯を置きました」「外部リンクなので別のタブで開きます」のように日常の例え話で記述。

### Part 2（開発者向け）

- TypeScript interface（`CallToActionCTAProps`）
- 使用例（`<CallToActionCTA responderUrl={FORM_RESPONDER_URL} />`）
- error handling（responderUrl が空の場合の挙動）
- 設定可能パラメータ一覧
- `## 視覚証跡` セクション — Phase 11 screenshot 3 件への参照

## Task 12-2: システム仕様更新

| Step | 内容 |
|------|------|
| Step 1-A | 完了タスク記録（workflow root / parent artifacts / parent index / parent spec / unassigned-task を同一 wave で更新） |
| Step 1-B | 実装状況テーブル: parent spec `parallel-i04-homepage-cta` を `spec_ready_implementation_pending` → `completed` |
| Step 1-C | 関連タスクテーブル更新（未タスク `unassigned-task/integration-fixes-i04-homepage-cta.md` を `resolved` に） |
| Step 2 | 条件付き — `FORM_RESPONDER_URL` は既存 specs に URL 正本が存在するため specs 追記は不要。実コード側の `/register` / `/login` 直書きを定数参照へ同期 |

## Task 12-3: documentation-changelog

全 Step（1-A / 1-B / 1-C / Step 2）の結果を個別に明記。「該当なし」も記録。
workflow-local 同期と global skill sync を別ブロックで記録（FB BEFORE-QUIT-003）。

## Task 12-4: unassigned-task-detection

ソース別チェック:

| ソース | 確認結果 |
|--------|---------|
| Phase 1 scope 外 | parent spec 「含まない」3項目 — 別タスク不要（明示的に scope 外として確認済） |
| Phase 3/10 MINOR | （Phase 10 実施後に記入） |
| Phase 11 発見事項 | （Phase 11 実施後に記入） |
| TODO/FIXME/HACK/XXX | grep で 0 件確認（Phase 9） |
| `describe.skip` 残存 | 0 件 |

0 件の場合も「0 件」と明示。

## Task 12-5: skill-feedback-report

| 観点 | 記録 |
|------|------|
| テンプレート改善 | issue が CLOSED でも未実装の場合、台帳同期が機能していない。`completed` 判定の auto-check を CI に入れる候補 |
| ワークフロー改善 | parent spec が in-place fix で完結予定だったが台帳に登録されないまま CLOSED された → in-place fix でも spec_created → completed の状態遷移を記録するルール |
| ドキュメント改善 | issue 本文と実装の同期チェック手順を `references/` に追加候補 |

改善点なしでも空 file ではなく明示的に「改善点なし」と記載。

## Task 12-6: compliance-check

`assets/phase12-task-spec-compliance-template.md` に従い、Phase 1-12 の各成果物の存在・記載項目を 1 件ずつチェック。

## 三者同期チェック（FB-04）

Step 1-A 開始時に以下 5 ファイルを同一 wave で更新:

1. `docs/30-workflows/integration-fixes-i04-homepage-cta-implementation/index.md`（phase status）
2. `docs/30-workflows/integration-fixes-i04-homepage-cta-implementation/artifacts.json`
3. `docs/30-workflows/integration-fixes-i04-homepage-cta-implementation/outputs/artifacts.json`
4. `docs/30-workflows/unassigned-task/integration-fixes-i04-homepage-cta.md`（resolved 化）
5. parent spec `docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/integration-fixes/parallel-i04-homepage-cta/spec.md`（status pending → completed）

## 完了条件

- [x] 6 成果物すべて作成
- [x] `artifacts.json` と `outputs/artifacts.json` の `phase-12.status` が同期
- [x] parent spec / parent artifacts / parent index / unassigned-task を同一 wave で同期
- [x] specs 追記不要を確認し、実コード側 SSOT を同期

## 成果物

`outputs/phase-12/{implementation-guide,system-spec-update-summary,documentation-changelog,unassigned-task-detection,skill-feedback-report,phase12-task-spec-compliance-check}.md`
