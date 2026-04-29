# Phase 9 出力: 品質保証 — QA チェックリスト集約

> **status: pending — NOT EXECUTED**
> 本ファイルは Phase 8 SSOT を入力にした品質保証観点の集約結果。実走は Phase 11 / 13 着手直前および本タスク内の機械検証ステップで行う。

## 1. QA チェックリスト総括（12 項目）

| # | 観点 | 判定基準 | 結果 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | workflow 参照整合（4 キー × 2 ファイル） | 全 OK | NOT EXECUTED | `verify_workflow_refs` 実走可 |
| 2 | 1Password 参照実在（4 fields） | 全 OK（値非出力） | NOT EXECUTED | Phase 13 直前で実走 |
| 3 | リンク切れ（必須 7 件 + 相対参照） | 0 件 MISS | NOT EXECUTED | `[ -f ]` + `grep -rn '](\.\./'` |
| 4 | Phase 11 / 13 mirror parity | section drift 0 | NOT EXECUTED | Phase 11 / 13 runbook 生成後 |
| 5 | AC-1〜AC-15 事前確認 | Phase 10 着手時に全 PASS | pending = 7 件 → Phase 10 で 0 件目標 | 後述 §5 表参照 |
| 6 | AC-13 secret 値転記検出 | 0 ヒット | NOT EXECUTED | 5 種パターン |
| 7 | line budget | phase 100〜500 / index ≤250 / outputs 50〜400 | NOT EXECUTED | `wc -l` |
| 8 | navigation drift | 0 | NOT EXECUTED | validate-phase-output.js |
| 9 | secret hygiene | 対象内・全 PASS | pending | 主目的 |
| 10 | 無料枠 | 対象外 | N/A | resource 消費なし |
| 11 | a11y | 対象外 | N/A | UI なし |
| 12 | validate-phase-output.js | exit 0 | NOT EXECUTED | 実走可 |

## 2. workflow 参照整合（QA 観点 1）

### 2.1 期待ヒット表

| ファイル | キー | 期待 |
| --- | --- | --- |
| `.github/workflows/backend-ci.yml` | `secrets.CLOUDFLARE_API_TOKEN` | ≥ 1 |
| `.github/workflows/backend-ci.yml` | `secrets.CLOUDFLARE_ACCOUNT_ID` | ≥ 1 |
| `.github/workflows/backend-ci.yml` | `secrets.DISCORD_WEBHOOK_URL` | ≥ 1 |
| `.github/workflows/web-cd.yml` | `secrets.CLOUDFLARE_API_TOKEN` | ≥ 1 |
| `.github/workflows/web-cd.yml` | `secrets.CLOUDFLARE_ACCOUNT_ID` | ≥ 1 |
| `.github/workflows/web-cd.yml` | `secrets.DISCORD_WEBHOOK_URL` | ≥ 1 |
| `.github/workflows/web-cd.yml` | `vars.CLOUDFLARE_PAGES_PROJECT` | ≥ 1 |

### 2.2 実走結果

```
NOT EXECUTED — Phase 11 / 13 着手前に必須実走
```

### 2.3 NG 時の対応

- workflow 側に該当 key が無い → UT-05 へのフィードバックとして Phase 12 unassigned に登録
- SSOT 表に無い key が workflow にある → Phase 8 SSOT を更新するか、UT-05 で削除

## 3. 1Password 参照実在（QA 観点 2）

### 3.1 確認対象 4 fields

| op 参照 | 用途 |
| --- | --- |
| `op://UBM-Hyogo/Cloudflare/api_token_staging` | staging 用 API Token |
| `op://UBM-Hyogo/Cloudflare/api_token_production` | production 用 API Token |
| `op://UBM-Hyogo/Cloudflare/account_id` | Cloudflare Account ID |
| `op://UBM-Hyogo/Discord/webhook_url` | Discord Webhook URL |

### 3.2 実走方法

```bash
verify_op_field_exists Cloudflare api_token_staging     # value-length only
verify_op_field_exists Cloudflare api_token_production
verify_op_field_exists Cloudflare account_id
verify_op_field_exists Discord webhook_url
```

> **値そのものは絶対に出力しない**。`jq -r '.value | length > 0'` でブール化。

### 3.3 実走結果

```
NOT EXECUTED — Phase 13 着手直前で実走
```

## 4. リンク切れチェック（QA 観点 3）

### 4.1 必須 7 件

| 種別 | path | 期待 |
| --- | --- | --- |
| workflow | `.github/workflows/backend-ci.yml` | exists |
| workflow | `.github/workflows/web-cd.yml` | exists |
| reference | `.claude/skills/aiworkflow-requirements/references/environment-variables.md` | exists |
| reference | `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md` | exists |
| reference | `.claude/skills/aiworkflow-requirements/references/deployment-gha.md` | exists |
| 親仕様 | `docs/30-workflows/unassigned-task/UT-27-github-secrets-variables-deployment.md` | exists |
| CLAUDE | `CLAUDE.md` | exists |

### 4.2 実走結果

```
NOT EXECUTED — pending 段階で実走可、Phase 10 着手前までに完遂
```

## 5. AC × 確定先 章マッピング（QA 観点 5）

