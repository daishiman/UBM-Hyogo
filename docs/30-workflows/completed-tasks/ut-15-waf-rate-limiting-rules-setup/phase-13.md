[実装区分: 実装仕様書]

# Phase 13: PR 作成 / ユーザー承認後の実装着手（user 明示承認後のみ実行）

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 13 |
| 機能名 | ut-15-waf-rate-limiting-rules-setup |
| 作成日 | 2026-05-09 |
| 前 Phase | 12（ドキュメント更新） |
| 次 Phase | なし（本ワークフロー完了。後続は別 PR） |
| 状態 | implemented-local-runtime-pending |
| タスク種別 | implementation / workflow_mode: implemented-local-runtime-pending / visualEvidence: NON_VISUAL / scope: cloudflare_edge_security |
| user_approval_required | **true**（Phase 13 commit / push / PR / Cloudflare runtime operations require explicit user approval） |
| 実行ステータス | **NOT EXECUTED — awaiting user approval** |

> **PR 作成は user の明示承認後のみ実行する。**
> 本 Phase 仕様書は「PR テンプレ・local-check 手順・change-summary・派生実装 PR の起票テンプレ・G1-G4 multi-stage approval gate」を **予約** する目的で作成され、`git commit` / `git push` / `gh pr create` / `bash scripts/cf-waf-apply.sh --mode <enforce|simulate>` 等は user の明示指示があるまで一切実行しない。
> 本ワークフロー成果物（仕様書・outputs）は Phase 13 完了時点では未コミット状態で待機する。`.claude/skills/task-specification-creator/references/quality-gates.md` の「Phase 13 自動実行禁止」原則に準拠する。

---

## 目的

本 Phase 13 は **本ワークフローの最後のゲート** であり、以下 2 系統の判断を user に提示し、明示承認を得てから初めて実行に移す。

1. **PR 1: 本ワークフロー + local implementation PR**
   - 内容: `docs/30-workflows/ut-15-waf-rate-limiting-rules-setup/` 配下の仕様/outputs、`scripts/cf-waf-apply.sh`、`scripts/cf-waf-apply/`、`apps/api/src/middleware/edge-rate-limit-headers.ts`、既存 rate-limit middleware の helper 統合、`docs/runbooks/cloudflare-waf-operations.md`、aiworkflow-requirements sync を 1 PR にまとめる。
   - 本 PR は **implemented-local / NON_VISUAL / runtime pending**。Cloudflare API 実 apply、production Enforce、7 日観測、commit、push、PR 作成は user approval まで実行しない。
   - 不変条件 #5 違反（`apps/web` から D1 直接アクセス）を含まない。
2. **Runtime operation gate**
   - G1-G3 で staging Simulate apply、7 日観測、production Enforce を個別承認制で実行する。
   - Runtime evidence は実行後に `outputs/phase-11/` と aiworkflow-requirements artifact inventory へ same-wave sync する。

---

## Issue #18 状態（CLOSED のまま運用）

- Issue #18 は **CLOSED** のままで運用する（umbrella spec として 既に close 済）。
- 本 PR では `Refs #18` のみ記述し、`Closes #18` は使わない（再 close 試行を避けるため）。
- PR 本文に「Issue #18 は既に closed のため、umbrella spec から Phase 1-13 化した workflow である旨」を明記する（必須）。
- 派生実装 PR（PR 2）でも Issue 再 open は user 判断とし、デフォルトでは `Refs #18` のまま。
- 上記方針は `phase-template-phase13.md` §「Issue 参照は `Refs #<issue>` を採用、`Closes` は禁止」に準拠（umbrella / second-stage reapply パターン）。

---

## 依存

| 種別 | 対象 | 受け取る前提 |
| --- | --- | --- |
| 上流（必須） | Phase 1〜12 完了 | `artifacts.json.phases[*].status` が `completed`（Phase 1〜3）または `spec_created`（Phase 4〜12） |
| 上流 | Phase 1 AC-1〜AC-10 / Phase 2 マトリクス / Phase 3 PASS / Phase 11 S-01..S-05 / Phase 12 7 タスク仕様 | PR description の AC trace / 採用根拠の出典 |
| 上流ブロッカー | UT-06 本番デプロイ完了 | 本番トラフィック観察前提（Phase 11 S-04 / S-05 の実走条件） |
| 上流ブロッカー | Cloudflare zone 確定 | apply 対象 zone ID 確定 |
| 上流ブロッカー | `CLOUDFLARE_API_TOKEN` の `Zone.WAF` / `Zone.RateLimit` 権限拡張 | Phase 13 G1 前 preflight |
| 関連 | Issue #18（CLOSED） | 本 PR では **CLOSED 状態の参照のみ**（`Refs #18`） |
| 関連 | UT-16 監視・アラート | S-04 / S-05 の継続監視を引き継ぐ並走タスク |

---

## ユーザー承認ゲート（PR / G1-G4 multi-stage）

### PR: implemented-local PR の承認ゲート

