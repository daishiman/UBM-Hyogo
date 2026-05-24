# Phase 10: 最終レビュー

PR（Phase 13）へ進む前の最終ゲート。Phase 1（`phase-1-requirements.md`）の AC-1〜AC-9 を正本とし、1 つずつ充足判定する。本サイクルではローカルで確認可能な AC は PASS、remote CI / secret 投入に依存する AC は user-gated runtime pending として分離する。

---

## 1. 受入条件（AC-1〜AC-9）充足判定表

> 判定は実装完了時に埋める。本仕様では各 AC の「充足を主張するために提示すべき証跡（evidence）」と「PASS とみなす基準」を定義する。

| AC | lane | 内容（要約） | 充足判定の根拠（expected evidence） | PASS 基準 |
|---|---|---|---|---|
| AC-1 | A | `admin-list` が 200 + `.members\|type=="array"`、me 系も PASS。失効が原理的に起きない供給 | runtime-smoke-staging の `admin-list`/`me-*` PASS ログ（Phase 11 代替証跡）。mint step が TTL=600s の JWT を発行する workflow 構造 | 4 チェック全 PASS かつ bearer が静的 secret ではなく mint 由来であること |
| AC-2 | A | mint admin JWT=`isAdmin:true` / me JWT=`isAdmin:false` が `verifySessionJwt` 通過 | G-3 parity test PASS（Phase 9） | parity test 全 case green |
| AC-3 | A | secret / 鍵 / JWT が log・成果物・docs に平文で出ない | G-9 redaction grep gate（Phase 9 §4）C-1〜C-5 | 全 C 項目 0 件、`::add-mask::` 構造あり |
| AC-4 | A | `STAGING_AUTH_SECRET` 未設定で静的 bearer fallback が動く | workflow の mint step `if:` 条件 + fallback 経路。fallback シナリオの目視/ドライ確認 | 鍵未設定時に mint skip → 既存静的 bearer 使用に分岐 |
| AC-5 | C | ci.yml に top-level `contents: read`、shard checkout に明示 token、workflow lint | G-5 actionlint + §3 突合（Phase 9） | token 明示、permissions 縮退なし。local actionlint は command not found のため未実行 |
| AC-6 | B/C | shard PASS 時に `coverage-gate` が 4 package の summary 検出し exit 0 | shard 全成功 run で coverage-gate green | `--no-run` が MISSING を出さず exit 0 |
| AC-7 | B/C | shard 失敗時は MISSING ではなく「upstream shard X failed」を先に出して fail | step 順序入れ替え（Fail closed が `--no-run` の前）+ メッセージ強化 | shard 失敗時の log 先頭に upstream 失敗メッセージ、MISSING 誤検知なし |
| AC-8 | 全体 | required status context 名（`coverage-gate` / `runtime smoke staging / smoke`）不変 | §3 context 名不変確認 | branch protection の required context と一致、job 名/workflow 名の変更なし |
| AC-9 | 全体 | typecheck / lint / unit 全 PASS | G-1/G-2/G-3/G-4（Phase 9） | 4 gate 全 exit 0 |

---

## 2. blocker 有無の判定基準

| 区分 | 該当条件 | 対応 |
|---|---|---|
| **BLOCKER** | AC-1/AC-2/AC-3/AC-5/AC-7/AC-9 のいずれかが FAIL | PR を作らず Phase 5/8/9 へ差し戻し |
| **NON-BLOCKER（条件付き可）** | AC-4 の fallback がドライ確認止まり（実環境で鍵未設定を再現できない） | fallback の構造的成立を workflow 上で確認できれば可。実再現はユーザー運用 |
| **運用 gated（本 PR スコープ外）** | secret 5 種の実投入・即時再発行の実行 | runbook 手順記載のみ。実行はユーザー承認後（index.md スコープ外条項） |

> 設計時点で BLOCKER は想定なし（Phase 3 で CRITICAL/HIGH 指摘はすべて設計反映済み）。実装後に新規 blocker が出た場合は本表に追記して差し戻す。

---

## 3. required status context 名 不変の確認

| 確認項目 | expected |
|---|---|
| `coverage-gate` job 名 | ci.yml で job 名・job が生成する status context 名が変更されていない |
| `coverage-gate-shard (packages)` | matrix job 名・context 名が不変（checkout token 追加は context 名に影響しない） |
| `runtime smoke staging / smoke` | runtime-smoke-staging.yml の workflow 名 / job 名が不変（mint step 追加は context 名に影響しない） |
| branch protection 突合 | `gh api repos/{owner}/{repo}/branches/dev/protection` の required_status_checks contexts と job 名が一致（read-only 確認のみ。変更しない） |

> step の追加・並べ替え・permissions 追加は status context 名を変えない。job 名 / workflow 名 / matrix 値のみが context 名に影響するため、それらを触っていないことを確認する。

---

## 4. secret 非転記の最終確認

| 確認項目 | expected |
|---|---|
| 仕様書（本ワークフロー docs 全体） | secret 実値・JWT 文字列・署名鍵が 0 件（不変条件 3） |
| runbook（secret-provisioning.md） | op 参照（`op://...`）と手順のみ。実値転記なし |
| mint helper / workflow / runner | console echo・log への bearer/鍵出力経路なし（Phase 9 G-9 と二重確認） |
| PR 本文（Phase 13） | 実値・鍵・JWT を含めない。`::add-mask::` 方針を文章で説明するに留める |

---

## 5. 最終レビュー総合判定

| 観点 | expected 結論 |
|---|---|
| AC-1〜AC-9 | 全 PASS（§1 の基準を満たすこと） |
| blocker | なし（§2） |
| required context 名 | 不変（§3） |
| secret 非転記 | 遵守（§4） |
| 因果ループ解消 | 強化ループ（bearer 失効）/ バランスループ（MISSING 誤検知）の両方が構造的に閉じた（Phase 3 §2） |

上記すべてが満たされた場合のみ Phase 11（手動テスト・代替証跡）→ Phase 12（ドキュメント）→ Phase 13（PR、ユーザー承認後）へ進む。

---

## 6. 完了条件（DoD）

- [ ] AC-1〜AC-9 を 1 つずつ充足判定する表があり、各 AC に evidence と PASS 基準が定義されている
- [ ] blocker 有無の判定基準が定義されている
- [ ] required status context 名 不変の確認手順がある
- [ ] secret 非転記の最終確認手順がある
- [ ] すべて「実行結果」ではなく「expected なレビュー観点」として記述されている

## 成果物

- `outputs/phase-10/final-review.md`（本 Phase の確定事項サマリ）
