# Phase 8: リファクタリング — cf-token-env-contract-and-rotation-retirement

## 目的

Phase 4〜7 の実装（A1〜A5 / B1〜B4）が landed した後、構造的負債・命名不整合・責務重複を点検し、最小差分で整える。本タスクは CI / インフラ層（TypeScript verifier + GitHub Actions workflow + bash + runbook）であり、UI / navigation drift の対象を持たない。リファクタリングは「機能を変えずに構造を整える」ことに限定し、AC-1〜AC-8 の挙動を不変に保つ。

> 本サイクルは `implemented_local_evidence_captured`（実装は本サイクル）。本 phase は本実行サイクルが実施するリファクタリング観点の**事前仕様**として記述する。実コードへの変更は本サイクルでは行わない。

## リファクタリング項目（対象 / Before / After / 理由）— FB-RT-03

| 対象 | Before | After | 理由 |
| ---- | ------ | ----- | ---- |
| `runtime-smoke-staging.yml` の secret 検証 step | 単一ループで全 secret を hard-fail 判定（`STAGING_*` も CF token も区別なく `exit 1`） | 「前提 input（`STAGING_API_BASE` / `STAGING_ADMIN_BEARER` / `CLOUDFLARE_ACCOUNT_ID`）= hard-fail」「CF token（`CLOUDFLARE_API_TOKEN`）= degrade-skip」の 2 区分ループへ分離 | AC-2 / AC-3 を満たす。前提依存と任意依存の責務を step 内で明示分離し、degrade 範囲を token 欠落に限定 |
| degrade フラグ命名 | （新規導入時に `CF_DEGRADED` / `RUNTIME_SMOKE_CF_SKIP` 等の揺れが生じうる） | `verify-bulk-inputs.outputs.cf_degraded` に統一 | 既存 `RUNTIME_SMOKE_MINT_DEGRADED` と同一 prefix・同一サフィックス（`_DEGRADED`）で `RUNTIME_SMOKE_*_DEGRADED` 命名空間を一貫させる（FB-01） |
| 後続 step の `if:` 条件 | mint degrade のみ考慮（`env.RUNTIME_SMOKE_MINT_DEGRADED != '1'`） | `env.RUNTIME_SMOKE_MINT_DEGRADED != '1' && steps.verify-bulk-inputs.outputs.cf_degraded != '1'` へ AND 拡張 | 2 つの degrade フラグを直交（independent）に評価。どちらかが立てば skip という単純規則に統一 |
| `provision-staging-secrets.sh` の `SECRETS` 配列 | `CLOUDFLARE_API_TOKEN` 欠落 | `CLOUDFLARE_API_TOKEN:op://Employee/ubm-hyogo-env/CLOUDFLARE_API_TOKEN_STAGING_RUNTIME_SMOKE` を 1 行追加（`CLOUDFLARE_ACCOUNT_ID` は repo var のため非追加・コメントで明記） | AC-1。投入正本の単一ギャップ解消。inventory 検証ループが追加分を自動網羅 |
| 新 verifier の workflow パーサ | （`verify-mint-env-contract.mts` の正規表現を流用コピーする誘惑） | 別ファイル `verify-runtime-smoke-secret-contract.mts` に独立実装（後述の設計判断参照） | 責務分離。共通化しない（下記「設計判断」を参照） |
| `cf-token-rotation-reminder.yml` | 90日カレンダーローテ reminder が存在し `CF_TOKEN_ISSUED_AT` var を参照 | `git rm` で削除。参照元消滅により var は dead に | B1 / AC-5。event-based 失効へ移行しカレンダー儀式を撤廃 |
| 旧 runbook `cf-token-rotation-runbook.md` | ローテ手順が現役正本として記述 | 冒頭に `RETIRED` tombstone を追記し本文は監査履歴として保持 | B3。履歴を破壊せず後継 runbook へ誘導 |

## 設計判断: 新 verifier を `verify-mint-env-contract.mts` と共通化しない

`verify-runtime-smoke-secret-contract.mts`（新規）と `verify-mint-env-contract.mts`（既存）は、いずれも「workflow YAML / provision script から name を正規表現で抽出する」処理を持つため、一見すると共通ユーティリティへ抽出して DRY 化したくなる。しかし本タスクでは**意図的に共通化しない**（別ファイルに独立実装する）。根拠は以下。

