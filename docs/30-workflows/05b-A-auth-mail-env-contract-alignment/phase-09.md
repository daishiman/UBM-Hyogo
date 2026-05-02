# Phase 9: 品質保証 — 05b-A-auth-mail-env-contract-alignment

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | 05b-A-auth-mail-env-contract-alignment |
| phase | 9 / 13 |
| wave | 05b-fu |
| mode | parallel |
| 作成日 | 2026-05-01 |
| taskType | implementation-spec / docs-only |
| visualEvidence | NON_VISUAL |

## 目的

本タスクは spec docs / aiworkflow references / runbook の更新方針を確定する docs-only タスクであり、コード差分は発生しない。よって品質保証ゲートは「型 / lint / test の実行」ではなく、(1) 旧 env 名 (`RESEND_API_KEY` / `RESEND_FROM_EMAIL` / `SITE_URL`) が正本契約ファイル（manual specs / env・secret current contract references）に残存しないことを grep で確認、(2) artifacts.json (root / outputs) と Phase outputs の parity 確認、(3) Phase 1〜8 の status / state 整合確認、(4) secret 実値が evidence に残っていないことの確認、で構成する。移行理由を説明する本 workflow 内の旧名対応表や lessons / artifact inventory の履歴説明は grep failure 対象に含めない。

## 品質ゲート方針

| 種別 | 適用 | 理由 |
| --- | --- | --- |
| `pnpm typecheck` | 対象外 | 本タスクは spec / runbook の Markdown 更新方針のみ確定し、TS 差分なし |
| `pnpm lint` | 対象外 | 同上。ただし将来 spec docs 更新 PR 時は lint hook の適用を Phase 13 payload に明記 |
| `pnpm test` | 対象外 | コード差分なし。Magic Link 送信経路の振る舞いは 05b 本体タスクのテストでカバー済み |
| grep 検証（旧 env 名残存） | 必須 | 真因解消のコア。正本契約面で旧名 0 件を構造的に確認する |
| artifacts.json parity | 必須 | root / outputs `artifacts.json` の status / metadata / phases / blocks と本ディレクトリの phase-*.md / outputs 構造の整合を確認 |
| secret 実値の検出 grep | 必須 | 不変条件 #16。outputs / 仕様書本文に値・値ハッシュ・provider response body が残らないことを保証 |
| Phase status 整合 | 必須 | spec_created を超えた状態（completed / applied）に Phase が昇格していないことを確認 |

## 実行タスク

1. 旧 env 名残存ゼロを grep で確認する。完了条件: 正本契約面で残存件数が 0 と記録される（本 workflow 内の移行説明・旧名対応表は説明用のため除外）。
2. artifacts.json (root / outputs) parity を確認する。完了条件: metadata と phases 13 件、phase-*.md / outputs/phase-*/main.md の枚数が一致する。
3. Phase 1〜8 の status と本 Phase の前提が整合することを確認する。完了条件: 各 Phase の `taskType` / `visualEvidence` / `wave` が Phase 1 と完全一致する。
4. typecheck / lint / test を本タスクで実行しない理由を明記する。完了条件: 上記方針表が outputs に転記される。
5. secret 実値（API key / token / Resend response body）が outputs に含まれないことを grep で確認する。完了条件: 値らしき高エントロピー文字列の検出件数が 0 と記録される。

## 検証コマンド（実測時テンプレ）

```bash
# 旧 env 名残存 grep（正本契約ファイル expected: 0 件。workflow 内の移行説明や履歴 lessons は対象外）
rg -n 'RESEND_API_KEY|RESEND_FROM_EMAIL|SITE_URL' \
  docs/00-getting-started-manual/specs/10-notification-auth.md \
  docs/00-getting-started-manual/specs/08-free-database.md \
  .claude/skills/aiworkflow-requirements/references/environment-variables.md \
  .claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md

# 正本 env 名の参照数（>=1 件であること）
rg -n 'MAIL_PROVIDER_KEY|MAIL_FROM_ADDRESS|AUTH_URL' docs/00-getting-started-manual/specs/ \
  .claude/skills/aiworkflow-requirements/references/

# secret 実値混入検出（key 名以外の値らしき文字列を弾く運用 grep）
rg -n 're_[A-Za-z0-9]{16,}|sk_[A-Za-z0-9]{16,}' docs/30-workflows/05b-A-auth-mail-env-contract-alignment/outputs/

# artifacts.json parity（root / outputs metadata と phases 件数、phase-*.md 枚数）
jq -S '.metadata, .phases | length? // .' docs/30-workflows/05b-A-auth-mail-env-contract-alignment/artifacts.json
jq -S '.metadata, .phases | length? // .' docs/30-workflows/05b-A-auth-mail-env-contract-alignment/outputs/artifacts.json
ls docs/30-workflows/05b-A-auth-mail-env-contract-alignment/phase-*.md | wc -l
jq '.phases | length' docs/30-workflows/05b-A-auth-mail-env-contract-alignment/artifacts.json
```

## artifacts.json parity 確認項目

