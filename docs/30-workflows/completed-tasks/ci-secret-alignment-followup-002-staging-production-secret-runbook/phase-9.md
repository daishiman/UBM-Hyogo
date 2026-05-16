# Phase 9: DoD（完了条件）

## 目的

完了条件を implementation / NON_VISUAL / docs_plus_script_fix の検証可能なチェックリストへ落とす。

## DoD チェックリスト

### 機能要件
- [ ] `runbooks/staging-secret-provisioning.md` が新規作成されている
- [ ] `runbooks/production-secret-provisioning.md` が新規作成されている
- [ ] 必要 secret が `CLOUDFLARE_API_TOKEN` 1 件のみとして記述されている
- [ ] `vars.CLOUDFLARE_ACCOUNT_ID` が GitHub Variables 別管理である旨が章 2 に明記されている
- [ ] 親 `index.md` の In-scope に runbook 2 本のリンクが追加されている

### 品質要件
- [ ] 既存 `secret-provisioning.md` と同じ 7 章立てで揃っている（G1 PASS）
- [ ] 実 secret 値・OAuth トークン値・JWT 値がドキュメント内に一切含まれていない（G2 PASS）
- [ ] secret 取得元は `op://Vault/Item/Field` 参照のみで記述されている（G4 PASS）
- [ ] `--env staging` / `--env production` がクロスファイルで誤参照されていない（G3 PASS）

### ドキュメント要件
- [ ] 親 `index.md` In-scope 「secret provisioning runbook」項目の充足が確認できる（G6 PASS）
- [ ] `staging-runtime-smoke` 用既存 runbook と並立する 3 ファイル構成になっている
- [ ] token rotation 手順（5 step 順序）と禁止事項が両 runbook に記載されている

### 安全要件
- [ ] `apps/` / `packages/` の dirty diff が 0 行（G5 PASS）
- [ ] `staging-runtime-smoke` 用既存 runbook (`secret-provisioning.md`) を編集していない
- [ ] terminal scrollback 消去手順が両 runbook に記載されている

### Phase 11 Evidence 要件
- [ ] G1〜G6 の grep gate 実行ログが `outputs/phase-11/evidence/` に保存されている
- [ ] git diff の名前列が `outputs/phase-11/evidence/git-diff-name-only.txt` に保存されている
- [ ] 元 unassigned spec の status 更新差分が記録されている

### Phase 12 Compliance 要件
- [ ] task-specification-creator skill の `phase12-compliance-check-template.md` 9 項目をクリア
- [ ] `documentation-changelog.md` に変更ファイル一覧が記載されている
- [ ] taskType `implementation` / visualEvidence `NON_VISUAL` / implementationCategory `docs_plus_script_fix` の整合が取れている

### Phase 13 ゲート要件
- [ ] commit / push / PR 作成は **ユーザー明示承認後** に実行する
- [ ] PR 本文に `Refs #662` を記載し close 済 Issue と紐付ける
- [ ] PR base は `dev`

## 完了判定

上記すべてのチェックが PASS した時点で本 workflow を `completed` に遷移させる。1 項目でも未達がある場合は `runtime_pending` 表記を維持する。

## 完了条件

## メタ情報

| 項目 | 内容 |
| --- | --- |
| Phase | 9 |
| 状態 | completed |

## 実行タスク

- DoD チェックリストを定義する。

## 参照資料

- `phase-6.md`
- `phase-11.md`

## 成果物/実行手順

- DoD チェックリスト。

## 統合テスト連携

- G1 から G6 の evidence を DoD の根拠にする。

- 全カテゴリの DoD が列挙されている
- 各項目が Phase 11 / 12 / 13 の gate と対応している
