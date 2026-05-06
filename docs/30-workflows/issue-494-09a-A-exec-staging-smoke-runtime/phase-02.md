# Phase 2: 設計 — issue-494-09a-A-exec-staging-smoke-runtime

[実装区分: 実装仕様書]

判定根拠: Phase 1 の DoD を実 staging 環境で達成するために、G1-G4 multi-stage approval gate / evidence 保存パス / redaction policy / rollback plan を確定する。Cloudflare Workers / D1 / Forms quota への副作用設計を含むため docs-only ではない。

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | issue-494-09a-A-exec-staging-smoke-runtime |
| phase | 2 / 13 |
| wave | 9a-fu |
| mode | sequential |
| 作成日 | 2026-05-06 |
| taskType | implementation / runtime-evidence-acquisition |
| visualEvidence | VISUAL_ON_EXECUTION |

## 目的

Phase 1 で確定した 15 evidence path と 4 approval gate を、(a) G1-G4 個別 commands / artifact path / approval timing / rollback plan、(b) evidence 保存パス命名規則、(c) redaction policy（対象 / 手段 / 検証）、として設計する。09a-A spec の `phase-02.md` で確定済の上位設計を内包し、本サイクルで重複定義する内容は「実行サイクル固有の運用層」に限定する。

## 実行アーキテクチャ（運用層）

```
[operator + Claude Code]
        │ (G1〜G4 独立承認 gate)
        ▼
   bash scripts/cf.sh ...
        │ (op run --env-file=.env で 1Password から CLOUDFLARE_API_TOKEN 注入)
        │ (mise exec --) Node 24 / pnpm 10 を強制
        ▼
┌──────────────────────────────────────────┐
│ Cloudflare staging                        │
│  ├ Workers: ubm-hyogo-api-staging         │
│  ├ Workers: ubm-hyogo-web-staging         │
│  └ D1     : ubm-hyogo-db-staging          │
└──────────────────────────────────────────┘
        │   ▲                    │
        │   │ wrangler tail       │ Forms API (Google) — quota 消費
        ▼   │ (redact pipe)       ▼
   curl smoke / Playwright    sync_jobs / audit_log dump
        │                          │
        ▼                          ▼
  issue-494-09a-A-exec-staging-smoke-runtime/outputs/phase-11/evidence/
        │
        ▼
  本タスク outputs/phase-13/main.md（G1-G4 承認 timestamp）
```

## G1-G4 multi-stage approval gate 設計

| Gate | 対象操作 | commands | artifact path | approval timing | rollback plan |
| --- | --- | --- | --- | --- | --- |
| **preflight** | Cloudflare auth 確認 | `bash scripts/cf.sh whoami \| tee issue-494-09a-A-exec-staging-smoke-runtime/outputs/phase-11/evidence/preflight/cf-whoami.log` | `evidence/preflight/cf-whoami.log` | gate なし（read-only） | n/a |
| **G1** | staging API/Web Worker deploy | `bash scripts/cf.sh deployments list --config apps/api/wrangler.toml --env staging`（旧 version id 控え）<br>`bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging \| tee evidence/deploy/deploy-api-staging.log`<br>`bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env staging \| tee evidence/deploy/deploy-web-staging.log` | `evidence/deploy/deploy-{api,web}-staging.log` | 各 deploy コマンド直前に独立承認（API と Web は別承認推奨） | `bash scripts/cf.sh rollback <PREVIOUS_VERSION_ID> --config apps/{api,web}/wrangler.toml --env staging` |
| **G2** | staging D1 migration apply（pending がある場合のみ） | `bash scripts/cf.sh d1 migrations list ubm-hyogo-db-staging --env staging \| tee evidence/d1/d1-migrations-staging.log`<br>`bash scripts/cf.sh d1 migrations list ubm-hyogo-db-prod --env production \| tee evidence/d1/d1-migrations-prod.log`（read-only）<br>pending 行検出時のみ:<br>`bash scripts/cf.sh d1 export ubm-hyogo-db-staging --env staging --output evidence/d1/backup-pre-apply.sql`<br>`bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-staging --env staging` | `evidence/d1/d1-migrations-{staging,prod}.log` / `evidence/d1/d1-schema-parity.json` / `evidence/d1/backup-pre-apply.sql` | apply 直前に独立承認。pending=0 の場合は「pending=0 確認のみ」として apply は実行しない | apply 失敗時: D1 migration rollback CLI が無いため、`backup-pre-apply.sql` を元に schema 復旧 task を `unassigned-task/` で起票（CONST_007 例外なし） |
| **G3** | Forms schema / responses sync 実行 | api 側 admin sync endpoint への operator 認証 POST（09a-A `phase-11.md` に従う）<br>`bash scripts/cf.sh d1 execute ubm-hyogo-db-staging --env staging --json --command "SELECT * FROM sync_jobs ORDER BY id DESC LIMIT 20" > evidence/forms/sync-jobs-staging.json`<br>同 `audit_log` 抽出 | `evidence/forms/forms-{schema,responses}-sync.log` / `evidence/forms/sync-jobs-staging.json` / `evidence/forms/audit-log-staging.json` | sync POST 直前に独立承認（schema / responses で別承認推奨）。staging Forms quota 消費のため | 429 / quota 枯渇: 翌日リトライ TODO を `outputs/phase-11/main.md` に記録、本サイクル内で再実行できない場合は `unassigned-task/` 起票で完結（先送り表現禁止） |
| **G4** | evidence commit / push / PR 作成 / 09c blocker 更新 | `git status --porcelain` 確認 → `git add <evidence paths>` → `git commit` → `git push -u` → `gh pr create` | 本タスク `outputs/phase-13/main.md`（G1-G4 承認 timestamp） / `outputs/phase-13/main.md` | commit 直前と PR 作成直前に独立承認 | revert commit / `gh pr close` |

