# Phase 1 — 要件定義

## 1. タスク種別 / implementation_mode

- task type: `implementation`（CI workflow / runbook / SSOT の edit を伴う実装仕様書）
- implementation_mode: `edit`
- visualEvidence: `NON_VISUAL`（CI workflow / runbook 改定。UI 表示物変更なし）
- workflow_state: `spec_created`（implementation pending / NON_VISUAL）
- CONST_007 1 cycle 完了宣言: **はい**。workflow edit + runbook 改定 + SSOT 更新 + 静的 secret 物理削除手順策定を 1 cycle で完了させる（将来 PR・バックログ送り禁止）

## 2. 真の論点

「static bearer fallback を消す」ではなく「mint 一本化を構造的に不可逆にする」。env / mask 分岐 / freshness gate warn-only の 3 点を同時撤去しなければ、後日の運用迂回で再発する。

## 3. 前提タスク（必須）

| Issue  | 内容                                                                                    | 状態         | 影響                                          |
| ------ | --------------------------------------------------------------------------------------- | ------------ | --------------------------------------------- |
| #916   | `STAGING_AUTH_SECRET` を `staging-runtime-smoke` 環境 secret へ投入 + mint path で smoke green 1 回以上 | **未完了** | 完了するまで撤去 PR をマージしない（順序制約）|

> #916 が未完了の状態で本タスクの実装 PR をマージすると、mint step は実行されず（`STAGING_AUTH_SECRET` 未設定）、撤去後の `verify required staging secrets` step が `STAGING_ADMIN_BEARER` / `STAGING_ME_BEARER` 欠落で fail する。

## 4. 現行コード行番号 inventory（`.github/workflows/runtime-smoke-staging.yml`）

| 行       | 種別                | 撤去対象                                                                                        |
| -------- | ------------------- | ---------------------------------------------------------------------------------------------- |
| `:29`    | job.env             | `STAGING_ADMIN_BEARER: ${{ secrets.STAGING_ADMIN_BEARER }}`                                    |
| `:31`    | job.env             | `STAGING_ME_BEARER: ${{ secrets.STAGING_ME_BEARER }}`                                          |
| `:32-33` | コメント            | mint 未設定時の fallback 説明（撤去後は文脈に反するため削除）                                  |
| `:35-37` | job.env + コメント  | `RUNTIME_SMOKE_FRESHNESS_ENFORCE: '0'` ＋ warn-only 化のコメント 2 行                          |
| `:47`    | step `if`           | `if: env.STAGING_AUTH_SECRET != ''`（mint step を常時実行へ昇格）                              |
| `:88-99` | mask step           | `RUNTIME_SMOKE_AUTH_PATH` 未設定時 `static-fallback` 書き込み分岐（`:90-95`）。`:96-99` の add-mask のみ残す |

> 元 issue #899 本文では `:29, :31, :39, :45` を指していたが、現行 HEAD では `:29, :31, :47` で `setup project` step（`:41-42`）には `if` が無い。本仕様書では **現行行番号** で記述する。

## 5. 追加スコープ（元 issue 未言及・本仕様書で固定）

| ID | 追加項目                                                                       | 理由                                                                                                |
| -- | ------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------- |
| ES-1 | `RUNTIME_SMOKE_FRESHNESS_ENFORCE: '0'` の撤去（hard-fail 既定への昇格）         | 静的 bearer 寿命切れ吸収目的のため。fallback 撤去と同時に warn-only の根拠が消える                  |
| ES-2 | `mask staging credentials` step の `static-fallback` 分岐除去（`:90-95`）       | mint step 常時実行で `RUNTIME_SMOKE_AUTH_PATH=minted` を必ず export する前提に整合                  |
| ES-3 | mint step 冒頭で `STAGING_AUTH_SECRET` 未設定時 `::error::` + `exit 1` の追加  | 撤去後の「secret 欠落 silent skip」を防ぎ、構造的に static 経路復活を不可能にする                  |

## 6. 受入条件

`index.md` の AC-1〜AC-11 を参照。

## 7. リスク

| ID | リスク                                                                | 緩和策                                                              |
| -- | --------------------------------------------------------------------- | ------------------------------------------------------------------- |
| R-1 | #916 未完了で本 PR を merge → smoke 即 fail                            | 順序制約を `index.md` / `runbook` 双方に明記。PR 説明にも前提を記載 |
| R-2 | physical secret 削除を先に行う → 撤去前 workflow が secret 欠落で fail | workflow edit を必ず先、physical delete は最後（順序制約）          |
| R-3 | freshness hard-fail 昇格直後に bearer mint TTL 不足で頻発 fail         | TTL = 600s（10 分）で smoke は 10 分以内完了する前提を Phase 11 で実測 |

## 8. 完了基準（Phase 1 単体）

- 真の論点 / 前提 / 行番号 inventory / 追加スコープ / リスクを文書化済み
- Phase 2 設計へ依存する全変数（行番号、AC、順序制約）を固定済み
