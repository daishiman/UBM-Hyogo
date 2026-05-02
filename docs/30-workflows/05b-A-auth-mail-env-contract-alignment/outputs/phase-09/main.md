# Output Phase 9: 品質保証

## 品質ゲート方針

| 種別 | 適用 | 理由 |
| --- | --- | --- |
| `pnpm typecheck` | 対象外 | docs-only / TS 差分なし |
| `pnpm lint` | 対象外 | docs-only。spec 更新 PR 時の lint hook は Phase 13 payload に明記 |
| `pnpm test` | 対象外 | コード差分なし。Magic Link send 振る舞いは 05b 本体タスクの責務 |
| 旧 env 名残存 grep | 必須 | 真因解消の構造的確認 |
| artifacts.json parity | 必須 | root / outputs status / metadata / phases / blocks 一致 |
| secret 実値検出 grep | 必須 | 不変条件 #16 |
| Phase status 整合 | 必須 | `spec_created` を超えた状態への昇格防止 |

## 実測結果（2026-05-02）

### 旧 env 名残存 grep

```bash
rg -n 'RESEND_API_KEY|RESEND_FROM_EMAIL|SITE_URL' \
  docs/00-getting-started-manual/specs/10-notification-auth.md \
  docs/00-getting-started-manual/specs/08-free-database.md \
  .claude/skills/aiworkflow-requirements/references/environment-variables.md \
  .claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md
```

- 旧名残存件数: **0 件**（PASS）
- 対象は正本契約ファイルのみ。本 workflow 内の移行説明 / `lessons-learned-05b-a-...md` / `workflow-05b-a-...-artifact-inventory.md` の履歴記述は対象外

### 正本 env 名参照

`MAIL_PROVIDER_KEY` / `MAIL_FROM_ADDRESS` / `AUTH_URL` の参照: 主要ファイル全てで `>= 1` 件
- `10-notification-auth.md`: 4
- `08-free-database.md`: 3
- `environment-variables.md`: 3
- `lessons-learned-05b-a-auth-mail-env-contract-alignment-2026-05.md`: 3
- `workflow-05b-a-auth-mail-env-contract-alignment-artifact-inventory.md`: 4

### secret 実値混入検出

```bash
rg -n 're_[A-Za-z0-9]{16,}|sk_[A-Za-z0-9]{16,}' \
  docs/30-workflows/05b-A-auth-mail-env-contract-alignment/outputs/
```

- 検出件数: **0 件**（PASS）

### artifacts.json parity

| 項目 | 期待 | 実測 |
| --- | --- | --- |
| `task` | `05b-A-auth-mail-env-contract-alignment` | OK |
| `status` | `spec_created` | OK |
| `docsOnly` / `remainingOnly` | `true` / `true` | OK |
| `phases` 件数 | 13 | 13 (PASS) |
| `phase-*.md` 枚数 | 13 | 13 (PASS) |
| `blocks` | `05b-B-...` / `09a-A-...` / `09c-A-...` | OK |
| outputs/artifacts.json | root と同一 | OK |

### Phase status 整合

- 全 Phase で `wave: 05b-fu` / `mode: parallel` / `taskType: implementation-spec / docs-only` / `visualEvidence: NON_VISUAL` メタ一致
- `completed` / `applied` 主張なし
- タスク全体 `spec_created` 維持

## 自走禁止操作（再掲）

- spec docs / aiworkflow / runbook の commit / push / PR（Phase 13 user 承認後）
- Cloudflare Secrets / 1Password への secret 投入・rotation
- Magic Link 実送信 smoke

## 次 Phase への引き渡し

- grep 実測: 旧名 0 / 正本 ≥1 / 値混入 0
- artifacts.json parity: phases 13 / status `spec_created`
- typecheck / lint / test 対象外方針
- approval gate（spec commit / secret put / 実送信）
