# Phase 5: preflight 実行 + user 承認 1 回目

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | task-09c-production-deploy-execution-001 |
| Phase 番号 | 5 / 13 |
| Phase 名称 | preflight 実行 + user 承認 1 回目（production mutation 開始 gate） |
| Wave | 9 |
| Mode | serial（最終 / production mutation の execution 半身） |
| 作成日 | 2026-05-02 |
| 前 Phase | 4 (verify suite 設計) |
| 次 Phase | 6 (production D1 migration 適用) |
| 状態 | spec_created |
| taskType | implementation |
| visualEvidence | VISUAL |
| user_approval | **REQUIRED（本 Phase は user 明示承認 1 回目の gate）** |

## 目的

production mutation を一切実行する前に、preflight（main 同期 evidence / Cloudflare account identity / D1 migration dry-run 等価 / 必須 7 種 secrets 存在確認）を完了し、その結果を **user に提示して明示承認を取得**する。

承認が取れない場合は Phase 6 以降へ進まず、本 Phase で停止する（NO-GO はタスクを spec_created のまま保留 / 中断する）。

## 実行タスク

1. main 昇格 evidence の保存（`origin/main` の最新 merge commit / `git rev-parse origin/main` の SHA）
2. Cloudflare account identity evidence の取得（`bash scripts/cf.sh whoami`）
3. production D1 migration list（dry-run 等価）evidence
4. 必須 7 種 secrets 存在確認 evidence（API 4 種 + Pages 3 種）
5. **user 明示承認の取得とログ保存**
6. 承認後にのみ Phase 6 を起動できるよう gate を明記

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/09c-production-deploy-execution-001/index.md | AC-1 / AC-2 / AC-3 / AC-5 |
| 必須 | docs/30-workflows/09c-production-deploy-execution-001/phase-04.md | PF-* suite |
| 必須 | docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/phase-05.md | 親 runbook Step 1〜6 |
| 必須 | docs/00-getting-started-manual/specs/15-infrastructure-runbook.md | secrets / D1 |
| 必須 | scripts/cf.sh | Cloudflare CLI wrapper |
| 必須 | CLAUDE.md（Cloudflare 系 CLI 実行ルール） | `wrangler` 直実行禁止 |

## 実行手順

### ステップ 1: main 昇格 evidence

```bash
# 作業ブランチを clean 状態にしてから実行
git status --short
# expected: 空（未コミット変更なし）

git fetch origin main
git rev-parse origin/main
# 取得した SHA を outputs/phase-05/preflight-evidence.md に記録

git log origin/main -1 --pretty=format:'%H %s%n%an %ad' --date=iso
# 取得した最新 merge commit を outputs/phase-05/preflight-evidence.md に記録
```

- evidence 保存先: `outputs/phase-05/preflight-evidence.md` の "main 昇格 evidence" セクション
- 対応 AC: AC-2

### ステップ 2: Cloudflare account identity 確認

```bash
bash scripts/cf.sh whoami
# expected: production 操作対象の account email / account id が表示
```

- evidence 保存先: `outputs/phase-05/preflight-evidence.md` の "Cloudflare identity" セクション
- 注意: account email / id の **mask 不要部分のみ転記**。API token 値は**転記禁止**（CLAUDE.md `禁止事項`）
- 対応 AC: AC-3

### ステップ 3: production D1 migration list（dry-run 等価）

```bash
bash scripts/cf.sh d1 migrations list ubm_hyogo_production \
  --remote \
  --env production \
  --config apps/api/wrangler.toml
# expected: 全 migration が Applied、もしくは未 Applied の差分が明示される
```

- evidence 保存先: `outputs/phase-05/preflight-evidence.md` の "D1 migrations list" セクション
- 注意: ここでは **list のみ**。apply は Phase 6 で承認後に実行
- 対応 AC: AC-4 の事前確認

### ステップ 4: 必須 secrets / variables 存在確認

```bash
# API Workers / Auth + Forms
bash scripts/cf.sh secret list --env production --config apps/api/wrangler.toml
# expected secrets: GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY, GOOGLE_FORM_ID, MAIL_PROVIDER_KEY

# API/Web variables are checked from Cloudflare variables or deployment config
# expected variables: AUTH_URL, MAIL_FROM_ADDRESS

# Web OAuth
bash scripts/cf.sh pages secret list --project-name ubm-hyogo-web
# expected secrets: AUTH_SECRET, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
# legacy aliases allowed only during migration: AUTH_GOOGLE_ID, AUTH_GOOGLE_SECRET
```

- evidence 保存先: `outputs/phase-05/preflight-evidence.md` の "secrets" セクション
- `RESEND_API_KEY` / `RESEND_FROM_EMAIL` / `SITE_URL` は stale 名であり、新規 provisioning の確認対象にしない
- 注意: secret **値**は出力されない（list のみ）。**値を貼り付けない**
- 対応 AC: AC-5

