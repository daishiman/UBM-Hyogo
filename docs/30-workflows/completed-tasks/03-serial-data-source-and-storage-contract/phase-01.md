# Phase 1: 要件定義

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | data-source-and-storage-contract |
| Phase 番号 | 1 / 13 |
| Phase 名称 | 要件定義 |
| 作成日 | 2026-04-23 |
| 前 Phase | なし |
| 次 Phase | 2 (設計) |
| 状態 | completed |
| implementation_mode | new |

## 目的

Google Sheets（運用入力源）と Cloudflare D1（canonical store）の責務分担を一意に固定し、sync の三系統（manual / scheduled / backfill）と障害時復旧基準を Phase 2 設計の入力として確定する。Phase 1 で AC-1〜AC-5 の判定材料を揃え、下流 04/05a/05b への blocker を残さない。

## 実行タスク

- AC-1: Sheets / D1 の役割を「Sheets=入力UI、D1=canonical read source」と明文化
- AC-2: manual / scheduled / backfill の trigger・頻度・冪等性要件を列挙
- AC-3: D1 backup / restore / staging 方針の要件抽出（runbook 化は Phase 5）
- AC-4: 障害時の復旧 source-of-truth（Sheets 優先 / D1 優先）の判定基準を確定
- AC-5: 純 Sheets 構成を非採用とする根拠を無料枠制約と整合付け

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | .claude/skills/aiworkflow-requirements/references/architecture-overview-core.md | apps/api 内 D1 binding 配置・apps/web からの直接アクセス禁止（CLAUDE.md 不変条件 5） |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md | wrangler d1 / staging / migration 手順 |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-core.md | rollback 基本方針（前バージョン D1 dump への復帰可否） |
| 必須 | doc/00-getting-started-manual/specs/01-api-schema.md | Form schema 31問 / 6section / consent キー（publicConsent, rulesConsent） |
| 必須 | doc/00-getting-started-manual/specs/08-free-database.md | D1 無料枠（5GB / 5M reads/day / 100K writes/day） |
| 参考 | .claude/skills/aiworkflow-requirements/references/environment-variables.md | GOOGLE_SERVICE_ACCOUNT_JSON の env boundary |

## 実行手順

### ステップ 1: 入力源の現状確認
- Google Form (formId=119ec539...) の回答が Sheets に流入する経路を確認
- 既存 GAS prototype はあくまで UI 叩き台で本番仕様に昇格させない（CLAUDE.md 不変条件 6）

### ステップ 2: 契約の骨子を outputs/phase-01/main.md に記述
- 「Sheets は人間入力 UI、D1 は machine-readable canonical」という役割分離
- Form 再回答が本人更新の正式経路（不変条件 7）であり、admin-managed 列は別系統で扱う（不変条件 4）

### ステップ 3: 4条件評価と次 Phase への handoff
- 4条件を実値で判定し、blocker / open question を outputs/phase-01/main.md 末尾に記録

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 2 | 役割分離・sync 三系統の要件を schema/flow 設計に展開 |
| Phase 7 | AC-1〜AC-5 のトレース元 |
| Phase 10 | gate 判定の根拠 |
| Phase 12 | close-out / spec sync 判断 |

## 多角的チェック観点（AIが判断）

- 価値性: 運用者は Sheets に書くだけで済む / 開発者は D1 だけを読めば済むか
- 実現性: D1 無料枠（writes 100K/day）に sync 頻度が収まるか
- 整合性: apps/web からの D1 直接アクセス禁止（不変条件 5）が崩れないか
- 運用性: 障害時に「どちらに戻せばよいか」が一意に答えられるか

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | source-of-truth 役割分離の定義 | 1 | completed | Sheets=入力 / D1=canonical |
| 2 | sync 三系統の要件抽出 | 1 | completed | manual / scheduled / backfill |
| 3 | 障害復旧基準の確定 | 1 | completed | AC-4 |
| 4 | 純 Sheets 案の非採用根拠 | 1 | completed | AC-5 / 無料枠整合 |
| 5 | 4条件実値判定 | 1 | completed | next phase へ handoff |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-01/main.md | 役割分離 / sync 三系統要件 / 復旧基準 / 非採用根拠 |
| メタ | artifacts.json | Phase 状態と outputs の記録 |

## 完了条件

- [ ] AC-1〜AC-5 が main.md 内で具体的に判定済み
- [ ] 不変条件 4 / 5 / 6 / 7 への抵触がないことを確認済み
- [ ] Phase 2 への handoff（schema 章立て指示）が明記されている

