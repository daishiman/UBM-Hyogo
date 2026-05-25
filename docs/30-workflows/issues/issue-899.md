# [#899] "[ci-green-recovery-followup-001-static-bearer-fallback-retirement] 静的 bearer fallback 撤去（mint 方式恒久化）"

## メタ情報

```yaml
task_id: ci-green-recovery-followup-001-static-bearer-fallback-retirement
task_name: 静的 bearer fallback 撤去（mint 方式恒久化）
category: 運用簡素化/CI hardening
target_feature: runtime-smoke-staging bearer 供給
priority: 中
scale: 小規模
status: 未実施
source_phase: docs/30-workflows/ci-green-recovery-smoke-coverage-shard/outputs/phase-12/unassigned-task-detection.md（2回目検証 follow-up）
created_date: 2026-05-23
dependencies: []
spec_path: docs/30-workflows/unassigned-task/ci-green-recovery-followup-001-static-bearer-fallback-retirement.md
```

| 項目 | 内容 |
|------|------|
| 優先度 | 中 |
| 規模 | 小規模 |
| ステータス | 未実施 |

---
## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

親タスク `ci-green-recovery-smoke-coverage-shard`（Lane A）は、`runtime-smoke-staging.yml` の admin / me bearer を「実行毎に短命 JWT を mint する方式」へ移行した。GitHub 環境 secret に静的保存していた bearer は `SESSION_JWT_TTL_SECONDS = 86400`（24h TTL）の HS256 session JWT であり、24h で必ず失効して `runtime-smoke-staging / smoke` の `admin-list` が 401（`reason=auth-token-invalid-or-expired`）になっていた。mint 方式は署名鍵 `STAGING_AUTH_SECRET` から smoke 実行毎に TTL=600s の JWT を発行するため、失効が原理的に起きない。

ただし即時運用復旧経路を壊さないため、後方互換 fallback を **暫定的に** 残している。`STAGING_AUTH_SECRET` 未設定時は `mint staging bearers` step が `if: env.STAGING_AUTH_SECRET != ''` で skip され、静的 secret（`STAGING_ADMIN_BEARER` / `STAGING_ME_BEARER`）がそのまま使われる（AC-4）。

中学生向けに説明すると、これは「鍵を毎回その場で作る新方式」と「金庫に作り置きしておいた古い鍵を使う旧方式」が両方残っている状態。新方式が確実に動くと確認できたら、24h で腐る作り置きの鍵（旧方式）を捨て切るのがこの follow-up の仕事。

### 1.2 問題点・課題

`if: env.STAGING_AUTH_SECRET != ''` 分岐（`.github/workflows/runtime-smoke-staging.yml:39,45`）と静的 secret 参照（同 `:29,31`）が残っている限り、24h TTL 失効という障害クラスは「fallback に落ちた瞬間」に再燃する。fallback は本来 mint secret 投入までの暫定経路だが、撤去条件を明文化しないと永久に残り、stale-secret 障害クラスが温存される。

### 1.3 放置した場合の影響

- `STAGING_AUTH_SECRET` が将来何らかの理由で空になる（rotation 事故・誤削除等）と、CI は黙って fallback の静的 bearer 経路に落ち、24h 後に再び 401 で赤化する。緑だった smoke が突然落ちる「無音 fallback」は原因切り分けに時間を要する。
- 静的 secret が GitHub 環境に残り続けることで、不要な長命シークレットが棚卸し対象として残る（UT-GOV-002 secrets inventory の負債）。

---

## 2. 何を達成するか（What）

### 2.1 目的

mint 方式が staging CI で green であることが確認できた後に、静的 bearer fallback 経路と静的 secret を撤去し、`STAGING_AUTH_SECRET` 未設定時は fail-fast させることで、24h TTL 失効という障害クラスを恒久的に除去する。

### 2.2 スコープ（スコープ外も明記）

#### 含むもの

- `.github/workflows/runtime-smoke-staging.yml` の `if: env.STAGING_AUTH_SECRET != ''` 条件分岐（`:39` setup project / `:45` mint staging bearers）の撤去。
- 静的 bearer を参照する env（`STAGING_ADMIN_BEARER`: `:29` / `STAGING_ME_BEARER`: `:31`）の撤去。
- mint helper（`scripts/smoke/mint-staging-bearers.mts` 経由の step）を必須経路へ昇格し、`STAGING_AUTH_SECRET` 未設定時は明示エラーで fail-fast させる（黙って fallback に落ちない）。
- GitHub 環境 secret `STAGING_ADMIN_BEARER` / `STAGING_ME_BEARER` の物理削除（user-gated 操作。手順を runbook に追記）。
- 親タスク runbook `docs/30-workflows/completed-tasks/ci-secret-alignment-and-runtime-smoke-recovery/runbooks/secret-provisioning.md` の fallback 記述（`### 後方互換 fallback を残す理由` ほか）を撤去後の状態へ更新。

