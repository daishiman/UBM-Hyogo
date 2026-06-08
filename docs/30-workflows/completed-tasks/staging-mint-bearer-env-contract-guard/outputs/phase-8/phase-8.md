# Phase 8: リファクタリング（Lane-3 / 対策C: provision script 整合 + 重複削減）

> 前提: [index.md](../../index.md)（§2 対策 C / §3 AC-7・AC-9）, [phase-1.md](../phase-1/phase-1.md), [phase-2.md](../phase-2/phase-2.md)（§2.4 対策C provision / §2.3 対策B drift gate / §2.7 状態所有権）, [phase-5.md](../phase-5/phase-5.md)（§5.5 workflow 配線）, [phase-6.md](../phase-6/phase-6.md)（V-3 provision_gap）。
> 本 phase は **Lane-3** の担当で、対策 C（`provision-staging-secrets.sh` を JWT-mint secret 集合へ整合）と、対策B（drift gate）との責務重複が無いことの確認を確定する。
> 区分: 実装仕様書（CONST_004）/ NON_VISUAL / ci-script。証跡は `bash -n` + `shellcheck` + verify gate（Phase 9）。

---

## 8.1 リファクタリングの目的（1 文）

`provision-staging-secrets.sh` の provision 対象 secret 集合が、mint script（対策A）が JWT-mint で要求する env 集合（`STAGING_AUTH_SECRET` / 各 role の `*_MEMBER_ID` / `*_EMAIL`）を含まず、static-bearer 旧集合に留まっている **drift（RC-3）を解消**する。同時に、対策B の drift gate（V-3 provision_gap）との責務境界を確認し、検証ロジックの二重実装を作らない。

---

## 8.2 変更対象ファイル（CONST_005: 変更ファイルパス・種別）

| パス | 変更種別 | 対策 | 概要 |
|------|----------|------|------|
| `scripts/smoke/provision-staging-secrets.sh` | **編集** | C | `SECRETS` 配列を JWT-mint 集合へ整合。旧 static-bearer は fallback 用に明示コメントで分離。`verify_staging_marker` / `ensure_environment` / inventory 検証ロジックは無改変で維持 |

> 本 phase は provision script のみ対象。`mint-staging-bearers.mts`（Lane-1 / Phase 5）・`verify-mint-env-contract.mts`（Lane-2 / Phase 6-7）・workflow yml（Lane-1 / Phase 5）には触れない。

---

## 8.3 `SECRETS` 配列の変更（対象 / Before / After / 理由 テーブル / Feedback RT-03）

phase-2 §2.4 の新 `SECRETS` を逐語転記し、変更を行単位で記述する。**JWT-mint 集合 5 件を追加**（`STAGING_AUTH_SECRET` / `STAGING_ADMIN_MEMBER_ID` / `STAGING_ADMIN_EMAIL` / `STAGING_ME_MEMBER_ID` / `STAGING_ME_EMAIL`）し、**旧 static-bearer 3 件はコメントで明示分離して残す**。

