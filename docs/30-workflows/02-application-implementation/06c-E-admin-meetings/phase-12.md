# Phase 12: ドキュメント更新 — 06c-E-admin-meetings

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | 06c-E-admin-meetings |
| phase | 12 / 13 |
| wave | 06c-fu |
| mode | parallel |
| 作成日 | 2026-05-01 |
| taskType | implementation-spec / docs-only |
| visualEvidence | VISUAL_ON_EXECUTION |

## 目的

正本仕様、runbook、lessons learned、未割当タスク、skill feedback の同期を定義する。実装担当が「次に同じ機能を作る人」に向けて中学生でも分かる言葉で説明できる状態を作る。

## このタスクは何をやっているのか（中学生レベルの説明）

`/admin/meetings` は「UBM 兵庫支部会の管理者が、いつ・どこで集まりがあったか、誰が来たかをパソコンから記録して、あとで Excel で見られるように CSV として書き出せる画面」を作るタスクです。

会員さんの自己紹介（プロフィール）は Google フォームに本人が書いた内容を正解とするけれど、「集まりの開催日」と「誰が来たか」はフォームには書かれていないので、管理者だけがログインして使う別の小さなノートを作る、というイメージです。

### 日常の例え話

学校の出席簿を考えてみてください。

- **生徒名簿**は別ファイル（これは Google フォーム = 会員データに相当）。
- **出席簿**は先生だけが書き込めるノート（これが今回作る `meetings` と `meeting_attendances`）。
- 「4 月 10 日（月）の朝の会、出席者は A さん B さん C さん」と書く欄が `meetings` 表 + `meeting_attendances` 表。
- 学期末に「4 月の出席状況を Excel で印刷したい」と言われて、CSV ボタンを押すと一覧が出てくる、これが `export.csv`。

そして「先生以外の生徒が出席簿を書き換えられたら困る」ので、職員室の鍵（= admin session cookie）を持っている人しか開けないようにします。これが `requireAdmin` middleware です。鍵が 2 つ必要（apps/web の middleware と apps/api の requireAdmin）なのは、職員室のドアと出席簿が入った金庫の両方に鍵をかけるのと同じ理由です。片方の鍵が壊れても、もう片方が守ってくれる仕組みです。

## 実行タスク

1. `outputs/phase-12/implementation-guide.md` を作る。完了条件: 実装担当者が runbook に沿って手戻りなく進められる。
2. `outputs/phase-12/system-spec-update-summary.md` を作る。完了条件: `11-admin-management.md` 等への追記差分が表現される。
3. `outputs/phase-12/documentation-changelog.md` を作る。完了条件: 変更ファイル一覧と理由が出る。
4. `outputs/phase-12/unassigned-task-detection.md` を作る。完了条件: 未割当の followup（例: meetings 自動繰り返し、本人セルフ申告 UI）が一覧化される。
5. `outputs/phase-12/skill-feedback-report.md` を作る。完了条件: task-specification-creator skill 利用上の改善点が記録される。
6. `outputs/phase-12/phase12-task-spec-compliance-check.md` を作る。完了条件: 13 phase の必須セクション充足が ✅ で記録される。

## 参照資料

- docs/00-getting-started-manual/specs/11-admin-management.md
- docs/00-getting-started-manual/specs/05-pages.md
- docs/00-getting-started-manual/specs/13-mvp-auth.md
- outputs/phase-01/main.md 〜 outputs/phase-11/main.md

## 実行手順

- 対象 directory: docs/30-workflows/02-application-implementation/06c-E-admin-meetings/
- 本仕様書作成ではアプリケーションコード、D1 migration 適用、deploy、commit、push、PR 作成を行わない。
- 中学生レベル説明は「専門用語の前に必ず日常の例え話を添える」原則で書く。

## 統合テスト連携

- 上流: 06c admin pages 本体, 06b-followup-002 session resolver
- 下流: 08b admin meetings E2E, 09a staging admin smoke

## 多角的チェック観点

- #4 admin-managed data 分離
- #5 apps/web D1 direct access forbidden
- #13 audit log
- #15 Auth session boundary
- 専門用語に必ず例え話 / 平易な言い換えが付いているか。

## サブタスク管理

- [ ] implementation-guide.md を作る
- [ ] system-spec-update-summary.md を作る
- [ ] documentation-changelog.md を作る
- [ ] unassigned-task-detection.md を作る
- [ ] skill-feedback-report.md を作る
- [ ] phase12-task-spec-compliance-check.md を作る
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

- 6 種類のドキュメントが揃う
- 中学生レベル説明と日常の例え話が含まれる
- 未割当 followup が漏れなく抽出される

## タスク100%実行確認

- [ ] この Phase の必須セクションがすべて埋まっている
- [ ] follow-up gate の仕様になっている
- [ ] 実装、deploy、commit、push、PR を実行していない

## 次 Phase への引き渡し

Phase 13 へ、ドキュメント一式と未割当 followup を渡す。
