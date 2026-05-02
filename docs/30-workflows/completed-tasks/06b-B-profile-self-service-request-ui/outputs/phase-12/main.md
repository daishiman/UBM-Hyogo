# Phase 12 outputs main — 06b-B-profile-self-service-request-ui

## 集約サマリー

`/profile` に公開停止/再公開申請と退会申請の UI を追加するタスクの Phase 12 ドキュメント更新ハブ。中学生レベル概念説明と開発者レベル技術詳細を `implementation-guide.md` に集約し、関連仕様書 3 種への反映ポイントを記録する。

## 中学生レベル概念説明（Part 1 サマリー）

### 1. 公開停止申請とは何か

学校の連絡網で「自分の名前を一旦載せないでほしい」と先生にお願いするようなものです。たとえば、仕事や家庭の事情で一時的にメンバーディレクトリから自分の名前を出したくない時、マイページのボタンから「公開を止めてほしい」と申請します。管理者がそれを確認してから、実際に表示が止まります。後で「やっぱりまた載せて良いです」と言いたいときも同じボタンから再公開を申請できます。

### 2. 退会申請とは何か

図書館の利用カードを返すようなものです。たとえば、引っ越しや所属変更で会から離れる時に、データを残したまま放置せず、きれいに会員リストから自分を抜きたい時に使います。マイページから「退会したい」と申請すると、管理者が手続きを確定して、はじめて退会扱いになります。

### 3. なぜ二重申請を防ぐのか

同じ宅配便を 2 回頼むと、配達員さんがどちらを届けて良いか分からなくなって混乱しますよね。それと同じで、同じ申請が 2 件入ってしまうと管理者がどちらを処理して良いか判断できません。そこで、すでに処理待ちの申請があれば、もう一度ボタンを押した時に「もう受け付けています」とやさしく伝えて、ボタンを押せない状態（disabled）にします。

## 更新対象ドキュメント一覧

| ファイル | 更新内容 | 反映タイミング |
| --- | --- | --- |
| `docs/00-getting-started-manual/specs/05-pages.md` | `/profile` ページ構成図に `RequestActionPanel` を追記 | 実装 PR と同 wave |
| `docs/00-getting-started-manual/specs/07-edit-delete.md` | 公開停止/退会の正式入口を「マイページから申請」と正本化 | 実装 PR と同 wave |
| `docs/00-getting-started-manual/specs/09-ui-ux.md` | dialog の a11y 要件と error mapping 表を追記 | 実装 PR と同 wave |
| `apps/web/app/profile/README.md` | 存在する場合のみ component 責務表を追記 | 任意 |
| `outputs/phase-12/implementation-guide.md` | Part 1 / Part 2 を記載 | 必須 |
| `outputs/phase-12/system-spec-update-summary.md` | Step 1 / Step 2 結果を記録 | 必須 |
| `outputs/phase-12/documentation-changelog.md` | 変更ファイルと validator 結果 | 必須 |
| `outputs/phase-12/unassigned-task-detection.md` | pending banner sticky 化など 2 候補 | 必須 |
| `outputs/phase-12/skill-feedback-report.md` | スキル改善点 | 必須 |
| `outputs/phase-12/phase12-task-spec-compliance-check.md` | Task 12-1〜12-5 準拠確認 | 必須 |

## ドキュメント drift チェック手順

```bash
# 旧文言（Form のみが正式入口）が残っていないこと
rg -n "Google Form のみ|Form 再回答のみ" docs/00-getting-started-manual/specs/

# 新規 component 名が仕様書に出現すること
rg -n "RequestActionPanel|VisibilityRequestDialog|DeleteRequestDialog" docs/00-getting-started-manual/specs/

# planned wording が outputs/phase-12 に残っていないこと
rg -n "計画|予定|TODO|保留として記録|仕様策定のみ" \
  docs/30-workflows/completed-tasks/06b-B-profile-self-service-request-ui/outputs/phase-12/
```

## evidence path 対応表

| AC | evidence path |
| --- | --- |
| AC-1 公開停止/再公開申請を送れる | `outputs/phase-11/screenshots/visibility-dialog.png`, E2E S1/S2 |
| AC-2 退会申請を送れる | `outputs/phase-11/screenshots/delete-dialog.png`, E2E S3 |
| AC-3 二重申請 409 をユーザーに分かる形で表示 | `outputs/phase-11/screenshots/TC-06-duplicate-409-light.png`, E2E S4 |
| AC-4 本文編集 UI を追加しない | grep 監査結果（dialog field が `desiredState`/`reason` のみ） |
| AC-5 スクリーンショット/E2E 保存 | `outputs/phase-11/screenshots/`, Playwright report |

## approval gate

- 実装、deploy、commit、push、PR 作成は本仕様書作成タスクには含めない
- 実装 worktree で本仕様に従って `/ai:diff-to-pr` を起動する

## status

IMPLEMENTED_LOCAL_WITH_DEFERRED_RUNTIME_VISUAL_EVIDENCE — `/profile` self-service request UI はローカル実装済み。deploy・外部 smoke・runtime screenshot / unskipped E2E は Phase 11 runtime evidence として後続 gate で取得する。
