# Phase 11 — 手動テスト

> Task: issue-863-admin-error-alert-policy-iac
> evidence 出力先: `docs/30-workflows/completed-tasks/issue-863-admin-error-alert-policy-iac/outputs/phase-11/manual-test-result.md`

---

## 11-0. NON_VISUAL 宣言（冒頭・必須）

**本タスクは `visualEvidence: NON_VISUAL` である。スクリーンショットは取得しない。**

| 項目 | 内容 |
|------|------|
| タスク種別 | backend / IaC / logger（observability-iac） |
| 非視覚的である理由 | 変更対象は (1) `apps/web/src/lib/logger.ts` の Sentry tag 昇格（送出メタデータ）、(2) `infra/sentry-alerts/**` の宣言的 IaC + CLI、(3) drift CI / runbook / CODEOWNERS。**UI レンダリング・画面・スタイルの変更は一切ない**（admin error.tsx の emit は既存実装で本タスク対象外）。 |
| 代替証跡 | ① logger 単体テストの tag アサーション、② sentry-alerts lib unit test 件数、③ Sentry console / Slack 着信の text/JSON evidence（user-gated 実行時） |

> 参照: 親 workflow `fix-admin-server-components-render-error-stg/outputs/phase-11/phase-11.md` も NON_VISUAL（render error は staging ログ/Sentry で検証）。

---

## 11-1. 実地手動テスト手順（user-gated・本仕様作成時点では未実行）

> 以下は実 Sentry API / staging 環境への副作用を伴うため **user 承認後にのみ実行**する。
> 実行後、各ステップの結果（text / JSON / 通知本文）を evidence 出力先へ貼付する。

### Step 1 — admin scope error の意図的発生 + tag 付与確認（AC-2）

1. staging（`dev` deploy 済）にデプロイした状態で、admin 配下（`/admin/**`）で意図的に
   render error を 1 件発生させる（既存 `error.boundary.caught` emit 経路を使う）。
2. Sentry の該当 issue を開き、**tags に `scope=admin` と `digest=<値>` が付与**されていることを確認する。
   - 期待: 従来 extras 止まりだった `scope`/`digest` が、logger.ts の昇格により tag として検索/フィルタ可能。
3. evidence: Sentry issue の tags 一覧（テキスト or JSON export）を貼付。

### Step 2 — alert rule の適用 + console での存在確認（AC-1 / AC-6）

1. `Alerts:Write` scope token（`op://` 参照・実値はログに残さない）を環境注入し、
   `mise exec -- pnpm sentry-alerts:apply --yes` を実行する。
2. Sentry console（Alerts 設定）で `admin-error-boundary` rule が存在し、
   条件が `tags.scope == admin` + scope filter と digest notification tag であることを目視確認する。
3. 直後に `mise exec -- pnpm sentry-alerts:diff --ci` を実行し **drift=0（exit 0）**を確認（IaC 正本 = AC-6）。
4. evidence: apply 出力 + diff 出力（JSON）を貼付。

### Step 3 — 5 分窓 3 回閾値で Slack 通知到達（AC-3）

1. Step 1 の admin scope error を **5 分窓内に 3 回**再発させ、閾値を超過させる。
2. Sentry alert → **Slack `#ubm-hyogo-incidents`** に通知が到達することを確認（09b-A 連携済み経路）。
3. evidence: Slack 通知本文（テキスト・チャンネル名 / 件名 / Sentry リンクが見える範囲）を 1 件貼付（AC-3 充足）。

---

## 11-2. 代替の自動テスト証跡（実装サイクルで取得・非 user-gated）

| 証跡 | ファイル | 内容 |
|------|---------|------|
| logger tag 検証 | `apps/web/src/lib/__tests__/logger.spec.ts` | `logger.error({event,scope:"admin",digest})` 時に `captureException` の `tags` に `scope`/`digest` が昇格すること、欠損時は tag に入らないことをアサート |
| sentry-alerts lib unit | `infra/sentry-alerts/lib/__tests__/{schema-contract,load,diff}.spec.ts` | policy JSON の schema pass / canonical 化 / drift=0 を検証（件数: 3 spec ファイル、各 gate G4/G5/G6 対応） |
| drift CI（PR validate） | `.github/workflows/sentry-alerts-drift.yml` | PR では `pnpm test:sentry-alerts`（manifest+unit）のみ。schedule/dispatch で read-only 実 diff |

---

## 11-3. 未実行ステータス

**11-1 の実地操作（Step 1..3）は user-gated であり、本仕様作成時点では未実行。**
artifacts.json の Gate-B（implementation_review）/ Gate-C（external_ops）が `pending` であることと整合する。
evidence は実行後に `outputs/phase-11/manual-test-result.md` へ追記し、AC-3 の充足をもって Gate-B を更新する。