| # | 対象（entry NAME） | Before | After | 理由 |
|---|--------------------|--------|-------|------|
| 1 | `STAGING_API_BASE` | `"STAGING_API_BASE:op://Employee/ubm-hyogo-env/STAGING_API_BASE"`（存在） | 同左（無改変） | smoke 共通の origin 指定。mint 関連でなく維持 |
| 2 | `STAGING_AUTH_SECRET` | **不在** | `"STAGING_AUTH_SECRET:op://Employee/ubm-hyogo-env/STAGING_AUTH_SECRET"`（追加） | JWT 署名鍵。全 role 共通必須（`COMMON_REQUIRED_ENV`）。mint script が無いと degrade/skip する根因（RC-3 / AC-9） |
| 3 | `STAGING_ADMIN_MEMBER_ID` | **不在** | `"STAGING_ADMIN_MEMBER_ID:op://Employee/ubm-hyogo-env/STAGING_ADMIN_MEMBER_ID"`（追加） | admin role の mint 必須 env（`ROLE_REQUIRED_ENV.admin`）。bulk-tag / smoke 両 job が admin mint に要求 |
| 4 | `STAGING_ADMIN_EMAIL` | **不在** | `"STAGING_ADMIN_EMAIL:op://Employee/ubm-hyogo-env/STAGING_ADMIN_EMAIL"`（追加） | admin role の mint 必須 env（`ROLE_REQUIRED_ENV.admin`） |
| 5 | `STAGING_ME_MEMBER_ID` | **不在** | `"STAGING_ME_MEMBER_ID:op://Employee/ubm-hyogo-env/STAGING_ME_MEMBER_ID"`（追加） | me role の mint 必須 env（`ROLE_REQUIRED_ENV.me`）。`smoke` job の admin,me mint に要求 |
| 6 | `STAGING_ME_EMAIL` | **不在** | `"STAGING_ME_EMAIL:op://Employee/ubm-hyogo-env/STAGING_ME_EMAIL"`（追加） | me role の mint 必須 env（`ROLE_REQUIRED_ENV.me`） |
| 7 | `SLACK_WEBHOOK_INCIDENT` | `"SLACK_WEBHOOK_INCIDENT:op://Employee/ubm-hyogo-env/SLACK_WEBHOOK_INCIDENT_STAGING"`（存在） | 同左（無改変） | 失敗通知 webhook。維持 |
| 8 | `STAGING_ADMIN_BEARER` | `"STAGING_ADMIN_BEARER:op://Employee/ubm-hyogo-env/STAGING_ADMIN_BEARER"`（存在・先頭付近） | 同左（**legacy コメントブロックへ移動**） | mint 不能時（degrade / `STAGING_AUTH_SECRET` 未配備）の static fallback。後方互換で残すが mint 集合と分離 |
| 9 | `STAGING_MEMBER_ID` | `"STAGING_MEMBER_ID:op://Employee/ubm-hyogo-env/STAGING_MEMBER_ID"`（存在） | 同左（**legacy コメントブロックへ移動**） | static fallback 用の member id。後方互換 |
| 10 | `STAGING_ME_BEARER` | `"STAGING_ME_BEARER:op://Employee/ubm-hyogo-env/STAGING_ME_BEARER"`（存在） | 同左（**legacy コメントブロックへ移動**） | static fallback 用の me bearer。後方互換 |

### 8.3.1 After の `SECRETS` 配列（phase-2 §2.4 逐語転記）

```bash
SECRETS=(
  "STAGING_API_BASE:op://Employee/ubm-hyogo-env/STAGING_API_BASE"
  "STAGING_AUTH_SECRET:op://Employee/ubm-hyogo-env/STAGING_AUTH_SECRET"
  "STAGING_ADMIN_MEMBER_ID:op://Employee/ubm-hyogo-env/STAGING_ADMIN_MEMBER_ID"
  "STAGING_ADMIN_EMAIL:op://Employee/ubm-hyogo-env/STAGING_ADMIN_EMAIL"
  "STAGING_ME_MEMBER_ID:op://Employee/ubm-hyogo-env/STAGING_ME_MEMBER_ID"
  "STAGING_ME_EMAIL:op://Employee/ubm-hyogo-env/STAGING_ME_EMAIL"
  "SLACK_WEBHOOK_INCIDENT:op://Employee/ubm-hyogo-env/SLACK_WEBHOOK_INCIDENT_STAGING"
)
```

> - **JWT-mint 集合を `SECRETS` の単一投入対象として並べ、legacy static-bearer 集合はコメントで「runtime fallback として受け付けるが、この script では provision しない」と明示分離する**。
> - 1Password 参照キー（`op://Employee/ubm-hyogo-env/<NAME>`）のみを記述する。**実値・実 item の存在は provision 実行者（user）の前提**であり、本仕様書には実値を記載しない（CLAUDE.md「シークレット管理」: 平文 `.env` 禁止 / 実値非記載）。
> - item 名が実在するかの確認は user 実行時の責務。仕様書では参照キーの形のみ確定する。

