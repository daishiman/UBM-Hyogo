# Phase 11: 手動 smoke / 実測 evidence — 05b-A-auth-mail-env-contract-alignment

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | 05b-A-auth-mail-env-contract-alignment |
| phase | 11 / 13 |
| wave | 05b-fu |
| mode | parallel |
| 作成日 | 2026-05-01 |
| taskType | implementation-spec / docs-only |
| visualEvidence | NON_VISUAL |

## 目的

本タスクは UI 差分なし・コード差分なしの contract alignment（env 名整流）であり、画面 screenshot による実測 evidence は適用不可。代わりに NON_VISUAL 代替 evidence を 3 種の補助ファイル + main.md で構成し、(1) 旧 env 名残存ゼロを示す grep evidence、(2) Cloudflare secret list の key 名のみの evidence、(3) staging Magic Link smoke readiness（key 名で「揃っていることだけ」を確認）を記述する。実値・provider response body は一切記録しない。

> **境界宣言**: 本タスクの Phase 11 完了は「**手順記述完了** = readiness の整備」であり、「**production 実測 PASS** = 実 secret 投入後の Magic Link 受信確認」ではない。実 secret 投入と staging / production smoke は下流タスク（09a / 09c）に委譲する。

## NON_VISUAL 適用条件と階層

`phase-11-non-visual-alternative-evidence.md` に従い以下条件を満たすため本ガイドを適用する:

1. UI 差分なし（spec docs / aiworkflow references / runbook の更新方針確定タスク）
2. staging 環境への secret 実投入が user 承認待ち（Phase 11 では readiness のみ整備）
3. 実 Magic Link 送信は user 承認後・下流 09a で実施

| 階層 | 適用 | 内容 |
| --- | --- | --- |
| L1: 型 | 対象外（コード差分なし） | TS 差分が無いため `pnpm typecheck` は本タスクで実行しない |
| L2: lint / boundary | 対象外（コード差分なし） | ESLint boundaries 該当なし |
| L3: in-memory test | 対象外（コード差分なし） | Magic Link send 振る舞いは 05b 本体タスクのテスト責務 |
| L4: grep / config snapshot | 必須 | 旧 env 名残存ゼロ / 正本 env 名参照点 / Cloudflare secret list の name 集合 |

## 補助 evidence 3 種（NON_VISUAL）

`outputs/phase-11/` 配下に以下 4 ファイルを配置する。

### 1. `outputs/phase-11/env-name-grep.md`

旧 env 名 (`RESEND_API_KEY` / `RESEND_FROM_EMAIL` / `SITE_URL`) が正本契約ファイル（manual specs / env・secret current contract references）に残存していないことを構造的に示す。本 workflow 内の移行説明・旧名対応表、および lessons / artifact inventory の履歴説明は許容し、grep failure 対象に含めない。

```markdown
# env-name-grep.md（テンプレ）

## 実行コマンド

\`\`\`bash
rg -n 'RESEND_API_KEY|RESEND_FROM_EMAIL|SITE_URL' \
  docs/00-getting-started-manual/specs/10-notification-auth.md \
  docs/00-getting-started-manual/specs/08-free-database.md \
  .claude/skills/aiworkflow-requirements/references/environment-variables.md \
  .claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md
\`\`\`

## 期待結果（Phase 12 spec 更新後）

- 旧 env 名: 0 件
- 正本 env 名 `MAIL_PROVIDER_KEY` / `MAIL_FROM_ADDRESS` / `AUTH_URL`: >= 1 件

## 実測（実走時に記入）

- 実行日時:
- 実行者:
- 終了コード:
- 旧名残存件数:
- 正本名参照件数:
```

### 2. `outputs/phase-11/secret-list-check.md`

Cloudflare Secrets / Variables の **key 名のみ**を確認する。`bash scripts/cf.sh secret list` の出力から `name` フィールドだけを抽出し、値・rotation 日時・hash を記録しない。

```markdown
# secret-list-check.md（テンプレ）

## 実行コマンド（user 承認後、staging から実行）

\`\`\`bash
bash scripts/cf.sh secret list --config apps/api/wrangler.toml --env staging | jq '[.[].name]'
bash scripts/cf.sh secret list --config apps/api/wrangler.toml --env production | jq '[.[].name]'
\`\`\`

## 期待される key 名集合（Secret）

- `MAIL_PROVIDER_KEY`
- `AUTH_SECRET`（05a 共有 / 本タスク変更対象外）
- `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET`（05a OAuth / 本タスク変更対象外）

## 期待される Variable 名集合（`apps/api/wrangler.toml [env.<env>.vars]`）

- `MAIL_FROM_ADDRESS`
- `AUTH_URL`

## 旧名（あってはならない）

- `RESEND_API_KEY` / `RESEND_FROM_EMAIL` / `SITE_URL`: いずれも 0 件

## 記録ルール

- key 名のみ記録。値・rotation 日時・hash・provider response body を記録しない
- 旧名検出時は Phase 5 runbook の rollback 経路（`secret delete` 後に正本名で再投入）に従う
- 実 secret 値は op read 経由でのみ stdin 投入し、shell history / log / evidence に残さない

## 実測（実走時に記入、key 名のみ）

- staging 実行日時:
- staging 検出 key 名集合:
- production 実行日時:
- production 検出 key 名集合:
- 旧名検出件数:
```