| ゲート項目 | 確認内容 | 状態 |
| --- | --- | --- |
| Phase 1〜3 完了 | `artifacts.json` で `completed` | 確認済 |
| Phase 4〜10 implemented-local | `artifacts.json` で `implemented-local` | 要確認 |
| Phase 12 strict 7 outputs | implementation-guide / system-spec-update-summary / documentation-changelog / unassigned-task-detection / skill-feedback-report / phase12-task-spec-compliance-check / main.md が実体として存在 | 要確認 |
| Issue #18 状態 | CLOSED のまま参照のみ（再 open しない） | 確認済 |
| 不変条件 #5 違反チェック | apps/web D1 直接アクセスなし / apps/api middleware scope | 要確認 |
| Secret 値 / `op://` URI / API token 値混入チェック | 0 件 | 要確認 |
| 計画系 wording 残存チェック | `仕様策定のみ` / `実行予定` / `保留として記録` / `予定` / `Phase 13 で実施` / `マージ後` 等が outputs に残っていない | 要確認 |
| user の明示承認（PR） | 「UT-15 implemented-local PR を作成してよい」の明示指示 | **承認待ち** |
| user の明示承認（runtime） | G1〜G4 の各明示指示 | **承認待ち** |

> **本ゲートが PASS するまで `git commit` / `git push` / `gh pr create` を一切実行しない。**

### Runtime G1-G4 multi-stage approval gate

> Runtime gate では Cloudflare API write support、Phase 11 smoke S-01..S-05 の実走、Enforce 切替を扱うため、`phase-template-phase13.md` §「G1-G4 multi-stage approval gate」に準拠し、4 段独立承認ゲートを設置する。

| Gate | 対象操作 | smoke mapping | ブロックする上流条件 | user 承認文言 | approval 後 post-actions |
| --- | --- | --- | --- | --- | --- |
| **G1** | staging 環境への WAF / Rate Limiting Rules apply（`bash scripts/cf-waf-apply.sh --mode simulate --zone <STAGING_ZONE>`） | S-01 / S-02 staging | UT-06 本番完了 / Cloudflare zone 確定 / `CLOUDFLARE_API_TOKEN` 権限拡張済 / dry-run JSON 検証 PASS | 「G1 approve」 | apply 実行 / `outputs/phase-13/g1-cf-waf-apply-staging.log` に payload diff 記録（secret redact）/ S-02 staging curl 連打で 429 確認 |
| **G2** | Cloudflare GraphQL Analytics による Simulate モード 7 日間 FP 率 < 0.1% 観測 | S-03 / S-04 | G1 PASS / observation 開始 / `CLOUDFLARE_ANALYTICS_TOKEN` 配備済 | 「G2 approve」（観測完了報告として）| `outputs/phase-13/g2-fp-rate-7days.md` に集計結果 + dashboard snapshot ID 記録 / FP 率 < 0.1% 確定 |
| **G3** | production 環境への Enforce 切替（`bash scripts/cf-waf-apply.sh --mode enforce --zone <PROD_ZONE>`） | S-05 production 24h 観測 | G2 PASS（FP 率 < 0.1% 確定） / production rollback pointer 取得済 | 「G3 approve」 + production 拡張時は **「G3-prod approve」追加承認**（合算承認禁止）| Enforce 切替実行 / 24h 観測 / 誤検知 0 確認 / `outputs/phase-13/g3-enforce-24h-observation.md` に記録 |
| **G4** | commit / push / PR 作成 | - | G1-G3 全 PASS / Phase 11 helper artifacts 同期完了 / Phase 12 compliance check 7 ファイル実体確認済 | 「G4 approve」 | コミット粒度ごとに commit → push → `gh pr create` / `outputs/phase-13/pr-info.md` に PR URL / CI 結果 / `Refs #18` 記録 |

#### Gate 間の独立性ルール（再掲）

- **合算承認禁止**: 「G1-G4 全部 approve」のような一括承認は受け付けない
- **逆順実行禁止**: G1 PASS せずに G3 を実行しない
- **partial PASS の扱い**: G1 PASS / G2 観測中 / G3 G4 未実行 の場合、Phase 11 main.md を `PASS_BOUNDARY_SYNCED_RUNTIME_PARTIAL` に戻し、unassigned-task で次 gate リトライタスクを発行
- **production 拡張時**: G1-prod / G3-prod の追加明示文言を別途取得

---

## PR 1 仕様（ワークフロー仕様書整備 PR）

### ブランチ / base / head

| 項目 | 値 |
| --- | --- |
| head ブランチ | `docs/ut-15-waf-rate-limiting-task-spec`（または現在の作業ブランチ） |
| base ブランチ | `dev`（CLAUDE.md ブランチ戦略 §`feature/* → dev → main` / 本 PR は dev 経由） |
| labels | `area:docs` / `area:cloudflare` / `task:ut-15` / `wave:2` / `governance` |
| linked issue | `Refs #18`（**`Closes #18` ではない**。Issue は CLOSED のまま運用） |

### PR タイトル

```
docs(ut-15): WAF / Rate Limiting ルール設定 タスク仕様書整備 (Phase 1-13)
```

