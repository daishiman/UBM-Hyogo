# Phase 12: ドキュメント更新

## メタ情報

| 項目 | 値 |
| --- | --- |
| taskId | issue-295-tag-queue-resolve-race-smoke |
| phase | 12 |
| status | completed |
| taskType | implementation |
| visualEvidence | NON_VISUAL |

## 目的

Issue #295 / UT-07A-03 の tag queue resolve race smoke を、local implementation と runtime_pending evidence 境界が読み違えられない形で進める。

## 実行タスク

- Phase 12 の成果物を current implementation / runtime_pending 境界に同期する。
- 関連する証跡と downstream Phase 12 compliance へ trace を残す。

## 参照資料

- docs/30-workflows/issue-295-tag-queue-resolve-race-smoke/index.md
- scripts/smoke/tag-queue-race.mjs
- scripts/smoke/__tests__/tag-queue-race.test.sh

## 成果物

- outputs/phase-12/main.md

## 完了条件

- [x] Phase 12 の主成果物が存在する。
- [x] runtime_pending / user-gated 境界を必要箇所に明記する。

---

# Phase 12 — ドキュメント更新

[実装区分: 実装仕様書]

## 必須 6 成果物 + compliance check 1（task-specification-creator strict 7 準拠）

| # | ファイル | 内容 |
| --- | --- | --- |
| 1 | `outputs/phase-12/main.md` | Phase 12 全体サマリー |
| 2 | `outputs/phase-12/implementation-guide.md` | 実装者向けガイド + 中学生レベル概念説明 |
| 3 | `outputs/phase-12/system-spec-update-summary.md` | system spec 側更新サマリー（aiworkflow-requirements indexes / task-workflow / changelog / lessons / artifact inventory 同一 wave 同期） |
| 4 | `outputs/phase-12/documentation-changelog.md` | 触った docs / scripts の変更履歴 |
| 5 | `outputs/phase-12/unassigned-task-detection.md` | 新たな未割当タスクの検出（本タスクで発生したものは「なし」と明記） |
| 6 | `outputs/phase-12/skill-feedback-report.md` | task-specification-creator skill 使用フィードバック |
| 7 | `outputs/phase-12/phase12-task-spec-compliance-check.md` | Phase 12 規約準拠確認 |

> ファイルとしては 7 件だが「必須 6 成果物」+ 自己準拠確認 1 件として運用。

## implementation-guide.md に含める章

1. 概要（何を作ったか）
2. ファイル一覧と役割（Phase 05 の表）
3. 動作確認手順（dry-run / analyze-only / shell test / staging smoke）
4. evidence の読み方（result.json schema の解説）
5. **中学生レベル概念説明**

### 中学生レベル概念説明（草案）

> 「タグの審査ボタンを5人が同時に押したらどうなるか」を確かめる仕組みです。
>
> ふつう、同じ申請書を2人が同時に「OK」と承認すると、内容が二重に書き込まれてしまう恐れがあります。
> このプロジェクトの仕組みでは、「最初に取りに行けた1人だけがOKを保存できて、後から来た人には『先に取られたよ』というメッセージを返す」という決まりにしています。
>
> 普段のテストはコンピュータの中だけで動いているので、本当に「ぴったり同時」を再現できません。
> そこで staging という本番に近い練習用サーバーで、5本の腕で同時にボタンを押すスクリプトを走らせて、本当に1人だけ成功して残り4人がきちんと「失敗」と返ってくるか確かめます。
>
> もし4人とも成功してしまったり、データ件数が増えすぎていたら、仕組みのバグです。

## documentation-changelog.md の主項目

- `scripts/smoke/tag-queue-race.mjs` — 新規
- `scripts/smoke/__tests__/tag-queue-race.test.sh` — 新規
- `scripts/smoke/README.md` — 追記（or 新規）
- `docs/30-workflows/issue-295-tag-queue-resolve-race-smoke/*` — 新規（本仕様書群）
- `docs/30-workflows/unassigned-task/UT-07A-03-tag-queue-race-smoke.md` — 状態更新（resolved → 本タスクへリンク）

## unassigned-task-detection.md 想定内容

- 「本タスク実行中に新規未割当タスクは検出されなかった」
- 既存 UT-07A-03 は本タスク完了時に completed に移行する旨を記載

## skill-feedback-report.md 想定内容

- task-specification-creator skill を用いた仕様書生成の成功 / 改善点
- Phase 04 で `.test.sh` 命名が `*.test.{ts,tsx}` 禁止規約と衝突しないことを明示できた点を good として記載

## phase12-task-spec-compliance-check.md

- CONST_004（実装区分）/ CONST_005（必須項目）/ CONST_007（1サイクル完了）の遵守確認チェックリスト

## 成果物

- 上記 7 ファイル（outputs/phase-12/ 配下）

## 次 Phase

- [phase-13.md](./phase-13.md): PR 作成
