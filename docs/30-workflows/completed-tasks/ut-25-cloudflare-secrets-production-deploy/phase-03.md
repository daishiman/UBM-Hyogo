# Phase 3: 設計レビュー

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | Cloudflare Secrets 本番配置（GOOGLE_SERVICE_ACCOUNT_JSON）(ut-25-cloudflare-secrets-production-deploy) |
| Phase 番号 | 3 / 13 |
| Phase 名称 | 設計レビュー |
| 作成日 | 2026-04-29 |
| 前 Phase | 2 (設計) |
| 次 Phase | 4 (テスト戦略) |
| 状態 | completed |
| タスク種別 | implementation / NON_VISUAL / cloudflare_secrets_deployment |

## 目的

Phase 2 で確定した設計（投入経路 / staging-first / rollback / state ownership / `.dev.vars` 取扱）を、代替案比較・PASS/MINOR/MAJOR 判定・Phase 4 着手条件・Phase 13 blocked 条件で監査し、簡素化余地と NO-GO 条件を確定する。本 Phase は仕様レベルのレビューに閉じる。

## 実行タスク

1. 代替案 A: `bash scripts/cf.sh` ラッパー vs 直接 `wrangler` の比較を確定する。
2. 代替案 B: staging-first vs production-first の順序を比較する。
3. 代替案 C: ローカル `apps/api/.dev.vars` 設定 vs Cloudflare Secret 単独運用（ローカルでは dev 不可）の比較を確定する。
4. 代替案 D: 投入手段（`op read | stdin pipe` vs `cat sa.json | stdin pipe` vs インタラクティブ tty 入力）を比較する。
5. 代替案 E: rollback 経路（`secret delete` + 再 put vs `secret put` 上書きのみ）を比較する。
6. 4 条件評価を再判定する（Phase 1 の PASS 判定が設計後も維持されているか）。
7. Phase 4 着手条件（GO / NO-GO）と Phase 13 blocked 条件を確定する。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ut-25-cloudflare-secrets-production-deploy/phase-01.md | 真の論点 / 4 条件 |
| 必須 | docs/30-workflows/ut-25-cloudflare-secrets-production-deploy/phase-02.md | 設計対象 |
| 必須 | docs/30-workflows/unassigned-task/UT-25-cloudflare-secrets-sa-json-deploy.md | 親仕様 |
| 必須 | CLAUDE.md（Cloudflare 系 CLI / シークレット管理） | 直接実行禁止・op 経由注入 |
| 必須 | scripts/cf.sh | ラッパー実装 |

## 代替案比較

### 代替案 A: `bash scripts/cf.sh` ラッパー vs 直接 `wrangler`

| 項目 | A1: cf.sh ラッパー（採用） | A2: 直接 `wrangler` |
| --- | --- | --- |
| op 経由 token 注入 | 自動（`op run --env-file=.env`） | 手動で env 設定が必要 |
| esbuild バージョン解決 | 自動（`ESBUILD_BINARY_PATH`） | 手動 or グローバル汚染リスク |
| Node 24 / pnpm 10 強制 | `mise exec --` で保証 | 環境次第で drift |
| CLAUDE.md 適合 | ✅ ルール明記 | ❌ 「wrangler 直接禁止」違反 |
| 判定 | **採用** | **不採用**（ルール違反） |

**結論: A1 採用。CLAUDE.md ルール「wrangler 直接呼び出し禁止」に直結するため代替不可。**

### 代替案 B: staging-first vs production-first

| 項目 | B1: staging-first（採用） | B2: production-first |
| --- | --- | --- |
| 失敗時影響 | staging のみで検出可能 | production が先に壊れる |
| 学習機会 | staging 投入の挙動を見て production へ進める | production 失敗で初めて気づく |
| `--env` 切替確認 | staging で 1 度確認できる | production で初検証 |
| 判定 | **採用** | **不採用**（運用性 PASS が崩れる） |

**結論: B1 採用。production-first は運用性で MAJOR。**

### 代替案 C: ローカル `apps/api/.dev.vars` vs Cloudflare 単独

| 項目 | C1: `.dev.vars` あり（採用） | C2: Cloudflare 単独 |
| --- | --- | --- |
| ローカル wrangler dev | 動作可能 | 動作不可（secret 未解決） |
| 開発体験 | ローカルで Sheets API 統合確認可 | デプロイ毎に検証 |
| leak リスク | `.gitignore` 除外で抑制 | leak 経路自体が無い |
| 採用条件 | `.gitignore` 除外確認必須 + op 参照のみ書く | - |
| 判定 | **採用**（`.gitignore` 除外確認を AC-6 で担保） | 不採用（実現性 PASS が崩れる） |