### PR description テンプレ

````markdown
## 概要

UT-15 WAF / Rate Limiting ルール設定の **implemented-local / runtime-pending PR**。Cloudflare edge での WAF Managed Ruleset + Rate Limiting Rules を `apps/api` / `apps/web` に Simulate→Enforce で導入するための local contract、dry-run wrapper、429 helper、runbook、Phase 1〜13 仕様を確立する。

Cloudflare API 実 apply / Enforce 切替は本 PR には含まず、ユーザー承認後の G1-G4 multi-stage approval gate を経て実施する。現時点の non-dry-run `cf-waf-apply.sh` は false green 防止のため exit 13 で fail-closed する。

## Issue #18 の取扱い

Issue #18 は **既に CLOSED** された umbrella spec である。本ワークフローは umbrella の方針を Phase 1-13 の実行可能粒度に展開するためのもので、Issue 再 open は行わず、`Refs #18` で参照のみ行う。実装完了時の `Closes` は派生実装 PR（PR 2）の user 判断に委ねる。

## 動機

- Cloudflare edge security の保守的な Simulate→Enforce フロー（観測 7 日 / FP 率 < 0.1% / 24h Enforce 観測）を確立する
- app-layer rate limit（`rate-limit-magic-link.ts` / `rate-limit-self-request.ts`）と edge ルールの責務分離マトリクスを固定し、二重カウントによる誤ブロックを防ぐ
- 無料枠（Custom Rules 5 件以内 / Free Managed Ruleset / Rate Limiting Rules 無料枠範囲）で MVP を成立させ、Pro 移行時の差分を runbook TODO に記録する
- `scripts/cf.sh` 系ラッパー（新規 `cf-waf-apply.sh` 派生）で再現可能な IaC を確立し、ダッシュボード手作業を排除する

## 変更内容（implemented-local / NON_VISUAL）

- 新規: `docs/30-workflows/ut-15-waf-rate-limiting-rules-setup/`
  - `index.md` / `artifacts.json`
  - `phase-01.md` 〜 `phase-13.md`（13 ファイル）
  - `outputs/artifacts.json`
  - `outputs/phase-11/{main,manual-smoke-log,link-checklist}.md`
  - `outputs/phase-12/{main,implementation-guide,system-spec-update-summary,documentation-changelog,unassigned-task-detection,skill-feedback-report,phase12-task-spec-compliance-check}.md`
- 新規/更新: local implementation artifacts
  - `scripts/cf-waf-apply.sh` / `scripts/cf-waf-apply/`
  - `apps/api/src/middleware/edge-rate-limit-headers.ts`
  - existing app-layer rate-limit middleware and focused tests
  - `docs/runbooks/cloudflare-waf-operations.md`
  - aiworkflow-requirements Cloudflare edge security spec / lessons / indexes
- **本 PR では Cloudflare mutation、production Enforce、commit、push、PR 作成は実行しない**

## AC trace（index.md AC-1〜AC-10 → 仕様書中の固定箇所）

| AC | 内容 | 仕様書中の固定箇所 |
| --- | --- | --- |
| AC-1 | `scripts/cf-waf-apply.sh` の 3 モード（simulate/enforce/dry-run） | Phase 3 §3 usage |
| AC-2 | WAF Managed Ruleset Simulate 適用 | Phase 1 §WAF 選定方針 / Phase 2 §Concern B |
| AC-3 | 4 グループ閾値（AUTH/ADMIN/ME/PUBLIC） | Phase 2 §Concern A |
| AC-4 | edge / app-layer 責務分離マトリクス | Phase 2 §Concern C |
| AC-5 | 429 wire format 統一（`{ error, retryAfterSec }` + retry-after header） | Phase 2 §Concern C 末尾 / Phase 3 §3 helper |
| AC-6 | Simulate→Enforce 移行 gate（観測 7 日 / FP 0 / Security Events 確認） | Phase 2 §Concern A 末尾 / Phase 11 S-04 / S-05 |
| AC-7 | `coverage-guard.sh` exit 0 / `--dry-run` 出力例の Phase 11 evidence | Phase 11 S-01 |
| AC-8 | CI smoke（miniflare 429 再現） | Phase 6 / Phase 11 S-02 補助 |
| AC-9 | 不変条件遵守（apps/web から D1 不可 / 新 endpoint なし / Form schema 不変）| 全 Phase 多角的チェック |
| AC-10 | `wrangler` 直接呼び出し 0 件 | Phase 3 §6 NO-GO / Phase 11 / Phase 12 多角的チェック |

## 不変条件 #5 違反なし（implemented-local）

state ownership 表（Phase 2）で writer / reader 列に `apps/web` から D1 への直接アクセスが一切現れない。本 PR の app code change は `apps/api` middleware に限定され、`apps/web` から D1 を直接叩く形に変質しない。

## Phase 12 7 タスクの状態

