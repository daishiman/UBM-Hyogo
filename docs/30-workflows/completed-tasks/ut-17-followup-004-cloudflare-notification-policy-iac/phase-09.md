# Phase 9: 品質ゲート

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | Cloudflare Notification Policy 4カテゴリ / 5 policyの IaC 化と drift 検知 (UT-17-Followup-004) |
| Phase 番号 | 9 / 13 |
| Phase 名称 | 品質ゲート |
| 作成日 | 2026-05-14 |
| 担当 | delivery |
| 前 Phase | 8 (実装本体) |
| 次 Phase | 10 (リリース準備) |
| 状態 | completed |
| GitHub Issue | #636（CLOSED — Refs として参照） |
| 親 workflow | ut-17-cloudflare-analytics-alerts |
| 実装区分 | **実装仕様書** |
| 実装区分 判定根拠 | 本 Phase は CI と pre-merge / pre-deploy で実行する品質ゲートのコマンド・合格基準・fail 時の対応を実コマンドで固定する。各 gate は実コードに対する観測点であり、仕様として fail 条件を明文化する必要があるため実装仕様書扱い。 |

---

## 目的

Phase 8 実装本体に対し、以下 7 種の品質ゲートを **すべて green** で通過することを Phase 10（リリース準備）への進行条件とする:

1. typecheck (`pnpm typecheck`)
2. lint (`pnpm lint`)
3. shellcheck (`scripts/cf.sh`)
4. ajv による JSON Schema validation
5. secret scan (`git grep` ベース)
6. vitest（Phase 7 純関数テスト）
7. bats-core（Phase 7 シェル統合テスト）

各 gate は **mise exec 経由のみ** で実行し、`.env` 実値や CLOUDFLARE_API_TOKEN 等の機密値を読まない（CI でも実行可能なように設計）。

---

## 9-1. ゲート一覧と合格基準

| # | Gate | コマンド | 合格基準 | fail 時対応 |
| --- | --- | --- | --- | --- |
| G1 | typecheck | `mise exec -- pnpm typecheck` | exit 0 | TypeScript 型エラーを最小差分で修正 |
| G2 | lint | `mise exec -- pnpm lint` | exit 0 | `pnpm lint --fix` で自動修正 → 残りを手修正 |
| G3 | shellcheck (cf.sh) | `mise exec -- shellcheck -x -s bash scripts/cf.sh` | exit 0、warning 0 | SC2086 等は quoting 修正 / `# shellcheck disable=` は乱用しない |
| G4 | JSON Schema validate (policy) | `mise exec -- pnpm exec ajv validate -s infra/cloudflare-alerts/schema/policy.schema.json -d "infra/cloudflare-alerts/policies/*.json" --spec=draft2020 --strict=true` | 全 policy ファイルが valid | Schema 違反箇所を JSON 側で修正 |
| G5 | JSON Schema validate (webhook) | `mise exec -- pnpm exec ajv validate -s infra/cloudflare-alerts/schema/webhook.schema.json -d "infra/cloudflare-alerts/webhooks/*.json" --spec=draft2020 --strict=true` | 全 webhook ファイルが valid | 同上 |
| G6 | JSON Schema validate (quota-base) | `mise exec -- pnpm exec ajv validate -s infra/cloudflare-alerts/schema/quota-base.schema.json -d infra/cloudflare-alerts/quota-base.json --spec=draft2020 --strict=true` | valid | 同上 |
| G7 | secret scan (token / URL) | 9-3 のコマンド群 | 全コマンドが 0 hit | hit があれば該当ファイルから実値を 1Password 参照 (`op://`) に置換 |
| G8 | webhook ID 直書き禁止 | `git grep -nE '"id"\s*:' infra/cloudflare-alerts/policies/ infra/cloudflare-alerts/webhooks/` | 0 hit | policy 側 `mechanisms.webhooks[]` は `name` のみ、webhook 側は server 生成 id を書かない |
| G9 | vitest（純関数） | `mise exec -- pnpm vitest run infra/cloudflare-alerts` | Phase 7 の C1〜Q6 全 pass | red を 1 件ずつ修正。skip / it.todo は禁止 |
| G10 | bats-core（シェル統合） | `mise exec -- bats scripts/__tests__/cf-alerts.bats` | Phase 7 の S1〜S13 全 pass | 同上 |
| G11 | mock dry-run idempotency | 9-4 の 2 回連続 apply | 2 回目の write-log diff が 0 件 | apply ロジックの upsert 判定（name 一致時 PUT）を修正 |
| G12 | wrangler 直接呼び出し禁止 | `git grep -nE '^[[:space:]]*wrangler[[:space:]]' infra/cloudflare-alerts/ scripts/cf.sh` で `cf_alerts_*` 周辺に hit 0 | 0 hit（cf.sh 本体の wrangler 呼び出しは alerts 配下からは到達しないこと） | wrangler コマンドを `cf_alerts_api` 経由 (HTTP API) に置換 |

