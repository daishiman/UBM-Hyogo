# Phase 11: 手動 smoke

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | meeting-tag-queue-and-schema-diff-repository |
| Phase 番号 | 11 / 13 |
| Phase 名称 | 手動 smoke |
| Wave | 2 |
| 実行種別 | parallel |
| 作成日 | 2026-04-26 |
| 上流 | Phase 10 (最終レビュー) |
| 下流 | Phase 12 (ドキュメント更新) |
| 状態 | pending |

## 目的

queue / schema / attendance 系 repository の手動 smoke を **wrangler d1 execute / vitest UI / 並列 INSERT 実機** で実施し、自動 test では拾えない「実環境での状態遷移と PK 制約の挙動」を確認する。証跡を残す。

## smoke シナリオ

### S-1: 7 テーブル接続確認
```bash
pnpm --filter apps/api wrangler d1 execute ubm-hyogo-staging --command "SELECT name FROM sqlite_master WHERE type='table' AND name IN ('meeting_sessions','member_attendance','tag_definitions','tag_queue','form_manifests','form_fields','schema_diff_queue');"
```
- 期待: 7 行返却
- 証跡: `outputs/phase-11/evidence/s-1-tables.txt`

### S-2: tag_definitions 6 カテゴリ seed 確認
```bash
pnpm --filter apps/api wrangler d1 execute ubm-hyogo-staging --command "SELECT category, COUNT(*) FROM tag_definitions WHERE active=1 GROUP BY category;"
```
- 期待: 6 カテゴリすべてで非空（AC-6 前提、01a seed の reality check）
- 証跡: `outputs/phase-11/evidence/s-2-tag-categories.txt`

### S-3: attendance PK 制約 manual
```bash
# 同 PK の重複 INSERT を実機で叩く
pnpm --filter apps/api wrangler d1 execute ubm-hyogo-staging --command "INSERT INTO member_attendance (member_id, session_id, assigned_by, assigned_at) VALUES ('m_001','ses_001','admin@example.com','2026-04-26T00:00:00Z');"
pnpm --filter apps/api wrangler d1 execute ubm-hyogo-staging --command "INSERT INTO member_attendance (member_id, session_id, assigned_by, assigned_at) VALUES ('m_001','ses_001','admin@example.com','2026-04-26T00:00:00Z');"
```
- 期待: 1 件目成功、2 件目 `UNIQUE constraint failed` エラー
- 証跡: `outputs/phase-11/evidence/s-3-attendance-pk.txt`

### S-4: tag_queue 状態遷移 vitest UI
```bash
pnpm --filter apps/api test:ui repository -- tagQueue
```
- 確認:
  - `enqueue("q_001","m_001","categoryX","tagA")` → `status="queued"`
  - `transitionStatus("q_001","reviewing")` → 成功
  - `transitionStatus("q_001","queued")` → throw `IllegalStateTransition`
  - `transitionStatus("q_001","resolved")` → 成功
  - `transitionStatus("q_001","reviewing")` → throw（resolved → reviewing 禁止）
- 証跡: `outputs/phase-11/evidence/s-4-tag-queue-ui.png`

### S-5: schemaDiffQueue list ASC 確認
```bash
pnpm --filter apps/api wrangler d1 execute ubm-hyogo-staging --command "SELECT id, type, detected_at FROM schema_diff_queue WHERE status='open' ORDER BY detected_at ASC LIMIT 10;"
```
- 期待: detected_at ASC で並ぶ（古い順）、AC-5
- 証跡: `outputs/phase-11/evidence/s-5-diff-list.txt`

### S-6: listAttendableMembers JOIN 削除済み除外
```bash
# 削除済み member を 1 件作って、JOIN で出てこないことを確認
pnpm --filter apps/api test:ui repository -- attendance.attendable
```
- 確認:
  - `member_status.status='active'` の member は items に含まれる
  - `member_status.status='deleted'` の member は items に含まれない
  - N+1 にならない（query 1 回）
- 証跡: `outputs/phase-11/evidence/s-6-attendable.txt`

### S-7: dependency-cruiser 違反 zero
```bash
pnpm depcruise --config .dependency-cruiser.cjs apps/api
```
- 期待: `0 dependency violations`、特に 02a / 02c との相互 import が 0
- 証跡: `outputs/phase-11/evidence/s-7-depcruise.txt`

## 証跡保存ルール

- 全 evidence は `outputs/phase-11/evidence/` に保存
- スクリーンショットは PNG、テキスト出力は TXT
- ファイル名は `s-N-<内容>.{ext}` 形式
- 機密情報（admin email 本物 / token）はマスクして保存

## 実行タスク

1. S-1〜S-7 を順次実行
2. 各 evidence をファイル保存
3. `outputs/phase-11/manual-evidence.md` に summary 表
4. `outputs/phase-11/main.md` に総括 + 不合格 case の対応

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | Phase 10 outputs/phase-10/main.md | GO 判定 |
| 必須 | Phase 5 runbook.md | 実装手順 |
| 必須 | doc/00-getting-started-manual/specs/03-data-fetching.md | 状態遷移 |
| 必須 | doc/00-getting-started-manual/specs/08-free-database.md | D1 操作 |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 12 | smoke evidence を documentation に添付 |
| 09a (staging) | smoke の reality check |

## 多角的チェック観点

| 観点 | 不変条件 # | 確認内容 |
| --- | --- | --- |
| attendance PK | #15 | S-3 が UNIQUE 制約で重複阻止 |
| 削除済み除外 | #15 | S-6 が JOIN で除外 |
| tag 直接編集 | #13 | S-4 で状態遷移のみが変更経路 |
| schema 集約 | #14 | S-5 で schemaDiffQueue が単一 source |
| boundary | #5 | S-7 が dep-cruiser 0 violation |
| 無料枠 | #10 | S-5 / S-6 で query 数最小 |

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | S-1 7 テーブル | 11 | pending | tables.txt |
| 2 | S-2 tag seed | 11 | pending | tag-categories.txt |
| 3 | S-3 attendance PK | 11 | pending | attendance-pk.txt |
| 4 | S-4 tagQueue UI | 11 | pending | screenshot |
| 5 | S-5 diff ASC | 11 | pending | diff-list.txt |
| 6 | S-6 attendable | 11 | pending | attendable.txt |
| 7 | S-7 depcruise | 11 | pending | depcruise.txt |
| 8 | summary 作成 | 11 | pending | manual-evidence.md |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-11/main.md | smoke 総括 |
| ドキュメント | outputs/phase-11/manual-evidence.md | 7 シナリオ summary |
| evidence | outputs/phase-11/evidence/* | 7 files |

## 完了条件

- [ ] S-1〜S-7 全て期待通り
- [ ] evidence が指定パスに保存
- [ ] 不合格 case があれば修正 plan が main.md に記載

## タスク100%実行確認【必須】

- [ ] サブタスク 1〜8 が completed
- [ ] outputs/phase-11/* が配置済み
- [ ] artifacts.json の Phase 11 を completed に更新

## 次 Phase

- 次: Phase 12 (ドキュメント更新)
- 引き継ぎ事項: smoke evidence
- ブロック条件: いずれかが期待通りでなければ Phase 5 / 8 / 9 に戻る