| タスク | 状態 |
| --- | --- |
| implementation-guide | implemented-local-runtime-pending |
| system-spec-update-summary | implemented-local-runtime-pending |
| documentation-changelog | implemented-local-runtime-pending |
| unassigned-task-detection | implemented-local-runtime-pending |
| skill-feedback-report | implemented-local-runtime-pending |
| 苦戦箇所 back-port | implemented-local-runtime-pending |
| phase12-task-spec-compliance-check | implemented-local-runtime-pending |

## 苦戦箇所 5 項目（umbrella から継承 → back-port 予約）

1. 閾値設定の難しさ → aiworkflow-requirements + lessons-learned
2. WAF → Workers の処理順 → 責務分離マトリクス（Phase 2 §Concern C）
3. 無料枠の制約 → runbook TODO（Pro 移行時 OWASP CRS 反映）
4. 地域ブロックの副作用 → runbook 注記（将来検討時 VPN/CDN 誤ブロック）
5. 既存 app-layer rate limit との二重カウント → `edge-rate-limit-headers.ts` helper の `reason` フィールド設計

## next step（Cloudflare runtime は G1-G4 ゲート付き）

本 PR 後、Phase 5〜10 ランブック + Phase 11 ランブックを入力にして以下を G1-G4 multi-stage approval gate で実走:

- G1: Cloudflare Rulesets API write support + staging apply
- G2: Simulate 7 日観測 / FP 率 < 0.1% 確定
- G3: production Enforce 切替 / 24h 誤検知 0 観測（**G3-prod 追加承認必須**）
- G4: commit / push / PR 作成

## 関連

- Refs #18（CLOSED のまま参照のみ）
- 上流: `docs/30-workflows/unassigned-task/UT-15-waf-rate-limiting.md`（umbrella）
- 関連: UT-06 本番デプロイ（上流ブロッカー）/ UT-16 監視・アラート（並走 / S-04 / S-05 継続監視引き継ぎ）
- 既存: `apps/api/src/middleware/rate-limit-magic-link.ts` / `rate-limit-self-request.ts`（responsibility 分離対象 / signature 不変）

## レビュー方針

- solo 運用のため required reviewers = 0（CLAUDE.md §ブランチ戦略 準拠）
- CI gate（`required_status_checks`）/ 線形履歴 / 会話解決必須化 / force-push & 削除禁止 で品質保証
````

### CI 必須 check（PR 1）

| check 種別 | 内容 | 想定 |
| --- | --- | --- |
| docs validator | `node .claude/skills/task-specification-creator/scripts/validate-phase-output.js docs/30-workflows/ut-15-waf-rate-limiting-rules-setup` PASS | workflow output gate |
| `verify-indexes-up-to-date` | `.github/workflows/verify-indexes.yml` | indexes drift なし |
| 線形履歴 | `required_linear_history` | merge commit 不可 |
| 会話解決 | `required_conversation_resolution` | レビューコメント全解決 |
| typecheck / lint / test | docs-only のため対象外 | スキップ可 |

### local-check（PR 1 作成前 / implemented-local スコープ）

```bash
# 必須ファイル存在確認
ls docs/30-workflows/ut-15-waf-rate-limiting-rules-setup/
ls docs/30-workflows/ut-15-waf-rate-limiting-rules-setup/outputs/phase-01/ 2>/dev/null || true
ls docs/30-workflows/ut-15-waf-rate-limiting-rules-setup/outputs/phase-02/ 2>/dev/null || true
ls docs/30-workflows/ut-15-waf-rate-limiting-rules-setup/outputs/phase-03/ 2>/dev/null || true

# 不変条件 #5 違反混入チェック（apps/web D1 direct access なし）
git diff --name-only dev...HEAD | rg "apps/web/" \
  && echo "CHECK: apps/web diff exists; verify no D1 direct access" \
  || echo "OK: apps/web diff なし"

# 計画系 wording / Secret 値混入チェック
rg -nE "仕様策定のみ|実行予定|保留として記録|Phase.?13 で実施|マージ後" \
  docs/30-workflows/ut-15-waf-rate-limiting-rules-setup/ \
  && echo "FAIL: 計画系 wording 残存" \
  || echo "OK: 計画系 wording なし"

rg -nE "ya29\.|-----BEGIN PRIVATE|CLOUDFLARE_API_TOKEN=|CLOUDFLARE_ANALYTICS_TOKEN=|op://[A-Za-z0-9_/.-]+/[A-Za-z0-9_/.-]+/[A-Za-z0-9_/.-]+" \
  docs/30-workflows/ut-15-waf-rate-limiting-rules-setup/ \
  && echo "FAIL: Secret/op URI 混入" \
  || echo "OK: Secret 混入なし"

# wrangler 直接実行混入チェック
rg -n "^wrangler " docs/30-workflows/ut-15-waf-rate-limiting-rules-setup/ \
  | rg -v "scripts/cf" \
  && echo "FAIL: wrangler 直接実行が混入" \
  || echo "OK: scripts/cf.sh 経由のみ"

# spec validator
node .claude/skills/task-specification-creator/scripts/validate-phase-output.js \
  docs/30-workflows/ut-15-waf-rate-limiting-rules-setup
```