---

## 9-2. shellcheck 実行詳細

`scripts/cf.sh` に追加した `cf_alerts_main` / `cf_alerts_run` / `cf_alerts_usage` 含めて以下条件:

| 項目 | 値 |
| --- | --- |
| 対象 | `scripts/cf.sh` 全体 |
| 除外 | なし（`# shellcheck disable=` は事実上 0 を目標。やむを得ない場合は理由コメント必須） |
| shell | `bash` |
| 外部 source | `-x` で `scripts/with-env.sh` を辿る |
| 検出レベル | default（`style` 含む warning も対象） |

`scripts/__tests__/cf-alerts.bats` 自体も shellcheck 対象に含める:

```bash
mise exec -- shellcheck -s bash scripts/__tests__/cf-alerts.bats
```

---

## 9-3. secret scan の網羅コマンド

| # | スキャン対象 | コマンド | 合格基準 |
| --- | --- | --- | --- |
| SS1 | CLOUDFLARE token を repo に書いていない | `git grep -nE "CLOUDFLARE_(API\|ALERTS)_TOKEN\s*=\s*[\"']?[A-Za-z0-9_\\-]{20,}" -- infra/ scripts/ docs/` | 0 hit |
| SS2 | webhook URL の実値が repo に流出していない | `git grep -nE "https://[^[:space:]\"]+/internal/alert-relay" -- infra/ docs/` | 0 hit（README サンプルは `<relay-worker-host>` placeholder のみ） |
| SS3 | Slack Webhook URL が repo に流出していない | `git grep -nE "https://hooks\\.slack\\.com/services/" -- infra/ docs/` | 0 hit |
| SS4 | cf-webhook-auth secret 実値の流出 | `git grep -nE "cf-webhook-auth[: =][^[:space:]\"]{16,}" -- infra/ docs/` | 0 hit（README で値の例示禁止） |
| SS5 | policy / webhook JSON 内に `urlRef` / `valueRef` 以外で `op://` 参照していない | `git grep -nE "op://" infra/cloudflare-alerts/policies/` | 0 hit（参照は webhooks/*.json のみに集約） |
| SS6 | Cloudflare account_id の直書き禁止 | `git grep -nE "[0-9a-f]{32}" -- infra/cloudflare-alerts/` | 0 hit（account_id は env 経由のみ） |

> SS1〜SS6 が 1 つでも hit したら **その時点で Phase 9 fail**。Phase 8 へ差し戻し、原因のファイルを `op://` 参照または env 経由に置換した上で再評価する。

---

## 9-4. mock dry-run idempotency 検証

冪等性は完了条件「2 回連続実行で diff が出ない」を直接担保するため独立 gate とする。

```bash
# 準備
export CF_ALERTS_MOCK_DIR="$(mktemp -d)"
cp tests/fixtures/cloudflare-alerts/api-list-policies.json    "$CF_ALERTS_MOCK_DIR/"
cp tests/fixtures/cloudflare-alerts/api-list-webhooks.json    "$CF_ALERTS_MOCK_DIR/"

# 1 回目（mock 上では apply の write が log に残るだけ）
bash scripts/cf.sh alerts apply --yes
mv "$CF_ALERTS_MOCK_DIR/write-log.txt" "$CF_ALERTS_MOCK_DIR/write-log-1.txt"

# 2 回目（actual を更新した想定で再 apply）
# mock api-list を「apply 結果が反映済み」状態に差し替えるテストハーネスを Phase 8 で実装
bash scripts/cf.sh alerts apply --yes
# 期待: write-log-2.txt が空（PUT/POST 0 件）
test ! -s "$CF_ALERTS_MOCK_DIR/write-log.txt"
```

| 判定 | 合格基準 |
| --- | --- |
| 1 回目 | write-log に webhook → policy の順で 5〜6 行 |
| 2 回目 | write-log が空 (0 byte) |
| diff | `bash scripts/cf.sh alerts diff` が exit 0 |

---

## 9-5. CI 上での gate 配置

`.github/workflows/cloudflare-alerts-iac.yml`（新規）で以下 job を配置する仕様（実 workflow ファイル作成は Phase 10 でユーザー承認後）。

| Job | 実行 gate | secrets |
| --- | --- | --- |
| `validate` | G1, G2, G3, G4, G5, G6, G7, G8, G9, G10, G11, G12 | なし（mock dir のみ） |
| `drift-check` | `bash scripts/cf.sh alerts diff --ci` | `CLOUDFLARE_ALERTS_TOKEN_READ`（read-only） |

> `validate` job は secret なしで完結する設計（mock 経路のみ使用）。`drift-check` job だけが Cloudflare 実 API を呼ぶが、read-only token に限定（苦戦箇所 6.5）。

| Trigger | Job |
| --- | --- |
| `pull_request` | `validate` のみ（secret 不要） |
| `push` (dev / main) | `validate` + `drift-check` |
| `schedule` (daily 09:00 JST) | `drift-check` |

---

## 9-6. gate 失敗時の差し戻しルール

| 失敗 gate | 差し戻し先 | 理由 |
| --- | --- | --- |
| G1 / G2 / G3 | Phase 8 | 型 / lint / shell 構文は実装本体の責務 |
| G4 / G5 / G6 / G8 | Phase 8 | JSON Schema 違反 / ID 直書きは設計違反 |
| G7 (SS1〜SS6) | Phase 8 | secret 構造ミスは設計違反。**fix commit を作る前に op 参照に置換 → 再 commit** |
| G9 / G10 | Phase 7 → 8 | テスト red はまず Phase 7 のテスト仕様を見直し、必要なら Phase 8 修正 |
| G11 | Phase 8 | 冪等性違反は upsert 判定ロジックの修正 |
| G12 | Phase 8 | wrangler 直接呼び出しは CLAUDE.md 違反 |

---

## 9-7. gate 統合実行スクリプト

開発者ローカルで一括実行できるよう、`package.json` に script を追加する仕様:

```json
{
  "scripts": {
    "alerts:gate": "pnpm typecheck && pnpm lint && shellcheck -x -s bash scripts/cf.sh && pnpm exec ajv validate -s infra/cloudflare-alerts/schema/policy.schema.json -d \"infra/cloudflare-alerts/policies/*.json\" --spec=draft2020 --strict=true && pnpm exec ajv validate -s infra/cloudflare-alerts/schema/webhook.schema.json -d \"infra/cloudflare-alerts/webhooks/*.json\" --spec=draft2020 --strict=true && pnpm exec ajv validate -s infra/cloudflare-alerts/schema/quota-base.schema.json -d infra/cloudflare-alerts/quota-base.json --spec=draft2020 --strict=true && pnpm vitest run infra/cloudflare-alerts && bats scripts/__tests__/cf-alerts.bats"
  }
}
```

実行: `mise exec -- pnpm alerts:gate`

G7 / G8 / G12 は別途 `pnpm alerts:secret-scan` として独立 script 化（差分が出やすいため CI で頻繁に回す）。

---

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ut-17-followup-004-cloudflare-notification-policy-iac/phase-08.md | 実装本体 |
| 必須 | docs/30-workflows/ut-17-followup-004-cloudflare-notification-policy-iac/phase-07.md | テスト |
| 必須 | CLAUDE.md「シークレット管理」「Cloudflare 系 CLI 実行ルール」 | G7 / G12 の根拠 |
| 参考 | https://ajv.js.org/standalone.html | ajv-cli 使い方 |
| 参考 | https://www.shellcheck.net/ | shellcheck 検出ルール |

---

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-09/quality-gates.md | 9-1〜9-7 の確定版 |
| ドキュメント | outputs/phase-09/secret-scan-commands.md | 9-3 のコマンド集（コピペ用） |
| ドキュメント | outputs/phase-09/ci-workflow-plan.md | 9-5 の CI 配置案（実 yml は Phase 10 で承認後配置） |
| メタ | artifacts.json | phase-09 を completed に更新 |

---

## 完了条件

- [ ] G1〜G12 の 12 gate がコマンド・合格基準・fail 時対応とともに 9-1 で確定
- [ ] shellcheck 実行条件が 9-2 で確定（`# shellcheck disable=` 乱用禁止）
- [ ] secret scan SS1〜SS6 のコマンドが 9-3 で確定し、各 0 hit が合格基準
- [ ] mock dry-run idempotency 検証手順が 9-4 で確定（2 回目 write-log が 0 byte）
- [ ] CI 配置案（validate / drift-check 2 job）が 9-5 で確定
- [ ] 失敗時差し戻しルールが 9-6 で確定
- [ ] `pnpm alerts:gate` 統合 script が 9-7 で確定

---

## タスク100%実行確認【必須】

- [ ] 全実行タスクが completed
- [ ] 全成果物が指定パスに配置済み
- [ ] 全完了条件にチェック
- [ ] artifacts.json の phase-09 を completed に更新

---

## 次 Phase 引き継ぎ事項

- 次: Phase 10（リリース準備）
- 引き継ぎ事項:
  - 9-5 の CI workflow yml は本 spec を根拠に Phase 10 でユーザー承認後配置
  - `drift-check` job 用の `CLOUDFLARE_ALERTS_TOKEN_READ` を GitHub Secrets に登録する手順を Phase 10 リリース準備に含める
  - `alerts:gate` script の追加コミットは Phase 8 実装本体 PR に含める
- ブロック条件: G7 secret scan が 1 件でも hit したまま Phase 10 へ進めない
