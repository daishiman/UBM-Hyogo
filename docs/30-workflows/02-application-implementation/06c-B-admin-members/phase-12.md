# Phase 12: ドキュメント更新 — 06c-B-admin-members

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | 06c-B-admin-members |
| phase | 12 / 13 |
| wave | 06c-fu |
| mode | parallel |
| 作成日 | 2026-05-01 |
| taskType | implementation-spec / docs-only |
| visualEvidence | VISUAL_ON_EXECUTION |

## 目的

正本仕様、runbook、lessons learned、未割当タスクの同期を定義する。実装担当者でも理解できるように、概念を中学生レベルで言語化する。

## 中学生レベル概念説明（日常の例え話つき）

### 「論理削除（soft-delete）」とは

データを本当に消すのではなく、「消したフラグ」を立てるだけの削除。

> 例え話: 学校の出席簿で、転校した友達の名前を**消しゴムで消す（物理削除）**のではなく、**斜線を引いて『転校』と書く（論理削除）**ようなもの。後から「やっぱり戻ってきた」と言われても、復活できる。物理削除だと、ノートを破ってしまった後で名前を書き直すのは大変。

### 「audit log（監査ログ）」とは

「誰が、いつ、どのデータに、何をしたか」を残す記録。

> 例え話: コンビニの**防犯カメラ**に近い。商品を取った人を後から確認できるようにするための録画。admin が「他の会員のロールを admin に変えた」など重要な操作をしたら、後から「いつ、誰が、誰に対して、どうしたか」を必ず追えるようにする。

### 「admin guard（require-admin middleware）」とは

「この入り口は admin 専用です」という札と鍵を扉につける仕組み。

> 例え話: 学校の**職員室の鍵**。生徒（一般会員）はそもそも入れず、職員（admin）しか開けられない。鍵がない人がドアノブを回したら、自動で「入れません（403）」と返す。鍵自体を持っていない（ログインしていない）人にはそもそも「誰ですか？（401）」と返す。

### 「検索 query パラメータ」とは

URL の `?` の後ろに付ける条件指定。「どんな会員を一覧に出したいか」を URL で表す。

> 例え話: 図書館で本を探すときの**検索カード**。「ジャンル: 小説」「著者: あ行」「貸出可」を組み合わせて目的の本を絞り込むのと同じ。URL に `?q=...&zone=...&status=...` と書くことで、サーバ側に「この条件で探して」と頼む。

### 「不変条件 #5（apps/web は D1 直参照禁止）」とは

ブラウザに近い側のサーバ（apps/web）は、データベースを直接触ってはいけないルール。必ず apps/api（API サーバ）を経由する。

> 例え話: **学校の倉庫の鍵を、生徒に直接渡さない**ようなもの。生徒（apps/web）が必要なものは、必ず**事務員（apps/api）**にお願いして取ってきてもらう。直接倉庫に入れると、必要ないものまで持ち出される危険がある。

## 更新対象ドキュメント

- `outputs/phase-12/implementation-guide.md` — 実装手順の要約
- `outputs/phase-12/system-spec-update-summary.md` — 11/07/12 系の追補点
- `outputs/phase-12/documentation-changelog.md` — 本タスクで更新した doc 一覧
- `outputs/phase-12/unassigned-task-detection.md` — admin の他機能（CSV / 統計 / 一括）など未割当の検出
- `outputs/phase-12/skill-feedback-report.md` — task-specification-creator skill への feedback
- `outputs/phase-12/phase12-task-spec-compliance-check.md` — 本仕様書の compliance 自己確認

## 実行タスク

1. 概念説明を中学生にも伝わる粒度で書く。完了条件: 上記 5 概念に例え話が紐付く。
2. 6 種ドキュメントの placeholder を作る。完了条件: 各 path が決まる。
3. 11-admin-management / 07-edit-delete / 12-search-tags への追補が必要かを判定する。完了条件: 追補要否が決まる。

## 参照資料

- docs/00-getting-started-manual/specs/11-admin-management.md
- docs/00-getting-started-manual/specs/07-edit-delete.md
- docs/00-getting-started-manual/specs/12-search-tags.md
- docs/00-getting-started-manual/specs/09-ui-ux.md

## 実行手順

- 対象 directory: docs/30-workflows/02-application-implementation/06c-B-admin-members/
- 本仕様書作成ではアプリケーションコード、deploy、commit、push、PR 作成を行わない。
- 実装・実測時は Phase 5 / Phase 11 の runbook と evidence path に従う。

## 統合テスト連携

- 上流: Phase 11 evidence
- 下流: Phase 13 PR 作成

## 多角的チェック観点

- #4 / #5 / #11 / #13 を doc 更新でも侵さない
- secret 値が doc に転記されていない
- 例え話に PII / 実会員情報が混ざらない

## サブタスク管理

- [ ] 5 概念の例え話を書く
- [ ] 6 種 doc placeholder を作る
- [ ] 追補要否判定を行う
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

- 中学生レベル概念説明 + 日常例え話が 5 概念に対して書かれる
- 6 種 doc が全部 placeholder 含めて存在する
- 正本仕様への追補要否が記録される

## タスク100%実行確認

- [ ] この Phase の必須セクションがすべて埋まっている
- [ ] 完了済み本体タスクの復活ではなく follow-up gate の仕様になっている
- [ ] 実装、deploy、commit、push、PR を実行していない

## 次 Phase への引き渡し

Phase 13 へ、doc 同期結果と PR description 素材を渡す。
