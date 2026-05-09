# Phase 1: 要件定義 / GO 判定 / rotation policy フレームワーク確定

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 1 / 13 |
| 作成日 | 2026-05-08 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| 状態 | pending |
| 上流依存 | 親タスク FU-01（issue-516）live wiring。Phase 1〜10 は未完了でも着手可、Phase 11 staging evidence 取得時に完了必須 |

## 目的

`AUDIT_CORRELATION_SALT` rotation の policy（rotation 周期・dual-hash 期間・HIGH alert 連続性しきい値・スコープ境界）を SSOT として確定し、`op` CLI の non-interactive 制約を踏まえた自動化境界を決定する。`fingerprintVersion=1 → 2` 移行のスコープ固定と、rotation 終了忘れによる「永続的 dual-hash」防止条件を明文化し、Phase 2（dual-hash データモデル設計）着手の GO/NO-GO を判定する。

## Step 0: P50 チェック（必須）

```bash
mkdir -p outputs/phase-1

# 1) gh CLI 認証済（Phase 13 PR 作成主体）
gh auth status \
  | tee outputs/phase-1/gh-auth-status.log

# 2) 親タスク（issue-516）spec 参照可能性
( test -d docs/30-workflows/issue-516-github-audit-log-cross-source-correlation/ \
    && echo "OK: parent task spec dir present" ) \
  || ( test -f docs/30-workflows/unassigned-task/U-FIX-CF-ACCT-01-DERIV-04-FU-04-FU-03-salt-rotation-automation.md \
    && echo "OK: source unassigned spec present (parent dir absent)" ) \
  | tee outputs/phase-1/parent-task-presence.log

# 3) op CLI が解決可能
op --version \
  | tee outputs/phase-1/op-version.log

# 4) staging D1 到達確認（scripts/cf.sh 経由）
bash scripts/cf.sh d1 list 2>&1 \
  | tee outputs/phase-1/staging-d1-list.log

# 5) Node 24 / pnpm 10 解決
mise exec -- node -v \
  | tee outputs/phase-1/node-version.log
```

期待:

- `gh auth status` が `Logged in to github.com` を含む
- 親 task spec dir または起票元 unassigned spec の少なくとも一方が存在
- `op --version` が成功（2.x 系）
- `ubm-hyogo-db-staging` が `d1 list` に現れる
- `node -v` が `v24.15.0`

## 要件レビュー思考法 3 系統（必須通過）

| 系統 | 観点 | 通過判定 |
| --- | --- | --- |
| システム思考 | rotation を「単発操作」ではなく「周期+緊急+終了の 3 状態を持つループ」として捉える | rotation_state ∈ {idle, rotating, ending} の 3 状態が runbook と script に反映されている |
| 戦略思考 | 「全 secret 共通の rotation 基盤」ではなく「`AUDIT_CORRELATION_SALT` 専用の最小実装」に絞り込む | 含まないスコープ表（下記）に共通基盤化禁止が明記される |
| 問題解決思考 | 親 FU-01 が D1 永続化未実装でも本タスク Phase 1〜10 が止まらない設計か | Phase 11 のみ `blocked_upstream_pending`、他は独立着手可と確認 |

## rotation policy SSOT

| 項目 | 値 | 根拠 |
| --- | --- | --- |
| 定期 rotation 周期 | 90 日 | 一般的な audit secret rotation 周期。runbook 上で確定 |
| 緊急 rotation | 即時（incident 検知時） | `rotate-salt.sh --apply` を即時実行 |
| dual-hash 期間 | 7 日 | rotation 直後 7 日は v1 + v2 両方の hash を出力 |
| rotation 終了 signal | `AUDIT_CORRELATION_SALT_PREVIOUS` 環境変数の削除 + Worker 再 deploy | `--end-rotation` モードがこの操作を一括実行 |
| HIGH alert 連続性しきい値 | rotation 直前/直後で同一 actor 検知率 ≥ 99% | Phase 4 vitest シナリオ 4 で assertion |
| canonical hash 入力 | email-based（IP 急変検知両立） | Issue #516 redact-safe 改訂教訓を継承 |

