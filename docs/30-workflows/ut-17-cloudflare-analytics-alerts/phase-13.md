# Phase 13: PR・振り返り

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 13 / 13 |
| 名称 | PR・振り返り |
| タスク | Cloudflare Analytics アラート設定 + Slack 日本語化リレー (UT-17) |
| 作成日 | 2026-05-09 |
| 担当 | delivery |
| 状態 | pending |
| GitHub Issue | #20（CLOSED — Refs として参照） |
| タスク種別 | implementation / non_visual |
| 実装区分 | **実装仕様書** |
| 実装区分 判定根拠 | Phase 1〜12 で完成した relay Worker 実装 + Notification Policy 設定 + runbook + skill 同期を 1 つの PR にまとめ、`dev` にマージ可能な状態にする最終 Phase |

---

## 目的

Phase 1〜12 の全成果物（**コード + 設計書 + skill 同期**）を 1 PR に集約し、
`dev` ブランチへのマージ準備を完了させる。

> ⚠️ **承認ゲート**: Phase 12 完了後、ユーザーから「Phase 13 を実行してよいですか？」の明示承認を得てから実行する。
> ただし、CLAUDE.md「PR作成の完全自律フロー」が適用される依頼の場合（「PR作成」「PR出して」「diff-to-pr」等）は確認質問を挟まず実行する。

---

## 13-1. PR 基本情報

| 項目 | 値 |
| --- | --- |
| PR タイトル | `feat(ut-17): Cloudflare 無料枠アラート + Slack 日本語化リレー` |
| ベースブランチ | `dev`（CLAUDE.md「既定ブランチは dev」遵守） |
| 作業ブランチ | `feat/ut-17-cloudflare-alerts-slack-relay` |
| PR 種別 | feature（コード実装あり） |
| 関連 Issue | `#20`（CLOSED — `Refs` として参照、`Closes` は使わない） |

---

## 13-2. 実行手順

### ステップ 1: ローカルチェック

```bash
# 全体型チェック / Lint
mise exec -- pnpm typecheck
mise exec -- pnpm lint

# apps/api ユニットテスト + カバレッジ
mise exec -- pnpm --filter @ubm-hyogo/api test:coverage

# artifacts.json validity
node -e "JSON.parse(require('fs').readFileSync('docs/30-workflows/ut-17-cloudflare-analytics-alerts/artifacts.json','utf8'))" \
  && echo "artifacts.json: PASS"

# 機密値スキャン
git grep -E "(hooks.slack.com/services/[A-Z0-9/]+|cf-webhook-auth_SECRET=[a-zA-Z0-9+/=]{20,})" -- ':!.dev.vars.example'
# 期待: 0 件

# mirror parity（.claude ↔ .agents）
diff -r .claude/skills/aiworkflow-requirements .agents/skills/aiworkflow-requirements 2>/dev/null | head
# 期待: 差分なし、または明示的に同期済み
```

### ステップ 2: 変更ファイル確認

```bash
git status
git diff dev...HEAD --name-only
```

確認:
- コード変更（`apps/api/`）と docs / skill 同期が含まれている
- `apps/web/` 配下に変更がない
- 機密値（Webhook URL / cf-webhook-auth secret）が含まれていない

### ステップ 3: コミット整理（Phase 9 の 5 件 + Phase 10〜12 分）

最終的なコミット構成（マージ前 rebase で整理）:

| # | コミットメッセージ |
| --- | --- |
| 1 | `chore(ut-17): wire SLACK_WEBHOOK_URL/CF_WEBHOOK_AUTH_SECRET via 1Password refs` |
| 2 | `feat(ut-17): add /internal/alert-relay route with cf-webhook-auth 固定シークレット verification` |
| 3 | `feat(ut-17): format Cloudflare alerts to Japanese Slack Block Kit` |
| 4 | `test(ut-17): cover cf-webhook-auth / formatter / sender / route handler` |
| 5 | `docs(ut-17): record Notification Policy config and add runbook entries` |
| 6 | `docs(ut-17): finalize phase 12 source-of-truth sync and skill updates` |

### ステップ 4: push と PR 作成