### ステップ 5: user 明示承認の取得（**gate**）

preflight 4 件の evidence をまとめ、以下テンプレで user に提示する:

```
[approval-gate-2/3] production mutation 開始の承認をお願いします。

- main commit: <SHA / subject>
- Cloudflare account: <email / account id>
- D1 migrations: <Applied 件数 / 未適用件数>
- secrets / variables: Forms + Mail + Auth + OAuth 確認済み

GO  → Phase 6 (D1 migration apply) を起動します
NO-GO → 理由を教えてください。本 Phase で停止します
```

- user 応答（GO / NO-GO + 理由）を `outputs/phase-05/user-approval-log.md` に **タイムスタンプ + 提示内容 + 応答**を完全転記
- 対応 AC: AC-1（1 回目）

### ステップ 6: gate 明示

- **GO** が記録された場合のみ Phase 6 へ進む
- **NO-GO** または応答なしの場合、Phase 6 以降は起動しない。本タスクは Phase 5 で保留状態に固定

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 6 | PF-3（D1 list 結果）を migration apply の前提として参照 |
| Phase 7 | PF-4 / PF-5（secrets）を deploy 前提として参照 |
| Phase 10 | user-approval-log.md を GO/NO-GO 判定資料に転記 |
| Phase 13 | preflight-evidence.md / user-approval-log.md を PR 本文に添付 |

## 多角的チェック観点（不変条件）

- #4: 本 Phase では production への書き込みを行わない（list / whoami のみ）ため不変条件 #4 は影響しない
- #5: web bundle 検査は Phase 11 で実施。本 Phase は preflight のみ
- #10: secrets / migrations 確認だけで Workers req / D1 reads は微小（無料枠影響なし）
- #11: 本 Phase で admin UI 操作は行わない
- #15: 本 Phase で attendance テーブル操作は行わない

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | main 昇格 evidence | 5 | pending | `git rev-parse origin/main` |
| 2 | Cloudflare identity evidence | 5 | pending | `bash scripts/cf.sh whoami` |
| 3 | D1 migration list evidence | 5 | pending | dry-run 等価 |
| 4 | secrets 7 種存在確認 | 5 | pending | API 4 + Pages 3 |
| 5 | user 明示承認 1 回目 | 5 | pending | gate / GO のみ次 Phase 起動 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-05/preflight-evidence.md | main / identity / migrations / secrets evidence |
| ドキュメント | outputs/phase-05/user-approval-log.md | user 承認 1 回目（GO / NO-GO + 提示内容 + 応答 + 時刻） |
| メタ | artifacts.json | Phase 5 を completed に更新（GO 取得後のみ） |

## 完了条件

- [ ] preflight-evidence.md に main commit / Cloudflare identity / D1 list / secrets 4 セクションすべて記載
- [ ] user-approval-log.md に GO / NO-GO のいずれかが記録（時刻 / 提示内容 / 応答完備）
- [ ] GO の場合のみ Phase 6 を起動可能とする gate を明記
- [ ] secret 値 / API token 値が evidence ファイルに転記されていない（masking / list 出力のみ）
- [ ] 全 Cloudflare コマンドが `bash scripts/cf.sh` 経由（AC-13）

## タスク100%実行確認【必須】

- 全実行タスクが completed
- preflight-evidence.md / user-approval-log.md 配置済み
- user の GO / NO-GO が明示記録されている（暗黙承認は不可）
- artifacts.json の phase 5 を completed に更新

## 次 Phase

- 次: 6 (production D1 migration 適用) ※GO の場合のみ
- 引き継ぎ事項: PF-3 D1 list 結果 / 必須 secrets 確認結果 / GO log
- ブロック条件: user の GO 未取得 / preflight evidence 4 件のいずれか欠落

## リスクと対策

| リスク | 影響 | 対策 |
| --- | --- | --- |
| user 不在のまま Phase 6 起動 | 不正な production mutation | gate ステップ 6 で **GO 文字列の存在を必須**にし、未取得時は Phase 6 を起動しない |
| `bash scripts/cf.sh whoami` が想定外 account を返す | 別 account へ誤 deploy | NO-GO で停止、`.env` の op 参照と 1Password を確認してから再実行 |
| secret 値が evidence に貼り付く事故 | AI 学習混入 / 漏洩 | list 出力のみ転記、`secret get` 等の値取得コマンドは禁止 |
| `wrangler` 直実行混入 | AC-13 違反 | コマンドはすべて `bash scripts/cf.sh` 経由でのみ実行 |
| migration list が API 障害で失敗 | preflight 不能 | NO-GO で停止、Cloudflare Status を確認後に再実行 |
| **rollback 経路（本 Phase 用）** | preflight 自体は mutation 無し | 本 Phase で rollback は不要。NO-GO 時はそのまま停止すれば良い |
