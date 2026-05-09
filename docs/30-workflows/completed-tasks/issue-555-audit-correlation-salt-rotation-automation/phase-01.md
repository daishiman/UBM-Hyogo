# Phase 1: 要件定義 / GO 判定 / rotation policy フレームワーク確定

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 1 / 13 |
| Source | `outputs/phase-1/phase-1.md` |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| 状態 | pending |

## 目的

`AUDIT_CORRELATION_SALT` rotation の policy（rotation 周期・dual-hash 期間・HIGH alert 連続性しきい値）を SSOT として確定し、`op` CLI non-interactive 制約を踏まえた自動化境界を決定する。`fingerprintVersion=2` 移行スコープと「rotation 終了忘れによる永続的 dual-hash」防止条件を明文化し、Phase 2（dual-hash データモデル設計）着手の GO/NO-GO を判定する。

## 実行タスク

詳細は `outputs/phase-1/phase-1.md` を正本とする。要点:

- 要件レビュー思考法 3 系統（システム思考 / 戦略思考 / 問題解決思考）の通過記録
- rotation 周期確定（定期: 90 日 / 緊急: 即時）と dual-hash 期間確定（7 日）
- `op` CLI non-interactive 制約調査（`OP_SERVICE_ACCOUNT_TOKEN` 利用可否、headless 限界の境界線）
- HIGH alert 連続性しきい値確定（rotation 直前/直後で同一 actor 検知率 ≥ 99%）
- canonical hash 入力の再確認（email-based 維持 + IP 急変検知両立）
- `artifacts.json` の `metadata.visualEvidence=NON_VISUAL` 確定
- 親タスク FU-01（issue-516）の current state 確認手順
- 含む / 含まないスコープ最終固定（v3 以降禁止 / production rotation 実行禁止 / 全 secret 共通化禁止）

## 統合テスト連携

Phase 4 の vitest シナリオで、rotation 周期・dual-hash 期間・しきい値が test fixture の前提条件として参照される。

## 参照資料

- `docs/30-workflows/unassigned-task/U-FIX-CF-ACCT-01-DERIV-04-FU-04-FU-03-salt-rotation-automation.md`
- `docs/30-workflows/issue-516-github-audit-log-cross-source-correlation/`（存在時）
- `docs/runbooks/audit-correlation.md`
- CLAUDE.md「シークレット管理」「Cloudflare 系 CLI 実行ルール」セクション

## 成果物

- `outputs/phase-1/phase-1.md`

## 完了条件

- rotation policy（周期・dual-hash 期間・しきい値・スコープ境界）が SSOT として確定し、`op` CLI 制約と親タスク前提が記録され、Phase 2 着手 GO/NO-GO 判定が記述されている。
