# Phase 8: DRY 化

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 09c-serial-production-deploy-and-post-release-verification |
| Phase 番号 | 8 / 13 |
| Phase 名称 | DRY 化 |
| Wave | 9 |
| Mode | serial（最終） |
| 作成日 | 2026-04-26 |
| 前 Phase | 7 (AC マトリクス) |
| 次 Phase | 9 (品質保証) |
| 状態 | pending |

## 目的

09a（staging）と 09b（runbook）と 09c（production）の 3 タスクで重複している用語 / URL 命名 / runbook step / sanity check を、09c 側で「production 文脈に閉じる差分のみ」を残し、共通部品は 09a / 09b の Phase 8 で確立した env var / snippet を再利用する。production 固有の placeholder（`PRODUCTION_API` / `PRODUCTION_WEB` / `PRODUCTION_D1` / release tag フォーマット）を Before / After 表に整理し、用語ゆれ 0 件を達成する。

## 実行タスク

1. Before / After 表で「09c 固有 vs 09a / 09b 共通」を分離
2. URL / env var 命名を 09a / 09b と完全統一（`PRODUCTION_*` プレフィックス）
3. release tag フォーマット (`vYYYYMMDD-HHMM`) と命名規則の統一
4. 共通 sanity check（`check-deploy-status` / `check-sync-jobs` / `check-free-tier` / `check-d1-import-in-web`）の参照を集約
5. 用語 audit（"プロダクション" / "production" / "prod" / "本番" の混在排除）

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | doc/02-application-implementation/09a-parallel-staging-deploy-smoke-and-forms-sync-validation/phase-08.md | URL 命名 / 共通 snippet |
| 必須 | doc/02-application-implementation/09b-parallel-cron-triggers-monitoring-and-release-runbook/phase-08.md | placeholder 表記 / dashboard URL |
| 必須 | doc/02-application-implementation/09c-serial-production-deploy-and-post-release-verification/phase-05.md | runbook 13 ステップ |
| 必須 | doc/02-application-implementation/09c-serial-production-deploy-and-post-release-verification/phase-06.md | rollback 5 種 |

## 実行手順

### ステップ 1: Before / After 表
- 用語 / URL / endpoint / runbook step / placeholder の 5 軸で記述
- 09a / 09b の Phase 8 表を引用して共通箇所を特定

### ステップ 2: URL / env var 命名統一
- 09a / 09b と同一の env var 名を使用（`PRODUCTION_API` / `PRODUCTION_WEB` / `PRODUCTION_D1` / `ANALYTICS_URL_API_PRODUCTION` / `ANALYTICS_URL_D1_PRODUCTION`）

### ステップ 3: release tag 命名規則
- `vYYYYMMDD-HHMM` 形式に統一（例: `v20260426-1530`）
- semver / commit hash / 自動生成版との混在禁止

### ステップ 4: 共通 sanity check 参照集約
- `outputs/phase-08/main.md` に 09a / 09b で定義済みの snippet 名と利用箇所のみ記録（複製禁止）

### ステップ 5: 用語 audit
- `rg -niw "プロダクション|本番系|prod系" doc/02-application-implementation/09c-*/` で 0 hit

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 9 | DRY 化結果を品質チェックリストに反映 |
| Phase 11 | 統一された env var を smoke runbook で使用 |
| 上流 09a | URL 命名を共有 |
| 上流 09b | dashboard URL / placeholder 表記を共有 |

## 多角的チェック観点（不変条件）

- 不変条件 #5: 共通 sanity check に「`apps/web` に D1 import 不在」を含める
- 不変条件 #6: GAS apps script 由来の用語（`onFormSubmit` / `Apps Script trigger`）が runbook に混入していないか rg で確認
- 不変条件 #10: 共通 sanity check に「Cloudflare Analytics URL」を含める

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | Before / After 表 | 8 | pending | 用語 / URL / endpoint |
| 2 | URL 命名統一 | 8 | pending | 09a / 09b と同名 env var |
| 3 | release tag 命名規則 | 8 | pending | `vYYYYMMDD-HHMM` |
| 4 | 共通 snippet 参照集約 | 8 | pending | 複製禁止 |
| 5 | 用語 audit | 8 | pending | rg 0 hit |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-08/main.md | DRY 化結果 + 共通 snippet 参照 + 用語 audit |
| メタ | artifacts.json | Phase 8 を completed に更新 |

## 完了条件

- [ ] Before / After 表が完成（5 軸）
- [ ] URL / env var が 09a / 09b と完全一致
- [ ] release tag フォーマットが `vYYYYMMDD-HHMM` で固定
- [ ] 共通 snippet を 09a / 09b から参照（複製 0）
- [ ] 用語ゆれ 0 件

## タスク100%実行確認【必須】

