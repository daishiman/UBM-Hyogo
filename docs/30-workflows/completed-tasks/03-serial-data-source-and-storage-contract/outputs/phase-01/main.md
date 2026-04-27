# Phase 1 成果物: 要件定義 main

## 目的

Google Sheets（運用入力源）と Cloudflare D1（canonical store）の責務を一意に固定し、sync 三系統（manual / scheduled / backfill）と障害復旧基準を Phase 2 設計へ受け渡す。AC-1〜AC-5 の判定材料を確定する。

---

## 1. source-of-truth 役割分離（AC-1）

| 役割 | 対象 | 説明 |
| --- | --- | --- |
| 入力 UI | Google Sheets（Form 連携シート） | 運用者が回答補正・admin メモを入力する人間向け UI。Form 31 問 / 6 セクションの回答が自動流入する |
| canonical read source | Cloudflare D1 | apps/api からのみ書き込みする正本。apps/web からは API 経由でのみ読み取り（CLAUDE.md 不変条件 5） |
| 再構築源 | Google Sheets | D1 喪失時、Sheets を真として backfill により D1 を再構築（AC-4） |

- 運用者は Sheets のみを書く
- 開発者・アプリケーションは D1 のみを読む
- Sheets → D1 は一方向 sync。逆方向（D1 → Sheets）は禁止
- Form 再回答が本人更新の正式経路（不変条件 7）

---

## 2. sync 三系統の trigger・頻度・冪等性要件（AC-2）

| 系統 | trigger | 頻度 | 冪等キー | 冪等性要件 |
| --- | --- | --- | --- | --- |
| manual | 管理者 UI から API（apps/api）経由で sync worker 起動 | 任意（運用者操作） | `responseId` | 同 responseId は upsert で重複登録しない |
| scheduled | Cloudflare Workers cron triggers | 1 時間（初回値、writes 100K/day から逆算）※ | `responseId` | last_synced_at 以降の差分のみ反映、再実行で副作用なし |
| backfill | 管理者操作 + runbook | 障害時/移行時のみ | `responseId` | truncate-and-reload。Sheets を真として全件再投入 |

※ scheduled 1h の根拠: D1 writes 上限 100K/day。1h 周期 = 24 回/day。50 名 MVP では 1 回あたりの差分は十分小さく、writes 上限の 1% 未満で収まる。

---

## 3. D1 backup / restore / staging 要件（AC-3）

| 種別 | 要件 | 実装は |
| --- | --- | --- |
| backup（dump） | `wrangler d1 export` を CI/管理者から実行可能であること。日次 dump を artifact として保存できる構成 | Phase 5 で runbook 化 |
| restore（再投入） | Sheets を真として backfill で D1 を再構築可能。あるいは dump からの import | Phase 5 で runbook 化 |
| staging（dev D1） | Cloudflare D1 の staging database を利用し、本番に影響なく schema 変更検証 | Phase 5 で runbook 化 |

> 本 Phase では「要件抽出」までを担当。runbook 詳細は Phase 5。

---

## 4. 障害時復旧 source-of-truth（AC-4）

- **Sheets を真とする**。D1 が破損・喪失した場合は backfill により再構築する
- D1 のみで発生した編集（admin-managed columns 等）は、Sheets を真とする復旧では復元不能なため、`sync_audit` ログと dump の併用で別途リカバリする
- これにより「どちらに戻せばよいか」が一意に答えられる

---

## 5. 純 Sheets 構成を非採用とする根拠（AC-5）

| 観点 | 純 Sheets 案の問題 | D1 canonical の優位性 |
| --- | --- | --- |
| 読取性能 | Sheets API は rate limit が低く、apps/web の都度参照に耐えない | D1 reads 5M/day（specs/08）で MVP 50 名規模は十分 |
| クエリ | join / index / where が貧弱 | SQL ベースで responseId / member_id 連携が自然 |
| 整合性 | admin-managed data（`member_status` 等）を持つ余地がない | admin_* テーブル/列に分離可能（不変条件 4） |
| 認証連携 | `responseEmail` を system field として扱う設計と噛み合わない（不変条件 3） | `member_identities.response_email` で stable に解決可 |
| 不変条件 5 | apps/web から Sheets 直接 read は禁止に抵触 | apps/api 経由で完結 |

