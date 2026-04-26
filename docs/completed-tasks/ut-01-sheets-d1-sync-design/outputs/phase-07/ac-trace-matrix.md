# Phase 7 — AC トレースマトリクス

## AC-1〜AC-7 対応設計文書マトリクス

| AC | 受入条件内容 | 対応設計文書パス | 結果 |
|----|------------|----------------|------|
| AC-1 | 同期方式（push/pull/webhook/cron）の比較評価表と採択理由が明文化されている | `outputs/phase-02/design.md` §同期方式比較表<br>`outputs/phase-05/sync-method-comparison.md` | PASS |
| AC-2 | 手動同期・定期スケジュール・バックフィルの3種フロー図が存在する | `outputs/phase-02/sync-flow.md` フロー1〜3<br>`outputs/phase-05/sequence-diagrams.md` | PASS |
| AC-3 | エラーハンドリング方針（リトライ回数・冪等性確保・部分失敗時の継続戦略）が記載されている | `outputs/phase-02/design.md` §エラーハンドリング<br>`outputs/phase-05/retry-policy.md` | PASS |
| AC-4 | 既存 `sync_audit` 監査契約の運用上の用途・記録項目が定義されている | `outputs/phase-02/design.md` §sync_auditテーブル<br>`outputs/phase-05/sync-audit-contract.md` | PASS |
| AC-5 | source-of-truth の優先順位（通常運用はD1 canonical、復旧/backfill入力はSheets）が明文化されている | `outputs/phase-02/design.md` §Source-of-Truth定義 | PASS |
| AC-6 | Sheets API quota 制限（500 req/100s）への対処方針（バッチサイズ・Exponential Backoff）が記載されている | `outputs/phase-02/design.md` §Quota対処方針<br>`outputs/phase-05/retry-policy.md` §バッチ設定パラメータ | PASS |
| AC-7 | UT-09 が本仕様書を参照して実装着手できる状態になっている | `outputs/phase-12/implementation-guide.md`（Phase 12で最終確認） | PASS（見込み） |

---

## トレース詳細

### AC-1: 同期方式比較

- `phase-02/design.md` に4方式の比較表（無料枠/実装コスト/冪等性/信頼性）
- `phase-05/sync-method-comparison.md` に5軸詳細比較（実現性/quota/冪等性/運用コスト/採択）
- Cron Triggers 採択根拠が4点で明記されている

### AC-2: 3種フロー図

- `phase-02/sync-flow.md`: Mermaid sequenceDiagram で3フロー（定期/手動/バックフィル）
- `phase-05/sequence-diagrams.md`: 正常系 + 異常系3種（部分失敗/quota超過/D1失敗）

### AC-3: エラーハンドリング

- `phase-05/retry-policy.md`: エラー種別ごとリトライ戦略表、Backoffパラメータ（1s/2s/4s/8s/16s、最大5回）
- 部分失敗: skip-and-continueが明文化
- 冪等性: `response_id` UPSERT が明文化

### AC-4: sync_audit 監査契約

- `phase-05/sync-audit-contract.md`: 全カラムの詳細仕様、trigger種別、status遷移図、ユースケース一覧

### AC-5: Source-of-Truth

- `phase-02/design.md` §Source-of-Truth定義: 通常運用=D1、復旧/backfill=Sheets を表形式で明記

### AC-6: Quota対処

- `phase-05/retry-policy.md` §バッチ設定パラメータ: BATCH_SIZE=500, BATCH_DELAY_MS=200, Backoff設定

### AC-7: UT-09実装着手可能性

- Phase 12 の `implementation-guide.md` に APIシグネチャ案・設定パラメータが記載予定
- 本マトリクスがUT-09の実装者が参照すべき設計文書の地図として機能する

---

## 判定

**全AC: 7/7 PASS（AC-7はPhase 12完了時に確定）**

Phase 8（文書DRY化）へ進む。