```bash
git push -u origin feat/ut-17-cloudflare-alerts-slack-relay

gh pr create --base dev --title "feat(ut-17): Cloudflare 無料枠アラート + Slack 日本語化リレー" --body "$(cat <<'EOF'
## Summary

- Cloudflare Notifications で Workers / D1 / Pages / R2 の無料枠 80% アラートを設定
- Cloudflare Webhook を受信して日本語の Slack Block Kit メッセージに整形して転送する relay Worker (`apps/api/src/routes/internal/alert-relay.ts`) を実装
- cf-webhook-auth 固定シークレット 署名検証 + exponential backoff リトライ + ログ非出力ポリシーを実装
- 月次 Webhook ヘルスチェック runbook を整備

## 変更点

### コード（apps/api/）
- 新規: `src/routes/internal/alert-relay.ts`、`src/middleware/verify-cf-webhook-auth.ts`
- 新規: `src/lib/cf-webhook-auth.ts`、`src/lib/cloudflare-alert-formatter.ts`、`src/lib/slack-sender.ts`
- 新規: `src/types/cloudflare-notification.ts`
- 新規: `test/alert-relay.test.ts`、`test/cloudflare-alert-formatter.test.ts`、`test/cf-webhook-auth.test.ts`
- 編集: `src/index.ts`（route 登録）、`wrangler.toml`、`.dev.vars.example`

### docs / runbook
- 新規: `docs/30-workflows/ut-17-cloudflare-analytics-alerts/`（Phase 1〜13 + outputs）
- 新規: `docs/30-workflows/runbooks/ut-17-cloudflare-usage-alert-response.md`
- 新規: `docs/30-workflows/runbooks/ut-17-alert-relay-monthly-healthcheck.md`

### skill 同期（.claude/skills/）
- 更新: `task-specification-creator/LOGS.md`、`aiworkflow-requirements/LOGS.md`
- 更新: `aiworkflow-requirements/indexes/keywords.json`、`indexes/topic-map.md`
- 更新: `task-specification-creator/references/resource-map.md`

## Test plan

- [x] `pnpm typecheck` PASS
- [x] `pnpm lint` PASS
- [x] `pnpm --filter @ubm-hyogo/api test:coverage` PASS（line coverage ≥ 80%）
- [x] `artifacts.json` JSON parse PASS
- [x] staging deploy（`bash scripts/cf.sh deploy --env staging`）成功
- [x] staging で「Send Test Notification」→ Slack staging channel に日本語通知到達
- [x] production deploy 成功
- [x] 機密値 grep PASS（0 件）
- [x] Worker ログに Slack Webhook URL / cf-webhook-auth secret 値が出力されない（5 分観察）

## Evidence

- `outputs/phase-09/notification-policy-config.md`: Cloudflare Dashboard 4 policy 設定値
- `outputs/phase-09/screenshots/`: Dashboard スクショ
- `outputs/phase-11/test-report.md`: AC-1〜AC-9 判定
- `outputs/phase-11/evidence-bundle/`: AC 別 evidence
- `outputs/phase-11/screenshots/slack-*.png`: Slack 受信スクショ（4 メトリクス）
- `outputs/phase-12/implementation-guide.md`: 実装ガイド（Part 1 / Part 2）

## 不変条件チェック

- [x] D1 直接アクセスは `apps/api` に閉じる（本タスクは D1 アクセスなし）
- [x] Secret は 1Password → Cloudflare Secrets 経由のみ（`.env` に実値なし）
- [x] Cloudflare CLI は `bash scripts/cf.sh` 経由のみ（`wrangler` 直接実行なし）
- [x] UT-08-IMPL（WAE custom alerts）と責務重複なし
- [x] `apps/web` 配下に変更なし
- [x] 既存 runbook の上書きなし（追記方式）

## 関連 Issue

Refs #20

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

---

## 13-3. PR チェックリストテンプレ（`outputs/phase-13/pr-checklist.md`）

```markdown
# UT-17 PR チェックリスト

## 基本情報
| 項目 | 値 |
| --- | --- |
| PR タイトル | feat(ut-17): Cloudflare 無料枠アラート + Slack 日本語化リレー |
| ベース | dev |
| 作業ブランチ | feat/ut-17-cloudflare-alerts-slack-relay |
| 関連 Issue | #20（Refs） |

## ローカルチェック
- [ ] `pnpm typecheck` PASS
- [ ] `pnpm lint` PASS
- [ ] `pnpm --filter @ubm-hyogo/api test:coverage` PASS（line ≥ 80%）
- [ ] artifacts.json validity PASS
- [ ] 機密値 grep 0 件
- [ ] mirror parity 同期済み

## 不変条件
- [ ] D1 直接アクセスを追加していない
- [ ] `wrangler` 直接実行していない
- [ ] `.env` に実値を書いていない
- [ ] UT-08-IMPL と関数 / route を共有していない
- [ ] `apps/web/` を変更していない
- [ ] 既存 runbook を上書きしていない

