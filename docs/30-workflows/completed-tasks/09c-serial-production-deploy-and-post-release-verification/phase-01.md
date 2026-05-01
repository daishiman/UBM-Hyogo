# Phase 1: 要件定義

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 09c-serial-production-deploy-and-post-release-verification |
| Phase 番号 | 1 / 13 |
| Phase 名称 | 要件定義 |
| Wave | 9 |
| Mode | serial（最終） |
| 作成日 | 2026-04-26 |
| 前 Phase | なし |
| 次 Phase | 2 (設計) |
| 状態 | spec_created |

## 目的

09a（staging green）と 09b（release runbook + incident runbook + cron 設計）の引き渡しを受けて、`main` へ merge → Cloudflare production 環境（`ubm-hyogo-web` / `ubm-hyogo-api` / `ubm_hyogo_production`）への deploy → release tag 付与（`vYYYYMMDD-HHMM`）→ post-release 24h 検証までを 1 タスクで束ねる「リリース最終ゲート」の要件を固定する。Wave 9 の serial 最終、24 タスク全体の最終ゲート。

## 実行タスク

1. 上流（09a / 09b）からの引き継ぎ確認（staging green 証跡 / release runbook / incident runbook）
2. production scope と境界の確定（09a / 09b と重複しない）
3. AC リストアップ（AC-1〜AC-12、12 件は production 固有要素を含むため 09a / 09b より多い）
4. release tag 命名規則（`vYYYYMMDD-HHMM`）の確定
5. 4 条件判定（価値性 / 実現性 / 整合性 / 運用性）+ open question 列挙

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/02-application-implementation/_design/phase-2-design.md | Wave 9c scope / AC |
| 必須 | docs/00-getting-started-manual/specs/14-implementation-roadmap.md | Phase 7 受け入れ条件 |
| 必須 | docs/00-getting-started-manual/specs/15-infrastructure-runbook.md | production deploy / D1 / secrets 正本 |
| 必須 | docs/00-getting-started-manual/specs/08-free-database.md | 無料枠 |
| 必須 | docs/30-workflows/02-application-implementation/09a-parallel-staging-deploy-smoke-and-forms-sync-validation/index.md | 上流 staging |
| 必須 | docs/30-workflows/02-application-implementation/09b-parallel-cron-triggers-monitoring-and-release-runbook/index.md | 上流 runbook |

## 実行手順

### ステップ 1: 上流 AC 引き継ぎ確認
- 09a の AC（staging green / forms sync / authz / a11y / 無料枠 staging）達成状況
- 09b の AC（cron schedule / release runbook / incident runbook / rollback 4 種）達成状況
- 上流いずれかが pending なら 09c は NO-GO

### ステップ 2: 真の論点と依存境界
- 真の論点を `outputs/phase-01/main.md` に記述
- 依存境界: 09a (staging) と 09b (runbook) を受け取り、09c は production deploy 本体 + tag + 共有 + 24h 検証のみ

### ステップ 3: AC-1〜AC-12 を仮列挙

### ステップ 4: 4 条件判定 + open question

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 2 | scope を Mermaid + 13 ステップ deploy フローに展開 |
| Phase 4 | verify suite に production 固有（24h メトリクス監視 / tag 付与）を含める |
| Phase 7 | AC matrix の base（12 件） |
| Phase 10 | GO/NO-GO 判定の根拠（**user 承認必須**） |
| 上流 09a | staging URL / sync_jobs id / smoke 結果を引き継ぎ |
| 上流 09b | release runbook / incident runbook / rollback procedures を引き継ぎ |

## 多角的チェック観点（不変条件）

- 不変条件 #4: 本人本文 D1 override しない → production `/profile` で編集 form 不在を確認
- 不変条件 #5: apps/web → D1 直接禁止 → production build artifact で再確認
- 不変条件 #10: Cloudflare 無料枠 → production 24h メトリクスで PASS
- 不変条件 #11: admin は本人本文を直接編集できない → production admin UI で確認
- 不変条件 #15: attendance 重複防止 / 削除済み除外 → production data で重複 0 件 SQL 確認

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 上流 AC 引き継ぎ確認 | 1 | pending | 09a / 09b |
| 2 | scope と依存境界の確定 | 1 | pending | 09a / 09b との境界 |
| 3 | AC リストアップ | 1 | pending | AC-1〜AC-12 |
| 4 | release tag 命名規則 | 1 | pending | `vYYYYMMDD-HHMM` |
| 5 | 4 条件 仮判定 | 1 | pending | Phase 10 で確定 |
| 6 | open question 列挙 | 1 | pending | Phase 3 へ |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-01/main.md | scope / 真の論点 / 4 条件 / open question / AC-1〜12 |
| メタ | artifacts.json | Phase 1 を completed に更新 |

