# Phase 11: 手動 smoke

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 09a-parallel-staging-deploy-smoke-and-forms-sync-validation |
| Phase 番号 | 11 / 13 |
| Phase 名称 | 手動 smoke |
| Wave | 9 |
| Mode | parallel |
| 作成日 | 2026-04-26 |
| 前 Phase | 10 (最終レビュー) |
| 次 Phase | 12 (ドキュメント更新) |
| 状態 | pending |

## 目的

Phase 10 で GO 判定された staging 環境に対して、人が screenshot / curl / wrangler 出力を取りながら手動 smoke を実行し、staging-smoke-runbook.md と evidence を `outputs/phase-11/` に保存する。Playwright の自動結果と人の確認結果が一致することを確認する。

## 実行タスク

1. `outputs/phase-11/staging-smoke-runbook.md` を作成（10 ページ × 認可境界 + sync 確認）
2. screenshot evidence を `outputs/phase-11/playwright-staging/` に保存
3. sync_jobs SELECT 結果を `outputs/phase-11/sync-jobs-staging.json` に保存
4. wrangler tail 出力を `outputs/phase-11/wrangler-tail.log` に保存
5. manual evidence checklist で全項目チェック

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | doc/02-application-implementation/09a-parallel-staging-deploy-smoke-and-forms-sync-validation/phase-05.md | runbook |
| 必須 | doc/00-getting-started-manual/specs/09-ui-ux.md | UI 検証マトリクス |
| 必須 | doc/02-application-implementation/08b-parallel-playwright-e2e-and-ui-acceptance-smoke/ | Playwright 結果 |
| 参考 | docs/05b-parallel-smoke-readiness-and-handoff/phase-11.md | manual smoke 構成 |

## 実行手順

### ステップ 1: staging-smoke-runbook 作成
- 10 ページ + 認可境界 + sync 確認の手順を書く

### ステップ 2: screenshot 保存
- desktop / mobile profile で Playwright HTML report を `playwright-staging/` に保存

### ステップ 3: sync_jobs dump
- `wrangler d1 execute` の JSON 出力を保存

### ステップ 4: wrangler tail
- 30 分間 `wrangler tail --env staging` を回し log を保存

### ステップ 5: manual evidence checklist
- 全項目 ✓ で完了

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 12 | manual evidence を documentation-changelog で参照 |
| 並列 09b | release runbook に staging smoke を「過去実績」として参照 |
| 下流 09c | 09c の Phase 11 で同じ手順を production に適用 |

## 多角的チェック観点（不変条件）

- 不変条件 #5: smoke 中に Network tab で D1 直叩きが出ていないか
- 不変条件 #10: smoke 後に Cloudflare Analytics で req 数を確認
- 不変条件 #11: admin 詳細画面に編集 form がないことを目視確認 + screenshot

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | smoke runbook 作成 | 11 | pending | 10 ページ × 認可境界 |
| 2 | screenshot 保存 | 11 | pending | desktop / mobile |
| 3 | sync_jobs dump | 11 | pending | JSON |
| 4 | wrangler tail log | 11 | pending | 30 分 |
| 5 | manual evidence checklist | 11 | pending | 全項目 ✓ |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-11/main.md | smoke サマリ |
| ランブック | outputs/phase-11/staging-smoke-runbook.md | 手動 smoke 手順 |
| 証跡 | outputs/phase-11/playwright-staging/ | screenshot / video / trace |
| 証跡 | outputs/phase-11/sync-jobs-staging.json | sync_jobs SELECT 結果 |
| 証跡 | outputs/phase-11/wrangler-tail.log | 30 分間の log |
| メタ | artifacts.json | Phase 11 を completed に更新 |

## 完了条件

- [ ] staging-smoke-runbook.md が 10 ページ + 認可境界 + sync をカバー
- [ ] screenshot 10 ページ × 2 profile = 20 枚以上保存
- [ ] sync_jobs.json に直近 5 件
- [ ] wrangler-tail.log に 30 分以上の log

## タスク100%実行確認【必須】

- 全実行タスクが completed
- evidence 4 種すべて `outputs/phase-11/` に配置
- artifacts.json の phase 11 を completed に更新

## 次 Phase

- 次: 12 (ドキュメント更新)
- 引き継ぎ事項: staging-smoke-runbook.md と evidence
- ブロック条件: evidence のいずれかが欠けている場合は次 Phase に進まない

## staging-smoke-runbook（手動）

### Section 1: 公開導線（4 ページ）

| URL | チェック | 期待 |
| --- | --- | --- |
| `/` | landing 表示 | landing copy + nav 表示 |
| `/members` | 一覧 + filter | publicConsent=consented のみ表示、isDeleted ゼロ |
| `/members/:id` | 公開詳細 | FieldVisibility=public のみ |
| `/register` | Form 導線 | responderUrl への外部リンク |

### Section 2: 認証 / 会員（2 ページ + 認可）

| URL / 操作 | チェック | 期待 |
| --- | --- | --- |
| `/login` | AuthGateState 5 状態 | input / sent / unregistered / rules_declined / deleted を screenshot |
| `/profile` (logged-in) | 自分の profile + editResponseUrl | 編集 form なし、ボタンクリックで Forms へ |
| `/profile` (未ログイン) | リダイレクト | `/login` |

### Section 3: 管理（5 ページ + 認可）

| URL / 操作 | チェック | 期待 |
| --- | --- | --- |
| `/admin` (admin user) | dashboard | KPI / sync status |
| `/admin` (一般 user) | 認可 | 403 / login redirect |
| `/admin/members` (admin) | drawer + status | 編集 form 不在を目視 |
| `/admin/tags` | queue | candidate → confirm 操作 |
| `/admin/schema` | diff + alias | alias 割当画面 |
| `/admin/meetings` | session | 重複登録不可 |

### Section 4: sync 確認

| 操作 | チェック | 期待 |
| --- | --- | --- |
| `POST /admin/sync/schema` | 200 + sync_jobs.success | schema_versions 更新 |
| `POST /admin/sync/responses` | 200 + sync_jobs.success | member_responses 更新 |
| `wrangler tail` (30 min) | log | error / warn が ハンドリング済み |

## manual evidence checklist

- [ ] 10 ページ × 2 profile screenshot 配置済み
- [ ] sync_jobs.json に直近 5 件保存
- [ ] wrangler-tail.log に 30 分以上
- [ ] AuthGateState 5 状態の screenshot
- [ ] admin UI に編集 form がないことを目視 + screenshot 注釈
- [ ] Cloudflare Analytics のスクショで req 30k 以下
- [ ] Network tab で D1 直叩きがないことを目視
- [ ] 認可 leak が起きないことを 3 ケース（未ログイン / 一般 / admin）で確認