### PR 作成コマンド（user 承認後のみ実行）

```bash
git status
git branch --show-current

git add docs/30-workflows/ut-15-waf-rate-limiting-rules-setup/

git commit -m "$(cat <<'EOF'
docs(ut-15): WAF / Rate Limiting ルール設定 タスク仕様書整備 (Phase 1-13)

- ut-15-waf-rate-limiting-rules-setup ワークフロー新規作成
- Phase 1〜13 仕様書 + outputs/phase-{01,02,03}/main.md
- AC-1〜AC-10 / 不変条件 #5 / 4 グループ閾値 / Simulate→Enforce gate / 4 階層 NON_VISUAL evidence
- 実 apply / Enforce 切替 / production smoke は user approval 後の G1-G4 multi-stage approval gate を経て実施
- Issue #18 は CLOSED のまま参照のみ（umbrella spec から実行可能粒度へ展開）

Refs #18

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"

git push -u origin docs/ut-15-waf-rate-limiting-task-spec

gh pr create \
  --title "docs(ut-15): WAF / Rate Limiting ルール設定 タスク仕様書整備 (Phase 1-13)" \
  --base dev \
  --body "$(cat <<'EOF'
（上記 PR description テンプレを貼付）
EOF
)"
```

---

## Runtime Gate 仕様（Cloudflare write support / apply テンプレ）

> **本 Phase 13 では Cloudflare mutation を実行しない。** 実行そのものが user の明示承認後の別アクションである。本セクションはテンプレを「予約」する。

### ブランチ / base / head

| 項目 | 値 |
| --- | --- |
| head ブランチ | `feat/ut-15-waf-rate-limiting-impl` |
| base ブランチ | `dev`（feature → dev → main の正規ルート） |
| labels | `area:cloudflare` / `area:api` / `task:ut-15` / `wave:2` / `feature` |
| linked issue | `Refs #18`（実装完了でも `Closes` はデフォルトで使わない / user 判断で `Closes` 追加検討）|

### PR タイトル

```
feat(cloudflare): WAF / Rate Limiting ルールを Simulate→Enforce で適用 (UT-15)
```

### PR description テンプレ（実装 PR）

````markdown
## 概要

ut-15-waf-rate-limiting-rules-setup ワークフロー Phase 5〜10 ランブック + Phase 11 smoke S-01..S-05 を実走し、Cloudflare edge に WAF Managed Ruleset + Rate Limiting Rules を Simulate→Enforce で適用する。

仕様書は別 PR（docs(ut-15)）で `docs/30-workflows/ut-15-waf-rate-limiting-rules-setup/` 配下に既に固定済。本 PR はその仕様書の Phase 5〜11 を実装に落とすもの。

## 変更内容

- 新規: `scripts/cf-waf-apply.sh`（Cloudflare API ラッパー / `bash scripts/cf.sh` 互換 / `op run` 注入）
- 新規: `scripts/cf-waf-apply/config.json`（zones / managedRulesets / customRules / rateLimitRules の宣言的構成）
- 新規: `scripts/__tests__/cf-waf-apply.test.ts`（dry-run snapshot 検証）
- 新規: `apps/api/src/middleware/edge-rate-limit-headers.ts`（429 wire format 統一 helper）
- 新規: `apps/api/src/middleware/__tests__/edge-rate-limit-headers.test.ts`
- 編集: `apps/api/src/middleware/rate-limit-magic-link.ts` / `rate-limit-self-request.ts`（429 応答を helper 経由に差し替え / signature 不変）
- 新規: `docs/runbooks/cloudflare-waf-operations.md`（誤検知対応 / Simulate→Enforce 移行 / ロールバック / Pro 移行 TODO）
- 任意（Phase 5 で要否確定）: `apps/api/wrangler.toml` の `[[ratelimits]]` binding 追加

## AC checklist trace

- [ ] AC-1: `scripts/cf-waf-apply.sh` が `--mode simulate|enforce` / `--dry-run` 3 モード動作
- [ ] AC-2: WAF Managed Ruleset Simulate モード適用
- [ ] AC-3: 4 グループ閾値（AUTH/ADMIN/ME/PUBLIC）定義
- [ ] AC-4: edge / app-layer 責務分離マトリクス遵守（二重カウントなし）
- [ ] AC-5: 429 wire format 統一（`{ error, retryAfterSec }` + retry-after header）
- [ ] AC-6: Simulate→Enforce 移行 gate（観測 7 日 / FP 率 < 0.1% / 24h enforce 観測）達成
- [ ] AC-7: `coverage-guard.sh` exit 0 / `--dry-run` 出力例の Phase 11 evidence 取得
- [ ] AC-8: CI smoke（miniflare 429 再現）PASS
- [ ] AC-9: 不変条件遵守（apps/web 不在 / 新 endpoint なし / Form schema 不変）
- [ ] AC-10: `wrangler` 直接呼び出し 0 件（`scripts/cf.sh` / `cf-waf-apply.sh` 経由）

## G1-G4 multi-stage approval gate evidence

