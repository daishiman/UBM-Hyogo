# Phase 2: 設計

## メタ情報

- phase: 2 / design
- prev: phase-1-requirements
- next: phase-3-design-review

## 目的

1Password vault 上 Cloudflare deploy token 参照 path を canonical 2 系へ統一し、`.env.example` / runbook / skill reference の op:// 参照を整理する。`apps/web/.dev.vars.example` と `scripts/cf.sh` は deploy token の direct op:// 参照が無いことを baseline 確認に留める。legacy path は deprecation window を経て段階的に廃止する設計を確定する。

## 実行タスク

1. deploy token canonical 2 path と WAF/local-dev path の責務を分離する
2. legacy path から canonical path への migration table を作成する
3. archive-first rollback design と file diff plan を定義する

## 入力

- Phase 1 inventory（6 種 op:// path）
- Phase 1 deprecation window policy
- ut-27 canonical 候補 path

## 出力

- `outputs/phase-2/onepassword-vault-design.md`
- `outputs/phase-2/op-uri-migration-table.md`
- `outputs/phase-2/file-diff-plan.md`
- `outputs/phase-2/rollback-design.md`

## 設計方針

### 1. 1Password vault item 構成設計

| 用途 | vault | item naming | scope | 備考 |
|------|-------|-------------|-------|------|
| Cloudflare API Token (staging deploy) | `UBM-Hyogo` | `Cloudflare` / field `api_token_staging` | Workers Scripts:Edit / D1:Edit (staging) | canonical |
| Cloudflare API Token (production deploy) | `UBM-Hyogo` | `Cloudflare` / field `api_token_production` | Workers Scripts:Edit / D1:Edit (production) | canonical |
| local-dev read-only (D1 read / Account.Read) | `UBM-Hyogo` | 未確定（別 workflow で設計） | Read-only scope | 本タスクでは deploy token canonical 2 path と混同しないことだけを記録 |
| WAF 運用 (runbook) | `UBM-Hyogo` | `Cloudflare-WAF` / field `api_token_waf` | WAF 専用 scope | deploy token ではないため grep gate の allowlist ではなく別分類で記録 |

> item 値・URI・token 値・suffix は本設計書に焼き込まない。命名と scope 方針のみ記載。

### 2. op:// path migration table（旧→新）

| 旧 op:// path | 新 op:// path | 影響ファイル |
|---------------|---------------|--------------|
| `op://Cloudflare/API Token/credential` | `op://UBM-Hyogo/Cloudflare-WAF/api_token_waf` | `docs/runbooks/cloudflare-waf-operations.md`（WAF 専用。deploy token canonical 2 path とは別分類） |
| `op://Employee/ubm-hyogo-env/CLOUDFLARE_API_TOKEN` | historical reference として inventory のみ。現行 deploy path へ機械置換しない | 03-serial historical doc |
| `op://UBM-Hyogo/cf-waf-token/credential` | WAF historical reference として inventory のみ。現行 runbook は `Cloudflare-WAF/api_token_waf` へ集約 | ut-15 phase-09 |
| `op://Vault/Cloudflare/api_token` | deploy token legacy template として禁止対象。現行 operational surface では canonical 2 path へ置換 | ut-15 phase-03 template |
| `op://UBM-Hyogo/cloudflare-api/CLOUDFLARE_API_TOKEN` | local-dev historical reference として inventory のみ。現行 `apps/web/.dev.vars.example` には追加しない | ut-06 health |
| `op://UBM-Hyogo/Cloudflare/api_token_staging` / `api_token_production` | 変更なし（canonical） | ut-27 |

### 3. ファイル差分計画（file-diff-plan）

#### 3.1 `.env.example`

```diff
- CLOUDFLARE_API_TOKEN=op://Vault/Cloudflare/api_token
+ # staging / production で path を切替えること
+ CLOUDFLARE_API_TOKEN=op://UBM-Hyogo/Cloudflare/api_token_staging
+ # production 切替時:
+ # CLOUDFLARE_API_TOKEN=op://UBM-Hyogo/Cloudflare/api_token_production
```