## evidence 確認
- [ ] AC-1〜AC-9 の evidence ファイルが揃っている
- [ ] Cloudflare Dashboard スクショが揃っている
- [ ] Slack 受信スクショが揃っている

## PR URL
（gh pr create 実行後にここに記載）
```

---

## 13-4. post-merge アクション

PR が dev にマージされた後に実施:

| # | アクション | 担当 |
| --- | --- | --- |
| 1 | `docs/30-workflows/ut-17-cloudflare-analytics-alerts/` を `docs/30-workflows/completed-tasks/` 配下へ移動 | post-merge スクリプト or 手動 |
| 2 | `docs/30-workflows/unassigned-task/UT-17-cloudflare-analytics-alerts.md` を削除（completed 化に伴う） | 手動 |
| 3 | `artifacts.json` 全 Phase の状態が `completed` であることを再確認 | 手動 |
| 4 | dev → main の昇格 PR を別途作成（CLAUDE.md「main は dev→main リリース時のみ」） | 別タスク |
| 5 | 翌月第 1 営業日に月次ヘルスチェック runbook の初回実施 | プロジェクトオーナー |

---

## 13-5. 振り返りチェック

| 観点 | 内容 |
| --- | --- |
| 計画精度 | Phase 4 の 12.0h 見積もりに対する実工数の差分 |
| 不変条件 | CONST_005 違反が PR レビューで指摘されたか（自己レビュー） |
| Lessons Learned | Phase 12 skill-feedback-report.md の 5 カテゴリが skill / spec へ反映されたか |
| 後続タスク | UT-14 / UT-18 / UT-08-IMPL への明示的な引き継ぎが備考に記録されたか |
| 月次運用 | 月次ヘルスチェック runbook が運用可能な粒度になっているか |

---

## 統合テスト連携

| 連携先 | 連携内容 | 本 Phase での扱い |
| --- | --- | --- |
| dev → main 昇格 PR | 本 PR マージ後、別 PR で本番反映 | 本タスクスコープ外 |
| UT-08-IMPL PR | 同一 `apps/api` への変更が並走している場合 | 先行マージ側に rebase で追従 |

---

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ut-17-cloudflare-analytics-alerts/outputs/phase-12/documentation-changelog.md | PR 本文「変更点」の元データ |
| 必須 | docs/30-workflows/ut-17-cloudflare-analytics-alerts/outputs/phase-12/unassigned-task-detection.md | PR 本文「Summary」の元データ |
| 必須 | docs/30-workflows/ut-17-cloudflare-analytics-alerts/outputs/phase-11/test-report.md | Test plan / Evidence の元データ |
| 必須 | CLAUDE.md「PR作成の完全自律フロー」 | PR 作成プロトコル |
| 必須 | CLAUDE.md「ブランチ戦略」 | dev base 運用 |
| 参考 | .claude/commands/ai/diff-to-pr.md | PR 本文 Phase 13 仕様 |

---

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-13/pr-checklist.md | PR チェックリスト + URL 記録 |
| ドキュメント | outputs/phase-13/local-check-result.md | ローカルチェック実行結果 |
| ドキュメント | outputs/phase-13/change-summary.md | PR 本文へ転記する変更サマリー（Phase 12 changelog から派生） |
| ドキュメント | outputs/phase-13/retrospective.md | 13-5 振り返りチェック結果 |
| PR | GitHub Pull Request | レビュー / マージ |
| メタ | artifacts.json | 全 Phase を completed に更新 |

---

## 完了条件

- [ ] ユーザー承認（または PR 自律フロー適用条件）が成立している
- [ ] ローカルチェック全 PASS
- [ ] `outputs/phase-13/pr-checklist.md` の全項目が [x]
- [ ] PR が GitHub 上に作成され URL が記録されている
- [ ] PR base が `dev` である
- [ ] PR 本文に Refs #20 が記載されている
- [ ] 機密値（Webhook URL / cf-webhook-auth secret）が PR 本文 / コミット / コードに含まれていない
- [ ] artifacts.json の全 Phase が `completed`
- [ ] 振り返り（retrospective.md）が記録されている

---

## タスク100%実行確認【必須】

- [ ] 全実行タスクが completed
- [ ] 全成果物が指定パスに配置済み
- [ ] 全完了条件にチェック
- [ ] artifacts.json の全 Phase を completed に更新
- [ ] PR URL を pr-checklist.md に記録

---

## 次 Phase

- なし（Phase 13 が最終 Phase）
- post-merge: 13-4 の 5 アクションを実施
- ブロック条件: ローカルチェック FAIL / 機密値混入 / `apps/web` 変更混入 / `wrangler` 直接実行履歴混入の場合は実行しない
