# Phase 4: 統合テスト設計

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 4 / 13 |
| Source | `outputs/phase-4/phase-4.md` |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| 状態 | pending |

## 目的

vitest による rotation 4 シナリオ（rotation 期間中 dual-hash / rotation 終了後 single-hash / rotation rollback / v1+v2 mix の同一 actor merge）を fixture 駆動で設計し、grep gate test の組込み・shellcheck 適用方針を確定する。Phase 6 / 7 / 8 / 10 の実装が本 phase の test 設計をそのまま満たす形で進められる粒度に落とす。

## 実行タスク

詳細は `outputs/phase-4/phase-4.md` を正本とする。要点:

- vitest 4 シナリオの fixture / mock env / 期待出力の一覧化
- fixture 配置: `apps/api/src/audit-correlation/__tests__/fixtures/rotation/`（`previous-current.json` / `current-only.json` / `rollback.json` / `v1-v2-mix.json`）
- 各 test ファイルに追加するケース割付:
  - `redact.test.ts`: シナリオ 1（dual-hash）/ シナリオ 2（single-hash）/ シナリオ 3（rollback 後の hash 一致）
  - `correlate.test.ts`: シナリオ 4（v1 + v2 mix の同一 actor merge / HIGH alert 連続性 ≥ 99%）
- grep gate test の組込み: `scripts/grep-gate/audit-correlation-secrets.sh` 拡張版を `pnpm test` から呼び出すか、vitest 内で salt literal 非露出を assertion する経路の選定
- shellcheck 適用方針: `shellcheck scripts/audit-correlation/rotate-salt.sh` を Phase 10 ローカル gate に追加（CI 反映可否は Phase 10 で確定）

## 統合テスト連携（Phase 内）

- 4 シナリオは Phase 1 確定の HIGH alert 連続性しきい値（≥ 99%）と Phase 2 確定の `NormalizedAuditEvent bridge shape` 型を直接参照する
- rotation 期間中の dual-hash 出力に salt literal が含まれないことを assertion で gate する

## 参照資料

- `outputs/phase-1/phase-1.md` / `outputs/phase-2/phase-2.md` / `outputs/phase-3/phase-3.md`
- `apps/api/src/audit-correlation/__tests__/`（存在時）
- `scripts/grep-gate/`（存在時）

## 成果物

- `outputs/phase-4/phase-4.md`

## 完了条件

- 4 シナリオ・fixture 4 種・test ケース割付・grep gate 組込み・shellcheck 方針が確定し、Phase 6 〜 10 の実装着手に必要な test 仕様が SSOT として固定されている。