#### 3.2 `apps/web/.dev.vars.example`

現行ファイルには `CLOUDFLARE_API_TOKEN` が存在しないため編集しない。Phase 5 では `rg -n 'CLOUDFLARE_API_TOKEN|op://.*[Cc]loudflare' apps/web/.dev.vars.example` が 0 件であることを baseline evidence として残す。

#### 3.3 `scripts/cf.sh`

- 既存 `op run --env-file=.env` ラップは変更しない（env 名のみ参照、op:// path は `.env` 側で解決）
- ただし `cf.sh` 内に直接 op:// path 文字列が含まれている場合は canonical 系へ置換（grep で確認）

#### 3.4 `docs/runbooks/cloudflare-waf-operations.md`

```diff
- op://Cloudflare/API Token/credential
+ WAF 専用: op://UBM-Hyogo/Cloudflare-WAF/api_token_waf
```

#### 3.5 `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md`

inventory 表に追記:
- deploy token canonical op:// path 2 系統（staging / production）
- WAF 専用 path は deploy token とは別分類で記録
- legacy op:// path の deprecation 状態（archive / delete schedule）

### 4. deprecation window 設計

| 期間 | legacy item 状態 | rollback 可否 |
|------|------------------|---------------|
| T+0〜T+14 日 | active（archive 化のみ・参照可能） | 即時 rollback 可 |
| T+14〜T+30 日 | archive（手動 unarchive で復活可） | manual rollback 可 |
| T+30 日以降 | delete 候補（user 明示承認後 delete） | 再作成必要 |

T=Phase 13 PR マージ日。delete は別 Issue で user-gated に実行する。

### 5. rollback 設計

| シナリオ | rollback 手順 |
|---------|---------------|
| canonical item の token が deploy で fail | legacy item を 1Password で unarchive → `.env` の op 参照を旧 path へ revert PR |
| ローカル開発 shell で token 取得失敗 | `.env` の `CLOUDFLARE_API_TOKEN` op:// path を確認し、必要なら staging canonical path に一時切替 |
| WAF 運用で token 認証 fail | `op://UBM-Hyogo/Cloudflare-WAF/api_token_waf` の scope を dashboard で再確認、不可なら legacy item に戻す |

## 影響範囲

- `.env.example`
- `apps/web/.dev.vars.example`（baseline 確認のみ）
- `scripts/cf.sh`（op:// 直書きがある場合のみ）
- `docs/runbooks/cloudflare-waf-operations.md`
- `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md`
- ut-15 / ut-06 / 03-serial 系 historical doc は inventory のみ更新（リネームは行わない）
- 1Password vault `UBM-Hyogo`（手動 mutation・Phase 11）

## NO-GO 条件

- 前提 Issue #762 / #763 / #718 のいずれかが re-open している
- canonical item が deploy 経路（既存 GitHub Secrets 系列）と conflict する命名になっている
- deprecation window 中の rollback 手順が文書化されていない

## 参照資料

- `phase-1-requirements.md`
- `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md`
- `.claude/skills/task-specification-creator/references/non-visual-irreversible-task-rules.md`

## 統合テスト連携

- application integration test は対象外。Phase 4/6 の grep gate と Phase 11 の `cf.sh whoami` smoke へ接続する
- 1Password mutation は user approval 後の manual evidence として扱う

## 成果物

- `outputs/phase-2/onepassword-vault-design.md`
- `outputs/phase-2/op-uri-migration-table.md`
- `outputs/phase-2/file-diff-plan.md`
- `outputs/phase-2/rollback-design.md`

## 完了条件

- [ ] deploy token canonical 2 系統の vault item naming / scope が確定
- [ ] 旧→新 op:// migration table が全 6 種カバー
- [ ] 影響ファイル diff が全件提示
- [ ] deprecation window と rollback 手順が文書化

## タスク100%実行確認【必須】

- [ ] 成果物 4 ファイル作成
- [ ] Phase 1 inventory との突合 OK

## 次Phase

phase-3-design-review.md
