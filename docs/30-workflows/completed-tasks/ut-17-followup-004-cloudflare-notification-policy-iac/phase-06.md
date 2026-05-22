# Phase 6: テスト戦略

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | Cloudflare Notification Policy 4カテゴリ / 5 policyの IaC 化と drift 検知 (UT-17-followup-004) |
| Phase 番号 | 6 / 13 |
| Phase 名称 | テスト戦略 |
| 作成日 | 2026-05-14 |
| 担当 | delivery |
| 前 Phase | 5 (実装計画) |
| 次 Phase | 7 (セキュリティ・プライバシー) |
| 状態 | completed |
| GitHub Issue | #636（CLOSED — Refs として参照） |
| 実装区分 | **実装仕様書** |
| 実装区分 判定根拠 | Phase 5 で固定した `infra/cloudflare-alerts/lib/*.mjs` の pure 関数（`resolveDestinationId` / `normalizeAlertResource`）と shell 経路（`cf.sh alerts apply|diff|list`）を **実コードとして検証する**。本 Phase ではテスト層・テストケース・カバレッジ目標・ローカル実行コマンド・DoD を CONST_005 系の検証として固定する。 |

---

## 目的

Phase 5 で固定した subcommand シグネチャ・JSON schema・exit code に対して、
**単体 / 統合 / E2E（staging account）** の 3 層テスト戦略を立案し、
カバレッジ目標とローカル実行コマンドを確定する。

DoD（章 6-9）として「4 category / 5 policy が冪等 apply される / diff が drift で fail する / secret が log に出ない」の 3 点を必達条件とする。

---

## 6-1. テスト層と責務

| 層 | 対象 | 実行環境 | 主な検証観点 |
| --- | --- | --- | --- |
| 単体 | `normalizeAlertResource` / `resolveDestinationId` | vitest（Node 24） / `mise exec -- pnpm test` | 純関数の入出力・エラー条件（key sort, null 除去, name→ID 解決） |
| 統合（ローカル） | `cf.sh alerts apply --dry-run` / `diff` 一連 | shell + 1Password CLI（`op run`） | dry-run → live apply → 2 回目 diff = 0（冪等性） |
| E2E（staging account） | 実 Cloudflare Account に対する apply / drift 注入 / diff | staging account + scripts/cf.sh | drift 注入で `diff` exit 1、再 apply で復旧 |
| CI gate | `.github/workflows/cloudflare-alerts-drift.yml` | GitHub Actions | drift 検知 job が daily schedule + manual dispatch で動作し、token / secret を log に出さない |

---

## 6-2. 単体テストケース

### 6-2-1. `normalize.test.mjs`（6 ケース）

| Test ID | 入力 | 期待 |
| --- | --- | --- |
| NRM-01 | 同一意味で key 順序のみ異なる 2 つの policy JSON | `normalizeAlertResource` 出力文字列が完全一致 |
| NRM-02 | `null` / `undefined` / 空配列 `[]` を含む JSON | 該当 key が出力から除去される |
| NRM-03 | server-managed フィールド（`id`, `created`, `modified`, `account_id`） | 出力から除去される |
| NRM-04 | `mechanisms.webhooks[].id` のみ持つ Cloudflare 側 JSON | 比較対象から除外され、name のみで比較できる |
| NRM-05 | `_threshold` フィールド（独自）を含む repo 側 JSON | API 送出向け正規化では除去される |
| NRM-06 | `kind` に未知値 `"foo"` を渡す | throw（呼び出し側で exit 2 に変換される前提） |

### 6-2-2. `resolve-destination-id.test.mjs`（3 ケース、fetch mock）

| Test ID | mock 応答 | 期待 |
| --- | --- | --- |
| RID-01 | `result: [{ id: "abc", name: "ut-17-alert-relay" }]` | `"abc"` を返す |
| RID-02 | `result: []`（0 件） | throw（呼び出し側で exit 2） |
| RID-03 | `result: [{...same name...}, {...same name...}]`（多件） | throw（呼び出し側で exit 2） |

### 6-2-3. `cf.sh alerts diff` exit code（shell 統合、3 ケース）

| Test ID | 状態 | 期待 exit code |
| --- | --- | --- |
| DIFF-EX-00 | repo 宣言と Cloudflare 現状が完全一致 | 0 |
| DIFF-EX-01 | repo 宣言のうち 1 policy の `enabled` を変更（drift 注入） | 1（stdout に該当 policy の unified diff） |
| DIFF-EX-02 | token 未設定（`CLOUDFLARE_ALERTS_TOKEN_READ` 未注入） | 2 |

---

## 6-3. 統合テスト（ローカル）

冪等性（idempotency）を 1 営業日内に確認する手順。

