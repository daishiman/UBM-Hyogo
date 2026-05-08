# Phase 3: rotation script I/F 設計 / 関数シグネチャ確定

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 3 / 13 |
| Source | `outputs/phase-3/phase-3.md` |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| 状態 | pending |

## 目的

`scripts/audit-correlation/rotate-salt.sh` の CLI I/F（`--dry-run` / `--apply` / `--rollback` / `--end-rotation` の 4 サブモード）と、`redact.ts` / `correlate.ts` の関数シグネチャを擬似コードレベルで確定する。1Password vault 構造（`Production / AUDIT_CORRELATION_SALT` / `_PREVIOUS`）と Cloudflare Secrets 反映フロー（`scripts/cf.sh secret put` 経由）を I/F 仕様として固定する。

## 実行タスク

詳細は `outputs/phase-3/phase-3.md` を正本とする。要点:

- `rotate-salt.sh` の 4 サブモード仕様、引数、exit code 規約、stdout / stderr 分離
- `redact.ts` の `redactAndFingerprint(input, env)` 擬似シグネチャ確定
- `correlate.ts` の `groupByActor(records: NormalizedAuditEvent bridge shape[]): ActorGroup[]` を v1/v2 跨ぎ merge 対応に拡張する I/F
- 1Password vault 構造（`Production / AUDIT_CORRELATION_SALT` (current) / `_PREVIOUS` (rotation 期間のみ存在)）の参照規則
- Cloudflare Secrets 反映フロー: `bash scripts/cf.sh secret put AUDIT_CORRELATION_SALT --config apps/api/wrangler.toml --env <env>`
- Worker 環境変数の解釈順序: `env.AUDIT_CORRELATION_SALT_PREVIOUS` 存在時のみ dual-hash 経路

## 統合テスト連携

Phase 4 の vitest シナリオで、本 phase 確定の関数シグネチャに対し fixture / mock env を注入してシナリオ毎の出力差分を assertion する。`rotate-salt.sh` は shellcheck で gate する（Phase 10）。

## 参照資料

- `scripts/cf.sh`
- `apps/api/src/audit-correlation/redact.ts` / `correlate.ts`（存在時）
- CLAUDE.md「Cloudflare 系 CLI 実行ルール」
- `outputs/phase-2/phase-2.md`

## 成果物

- `outputs/phase-3/phase-3.md`

## 完了条件

- `rotate-salt.sh` の 4 サブモード I/F、`redact.ts` / `correlate.ts` の関数シグネチャ、1Password vault 構造、Cloudflare Secrets 反映フローが SSOT として確定し、Phase 4 がそのまま test 設計に着手できる。