---

## 8.4 維持するロジック（無改変・自動追従の根拠）

| ロジック | 状態 | 自動追従の根拠 |
|----------|------|----------------|
| `verify_staging_marker()` | 無改変で維持 | `STAGING_API_BASE` が staging origin を指すかの marker 検証。secret 集合変更と独立 |
| `ensure_environment()` | 無改変で維持 | GitHub Environment（`staging-runtime-smoke`）の存在保証。集合変更と独立 |
| inventory 検証（`expected="$(printf '%s\n' "${SECRETS[@]}" | awk -F: '{print $1}' | sort)"`） | **subset 検証へ更新** | `SECRETS` 配列の NAME が live environment inventory にすべて含まれることを確認する。legacy static-bearer fallback や他 job 用 secret が live inventory に残っていても fail しない |
| secret 投入ループ（`op read "$ref" \| gh secret set ...`） | 無改変で維持 | `SECRETS` 配列を走査して投入。集合変更で自動的に新 secret も投入される |
| `usage()` の文面（"five GitHub environment secrets"） | **要更新（軽微）** | 件数が 5 → 10 へ変わるため、`usage()` 内の "five" 表記と "the five ..." の説明を件数非依存の表現（例: "the GitHub environment secrets required by `staging-runtime-smoke`"）へ修正。挙動には影響しないドキュメント整合 |

> **inventory 必須集合が自動追従するため、新規に集合定数を別途定義しない**。`SECRETS` 配列が provision カバー集合の単一の真実であり、二重定義を作らない（DRY / phase-2 §2.7 状態所有権「secret が provision 済みか = provision script + GitHub Environment」）。

---

## 8.5 重複削減 — 対策B（drift gate）との責務分離確認

Feedback RT-03 の「重複削減」観点で、対策B の `detectContractViolations` が provision カバー集合を解析することと、provision script の inventory 検証の **責務が重複していない**ことを確認する。

| 観点 | provision script の inventory 検証 | 対策B gate（`detectContractViolations` V-3） | 重複か |
|------|-----------------------------------|--------------------------------------------|--------|
| 何を検証するか | provision **実行後**に GitHub Environment に投入された secret 集合（`gh api .../secrets`）が、`SECRETS` 配列の必須集合をすべて含むか | **静的**に `provision-staging-secrets.sh` の `SECRETS` 配列から抽出した NAME 集合が、mint script が要求しうる全 env（全 role 合算）を**含むか** | **非重複** |
| 入力源 | GitHub API（実環境の secret 一覧） | `SECRETS` 配列のソース文字列（静的解析・`extractProvisionedSecrets`） | 異なる |
| 実行タイミング | provision **実行時**（user が実 secret 投入する副作用大の操作） | **PR / push 時**（CI gate・副作用なし） | 異なる |
| 失敗時の意味 | 「投入処理が期待通り完了したか」の事後確認 | 「provision 定義が mint 要求を満たすか」の事前 drift 検出 | 異なる |
| 責務カテゴリ | 実 secret 投入（副作用） | 静的契約検証（read-only） | 分離済み |

### 8.5.1 責務分離の結論

- **gate = 静的契約検証 / provision = 実 secret 投入** で責務が明確に分離されており、ロジックの重複は無い。
- 対策B の `extractProvisionedSecrets`（phase-7 §7.1）は `SECRETS` 配列を **静的にパースして NAME を取り出す**だけで、provision script 側の `awk`/`sort` による inventory 算出ロジックを再実装しない（同一ロジックの二重実装を避ける）。両者は同じ `SECRETS` 配列を**唯一の真実の源**として参照する点で整合する（一方は静的ソースから、一方は実行時 GitHub API から）。
- したがって対策C で provision script 側に「mint 要求を満たすかの追加検証コード」を入れない。その検証責務は対策B gate（V-3）が一手に担う。provision script は「定義した集合を確実に投入し、投入結果を inventory で自己検証する」責務のみを持つ。

