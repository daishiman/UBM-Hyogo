# Phase 4: タスク分解（実装サブタスク化）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | Cloudflare Notification Policy 4カテゴリ / 5 policyの IaC 化と drift 検知 (UT-17-followup-004) |
| Phase 番号 | 4 / 13 |
| Phase 名称 | タスク分解 |
| 作成日 | 2026-05-14 |
| 担当 | delivery |
| 前 Phase | 3 (設計レビュー) |
| 次 Phase | 5 (実装計画) |
| 状態 | completed |
| GitHub Issue | #636（CLOSED — Refs として参照） |
| 実装区分 | **実装仕様書** |
| 実装区分 判定根拠 | 本タスクは Cloudflare API v4 `alerting/v3/policies` / `destinations/webhooks` を冪等に CRUD する **新規シェルサブコマンド (`scripts/cf.sh alerts apply|diff|list`) + JSON 宣言群 + CI workflow** を実装する。`infra/cloudflare-alerts/` ディレクトリの新規作成、`scripts/cf.sh` への新規 subcommand 追加、`.github/workflows/cloudflare-alerts-drift.yml` 新規追加が含まれるため、コード実装を伴う実装仕様書として扱う。Issue #636 は CLOSED のため Refs 扱いとし、本仕様の SSOT は本 phase ドキュメント群とする。 |

---

## 目的

UT-17（親 workflow）の T9 / T10 で Dashboard 手動設定として残された Cloudflare Notification Policy
**Workers Requests / D1 Read Queries / D1 Write Queries / Pages Build / R2 Class A Operations** の 4 category / 5 policy と
**UT-17 relay endpoint 向け webhook destination 1 件** を、リポジトリ宣言（JSON）+ 適用スクリプト（`scripts/cf.sh alerts`）+
CI drift 検知 workflow の三点セットで IaC 化する。

Phase 4 ではこれらの実装を **単一責務原則（SRP）** に沿った T1〜T10 のサブタスクへ分解し、
各サブタスクの責務・変更ファイル候補・上流依存・所要時間・DoD を Phase 5 に引き渡せる粒度で固定する。

責務境界（親 UT-17 との分離）:

| タスク | 責務 |
| --- | --- |
| UT-17 親 | Notification Policy の Dashboard 設定 + relay Worker 実装（既に完了） |
| UT-17-followup-004（本タスク） | 4 category / 5 policy + 1 webhook destination の **JSON 宣言化 + 冪等 apply + drift 検知 + CI gate** |
| UT-17 monthly healthcheck runbook | 「Dashboard 目視」→「`scripts/cf.sh alerts diff`」へ手順差し替え |

---

## 実行タスク

- [ ] Phase 02/03 成果物（4 category / 5 policy 設定値・webhook destination 名・quota base 値・token scope 方針）が GO であることを確認する
- [ ] T1〜T10 のサブタスクテーブルを `outputs/phase-04/task-breakdown.md` に固定する
- [ ] 各サブタスクの「責務」「変更ファイル候補」「上流依存」「所要時間目安」「DoD」を埋める
- [ ] サブタスク実行順序（クリティカルパス）を `outputs/phase-04/critical-path.md` に図示する
- [ ] T7（webhook destination ID 解決）が T4（apply 実装）の前段に配置されていることを確認する
- [ ] T9（CI drift 検査 workflow）が T4〜T6 の subcommand 完成後であることを確認する
- [ ] UT-17 親の relay Worker 実装と関数 / route を共有していないことを確認する
- [ ] artifacts.json の phase-04 を completed に更新する手順を確認する

---

## サブタスク分解（T1〜T10）

