[実装区分: 実装仕様書]

# Phase 12: ドキュメント更新 — 06c-B-admin-members-implementation-execution

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | 06c-B-admin-members-implementation-execution |
| phase | 12 / 13 |
| wave | 06c-fu |
| mode | parallel |
| 作成日 | 2026-05-04 |
| taskType | implementation |
| visualEvidence | VISUAL_ON_EXECUTION |

## 目的

正本仕様、runbook、lessons learned、未割当タスクの同期を確定する。Phase 12 strict outputs 7 ファイルの更新内容を中学生レベルの概念説明とともに定義する。

## 実行タスク

1. Phase 12 strict outputs 7 files を `outputs/phase-12/` に実体化する。
2. system spec update は既存正本 `completed-tasks/06c-B-admin-members` と重複させず、追加 sync が不要な理由を記録する。
3. skill feedback と compliance check に `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` を明記し、未実測 runtime evidence を PASS 化しない。
4. artifacts parity と Phase 11 pending evidence contract を検証する。

## 中学生レベル概念説明（日常の例え話つき）

### 「論理削除（soft delete）」

データを完全に消すのではなく、「消したフラグ」を立てるだけの削除。

> 例え話: 出席簿で転校した友達の名前を**消しゴムで消す（物理削除）**のではなく、**斜線を引いて『転校』と書く（論理削除）**。後から戻ってきても復活できる。

### 「audit log（監査ログ）」

誰が、いつ、どのデータに、何をしたかを残す記録。

> 例え話: コンビニの**防犯カメラ**。後から「いつ、誰が、誰に何をしたか」を必ず追えるようにする記録。

### 「admin guard（require-admin middleware）」

「この入り口は admin 専用」という札と鍵を扉に付ける仕組み。

> 例え話: 学校の**職員室の鍵**。鍵がない人がドアノブを回したら自動で「入れません（403）」。鍵自体を持っていない（未ログイン）人には「誰ですか？（401）」と返す。

### 「検索 query parameter」

URL の `?` の後ろに付ける条件指定。

> 例え話: 図書館の**検索カード**。「ジャンル: 小説」「貸出可」を組み合わせて目的の本を絞り込むのと同じ。

### 「不変条件 #5（apps/web は D1 直参照禁止）」

ブラウザに近い側のサーバ（apps/web）はデータベースを直接触らず、必ず apps/api を経由する。

> 例え話: 学校の倉庫の鍵を生徒に直接渡さず、必ず**事務員（apps/api）**にお願いして取ってきてもらう。

## Phase 12 strict outputs（7 ファイル）

| # | path | 更新内容 |
| --- | --- | --- |
| 1 | `outputs/phase-12/main.md` | Phase 12 の総括、参照リンク集 |
| 2 | `outputs/phase-12/implementation-guide.md` | 実装手順サマリ（Endpoint contract / 検索 SQL / Web UI / packages/shared 追加 / 不変条件 / Test 追加 / Quality gate）。Phase 5 と整合 |
| 3 | `outputs/phase-12/system-spec-update-summary.md` | 11-admin-management / 07-edit-delete / 12-search-tags への追補要否判定（追補なし: 既存仕様で網羅 / 追補あり: 該当箇所を列挙） |
| 4 | `outputs/phase-12/documentation-changelog.md` | 本タスクで更新した doc の path / 変更概要 |
| 5 | `outputs/phase-12/unassigned-task-detection.md` | admin の他機能（CSV export / 統計 / 一括操作 / role 管理 UI 等）の未割当タスク検出 |
| 6 | `outputs/phase-12/skill-feedback-report.md` | task-specification-creator skill への feedback（実装区分・CONST_005 適合等） |
| 7 | `outputs/phase-12/phase12-task-spec-compliance-check.md` | 本仕様書の compliance 自己確認（13 phase 構造 / メタ情報 / 必須セクション / CONST_005） |

## 入出力・副作用

- 入力: Phase 5 実装、Phase 9 quality gate 結果、Phase 11 evidence
- 出力: 上記 7 ファイル
- 副作用: 仕様書ドキュメントのみ追加。コードは変更しない

## ローカル実行・検証コマンド

```bash
ls outputs/phase-12/
# 7 ファイル全存在を確認
test -f outputs/phase-12/main.md \
  && test -f outputs/phase-12/implementation-guide.md \
  && test -f outputs/phase-12/system-spec-update-summary.md \
  && test -f outputs/phase-12/documentation-changelog.md \
  && test -f outputs/phase-12/unassigned-task-detection.md \
  && test -f outputs/phase-12/skill-feedback-report.md \
  && test -f outputs/phase-12/phase12-task-spec-compliance-check.md \
  && echo "all 7 outputs present"
```

## DoD

- [ ] 中学生レベル概念説明 + 日常例え話が 5 概念に対して書かれている
- [ ] Phase 12 必須 7 ファイルが全部存在
- [ ] 正本仕様への追補要否が記録されている
- [ ] secret / PII が転記されていない

## 参照資料

- `docs/00-getting-started-manual/specs/11-admin-management.md`
- `docs/00-getting-started-manual/specs/07-edit-delete.md`
- `docs/00-getting-started-manual/specs/12-search-tags.md`
- `docs/00-getting-started-manual/specs/09-ui-ux.md`
- `docs/30-workflows/completed-tasks/06c-B-admin-members/outputs/phase-12/implementation-guide.md`

## 統合テスト連携

- 上流: Phase 11 evidence
- 下流: Phase 13 PR 作成

## 多角的チェック観点

- #4 / #5 / #11 / #13 を doc 更新でも侵さない
- secret 値が doc に転記されていない
- 例え話に PII / 実会員情報が混ざらない

## サブタスク管理

- [ ] 5 概念の例え話を書く
- [ ] Phase 12 必須 7 ファイルを作る
- [ ] 追補要否判定を行う
- [ ] outputs/phase-12/main.md を作成する

## 成果物

- `outputs/phase-12/main.md`
- `outputs/phase-12/implementation-guide.md`
- `outputs/phase-12/system-spec-update-summary.md`
- `outputs/phase-12/documentation-changelog.md`
- `outputs/phase-12/unassigned-task-detection.md`
- `outputs/phase-12/skill-feedback-report.md`
- `outputs/phase-12/phase12-task-spec-compliance-check.md`

## 完了条件

- [ ] Phase 12 必須 7 ファイルが全存在
- [ ] 中学生レベル概念説明が 5 概念分書かれている
- [ ] 正本仕様への追補要否が判定されている

## タスク100%実行確認

- [ ] この Phase の必須セクションがすべて埋まっている
- [ ] 実装・deploy・commit・push・PR を行っていない
- [ ] CONST_005 必須項目が網羅されている

## 次 Phase への引き渡し

Phase 13 へ、doc 同期結果と PR description 素材を渡す。