## タスク100%実行確認【必須】

- [x] 全実行タスクが completed
- [ ] 全成果物が指定パスに配置済み
- [ ] 全完了条件にチェック
- [ ] 異常系（Sheets 同時編集 / D1 無料枠超過 / sync drift）の検討済み
- [ ] 次 Phase への引き継ぎ事項を記述
- [x] artifacts.json の該当 phase を completed に更新

## 次 Phase

- 次: 2 (設計)
- 引き継ぎ事項: data-contract.md / sync-flow.md の章立てに役割分離・sync 三系統・復旧基準を反映する
- ブロック条件: AC-1 と AC-4 の判定が揃わない場合は次 Phase に進まない

## 真の論点
- Sheets と D1 のどちらを source-of-truth とするか → **D1 を canonical、Sheets は入力 UI** に固定する
- sync 失敗時の復旧基準 → **Sheets を再投入源とした backfill によって D1 を再構築可能とする**

## 依存関係・責務境界
- 上流: 01b (Cloudflare base) / 01c (Google Workspace) / 02 (monorepo runtime)
- 下流: 04 (CI/CD secrets) / 05a (observability) / 05b (smoke handoff)
- 責務: Sheets owner=運用 / sync worker=apps/api / D1 owner=apps/api / 読み取り=apps/web は API 経由のみ

## 価値とコスト
- 初回価値: 開発者が「どこを読めば最新か」で迷わない
- 初回で払わないコスト: real-time sync / 双方向 sync / 通知基盤

## 改善優先順位
- 1. source-of-truth 一意化
- 2. sync 三系統の責務分離
- 3. 障害復旧基準
- 4. backfill 経路
- 5. audit log の粒度

## 4条件評価
| 条件 | 問い | 判定 |
| --- | --- | --- |
| 価値性 | 運用者・開発者の迷いを消すか | PASS（Sheets=入力 / D1=読取に明確化） |
| 実現性 | D1 無料枠で sync 頻度が成立するか | 条件付PASS（scheduled は 1h 以上、writes 上限を Phase 2 で設計） |
| 整合性 | 不変条件 4/5/6/7 と矛盾しないか | PASS（apps/web 直接アクセス禁止を維持） |
| 運用性 | 復旧 source-of-truth が一意か | PASS（Sheets 再投入 → D1 再構築） |

## スコープ
### 含む
- Sheets -> integration -> D1 flow の契約
- D1 schema 方向（write は sync worker 経由のみ）
- manual / scheduled / backfill sync の責務分離
- audit / rollback / restore 方針

### 含まない
- sync 実装コード（Phase 5 以降）
- 本番データ投入
- Sheets 直接 read で apps/web を成立させる設計（不変条件 5 抵触）

## 受入条件 (AC)
- AC-1: Sheets=入力 UI / D1=canonical の source-of-truth 役割分離が文書化されている
- AC-2: manual（管理者操作）/ scheduled（cron）/ backfill（再構築）の trigger と冪等性要件が分離されている
- AC-3: D1 の backup（dump）/ restore（再投入）/ staging（dev D1）方針の要件が列挙されている
- AC-4: 障害時の復旧基準が「Sheets を真とし D1 を再構築」と明記されている
- AC-5: 純 Sheets 案を非採用とした理由が D1 無料枠（読取 5M/day）と整合している

## 既存資産インベントリ
| 項目 | 確認内容 | 現状 |
| --- | --- | --- |
| 正本仕様 | specs/01-api-schema.md / 08-free-database.md | 既存・参照可 |
| GAS prototype | doc/00-getting-started-manual/gas-prototype | UI 叩き台のみ。本番仕様に昇格させない |
| Google Form schema | formId=119ec539... / 31問 / 6section | 確定済（CLAUDE.md フォーム固定値） |
| 既存 D1 設計 | specs/08-free-database.md | 無料枠制約のみ確定。schema 詳細は未定 |
| 外部サービス | Google Sheets / Cloudflare D1 | 共に無料枠で運用 |

## 正本仕様参照表
| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | .claude/skills/aiworkflow-requirements/references/architecture-overview-core.md | D1 binding 配置 |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md | D1 wrangler 手順 |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-core.md | rollback 方針 |
| 必須 | doc/00-getting-started-manual/specs/01-api-schema.md | Form schema |
| 必須 | doc/00-getting-started-manual/specs/08-free-database.md | D1 無料枠制約 |
| 参考 | .claude/skills/aiworkflow-requirements/references/environment-variables.md | env boundary |
