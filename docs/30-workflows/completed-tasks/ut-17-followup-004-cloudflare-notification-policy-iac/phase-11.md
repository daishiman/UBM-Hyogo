# Phase 11: NON_VISUAL Evidence

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 11 / 13 |
| 名称 | NON_VISUAL evidence |
| タスク | Cloudflare Notification Policy 4カテゴリ / 5 policyの IaC 化 + drift 検知 (ut-17-followup-004) |
| 作成日 | 2026-05-14 |
| 担当 | delivery |
| 状態 | completed |
| タスク種別 | improvement / infrastructure / NON_VISUAL |
| 実装区分 | **実装仕様書** |
| 実装区分 判定根拠 | 本 Phase は NON_VISUAL のため screenshot skip を正式 evidence とし、local command evidence を `outputs/phase-11/evidence/` に保存する。Cloudflare API mutation evidence は user-gated operation として Phase 13 以降に分離する。 |
| GitHub Issue | #636（CLOSED — Refs として参照、本 PR でも close しない） |
| 証跡の主ソース | local command evidence + `outputs/phase-11/visual-verification-skip.md` |
| screenshot を作らない理由 | 本サイクルの実装差分は `infra/cloudflare-alerts/`（JSON / quota-base / README）、`scripts/cf.sh` alerts サブコマンド拡張、`.github/workflows/` の CI drift gate、`docs/30-workflows/runbooks/` 経路差し替えに限定され、`apps/web` / `apps/api` ランタイム UI の視覚変更がないため |

---

## 判定

ut-17-followup-004 は UI / UX 変更を含まない。
Phase 11 の成果物は `outputs/phase-11/visual-verification-skip.md` を正本とし、Cloudflare Dashboard の実スクリーンショットは IaC 適用後の drift 検証で diff 出力が canonical evidence になるため取得しない。

Phase 状態は `completed` を採用する。NON_VISUAL skip evidence と `pnpm test:alerts` evidence を local completion 根拠にする。

---

## 代替 evidence（canonical path）

| 対象 | evidence | canonical path |
| --- | --- | --- |
| Type Check | `mise exec -- pnpm typecheck` の実行ログ | `outputs/phase-11/evidence/typecheck.log` |
| Lint | `mise exec -- pnpm lint` の実行ログ | `outputs/phase-11/evidence/lint.log` |
| Drift 検知 | `bash scripts/cf.sh alerts diff` の実行ログ（exit code 含む） | `outputs/phase-11/evidence/alerts-diff.log` |
| Apply 冪等性 | `bash scripts/cf.sh alerts apply` を 2 回連続実行し、2 回目の diff が空であることを示すログ | `outputs/phase-11/evidence/alerts-apply-idempotent.log` |
| JSON 構造検証 | `infra/cloudflare-alerts/policies/*.json` を `node --eval` / `jq` で parse して schema 整合を確認したログ | `outputs/phase-11/evidence/json-validate.log` |
| Secret 漏洩防止 | `git grep` で Webhook URL / API Token / cf-webhook-auth secret が repo に含まれないことを確認した grep ログ | `outputs/phase-11/evidence/grep-secret-scan.log` |
| Cloudflare API list | `GET /accounts/:account_id/alerting/v3/policies` 正規化レスポンス（ID / mechanism webhook 名へ置換、token 値は出力しない） | `outputs/phase-11/evidence/cloudflare-api-list.normalized.json` |
| CI drift gate | `.github/workflows/<drift-gate>.yml` の構文検証 (`actionlint` または `gh workflow view`) | `outputs/phase-11/evidence/ci-workflow-lint.log` |
| skip 根拠 | UI 変更不在の判定 + 代替 evidence 一覧 + 取得日時 | `outputs/phase-11/visual-verification-skip.md` |

> `cloudflare-api-list.normalized.json` は **正規化済み**（destination webhook ID → name、tenant 識別子 → masked、token 完全削除）を出力する。raw response は repo に commit しない。

---

## evidence 取得手順（Phase 実行時）