| Gate | 操作 | status | evidence path |
| --- | --- | --- | --- |
| G1 | staging apply（Simulate）| PASS / PENDING / FAIL | `outputs/phase-13/g1-cf-waf-apply-staging.log` |
| G2 | Simulate 7 日観測 / FP 率 < 0.1% | PASS / PENDING / FAIL | `outputs/phase-13/g2-fp-rate-7days.md` |
| G3 | production Enforce 切替 + 24h 観測 | PASS / PENDING / FAIL | `outputs/phase-13/g3-enforce-24h-observation.md` |
| G3-prod | production 追加承認 | PASS / PENDING / FAIL | `outputs/phase-13/g3-prod-approval.md` |
| G4 | commit / push / PR | PASS / PENDING / FAIL | `outputs/phase-13/pr-info.md` |

## smoke evidence 添付欄

```
S-01 (dry-run JSON): bash scripts/cf-waf-apply.sh --dry-run --mode simulate | jq .
  → 期待: zones[] / managedRulesets[] / customRules[]≤5 / rateLimitRules[] 4 グループ
  実測: <貼付>

S-02 (staging 429 + retry-after): for i in $(seq 1 15); do curl ... ; done
  → 期待: 11 件目以降 429 retry-after=60（AUTH）
  実測: <貼付>

S-03 (GraphQL Analytics): waf.rateLimitsAdaptiveGroups
  → 期待: count > 0 / kind 別 breakdown
  実測: <貼付>

S-04 (Simulate 7 日 FP 率): false-positive-rate-7days.md
  → 期待: FP 率 < 0.1%
  実測: <貼付>

S-05 (production Enforce 24h): enforce-24h-observation.md
  → 期待: 誤検知 0 件
  実測: <貼付>
```

## 前提（必須）

- UT-06 本番デプロイ完了
- Cloudflare zone（`apps/api` / `apps/web`）確定済
- `CLOUDFLARE_API_TOKEN` の `Zone.WAF` / `Zone.RateLimit` / `Zone.Read` 権限拡張済
- `CLOUDFLARE_ANALYTICS_TOKEN`（`Account Analytics:Read`）配備済
- 本 PR の前段に「docs(ut-15): タスク仕様書整備」PR がマージ済

## リスク・ロールバック

- ロールバック: `bash scripts/cf-waf-apply.sh --mode simulate --zone <PROD_ZONE>` で即時 simulate 復帰
- customRules 個別解除: config json から該当エントリ除去 → dry-run 確認 → apply
- 不変条件 #5 違反なし: state ownership 表で `apps/web` writer / reader 不在を保証

## 関連

- Refs #18（CLOSED のまま参照のみ / Closes はデフォルト不付与）
- 仕様書: `docs/30-workflows/ut-15-waf-rate-limiting-rules-setup/`
- 上流: UT-06 本番デプロイ
- 連携: UT-16 監視・アラート（S-04 / S-05 継続監視引き継ぎ）
````

### CI 必須 check（PR 2）

| check 種別 | 内容 |
| --- | --- |
| typecheck | `mise exec -- pnpm typecheck` |
| lint | `mise exec -- pnpm lint` |
| build | `mise exec -- pnpm build` |
| coverage-guard | `bash scripts/coverage-guard.sh` exit 0 |
| miniflare smoke（AC-8） | `mise exec -- pnpm test apps/api -- --run rate-limit-headers-smoke` |
| dry-run snapshot | `bash scripts/cf-waf-apply.sh --dry-run > /tmp/out && diff fixtures/cf-waf-apply.snapshot.json /tmp/out` |
| 線形履歴 / 会話解決 / force-push 禁止 | dev / main branch protection |

---

## ロールバック / 緊急時の手順

| 状況 | 対応 |
| --- | --- |
| PR 1 提出後、レビューで重大な不整合 | PR を **draft 化**（`gh pr ready --undo`）して該当 Phase へ差し戻し |
| PR 1 提出後、計画系 wording / Secret URI 混入が事後検出 | PR を **close**（merge せず）し、Phase 12 へ差し戻して再生成 |
| user 承認が PR 1 提出後に撤回 | PR を draft 化して保留 |
| PR 2（実装 PR）で UT-06 未完了が判明 | 実装 PR を **draft 化**し、UT-06 完了まで block（Phase 3 NO-GO 条件）|
| G1 staging apply 後、誤ブロック多発 | `bash scripts/cf-waf-apply.sh --mode simulate` で即時 simulate 復帰 / Phase 2 マトリクス再調整 |
| G3 production Enforce 後、誤検知発生 | 即時 `--mode simulate` で rollback / customer support チャネルで影響範囲確認 / Phase 12 lessons-learned 追記 |
| Cloudflare API token rotation 必要 | 1Password の `op://Vault/Cloudflare/api_token` を更新 / `bash scripts/cf.sh whoami` で再認証 / `bash scripts/cf-waf-apply.sh --dry-run` で動作確認 |