```bash
# 1) op run 経由で edit token を注入し dry-run
mise exec -- bash scripts/cf.sh alerts apply --dry-run

# 2) 実 apply（1 回目）
mise exec -- bash scripts/cf.sh alerts apply

# 3) diff（1 回目 apply 直後）
mise exec -- bash scripts/cf.sh alerts diff
# → exit 0（no drift）が期待

# 4) 再 apply（idempotency 検証）
mise exec -- bash scripts/cf.sh alerts apply

# 5) diff（2 回目 apply 直後）
mise exec -- bash scripts/cf.sh alerts diff
# → exit 0（no drift）が期待

# 6) list で 5 policy + 1 webhook destination を目視確認
mise exec -- bash scripts/cf.sh alerts list
```

| 検証項目 | 期待 |
| --- | --- |
| dry-run で API mutation が発火しない | Cloudflare audit log に変更レコードが残らない |
| 1 回目 apply 後 diff = 0 | apply が完全な状態同期を保証 |
| 2 回目 apply 後 diff = 0 | 冪等性 |
| list 出力に webhook destination ID が表示 | name → ID 解決が機能 |
| stdout / stderr に token 実値が含まれない | secret redaction |

---

## 6-4. E2E テスト（staging account・drift 注入）

```bash
# 1) 初期状態 apply
mise exec -- bash scripts/cf.sh alerts apply

# 2) Cloudflare Dashboard 上で 1 policy の閾値 / enabled を手動変更（drift 注入）
#    → audit log にも記録される

# 3) diff で drift 検知
mise exec -- bash scripts/cf.sh alerts diff
echo "exit=$?"   # 1 が期待

# 4) 再 apply で復旧
mise exec -- bash scripts/cf.sh alerts apply

# 5) diff で drift 解消確認
mise exec -- bash scripts/cf.sh alerts diff
echo "exit=$?"   # 0 が期待
```

| 検証項目 | 期待 |
| --- | --- |
| drift 注入後の diff stdout に該当 policy 名 + 変更点が含まれる | diff 表示が運用に耐える |
| 再 apply 後 diff = 0 | apply が drift を確実に上書き |
| webhook destination の `secret` フィールド | 再 apply で既存値を上書きせず（null 送出しない）|

---

## 6-5. CI gate テスト

`.github/workflows/cloudflare-alerts-drift.yml` の動作確認:

```bash
# manual dispatch
gh workflow run cloudflare-alerts-drift.yml

# 直近の run を確認
gh run list --workflow=cloudflare-alerts-drift.yml --limit 3
gh run view <run-id> --log
```

| 検証項目 | 期待 |
| --- | --- |
| daily schedule (`cron`) と `workflow_dispatch` 両方で起動可能 | workflow trigger の互換性 |
| `--ci` flag 経由で `op run` を skip し `CLOUDFLARE_ALERTS_TOKEN_READ` を読む | CI 互換性 |
| drift なしで job が green | exit 0 |
| drift 注入で job が red | exit 1 |
| log に token 実値が出ない（`***` redacted） | secret hygiene |
| read-only token のため job が誤って apply を実行できない | scope 分離 |

---

## 6-6. ローカル実行コマンドサマリー

```bash
# 型チェック / lint（追加 npm 依存ゼロのため既存パイプライン経由）
mise exec -- pnpm typecheck
mise exec -- pnpm lint

# 単体テスト（normalize / resolve-destination-id）
mise exec -- pnpm test -- infra/cloudflare-alerts/lib

# subcommand 動作確認
mise exec -- bash scripts/cf.sh alerts list
mise exec -- bash scripts/cf.sh alerts diff --dry-run   # （diff には --dry-run 概念がない場合は省略）
mise exec -- bash scripts/cf.sh alerts diff
mise exec -- bash scripts/cf.sh alerts apply --dry-run

# E2E（staging account・要 edit token）
mise exec -- bash scripts/cf.sh alerts apply
```

> `apply --dry-run` は API mutation を発火させないため CI / 開発双方で安全。
> `diff` は GET のみで副作用なしのため定常実行可能。

---

## 6-7. カバレッジ目標

| 対象モジュール | line coverage 目標 | branch coverage 目標 |
| --- | --- | --- |
| `infra/cloudflare-alerts/lib/normalize.mjs` | ≥ 90% | ≥ 85%（NRM-01〜06 を網羅） |
| `infra/cloudflare-alerts/lib/resolve-destination-id.mjs` | ≥ 90% | ≥ 80%（0 件 / 1 件 / 多件） |
| shell 経路（`apply.sh` / `diff.sh` / `list.sh`） | カバレッジ計測対象外（shell） | 統合テスト 6-3 / E2E 6-4 で代替 |
| **既存標準** | **line ≥ 80%** | branch ≥ 75% |

> shell スクリプトは line coverage 計測の対象外。代わりに 6-3 / 6-4 の手順を実行 evidence として保持する。