| # | サブタスク | 単一責務 | 変更ファイル候補 | 上流依存 | 所要時間 | DoD |
| --- | --- | --- | --- | --- | --- | --- |
| T1 | `infra/cloudflare-alerts/` ディレクトリ + README 作成 | リポジトリ上の正本ディレクトリを確定し運用手順を文書化 | 新規 `infra/cloudflare-alerts/README.md` | Phase 03 GO | 0.5h | README に「policy 宣言 → apply → diff → drift 対応」フローと token scope 方針が記載され、`mise exec -- pnpm lint` が markdown を含めて PASS |
| T2 | `quota-base.json` 作成（Workers 100k/D1 5M reads・100k writes/Pages 500/R2 1M ops 等の無料枠 base） | 無料枠 base 値を SSOT 化し、policy 閾値を `quotaBase * 0.8` で computed にする | 新規 `infra/cloudflare-alerts/quota-base.json` | T1 完了 | 0.5h | 5 metric × `{base, unit, period}` が記載され、JSON schema バリデーション PASS。出典 URL を `_meta.sources[]` に明示 |
| T3 | 4 category / 5 policy + 1 webhook destination の JSON 宣言ファイル作成 | policy / webhook destination の宣言定義（ID 直書き禁止・name で参照） | 新規 `infra/cloudflare-alerts/policies/workers-requests.json` / `d1-read-queries.json` / `d1-write-queries.json` / `pages-build.json` / `r2-class-a.json`、新規 `infra/cloudflare-alerts/webhooks/ut-17-alert-relay.json` | T2 完了 | 1.5h | 5 policy JSON が `mechanisms.webhooks[].name` を参照し ID 直書きが存在しない。webhook destination JSON が relay URL を `op://` 参照ではなく **plain URL** で保持（URL は secret ではない / token のみ secret 扱い） |
| T4 | `scripts/cf.sh alerts apply` 実装（POST/PUT 冪等適用） | webhook destination → policy の順で冪等適用（既存名なら PUT、無ければ POST） | 編集 `scripts/cf.sh`、新規 `infra/cloudflare-alerts/lib/apply.sh`（または同 wrapper 内関数） | T3 + T7 完了 | 2h | 同一定義で 2 回連続実行 → 2 回目の diff exit code = 0。`--dry-run` で API mutation を発火させずに intended diff を stdout 出力 |
| T5 | `scripts/cf.sh alerts diff` 実装（GET + JSON 正規化 diff） | Cloudflare 現状を GET → repo 宣言を正規化 → diff し exit code を返す | 編集 `scripts/cf.sh`、新規 `infra/cloudflare-alerts/lib/diff.sh`、新規 `infra/cloudflare-alerts/lib/normalize.mjs`（key sort / null 除去 / ID→name 解決） | T3 + T7 完了 | 2h | drift 無しで exit 0、policy/webhook destination いずれかに差分があれば exit 1、API error / token 不足で exit 2。`--ci` flag で `op run` skip し `CLOUDFLARE_ALERTS_TOKEN_READ` を直接読む |
| T6 | `scripts/cf.sh alerts list` 実装（read-only 列挙） | Cloudflare 上の現存 policy / webhook destination を read-only に列挙 | 編集 `scripts/cf.sh`、新規 `infra/cloudflare-alerts/lib/list.sh` | T5 完了 | 0.5h | `bash scripts/cf.sh alerts list` で policy 5 件（または 5 件）+ webhook destination 1 件が name と ID 付きで stdout 出力。secret は redact |
| T7 | webhook destination ID 解決ロジック（name → ID） | apply / diff から共通利用する name→ID 解決の pure 関数 | 新規 `infra/cloudflare-alerts/lib/resolve-destination-id.mjs` | T3 完了 | 1h | name が一意に解決でき、複数 hit / 0 hit はそれぞれ exit 2 で fail。unit test（後述 phase 6）で 3 ケース PASS |
| T8 | 1Password に専用 alerting token Item 追加 + `.env` 参照追加 | apply 用 `Account.Notifications:Edit` token / diff 用 `Account.Notifications:Read` token を deploy token と分離 | 1Password Vault（コード変更なし）、編集 `.env`（op:// 参照のみ）、編集 `.dev.vars.example` | T1 完了 | 0.5h | 1Password に `op://Personal/cloudflare-alerts-edit-token/credential` および `op://Personal/cloudflare-alerts-read-token/credential` が登録され、`.dev.vars.example` に op:// 参照が記載。実値は repo に出ない |
| T9 | CI drift 検査 workflow 追加（`Account.Notifications:Read` 専用 token） | GitHub Actions 上で `scripts/cf.sh alerts diff --ci` を read-only token で実行し drift で fail | 新規 `.github/workflows/cloudflare-alerts-drift.yml` | T5 + T8 完了 | 1h | workflow が `CLOUDFLARE_ALERTS_TOKEN_READ`（read-only）を GitHub Secrets から読み、daily schedule + manual dispatch で `alerts diff --ci` を実行。drift で exit 1、job fail。secret が job log に出ない |
| T10 | UT-17 monthly healthcheck runbook を `scripts/cf.sh alerts diff` 経路に差し替え | 「Dashboard 目視」記載を「`scripts/cf.sh alerts diff` 実行 + 差分判定」へ書き換える | 編集 `docs/30-workflows/runbooks/ut-17-alert-relay-monthly-healthcheck.md` | T5 完了 | 0.5h | runbook の health check 手順が `bash scripts/cf.sh alerts diff` 実行とその exit code 解釈に置き換わり、Dashboard 目視は補助手順に格下げ |

> **注記**: T1〜T10 は順序依存があり、T4（apply）と T5（diff）は T3（JSON 宣言）+ T7（name→ID 解決）完成後に着手する。T9（CI workflow）は T5 完成後でないと job が成り立たない。

---

## クリティカルパス