→ 純 Sheets 案は AC-5 で却下。D1 canonical を維持する。

---

## 6. 不変条件チェック（CLAUDE.md 1〜7）

| # | 不変条件 | 本 Phase での扱い |
| --- | --- | --- |
| 1 | 実フォーム schema をコードに固定しすぎない | mapping table は Phase 2 で `stableKey` ベース・拡張可とする方針を引継ぐ |
| 2 | consent キーは `publicConsent` / `rulesConsent` に統一 | Sheets 列名が揺れても D1 側で固定キーに正規化 |
| 3 | `responseEmail` は system field 扱い | Form 項目としては定義せず、Sheets の auto-collected 列を D1 `response_email` に直接 mapping |
| 4 | admin-managed data は schema 外で分離 | `member_status` / `meeting_sessions` 等は sync 対象外、apps/api admin endpoint が writer |
| 5 | D1 直接アクセスは apps/api に閉じる | sync worker は `apps/api/src/sync/`、apps/web からの Sheets/D1 直接 read は禁止 |
| 6 | GAS prototype を本番仕様に昇格させない | sync worker は新規実装、GAS の保存方式は持ち込まない |
| 7 | Form 再回答が本人更新の正式経路 | upsert キーは `responseId`、`member_identities.current_response_id` で最新切替 |

抵触なし。

---

## 7. 4 条件評価（実値）

| 条件 | 問い | 判定 | 根拠 |
| --- | --- | --- | --- |
| 価値性 | 運用者・開発者の迷いを消すか | PASS | Sheets=入力 / D1=読取に明確化 |
| 実現性 | D1 無料枠（writes 100K/day, reads 5M/day）で sync 頻度が成立するか | PASS | scheduled 1h × 24 回/day、50 名規模で writes 上限の 1% 未満 |
| 整合性 | 不変条件 1〜7 と矛盾しないか | PASS | 上表の通り全項目抵触なし |
| 運用性 | 復旧 source-of-truth が一意か | PASS | Sheets 再投入 → D1 再構築の単線復旧 |

---

## 8. 異常系の検討

| 異常 | 対応方針 |
| --- | --- |
| Sheets 同時編集 | sync は read-only。最後の Sheets 状態が次回 sync で D1 に反映される |
| D1 writes 100K/day 超過 | scheduled 頻度を下げる / 差分判定強化（last_synced_at, schemaHash） |
| sync drift（Sheets と D1 の乖離） | sync_audit に diff サマリを記録、閾値超過で manual backfill を発火 |
| Sheets API rate limit | 指数バックオフ + 失敗時は次回 scheduled で再試行 |

---

## 9. 受入条件 (AC) 判定

- AC-1 PASS（§1）
- AC-2 PASS（§2）
- AC-3 PASS（§3、要件抽出完了。runbook は Phase 5）
- AC-4 PASS（§4）
- AC-5 PASS（§5）

---

## 10. Phase 2 への handoff

- `data-contract.md` 章立て: Sheets schema / D1 schema / mapping table / sync direction (Sheets → D1 only) / admin-managed columns 分離
- `sync-flow.md` 章立て: manual / scheduled (1h) / backfill (truncate-and-reload, 冪等キー=responseId) / failure recovery (Sheets 再投入) / audit log
- ライブラリ選定方針: Sheets client は Workers 互換 fetch ベース、D1 driver は wrangler binding 直接利用
- responseEmail は Form 項目としてではなく system field として mapping 表に明記
- consent キーは `publicConsent` / `rulesConsent` のみ

## 11. Open question / blocker

- blocker: なし
- open: scheduled 頻度 1h は初回値。Phase 5 smoke 後に観測値で調整余地あり（MINOR 候補）
