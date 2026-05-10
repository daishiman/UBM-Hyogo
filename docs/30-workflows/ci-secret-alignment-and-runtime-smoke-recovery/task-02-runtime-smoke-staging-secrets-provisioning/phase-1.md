# Phase 1: 要件定義（task-02 — staging-runtime-smoke readiness gate & secret runbook）

| 項目 | 値 |
|------|----|
| 起票日 | 2026-05-09 |
| 担当 | solo (daishiman) |
| PR base | `dev` |
| feature branch（想定） | `fix/runtime-smoke-staging-readiness-gate` |
| tier | NON_VISUAL |

---

## 1. 失敗 evidence（背景）

`backend-ci / runtime smoke staging / smoke`（run #374, PR #648 マージ後の `dev` push）が以下で exit 1:

```
STAGING_API_BASE: STAGING_API_BASE is required
```

原因:

- GitHub Environment `staging-runtime-smoke` の secret 一覧が空。
  - `gh api repos/daishiman/UBM-Hyogo/environments/staging-runtime-smoke/secrets --jq '.secrets[].name'` が空配列を返す。
- `scripts/smoke/runtime-attendance-provider.sh` 内部の引数 validation が `STAGING_API_BASE is required` で exit 1。
  - `runtime-smoke-staging.yml` は workflow 上で readiness を確認していないため、smoke スクリプト本体の中でようやく fail している。

結果として:

- runner ログに「何の secret を、どの env に入れれば直るか」が明示されない。
- 解析者は smoke スクリプトの実装を読みに行く必要がある。
- 「PASS のように見える skip」を生む余地が残る（将来的に env empty 時の skip 分岐が混入するリスク）。

---

## 2. 目的

(a) `.github/workflows/runtime-smoke-staging.yml` の `mask staging credentials` step の直前に **`verify required staging secrets` pre-check step** を追加し、必要 secret 4 件のいずれかが空のとき:

- `::error::missing secrets in environment 'staging-runtime-smoke': <name1> <name2> ...`
- `::error::register via 'gh secret set <NAME> --env staging-runtime-smoke' (see docs/30-workflows/.../runbooks/secret-provisioning.md)`

を出して **exit 1**。runner ログに必要 secret 名を残し、再実行可能にする。

(b) `docs/30-workflows/ci-secret-alignment-and-runtime-smoke-recovery/runbooks/secret-provisioning.md` を新規作成し、5 secret の投入手順をユーザー単独で実行できる粒度に固定する。

---

## 3. P50 pre-check（事前確認サマリ）

| 確認項目 | 結果 | 根拠 |
|---------|------|------|
| `runtime-smoke-staging.yml` 現状 | `mask staging credentials` step が job 序盤に存在。pre-check は無し | `.github/workflows/runtime-smoke-staging.yml`（current） |
| `staging-runtime-smoke` env の secrets 状態 | 空（5 件中 0 件） | `gh api repos/daishiman/UBM-Hyogo/environments/staging-runtime-smoke/secrets` |
| smoke 失敗ログ | `STAGING_API_BASE is required` | run #374 |
| `SLACK_WEBHOOK_INCIDENT` の既存扱い | `if: failure()` 配下の通知 step の guard 内で `secrets.SLACK_WEBHOOK_INCIDENT != ''` 判定済 | `runtime-smoke-staging.yml`（current line 65-74） |

---

## 4. pre-check 必須対象（4 secret）

| secret | 必須 pre-check | 用途 |
|---|---|---|
| `STAGING_API_BASE` | yes | smoke の base URL |
| `STAGING_ADMIN_BEARER` | yes | admin endpoint 呼び出し用 bearer |
| `STAGING_MEMBER_ID` | yes | smoke 対象会員 ID |
| `STAGING_ME_BEARER` | yes | 一般会員 endpoint 呼び出し用 bearer |
| `SLACK_WEBHOOK_INCIDENT` | **no** | 既存 if-failure guard 対象。incident 通知は best-effort |

---

## 5. scope

| in scope | out of scope |
|----------|-------------|
| `runtime-smoke-staging.yml` への pre-check step 追加（line 32 と 35 の間に挿入） | `scripts/smoke/runtime-attendance-provider.sh` のロジック変更 |
| `runbooks/secret-provisioning.md` 新規作成 | secret 実値の AI 投入 |
| `::error::` で不足 secret 名列挙 + runbook path 案内 | `staging` / `production` env の secret provisioning |
| 不変条件: secret 実値の docs / コミット混入を grep gate で機械検証 | smoke 経路の再設計 |

---

## 6. pre-conditions

- `staging-runtime-smoke` env が repo に存在している（`gh api repos/.../environments` で確認可）。
- `mise install` 済（Node 24.15.0 / pnpm 10.33.2）。
- repo admin 権限を持つユーザー（secret 投入のため）。

---

## 7. acceptance criteria

| # | 内容 |
|---|------|
| AC-T2-1 | `.github/workflows/runtime-smoke-staging.yml` に `verify required staging secrets` step が 1 回だけ存在する（`grep -c` = 1） |
| AC-T2-2 | secret 未投入の状態で smoke を起動したとき pre-check で exit 1 し、`::error::` ログに 4 件の不足 secret 名が列挙される |
| AC-T2-3 | runbook が新規作成され、5 secret 投入手順 + 取得経路 + 禁止事項 + ローテーション運用を含む |
| AC-T2-4 | docs / diff の secret 実値 grep が 0 件（`eyJ[A-Za-z0-9_-]{20,}` / `sk_[A-Za-z0-9]{20,}` / `hooks\.slack\.com/services/[A-Z0-9]{8,}`） |
| AC-T2-5 | secret 投入後の再実行で smoke job が pre-check を突破する |

---

## 8. inventory（変更対象）

| path | 種別 | 主要変更点 |
|------|------|-----------|
| `.github/workflows/runtime-smoke-staging.yml` | edit | `mask staging credentials` step の直前に pre-check step を 1 件追加（差分 ≈ 18 行） |
| `docs/30-workflows/ci-secret-alignment-and-runtime-smoke-recovery/runbooks/secret-provisioning.md` | new | 5 secret 投入 runbook（≈ 60 行） |

---

## 9. open questions

| # | 質問 | 暫定方針 |
|---|------|----------|
| Q-T2-01 | `SLACK_WEBHOOK_INCIDENT` も pre-check 必須対象にすべきか | no。既存の `if: failure()` + `secrets.X != ''` guard を継続。incident 通知は best-effort |
| Q-T2-02 | pre-check step の `env:` 再宣言は必須か | 必須ではないが、step 単位で意図を明示する保険として記述する |
| Q-T2-03 | smoke スクリプト本体に readiness 判定を入れない理由 | 早期 fail と「runner ログに必要 secret 名を残す」目的のため。 workflow 側のほうが解析者の動線が短い |

---

## 10. implementation_mode

`edit + new`（workflow YAML 編集 + runbook 新規）

---

## 11. exit criteria

| # | 条件 |
|---|------|
| EX-01 | inventory 2 件の責務が明示されている |
| EX-02 | AC-T2-1..AC-T2-5 が機械検証可能な形式で列挙されている |
| EX-03 | pre-check 対象 4 secret と pre-check 対象外 1 secret が明示されている |
| EX-04 | secret 実値を docs に書かない不変条件が明示され、grep gate が定義されている |
