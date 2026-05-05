# Phase 12: ドキュメント更新 — 08a-B-public-search-filter-coverage

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | 08a-B-public-search-filter-coverage |
| phase | 12 / 13 |
| wave | 08a-fu |
| mode | parallel |
| 作成日 | 2026-05-01 |
| taskType | implementation |
| visualEvidence | VISUAL_ON_EXECUTION |

## 目的

正本仕様、workflow 状態、未タスク、skill feedback の更新方針を固定する。implementation-guide / system-spec-update-summary / documentation-changelog / unassigned-task-detection / skill-feedback-report / phase12-task-spec-compliance-check を生成する。

## 中学生レベル概念説明

「検索とフィルタ」を中学生にもわかる言葉で説明すると次のとおり。

- **q（キーワード検索）**: 入力した文字を含む人を見つける。例: 「鈴木」と入れたら名前の一部に「鈴木」がある人だけが残る。
- **zone（地域）**: 神戸・阪神・播磨など、決まったリスト（enum）から1つ選ぶ。書いていない地域名は受け付けない。
- **status（参加ステータス）**: 「正会員」「非会員」「アカデミー」など、UBM への参加区分で絞る。公開/非公開の切り替えではない。
- **tag（タグ）**: 「ピアノ」「合唱」のような印を複数つけられる。複数選ぶと「全部当てはまる人」だけが残る（AND 条件）。
- **sort（並び順）**: 名前順 / 入会日順 / 更新日順から選ぶ。
- **density（表示密度）**: カードを詰めて並べるか、ゆったり並べるかの見た目だけの設定。

## 日常の例え話

図書館で本を探す場面に例える。

- **q** はタイトル検索の入力欄。「ハリー」と入れると「ハリー・ポッター」が出る。
- **zone** は「文学コーナー / 児童書コーナー / 専門書コーナー」のフロア選択。
- **status** は「一般向け / 研究者向け / 子ども向け」のような本の種類。見せてよい本だけを棚に置く判断は、別の決まり（#4 公開状態フィルタ正確性）が先に守る。
- **tag** は本に貼られた「冒険」「ミステリー」シール。2枚選んだら両方貼られた本だけが残る。
- **sort** は「あいうえお順 / 新着順 / 人気順」の並べ替え。
- **density** は「本棚に詰めて並べるか / 表紙を大きく見せるか」の陳列方法。

司書（API）が本（メンバー）を絞り込み、利用者（公開ページ訪問者）が見られる棚には、最初から見せてよい本だけを置く。この土台が #4 公開状態フィルタ正確性と #5 public boundary の役割である。

## 実行タスク

1. 参照資料と該当ソースを確認する。完了条件: 接続漏れの境界が記録される。
2. 本タスク固有の scope / AC / evidence を確認する。完了条件: AC と evidence path が対応する。
3. user approval または上流 gate が必要な操作を分離する。完了条件: 自走禁止操作が明記される。

## 参照資料

- docs/00-getting-started-manual/specs/12-search-tags.md
- docs/00-getting-started-manual/specs/05-pages.md
- docs/00-getting-started-manual/specs/01-api-schema.md
- docs/00-getting-started-manual/specs/09-ui-ux.md
- docs/00-getting-started-manual/claude-design-prototype/pages-public.jsx

## 実行手順

- 対象 directory: docs/30-workflows/08a-B-public-search-filter-coverage/
- 本仕様書作成ではアプリケーションコード、deploy、commit、push、PR 作成を行わない。
- 実装・実測時は Phase 5 / Phase 11 の runbook と evidence path に従う。

## 統合テスト連携

- 上流: 08a-followup-001 base coverage, 07a tag resolve API, 06a public web smoke
- 下流: 08b playwright e2e（検索シナリオ）, 09a staging smoke（検索 smoke）

## 多角的チェック観点

- #4 公開状態フィルタ正確性
- #5 public/member/admin boundary
- #6 admin-only field を public response に含めない
- 未実装/未実測を PASS と扱わない。
- placeholder と実測 evidence を分離する。

## サブタスク管理

- [ ] implementation-guide.md の更新方針を記述
- [ ] system-spec-update-summary.md（12-search-tags.md 連携）
- [ ] documentation-changelog.md
- [ ] unassigned-task-detection.md
- [ ] skill-feedback-report.md
- [ ] phase12-task-spec-compliance-check.md
- [ ] outputs/phase-12/main.md を作成する

## 成果物

- outputs/phase-12/main.md
- outputs/phase-12/implementation-guide.md
- outputs/phase-12/system-spec-update-summary.md
- outputs/phase-12/documentation-changelog.md
- outputs/phase-12/unassigned-task-detection.md
- outputs/phase-12/skill-feedback-report.md
- outputs/phase-12/phase12-task-spec-compliance-check.md

## 完了条件

- 検索パラメータ 6種の AC と evidence path が正本仕様に逆反映される更新方針が記述される
- 12-search-tags.md / 05-pages.md / 01-api-schema.md への追記内容が specified
- 残作業（08b E2E / 09a smoke）への引き継ぎ事項が明示される

## タスク100%実行確認

- [ ] この Phase の必須セクションがすべて埋まっている
- [ ] 中学生レベル概念説明と日常の例え話が含まれる
- [ ] 実装、deploy、commit、push、PR を実行していない

## 次 Phase への引き渡し

Phase 13 へ、ドキュメント更新方針と changelog を渡す。
