# Phase 9: 品質保証

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 03b-parallel-forms-response-sync-and-current-response-resolver |
| Phase 番号 | 9 / 13 |
| Phase 名称 | 品質保証 |
| Wave | 3 |
| Mode | parallel |
| 作成日 | 2026-04-26 |
| 前 Phase | 8（DRY 化） |
| 次 Phase | 10（最終レビュー） |
| 状態 | pending |

## 目的

response 同期の運用面の品質を確認する。`responseEmail` 等の PII を取り扱うため secret hygiene は schema 同期（03a）より重い。cron */15 = 1 日 96 回起動の無料枠影響、admin 操作 UI の a11y を再確認する。

## 実行タスク

1. 無料枠見積もり（cron 96 回/日 × write 量、Forms quota）を outputs/phase-09/free-tier-estimate.md に保存。
2. PII 配慮を含む secret hygiene を outputs/phase-09/secret-hygiene.md に保存（responseEmail 取扱い、log redact）。
3. 06c admin UI への a11y 引き渡し条件を outline。
4. pre-flight（typecheck / lint / test）の前提化。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | .claude/skills/aiworkflow-requirements/references/database-schema.md | 無料枠 |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md | cron / secret 配置 |
| 必須 | outputs/phase-06/failure-cases.md | retry 上限 / metrics_json PII 抜き |
| 参考 | .claude/skills/aiworkflow-requirements/references/interfaces-auth.md | Magic Link での responseEmail 検証 |
| 参考 | .claude/skills/aiworkflow-requirements/references/ui-ux-components.md | a11y |

## 実行手順

### ステップ 1: 無料枠見積もり
- 後述「free-tier estimate」を outputs/phase-09/free-tier-estimate.md に保存。

### ステップ 2: secret hygiene + PII 配慮
- 後述「secret hygiene」を outputs/phase-09/secret-hygiene.md に保存。
- `responseEmail`、`responseId`、`questionId` は log / SyncError.metrics_json に出さない。

### ステップ 3: a11y 観点
- 06c の `/admin/sync` 画面で「response 同期実行」ボタンと per-job ログ表示の最低条件を Phase 9 で言語化。

### ステップ 4: pre-flight
- pnpm typecheck / lint / test を Phase 10 / 11 / 13 の前提に再確認。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 10 | 無料枠 PASS / secret PASS を gate 入力 |
| Phase 13 | PR template に PII redact チェック追加 |
| Wave 9b | release runbook に response sync 監視（cron 失敗 alert）を組込 |

## 多角的チェック観点

| 観点 | 不変条件番号 | 適用理由 |
| --- | --- | --- |
| 無料枠 | #10 | cron 96/日 × write 上限 200/sync = 19,200 < 100,000 |
| consent キー | #2 | log に旧 ruleConsent を出さない |
| responseEmail | #3 | log redact 必須 |
| schema 集約 | #14 | unknown question_id を log に raw 出さない |
| GAS 排除 | #6 | Apps Script を sync 経路に使わない |

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 無料枠見積もり | 9 | pending | D1 / Workers / Forms |
| 2 | secret hygiene + PII | 9 | pending | 8 項目 |
| 3 | a11y 引き渡し | 9 | pending | 06c |
| 4 | pre-flight 確認 | 9 | pending | typecheck / lint / test |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-09/main.md | 品質サマリ |
| ドキュメント | outputs/phase-09/free-tier-estimate.md | 無料枠見積もり |
| ドキュメント | outputs/phase-09/secret-hygiene.md | secret + PII 取扱い |
| メタ | artifacts.json | phase 9 を `completed` に更新 |

## 完了条件

- [ ] 無料枠見積もりが cron 頻度を含めて数値化
- [ ] secret hygiene 8 項目以上（PII redact 含む）
- [ ] a11y 引き渡し outline 済み
- [ ] pre-flight 前提化

## タスク100%実行確認【必須】

- [ ] サブタスク 4 件すべて completed
- [ ] cron 96/日 × write 200/sync の上限が free-tier estimate に明記
- [ ] secret hygiene に responseEmail redact が含まれる
- [ ] artifacts.json の phase 9 が `completed`

