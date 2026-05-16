# Phase 7: リスク・障害復旧

## 目的

secret runbook の漏洩・誤投入・rotation 失敗リスクを整理する。

## リスクマトリクス

| ID | リスク | 影響度 | 発生確率 | 対策 | 検出手段 |
|----|--------|-------|---------|------|---------|
| R1 | runbook 内に実 token が混入 | 高 | 低 | op 参照のみ記述。Phase 11 で G2 grep gate を必ず通す | G2 grep gate / pre-commit secret scan |
| R2 | staging / production 文面が乖離 | 中 | 中 | 章立てを共通 template とし、G1 diff で一致確認 | G1 章立て diff |
| R3 | `staging-runtime-smoke` 用 secret を `staging` に誤投入 | 中 | 中 | 各 runbook 冒頭の注意書きと禁止事項列挙 | 投入確認 G3（environment 名クロスチェック） |
| R4 | `CLOUDFLARE_ACCOUNT_ID` を Environment Secret に誤投入 | 中 | 中 | 章 2 で「GitHub Variables 別管理」と明記 | runbook 章 2 / 7 の規定 |
| R5 | rotation 中に deploy job が token 不一致で fail | 中 | 中 | 旧 token revoke を最後に行う rotation 順序を章 6 で明示 | rotation 順序 step 5 |
| R6 | 1Password Item 名が runbook 記述と乖離 | 低 | 中 | 実装サイクルで `op item list` 確認後に Item 名を決定 | Phase 2 OQ-1 |
| R7 | `apps/` / `packages` / `.github/workflows` への dirty diff 混入 | 中 | 低 | dirty-code gate (G5) を Phase 11 必須実行し、script helper correction 以外を FAIL にする | G5 |

## 障害復旧シナリオ

### S1: deploy job が `Authentication error` で fail

| step | アクション |
|------|----------|
| 1 | `gh api repos/daishiman/UBM-Hyogo/environments/<env>/secrets` で `CLOUDFLARE_API_TOKEN` の登録有無を確認 |
| 2 | 未登録 → 本 runbook 章 3 の正規経路で投入 |
| 3 | 登録済 → 1Password 側 token が Cloudflare 側で revoke されていないか確認 |
| 4 | revoke されていれば章 6 rotation 手順で再発行 |

### S2: runbook 内に token らしき文字列が commit された疑い

| step | アクション |
|------|----------|
| 1 | Cloudflare ダッシュボードで即時 token revoke |
| 2 | 新 token を発行し 1Password / Environment Secret を上書き |
| 3 | `git log -p` で混入経路を特定し、必要なら `git filter-repo` で履歴から除去（影響範囲をユーザーに escalate） |
| 4 | 本タスク Phase 11 evidence に incident note を追加 |

### S3: production deploy が rotation 直後に fail

| step | アクション |
|------|----------|
| 1 | 旧 token をまだ revoke していない場合は、Environment Secret を旧 token に戻して deploy 再実行（service 復旧優先） |
| 2 | 新 token の Cloudflare scope（Workers Scripts:Edit / Pages:Edit / Account:Read）が欠けていないか確認 |
| 3 | account 範囲が production account になっているか確認 |
| 4 | 修正後に再 rotation を staging で先行検証 |

## エスカレーション基準

- R1 / S2（実値混入 / 漏洩疑い）: **即時ユーザー escalate**。AI エージェントは自走で対処しない
- production deploy が 2 連続で fail: ユーザー escalate
- 1Password Vault アクセス権限が無い: ユーザー escalate

## 完了条件

## メタ情報

| 項目 | 内容 |
| --- | --- |
| Phase | 7 |
| 状態 | completed |

## 実行タスク

- リスクと復旧シナリオを定義する。

## 参照資料

- `phase-6.md`

## 成果物/実行手順

- リスクマトリクスと障害復旧手順。

## 統合テスト連携

- secret 混入リスクは G2 evidence で確認する。

- 主要リスク 7 件に対策・検出手段が定義されている
- 障害復旧シナリオ 3 件に手順が定義されている
- エスカレーション基準が明示されている