### 3. `outputs/phase-11/magic-link-smoke-readiness.md`

staging で Magic Link 送信 smoke を実行するために必要な env が「**揃っていること**」を key 名集合で確認する。実送信は本タスクで行わない。

```markdown
# magic-link-smoke-readiness.md（テンプレ）

## readiness 判定基準（実送信前）

| 判定軸 | 期待 | 確認ファイル |
| --- | --- | --- |
| Secret `MAIL_PROVIDER_KEY` が staging に登録されている | name のみで一致 | secret-list-check.md |
| Variable `MAIL_FROM_ADDRESS` が `apps/api/wrangler.toml [env.staging.vars]` にある | name のみで一致 | wrangler.toml diff snapshot |
| Variable `AUTH_URL` が `apps/api/wrangler.toml [env.staging.vars]` にある | name のみで一致 | wrangler.toml diff snapshot |
| 旧名 `RESEND_*` / `SITE_URL` が staging に存在しない | 0 件 | secret-list-check.md / env-name-grep.md |

## readiness == ready の場合の次ステップ

- 本タスクではここまで（手順記述完了）
- 実送信は下流 09a-A-staging-deploy-smoke-execution で user 承認後に実行
- 09a 側で `POST /auth/magic-link` の 200 + 受信トレイ到達を確認

## readiness == not_ready の場合

- 不足 key 名を本ファイルに記録
- Phase 5 runbook の `bash scripts/cf.sh secret put` / `wrangler.toml [vars]` 編集手順を参照
- 旧名が検出された場合は Phase 5 runbook の rollback 経路に従う

## 実送信に関する禁止事項

- 本タスクで `POST /auth/magic-link` を実行しない
- Resend 課金経路を本タスクで叩かない
- メール本文・token・受信者アドレスを本ファイルに転記しない（実送信時の evidence は 09a に閉じる）

## 実測（実走時に記入）

- 実行日時:
- 実行者:
- staging readiness 判定: ready / not_ready
- 不足 key 名（あれば）:
```

### 4. `outputs/phase-11/main.md`（NON_VISUAL 宣言 + index）

```markdown
# Phase 11 main.md（テンプレ）

## NON_VISUAL 宣言

- visualEvidence: NON_VISUAL
- 適用条件: UI 差分なし / コード差分なし / staging 実投入が user 承認待ち
- 代替 evidence: env-name-grep.md / secret-list-check.md / magic-link-smoke-readiness.md

## 代替 evidence 差分表

| Phase 11 シナリオ | 元前提 | 代替手段 | カバー範囲 | 申し送り先 |
| --- | --- | --- | --- | --- |
| S-1 旧名残存ゼロ確認 | 正本契約ファイル grep | env-name-grep.md の rg 結果 | 仕様整流の構造的整合（workflow 内の移行説明と履歴 lessons は除外） | 09a CI gate |
| S-2 Cloudflare secret 配置確認 | wrangler secret list 実行 | secret-list-check.md の key 名集合 | name parity（値は確認しない） | 09a / 09c |
| S-3 staging Magic Link smoke | 実送信 200 + 受信トレイ | magic-link-smoke-readiness.md（readiness 判定のみ） | 実送信前の env 揃い | 09a 実送信 smoke |

## 保証範囲と保証外

- 保証する: 仕様整流方針の整合 / Cloudflare secret name parity / readiness 判定の手順
- 保証しない（下流委譲）: 実 secret 値の正しさ / 実送信成功 / 受信トレイ到達 / production deploy

## 申し送り

- 09a-A-staging-deploy-smoke-execution: secret 実投入後の `POST /auth/magic-link` 200 + 受信トレイ到達を実測
- 09c-A-production-deploy-execution: production secret 投入後の fail-closed 検証（未投入時 502 `MAIL_FAILED`）
```

## 実行タスク

1. NON_VISUAL 適用条件を確認し L1〜L4 のうち L4 のみ採用する根拠を記述する。完了条件: 上記階層表が outputs に転記される。
2. `env-name-grep.md` テンプレを定義する。完了条件: rg コマンドと expected 値が記載される。
3. `secret-list-check.md` テンプレを定義する。完了条件: key 名のみ記録のルールと期待集合が記載される。
4. `magic-link-smoke-readiness.md` テンプレを定義する。完了条件: readiness 判定基準と実送信禁止事項が記載される。
5. `main.md` で NON_VISUAL 宣言・代替 evidence 差分表・保証外申し送りを記述する。完了条件: 補助 3 ファイルが index される。
6. 「手順記述完了 ≠ production 実測 PASS」の境界を main.md と implementation-guide.md（Phase 12 で作成）に明記することを引き継ぐ。完了条件: Phase 12 への引き渡しに含まれる。