---

## 6-8. 異常系・境界値

| カテゴリ | テスト観点 | 担当 Test ID |
| --- | --- | --- |
| 認証 | token 未設定 / scope 不足（Read token で apply 試行） | DIFF-EX-02 / E2E 手順 4 |
| name→ID 解決 | webhook destination が 0 件 / 多件 hit | RID-02 / RID-03 |
| 正規化 | 未知 kind / 想定外フィールド | NRM-06 |
| API 障害 | Cloudflare API 5xx を mock | （単体: fetch mock で retry なし即 exit 1 を確認） |
| secret hygiene | stdout / stderr に token が出ない | 6-3 検証項目 + CI log 確認 |
| quota-base 更新 | base 値変更後 apply で `_threshold * base` が再計算 | 統合テスト 6-3 を base 値変更前後で再実行 |

---

## 6-9. DoD（必達条件）

- [ ] 4 category / 5 policy + 1 webhook destination が `cf.sh alerts apply` で冪等適用される（2 回連続 apply で 2 回目 diff = 0）
- [ ] `cf.sh alerts diff` が drift 注入で exit 1、解消で exit 0 を返す
- [ ] secret（API token、cf-webhook-auth secret、Slack Webhook URL）が stdout / stderr / CI log のいずれにも実値で出ない
- [ ] `.github/workflows/cloudflare-alerts-drift.yml` が daily schedule + manual dispatch の両方で起動する
- [ ] UT-17 monthly healthcheck runbook が `bash scripts/cf.sh alerts diff` 経路へ差し替え済み
- [ ] `mise exec -- pnpm typecheck` および `mise exec -- pnpm lint` が PASS

---

## 統合テスト連携

| 連携先 | 連携内容 | 本 Phase での扱い |
| --- | --- | --- |
| UT-17 親（relay Worker） | webhook destination 経由の通知到達 | E2E 6-4 で実 Slack 通知到達まで観察 |
| UT-17 monthly healthcheck runbook | `alerts diff` 経路への差し替え | T10（Phase 5）と整合 |
| Phase 11（受入テスト） | DIFF-EX-00〜02 / NRM-01〜06 / RID-01〜03 を AC-1〜AC-X に紐付け | Test ID 一覧を Phase 11 evidence の入力にする |

---

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ut-17-followup-004-cloudflare-notification-policy-iac/phase-05.md | subcommand シグネチャ・JSON schema・exit code |
| 必須 | docs/30-workflows/runbooks/ut-17-alert-relay-monthly-healthcheck.md | T10 差し替え対象 |
| 必須 | scripts/cf.sh | wrapper の現状把握 |
| 参考 | https://vitest.dev/api/ | vitest API |
| 参考 | https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions | workflow_dispatch / schedule |

---

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-06/test-strategy.md | 3 層戦略・Test ID 一覧・カバレッジ目標 |
| ドキュメント | outputs/phase-06/test-cases.md | NRM-01〜06 / RID-01〜03 / DIFF-EX-00〜02 の詳細 |
| ドキュメント | outputs/phase-06/dod-checklist.md | 6-9 必達条件チェックリスト |
| メタ | artifacts.json | phase-06 を completed に更新 |

---

## 完了条件

- [ ] NRM-01〜06 / RID-01〜03 / DIFF-EX-00〜02 の Test ID が全て定義されている（最低 12 ケース）
- [ ] 6-3 ローカル統合手順 / 6-4 E2E drift 注入手順 / 6-5 CI gate 検証手順が記述されている
- [ ] カバレッジ目標が既存標準（line ≥ 80%）以上で設定されている
- [ ] ローカル実行コマンドが `mise exec -- pnpm` / `bash scripts/cf.sh` 経由で記述されている
- [ ] DoD 6-9 の 6 項目すべてに検証手順が紐付いている

---

## タスク100%実行確認【必須】

- [ ] 全実行タスクが completed
- [ ] 全成果物が指定パスに配置済み
- [ ] 全完了条件にチェック
- [ ] artifacts.json の phase-06 を completed に更新

---

## 次 Phase 引き継ぎ事項

- 次: Phase 7（セキュリティ・プライバシー）
- 引き継ぎ事項:
  - 6-8 の「secret hygiene」観点は Phase 7 で stdout / stderr / CI log redaction の具体実装方針として確定する
  - DIFF-EX-02（token 不足）は Phase 7 で token rotate 手順と整合させる
  - 6-5 の `--ci` 経路で読む `CLOUDFLARE_ALERTS_TOKEN_READ` の GitHub Secrets 登録手順は Phase 7 で確定する
- ブロック条件: 既存標準（line ≥ 80%）を満たさない目標設定がある場合、または DoD 6-9 の 6 項目に検証手順が紐付かない場合