**結論: C1 採用。AC-6 で `.gitignore` 除外確認を担保することで leak リスクは構造的に防げる。**

### 代替案 D: 投入手段（stdin 経路）

| 項目 | D1: `op read \| stdin`（採用） | D2: `cat sa.json \| stdin` | D3: インタラクティブ tty |
| --- | --- | --- | --- |
| `private_key` 改行保全 | ✅ stdin バイト透過 | ✅ stdin バイト透過 | ⚠️ コピペで `\n` 破壊リスク |
| ディスクへの一時残留 | ❌ なし（メモリ経由） | ⚠️ `sa.json` がディスクに残る | ❌ なし |
| シェル履歴汚染 | ❌ なし | ❌ なし（コマンドにファイル名のみ） | ❌ なし（tty 入力は履歴外） |
| 自動化適合 | ✅ 完全自動 | ⚠️ 一時ファイル管理が必要 | ❌ 自動化不可 |
| 判定 | **採用** | サブ案（`op` 不調時のみ） | **不採用** |

**結論: D1 採用。D2 はサブ案として runbook 注記。D3 は採用しない。**

### 代替案 E: rollback 経路（delete + 再 put vs 上書き put）

| 項目 | E1: delete + 再 put（採用） | E2: 上書き put のみ |
| --- | --- | --- |
| 誤値の確実な除去 | ✅ delete で完全除去 | ⚠️ 上書きするまで誤値が runtime に存在 |
| 再 put 失敗時 | secret 不在状態で fail-fast | 誤値のまま稼働継続 |
| 緊急時の単純化 | 2 段階（delete → put） | 1 段階だが値準備が間に合わない場合に詰む |
| 判定 | **採用**（誤値除去優先） | サブ案（rotate 時はこちらでも可） |

**結論: E1 採用。誤値の即時除去で fail-fast を優先。**

## 4 条件再評価

| 条件 | Phase 1 | Phase 3 後 | コメント |
| --- | --- | --- | --- |
| 価値性 | PASS | **PASS** | 代替案比較で UT-26 / UT-09 unblock 価値が再確認 |
| 実現性 | PASS | **PASS** | A1 / D1 採用により op + stdin 経路で実装可能 |
| 整合性 | PASS | **PASS** | A1 で CLAUDE.md ルール、C1 で `.gitignore` 整合 |
| 運用性 | PASS | **PASS** | B1 で staging-first、E1 で rollback fail-fast |

## PASS / MINOR / MAJOR 判定

| 観点 | 判定 | 根拠 |
| --- | --- | --- |
| ラッパー経路 (A) | PASS | A1 採用済み |
| 順序 (B) | PASS | B1 採用済み |
| ローカル取扱 (C) | MINOR | `.gitignore` 除外確認の Phase 11 smoke test を必須項目化（→ Phase 4 テスト戦略に渡す） |
| 投入手段 (D) | PASS | D1 採用済み |
| rollback (E) | PASS | E1 採用済み |
| 値読取不能前提 | PASS | UT-26 機能確認に委譲済み |
| `--env` 漏れ事故 | MINOR | Phase 6 異常系で wrangler.toml と `--env` 値の grep 照合チェックを追加（→ Phase 6 に渡す） |
| 履歴汚染 | PASS | `set +o history` + op stdin pipe で 2 重防御 |
| `private_key` 改行 | PASS | stdin バイト透過で構造的に保全 |

**総合判定: PASS（MINOR 2 件は Phase 4 / Phase 6 で吸収）**

## MINOR 追跡テーブル

| MINOR ID | 指摘内容 | 解決予定 Phase | 解決確認 Phase |
| --- | --- | --- | --- |
| UT25-M-01 | `apps/api/.dev.vars` の `.gitignore` 除外確認を smoke test 必須項目化 | Phase 4 / Phase 11 | Phase 11 |
| UT25-M-02 | `--env` 漏れ事故シナリオを異常系テストに追加（`--env` 無しで実行 → top-level に投入されないことを確認） | Phase 6 | Phase 9 |

## NO-GO 条件 (Phase 4 着手禁止)

以下のいずれかに該当する場合、Phase 4 へ進めない:

- 4 条件のいずれかが MAJOR 判定
- A2（直接 wrangler）が設計に残存している
- B2（production-first）が手順に残存している
- 投入経路が tty インタラクティブ入力のみ（自動化不可）
- rollback 経路が「上書き put のみ」で fail-fast が無い
- `apps/api/.dev.vars` の `.gitignore` 除外確認手順が無い
- `wrangler secret list` の name 確認手順が無い