| 比較軸 | `verify-mint-env-contract.mts`（既存） | `verify-runtime-smoke-secret-contract.mts`（新規） |
| ------ | ----------------------------------- | --------------------------------------------- |
| 検査対象 | mint step（`mint-staging-bearers.mts` 呼び出し）の `--roles` ↔ ME/ADMIN env 要求の整合 | workflow 全体が消費する `secrets.<NAME>` ⊆ provisioned ∪ documented legacy exemptions |
| 正規表現の意味 | role-scoped env 要求の抽出（`ROLE_REQUIRED_ENV` 集合との突合） | 全 secret 参照の抽出（重複排除のみ） |
| 変更頻度の連動性 | mint の role 契約変更時に追従 | provisioning 正本 / secret 追加時に追従 |
| 失敗の意味（violation kind） | mint env 契約 drift | `missing_provision`（投入正本ギャップ） |

- **責務が異なる**: 抽出する「name」の意味論が違う（role-required env vs 消費 secret 全体）。表層の正規表現が似ていても、抽出後の照合ロジック・violation 種別・追従すべき変更イベントが異なる。共通化すると「mint の都合で secret gate が壊れる / secret の都合で mint gate が壊れる」結合が生じる。
- **AC-7 の不変条件**: `verify-mint-env-contract.mts` / `.yml` は変更しないことが受入条件。共通ユーティリティ抽出は既存 verifier の import 先を書き換える=AC-7 違反になる。
- **共通化のコスト > 便益**: 抽出される共通部分は「`secrets.<NAME>` を grep する 1〜2 行の正規表現」に過ぎず、共有モジュール新設・両 verifier の依存追加・テスト二重化のコストに見合わない。Rule of Three（重複3回で初めて抽象化）にも満たない（2 箇所）。

→ **結論: 責務分離のため意図的に別ファイル（共通化しない）。** 正規表現パターンは参考にする（pattern reuse）が、コード依存（module reuse）は作らない。この判断は Phase 2「既存資産の再利用可否」の「部分再利用（参照のみ）」と整合する。

## degrade フラグ命名の一貫性確認（`RUNTIME_SMOKE_*_DEGRADED`）

| フラグ | 立つ条件 | skip 対象 | 直交性 |
| ------ | -------- | --------- | ------ |
| `RUNTIME_SMOKE_MINT_DEGRADED`（既存） | bearer mint 失敗 | mint 依存 step | CF と独立 |
| `verify-bulk-inputs.outputs.cf_degraded`（新規） | `CLOUDFLARE_API_TOKEN` 欠落 | D1 直読を伴う smoke step | mint と独立 |

- prefix `RUNTIME_SMOKE_`・suffix `_DEGRADED` を揃え、新 primitive（別命名規則）を生やさない。
- 2 フラグは独立（直交）評価。後続 step は `MINT != '1' && CF != '1'` の AND で実走条件を判定する。どちらかが degrade なら skip という単純規則に閉じる。
- 命名空間が一貫しているため、将来 3 つ目の degrade 要因が増えても `RUNTIME_SMOKE_<CAUSE>_DEGRADED` で機械的に拡張できる。

## navigation / UI drift 点検

- 本タスクは CI / インフラ層のみで、ユーザー導線・画面・ルーティングを一切変更しない。
- navigation drift / dead link / プロトタイプ整合の対象成果物は存在しない。
- runbook（markdown）の相互リンク（旧 runbook tombstone → 新 runbook、新 runbook → log）は Phase 9 の `grep -rn "cf-token-rotation-reminder"` stale 参照ゼロ検証で別途担保する。

→ **navigation drift: なし（CI / インフラタスクのため対象外）。**

## 重複・dead code 点検

| 点検対象 | 結果 |
| -------- | ---- |
| `cf-token-rotation-reminder.yml` 削除後の `CF_TOKEN_ISSUED_AT` var | 唯一の参照元が消えるため dead。runbook B2 に「reminder 撤廃により本 var は未参照」と記録（var 自体の削除は GitHub 設定操作=user-gated・本サイクルのコード対象外） |
| 新 verifier と既存 verifier の正規表現 | 重複は表層のみ・責務分離のため意図的に非共通化（上記設計判断） |
| degrade パターン | 既存 `RUNTIME_SMOKE_MINT_DEGRADED` を踏襲し新パターンを増やさない |

## 完了条件

- [ ] リファクタリング項目を `対象 / Before / After / 理由` テーブル（FB-RT-03）で記録した。
- [ ] 新 verifier を既存 `verify-mint-env-contract.mts` と共通化しない設計判断を、責務分離・AC-7・Rule of Three の3観点で記録した。
- [ ] degrade フラグ命名の一貫性（`RUNTIME_SMOKE_*_DEGRADED`）と直交性を確認した。
- [ ] navigation drift なし（CI / インフラタスク）を確認した。
- [ ] dead code（`CF_TOKEN_ISSUED_AT` var）の扱いを記録した。

> 注: 本 phase は implemented_local_evidence_captured のため実コード変更は伴わず、チェックボックスは本実行サイクルでの達成項目を表す。