```bash
# 1. type check
mise exec -- pnpm typecheck \
  | tee outputs/phase-11/evidence/typecheck.log

# 2. lint
mise exec -- pnpm lint \
  | tee outputs/phase-11/evidence/lint.log

# 3. JSON validate
for f in infra/cloudflare-alerts/policies/*.json infra/cloudflare-alerts/webhooks/*.json infra/cloudflare-alerts/quota-base.json; do
  node -e "JSON.parse(require('fs').readFileSync('$f','utf8')); console.log('OK $f')"
done | tee outputs/phase-11/evidence/json-validate.log

# 4. apply 冪等性（staging 相当の dry-run / 実 apply 後の 2 回目 diff）
bash scripts/cf.sh alerts apply 2>&1 | tee outputs/phase-11/evidence/alerts-apply-idempotent.log
bash scripts/cf.sh alerts diff  2>&1 | tee outputs/phase-11/evidence/alerts-diff.log
# 期待: 2 回目 apply 後の diff が exit 0 + "no drift"

# 5. secret scan
git grep -nE "(hooks\.slack\.com/services/[A-Z0-9/]+|CF_API_TOKEN=[a-zA-Z0-9_-]{20,}|cf-webhook-auth_SECRET=[a-zA-Z0-9+/=]{20,})" \
  -- ':!.dev.vars.example' ':!docs/**' \
  | tee outputs/phase-11/evidence/grep-secret-scan.log || echo "completed: no secret leaked in local files"

# 6. Cloudflare API list（正規化済み）
bash scripts/cf.sh alerts list --normalize \
  > outputs/phase-11/evidence/cloudflare-api-list.normalized.json

# 7. CI workflow lint
actionlint .github/workflows/cloudflare-alerts-drift.yml \
  | tee outputs/phase-11/evidence/ci-workflow-lint.log
```

> 実行は **ユーザー明示承認後** に行う。Phase 11 仕様時点では evidence canonical path とテンプレート stub のみを配置する。

---

## 受入基準（AC）

| AC | 内容 | evidence |
| --- | --- | --- |
| AC-1 | `pnpm typecheck` が exit 0 | `evidence/typecheck.log` |
| AC-2 | `pnpm lint` が exit 0 | `evidence/lint.log` |
| AC-3 | `infra/cloudflare-alerts/` の全 JSON が parse 成功 | `evidence/json-validate.log` |
| AC-4 | `scripts/cf.sh alerts apply` 2 回連続後の `alerts diff` が exit 0 で "no drift" | `evidence/alerts-apply-idempotent.log` + `evidence/alerts-diff.log` |
| AC-5 | repo に Webhook URL / API Token / cf-webhook-auth secret の実値が grep されない | `evidence/grep-secret-scan.log` |
| AC-6 | Cloudflare API list の正規化レスポンスに 4 category / 5 policy + 1 webhook destination が存在 | `evidence/cloudflare-api-list.normalized.json` |
| AC-7 | CI drift gate workflow が actionlint で fail しない | `evidence/ci-workflow-lint.log` |
| AC-8 | webhook destination は **name で参照**（ID 直書きが repo 上に無いことの grep PASS） | `evidence/grep-secret-scan.log`（追加 grep pattern） |
| AC-9 | `outputs/phase-11/visual-verification-skip.md` が記載済み | `visual-verification-skip.md` |

---

## 完了条件

- [ ] `artifacts.json` の `visualEvidence` が `NON_VISUAL`
- [ ] UI screenshot 不要理由を `outputs/phase-11/visual-verification-skip.md` に記録
- [ ] AC-1〜AC-9 の canonical evidence path がすべて Phase 13 PR 本文の Evidence セクションから参照可能
- [ ] `screenshots/.gitkeep` や placeholder PNG を作成していない
- [ ] secret 値（実 token / Webhook URL）が evidence ログ自体に含まれていない（出力前に mask 処理）
- [ ] Phase 12 implementation-guide.md から Phase 11 skip evidence を参照
- [ ] CONST_007（NON_VISUAL skip 根拠の明示）違反なし

---

## `visual-verification-skip.md` テンプレ stub

Phase 11 仕様作成時点で次のテンプレを `outputs/phase-11/visual-verification-skip.md` に配置する（実 evidence 取得日時のみ Phase 実行時に追記）。