## 次 Phase

- 次: 10（最終レビュー）
- 引き継ぎ事項: 無料枠 OK、secret + PII OK
- ブロック条件: cron 頻度の見直し条件を満たす場合は設計に戻る

## free-tier estimate

| 区分 | 計算 | 推定値 / 月 | 無料枠 | 余裕 |
| --- | --- | --- | --- | --- |
| Forms API call | cron 96/日 × 1 page (実回答 < 100 想定) = 96 call/day | 約 2,880 / 月 | 数万 / 日（Forms quota） | 十分 |
| D1 write (per sync 上限) | per sync = 200 row × cron 96 = 19,200 / 日 | 100k / 日 内 | 100,000 / 日 | 約 5 倍余裕 |
| D1 write (実運用想定) | 実回答増分 / 日 = 5 件 × 8 row（identities 1 + responses 1 + fields 6）= 40 row × 96 sync ≈ 3,840 / 日（多くは no-op upsert） | < 5,000 / 日 | 100,000 / 日 | 十分 |
| D1 read | 1 sync で stableKey 解決 (31 read) + identities lookup × 5 + status lookup × 5 = 約 50 read × 96 = 4,800 / 日 | < 10,000 / 日 | 5,000,000 / 日 | 十分 |
| Workers req | sync trigger 96 / 日 + admin UI 数 req | < 200 / 日 | 100,000 / 日 | 十分 |
| Cloudflare D1 storage | member_responses raw_json (実回答 1KB × 数百) + response_fields (6 row × 数百) ≈ 数 MB | < 50 MB | 5 GB | 十分 |
| sync_jobs storage | 1 row × 96 sync × 30 日 = 2,880 row | 〜5,000 row | 制限なし（D1 storage 内） | 十分 |

注: per sync write 200 上限を超えた場合は sync_jobs.status='succeeded' (partial) で次回 cron が継続。

## secret hygiene

| # | 項目 | 達成方法 |
| --- | --- | --- |
| 1 | 平文 .env を commit しない | .gitignore + Husky pre-commit |
| 2 | `GOOGLE_PRIVATE_KEY` を log に出さない | logger に redact filter |
| 3 | `responseEmail` を log / SyncError.metrics_json に出さない | log にハッシュ化、metrics_json は job_type / attempt のみ |
| 4 | `responseId` / `questionId` を log に raw 出さない | log には counts のみ、debug 時のみ env=local で開放 |
| 5 | エラー stack に raw response body を含めない | catch で raw 抜き出し、redact wrapper を経由 |
| 6 | wrangler secret put 経由のみで投入 | runbook に明記、Magic Link の SMTP 鍵は別タスク |
| 7 | 1Password に local secret を保管 | infra 04 と統一 |
| 8 | rotate 手順を runbook 化 | Wave 9b release runbook と整合 |
| 9 | sync_jobs 保存期限 | 90 日で archive（無料枠保護） |
| 10 | Forms API quota 超過時の通知 | Wave 9b 監視で alert |

## a11y 観点（06c へ引き渡し）

- `/admin/sync` の「response 同期を今すぐ実行」ボタン: aria-busy=true を sync 実行中に付与。
- sync 結果テーブル: `sync_jobs` を時系列に表示（job_type / status / processed / startedAt / finishedAt）。aria-live=polite で更新通知。
- 失敗時 `code` 表示は人間可読文字列（QUOTA / FORMS_5XX 等）に limit、metrics_json は管理者のみ展開可能。
- 同種 job running 時のメッセージ: 「response 同期が実行中です」を 409 から表示。
- 退会済み identity 数を info ライン表示（snapshot skip 件数）。

## PII 配慮チェックリスト

- [ ] log: responseEmail を出さない（hash か counts）
- [ ] log: responseId を出さない（counts のみ）
- [ ] log: questionId を出さない（unknown counts のみ）
- [ ] sync_jobs.metrics_json: PII を保存しない（cursor は API 仕様上 token なので OK だが、DB に書く前に inspector で PII 抜きを確認）
- [ ] error message: スタックに raw response body を含めない
- [ ] backup / archive: sync_jobs を 90 日で archive