| 項目 | 期待値 |
| --- | --- |
| `task` | `05b-A-auth-mail-env-contract-alignment` |
| `status` | `spec_created` |
| `docsOnly` | `true` |
| `remainingOnly` | `true` |
| `phases` 件数 | 13 |
| `blocks` | `05b-B-magic-link-callback-credentials-provider`, `09a-A-staging-deploy-smoke-execution`, `09c-A-production-deploy-execution` |
| `outputs/artifacts.json` | root `artifacts.json` と status / metadata / phases / blocks が一致 |
| `outputs/phase-*/main.md` の枚数 | 13 |

## Phase status 整合確認

- 本 Phase 9 終了時点で各 Phase の `wave: 05b-fu` / `mode: parallel` / `taskType: implementation-spec / docs-only` / `visualEvidence: NON_VISUAL` がメタ情報表で一致していること
- `outputs/artifacts.json` は root `artifacts.json` と同期し、root / outputs parity を確認する
- どの Phase も `completed` / `applied` を主張せず、本タスク全体は `spec_created` 状態のままであること

## 自走禁止操作 (approval gate)

- spec docs / aiworkflow references / runbook の commit / push / PR は本 Phase でも実行しない（Phase 13 user 承認後のみ）
- Cloudflare Secrets / 1Password への secret 投入・rotation は実行しない
- Magic Link 実送信を伴う smoke は実行しない（Phase 11 で staging readiness 手順のみ確定）

## 参照資料

- docs/00-getting-started-manual/specs/10-notification-auth.md
- docs/00-getting-started-manual/specs/08-free-database.md
- .claude/skills/aiworkflow-requirements/references/environment-variables.md
- .claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md
- apps/api/src/index.ts
- apps/api/src/routes/auth/index.ts
- apps/api/src/services/mail/magic-link-mailer.ts
- 本ワークフロー Phase 1 / Phase 2 / Phase 3（採用 env 名と fail-closed 仕様）

## 実行手順

- 対象 directory: `docs/30-workflows/05b-A-auth-mail-env-contract-alignment/`
- 本仕様書作成ではアプリケーションコード、deploy、commit、push、PR 作成を行わない
- 実装・実測時は Phase 5 / Phase 11 の runbook と evidence path に従う
- secret 実値・provider response body・op read の出力を outputs / 仕様書本文に転記しない

## 統合テスト連携

- 上流: 05b Magic Link provider, 10-notification-auth.md, environment-variables.md, deployment-secrets-management.md
- 下流: 05b-B-magic-link-callback-credentials-provider, 09a-A-staging-deploy-smoke-execution, 09c-A-production-deploy-execution

## 多角的チェック観点

- #16 secret values never documented: grep で実値混入ゼロを構造的に確認
- #15 Auth session boundary: `AUTH_SECRET` を本 Phase でも触らない
- #14 Cloudflare free-tier: 新規 Secret / Variable を増やさない
- 未実装/未実測を PASS と扱わない: grep ゼロ件は spec 更新が完了した時点の expected 値であり、本 Phase で更新を実施したことの証跡ではない
- プロトタイプと仕様書の採用/不採用を混同しない: GAS prototype の `RESEND_*` は grep target に含めない（本タスクの対象外）

## サブタスク管理

- [ ] refs を確認する
- [ ] 旧 env 名残存ゼロの grep 検証コマンドを記録する
- [ ] artifacts.json parity を確認する
- [ ] Phase 1〜8 の status / state 整合を確認する
- [ ] typecheck / lint / test を対象外とする理由を記録する
- [ ] secret 実値混入ゼロの grep 検証コマンドを記録する
- [ ] approval gate を明記する
- [ ] outputs/phase-09/main.md を作成する

## 成果物

- outputs/phase-09/main.md（grep 検証コマンドと expected / artifacts.json parity / Phase status 整合 / typecheck・lint・test 対象外の理由 / secret 値混入ゼロ確認）

## 完了条件

- 旧 env 名残存ゼロの grep 検証コマンドと expected 値が記録されている
- 正本 env 名 (`MAIL_PROVIDER_KEY` / `MAIL_FROM_ADDRESS` / `AUTH_URL`) の参照点が確認可能になっている
- artifacts.json (root) parity が確認されている
- typecheck / lint / test を本タスクで対象外とする方針が明記されている
- secret 実値・provider response body が outputs / 仕様書本文に残っていない
- Phase 1〜8 の status / state が `spec_created` を超えていない

## タスク100%実行確認

- [ ] この Phase の必須セクションがすべて埋まっている
- [ ] 完了済み本体タスクの復活ではなく follow-up gate の仕様になっている
- [ ] 実装、deploy、commit、push、PR を実行していない
- [ ] secret 実値を記録していない（env 名と op:// 参照のみ）

## 次 Phase への引き渡し

Phase 10（最終レビュー）へ次を渡す:

- grep 検証の expected 値（旧名 0 / 正本 >=1 / 値混入 0）
- artifacts.json parity 確認結果（phases 13 / status `spec_created`）
- typecheck / lint / test を対象外とする方針
- approval gate（spec docs commit / Cloudflare secret put / Magic Link 実送信 smoke）
