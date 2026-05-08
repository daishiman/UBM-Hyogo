# Phase 6: redact.ts 実装（dual-hash）

## メタ情報

| 項目 | 値 |
| --- | --- |
| Source | `outputs/phase-6/phase-6.md` |
| 実装区分 | 実装仕様書（pure function 拡張） |

## 目的

`apps/api/src/audit-correlation/redact.ts` に「`AUDIT_CORRELATION_SALT_PREVIOUS` 環境変数の存在検知」と「dual-hash 計算（v1 旧 salt + v2 新 salt）」を追加する。rotation 期間中は `fingerprintHashes: { v1, v2 }` の双方を返却し、rotation 終了後は v2 のみを返却する。`fingerprintVersion` は新形式 canonical として常に `2` に固定する。`types.ts` の `NormalizedAuditEvent bridge shape` を拡張し、副作用なし（pure function 維持）の不変条件を堅持する。

## 実行タスク

詳細は `outputs/phase-6/phase-6.md` を正本とする。

## 統合テスト連携

- Phase 4 で設計した vitest（rotation 期間中 dual-hash / rotation 終了後 single-hash）が本 Phase の契約となる。
- 既存 redact test が dual-hash 拡張で regress しないことを確認する。
- grep gate（Phase 8）が rotation 期間中の出力に salt literal を検出しないことを Phase 10 で test 化する。

## 参照資料

- `outputs/phase-6/phase-6.md`
- `apps/api/src/audit-correlation/redact.ts`
- `apps/api/src/audit-correlation/types.ts`
- index.md「想定変更ファイル一覧」「苦戦箇所・知見」項 1（IP 急変検知との両立）

## 成果物

- `outputs/phase-6/phase-6.md`
- `apps/api/src/audit-correlation/redact.ts` の dual-hash 拡張仕様（実装は Phase 13 まで保留）

## 完了条件

- `AUDIT_CORRELATION_SALT_PREVIOUS` の存在検知ロジックが確定（`env.AUDIT_CORRELATION_SALT_PREVIOUS !== undefined`）。
- dual-hash と single-hash の出力 shape が確定（`fingerprintHashes.v1?` / `fingerprintHashes.v2`）。
- pure function 維持（外部 I/O 禁止）が明記されている。
- types.ts 拡張シグネチャが確定。
