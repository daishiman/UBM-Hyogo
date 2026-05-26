# [#265] [U-UT01-06] GCP quota 配分 / Service Account 申し送り（UT-03 へ）

## メタ情報

```yaml
issue_number: 265
title: [U-UT01-06] GCP quota 配分 / Service Account 申し送り（UT-03 へ）
state: OPEN
priority: 中
scale: -
category: 要件
status: -
created_date: 2026-04-29
updated_date: 2026-04-29
url: https://github.com/daishiman/UBM-Hyogo/issues/265
dependencies: []
```

| 項目 | 内容 |
|------|------|
| 優先度 | 中 |
| 規模 | - |
| ステータス | - |

---

## 親タスク
- UT-01 (Sheets→D1 同期方式定義) Issue #50（CLOSED）

## 仕様書
- `docs/30-workflows/unassigned-task/U-UT01-06-gcp-quota-allocation-handoff.md`

## 概要
UT-01 採択方式（Workers Cron Triggers による定期 pull）が前提とする Google Sheets API quota（500 req/100s/project）について、同 GCP project を他用途と共有する場合の配分計画と Service Account JSON の責務分離方針を、UT-03 認証方式設定タスク内で確定させるための申し送り仕様書を整備する。UT-03 に内包する前提（独立化条件あり）。

## 苦戦箇所サマリ
1. quota の正確な共有状況が見えにくい（per-project 500/100s と per-user 300/min の律速混同）
2. 「SA を分離するか scope を増やすか」の判断軸が抜けやすい（rotation 単位 / 監査単位 / 最小権限）
3. 別 project 切替の判断が後ろ倒しになりやすい（事前 trigger 条件の明示が必要）
4. 実値（SA JSON / API Token）を本書に転記してしまう事故防止（op 参照 / Secrets キー名のみ）

## 受入条件（AC）
- [ ] AC-1: Sheets API quota 配分表（同期割当 + 余裕率 70% 以下）
- [ ] AC-2: Service Account JSON 共有原則文書化（分離 vs scope 追加の判断基準）
- [ ] AC-3: 別 GCP project 切替判断条件の事前 trigger 化
- [ ] AC-4: UT-03 への申し送り項目雛形（SA メール記載欄 / scope / 共有先 Sheet ID / Cloudflare Secrets キー名）
- [ ] AC-5: 実値（SA JSON / API Token / project ID）の不在を grep で確認

## 関連 U-N
- 上流: UT-01 / `01c-parallel-google-workspace-bootstrap`
- 下流: UT-03（内包先）/ UT-09 / UT-21
- 連携: UT-08（監視・アラート）/ UT-25（Secrets 配置）

## 起票元
UT-01 phase-12 `unassigned-task-detection.md` MINOR-M-Q-01 (U-6)