---

## 8.6 入力・出力・副作用（CONST_005）

| 区分 | 内容 |
|------|------|
| 入力 | 1Password（`op read "op://Employee/ubm-hyogo-env/<NAME>"`）/ `gh auth`（write 権限）/ `STAGING_API_BASE` の staging marker |
| 出力 | stdout に secret **名のみ**（`set: <NAME>` / inventory 一覧 / `PASS: ...`）。**値・hash・fragment・webhook URL は一切出さない**（script 冒頭 Invariants） |
| 副作用 | **大**: GitHub Environment（`staging-runtime-smoke`）への secret 投入（`gh secret set`）と Environment 作成（`gh api -X PUT`）。**実 secret を実環境へ書き込む破壊的操作のため user が手動実行する**。Claude Code / 本仕様書はこの script を実行しない |
| 非露出保証 | `op read` の結果は直接 `gh secret set --body -` へパイプし、変数に保持して echo しない。`set -x`（xtrace）禁止（script 冒頭 Invariants） |

---

## 8.7 検証コマンド（CONST_005: 実行コマンド — dry 検証のみ）

provision の実行（実 secret 投入）は副作用が大きく user-gated。**本仕様書側で実行するのは副作用ゼロの静的検証のみ**。

```bash
# 構文 dry 検証（実行せず構文のみ確認・副作用なし）
bash -n scripts/smoke/provision-staging-secrets.sh

# shell lint（quoting / unused / SC 警告。副作用なし）
shellcheck scripts/smoke/provision-staging-secrets.sh
```

> `bash scripts/smoke/provision-staging-secrets.sh`（実投入）は **Phase 13 以降の user-gated 操作**。本 phase / Phase 9 の QA では実行しない（実 1Password 参照・実 GitHub Environment 書き込みが発生するため）。

---

## 8.8 DoD（完了条件 / Phase 8）

- [ ] `scripts/smoke/provision-staging-secrets.sh` の `SECRETS` が §8.3.1 の 10 entry（JWT-mint 5 + 既存 API_BASE/SLACK + legacy static-bearer 3）に整合し、legacy 集合がコメント `# --- legacy static-bearer fallback ... ---` で分離されている
- [ ] `verify_staging_marker` / `ensure_environment` / inventory 検証ループ・secret 投入ループが無改変で維持されている（inventory 期待集合は `SECRETS` 由来で自動追従）
- [ ] `usage()` の件数依存表記（"five"）が件数非依存表現へ修正されている（挙動非影響のドキュメント整合）
- [ ] 1Password 参照キーのみ記載し、実値・実 item の存在は user 前提（CLAUDE.md 平文禁止遵守）
- [ ] 対策B gate（`detectContractViolations` V-3 / `extractProvisionedSecrets`）と provision inventory 検証の責務分離が §8.5 の通り確認され、検証ロジックの二重実装が無い
- [ ] `bash -n scripts/smoke/provision-staging-secrets.sh` PASS（構文 OK）
- [ ] `shellcheck scripts/smoke/provision-staging-secrets.sh` で新規 warning が出ない（既存水準維持）
- [ ] 実 provision 実行（secret 投入）は行わない（user-gated / Phase 13 以降）

---

## 8.9 不変条件（既存維持）

1. secret 値・hash・fragment・decoded cookie・webhook URL を stdout/stderr/log に出さない（env 名のみ / script 冒頭 Invariants）。
2. `op read` は直接 `gh secret set --body -` へパイプし、変数に値を保持しない。`set -x` 禁止。
3. provision は environment-scoped secret としてのみ保存（`--env staging-runtime-smoke`）。repo-level secret にしない。
4. 仕様書・コード・ログに実値を記載しない（1Password 参照キーのみ / CLAUDE.md「シークレット管理」）。
5. `SECRETS` 配列を provision カバー集合の単一の真実とし、別途の集合定数を二重定義しない（DRY / 対策B gate との責務分離）。