#### 含まないもの

- `/me` endpoint のロジック変更（親タスク不変条件 / U-4）。
- coverage 系（Lane B / Lane C）の変更。
- production smoke（現状 production smoke workflow は存在しない）。
- mint した bearer の `::add-mask::` → `GITHUB_ENV` export の redaction シーケンス変更（不変条件として維持）。

---

## 3. どのように実行するか（How）

### 3.1 推奨アプローチ（具体的な workflow diff 方針・step）

1. **前提検証**: `runtime-smoke-staging / smoke` が mint 経路（`STAGING_AUTH_SECRET` 設定済み）で 1 回以上 green を記録していることを CI run 履歴で確認する（U-1 / U-5 完了の確認）。green 実績が無ければ着手しない（3.2 順序制約）。
2. **env から静的 bearer 削除**: `runtime-smoke-staging.yml:29` の `STAGING_ADMIN_BEARER` と `:31` の `STAGING_ME_BEARER` の `job.env` 定義を削除する。mint step が `GITHUB_ENV` へ export する変数名（`STAGING_ADMIN_BEARER` / `STAGING_ME_BEARER`）は維持されるため、後続 `verify required staging secrets`（`:70-`）と smoke 本体はそのまま動く。
3. **条件分岐の撤去**: `setup project`（`:39`）と `mint staging bearers`（`:45`）の `if: env.STAGING_AUTH_SECRET != ''` を削除し、両 step を常時実行に変える。
4. **fail-fast の昇格**: `mint staging bearers` step の冒頭、または専用の `require STAGING_AUTH_SECRET` step で `STAGING_AUTH_SECRET` 未設定時に `::error::` を出して `exit 1` する。これにより未設定時に黙って静的 bearer 経路へ落ちる挙動を排除する。
5. **redaction 不変条件の保全**: mint step の `mint → ::add-mask:: → GITHUB_ENV export` を 1 step 内に閉じたまま維持し、export 前に必ず mask を適用する（不変条件 3）。step 分割で mask 適用前に値が露出する変更を入れない。
6. **静的 secret 物理削除（user-gated）**: GitHub 環境 `staging-runtime-smoke` から `STAGING_ADMIN_BEARER` / `STAGING_ME_BEARER` を削除する手順を runbook に追記し、ユーザー承認後に `gh secret delete STAGING_ADMIN_BEARER --env staging-runtime-smoke` 等を実行する。実行は本仕様の作成時点では行わない。
7. **runbook 更新**: `secret-provisioning.md` の `### 後方互換 fallback を残す理由` / `### 即時運用復旧（mint 導入前に今すぐ緑にしたい場合）` を撤去後の状態に書き換え、`STAGING_ADMIN_BEARER` / `STAGING_ME_BEARER` を「投入対象」から外し、削除手順を追記する。

### 3.2 前提条件・順序制約

- **mint green 必須前提**: `STAGING_AUTH_SECRET` ほか mint secret が staging に投入され、`runtime-smoke-staging / smoke` が mint 経路で green を 1 回以上記録していること（親 phase-12 の U-1 / U-5 完了）。green 実績なしに fallback を撤去・secret を削除すると CI が即赤化するため、この順序は逆転不可。
- **削除順序**: 「workflow から fallback 撤去 → mint 経路で再度 green 確認 → 静的 secret 物理削除」の順を守る。secret を先に削除すると、撤去 PR がマージ前に走る既存 workflow が fallback も mint も使えず落ちる可能性がある。
- 親タスク `ci-green-recovery-smoke-coverage-shard` の Lane A がマージ済みであること。

---

## 4. 苦戦箇所（将来の課題解決のための知見）