- 全実行タスクが completed
- 用語ゆれ 0 件（`rg` で確認）
- 共通 snippet 複製 0 件
- artifacts.json の phase 8 を completed に更新

## 次 Phase

- 次: 9 (品質保証)
- 引き継ぎ事項: 統一された URL / env var / release tag フォーマット
- ブロック条件: 用語ゆれ 1 件以上、または共通 snippet が複製されていれば次 Phase に進まない

## Before / After 表

| 種別 | Before | After |
| --- | --- | --- |
| 用語（環境） | "プロダクション" / "production" / "prod" / "本番" | `production` に統一 |
| 用語（操作） | "リリース" / "release" / "デプロイ" / "deploy" | `production deploy` / `release tag` を別概念として明示 |
| URL | `https://ubm-hyogo-api.<account>.workers.dev` を runbook 各所で再記述 | `${PRODUCTION_API}` env var に統一 |
| URL | 同上 web | `${PRODUCTION_WEB}` に統一 |
| URL | 同上 D1 | `${PRODUCTION_D1}` に統一 |
| URL | dashboard URL | `${ANALYTICS_URL_API_PRODUCTION}` / `${ANALYTICS_URL_D1_PRODUCTION}` に統一 |
| endpoint | `POST /admin/sync/schema` を curl 例ごとに full URL | `${PRODUCTION_API}/admin/sync/schema` |
| release tag | "release tag" / "version tag" / "リリース番号" | `release tag` (`vYYYYMMDD-HHMM`) に統一 |
| placeholder | "（後で埋める）" / "TBD" / "TODO" | `<placeholder>` で統一 |
| sanity check | 各 step に "確認" を直書き | 09a / 09b 定義の `check-*` snippet を参照 |

## URL / env var 命名規則（09a / 09b と統一）

| env var | 用途 |
| --- | --- |
| `PRODUCTION_API` | `https://ubm-hyogo-api.<account>.workers.dev` |
| `PRODUCTION_WEB` | `https://ubm-hyogo-web.pages.dev` |
| `PRODUCTION_D1` | `ubm_hyogo_production` |
| `ANALYTICS_URL_API_PRODUCTION` | `https://dash.cloudflare.com/<account>/workers/services/view/ubm-hyogo-api/production/analytics` |
| `ANALYTICS_URL_D1_PRODUCTION` | `https://dash.cloudflare.com/<account>/d1/databases/ubm_hyogo_production/metrics` |
| `PAGES_PRODUCTION` | `ubm-hyogo-web` |
| `RELEASE_TAG` | `v$(date +%Y%m%d-%H%M)` 形式（例: `v20260426-1530`） |

## 共通 sanity check（09a / 09b で定義済み、09c は参照のみ）

| snippet | 定義元 | 09c での参照箇所 |
| --- | --- | --- |
| `check-deploy-status` | 09a phase-08 | runbook Step 7 / Step 8 |
| `check-sync-jobs` | 09a phase-08 | runbook Step 10 |
| `check-free-tier` | 09a phase-08 | runbook Step 13 |
| `check-d1-import-in-web` | 09a phase-08 | runbook Step 13 |
| `check-rollback` | 09b phase-08 | rollback procedure A / B |
| `check-cron` | 09b phase-08 | rollback procedure D（cron 一時停止確認） |

## release tag フォーマット規則

```text
パターン: v[YYYY][MM][DD]-[HH][MM]
例: v20260426-1530
正規表現: ^v[0-9]{8}-[0-9]{4}$
```

| 規則 | 内容 |
| --- | --- |
| 文字種 | `v` + 数字のみ |
| 区切り | `-` を 1 箇所のみ |
| 桁数固定 | 12 桁の数字 |
| 上書き禁止 | 同名 tag は再発行不可、incident 時は別 HHMM で打ち直し |
| 命名一貫性 | `git tag` / GitHub Releases / share-evidence で同じ tag 名 |

## 用語ゆれ audit 結果

```bash
rg -niw "プロダクション|本番系|prod系|release番号|リリース番号" \
   doc/02-application-implementation/09c-serial-production-deploy-and-post-release-verification/
# expected: 0 hit
```

```bash
rg -niw "onFormSubmit|Apps Script trigger" \
   doc/02-application-implementation/09c-serial-production-deploy-and-post-release-verification/
# expected: 0 hit（不変条件 #6: GAS prototype を本番に流さない）
```

## 09c 固有の差分（共通化しないもの）

| 項目 | 理由 |
| --- | --- |
| `wrangler d1 export` の backup ファイル名 prefix `backup-production-` | staging と prefix を分けて取り違え防止 |
| Step 11（release tag 付与）の `release-tag-script` | production 限定の immutable 規則 |
| Step 12（incident runbook 共有）の share-evidence.md | production deploy 後のみ生成 |
| Step 13（24h post-release verify） | production 固有の monitoring window |