### G1-G4 独立承認の運用ルール

- **合算承認禁止**: 「G1〜G4 まとめて承認」は spec 違反。本タスクの完了条件として `outputs/phase-13/main.md` に G1 / G2 / G3 / G4 の **個別** 承認 timestamp が記録されている必要がある。
- **逆順実行禁止**: G4 を先に commit するなどは不可。前段 gate の evidence が揃っていないと次 gate の承認受領に進めない。
- **包括承認の解釈禁止**: 「進めて」「全部 OK」のような発言で全 gate を一気に実行することは spec 違反。各 gate 直前で「対象操作・影響範囲・rollback 手段」を提示し、独立承認文言を取り直す。
- **production 拡張時は追加承認必須**: 本タスクでは production への副作用は read-only `migrations list`（`PRAGMA` / `SELECT` 含む parity 検証用クエリ）のみ。それ以上の操作（`apply` / mutation）が必要になった場合は scope out として `unassigned-task/` で別 task を起票し、本タスクでは実行しない。

## evidence 保存パス命名規則

09a-A spec の `phase-11.md` evidence root（`docs/30-workflows/issue-494-09a-A-exec-staging-smoke-runtime/outputs/phase-11/evidence/`）配下に以下構造で保存する。Issue #494 本文「必須証跡パス」と一致させる。

```
docs/30-workflows/issue-494-09a-A-exec-staging-smoke-runtime/outputs/phase-11/evidence/
├── preflight/
│   └── cf-whoami.log
├── d1/
│   ├── d1-migrations-staging.log
│   ├── d1-migrations-prod.log
│   ├── d1-schema-parity.json
│   └── backup-pre-apply.sql        # G2 で apply 実施時のみ
├── deploy/
│   ├── deploy-api-staging.log
│   └── deploy-web-staging.log
├── forms/
│   ├── forms-schema-sync.log
│   ├── forms-responses-sync.log
│   ├── sync-jobs-staging.json
│   └── audit-log-staging.json
├── playwright/                     # Playwright html report + traces
│   ├── index.html
│   └── ...
├── screenshots/
│   ├── public-members-staging.png
│   ├── login-staging.png
│   ├── me-staging.png
│   └── admin-staging.png
└── wrangler-tail/
    └── api-30min.log               # 30 分相当または取得不能理由
```

承認 timestamp / G1-G4 個別承認文言は `outputs/phase-13/main.md` と本タスク `outputs/phase-13/main.md` の両方に記録（parity 維持）。

### 命名規則の不変条件

- ファイル名はすべて `kebab-case` + 用途接尾辞（`-staging` / `-prod`）。
- 1 evidence = 1 ファイル原則（マルチサンプル時は連番接尾辞 `-01` / `-02` で区別）。
- screenshot は `{route-name}-staging.png` 固定。production の screenshot は本タスクで取得しない。
- 直書きの `NOT_EXECUTED` placeholder ファイルは作らない。実 evidence 取得後に `outputs/phase-11/main.md` 側の `NOT_EXECUTED` 文字列を実 evidence への相対参照で置換する。

## redaction policy

