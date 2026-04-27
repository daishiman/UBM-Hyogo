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

staging deploy / sync / smoke の結果を 6 ドキュメントとして閉じ、後続 09b（release runbook）と 09c（production deploy）が参照できる状態にする。same-wave sync ルールに従い 09b と 09c に通知する。

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
| 必須 | doc/02-application-implementation/09a-parallel-staging-deploy-smoke-and-forms-sync-validation/phase-11.md | smoke 結果 |
| 必須 | doc/02-application-implementation/_design/phase-2-design.md | scope 整合 |
| 必須 | doc/02-application-implementation/README.md | 不変条件 |
| 必須 | doc/00-getting-started-manual/specs/15-infrastructure-runbook.md | spec 更新候補 |
| 並列 | doc/02-application-implementation/09b-parallel-cron-triggers-monitoring-and-release-runbook/ | same-wave sync |

## 実行手順

### ステップ 1: 6 ドキュメント作成
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
| Phase 13 | PR body に 6 ドキュメントへのリンクを含める |
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
| メタ | artifacts.json | Phase 12 を completed に更新 |

## 完了条件

- [ ] 6 ドキュメントすべて作成
- [ ] 不変条件 #1-#15 が compliance check で全項目 PASS
- [ ] 09b と 09c への引き渡しが明記

## タスク100%実行確認【必須】

- 全実行タスクが completed
- 6 ドキュメント配置済み
- 不変条件 15 項目 PASS
- artifacts.json の phase 12 を completed に更新

## 次 Phase

- 次: 13 (PR 作成)
- 引き継ぎ事項: 6 ドキュメントと 09b / 09c への通知記録
- ブロック条件: 6 ドキュメントいずれかが欠ける、または不変条件 1 件でも違反があれば次 Phase に進まない

## 6 ドキュメント詳細

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

| 不変条件 | 適合 | 根拠 |
| --- | --- | --- |
| #1 schema を固定しすぎない | PASS | sync で 31 項目を D1 へ反映、コードに直書きなし |
| #2 consent キー統一 | PASS | Playwright で AuthGateState を確認 |
| #3 responseEmail は system field | PASS | sync 後の member_responses で確認 |
| #4 本人本文を D1 override しない | PASS | /profile に編集 form なし |
| #5 apps/web → D1 直接禁止 | PASS | bundle に D1 import なし |
| #6 GAS prototype 昇格しない | PASS | 09a に GAS 由来コードなし |
| #7 responseId と memberId を混同しない | PASS | type test (08a) で担保 |
| #8 localStorage を正本にしない | PASS | UI で route/session/data を localStorage 依存させない |
| #9 /no-access 専用画面に依存しない | PASS | 05b で AuthGateState 出し分け |
| #10 Cloudflare 無料枠 | PASS | 24h 30k req / 50k reads 以下 |
| #11 admin は本人本文を直接編集できない | PASS | admin UI に編集 form なし |
| #12 admin_member_notes を view model に混ぜない | PASS | 04c の API 設計で担保 |
| #13 tag は admin queue 経由 | PASS | 07a で担保 |
| #14 schema 変更は /admin/schema | PASS | 06c / 04c で担保 |
| #15 meeting attendance 重複 / 削除済み除外 | PASS | 07c で担保 |

## same-wave sync 通知

- 09b（release runbook）に通知: staging URL / sync_jobs id / Cloudflare Analytics URL を `outputs/phase-12/main.md` で共有
- 09c（production）に通知: staging green 証跡 / Phase 11 evidence へのリンクを `outputs/phase-12/main.md` で共有
