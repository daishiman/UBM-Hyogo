# Phase 12 Output: Implementation Guide（PR メッセージ素材 / Part 1 + Part 2）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク ID | task-ut21-forms-sync-conflict-closeout-001 |
| Phase | 12 / 13 |
| visualEvidence | NON_VISUAL |
| GitHub Issue | #234（CLOSED 維持） |
| 用途 | Phase 13 PR description 素材（中学生向けサマリー + 技術者向け詳細） |

---

## Part 1: 中学生向け（古い地図と新しい地図のアナロジー）

### 全体メタファー

学校で「宝探しゲーム」をするとき、昔配られた**古い地図（UT-21 当初仕様 = Sheets 経由で宝箱を探す）**と、今みんなが使っている**新しい地図（現行 Forms sync 実装）**があります。

古い地図はもう使わないけれど、書いてある内容には大事なヒントも残っているので、**破らないで倉庫にしまっておきます**。そして表紙に大きな矢印で「これは古い地図、今はこちらの新しい地図 →」と書きます。これが今回のお話です。

### 例え話 1: 同期元の違い（情報をどこから取ってくるか）

- **古い地図**: 「校門の掲示板（Google Sheets）を見にいって、書いてあることをノートに写す」
- **新しい地図**: 「先生の出席簿（Google Forms API）を直接見せてもらう」

掲示板までの道順を新しい地図にわざわざ書き写すのは無駄だし、間違いのもとです。だから、**新しい地図に書いてある「出席簿を見るやり方」をそのまま正本（マスター）として使う**ことにしました。古い「掲示板の道順」は倉庫の地図に残したままにします。

### 例え話 2: 新しい部屋を作らない判断（ルートと記録部屋）

古い地図には、こう書いてありました。

- 「**宝物庫（`POST /admin/sync` という単一の入口）**」を新しく作る
- 「**記録部屋（`GET /admin/sync/audit`）**」を新しく作る
- 「記録ノート（`sync_audit_logs`）」と「出荷待ち箱（`sync_audit_outbox`）」も追加する

でも、今の校舎にはすでに**書類棚（`sync_jobs` ledger）**があって、いつ・誰が・何を運んだかは全部そこに書いてあります。だから**新しい部屋は建てない**ことにしました。「本当に新しい部屋がいるかな？」というのは別の宿題（**U02**）にして、ゆっくり考えます。

### 例え話 3: 残った宿題の引き渡し（大事なメモを誰に渡すか）

古い地図に書かれた「これは今でも大事だね」というメモは 4 つあります。

| メモ | やさしい言葉 | 渡し先 |
| --- | --- | --- |
| Bearer guard | 鍵を持った人だけが入れる仕組み | 03a |
| 409 排他 | 二人が同時に同じ仕事をしないようにする | 03b |
| D1 retry | 混雑したときに少し待ってやり直す | 04c |
| manual smoke | 本番前に手で動かして確かめる | 09b |

このタスクでは、**「メモを誰に渡すか」だけを決めて完結**します。実際にメモを書き写す（patch を当てる）作業は、それぞれの係（03a / 03b / 04c / 09b）が自分のタスクの中でやります。

### 例え話 4: 倉庫に置いた古い地図（cross-link）

古い地図を破ってしまうと「なぜそう決めたのか」という昔の議論が消えてしまいます。だから倉庫（`docs/30-workflows/unassigned-task/` 配下）にそのまま置いて、表紙に「**これは古い地図 / 状態 = legacy・close-out 済 / 新しい地図はここ →**」と書きました。これを cross-link（行き来できるリンク）と呼びます。

### 締め

このタスクは「**コードは書かない / 仕様書だけ整理する**」というルールです。だから、宝探しのルールブック（仕様書）の表紙だけを書き換えて、実際の宝探し（プログラム）は別の人たちのタスクで進めます。仕様書の整理だけが本タスクの責務です。

---

## Part 2: 技術者向け（棚卸し / 移植 / 後続タスク）

### 1. 棚卸し対象（UT-21 当初仕様の 5 項目）

`docs/30-workflows/unassigned-task/UT-21-sheets-d1-sync-endpoint-and-audit-implementation.md` の以下 5 項目を本 close-out で stale 化する。

