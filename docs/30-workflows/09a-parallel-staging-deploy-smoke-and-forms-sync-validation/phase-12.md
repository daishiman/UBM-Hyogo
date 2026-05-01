# Phase 12: ドキュメント更新

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 09a-parallel-staging-deploy-smoke-and-forms-sync-validation |
| Phase 番号 | 12 / 13 |
| Phase 名称 | ドキュメント更新 |
| Wave | 9 |
| Mode | parallel |
| 作成日 | 2026-04-26 |
| 前 Phase | 11 (手動 smoke) |
| 次 Phase | 13 (PR 作成) |
| 状態 | pending |

## 目的

staging deploy / sync / smoke の仕様と証跡受け入れ契約を 7 成果物として閉じ、後続 09b（release runbook）と 09c（production deploy）が参照できる状態にする。実測結果は Phase 11 実行時に記録し、本 Phase では未実行のものを PASS と扱わない。

## 実装ガイド Part 1 / Part 2 要件

### Part 1: 初学者・中学生レベル

- [ ] なぜこのタスクが必要かを、日常生活の例え話から説明する
- [ ] 専門用語を使う場合は、その場で短く説明する
- [ ] 何を作るかより先に、困りごとと解決後の状態を書く

### Part 2: 開発者・技術者レベル

- [ ] TypeScript の interface / type 定義を記載する
- [ ] API シグネチャ、使用例、エラーハンドリング、エッジケースを記載する
- [ ] 設定可能なパラメータ、定数、実行コマンド、検証コマンドを一覧化する

## 実行タスク

1. `outputs/phase-12/implementation-guide.md` 作成（staging deploy をどう実装するか）
2. `outputs/phase-12/system-spec-update-summary.md` 作成（specs/ の差分要望）
3. `outputs/phase-12/documentation-changelog.md` 作成（doc 変更点）
4. `outputs/phase-12/unassigned-task-detection.md` 作成（未割当課題）
5. `outputs/phase-12/skill-feedback-report.md` 作成（このタスクで得たノウハウ）
6. `outputs/phase-12/phase12-task-spec-compliance-check.md` 作成（不変条件 #1-#15 への適合）

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/09a-parallel-staging-deploy-smoke-and-forms-sync-validation/phase-11.md | smoke 結果 |
| 必須 | docs/30-workflows/02-application-implementation/_design/phase-2-design.md | scope 整合 |
| 必須 | docs/30-workflows/02-application-implementation/README.md | 不変条件 |
| 必須 | docs/00-getting-started-manual/specs/15-infrastructure-runbook.md | spec 更新候補 |
| 並列 | docs/30-workflows/09b-parallel-cron-triggers-monitoring-and-release-runbook/ | same-wave sync |

## 実行手順

### ステップ 1: 7 成果物作成
- 各ドキュメントを `outputs/phase-12/` に配置

### ステップ 2: 09b と 09c に通知
- 09b の release runbook で staging URL / sync_jobs id を再利用させる
- 09c の Phase 1 入力に staging green 結果を渡す

### ステップ 3: specs/ 更新候補を `system-spec-update-summary.md` に列挙
- 例: `15-infrastructure-runbook.md` の "リリース前チェック" に staging Playwright 項目追加

### ステップ 4: phase12-task-spec-compliance-check で不変条件 #1-#15 を全て点検

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 13 | PR body に 7 成果物へのリンクを含める |
| 並列 09b | release runbook と用語 / URL を統一 |
| 下流 09c | implementation-guide を引き渡す |

## 多角的チェック観点（不変条件）

- 不変条件 #1-#15 を `phase12-task-spec-compliance-check.md` で全 15 項目チェック

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | implementation-guide.md | 12 | pending | 実装ガイド |
| 2 | system-spec-update-summary.md | 12 | pending | spec 差分提案 |
| 3 | documentation-changelog.md | 12 | pending | doc 変更点 |
| 4 | unassigned-task-detection.md | 12 | pending | 未割当 |
| 5 | skill-feedback-report.md | 12 | pending | ノウハウ |
| 6 | phase12-task-spec-compliance-check.md | 12 | pending | 不変条件 #1-#15 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-12/main.md | サマリ |
| ドキュメント | outputs/phase-12/implementation-guide.md | staging deploy 実装ガイド |
| ドキュメント | outputs/phase-12/system-spec-update-summary.md | specs/ 更新候補 |
| ドキュメント | outputs/phase-12/documentation-changelog.md | doc 変更点 |
| ドキュメント | outputs/phase-12/unassigned-task-detection.md | 未割当課題 |
| ドキュメント | outputs/phase-12/skill-feedback-report.md | ノウハウ |
| ドキュメント | outputs/phase-12/phase12-task-spec-compliance-check.md | 不変条件 適合 |
| メタ | artifacts.json | Phase 12 実行時に artifacts.json を更新 |

