# Phase 9: 品質保証

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | d1-database-schema-migrations-and-tag-seed |
| Wave | 1 |
| 実行種別 | parallel |
| Phase 番号 | 9 / 13 |
| 作成日 | 2026-04-26 |
| 上流 Phase | 8 (DRY 化) |
| 下流 Phase | 10 (最終レビュー) |
| 状態 | pending |

## 目的

無料枠見積もり（5GB / 500k reads / 100k writes）を quantitative に評価し、secret hygiene と a11y を確認する（DB タスクなので a11y は N/A）。

## 実行タスク

1. 50 人 × 月 4 回 × 12 ヶ月の使用量試算
2. STORAGE / READS / WRITES それぞれの上限到達日試算
3. secret hygiene チェック（database_id は non-secret、secret 0 件）
4. outputs/phase-09/free-tier-estimate.md 生成

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | doc/00-getting-started-manual/specs/08-free-database.md | 無料枠 |
| 必須 | CLAUDE.md | 不変条件 #10 |

## 実行手順

### ステップ 1: 試算
- members 50 人
- attendance 月 4 回 × 12 ヶ月 = 48 row/member → 2,400 row total
- responses 平均 1.5 回/member → 75 row total
- response_fields 31 項目 × 75 = 2,325 row
- meeting_sessions 48 row
- tag_definitions 41 row
- member_tags 平均 5 tag/member = 250 row
- magic_tokens 月 30 件 × 12 = 360 row
- sync_jobs 日次 cron × 365 = 365 row

合計約 6,000 行 ≈ 数 MB（5GB の 0.1% 未満）

### ステップ 2: READS/WRITES
- READS: 公開一覧 1 req = 1 SELECT × 50 = 50 reads、月 1,000 ユーザー × 30 page → 30,000 reads/月 ≈ 1,000 reads/day（500k/day の 0.2%）
- WRITES: 月数十件レベル

### ステップ 3: secret hygiene
- このタスク導入 secret 0 件
- database_id は non-secret（wrangler.toml 直書き OK）

### ステップ 4: outputs

## 統合テスト連携

| Phase | 内容 |
| --- | --- |
| 10 | GO 根拠 |
| 11 | manual smoke で wrangler info 確認 |

## 多角的チェック観点（不変条件参照）

- **#10**: 5GB / 500k / 100k 全枠で余裕あり
- **#5**: secret 配置確認（0 件）

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 |
| --- | --- | --- | --- |
| 1 | STORAGE 試算 | 9 | pending |
| 2 | READS / WRITES 試算 | 9 | pending |
| 3 | secret hygiene | 9 | pending |
| 4 | outputs | 9 | pending |

## 成果物

| 種別 | パス |
| --- | --- |
| ドキュメント | outputs/phase-09/main.md |
| ドキュメント | outputs/phase-09/free-tier-estimate.md |
| メタ | artifacts.json |

## 完了条件

- [ ] 試算表完成
- [ ] 全枠で余裕 > 90%

## タスク 100% 実行確認【必須】

- [ ] 全 4 サブタスク completed
- [ ] outputs 配置済み
- [ ] artifacts.json 更新

## 次 Phase

- 次: Phase 10
- 引き継ぎ事項: 試算 → GO 判定
- ブロック条件: 試算で枠超過

## 無料枠見積もり

### STORAGE 試算

| テーブル | 行数 | 1 行平均 byte | 合計 |
| --- | --- | --- | --- |
| member_responses | 75 | ~3 KB（answers_json 含む） | ~225 KB |
| response_fields | 2,325 | ~200 B | ~465 KB |
| response_sections | 75 × 6 = 450 | ~150 B | ~67 KB |
| member_identities | 50 | ~250 B | ~12 KB |
| member_status | 50 | ~200 B | ~10 KB |
| meeting_sessions | 48 | ~200 B | ~10 KB |
| member_attendance | 2,400 | ~100 B | ~240 KB |
| tag_definitions | 41 | ~200 B | ~8 KB |
| member_tags | 250 | ~100 B | ~25 KB |
| tag_assignment_queue | 75 | ~300 B | ~22 KB |
| schema_versions | 5 | ~200 B | ~1 KB |
| schema_questions | 31 × 5 = 155 | ~500 B | ~77 KB |
| schema_diff_queue | 50 | ~300 B | ~15 KB |
| admin_users | 5 | ~150 B | ~1 KB |
| admin_member_notes | 100 | ~500 B | ~50 KB |
| deleted_members | 5 | ~200 B | ~1 KB |
| magic_tokens | 360 | ~250 B | ~90 KB |
| sync_jobs | 365 | ~500 B | ~182 KB |
| member_field_visibility | 50 × 31 = 1,550 | ~100 B | ~155 KB |

**合計 ≈ 1.6 MB / 5,000 MB 上限の 0.03%**

### READS / WRITES 試算

| 操作 | 頻度 | reads/req | 月間 reads |
| --- | --- | --- | --- |
| 公開一覧 | 月 30,000 PV | 1 | 30,000 |
| 公開詳細 | 月 10,000 PV | 1 | 10,000 |
| 会員ログイン | 月 1,500 | 2 | 3,000 |
| マイページ | 月 5,000 PV | 2 | 10,000 |
| 管理画面 | 月 500 PV | 5 | 2,500 |
| sync (cron 日 1 回) | 30 / 月 | 100 | 3,000 |

**合計 ≈ 60,000 reads/月 ≈ 2,000 reads/day（500k の 0.4%）**

| 操作 | 頻度 | writes/req | 月間 writes |
| --- | --- | --- | --- |
| 新規回答 sync | 月 5 件 | 5 | 25 |
| attendance 登録 | 月 200 | 1 | 200 |
| admin notes | 月 100 | 1 | 100 |
| status 変更 | 月 50 | 1 | 50 |
| sync_jobs 記録 | 月 30 | 1 | 30 |

**合計 ≈ 400 writes/月 ≈ 15 writes/day（100k の 0.015%）**

## 上限到達日試算

- STORAGE: 現状の 3,000 倍まで余裕（数十年規模）
- READS: 現状の 250 倍まで余裕
- WRITES: 現状の 6,000 倍まで余裕

**判定: 全枠で十分余裕あり、無料運用継続可**

## Secret Hygiene

| 項目 | 結果 |
| --- | --- |
| Cloudflare Secrets 導入 | 0 件 |
| GitHub Secrets 導入 | 0 件 |
| `database_id` の扱い | non-secret、wrangler.toml 直書き |
| `.env` 生成 | NO |

## a11y

DB タスクのため N/A（後続 06a/b/c で扱う）。