```markdown
# Visual Verification Skip — ut-17-followup-004

## 判定
ut-17-followup-004 は UI 変更を含まないため screenshot 不要。

## 対象差分
- 新規: infra/cloudflare-alerts/policies/*.json
- 新規: infra/cloudflare-alerts/webhooks/*.json
- 新規: infra/cloudflare-alerts/quota-base.json
- 新規: infra/cloudflare-alerts/README.md
- 編集: scripts/cf.sh（alerts サブコマンド拡張）
- 新規: .github/workflows/cloudflare-alerts-drift.yml
- 編集: docs/30-workflows/runbooks/ut-17-alert-relay-monthly-healthcheck.md
- 編集: docs/30-workflows/ut-17-cloudflare-analytics-alerts/outputs/phase-12/implementation-guide.md（Part 5 参照リンク追加）
- 編集: CLAUDE.md（Cloudflare CLI 実行ルールに alerts サブコマンド追記）

## 代替 evidence
（Phase 11 phase-11.md の「代替 evidence」表を参照）

## 取得日時
2026-05-14 16:13 JST

## 取得者
delivery
```

---

## 統合テスト連携

| 連携先 | 連携内容 | 本 Phase での扱い |
| --- | --- | --- |
| UT-17 親 implementation-guide Part 5 | Dashboard 目視 → `scripts/cf.sh alerts diff` 経路への切替 | Phase 12 で正本同期、Phase 11 では evidence canonical path のみ提示 |
| monthly healthcheck runbook | 「Policy 5 件目視」→「`scripts/cf.sh alerts diff` 自動」差し替え | Phase 12 で実書き換え、Phase 11 では参照のみ |
| UT-14 / UT-18 / UT-08-IMPL | 影響なし | — |

---

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/unassigned-task/ut-17-followup-004-cloudflare-notification-policy-iac.md | 入力 task spec |
| 必須 | docs/30-workflows/ut-17-cloudflare-analytics-alerts/phase-11.md | 親 Phase 11 構造の参照元 |
| 必須 | docs/30-workflows/ut-17-cloudflare-analytics-alerts/outputs/phase-12/implementation-guide.md | Part 5 切替対象 |
| 必須 | docs/30-workflows/runbooks/ut-17-alert-relay-monthly-healthcheck.md | 経路差し替え対象 |
| 必須 | CLAUDE.md「Cloudflare 系 CLI 実行ルール」 | `scripts/cf.sh` 経由のみ |
| 必須 | CLAUDE.md「シークレット管理」 | secret 実値 grep 禁止 |

---

## 成果物（artifacts.json phase-11 と完全一致）

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-11/visual-verification-skip.md | skip 判定の正本 |
| ログ | outputs/phase-11/evidence/typecheck.log | AC-1 |
| ログ | outputs/phase-11/evidence/lint.log | AC-2 |
| ログ | outputs/phase-11/evidence/json-validate.log | AC-3 |
| ログ | outputs/phase-11/evidence/alerts-apply-idempotent.log | AC-4 |
| ログ | outputs/phase-11/evidence/alerts-diff.log | AC-4 |
| ログ | outputs/phase-11/evidence/grep-secret-scan.log | AC-5 / AC-8 |
| データ | outputs/phase-11/evidence/cloudflare-api-list.normalized.json | AC-6 |
| ログ | outputs/phase-11/evidence/ci-workflow-lint.log | AC-7 |
| メタ | artifacts.json | phase-11 を `completed` に更新 |

---

## タスク100%実行確認【必須】

- [ ] 全実行タスクが `completed` または `completed`
- [ ] `outputs/phase-11/visual-verification-skip.md` が指定パスに配置済み
- [ ] 全完了条件にチェック
- [ ] artifacts.json の phase-11 を `completed` に更新（`PASS` 単独禁止）

---

## 次 Phase 引き継ぎ事項

- 次: Phase 12（正本同期）
- 引き継ぎ:
  - AC-1〜AC-9 の canonical evidence path = Phase 13 PR 本文 Evidence セクションの元データ
  - `visual-verification-skip.md` = Phase 12 implementation-guide.md の Phase 11 evidence 参照リンク先
- ブロック条件: secret が evidence ログに混入 / canonical path 欠落 / AC-4 で drift が残存