## 完了条件

- [ ] 7 成果物すべて作成
- [ ] 不変条件 #1-#15 が compliance check で「仕様上の受け入れ条件」と「実測未取得」を分けて記録済み
- [ ] 09b と 09c への引き渡しが明記

## タスク100%実行確認【必須】

- 全実行タスクが実行時に完了条件を満たす
- 7 成果物配置済み
- 不変条件 15 項目の判定方法を記録
- artifacts.json の phase 12 は実行時に更新

## 次 Phase

- 次: 13 (PR 作成)
- 引き継ぎ事項: 7 成果物と 09b / 09c への通知記録
- ブロック条件: 7 成果物いずれかが欠ける、または実測未取得を PASS と書いている場合は次 Phase に進まない

## 7 成果物詳細

### 1. implementation-guide.md

- staging deploy の実装着手手順（08 完了後の入口）
- runbook 11 ステップ要約
- sync 検証ポイント
- Playwright 再実行手順
- evidence 保存ルール

### 2. system-spec-update-summary.md

| 提案 | 対象 spec | 理由 |
| --- | --- | --- |
| "リリース前チェック" に staging Playwright 項目を追加 | `specs/15-infrastructure-runbook.md` | 09a の AC-6 に対応 |
| sync_jobs SELECT クエリの正本化 | `specs/03-data-fetching.md` | runbook と spec の整合 |
| Cloudflare Analytics URL の placeholder 化 | `specs/15-infrastructure-runbook.md` | 各環境で差し替え可能に |

### 3. documentation-changelog.md

- 09a で追加: index.md / artifacts.json / phase-01〜13.md / outputs/phase-*/
- 09a で更新: なし（specs/ は別 PR）
- 09a で削除: なし

### 4. unassigned-task-detection.md

| 課題 | 取り扱い | 担当 |
| --- | --- | --- |
| Cloudflare Analytics の自動 dashboard 化 | 未割当（将来 task） | TBD |
| sync_jobs の定期 export → S3 等 | 未割当 | TBD（無料枠範囲内で再検討） |
| Playwright trace の長期保存 | 未割当 | TBD |

### 5. skill-feedback-report.md

- 学んだこと: staging で sync を「手動 + 自動 cron」両方検証する必要、Playwright プロファイル切替の `BASE_URL` env 利用が再現性高い、wrangler tail を 30 分回すと Forms API rate limit を観察できる
- 改善提案: staging deploy runbook を `.github/runbooks/` に置く、Cloudflare Analytics URL を env var に展開
- 不要だった作業: なし

### 6. phase12-task-spec-compliance-check.md

| 不変条件 | 仕様判定 | 実測証跡 |
| --- | --- | --- |
| #1 schema を固定しすぎない | REQUIRED | Phase 11 sync evidence で確認 |
| #2 consent キー統一 | REQUIRED | Phase 11 AuthGateState evidence で確認 |
| #3 responseEmail は system field | REQUIRED | Phase 11 sync dump で確認 |
| #4 本人本文を D1 override しない | REQUIRED | `/profile` visual smoke で確認 |
| #5 apps/web → D1 直接禁止 | REQUIRED | bundle/import grep で確認 |
| #6 GAS prototype 昇格しない | REQUIRED | 09a 差分 audit で確認 |
| #7 responseId と memberId を混同しない | REQUIRED | 08a contract evidence と staging smoke で確認 |
| #8 localStorage を正本にしない | REQUIRED | UI smoke と code audit で確認 |
| #9 /no-access 専用画面に依存しない | REQUIRED | 05b/06b auth smoke で確認 |
| #10 Cloudflare 無料枠 | REQUIRED | Cloudflare Analytics で確認 |
| #11 admin は本人本文を直接編集できない | REQUIRED | admin UI visual smoke で確認 |
| #12 admin_member_notes を view model に混ぜない | REQUIRED | 04c contract evidence で確認 |
| #13 tag は admin queue 経由 | REQUIRED | 07a/06c staging smoke で確認 |
| #14 schema 変更は /admin/schema | REQUIRED | admin schema smoke で確認 |
| #15 meeting attendance 重複 / 削除済み除外 | REQUIRED | 07c/admin meetings smoke で確認 |

## same-wave sync 通知

- 09b（release runbook）に通知: staging URL / sync_jobs id / Cloudflare Analytics URL の記録先を `outputs/phase-12/main.md` で共有
- 09c（production）に通知: 09a Phase 11 の実測 evidence が揃うまで production deploy を開始しないことを `outputs/phase-12/main.md` で共有