| 対象 | 検出キー / 場所 | redact 手段 | 検証 |
| --- | --- | --- | --- |
| Cloudflare API Token | `Authorization: Bearer ...` ヘッダ / log 出力中の token 文字列 | `sed -E 's/(Authorization: Bearer )[A-Za-z0-9._-]+/\1[REDACTED]/g'` をパイプ経由で適用、または `scripts/lib/redact.sh`（存在する場合） | `grep -E 'Authorization: Bearer [A-Za-z0-9]' evidence/` で 0 件 |
| Cookie / session token | `Cookie:` / `Set-Cookie:` ヘッダ / `__Secure-*` / `next-auth.session-token` | 上記 sed と同形式で `(Cookie: )[^\r\n]+` を `[REDACTED]` に置換 | `grep -E 'Cookie: \\S{20,}' evidence/` で 0 件 |
| email | curl レスポンス / Playwright trace / D1 dump 内の `@` 含むフィールド | テスト fixture アカウント以外は `***@***` に置換、または該当カラムを D1 query 段階で除外 | `grep -E '@[a-z0-9.-]+\\.(com\|jp\|net)' evidence/` の結果がテスト fixture のみであることを目視確認 |
| Workers token / OAuth refresh token | `wrangler tail` log 内 / Forms sync log 内 | sed で長さ 20 以上の base64 / hex 文字列を一律 `[REDACTED-TOKEN]` に置換 | `grep -E '[A-Za-z0-9]{40,}' evidence/wrangler-tail/` で実 token 出現が無いこと |
| IP アドレス | `wrangler tail` の `request.headers.cf-connecting-ip` 等 | sed で IPv4 / IPv6 を `[REDACTED-IP]` に置換 | `grep -E '([0-9]{1,3}\\.){3}[0-9]{1,3}' evidence/wrangler-tail/` で実 IP が残っていないこと |
| 実 PII（実会員氏名 / 住所 / 電話） | screenshot / D1 dump（`member_responses` 等） | (a) テスト fixture アカウントのみで smoke 実行、(b) 実会員データが映る場合は screenshot を blur / D1 dump からカラム除外 | `outputs/phase-13/main.md` に redaction 確認 timestamp を記録 |
| `.env` 実値 | repo 全体 | repo に commit しない（op:// 参照のみ） | `git diff --staged` で `.env` 実値が無いことを G4 commit 直前に確認 |

### redaction 手段のフォールバック

`scripts/lib/redact.sh` が存在しない場合は inline `sed` を runbook（`phase-11.md`）から呼び出す。本サイクルで `scripts/lib/redact.sh` 新規作成は scope out（spec 改訂に該当するため `unassigned-task/` で起票）。

## 入出力データ構造（運用層で必要な分のみ）

`phase-02.md` で確定済の構造を内包する。本サイクル独自に追加する構造は `outputs/phase-13/main.md` の G1-G4 承認 timestamp フォーマットのみ:

```markdown
## G1-G4 approval timestamps

| Gate | approval received at (ISO8601) | user 発言（原文） | 対象操作の要約 |
| --- | --- | --- | --- |
| G1 (api deploy) | 2026-05-06T... | "OK G1 api deploy 進めて" | bash scripts/cf.sh deploy ... apps/api ... --env staging |
| G1 (web deploy) | 2026-05-06T... | "OK G1 web deploy 進めて" | bash scripts/cf.sh deploy ... apps/web ... --env staging |
| G2 (D1 list / apply) | 2026-05-06T... | "..." | ... |
| G3 (Forms schema sync) | 2026-05-06T... | "..." | ... |
| G3 (Forms responses sync) | 2026-05-06T... | "..." | ... |
| G4 (commit / push / PR) | 2026-05-06T... | "..." | ... |
```

## エラーハンドリング（運用層）

| 事象 | 検知 | 対応 |
| --- | --- | --- |
| `cf.sh whoami` 失敗 | exit != 0 | 1Password / op 認証を再確認。値は記録しない。本サイクルを停止し `unassigned-task/` に起票（CONST_007 例外なし） |
| api/web deploy 失敗 | `Deployed` 文字列なし / exit != 0 | log を保存し原因を `outputs/phase-11/main.md` に記録、修正は scope out として `unassigned-task/` 起票 |
| D1 pending migration 検出 | `migrations list` に `[ ]` 行 | G2 で user 承認 → apply。承認得られない場合は理由を evidence に記録し pending 維持で本サイクル停止 |
| D1 schema parity 差分 | `d1-schema-parity.json.diffCount > 0` | production 側 migration TODO を `docs/30-workflows/unassigned-task/task-09a-d1-schema-parity-followup-001.md`（仮）として起票 |
| Playwright timeout / flaky | reporter で fail | trace を保存、再実行は最大 2 回まで |
| Forms sync 409（多重実行） | response body | evidence として保存、lock 解放後再実行 |
| Forms quota 429 | response body | 翌日リトライ TODO を `outputs/phase-11/main.md` に記録、本サイクル内で完了不能なら `unassigned-task/` 起票 |
| wrangler tail 取得不能 | exit != 0 / token scope 不足 | 不能理由を `wrangler-tail/api-30min.log` に明記（CONST_007 例外: ログ取得不能は AC により許容） |
| redaction 漏れ検出 | 上記 grep 検証で hit | G4 commit 前に再 redact、commit 後に発覚した場合は revert + 再 redact + 再 commit |