| # | UT-21 当初仕様 | 現行 Forms sync 正本での扱い |
| --- | --- | --- |
| 1 | 同期元: Google Sheets API direct | **却下**: `forms.get` / `forms.responses.list` を正本（CLAUDE.md 不変条件 #7 と整合） |
| 2 | 単一 `POST /admin/sync` endpoint | **却下**: `POST /admin/sync/schema` / `POST /admin/sync/responses` 分割を正本 |
| 3 | `GET /admin/sync/audit` endpoint | **保留**: 必要性は U02 で再判定（`sync_jobs` ledger でカバー可能か精査） |
| 4 | `sync_audit_logs` + `sync_audit_outbox` テーブル | **保留**: 同上 U02 判定後まで新設しない |
| 5 | 実装パス `apps/api/src/sync/{core,manual,scheduled,audit}` | **却下**: 現行 `apps/api/src/jobs/sync-forms-responses.ts` + `apps/api/src/sync/schema/*` を正本（境界整理は U05 で formalize） |

### 2. 抽出キー（rg / grep の検索拠点）

- API: `forms.get` / `forms.responses.list`
- endpoint: `POST /admin/sync/schema` / `POST /admin/sync/responses`
- ledger: `sync_jobs`
- 実装: `apps/api/src/jobs/sync-forms-responses.ts` / `apps/api/src/sync/schema/`
- 禁止 keyword: `POST /admin/sync`（単一形）/ `GET /admin/sync/audit` / `sync_audit_logs` / `sync_audit_outbox`

### 3. close-out カテゴリ

| カテゴリ | 対応 | 本 PR での扱い |
| --- | --- | --- |
| docs-only（本 PR で完結） | 移植マトリクス / 新設禁止方針 / U02-U05 cross-link / `task-workflow.md` current facts 追記 | 完了 |
| derived-task 移植（既存 Phase で適用） | Bearer guard → 03a / 409 排他 → 03b / D1 retry+SQLITE_BUSY backoff → 04c / manual smoke → 09b | cross-link のみ（patch 適用は各タスク） |
| 後続独立タスク（既起票） | U02（audit table 要否）/ U04（real-env smoke）/ U05（実装パス境界） | cross-link のみ |

### 4. 派生 IMPL タスク命名規則

本タスクで新規 IMPL タスクは作成しない。派生対応はすべて以下既存 / 既起票タスクへ吸収済み。

- 既存タスク: 03a / 03b / 04c / 09b
- 既起票後続: `task-ut21-sync-audit-tables-necessity-judgement-001`（U02）/ `task-ut21-phase11-smoke-rerun-real-env-001`（U04）/ `task-ut21-impl-path-boundary-realignment-001`（U05）

### 5. 検証コマンド一覧

```bash
# UT-21 当初仕様の状態欄パッチ確認
rg -n "legacy / close-out 済" docs/30-workflows/unassigned-task/UT-21-sheets-d1-sync-endpoint-and-audit-implementation.md

# current facts 反映確認
rg -n "UT-21" .claude/skills/aiworkflow-requirements/references/task-workflow.md

# 後続タスク 3 件存在確認
ls docs/30-workflows/unassigned-task/task-ut21-*.md

# Issue #234 CLOSED 確認
gh issue view 234 --json state,title,url

# spec 整合確認
node scripts/validate-phase-output.js --task ut21-forms-sync-conflict-closeout
node scripts/verify-all-specs.js
```

### 6. 不変条件 reaffirmation

| # | 不変条件 | 本 close-out での扱い |
| --- | --- | --- |
| #1 | 実フォーム schema をコードに固定しすぎない | PASS（schema コード非変更） |
| #4 | Form schema 外データは admin-managed として分離 | PASS（Sheets direct 経路を排除し境界強化） |
| #5 | D1 直接アクセスは `apps/api` に閉じる | PASS（`apps/web → D1` 表現 0 件） |
| #7 | MVP では Google Form 再回答が本人更新の正式経路 | PASS（同期元を Forms API に固定） |

### 7. PR メッセージ素材として使う場合のスニペット

> UT-21（Sheets→D1 sync direct 実装）を legacy umbrella として close-out し、現行 Forms sync 実装（`forms.get` / `forms.responses.list` + `sync_jobs` ledger）を正本に固定する docs-only 仕様 cleanup。新規 endpoint / D1 テーブル / Worker binding は追加しない（IF 新設禁止が成果物そのもの）。有効品質要件 4 種は 03a / 03b / 04c / 09b へ移植先のみ提示し、後続独立判断は U02 / U04 / U05 として既起票済。`apps/` / `packages/` 配下の変更 0 件・`workflow_state = spec_created` 据え置き。Issue #234 は CLOSED のまま、本仕様書を成果物として cross-link する。

### 8. Secret hygiene

本ガイドおよび関連 outputs に `SYNC_ADMIN_TOKEN` / `GOOGLE_FORMS_API_KEY` / `GOOGLE_PRIVATE_KEY` / `CLOUDFLARE_API_TOKEN` / OAuth トークンの実値は含まない（参照名のみ）。`gh issue view 234 --json state,title,url` の出力も state / title / url のみで token を含まない。