---

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | CLAUDE.md §ブランチ戦略 | `feature/* → dev → main` / solo 運用 / required reviewers = 0 |
| 必須 | CLAUDE.md §シークレット管理 / §Cloudflare 系 CLI 実行ルール | `scripts/cf.sh` 徹底 / `wrangler` 直接実行禁止 |
| 必須 | CLAUDE.md §重要な不変条件 #5 | apps/web からの D1 直接アクセス禁止 |
| 必須 | .claude/skills/task-specification-creator/references/quality-gates.md | Phase 13 自動実行禁止原則 |
| 必須 | .claude/skills/task-specification-creator/references/phase-template-phase13.md | G1-G4 multi-stage approval gate / Issue `Refs` 採用 |
| 必須 | docs/30-workflows/ut-15-waf-rate-limiting-rules-setup/index.md | AC-1〜AC-10 / 苦戦箇所 / 依存関係 |
| 必須 | docs/30-workflows/ut-15-waf-rate-limiting-rules-setup/phase-{01,02,03}.md | 要件 / 設計 / 実装方式レビュー |
| 必須 | docs/30-workflows/ut-15-waf-rate-limiting-rules-setup/phase-11.md | NON_VISUAL S-01..S-05 仕様 / 4 階層 evidence |
| 必須 | docs/30-workflows/ut-15-waf-rate-limiting-rules-setup/phase-12.md | Phase 12 7 タスク仕様レベル定義 |
| 必須 | docs/30-workflows/unassigned-task/UT-15-waf-rate-limiting.md | umbrella spec |
| 参考 | docs/30-workflows/completed-tasks/ut-06-followup-H-health-db-endpoint/phase-13.md | NON_VISUAL Phase 13 フォーマット前例 |
| 参考 | docs/30-workflows/completed-tasks/utgov001-second-stage-reapply/phase-13.md | approval-gated NON_VISUAL implementation 前例（`Refs #` 採用） |

---

## 実行タスク

1. PR 1 / PR 2 の二段階ユーザー承認ゲートを提示する（完了条件: 承認文言が分離されている）
2. PR 1 の docs-only 変更範囲と AC trace を固定する（完了条件: コード変更なしが明記）
3. local-check を実行する手順を固定する（完了条件: 必須ファイル / 不変条件 #5 / Secret / wrangler / validator を確認）
4. user 明示承認後のみ PR 1 を作成するコマンドを予約する（完了条件: 自動実行禁止が明記）
5. PR URL 記録と artifacts 更新条件を定義する（完了条件: PR merge 後に completed 昇格する条件がある）
6. PR 2 の派生実装 PR 起票テンプレを予約する（完了条件: 起票も user 明示承認後である）
7. G1-G4 multi-stage approval gate を PR 2 内に予約する（完了条件: 4 段独立承認 + 合算承認禁止が明記）
8. Issue #18 CLOSED 状態の取扱い（`Refs #18` のみ）を明記する（完了条件: `Closes` を使わない方針が冒頭で固定）
9. ロールバック / 緊急時の手順を固定する（完了条件: PR 1 / PR 2 / G1-G3 各段階の rollback が分離）

## 実行手順

### ステップ 1: 承認ゲートの提示

- user に change-summary（PR 1 / PR 2 双方の差分概要）と AC trace を提示
- 本 Phase 13 §ユーザー承認ゲート の各項目を読み合わせ、「PR 1 を作成してよい」の明示文言を取得

### ステップ 2: local-check の実行

- 上記 §local-check コマンドを実行し、5 件すべて OK を確認
- いずれか FAIL なら Phase 12 へ差し戻し

### ステップ 3: PR 1 の作成（user 承認後のみ）

- ブランチ確認 → 明示 add → commit → push → `gh pr create --base dev`
- `git add .` / `git add -A` は禁止。パス明示で add

### ステップ 4: PR URL の記録

- 取得した PR URL を `outputs/phase-13/pr-info.md` に記録（生成は user 承認後のみ）
- artifacts.json の `phases[12].pr_url` フィールドに追記
- `phases[12].status` を `completed` に更新する条件は **PR がマージされた後**

### ステップ 5: PR 2 起票方針の user 確認

- PR 1 マージ後、改めて user に「派生実装 PR を起票してよいか」を確認
- 承認後、別ブランチを作成し Phase 5〜10 ランブック実走に着手
- 派生実装 PR 内では G1-G4 multi-stage approval gate を順次取得（合算承認禁止）

---

## 多角的チェック観点

- **不変条件 #5**: PR 1 の差分が markdown / JSON のみで、`apps/web` から D1 直接アクセスが混入していない / PR 2 でも `apps/web` 編集が含まれない
- **solo 運用適合**: required reviewers = 0 / CI gate / 線形履歴 / 会話解決 / force-push 禁止
- **CI gate 構成**: docs validator / verify-indexes / 線形履歴 / 会話解決必須化が PR 1 必須 check として機能
- **Issue #18 CLOSED 状態**: `Refs #18` のみ / `Closes #18` を使わない / 再 open しない
- **user 承認の二段階性**: PR 1 提出承認と PR 2 起票承認は別アクション。一括承認禁止
- **G1-G4 独立性（PR 2）**: 合算承認禁止 / 逆順実行禁止 / G3-prod 追加承認必須
- **rollback 粒度**: PR 1 = markdown 削除 / PR 2 = 5 単位（spec / config / impl / test / docs）/ G1-G3 = `--mode simulate` 即時復帰
- **計画系 wording / Secret 混入**: `仕様策定のみ` / `op://` / API token 値 / customer email が outputs / docs に転記されていない
- **`wrangler` 直接実行 0 件**: PR 1 docs / PR 2 impl 双方で 0 件

