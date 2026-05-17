# Unassigned Task Detection（後続 unassigned task 検出）

> Source issue: [#717](https://github.com/daishiman/UBM-Hyogo/issues/717)
> implementation_mode: `verified_current_no_code_change_pending_pr`
> task classification: code task (GitHub Actions workflow YAML)
> visual classification: NON_VISUAL
> 実装区分: **実装仕様書**

---

## 1. 検出方針

本タスク（Issue #717 Cloudflare GitHub Actions OIDC Full Migration）の CONST_007 1 サイクル完了スコープから **明示的に除外** された項目を、後続 unassigned task として formalize する。検出対象は「本タスクで実施しない」かつ「将来の所有者が必要」な作業のみ。

元仕様 `docs/30-workflows/unassigned-task/issue-640-followup-001-oidc-full-migration.md` §2.3「含まないもの」を引用根拠とする。

---

## 2. 検出された unassigned task 一覧（4 件）

### 2.1 official support 確認後の staging proof / production OIDC cutover

| 項目 | 内容 |
|---|---|
| 仮 ID | `issue-717-followup-001-production-oidc-cutover` |
| 検出根拠 | 本タスクで official OIDC deploy support が確認できず、staging OIDC proof も production cutover も実行不可になった |
| 内容 | Cloudflare official support を再確認し、support が確認できた場合に staging proof を取得する。その後 production cutover を段階実行する。subject claim を `repo` / `ref` / `environment` で pin し、step-scoped token 経路を observation 完了まで rollback path として温存する |
| 前提条件 | Cloudflare Workers GitHub Actions docs または `cloudflare/wrangler-action` が OIDC / workload federation deploy auth を公式に示すこと |
| 実施先 | `docs/30-workflows/unassigned-task/issue-717-followup-001-production-oidc-cutover.md` |
| 所有者 | 未定（本タスク完了時点でユーザー判断） |

### 2.2 legacy long-lived `CLOUDFLARE_API_TOKEN` の物理失効

| 項目 | 内容 |
|---|---|
| 既存 ID | `issue-640-followup-002-legacy-token-revocation` |
| 検出根拠 | 元仕様 §2.3「Cloudflare dashboard 上での legacy API Token 物理失効（`issue-640-followup-002-legacy-token-revocation` が所有）」 |
| 内容 | Cloudflare dashboard 上で long-lived API Token を物理失効する。1Password / GitHub Secrets / Cloudflare dashboard の 3 箇所同期も含む |
| 前提条件 | 上記 2.1 の staging proof + production cutover 完了 + 観察期間経過 |
| 依存順制約 | 本タスクおよび 2.1 で rollback path として `secrets.CLOUDFLARE_API_TOKEN` を温存しているため、観察期間中に物理失効すると rollback 不能になる。**先行実施禁止** |
| 実施先 | `docs/30-workflows/unassigned-task/issue-640-followup-002-legacy-token-revocation.md`（既存スケルトン） |
| 所有者 | 別 issue として既に formalize 済み |

### 2.3 `apps/api` 側 D1 token cutover

| 項目 | 内容 |
|---|---|
| 仮 ID | `issue-717-followup-002-apps-api-d1-token-cutover` |
| 検出根拠 | 元仕様 §2.3「`apps/api` 側の D1 token cutover 全般」 |
| 内容 | `apps/api` Workers の D1 deploy credential を OIDC 化または step-scoped 化する。`backend-ci.yml` の `cloudflare/wrangler-action` 4 箇所への適用判断を含む |
| 前提条件 | official support が確認された OIDC pattern、または token-split pattern の安定運用実績 |
| 実施先 | `docs/30-workflows/unassigned-task/issue-717-followup-002-apps-api-d1-token-cutover.md` |
| 所有者 | 未定 |

### 2.4 1Password 正本の構造変更

| 項目 | 内容 |
|---|---|
| 仮 ID | `issue-717-followup-003-1password-restructure` |
| 検出根拠 | 元仕様 §2.3「1Password 正本の構造変更本体（参照更新の判断材料作成にとどめる）」 |
| 内容 | OIDC 完全移行確定後、1Password 上の `CLOUDFLARE_API_TOKEN` 参照 path を再編し、`op://` 参照を整理する。`.env` 上の参照更新も含む |
| 前提条件 | 上記 2.1 production cutover 完了 + 2.2 legacy token 物理失効完了 |
| 実施先 | `docs/30-workflows/unassigned-task/issue-717-followup-003-1password-restructure.md` |
| 所有者 | 未定 |

---

## 3. 実行順制約サマリ

```
本タスク #717（official support revalidation + no-code decision）
        ↓ official support 確認
2.1 staging OIDC proof（別 PR）
        ↓ 完了 + 観察期間
2.1 production OIDC cutover（別 PR）
        ↓ 完了 + 観察期間
2.2 legacy token 物理失効（issue-640-followup-002）
        ↓ 完了
2.4 1Password 構造変更（参照 path 再編）

# 並列可（本タスク完了後に独立判断）
2.3 apps/api D1 token cutover
```

---

## 4. 検出されなかった項目（明示記録）

以下は本タスク内で完結するため、unassigned 化しない:

- official support の一次情報再検証と no-code 判定
- current `CLOUDFLARE_API_TOKEN` boundary の正本同期
- `deployment-secrets-management.md` 反映（本タスク Phase 12 ドキュメント更新）

---

## 5. DoD

- [x] unsupported 判定で新たに future gate へ戻った staging proof を 2.1 に含めて列挙（4 件）
- [x] 各項目に実施先候補（Issue / 別 workflow / バックログ）を明示
- [x] 実行順制約を明示（特に 2.2 legacy token 物理失効の先行禁止）
- [x] 0 件ではなく明示 4 件として formalize（task-specification-creator 規約）
