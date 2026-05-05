# Phase 12 出力 — ドキュメント更新

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | 08a-B-public-search-filter-coverage |
| phase | 12 / 13 |
| wave | 08a-fu |
| mode | parallel |
| 作成日 | 2026-05-04 |
| taskType | implementation |
| visualEvidence | VISUAL_ON_EXECUTION |
| workflow_state | implemented_local |

## 目的

`/members` 検索/フィルタ仕様（q / zone / status / tag / sort / density）を正本仕様（`12-search-tags.md` / `05-pages.md` / `01-api-schema.md` / `09-ui-ux.md`）に逆反映する更新方針を固定し、Phase 12 必須 6 タスク × 7 成果物ファイルを揃える。

## 中学生レベル概念説明

「検索とフィルタ」を中学生にもわかる言葉で説明すると次のとおり。

- **q（キーワード検索）**: 入力した文字を含む人を見つける。例: 「鈴木」と入れたら名前の一部に「鈴木」がある人だけが残る。
- **zone（地域）**: 神戸・阪神・播磨など、決まったリスト（enum）から1つ選ぶ。書いていない地域名は受け付けない。
- **status（参加ステータス）**: 「正会員」「非会員」「アカデミー」のような UBM への参加区分で絞る。公開・非公開を選ぶ項目ではない。
- **tag（タグ）**: 「ピアノ」「合唱」のような印を複数つけられる。複数選ぶと「全部当てはまる人」だけが残る（AND 条件）。
- **sort（並び順）**: 名前順 / 入会日順 / 更新日順から選ぶ。
- **density（表示密度）**: カードを詰めて並べるか、ゆったり並べるかの見た目だけの設定。

## 日常の例え話

図書館で本を探す場面に例える。

- **q** はタイトル検索の入力欄。「ハリー」と入れると「ハリー・ポッター」が出る。
- **zone** は「文学コーナー / 児童書コーナー / 専門書コーナー」のフロア選択。
- **status** は「一般向け / 研究者向け / 子ども向け」。本の種類で絞る。見せてよい本だけを棚に置く判断は、別の決まり（#4 公開状態フィルタ正確性）が先に守る。
- **tag** は本に貼られた「冒険」「ミステリー」シール。2枚選んだら両方貼られた本だけが残る。
- **sort** は「あいうえお順 / 新着順 / 人気順」の並べ替え。
- **density** は「本棚に詰めて並べるか / 表紙を大きく見せるか」の陳列方法。

司書（API）が本（メンバー）を絞り込み、利用者（公開ページ訪問者）が見る棚には、最初から見せてよいものだけが並ぶ。この構造が #4 公開状態フィルタ正確性と #5 public boundary の役割を分けて守る。

## 6 必須タスクの実行サマリ

| # | タスク | 必須 | status | 出力ファイル |
| - | ------ | ---- | ------ | ------------ |
| 1 | 実装ガイド作成（Part 1 中学生 / Part 2 技術者） | ✅ | drafted | `implementation-guide.md` |
| 2 | システム仕様書更新方針（Step 1-A/B/C + 条件付き Step 2） | ✅ | drafted | `system-spec-update-summary.md` |
| 3 | ドキュメント更新履歴 | ✅ | drafted | `documentation-changelog.md` |
| 4 | 未タスク検出（0 件でも必須） | ✅ | drafted | `unassigned-task-detection.md` |
| 5 | スキルフィードバック（改善点なしでも必須） | ✅ | drafted | `skill-feedback-report.md` |
| 6 | Phase 12 タスク仕様 compliance check | ✅ | drafted | `phase12-task-spec-compliance-check.md` |

> Phase 12 close-out 判定: `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING`。本タスクは `implementation / implemented_local` であり、Phase 12 review で検出した AC 直結の API drift は実コードへ反映済み。deploy、commit、push、PR は user approval まで実行しない。Phase 11 screenshot / curl / axe は 08b / 09a runtime cycle で取得する。

## 7 ファイル成果物リンク

- [main.md](./main.md)
- [implementation-guide.md](./implementation-guide.md)
- [system-spec-update-summary.md](./system-spec-update-summary.md)
- [documentation-changelog.md](./documentation-changelog.md)
- [unassigned-task-detection.md](./unassigned-task-detection.md)
- [skill-feedback-report.md](./skill-feedback-report.md)
- [phase12-task-spec-compliance-check.md](./phase12-task-spec-compliance-check.md)

## 多角的チェック観点

- 不変条件 #4 公開状態フィルタ正確性: API ベース WHERE で `publish_state='public' AND is_deleted=0 AND public_consent='consented'` 固定（Phase 2 設計で確定）
- 不変条件 #5 public/member/admin boundary: `apps/web` から D1 直アクセスなし、`fetchPublic` 経由のみ（AC-INV5）
- 不変条件 #6 admin-only field 非露出: `PublicMemberListViewZ.strict()` + SELECT 句 allowlist + `SUMMARY_KEYS` 二重防御（AC-INV6）
- 未実装/未実測を PASS と扱わない（runtime evidence は Phase 11 で取得）
- placeholder と実測 evidence を分離する（Phase 11 で生成、Phase 12 はパス参照のみ）

## 自走禁止操作（本 Phase で実行しないこと）

- 追加のアプリケーションコード実改変（Phase 12 review で検出した AC 直結の `apps/api` 修正は本 branch に含める）
- `pnpm build` / `wrangler deploy` 系の deploy
- `git commit` / `git push` / PR 作成
- D1 への migration apply
- aiworkflow-requirements `references/` の SKILL.md / asset 直接編集（本タスクは specs/12-search-tags.md 系のみが正本更新先）

## 完了条件チェックリスト

- [x] 中学生レベル概念説明と日常の例え話を継承
- [x] 7 ファイル成果物がすべて drafted 状態で揃った
- [x] 検索パラメータ 6 種の AC と evidence path が正本仕様への逆反映方針として記述された
- [x] `12-search-tags.md` / `05-pages.md` / `01-api-schema.md` / `09-ui-ux.md` への追記内容が specified
- [x] 残作業（08b E2E / 09a smoke）への引き継ぎが明示された
- [x] 自走禁止操作が明記されている

## 次 Phase への引き渡し

Phase 13 へ以下を渡す:

- PR 本文ドラフトの種（`implementation-guide.md` Part 2）
- 含めるべき変更ファイル一覧の予想（`system-spec-update-summary.md` 参照）
- スクリーンショット参照（`outputs/phase-11/screenshots/*.png`）
- user approval gate の宣言（`user_approval_required: true`）
- 本仕様書作成タスクではコミット・push・PR を実行しないことの明示