## 自走禁止操作 (approval gate)

- Cloudflare Secrets / Variables への実値投入（user 承認後・下流 09a / 09c）
- `bash scripts/cf.sh secret put` の実行
- `op read` 出力を evidence / shell history に残す行為
- `POST /auth/magic-link` を staging / production に対して実行する行為
- 旧名 secret の `secret delete` 実行（ただし検出時の rollback 計画は Phase 5 runbook に記述する）

## 参照資料

- .claude/skills/task-specification-creator/references/phase-11-non-visual-alternative-evidence.md
- Phase 2 採用 env 名 / 同期マッピング / fail-closed 仕様
- Phase 5（実装ランブック / `bash scripts/cf.sh` 経路）
- docs/00-getting-started-manual/specs/10-notification-auth.md
- docs/00-getting-started-manual/specs/08-free-database.md
- .claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md（UT-25 / UT-27 投入運用）
- CLAUDE.md §Cloudflare 系 CLI 実行ルール（`scripts/cf.sh` ラッパー強制）

## 実行手順

- 対象 directory: `docs/30-workflows/05b-A-auth-mail-env-contract-alignment/`
- 本仕様書作成ではアプリケーションコード、deploy、commit、push、PR 作成を行わない
- secret 実値・provider response body・op read 出力を outputs に転記しない
- 実 secret 投入と Magic Link 実送信は下流 09a / 09c の責務

## 統合テスト連携

- 上流: 05b Magic Link provider, 10-notification-auth.md, environment-variables.md, deployment-secrets-management.md
- 下流: 05b-B-magic-link-callback-credentials-provider, 09a-A-staging-deploy-smoke-execution, 09c-A-production-deploy-execution

## 多角的チェック観点

- #16 secret values never documented: 全 evidence ファイルに key 名・op:// 参照のみ
- #15 Auth session boundary: `AUTH_SECRET` を本 Phase の readiness 確認対象に含めるが値は記録しない
- #14 Cloudflare free-tier: secret list / vars 確認のみで新規 binding 追加なし
- 未実装/未実測を PASS と扱わない: readiness == ready は実送信成功の代替にならない
- プロトタイプと仕様書の採用/不採用を混同しない: GAS prototype の `RESEND_*` を本 Phase の grep 対象に含めない（spec / aiworkflow / 本ワークフロー outputs のみが対象）

## サブタスク管理

- [ ] NON_VISUAL 適用条件を確認した
- [ ] env-name-grep.md テンプレを定義した
- [ ] secret-list-check.md テンプレを定義した
- [ ] magic-link-smoke-readiness.md テンプレを定義した
- [ ] main.md に NON_VISUAL 宣言と代替 evidence 差分表を記述した
- [ ] 「手順記述完了 ≠ production 実測 PASS」の境界を明記した
- [ ] approval gate を明記した
- [ ] outputs/phase-11/main.md と補助 3 ファイルのテンプレを記述した

## 成果物

- outputs/phase-11/main.md（NON_VISUAL 宣言 / 代替 evidence 差分表 / 保証範囲 / 申し送り）
- outputs/phase-11/env-name-grep.md（旧 env 名残存ゼロの rg evidence テンプレ）
- outputs/phase-11/secret-list-check.md（Cloudflare secret list の key 名集合テンプレ）
- outputs/phase-11/magic-link-smoke-readiness.md（staging readiness 判定テンプレ）

## 完了条件

- NON_VISUAL であるため画面 screenshot ではなく代替 evidence で構成することが明記されている
- 補助 3 ファイル（env-name-grep.md / secret-list-check.md / magic-link-smoke-readiness.md）のテンプレが定義されている
- 全 evidence ファイルで key 名・op:// 参照のみを記録するルールが明記されている
- 「手順記述完了 ≠ production 実測 PASS」の境界が main.md に記載されている
- 実送信を伴う smoke は 09a / 09c に申し送られている

## タスク100%実行確認

- [ ] この Phase の必須セクションがすべて埋まっている
- [ ] 完了済み本体タスクの復活ではなく follow-up gate の仕様になっている
- [ ] 実装、deploy、commit、push、PR を実行していない
- [ ] secret 実値を記録していない（env 名と op:// 参照のみ）

## 次 Phase への引き渡し

Phase 12（ドキュメント更新）へ次を渡す:

- NON_VISUAL 代替 evidence の 3 ファイル構成
- 「手順記述完了 ≠ production 実測 PASS」の境界文言（implementation-guide.md と system-spec-update-summary.md の双方に明記する必要）
- 申し送り対象（09a / 09c）と申し送り内容
- key 名・op:// 参照のみで構成する記録ルール
