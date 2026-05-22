# Phase 12: ドキュメント更新

| 項目 | 値 |
|------|-----|
| workflow | task-spec-2d-contract-stage-2 |
| phase | 12 |
| 起点日 | 2026-05-11 |
| 実装区分 | 実装仕様書 |
| classification | NON_VISUAL / contract |
| coverageTier | standard |

---

## 1. 中学生レベルの概念説明（なぜこの test が必要か）

UI を作るとき、まだ本物のサーバーに繋がない状態で「もしサーバーが `{ reason: '退会希望' }` を受け取ったら成功するはず」という**仮の返事（fixture）** を用意して画面の動きを確かめます。E2E テスト（2a/2b/2c）はこの仮の返事を使って「ボタンを押したら画面がこう変わる」を確認します。

しかし、UI 側が用意した仮の返事と、本物のサーバー側で「この形しか受け付けないよ」というルール（zod schema）が **ズレ（drift）** ていると、テストは通っても本物のサーバーに繋いだ瞬間に 422 エラーが返ってきます。これは「お店で『はい、500 円です』と店員さんに伝えて、店員さんは『うん、わかった』と返したのに、レジに通したら『その金額では会計できません』と機械が止まる」のと同じ状況です。

この task で作る contract test は、UI が用意した仮の返事と、サーバー側のルール（zod schema）を **コンピュータに両方読み込ませて、本当に同じ形になっているか機械的に照らし合わせる** 検査です。ズレていたら CI が赤くなって PR が止まるので、本番で初めて発覚する事故を防げます。

---

## 2. implementation-guide.md（`outputs/phase-12/implementation-guide.md` 想定）

以下の内容を含める:

| 節 | 内容 |
|----|------|
| 概要 | drift 検知の必要性、4 sub-task 並列開発における 2d の位置 |
| 検証対象 7 endpoint | API endpoint inventory 表を再掲 |
| fixture 標準形 | Phase 2 §4 の表を再掲、`mergeResponseBody` は shared 正本に整合する旨を明示 |
| 中学生レベル説明 | 本ファイル §1 をそのまま転載 |
| ローカル実行コマンド | `pnpm --filter @ubm-hyogo/api test contract-stage-2` 等 4 commands |
| 失敗時の読み解き方 | ZodError の path / message から fixture / schema 側どちらを直すかの判断フロー |

---

## 3. 2a/2b/2c 仕様書側への注記

各 sub-task 仕様書（`2a-admin-requests.md` / `2b-admin-identity-conflicts.md` / `2c-admin-member-delete.md`）の §5 に、以下注記が含まれるよう整合させる:

> **fixture shape は `2d-contract-stage-2.md` §5 標準形に揃える**。特に merge response は `MergeIdentityResponseZ`（shared 正本）が定める `{ mergedAt, targetMemberId, archivedSourceMemberId, auditId }` の 4 field を満たすこと。

> 注記対象は 2b 仕様書が中心。2a / 2c はすでに整合する shape であれば追記のみで足りる。

---

## 4. lessons-learned 候補

| # | 学び | 反映先 |
|---|------|--------|
| 1 | 並列 sub-task の fixture drift は contract test 1 ファイルで集約検知できる | `lessons-learned/contract-tests.md` 候補 |
| 2 | route 側 zod const は別名 re-export で既存呼び出しを破壊せず外部 import を有効化できる | 同上 |
| 3 | shared schema が response shape の正本となる場合、設計仕様書（phase-4 等）の手書き shape より shared 実体を優先する | 同上 |

---

## メタ情報

| 項目 | 値 |
|------|-----|
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| workflow_state | implemented-local-runtime-pending |
| strict outputs | 7 files |

## 目的

Phase 12 strict 7 outputs、Part 1/2 implementation guide、aiworkflow same-wave sync、unassigned detection、skill feedback routing を欠落なく実行できる形にする。

## 実行タスク

1. `outputs/phase-12/` に strict 7 files を逐語名で作成する。
2. `implementation-guide.md` を Part 1 / Part 2 に分け、Part 1 は本ファイル §1 を転載する。
3. `system-spec-update-summary.md` に Step 1-A/B/C、Step 1-H、Step 2 判定、LOGS / indexes / artifacts parity を記録する。
4. `unassigned-task-detection.md` と `skill-feedback-report.md` は 0 件でも作成する。
5. `phase12-task-spec-compliance-check.md` で validator 実測値、4条件、root/output artifacts parity、same-wave sync を確認する。

## 参照資料

- `.claude/skills/task-specification-creator/references/phase-12-spec.md`
- `.claude/skills/task-specification-creator/references/phase12-compliance-check-template.md`
- `.claude/skills/aiworkflow-requirements/indexes/resource-map.md`
- `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md`
- `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md`

## 成果物

| # | path | 必須内容 |
|---|------|----------|
| 1 | `outputs/phase-12/main.md` | Phase 12 実行サマリ |
| 2 | `outputs/phase-12/implementation-guide.md` | Part 1 / Part 2、専門用語セルフチェック 5 語以上 |
| 3 | `outputs/phase-12/system-spec-update-summary.md` | Step 1-A/B/C、Step 1-H、Step 2 判定、aiworkflow sync |
| 4 | `outputs/phase-12/documentation-changelog.md` | 変更ファイル、validator、artifacts parity |
| 5 | `outputs/phase-12/unassigned-task-detection.md` | 0 件でも必須。formalize 要否と理由 |
| 6 | `outputs/phase-12/skill-feedback-report.md` | テンプレ改善 / ワークフロー改善 / ドキュメント改善 |
| 7 | `outputs/phase-12/phase12-task-spec-compliance-check.md` | root evidence。1 件欠落で FAIL |

## 完了条件

- [x] strict 7 files がすべて存在する
- [x] Part 1 / Part 2 と専門用語セルフチェック 5 語以上が存在する
- [x] aiworkflow same-wave sync 対象と no-op 判定が記録されている
- [x] unassigned detection と skill feedback が 0 件でも出力されている
- [x] タスク100%実行確認: Phase 12 の実行タスクをすべて完了してから Phase 13 へ進む