## rollback plan サマリ

| Gate | rollback 操作 |
| --- | --- |
| G1 api | `bash scripts/cf.sh rollback <PREV_API_VERSION_ID> --config apps/api/wrangler.toml --env staging` |
| G1 web | `bash scripts/cf.sh rollback <PREV_WEB_VERSION_ID> --config apps/web/wrangler.toml --env staging` |
| G2 D1 | `backup-pre-apply.sql` を元に schema 復旧 task を `unassigned-task/` で起票（D1 migration rollback CLI 不在のため） |
| G3 Forms | `sync_jobs` の失敗行を audit、quota 復帰待機 |
| G4 commit/push/PR | `git revert <commit>` / `gh pr close --delete-branch` |

deploy 直前に `bash scripts/cf.sh deployments list --config apps/{api,web}/wrangler.toml --env staging` で旧 version id を控え、`outputs/phase-13/main.md` に記録する（rollback 前提条件）。

## セキュリティ

- secret 値は `op://Vault/Item/Field` 参照のみ。`.env` に実値を書かない。
- `wrangler tail` / curl レスポンス / D1 dump は redaction policy に従って redact してから保存。
- production D1 へは read-only `PRAGMA` / `SELECT` / `migrations list` のみ。`apply` / mutation 禁止。
- `wrangler login` の OAuth トークン保持禁止（CLAUDE.md）。
- screenshot は本タスクの test fixture アカウントのみで取得。実会員データが映る場合は blur 必須。

## 参照資料

- spec: `docs/30-workflows/issue-494-09a-A-exec-staging-smoke-runtime/phase-02.md`
- spec: `docs/30-workflows/issue-494-09a-A-exec-staging-smoke-runtime/phase-11.md`
- spec: `docs/30-workflows/issue-494-09a-A-exec-staging-smoke-runtime/phase-13.md`
- artifacts: `docs/30-workflows/issue-494-09a-A-exec-staging-smoke-runtime/artifacts.json`
- `docs/00-getting-started-manual/specs/15-infrastructure-runbook.md`
- `docs/00-getting-started-manual/specs/08-free-database.md`
- `apps/api/wrangler.toml` / `apps/web/wrangler.toml`
- `scripts/cf.sh`
- GitHub Issue #494

## 統合テスト連携

- 上流: 08a / 08a-B / 08b 完了 evidence
- 下流: 09c production deploy execution（本タスク evidence path をそのまま参照源にする）

## 多角的チェック観点

- G1-G4 の commands / artifact path / approval timing / rollback plan が表として網羅されている
- redaction policy が「対象 / 手段 / 検証コマンド」の三点で定義されている
- evidence 命名規則が Issue #494「必須証跡パス」と一致している
- production への副作用が read-only に限定されている
- 包括承認禁止 / 逆順実行禁止 / production 拡張時の追加承認必須が文面で明示されている
- 09a-A spec 本体改訂が含まれていない（spec/runtime の境界明示）

## サブタスク管理

- [ ] G1-G4 表を確定
- [ ] evidence path tree を Issue #494 の必須証跡パスと突き合わせ
- [ ] redaction policy 表を確定（grep 検証コマンドを含む）
- [ ] rollback plan を gate 単位で確定
- [ ] `outputs/phase-02/main.md` を作成

## 成果物

- `outputs/phase-02/main.md`

## 完了条件

- [ ] G1-G4 各 gate の commands / artifact path / approval timing / rollback plan が表で網羅されている
- [ ] evidence 命名規則が 09a-A spec / Issue #494 必須証跡パスと完全一致している
- [ ] redaction policy が secret / PII / token / IP すべてに対し検証コマンド付きで定義されている
- [ ] production への副作用が read-only `migrations list` / `PRAGMA` / `SELECT` のみと明記されている

## タスク100%実行確認

- [ ] 必須セクションがすべて埋まっている
- [ ] 本 Phase で deploy / commit / push / PR を実行していない
- [ ] CONST_007: 「Phase XX で対応」「将来タスク」「別 PR」等の先送り表現が無い

## 次 Phase への引き渡し

Phase 3（設計レビュー）へ:

- G1-G4 表 / evidence path tree / redaction policy / rollback plan
- 09a-A 既存 spec との整合差分の比較材料
- リスク候補（redaction 漏れ / D1 schema drift / Forms quota / wrangler tail 取得不能 / 包括承認解釈ミス）

## 実行タスク

- [ ] phase-02 の各セクションに記載した手順・検証・成果物作成を実行する