## Phase 13 blocked 条件 (実投入禁止)

以下のいずれかが満たされない場合、Phase 13 でユーザー承認後も実 `wrangler secret put` を実行しない:

- UT-03 が completed でない（参照側コードが無い）
- 1Password に SA JSON が保管されていない（投入元が無い）
- apps/api Workers staging / production が作成されていない（`--env` 切替先が無い）
- `apps/api/.dev.vars` が `.gitignore` 除外されていない（誤コミット leak リスク）
- staging への投入と name 確認が PASS していない（production 単独 GO 禁止）

## 簡素化検討

| 検討項目 | 結論 |
| --- | --- |
| ラッパー経由を緩和できるか | **NO**。CLAUDE.md ルール直結 |
| staging スキップ可能か | **NO**。production 直行は運用性 MAJOR |
| `.dev.vars` を省略可能か | 開発者次第（ローカル wrangler dev を使わなければ省略可）。但し UT-25 仕様書には設定手順を残す |
| evidence ファイルを 1 つに統合できるか | **NO**。staging / production 別管理（bulk 化禁止） |
| rollback runbook を deploy runbook に merge できるか | **NO**。緊急時の参照性を下げないため別ファイル維持 |

## Phase 4 着手条件

- [x] 代替案 A〜E がすべて評価済み
- [x] 4 条件再評価で全 PASS
- [x] MINOR 2 件が追跡テーブルに登録され解決 Phase が決定
- [x] NO-GO 条件のいずれにも該当しない
- [x] Phase 13 blocked 条件が明文化されている

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 4 | MINOR UT25-M-01 を smoke test 計画に組み込み |
| Phase 6 | MINOR UT25-M-02 を異常系テストに組み込み |
| Phase 9 | MINOR 解決確認の最終ゲート |
| Phase 11 | `.gitignore` 除外確認 + staging name 確認の手動 smoke 実走 |
| Phase 13 | blocked 条件をユーザー承認チェックリストに転記 |

## 多角的チェック観点（AIが判断）

- A1〜E1 採用の根拠が CLAUDE.md ルール / 4 条件 / 運用性に紐付いているか。
- 簡素化検討で「省略可能」と判定された項目が AC を毀損していないか。
- MINOR 追跡テーブルに解決 Phase が空欄の項目が無いか。
- NO-GO 条件が代替案不採用パスを構造的に block しているか。
- Phase 13 blocked 条件が UT-03 / 01b / 01c の前提充足を gate 化しているか。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 代替案 A〜E 比較 | 3 | completed | 5 案すべて評価 |
| 2 | 4 条件再評価 | 3 | completed | 全 PASS 維持 |
| 3 | PASS/MINOR/MAJOR 判定 | 3 | completed | MINOR 2 件 |
| 4 | NO-GO 条件 | 3 | completed | Phase 4 ゲート |
| 5 | Phase 13 blocked 条件 | 3 | completed | 実投入ゲート |
| 6 | 簡素化検討 | 3 | completed | 5 項目 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| レビュー | outputs/phase-03/main.md | 代替案比較 / PASS/MINOR/MAJOR 判定 / NO-GO / Phase 13 blocked / 簡素化検討 |
| メタ | artifacts.json | Phase 3 状態の更新 |

## 完了条件

- [x] 代替案 A〜E がすべて表形式で比較されている
- [x] 4 条件再評価が全 PASS
- [x] MINOR 2 件が追跡テーブルに登録（UT25-M-01 / UT25-M-02）
- [x] NO-GO 条件が列挙されている
- [x] Phase 13 blocked 条件が列挙されている
- [x] 簡素化検討が完了している
- [x] Phase 4 着手条件が満たされている

## タスク100%実行確認【必須】

- 全実行タスク（7 件）が `completed`
- 全成果物が `outputs/phase-03/` 配下に配置済み
- 4 条件再評価で MAJOR が 0 件
- artifacts.json の `phases[2].status` が `completed`

## 次 Phase への引き渡し

- 次 Phase: 4 (テスト戦略)
- 引き継ぎ事項:
  - 採用設計 = A1 / B1 / C1 / D1 / E1
  - MINOR UT25-M-01（`.gitignore` 除外確認）→ Phase 4 / Phase 11
  - MINOR UT25-M-02（`--env` 漏れ事故）→ Phase 6
  - Phase 13 blocked 条件をユーザー承認チェックリストに転記する責務は Phase 12 / 13
- ブロック条件:
  - 4 条件のいずれかに MAJOR が残る
  - 代替案不採用パスが手順に残存
  - MINOR の解決 Phase が未指定
  - NO-GO 条件のいずれかに該当