## `op` CLI non-interactive 制約調査

| 観点 | 結果 | 影響 |
| --- | --- | --- |
| `OP_SERVICE_ACCOUNT_TOKEN` の利用可否 | 利用可能（service account 発行で headless 化可） | CI / cron からの完全 headless rotation が技術的に可能 |
| 本タスクスコープでの採用 | **手動承認 + `op signin` セッション利用** に留める | production secret 取扱の最終承認は人間 gate を維持。runbook で明示 |
| `rotate-salt.sh` の前提 | `op whoami` が成功すること（事前 signin 必須） | script 冒頭で `op whoami` を実行し失敗時 exit 1 |

> 完全 headless 化は本タスク非スコープ。将来別タスクで service account 化する場合は本決定を上書き。

## 含む / 含まない（不可侵条件）

### 含む（Phase 1 で確定）

- rotation 周期 90 日 / dual-hash 期間 7 日 / 緊急 rotation 即時の 3 軸
- `op` 手動 signin 前提の semi-automation
- `fingerprintVersion=1 → 2` 移行のみ（v3 以降は将来タスク）
- HIGH alert 連続性 ≥ 99% を test fixture でしきい値化

### 含まない（Phase 1 で禁止スコープとして固定）

- 全 secret 共通の rotation 基盤化
- production への実 rotation 自動実行（user gate 後の別段ゲート）
- branch protection 登録（FU-02 責務）
- live audit-correlation Worker route 実装（FU-01 責務）
- `OP_SERVICE_ACCOUNT_TOKEN` を使った完全 headless 化

## 上流依存テーブル

| 依存 | 状態 | 確認方法 |
| --- | --- | --- |
| 親タスク FU-01（issue-516）live wiring | 未完了でも Phase 1〜10 着手可 | `docs/30-workflows/issue-516-*/` または unassigned spec で current state を再確認 |
| 1Password Production vault | `AUDIT_CORRELATION_SALT` item 存在 | `op item get "AUDIT_CORRELATION_SALT" --vault Production` |
| `scripts/cf.sh` | 利用可能 | `bash scripts/cf.sh whoami` |

## Acceptance Criteria

| ID | 内容 | 計測方法 |
| --- | --- | --- |
| AC-1 | rotation policy 4 値（周期・dual-hash 期間・終了 signal・しきい値）が SSOT で確定 | spec grep |
| AC-2 | `op` CLI 制約と採用境界（手動 signin 前提）が記録 | spec grep |
| AC-3 | 含まないスコープに「全 secret 共通基盤化」「production 実行」「v3 移行」が明記 | spec grep |
| AC-4 | 親タスク FU-01 current state 確認手順が固定 | spec grep |
| AC-5 | Phase 2 着手 GO/NO-GO 判定基準が記載 | spec grep |

## GO/NO-GO 判定（Phase 2 着手）

- GO 条件: AC-1〜AC-5 すべて満たし、Step 0 P50 チェック 5 項目が期待値を返す
- NO-GO 条件: `op` CLI 解決不能 / staging D1 到達不能 / Node 24 解決不能 のいずれか
- NO-GO 時アクション: Phase 1 を再実行。本タスクを `spec_blocked` 状態にして user に通知

## 成果物

- `outputs/phase-1/phase-1.md`（本ファイル / SSOT 確定書）
- `outputs/phase-1/gh-auth-status.log`
- `outputs/phase-1/parent-task-presence.log`
- `outputs/phase-1/op-version.log`
- `outputs/phase-1/staging-d1-list.log`
- `outputs/phase-1/node-version.log`

## 完了条件

- [ ] rotation policy 4 値・`op` 制約・スコープ境界・上流依存・AC が本ドキュメントに固定
- [ ] Step 0 P50 チェック 5 項目が PASS
- [ ] Phase 2 着手 GO 判定が記録
