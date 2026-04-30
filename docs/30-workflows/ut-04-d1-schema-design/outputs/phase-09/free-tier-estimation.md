# Phase 9 補足: D1 無料枠詳細試算 (free-tier-estimation)

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク | UT-04 D1 データスキーマ設計 |
| Phase | 9 / 13（品質保証） |
| 作成日 | 2026-04-29 |
| 状態 | spec_created |
| 参照 | https://developers.cloudflare.com/d1/platform/limits/ |

## 1. D1 無料枠（Workers Free plan）

| 軸 | 制限値 | 単位 |
| --- | --- | --- |
| storage | 5 GB | per database |
| reads | 25,000,000 | rows / month |
| writes | 50,000 | rows / month |
| databases | 10 | per account |

## 2. 試算前提

- 運用想定期間: 2 年（保守的）/ 5 年（中期）/ 10 年（長期参考）
- 会員新規回答数: 1,000 / 年
- Sheets→D1 sync 頻度: 4 回 / 日（UT-09 既定）
- 公開ディレクトリ閲覧 / マイページ / admin 想定: 約 100,000 reads / 月
- audit_logs（UT-21 所有）retention: 暫定 365 日（Phase 12 で確定）

## 3. storage × 環境 × 期間

### 3.1 production 環境

| テーブル | 行サイズ | 2 年想定行数 | 2 年 storage | 5 年 | 10 年 |
| --- | --- | --- | --- | --- | --- |
| `member_responses` | 2 KB | 2,000 | 4 MB | 10 MB | 20 MB |
| `member_identities` | 200 B | 2,000 | 0.4 MB | 1 MB | 2 MB |
| `member_status` | 100 B | 2,000 | 0.2 MB | 0.5 MB | 1 MB |
| `response_fields` | 150 B | 60,000 | 9 MB | 22.5 MB | 45 MB |
| `sync_jobs` | 300 B | 4,380（3 年保持） | 1.3 MB | 1.3 MB | 1.3 MB |
| `schema_diff_queue` | 400 B | < 100 | < 0.1 MB | < 0.1 MB | < 0.1 MB |
| `audit_logs`（参考） | 500 B | 20,000 | 10 MB | 25 MB | 50 MB |
| index 合計（30〜50%） | - | - | 7〜12 MB | 18〜30 MB | 36〜60 MB |
| **合計** | - | - | **約 32〜36 MB** | **約 78〜90 MB** | **約 155〜180 MB** |
| 無料枠 | 5 GB | - | - | - | - |
| 余裕度 | - | - | 0.7% | 1.8% | 3.6% |

### 3.2 dev 環境

| テーブル | 行数（fixture） | storage |
| --- | --- | --- |
| `member_responses` | 100 | 0.2 MB |
| `member_identities` | 100 | 0.02 MB |
| `member_status` | 100 | 0.01 MB |
| `response_fields` | 3,000 | 0.5 MB |
| `sync_jobs` | 数十 | < 0.1 MB |
| `schema_diff_queue` | 0〜数件 | < 0.01 MB |
| index 合計 | - | 0.2 MB |
| **合計** | - | **約 1 MB** |
| 余裕度 | 5 GB | 0.02% |

> dev は短期 fixture のみで storage 圧力は無視可能。

## 4. reads × 環境

### 4.1 production

| 経路 | 想定 reads / 月 | 備考 |
| --- | --- | --- |
| 公開ディレクトリ（公開メンバー一覧） | 50,000 | 1 ページあたり 50 行 × 1,000 view |
| マイページ（自身の回答） | 30,000 | 月間 30,000 アクセス想定 |
| admin dashboard | 15,000 | 1 日 500 read × 30 |
| Sheets→D1 sync 中の参照（差分判定） | 5,000 | UT-09 整合 |
| **合計** | **100,000** | |
| 無料枠 | 25,000,000 | |
| 余裕度 | 0.4% | |

### 4.2 dev

| 経路 | 想定 reads / 月 |
| --- | --- |
| 開発時テスト・smoke | 10,000 |
| 余裕度 | 0.04% |

## 5. writes × 環境

### 5.1 production

| 経路 | 想定 writes / 月 | 備考 |
| --- | --- | --- |
| Sheets→D1 sync upsert | 12,000 | 4 sync/day × 100 upsert × 30 |
| audit_logs writes（UT-21） | 10,000 | admin 操作監査 |
| その他 admin 書き込み | 1,000 | member_status 更新等 |
| schema_diff_queue 書き込み | < 100 | 差分発生時のみ |
| **合計** | **23,100** | |
| 無料枠 | 50,000 | |
| 余裕度 | 46% | |

### 5.2 dev

| 経路 | 想定 writes / 月 |
| --- | --- |
| sync test / fixture seed | 5,000 |
| 余裕度 | 90% |

## 6. 余裕度マトリクス（最終確認）

| 軸 | production 2 年 | production 5 年 | production 10 年 | dev | 判定 |
| --- | --- | --- | --- | --- | --- |
| storage | 0.7% | 1.8% | 3.6% | 0.02% | PASS（10 年でも 5% 未満） |
| reads | 0.4% | 0.4% | 0.4% | 0.04% | PASS |
| writes | 46% | 46% | 46% | 10% | PASS（半分未満維持） |

> writes 軸が最も逼迫。UT-09 sync 頻度を 4→8 回 / 日に増やすと 92% に到達するため、Phase 12 で監視項目化（UT-08 連携）。

## 7. 増加リスク要因と監視項目

| # | リスク | 影響軸 | 監視 / 対策 |
| --- | --- | --- | --- |
| 1 | UT-09 sync 頻度の増加 | writes | UT-08 monitoring で sync 回数を観測、闇雲な増加を抑制 |
| 2 | audit_logs retention 延長 | storage / writes | Phase 12 unassigned-task で 90/365/永久を確定 |
| 3 | response_fields の動的増加（質問数増） | storage | Sheets schema フリーズ運用、ADR で承認制 |
| 4 | 公開ディレクトリのアクセス急増 | reads | キャッシュ層（Workers KV / Cache API）で吸収予定（後続タスク） |

## 8. 結論

- 無料枠制約は **本 schema 設計で発生しない**（10 年運用想定でも全軸 5% 未満、writes のみ 46% 維持）
- writes が最逼迫軸 → UT-09 / UT-21 の頻度・retention 確定で再試算
- schema 単体で MAJOR リスクなし、Phase 10 GO 判定の定量根拠として確定