---

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | ユーザー承認ゲート定義（PR 1 / PR 2）| 13 | spec_created | 二段階承認 |
| 2 | PR 1 仕様（タイトル / description / コマンド）固定 | 13 | spec_created | base = dev / docs-only / `Refs #18` |
| 3 | PR 2 起票テンプレ仕様化（実装 PR）| 13 | spec_created | base = dev / G1-G4 / `Refs #18` |
| 4 | G1-G4 multi-stage approval gate 仕様化 | 13 | spec_created | 4 段独立 + G3-prod 追加 |
| 5 | CI 必須 check 一覧の固定 | 13 | spec_created | docs validator / coverage / miniflare smoke |
| 6 | local-check スクリプト固定 | 13 | spec_created | 不変条件 #5 / Secret / wrangler / 計画系 wording |
| 7 | ロールバック / 緊急時手順 | 13 | spec_created | PR draft / close / `--mode simulate` rollback |
| 8 | Issue #18 CLOSED 取扱い明記 | 13 | spec_created | `Refs` のみ / 再 open 禁止 |

---

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| 仕様書 | docs/30-workflows/ut-15-waf-rate-limiting-rules-setup/phase-13.md | 本ファイル。PR は user 明示承認後にのみ作成 |

> 本 Phase 13 では `outputs/phase-13/` ディレクトリを本 PR で作成しない。PR 1 自体が成果物相当。`outputs/phase-13/local-check-result.md` / `change-summary.md` / `pr-info.md` / `pr-creation-result.md` および G1-G4 evidence files は user 承認後の実走時に生成する。

---

## 完了条件 (Acceptance Criteria for this Phase)

- [ ] ユーザー承認ゲート（PR 1）の全項目 PASS（user 明示承認を含む）
- [ ] local-check（docs validator / 不変条件 #5 / Secret / wrangler 直接実行 / 計画系 wording）が 5 件すべて OK
- [ ] PR 1 が作成され、Issue #18 へ `Refs #18`（`Closes` ではない）でリンクされている
- [ ] PR 1 本文に「Issue #18 は既に CLOSED のため umbrella spec から workflow 化した」旨が明記されている
- [ ] PR URL が記録されている（`outputs/phase-13/pr-info.md` + artifacts.json `phases[12].pr_url`）
- [ ] PR 1 の CI（docs validator / verify-indexes / 線形履歴 / 会話解決）が green
- [ ] PR 1 マージ後、`artifacts.json.phases[12].status` が `completed` に更新される
- [ ] PR 2 起票方針（G1-G4 multi-stage approval gate 含む）が user に提示され、起票判断が user に委ねられている

---

## タスク 100% 実行確認【必須】

- 全実行タスク（9 件）が `spec_created` 相当
- 本 phase-13.md が `docs/30-workflows/ut-15-waf-rate-limiting-rules-setup/phase-13.md` に配置済み
- artifacts.json の `phases[12].status` が PR マージ後に `completed` へ更新される運用が明記
- 不変条件 #5 違反 / Secret 混入 / 計画系 wording 残存 / `wrangler` 直接実行が 0 件であることを local-check で確認
- Issue #18 は CLOSED のまま運用される旨が PR 本文と本仕様書で 2 重明記

---

## 次タスク

- 次: 本ワークフロー完了
- 後続（別 PR / 別タスク）:
  - **派生実装 PR の起票**（user 明示承認後のみ）: `feat/ut-15-waf-rate-limiting-impl` / G1-G4 multi-stage approval gate / Phase 11 smoke S-01..S-05 実走
  - UT-16 監視・アラート（並走）への S-04 / S-05 継続監視引き継ぎ
  - `CLOUDFLARE_ANALYTICS_TOKEN` rotation SOP の formalize（unassigned-task として独立起票）
  - Cloudflare Pro 移行時の OWASP CRS / Bot Management / Terraform 化（runbook TODO から将来 formalize）
- ブロック条件:
  - user 承認が無い間は PR 1 / PR 2 のいずれも作成・起票しない
  - local-check が FAIL（→ Phase 12 へ差し戻し）
  - 不変条件 #5 違反 / Secret 混入 / 計画系 wording 残存 / `wrangler` 直接実行が 1 件以上検出（→ 即時停止 / Phase 12 再実施）
  - UT-06 本番デプロイ未完了下で PR 2 を起票しない
  - G1 PASS せずに G3 / G3-prod を実行しない（Phase 3 §6 NO-GO 条件）
