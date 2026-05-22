# Phase 2: dual-hash データモデル設計 / 永続化 schema 影響判定

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 2 / 13 |
| 作成日 | 2026-05-08 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| 状態 | pending |
| 上流依存 | Phase 1 で確定した rotation policy（dual-hash 期間 7 日 / `fingerprintVersion=2`） |

## 目的

既存 `NormalizedAuditEvent` / `CorrelationKey` を拡張し、`fingerprintVersion: 1 | 2` と optional `fingerprintHashes: { v1?: string, v2?: string }` を扱う型拡張を確定する。既存 v1 レコードは `{ fingerprintHash, fingerprintVersion: 1 }` を正として受け入れ、相関前 adapter で `{ fingerprintHashes: { v1: fingerprintHash } }` として正規化する。親タスク FU-01 が D1 永続化を実装済か否かを再確認し、migration の要否（追加するなら次番号採番、不要なら spec-only 記録）を判定する。canonical hash 入力（email-based）と rotation 跨ぎの正規化規則を Phase 1 確定値に紐づけて再固定する。

## 変更対象ファイル一覧（本 phase は spec のみ。実装は Phase 5 / 6）

| ファイル | 種別 | 概要 |
| --- | --- | --- |
| `apps/api/src/audit-correlation/types.ts` | 編集（存在時。Phase 6 で確定） | `NormalizedAuditEvent bridge shape` 拡張 |
| `apps/api/migrations/0016_audit_correlation_fingerprint_version.sql` | 新規（**判定要**: 永続化済の場合のみ） | `fingerprintVersion` カラム追加 |

> migration 番号は実装 phase 着手時点で `ls apps/api/migrations/ | sort | tail -n 1` を再実行し、最大番号+1 に更新する。`0016` は本 spec 時点の暫定値。

## 永続化 schema 影響判定（必須調査）

```bash
mkdir -p outputs/phase-2

# 親タスク FU-01 が D1 永続化を実装済か確認
grep -RIn "incident_records\|fingerprintRecord" apps/api/migrations/ apps/api/src/audit-correlation/ 2>/dev/null \
  | tee outputs/phase-2/persistence-grep.log

# 既存 migration 最大番号
ls apps/api/migrations/ 2>/dev/null | sort | tail -n 5 \
  | tee outputs/phase-2/migrations-tail.log
```

判定ルール:

| ケース | 判定 | アクション |
| --- | --- | --- |
| `incident_records` テーブルが migration に存在しない | **migration 不要** | 本 phase で「永続化未実装のため migration 追加せず」と spec_only 記録。Phase 5 はスキップ宣言 |
| 存在し、`fingerprintVersion` カラムが無い | **migration 必要** | 次番号採番（実装時再確認）。up: `ALTER TABLE incident_records ADD COLUMN fingerprint_version INTEGER NOT NULL DEFAULT 1;` |
| 存在し、すでに `fingerprintVersion` カラムが有る | **migration 不要** | 既存型と整合性のみ Phase 6 で確認 |

## 型拡張案（SSOT）

```typescript
// apps/api/src/audit-correlation/types.ts（Phase 6 で実装）
export interface CorrelationKey {
  readonly fingerprintHash: FingerprintHash;
  readonly fingerprintVersion: 1 | 2;
  readonly fingerprintHashes?: {
    readonly v1?: FingerprintHash;
    readonly v2?: FingerprintHash;
  };
}
```

不変条件:

- legacy v1 入力は `fingerprintHashes` 欠落を許容し、adapter で `fingerprintHashes.v1 = fingerprintHash` に正規化する
- v2 入力は `fingerprintHashes.v2` を canonical とし、`fingerprintHash = fingerprintHashes.v2` を後方互換 field として維持する
- `fingerprintHashes.v1` は `AUDIT_CORRELATION_SALT_PREVIOUS` 設定時、または legacy v1 adapter の出力時のみ non-empty
- `fingerprintVersion` の値 `2` は dual-hash 期間中の record と rotation 終了後の新 record 双方で同一（version は salt 世代を表すのではなく canonical 計算規則の世代を表す）
- dual-hash bridge は rotation window 内に v1/v2 双方が観測された actor だけを自動連結する。window 内に現れない actor の古い incident は自動 backfill しない

## canonical hash 入力組合せ（再確認）

| 入力 | 採用 | 根拠 |
| --- | --- | --- |
| email（lowercase / trim） | 採用 | Issue #516 redact-safe 改訂で確定。同一 actor 連続性のコア |
| ip | 補助情報のみ（hash 入力に含めない） | 「IP 急変検知」と矛盾するため canonical 入力から除外 |
| user-agent | hash 入力に含めない | 同上 |
| salt | rotation 世代ごとに切替 | dual-hash 期間中は v1 = previous_salt + email、v2 = current_salt + email |

## v1 → v2 バックフィル方針

- 既存 record（v1）は **再ハッシュしない**（DB 書込み増を避ける）
- 新規 record のみ v2 で記録
- correlate.ts 側で v1 / v2 group を同一 actor として merge することで連続性を確保（Phase 7 実装）

## 入力・出力・副作用

| 種別 | 内容 |
| --- | --- |
| 入力 | `RedactInput`（既存 FU-01 型）+ `env.AUDIT_CORRELATION_SALT` + `env.AUDIT_CORRELATION_SALT_PREVIOUS?` |
| 出力 | `NormalizedAuditEvent bridge shape`（上記拡張） |
| 副作用 | 永続化済の場合のみ D1 INSERT（migration apply 済のとき）。本 phase は spec のみで副作用なし |

## テスト方針

- 型 unit 確認（TypeScript compile）は Phase 6 / 10
- 永続化 migration 適用テストは Phase 5（migration 必要時のみ）
- バックフィルしない方針は Phase 4 で fixture（v1 既存 + v2 新規 mix）に反映

## ローカル実行・検証コマンド

```bash
# 永続化判定の再実行
grep -RIn "incident_records" apps/api/migrations/

# Phase 6 で行う型 compile gate（事前確認）
mise exec -- pnpm typecheck
```

## Acceptance Criteria

| ID | 内容 |
| --- | --- |
| AC-1 | `NormalizedAuditEvent bridge shape` 拡張案が SSOT で確定 |
| AC-2 | 永続化 schema 影響判定（migration 要否 + 判定根拠）が記録 |
| AC-3 | バックフィル方針（既存 record 再ハッシュしない）が確定 |
| AC-4 | canonical hash 入力（email-only）が再固定 |

## 成果物

- `outputs/phase-2/phase-2.md`（本ファイル）
- `outputs/phase-2/persistence-grep.log`
- `outputs/phase-2/migrations-tail.log`

## 完了条件 (DoD)

- [ ] `NormalizedAuditEvent bridge shape` 型拡張が確定
- [ ] 永続化 schema 影響判定が記録（migration 要否 + 番号案 or 不要根拠）
- [ ] バックフィル方針が確定
- [ ] canonical hash 入力が再固定
- [ ] Phase 3 着手 GO 判定
