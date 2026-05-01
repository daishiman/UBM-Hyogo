# UT-06-FU-A-ROUTE-INVENTORY-SCRIPT-001: production Worker route inventory script

> 発生元: `docs/30-workflows/completed-tasks/ut-06-fu-a-prod-route-secret-001-worker-migration-verification/outputs/phase-12/unassigned-task-detection.md`

## メタ情報

| 項目 | 内容 |
| --- | --- |
| タスクID | UT-06-FU-A-ROUTE-INVENTORY-SCRIPT-001 |
| 分類 | follow-up / infrastructure-automation |
| 対象 | `apps/web` Cloudflare Workers production route / custom domain inventory |
| 優先度 | High |
| ステータス | open |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| 親タスク | UT-06-FU-A-PROD-ROUTE-SECRET-001 |
| 作成日 | 2026-04-30 |

## 苦戦箇所【記入必須】

- 対象: `docs/30-workflows/completed-tasks/ut-06-fu-a-prod-route-secret-001-worker-migration-verification/outputs/phase-11/route-snapshot.md`
- 症状: route / custom domain の対象 Worker 確認が dashboard 手順に寄っており、`ubm-hyogo-web-production` と旧 Worker の split-brain を機械的に検出できない。
- 参照: `docs/30-workflows/completed-tasks/ut-06-fu-a-prod-route-secret-001-worker-migration-verification/outputs/phase-05/runbook.md`

## 目的

production deploy 承認前に、Cloudflare route / custom domain が `ubm-hyogo-web-production` を指しているかを読み取り専用で一覧化する script を追加する。

## スコープ

### 含む

- Cloudflare API または `bash scripts/cf.sh` 経由で route / custom domain inventory を取得する script の設計と実装
- 旧 Worker 名と `ubm-hyogo-web-production` の対象差分を JSON / Markdown で出力
- secret 値を出力しない安全な evidence 形式
- CI または手元で実行できる dry-run / read-only 検証

### 含まない

- DNS record の変更
- route / custom domain の付け替え
- production deploy 実行
- 旧 Worker の削除

## リスクと対策

| リスク | 対策 |
| --- | --- |
| Cloudflare API token に書き込み権限を要求してしまう | read-only scope で取得可能な API を Phase 2 で確認し、mutation endpoint は使用禁止にする |
| route の domain 名を markdown に過剰露出する | production public domain として既知の範囲に限定し、必要なら host を部分 mask する |
| dashboard 表示と API 表示の粒度が異なる | script output に source (`api` / `dashboard-fallback`) を持たせる |
| `wrangler` 直接実行が混入する | すべて `bash scripts/cf.sh` または repository script 経由に統一する |

## 検証方法

### 単体検証

```bash
pnpm lint
pnpm typecheck
```

期待: 追加 script と型定義がエラーなく通る。

### 統合検証

```bash
bash scripts/cf.sh whoami
# route inventory script command は実装時に確定する
```

期待: 認証済み account で読み取り専用 inventory が生成され、`ubm-hyogo-web-production` / 旧 Worker の route 差分が値ではなく key / target 名で確認できる。

## 完了条件

- route / custom domain inventory の出力形式が docs に記録されている
- production mutation を実行しないことが code review と command design で確認されている
- UT-06-FU-A-PROD-ROUTE-SECRET-001 の runbook から script への導線が追加されている
