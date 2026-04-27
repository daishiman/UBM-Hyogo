# Phase 3 成果物: 設計レビュー結果

## 0. レビュー対象

- `outputs/phase-02/main.md`
- `outputs/phase-02/data-contract.md`
- `outputs/phase-02/sync-flow.md`

レビューは 4 条件 / CLAUDE.md 不変条件 7 項目 / AC-1〜AC-5 / downstream（04 / 05a / 05b）引き継ぎ観点で実施。

---

## 1. 4 条件レビュー（実値判定）

| 観点 | レビュー問い | 判定 | 根拠 |
| --- | --- | --- | --- |
| 価値性 | 開発者・運用者の迷いを消すか | PASS | data-contract.md §0 / sync-flow.md §0 / main.md §2 で役割分離が明記。state ownership table（main.md §5）が責務を一意化 |
| 実現性 | D1 無料枠（writes 100K/day, reads 5M/day）で scheduled 1h sync が成立するか | PASS | main.md §7、sync-flow.md §2「頻度根拠」で 24 回/day × 50 名規模 → 上限の数 % と試算済 |
| 整合性 | apps/web からの D1 直接アクセス禁止が貫徹しているか | PASS | sync worker は `apps/api/src/sync/`（main.md §4 図示）、apps/web 経路は破線で明示 |
| 運用性 | Sheets 再投入による backfill が runbook 化可能か | PASS | sync-flow.md §3 truncate-and-reload 手順、§4 failure recovery 表が runbook 骨子として機能 |

---

## 2. 不変条件チェック（CLAUDE.md 7 項目）

| # | 不変条件 | 確認観点 | 判定 | 根拠 |
| --- | --- | --- | --- | --- |
| 1 | schema を固定しすぎない | mapping table が拡張余地を持つか | PASS | data-contract.md §6、`extra_fields_json` / `unmapped_question_ids_json` / `form_field_aliases` で吸収 |
| 2 | consent キー統一 | publicConsent / rulesConsent のみ使用 | PASS | data-contract.md §3.2 / §3.3、sync-flow.md §6 で揺れを拒否 |
| 3 | responseEmail は system field | mapping で system field 扱いか | PASS | data-contract.md §3.1 system fields 章で明示、Form 質問とは分離 |
| 4 | admin-managed data 分離 | admin_* テーブル/列を分離 | PASS | data-contract.md §5、sync は consent 列のみ反映、admin 列は触らない |
| 5 | D1 直接アクセスは apps/api のみ | apps/web 経路が無いか | PASS | main.md §4 mermaid で apps/web → D1/Sheets を破線（禁止）として図示 |
| 6 | GAS prototype を昇格させない | sync worker は新規実装か | PASS | main.md §3、sync-flow.md §7 で持ち込まない旨を明記 |
| 7 | Form 再回答が本人更新の正式経路 | upsert キーが responseId か | PASS | data-contract.md §2.1 / §3.1、sync-flow.md §1 step3、main.md §2.8 |

抵触なし（全 7 項目 PASS）。

---

## 3. AC-1〜AC-5 トレース

| AC | Phase 2 成果物の対応箇所 | 判定 |
| --- | --- | --- |
| AC-1: Sheets/D1 役割分離 | data-contract.md §0 / §4「sync direction = Sheets → D1 のみ」、main.md §2.1 | PASS |
| AC-2: manual / scheduled / backfill 分離 | sync-flow.md §1 / §2 / §3、main.md §2.3 | PASS |
| AC-3: backup / restore / staging 要件 | data-contract.md §2.4 sync_audit / §5 admin 分離、sync-flow.md §3 backfill / §4 recovery（runbook 化は Phase 5 前提） | PASS |
| AC-4: 復旧基準 = Sheets 真 | sync-flow.md §4「Sheets を真として再 backfill」、Phase 1 main.md §4 | PASS |
| AC-5: 純 Sheets 案非採用根拠 | Phase 1 main.md §5（無料枠 reads/クエリ性能/不変条件 5 と整合） | PASS |

全 AC トレース完了。

---

## 4. downstream 引き継ぎ確認

| 下流タスク | 引き継ぎ項目 | 確認 |
| --- | --- | --- |
| 04-cicd-secrets | `GOOGLE_SERVICE_ACCOUNT_JSON` (Cloudflare Secrets) / `CLOUDFLARE_API_TOKEN` (GitHub Secrets) の配置先 | OK（main.md §6 環境変数一覧に明記） |
| 05a-observability | `sync_audit` テーブルを metrics 取得対象として参照 | OK（data-contract.md §2.4 / sync-flow.md §5 に列定義） |
| 05b-smoke-handoff | backfill 手順が runbook 前提として参照可能 | OK（sync-flow.md §3 が骨子、Phase 5 で runbook 化） |

downstream 引き継ぎ可（blocker なし）。

---

## 5. より単純な代替案の再評価

- 代替案 A: Sheets を正本 DB → AC-5 で却下（Phase 1 §5）
- 代替案 B: D1 のみで Sheets 廃止 → 運用者の入力 UI 喪失で却下
- 代替案 C: 双方向 sync → 復旧経路が一意化できず却下（AC-4 と矛盾）

→ 採用設計（D1 canonical / Sheets 入力 / 一方向 sync）が最適。

---

## 6. 異常系の検討カバレッジ

| 異常 | 対応箇所 | カバー |
| --- | --- | --- |
| Sheets API rate limit | sync-flow.md §6 | OK |
| D1 writes 上限接近 | sync-flow.md §6、main.md §8 | OK |
| sync 競合（manual × scheduled） | sync-flow.md §6（mutex） | OK |
| schema drift（Form 改訂） | data-contract.md §6、sync-flow.md §6 | OK |
| Sheets 同時編集 | sync-flow.md §4 | OK |
| D1 喪失 | sync-flow.md §4 | OK |
| admin-managed data 喪失 | sync-flow.md §4（dump 併用） | OK |

---

## 7. gate 判定

| 判定基準 | 結果 |
| --- | --- |
| 4 条件すべて PASS | YES |
| 不変条件 7 項目すべて抵触なし | YES |
| AC-1〜AC-5 すべてトレース済み | YES |
| downstream 04 / 05a / 05b 引き継ぎ可 | YES |
| MAJOR 残課題 | なし |

→ **gate 判定: PASS**

---

## 8. レビュー結果記録

| 項目 | 値 |
| --- | --- |
| reviewer | 設計・要件定義エージェント（Claude Opus 4.7） |
| 日付 | 2026-04-26 |
| 判定 | **PASS** |
| 4 条件サマリ | 価値性 / 実現性 / 整合性 / 運用性 全 PASS |
| 不変条件抵触有無 | なし（1〜7 全 PASS） |
| 残課題（MINOR） | M-01: scheduled 頻度 1h は初回値、Phase 5 smoke 後に観測値で調整余地 |
| 次 Phase 進行可否 | 可（Phase 4 事前検証手順へ） |

---

## 9. MINOR 追跡表

| ID | 内容 | 対応 Phase |
| --- | --- | --- |
| M-01 | scheduled 頻度 1h は初回値。実観測後にチューニング余地あり（writes/diff 件数の実測） | 8（DRY 化）または 12（ドキュメント更新） |

---

## 10. 次 Phase への引き継ぎ

- gate=PASS につき Phase 4（事前検証手順）へ進行可
- MAJOR 差し戻しなし
- MINOR M-01 のみ Phase 8 / 12 で吸収予定
- Phase 4 では `outputs/phase-04/{main.md, test-plan.md, verification-commands.md}` の作成が必要