## 完了条件

- [ ] AC 12 件が記述
- [ ] 上流 09a / 09b の AC 引き継ぎ状況が記載
- [ ] 4 条件が仮判定済み
- [ ] open question 3 件未満
- [ ] release tag 命名規則確定

## タスク100%実行確認【必須】

- 全実行タスクが completed
- main.md 配置済み
- artifacts.json の phase 1 を completed に更新

## 次 Phase

- 次: 2 (設計)
- 引き継ぎ事項: scope / AC-1〜12 / 4 条件 / open question / tag 命名規則
- ブロック条件: 上流 09a / 09b いずれかが pending で NO-GO

## 真の論点

- production deploy を「いつ」実行するか（business hours 内 / 外 / メンテナンス枠）
- release tag を `vYYYYMMDD-HHMM` で固定するか、semver にするか（→ MVP では日時ベース、本番安定後に semver 移行検討）
- 24h post-release 検証期間中に新規 deploy を凍結するか（→ 凍結する。incident hotfix 例外のみ）
- incident runbook の Slack / Email 通知先を 09c で実値に切り替えるか（→ NO、placeholder のまま、別 task で配信）
- production secrets の rotation を 09c の中で実施するか（→ NO、別 task）

## 依存境界

- 09c が触る:
  - `main` への merge 承認 + production deploy 実行
  - production D1 migration 適用 + secrets 確認（既存 7 種）
  - production smoke（10 ページ + 認可境界）
  - release tag (`vYYYYMMDD-HHMM`) 付与 + push
  - incident response runbook の関係者共有（09b 成果物）
  - post-release 24h Cloudflare Analytics 確認
- 09c が触らない:
  - staging deploy 本体（09a）
  - cron triggers の追加変更（09b）
  - アプリ機能の差し替え
  - 新規 secret の登録

## 価値とコスト

- 初回価値: production 公開、release tag による monorepo の状態固定、incident runbook の関係者共有による初動短縮
- 初回で払わないコスト: semver 化、Slack bot 自動通知、24h 自動 alert（Cloudflare Analytics 手動確認で十分）

## 4 条件評価

| 条件 | 問い | 判定 |
| --- | --- | --- |
| 価値性 | production deploy + tag + post-release 検証で MVP リリースを完了できるか | PASS |
| 実現性 | 09a / 09b 引き渡し後 1 営業日（deploy 日）+ 24h（post-release）で完了か | PASS |
| 整合性 | 09a / 09b と scope 重複なし、不変条件 #4/#5/#10/#11/#15 を担保 | PASS |
| 運用性 | release tag 付与 + 24h 確認が誰でも実行可能か | TBD（Phase 5 で runbook 完成後 PASS） |

## AC-1〜AC-12 仮列挙

| AC | 概要 |
| --- | --- |
| AC-1 | production D1 migration 最新まで Applied |
| AC-2 | production secrets 必須 7 種が確認済み |
| AC-3 | api / web の production deploy が exit 0 |
| AC-4 | production 10 ページ smoke 200 / 認可境界通り |
| AC-5 | production で `POST /admin/sync/*` success + sync_jobs success 記録 |
| AC-6 | release tag (`vYYYYMMDD-HHMM`) 付与 + push |
| AC-7 | incident response runbook 関係者共有記録あり |
| AC-8 | 24h Cloudflare Analytics req < 5k/day、D1 reads / writes 無料枠 10% 以下 |
| AC-9 | 不変条件 #4（本人本文 override しない）production 確認 |
| AC-10 | 不変条件 #5（web → D1 直接禁止）production artifact 再確認 |
| AC-11 | 不変条件 #10（無料枠）24h メトリクス PASS |
| AC-12 | 不変条件 #11（admin は本文編集不可）production admin UI 確認 |

## open question

- Q1: release tag を local で打って push するか、CI で自動化するか → MVP は local で `git tag` + `git push --tags`、CI 化は後続 task で
- Q2: 24h post-release の SLA 違反時の hotfix path は → incident runbook（09b）の P0 / P1 経路で対応
- Q3: incident runbook 共有先の placeholder（Slack channel / Email）を 09c で確定するか → NO、`<placeholder>` のまま runbook に残し、share-evidence.md に「実値で送信した記録」のみ残す
