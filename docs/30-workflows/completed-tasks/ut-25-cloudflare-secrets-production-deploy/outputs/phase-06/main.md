# Phase 6 成果物 — 異常系検証

## 1. 概要

Phase 4 の T1〜T5（happy path）に対して、fail path / 回帰 guard を T6〜T11 として固定する。MINOR UT25-M-02（`--env` 漏れ）は T6 として確定。本 Phase は仕様化のみで、実走は Phase 11 smoke / Phase 13 ユーザー承認後 put に委譲する。

| ID | 観点 | 検出 lane | 解決 Phase |
| --- | --- | --- | --- |
| T6 | `--env` 漏れ → top-level 誤上書き | lane 2 / 3 | Phase 5 Step 3 / 5 ガード（UT25-M-02 本体） |
| T7 | 1Password 失敗 → 空 stdin put | lane 2 / 3 | runbook 冒頭 `set -euo pipefail` |
| T8 | JSON 改行破損 → 401/403 | UT-26 検出 | Phase 5 Step 2 (T4) + rollback-runbook §5.2 |
| T9 | `secret list` name 表示遅延 | lane 2 / 3 | リトライ手順（30 秒 × 3 回） |
| T10 | production 適用後の `.dev.vars` 値ずれ | lane 1 | runbook §post-rotation |
| T11 | governance 連携（`enforce_admins` 影響なし確認） | Phase 13 PR | Phase 12 governance checklist |

## 2. T6: `--env` 漏れ → top-level 誤上書き

| 項目 | 内容 |
| --- | --- |
| シナリオ | `--env` 引数省略で put → top-level Worker（preview）に投入 |
| 検証 | `--env` 省略コマンドを staging 想定で実走（production では絶対実走しない）→ list で staging / production 不在を確認 → top-level list で意図せず投入された name を即時 delete |
| 期待値 | `: "${ENV_TARGET:?ENV_TARGET required}"` で fail-fast し put 自体が走らない |
| Red 状態 | 省略時にエラーで停止せず top-level に投入 |
| 対応 | runbook で `ENV_TARGET=...` 変数化必須 + 未設定 fail-fast |

## 3. T7: 1Password 失敗 → 空 stdin put

| 項目 | 内容 |
| --- | --- |
| シナリオ | `op read` 失敗時に pipefail 未設定だと空 stdin が wrangler に流れる |
| 検証 | runbook 冒頭で `set -euo pipefail` 必須 / 故意に存在しない参照で staging 実走 |
| 期待値 | pipefail で put 全体 exit 1 / list に name 出現しない |
| Red 状態 | put が exit 0 / 空文字列 secret が runtime に配置 |
| 対応 | `set -euo pipefail` + Step 0 で `op whoami` exit 0 |

## 4. T8: JSON 改行破損 → 401/403

| 項目 | 内容 |
| --- | --- |
| シナリオ | 1Password Item に SA JSON が文字列保存され `\n` がエスケープ済み |
| 検証 | put 前 jq で `BEGIN PRIVATE KEY` >= 1 ヒット確認（T4）/ put 後機能確認は UT-26 委譲 |
| 期待値 | jq Pass + UT-26 で 401/403 出ない |
| Red 状態 | jq Pass だが UT-26 で 401/403 |
| 対応 | T4 必須化 + rollback-runbook §5.2 緊急 rollback に「改行破損疑い」追記 |

## 5. T9: `secret list` name 表示遅延

| 項目 | 内容 |
| --- | --- |
| シナリオ | put 直後の Cloudflare Edge 伝播遅延で list に name が出ない |
| 検証 | 30 秒待機 + 最大 3 回リトライ |
| 期待値 | リトライ内で name 出現 |
| Red 状態 | 1 回目不在で即 rollback → lap 状態 |
| 対応 | Phase 5 Step 4 / 6 にリトライ手順を runbook 必須化 |

## 6. T10: production 適用後の `.dev.vars` 値ずれ

| 項目 | 内容 |
| --- | --- |
| シナリオ | `.dev.vars` の op 参照が古い vault / Item を指す |
| 検証 | `.dev.vars` 参照と production 投入時参照の `client_email` メタ突合 |
| 期待値 | 両参照のメタ情報一致 |
| Red 状態 | ローカル / production の SA JSON 分岐 |
| 対応 | op 参照パスを README / runbook 規約化 + post-rotation 手順追加 |

## 7. T11: governance 連携メモ

| 項目 | 内容 |
| --- | --- |
| シナリオ | UT-25 PR が `enforce_admins=true` / required_status_checks に block されないか |
| 検証 | (1) Phase 13 PR 作成時 CI green / (2) reviews=null による merge 可能性 / (3) commit に secret 値転記が無いことを `git log -p` で確認 |
| 期待値 | PR が CI green で merge 可能 / commit clean |
| Red 状態 | UT-GOV-004 未同期で CI 永遠 block / commit に値 leak |
| 対応 | UT-GOV-001 / UT-GOV-004 完了確認を Phase 12 governance checklist 化 |

## 8. fail path × 対応 lane / Phase 早見表

| ID | 検出 lane | 対応 Phase / Step |
| --- | --- | --- |
| T6 | lane 2 / 3 | Phase 5 Step 3 / 5 ガード / Phase 12 CI gate |
| T7 | lane 2 / 3 | runbook 冒頭 + Phase 5 Step 0 |
| T8 | UT-26 | Phase 5 Step 2 (T4) / rollback §5.2 |
| T9 | lane 2 / 3 | Phase 5 Step 4 / 6 リトライ |
| T10 | lane 1 | runbook §post-rotation / Phase 11 smoke |
| T11 | Phase 13 PR | Phase 12 governance checklist |

## 9. CI gate 候補（Phase 12 unassigned-task-detection 行き）

- T6: pre-deploy script で `--env` 引数の有無を静的検査
- T7: runbook lint で `set -euo pipefail` 必須を確認
- T11: PR テンプレに UT-GOV-001 / UT-GOV-004 完了 checkbox

## 10. 引き渡し（Phase 7 へ）

- T1〜T5（Phase 4）+ T6〜T11（本 Phase）= 合計 11 件を AC マトリクス入力に
- MINOR UT25-M-02 が T6 で確定 → AC-2 の被覆強化
- T8 / T11 は UT-26 / governance への委譲境界が明確
- 実走は Phase 11 smoke / Phase 13 ユーザー承認後
