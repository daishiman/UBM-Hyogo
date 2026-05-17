# Phase 13: PR・振り返り

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 13 / 13 |
| 名称 | PR・振り返り |
| タスク | UT-17-FU-005 alert-relay KV 操作エラーの observability 計測 |
| GitHub Issue | #701（Refs として参照、`Closes` は使わない / 既に CLOSED） |
| 作成日 | 2026-05-16 |
| 担当 | delivery |
| 状態 | blocked_pending_user_approval |
| タスク種別 | implementation / NON_VISUAL |
| 実装区分 | **実装仕様書** |
| 実装区分 判定根拠 | Phase 1〜12 で完成した構造化ログ emit 実装 + spec.ts テスト追加 + runbook 追記 + Phase 12 正本同期成果物を 1 PR にまとめ、`dev` ブランチへマージ可能な状態にする最終 Phase |

---

## 目的

Phase 1〜12 の全成果物（コード + テスト + runbook 追記 + Phase 12 正本同期 7 outputs）を
1 PR に集約し、`dev` ブランチへのマージ準備を完了させる。

> ⚠️ **承認ゲート**: CLAUDE.md「PR作成の完全自律フロー」が適用される依頼
> （「PR作成」「PR出して」「diff-to-pr」等）の場合は確認質問を挟まず実行する。
> それ以外はユーザーから明示承認を得てから実行する。本仕様書は **commit / push / PR / production deploy を実行しない**。
> 実行は `outputs/phase-13/pr-summary.md` を入力に CLAUDE.md 既定フローで別途行う。

---

## 13-1. PR 基本情報

| 項目 | 値 |
| --- | --- |
| PR タイトル | `feat(api): emit structured logs for alert-relay KV op failures (issue-701)` |
| ベースブランチ | `dev`（CLAUDE.md「既定ブランチは dev」遵守） |
| 作業ブランチ | `feat/ut-17-followup-005-alert-relay-kv-error-metrics`（または同等の slug） |
| PR 種別 | feature（コード実装あり / NON_VISUAL） |
| 関連 Issue | `#701`（Refs として参照 / 既に CLOSED） |

---

## 13-2. 実行手順（user-gated）

### ステップ 1: ローカルチェック

```bash
# 型チェック / Lint
mise exec -- pnpm typecheck
mise exec -- pnpm lint

# apps/api ユニットテスト
mise exec -- pnpm --filter @ubm-hyogo/api test

# 変更ファイル確認
git status
git diff dev...HEAD --name-only

# 機密値スキャン
git grep -E "hooks\.slack\.com/services/[A-Z0-9/]+" -- ':!.dev.vars.example' ':!*.md'
# 期待: 0 件

# raw dedupeKey がログ payload に含まれていないことを spec.ts で間接確認
# （dedupeKeyHash は 12 hex chars 固定であることを Phase 9 acceptance.md で記録済み）
```

### ステップ 2: 変更ファイル確認

含まれていること:
- `apps/api/src/routes/internal/alert-relay.ts`（編集）
- `apps/api/src/routes/internal/__tests__/alert-relay.spec.ts`（編集）
- `docs/30-workflows/runbooks/ut-17-alert-relay-monthly-healthcheck.md`（編集）
- `docs/30-workflows/ut-17-followup-005-alert-relay-kv-error-metrics/`（新規 / phase-01〜13 + outputs）

含まれていないこと:
- `apps/web/` 配下の変更
- `apps/api/wrangler.toml` の `[triggers]` / `[vars]` 変更
- D1 schema / Google Form schema の変更
- 実 Webhook URL / 実 API key / 実メールアドレス

### ステップ 3: コミット整理

| # | コミットメッセージ |
| --- | --- |
| 1 | `feat(api): emit structured logs for alert-relay KV op failures with isolateId + dedupeKeyHash (issue-701)` |
| 2 | `test(api): cover alert-relay KV.get/put throw paths and dedupe hash stability (issue-701)` |
| 3 | `docs(runbook): add KV operation error grep procedure to ut-17 monthly healthcheck (issue-701)` |
| 4 | `docs(ut-17-followup-005): add phase 1-13 task specification (issue-701)` |

### ステップ 4: push と PR 作成

CLAUDE.md「PR作成の完全自律フロー」に従う。`gh pr create --base dev` を使用し、
本文は `outputs/phase-13/pr-summary.md` を転記する。`main` への直接 PR は行わない。

```bash
git push -u origin feat/ut-17-followup-005-alert-relay-kv-error-metrics
gh pr create --base dev \
  --title "feat(api): emit structured logs for alert-relay KV op failures (issue-701)" \
  --body "$(cat docs/30-workflows/ut-17-followup-005-alert-relay-kv-error-metrics/outputs/phase-13/pr-summary.md)"
```

---

## 13-3. post-merge アクション

PR が `dev` にマージされた後に実施:

| # | アクション | 担当 |
| --- | --- | --- |
| 1 | `docs/30-workflows/unassigned-task/ut-17-followup-005-alert-relay-kv-operation-error-metrics.md` を `docs/30-workflows/completed-tasks/` へ `git mv` | 手動 |
| 2 | external ops（staging / production deploy）を実施: `bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging` → `--env production` | プロジェクトオーナー |
| 3 | production 反映後、`bash scripts/cf.sh tail --config apps/api/wrangler.toml --env production --format pretty \| grep alert_relay_kv_op_failed` で emit が観測可能であることを確認（イベント未発生は正常） | プロジェクトオーナー |
| 4 | UT-17-FU-006（KV usage dashboard 化）の unassigned-task ファイルを起票し、本タスクで予約した `event: "alert_relay_kv_op_failed"` を入力契約として明記 | 別タスク |
| 5 | dev → main の昇格 PR を別途作成（CLAUDE.md「main は dev→main リリース時のみ」） | 別タスク |

---

## 13-4. 振り返りチェック

| 観点 | 内容 |
| --- | --- |
| 計画精度 | 「小規模 / behaviour change 限定」見積もりに対する実工数差分 |
| 不変条件 | `event` 文字列契約・isolateId 採番回数・dedupeKeyHash 短縮（12 hex chars）・fail-open 維持の 4 点が PR レビューで問題視されなかったか |
| Lessons Learned | `console.warn(JSON.stringify(...))` で Workers Logs に 1 行 JSON を流す pattern が他 alert-relay 系 emit にも転用できるか |
| 後続タスク | UT-17-FU-006 への `event` 契約引き継ぎが明示できたか |
| 運用 | runbook 追記の grep / しきい値が実際の monthly check で有効に機能するか |

---

## 13-5. 統合テスト連携

| 連携先 | 連携内容 | 本 Phase での扱い |
| --- | --- | --- |
| dev → main 昇格 PR | 本 PR マージ後、別 PR で本番反映 | 本タスクスコープ外 |
| UT-17-FU-006 PR | 本タスクの `event` 文字列を入力に取る dashboard 化 | 後続関係。`event` 文字列契約は本 PR をもって予約 |

---

## 13-6. ブロック条件（user-gated 実行を中止する条件）

| 条件 | 対応 |
| --- | --- |
| ローカル `pnpm typecheck` / `pnpm lint` / `pnpm --filter @ubm-hyogo/api test` のいずれかが FAIL | 修復後再実行。3 回失敗で実行中止しユーザーに報告 |
| `apps/web/` 配下に変更が混入 | 該当変更を別 PR / 別ブランチに切り出し、本 PR から除外 |
| `wrangler` 直接実行履歴がコミットに混入 | 該当コミットを `git restore` で復元、`bash scripts/cf.sh` 経由に置換 |
| 機密値（実 Webhook URL / 実 API key / 実メールアドレス）が grep で検出 | コミット履歴ごと修復しユーザー承認の再取得 |
| `event` 文字列が `"alert_relay_kv_op_failed"` 以外に変質 | 修復して本仕様書の契約に揃える |

---

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | `outputs/phase-12/implementation-guide.md` | PR 本文「変更ファイル / 技術契約 / behaviour change / 検証 / DoD」の元データ |
| 必須 | `outputs/phase-12/unassigned-task-detection.md` | post-merge アクション 1 番 / 4 番の元データ |
| 必須 | `outputs/phase-13/pr-summary.md` | `gh pr create` 本文の参照元 |
| 必須 | CLAUDE.md「PR作成の完全自律フロー」 | PR 作成プロトコル |
| 必須 | CLAUDE.md「ブランチ戦略」 | `dev` base 運用 |
| 参考 | `docs/30-workflows/ut-17-followup-003-alert-relay-healthcheck-cron/phase-13.md` | フォーマット参考 |

---

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | `outputs/phase-13/pr-summary.md` | PR 本文の正本（`gh pr create` 引数の元データ） |
| PR | GitHub Pull Request | レビュー / マージ（実行は user-gated） |

---

## 完了条件

- [ ] ユーザー承認（または PR 自律フロー適用条件）が成立している
- [ ] ローカルチェック全 PASS（typecheck / lint / `@ubm-hyogo/api` test / 機密値 grep）
- [ ] PR が GitHub 上に作成され URL が記録されている
- [ ] PR base が `dev`
- [ ] PR タイトルが `feat(api): emit structured logs for alert-relay KV op failures (issue-701)`
- [ ] PR 本文に `Refs #701` が記載されている
- [ ] 機密値が PR 本文 / コミット / コードに含まれていない
- [ ] 13-4 セクションの振り返りが記録されている

---

## タスク100%実行確認【必須】

- [ ] 全実行タスクが completed
- [ ] PR URL が `outputs/phase-13/pr-summary.md` 末尾に記録
- [ ] post-merge アクション 5 件のうち 1 番（unassigned-task 移動）の `git mv` コマンドが用意されている
- [ ] external ops（staging / production deploy / wrangler tail 観測）が「外部実施」として明示分離されている

---

## 次 Phase

- なし（Phase 13 が最終 Phase）
- post-merge: 13-3 の 5 アクションを実施
- ブロック条件: 13-6 の 5 条件のいずれか成立で実行しない

## 実行タスク

- ユーザー承認後に commit / push / PR 作成 / deploy / Workers Logs runtime tail evidence を実施する。