| # | 苦戦点 | 内容 |
| --- | --- | --- |
| 1 | 即時運用復旧と恒久対策の両立 | mint 化が恒久解決だが、secret 投入前に既存の静的 bearer 経路を壊すと即時の CI 復旧手段を失う。そのため親タスクは fallback を「暫定的に」残す二段構えにした（`runtime-smoke-staging.yml:39,45` の `if`）。この follow-up はその暫定経路を畳む後始末であり、「いつ畳んでよいか（mint green 観測後）」の判定条件を明文化しないと fallback が永久に残り stale-secret クラスが再燃する。本仕様 3.2 の mint green 必須前提がその判定条件の正本。 |
| 2 | secret 物理削除の不可逆性 | `STAGING_ADMIN_BEARER` / `STAGING_ME_BEARER` を削除すると fallback が使えなくなるため、mint 経路の green 実績なしに削除すると CI が即赤化する。削除前に mint green を必須前提とする順序制約（3.2）がある。削除と workflow 撤去の順序も逆転不可。 |
| 3 | JWT 平文露出レース | mint した bearer は `mint → ::add-mask:: → GITHUB_ENV export` を 1 step に閉じて露出レースを防いでいる（`runtime-smoke-staging.yml:42-67`、CLAUDE.md シークレット管理 / 不変条件 3）。撤去・step 整理時もこの redaction 不変条件を壊さず、mask 適用前に JWT 値が log / GITHUB_ENV に出る経路を作らないこと。 |

---

## 5. 完了条件チェックリスト

- [ ] mint 経路（`STAGING_AUTH_SECRET` 設定済み）で `runtime-smoke-staging / smoke` が 1 回以上 green を記録していることを確認した（着手前提）。
- [ ] `runtime-smoke-staging.yml` の `job.env` から `STAGING_ADMIN_BEARER`（`:29`）/ `STAGING_ME_BEARER`（`:31`）を削除した。
- [ ] `setup project`（`:39`）/ `mint staging bearers`（`:45`）の `if: env.STAGING_AUTH_SECRET != ''` 条件分岐を撤去し、常時実行にした。
- [ ] `STAGING_AUTH_SECRET` 未設定時に `::error::` + `exit 1` で fail-fast する経路を追加した（黙って静的 bearer に落ちない）。
- [ ] mint step の `mint → ::add-mask:: → GITHUB_ENV export` redaction シーケンスを 1 step 内に維持した（不変条件 3 非破壊）。
- [ ] `secret-provisioning.md` の fallback / 即時運用復旧記述を撤去後の状態に更新し、静的 bearer の削除手順を追記した。
- [ ] GitHub 環境 secret `STAGING_ADMIN_BEARER` / `STAGING_ME_BEARER` の物理削除手順（user-gated）を runbook に記載した。
- [ ] `/me` endpoint / coverage 系 / production smoke に変更を加えていない（スコープ外不変）。
- [ ] workflow 撤去 → mint 経路 green 再確認 → 静的 secret 物理削除 の順序を守った。

---

## 6. 参照情報

### 親タスク

- `docs/30-workflows/ci-green-recovery-smoke-coverage-shard/index.md`（採用方針 Lane A / 根本原因サマリ）
- `docs/30-workflows/ci-green-recovery-smoke-coverage-shard/outputs/phase-12/implementation-guide.md`
- `docs/30-workflows/ci-green-recovery-smoke-coverage-shard/outputs/phase-12/unassigned-task-detection.md`（U-1 / U-2 / U-5）

### 該当ファイル / 行

- `.github/workflows/runtime-smoke-staging.yml:29`（`STAGING_ADMIN_BEARER` env 定義）
- `.github/workflows/runtime-smoke-staging.yml:31`（`STAGING_ME_BEARER` env 定義）
- `.github/workflows/runtime-smoke-staging.yml:39`（`setup project` step の `if: env.STAGING_AUTH_SECRET != ''`）
- `.github/workflows/runtime-smoke-staging.yml:45`（`mint staging bearers` step の `if: env.STAGING_AUTH_SECRET != ''`）
- `.github/workflows/runtime-smoke-staging.yml:42-67`（mint → mask → GITHUB_ENV export シーケンス）
- `scripts/smoke/mint-staging-bearers.mts`（mint helper）

### runbook

- `docs/30-workflows/completed-tasks/ci-secret-alignment-and-runtime-smoke-recovery/runbooks/secret-provisioning.md`
  - `### CI 実行時 mint 方式（推奨・失効しない bearer 供給）`
  - `### 後方互換 fallback を残す理由`（撤去対象）
  - `### 即時運用復旧（mint 導入前に今すぐ緑にしたい場合）`（撤去対象）

### 関連 governance

- `UT-GOV-002-OBS-secrets-inventory-automation`（不要長命 secret の棚卸し）
- CLAUDE.md `## シークレット管理`（bearer 実値の AI 入力禁止 / redaction 不変条件）