```
T1 → T2 → T3 → T7
              ↓
              T4 ──┐
              T5 ──┼→ T6 → T9 → T10
              T8 ──┘
```

| 区間 | 累積時間 | 備考 |
| --- | --- | --- |
| T1〜T3（前提整備・宣言ファイル） | 2.5h | ディレクトリ + base + JSON 群 |
| T7・T8（共通ロジック・token） | 1.5h | name→ID 解決と token rotate |
| T4〜T6（subcommand 実装） | 4.5h | apply / diff / list |
| T9・T10（CI + runbook 差し替え） | 1.5h | drift 検知の常時化 |
| **合計** | **10.0h** | 1.5 営業日想定 |

---

## 不変条件チェック（CONST_005 準拠）

- [ ] D1 直接アクセスは `apps/api` に閉じる（本タスクは Cloudflare API alerting のみ、D1 アクセスなし、`apps/web` 変更なし）
- [ ] Secret は 1Password → 環境変数経由のみ。`.env` には `op://` 参照のみ
- [ ] Cloudflare CLI は `bash scripts/cf.sh alerts ...` 経由のみ（`wrangler` / `terraform` / 生 `curl` 直接実行禁止）
- [ ] UT-17 親 workflow の relay Worker（`apps/api/src/routes/internal/alert-relay.ts` 等）に手を加えない
- [ ] webhook destination は ID 直書き禁止、name → ID 解決を経由する
- [ ] `.env` 実値書き込み禁止。token は専用 Item を 2 種（apply 用 / diff 用）

---

## 統合テスト連携

| 連携先 | 連携内容 | 本 Phase での扱い |
| --- | --- | --- |
| UT-17 親（relay Worker） | 通知到達経路の終端 | webhook destination の URL 参照先として連携。Worker 実装は変更しない |
| UT-17 monthly healthcheck runbook | 月次運用 | T10 で `alerts diff` 経路へ差し替え |
| UT-08-IMPL（WAE custom alerts） | 別経路・別 channel | 本タスクは Cloudflare native Notification Policy のみで責務を分離 |

---

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/unassigned-task/ut-17-followup-004-cloudflare-notification-policy-iac.md | 元タスク指示書（正本） |
| 必須 | docs/30-workflows/ut-17-cloudflare-analytics-alerts/phase-04.md | 親 workflow のタスク分解フォーマット |
| 必須 | docs/30-workflows/runbooks/ut-17-alert-relay-monthly-healthcheck.md | T10 差し替え対象 |
| 必須 | scripts/cf.sh | subcommand 追加対象 |
| 必須 | CLAUDE.md「シークレット管理」「Cloudflare 系 CLI 実行ルール」 | 不変条件の出典 |
| 参考 | https://developers.cloudflare.com/api/operations/notification-policies-create-notification-policy | Cloudflare API v4 alerting/v3/policies |
| 参考 | https://developers.cloudflare.com/api/operations/notification-webhooks-create-a-webhook | Cloudflare API v4 destinations/webhooks |

---

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-04/task-breakdown.md | T1〜T10 サブタスクテーブル |
| ドキュメント | outputs/phase-04/critical-path.md | 実行順序とクリティカルパス図 |
| メタ | artifacts.json | phase-04 を completed に更新 |

---

## 完了条件

- [ ] T1〜T10 が単一責務原則で分解され、各サブタスクが「責務」「変更ファイル候補」「上流依存」「所要時間」「DoD」を持っている
- [ ] T7（name→ID 解決）が T4（apply）/ T5（diff）より前段にあることが確認されている
- [ ] T9（CI workflow）が T5（diff）完成後に配置されていることが確認されている
- [ ] UT-17 親 workflow の relay Worker 実装と responsibilty が重複していない
- [ ] CONST_005 の不変条件チェックが全 PASS
- [ ] outputs/phase-04 配下が artifacts.json と 1 対 1 整合

---

## タスク100%実行確認【必須】

- [ ] 全実行タスクが completed
- [ ] 全成果物が指定パスに配置済み
- [ ] 全完了条件にチェック
- [ ] artifacts.json の phase-04 を completed に更新

---

## 次 Phase 引き継ぎ事項

- 次: Phase 5（実装計画）
- 引き継ぎ事項:
  - T1〜T10 の DoD を Phase 5 で「変更対象ファイル一覧」「subcommand シグネチャ」「JSON schema」レベルまで具体化する
  - 変更ファイル候補（パス）を Phase 5 の「変更対象ファイル一覧」に転記する
  - クリティカルパスを Phase 5 の実装順序の根拠とする
  - quota-base.json の base 値出典 URL は Phase 5 で `_meta.sources[]` 設計に落とす
- ブロック条件: T1〜T10 のいずれかが単一責務でない、または親 UT-17 と実装重複がある場合