| AC | 確定先 | 事前判定 | Phase 10 着手時目標 |
| --- | --- | --- | --- |
| AC-1 | Phase 2 §API Token / Phase 5 lane 3 | PASS | PASS |
| AC-2 | Phase 2 §配置決定マトリクス | PASS | PASS |
| AC-3 | Phase 2 §動作確認 / Phase 6 / Phase 11 | pending | PASS |
| AC-4 | Phase 1 §苦戦箇所 §2 / Phase 2 §Variable 一覧 | PASS | PASS |
| AC-5 | Phase 2 lane 2 / Phase 5 lane 2 / Phase 8 テンプレ | PASS | PASS |
| AC-6 | Phase 2 §配置決定マトリクス | PASS | PASS |
| AC-7 | Phase 2 §動作確認 / Phase 11 smoke | pending | PASS |
| AC-8 | 同上 | pending | PASS |
| AC-9 | Phase 2 §動作確認 / Phase 6 / Phase 11 | pending | PASS |
| AC-10 | Phase 2 §同期手順 / Phase 12 / Phase 8 helper 化 | pending | PASS |
| AC-11 | Phase 1 / Phase 3 / 本 Phase | PASS | PASS |
| AC-12 | Phase 1 / 2 / 3（→ Phase 10 で 4 重目） | PASS | PASS |
| AC-13 | Phase 9 §6 機械検証 / 全 Phase 用語 | PASS | PASS |
| AC-14 | Phase 2 / Phase 6 / Phase 11 / Phase 8 §削除対象 | pending | PASS |
| AC-15 | artifacts.json / index.md | PASS | PASS |

> Phase 10 着手時には pending 7 件すべてを PASS 化する必要がある。Phase 4〜8 の各仕様書で確定済みの想定。

## 6. AC-13 secret 値転記検出（QA 観点 6）

### 6.1 検出パターン（5 種）

| 種別 | 正規表現 | 期待ヒット |
| --- | --- | --- |
| Discord Webhook URL | `https://discord\.com/api/webhooks/[0-9]+/[A-Za-z0-9_-]+` | 0 |
| JWT 様 | `eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}` | 0 |
| GitHub PAT | `gh[ps]_[a-zA-Z0-9]{36,}` | 0 |
| CF API Token suspect | `CLOUDFLARE_API_TOKEN[[:space:]]*=[[:space:]]*["']?[a-zA-Z0-9_-]{40,}` | 0 |
| Account ID hex | `ACCOUNT_ID.*\b[a-f0-9]{32}\b` | 0 |

### 6.2 実走結果

```
NOT EXECUTED — Phase 13 着手直前に必ず再実走
```

> 1 件でも検出されたら即時 Phase 10 blocker、対象 phase / outputs を直ちに修正。修正後に commit を rewrite するか、最悪 token ローテーション。

## 7. Phase 11 / 13 mirror parity（QA 観点 4）

| 比較ペア | 期待 | 実走結果 |
| --- | --- | --- |
| Phase 11 runbook ↔ apply-runbook.template.md | section drift 0 | NOT EXECUTED |
| Phase 13 runbook ↔ apply-runbook.template.md | section drift 0 | NOT EXECUTED |
| Phase 11 / 13 secret 名表記 | 4 件の正規名のみ | NOT EXECUTED |
| Phase 11 / 13 op 参照表記 | `op://UBM-Hyogo/...` 統一 | NOT EXECUTED |
| Phase 11 vs 13 差分 | リハーサル注釈 + user_approval 行 のみ | NOT EXECUTED |

## 8. line budget / link / drift（QA 観点 7）

| 項目 | 期待 | 実走結果 |
| --- | --- | --- |
| phase-NN.md | 100〜500 行 | NOT EXECUTED |
| index.md | ≤ 250 行 | NOT EXECUTED |
| outputs/main.md | 50〜400 行 | NOT EXECUTED |
| 相対参照リンク | 0 件 MISS | NOT EXECUTED |
| validate-phase-output.js | exit 0 | NOT EXECUTED |

## 9. 対象内 / 対象外項目

| 項目 | 判定 | 理由 |
| --- | --- | --- |
| secret hygiene | **対象内（主目的）** | 本タスクの中核責務、AC-13 機械検証で検証 |
| workflow 参照整合 | 対象内 | secret / variable 名と workflow 参照キーの一致が前提 |
| 1Password 参照実在 | 対象内 | 1Password 正本前提 |
| リンク切れ | 対象内 | reference / workflow / 親仕様への参照ドリフト防止 |
| Phase 11 / 13 mirror parity | 対象内 | Phase 8 テンプレ統合の品質ゲート |
| 無料枠 | 対象外 | resource 消費なし |
| a11y | 対象外 | UI なし |

## 10. 次 Phase への申し送り

- Phase 10: 本 12 項目を入力に GO/NO-GO 最終判定。pending = 7 件の AC を全 PASS 化。
- Phase 11: 1Password 実在 / mirror parity / dev push smoke を実走。
- Phase 12: 検証コマンドを implementation-guide.md に転記、phase12-task-spec-compliance-check.md で本仕様の compliance を確認。
- Phase 13: PR description に本サマリーを転記、user_approval ゲート後に AC-13 機械検証を再実走。

## 11. 完了条件（Phase 9 仕様書 §完了条件と対応）

- [x] workflow 参照整合検証手順 4 キー × 2 ファイル
- [x] 1Password 参照実在確認手順 4 fields（値非出力）
- [x] リンク切れチェック手順 必須 7 件 + 相対参照
- [x] mirror parity 手順 section / 用語 2 観点
- [x] AC-1〜AC-15 事前確認表（PASS 8 / pending 7）
- [x] AC-13 機械検証 5 種パターン
- [x] 対象内 / 対象外項目の判定理由
- [x] line budget / link / drift の確認手順
- [x] validate-phase-output.js の期待値（exit 0）
- [ ] 実走（NOT EXECUTED — Phase 10 / 11 / 13 着手前に実走）
