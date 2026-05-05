# Phase 8: DRY 化 — 09a-A-staging-deploy-smoke-execution

[実装区分: 実装仕様書]

判定根拠: 本 Phase は実 staging 環境への副作用を伴う Phase 5 / Phase 11 ランブックの中で繰り返し利用される curl smoke / D1 query / redact / parity 比較断片の DRY 設計を行い、その配置先パスと関数シグネチャを規定する。仕様自体は markdown だが、後続 Phase の実行（deploy / D1 query / Forms sync）が直接依存するため docs-only ではなく実装仕様書として扱う。

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | 09a-A-staging-deploy-smoke-execution |
| phase | 8 / 13 |
| wave | 9a-fu |
| mode | parallel |
| 作成日 | 2026-05-01 |
| taskType | implementation-spec |
| visualEvidence | VISUAL_ON_EXECUTION |

## 目的

Phase 1〜3 で確定した 13 evidence・4 approval gate（G1 deploy / G2 D1 migration / G3 Forms sync / G4 09c blocker 更新）を Phase 5 / Phase 11 で実行する際に、重複しやすいコマンド断片（curl smoke / D1 query / redact / parity 比較）を以下の方針で整理する。

1. 既存共通モジュール（`scripts/cf.sh`, `scripts/with-env.sh`, `scripts/lib/redaction.sh` 等）を最大限再利用する。
2. 本タスク内では新規共通スクリプトを実装せず、Phase 5 ランブックには inline で記述する。
3. 共通化が妥当な単位（再利用回数 ≥ 3）は `scripts/staging-smoke/` の配置先パスと関数シグネチャだけを本 Phase で予約し、実装は別タスク（unassigned-task）として起票する。

## 重複検出対象（Phase 5 / Phase 11 ランブック内で発生する断片）

| # | 断片 | 推定発生箇所 | 推定回数 |
| --- | --- | --- | --- |
| D1 | `curl -sSi 'https://<api-staging>/public/members?...' \| tee outputs/phase-11/evidence/curl-public-members-<key>.log` | base / q / zone / status / tag / sort / density / authz me / authz admin / authz member-role | 9〜10 |
| D2 | `bash scripts/cf.sh d1 execute ubm-hyogo-db-staging --env staging --json --command "..."` | sync_jobs / audit_log dump、`PRAGMA table_info` × 8〜12 テーブル | 10〜14 |
| D3 | `... --env production --json --command "PRAGMA table_info(<t>)"`（read-only parity 用） | parity 取得（D2 と対の production 側） | 8〜12 |
| D4 | redact パイプ（Authorization / Cookie / email / token / IP） | wrangler tail、curl レスポンス、D1 dump（PII 列） | 5〜8 |
| D5 | evidence 1 件ごとの「placeholder 不在 + size > 0」検証 | Phase 9 品質ゲート、Phase 11 evidence 完備チェック | 13 |
| D6 | parity diff 計算（staging / production の `PRAGMA table_info` JSON を突合） | `d1-schema-parity.json` 生成 | 1（ただし内部ループ N 回） |

## DRY 化方針

### 共通化判断基準

| 再利用回数 | 扱い |
| --- | --- |
| ≥ 3 | 共通スクリプト候補として配置先パスと関数シグネチャを予約。本タスクでは実装せず、Phase 5 ランブックに inline 記述 |
| < 3 | inline のまま Phase 5 ランブックに記述（過剰抽象化を避ける） |

### 共通スクリプト候補（実装は別タスクで起票）

`scripts/staging-smoke/` 配下の予約パス（本 Phase ではディレクトリも作成しない）:

| パス | 役割 | 関数 / 引数シグネチャ（予約） |
| --- | --- | --- |
| `scripts/staging-smoke/curl-public.sh` | 公開エンドポイント curl smoke。query key を引数化し、ログ tee 先と期待 status を統一管理 | `curl_public <name> <url> <expected_status> <out_log>` |
| `scripts/staging-smoke/curl-authz.sh` | 認可境界 curl smoke（401/403 期待）の共通化 | `curl_authz <name> <url> <auth_header_or_empty> <expected_status> <out_log>` |
| `scripts/staging-smoke/d1-query.sh` | `bash scripts/cf.sh d1 execute` の env / json / command を引数化 | `d1_query <db> <env> <command> <out_json>` |
| `scripts/staging-smoke/d1-parity.sh` | staging / production の `PRAGMA table_info` を取得し `d1-schema-parity.json` 形式に整形 | `d1_parity <table_list...> <out_json>` |
| `scripts/staging-smoke/redact.sh` | 既存 `scripts/lib/redaction.sh` を呼び出し、Authorization / Cookie / email / token / IP を一括 redact する薄いラッパ | `redact <in_stream>` |
| `scripts/staging-smoke/evidence-check.sh` | evidence 13 件の存在 + size > 0 + `NOT_EXECUTED` grep ゼロを一括検証 | `evidence_check <evidence_dir>` |

> 上記は **配置先パスと関数シグネチャの予約のみ**。本タスク内ではファイルを作成しない。

### 既存共通モジュールの再利用箇所マトリクス

| 既存モジュール | 用途 | 本タスクでの呼出箇所 |
| --- | --- | --- |
| `scripts/cf.sh` | wrangler 直接呼び出し禁止のラッパ。`whoami` / `deploy` / `d1 execute` / `d1 migrations list|apply` / `d1 export` / `tail` / `rollback` / `deployments list` を全てここ経由 | Phase 5 deploy / D1 / tail / rollback、Phase 11 evidence 取得の全 D1 系 |
| `scripts/with-env.sh` | `op run --env-file=.env` で 1Password 参照を実値に展開（`scripts/cf.sh` 内部で利用） | 直接呼び出しは不要だが、`cf.sh` 経由ではない補助 op 注入が必要な場合に Phase 5 で利用 |
| `scripts/lib/redaction.sh` | リポジトリ正本 redact ライブラリ（Authorization / Cookie / email / token / IP 等のパターン保持） | wrangler tail、curl レスポンス、D1 dump の保存前パイプ |
| `mise exec --` | Node 24 / pnpm 10 を保証。`cf.sh` 内部で利用 | Playwright 実行 (`mise exec -- pnpm --filter web exec playwright test ...`) |

> `scripts/lib/redact.sh` という名称は存在しない。正しい正本は `scripts/lib/redaction.sh` であり、Phase 5 ランブックでもこの名称を用いる（`redaction.sh`）。

### 09c production smoke タスクとの共有候補

| 共有候補 | 09a-A での扱い | 09c での想定 |
| --- | --- | --- |
| `curl_public` / `curl_authz` | Phase 5 inline | production smoke でも同じ shape。共通化が成立する場合は本タスクで予約したパスへ移植 |
| `d1_query` / `d1_parity` | Phase 5 inline。production 側は **read-only `PRAGMA` / `SELECT` のみ** | 09c では production への実 `INSERT` / `migrations apply` が増えるため、09a-A 用 `d1_parity` と分離する |
| `redact` ラッパ | `scripts/lib/redaction.sh` を直接呼ぶ | 同 |
| `evidence_check` | Phase 9 で利用 | 09c でも 13 件 → N 件に拡張して再利用 |

## リファクタ抑制ルール（CONST_007 と整合）

1. **本タスク内では `scripts/staging-smoke/` 配下を新規作成しない**。Phase 5 ランブックに inline で全コマンドを書き切る。
2. 共通化が必要と判定した場合（同一断片が Phase 5 ランブック内で 3 回以上記述された場合）は、その時点で `unassigned-task/` に起票し、本タスクの DoD は inline のままで完了とする。
3. inline と共通化どちらの場合も「実行コマンド・保存先・期待出力」は Phase 2 で確定したものから一意でなければならない（命名規則を変えない）。

## 起票テンプレ（共通化が必要と判定された場合）

`docs/30-workflows/unassigned-task/task-09a-staging-smoke-helpers-001.md` を以下のテンプレで起票する:

```md
# task-09a-staging-smoke-helpers-001

## title
staging smoke 共通スクリプト (`scripts/staging-smoke/`) の実装

## scope
- `scripts/staging-smoke/curl-public.sh`
- `scripts/staging-smoke/curl-authz.sh`
- `scripts/staging-smoke/d1-query.sh`
- `scripts/staging-smoke/d1-parity.sh`
- `scripts/staging-smoke/redact.sh`（`scripts/lib/redaction.sh` の薄いラッパ）
- `scripts/staging-smoke/evidence-check.sh`

## motivation
09a-A Phase 5 / Phase 11 で 3 回以上重複した curl smoke / D1 query / redact / parity / evidence 検証を共通化し、09c production smoke でも再利用可能にする。

## refs
- docs/30-workflows/09a-A-staging-deploy-smoke-execution/phase-08.md
- docs/30-workflows/09a-A-staging-deploy-smoke-execution/phase-02.md
- scripts/cf.sh
- scripts/lib/redaction.sh

## DoD
- 関数シグネチャは phase-08.md の予約に一致する
- inline 記述からの呼び出し置換差分が Phase 5 ランブックに反映できる
- 09c での再利用余地が README に明記される
```

## 実行手順（本 Phase の作業）

1. 重複検出対象 D1〜D6 を Phase 5 / Phase 11 ランブック草案に対して再カウントし、回数 ≥ 3 の断片を確定する。
2. ≥ 3 の断片について「inline 維持か、`unassigned-task/task-09a-staging-smoke-helpers-001.md` 起票か」を判定する。
3. 既存共通モジュール（`scripts/cf.sh` / `scripts/with-env.sh` / `scripts/lib/redaction.sh`）の呼出箇所マトリクスを Phase 5 ランブックの該当 step に紐付けて記録する。
4. 本 Phase ではコマンドを実行せず、`outputs/phase-08/main.md` に判定結果と起票有無のみを記録する。

## 参照資料

- `docs/30-workflows/09a-A-staging-deploy-smoke-execution/phase-01.md`
- `docs/30-workflows/09a-A-staging-deploy-smoke-execution/phase-02.md`
- `docs/30-workflows/09a-A-staging-deploy-smoke-execution/phase-03.md`
- `docs/00-getting-started-manual/specs/15-infrastructure-runbook.md`
- `docs/00-getting-started-manual/specs/08-free-database.md`
- `scripts/cf.sh`
- `scripts/with-env.sh`
- `scripts/lib/redaction.sh`
- `CLAUDE.md`（Cloudflare 系 CLI 実行ルール）

## 統合テスト連携

- 上流: 08a coverage gate, 08a-B `/members` search/filter coverage, 08b E2E evidence
- 下流: 09c production deploy execution（共通スクリプト候補の再利用先）

## 多角的チェック観点

- 不変条件 #5 / #6 / #14 を侵さない（共通化のためにロジックを apps/web へ移さない）
- production への副作用が混入しない（共通化候補も `--env staging` 既定にする）
- secret / PII が共通化スクリプト経由でも漏れない（redact ラッパは正本 `scripts/lib/redaction.sh` のみを呼ぶ）
- 過剰抽象化を避ける（< 3 回は inline のまま）
- CONST_007: 「Phase XX で共通化」と先送りしない。inline 維持か unassigned-task 起票のどちらかで完結させる

## サブタスク管理

- [ ] D1〜D6 の重複回数を Phase 5 / Phase 11 草案に対して数える
- [ ] ≥ 3 の断片を inline 維持 / 起票 のいずれかに振り分ける
- [ ] 既存共通モジュール 3 種（cf.sh / with-env.sh / lib/redaction.sh）の呼出箇所マトリクスを Phase 5 ランブックに紐付ける
- [ ] 起票が必要な場合のみ `task-09a-staging-smoke-helpers-001.md` を上記テンプレで作成
- [ ] `outputs/phase-08/main.md` を作成し、判定結果と起票有無を記録

## 成果物

- `outputs/phase-08/main.md`

## 完了条件

- [ ] 本 Phase の成果物と検証結果を確認済み。

- 重複検出対象 D1〜D6 の回数判定が記録されている
- ≥ 3 の断片について inline 維持 / 起票 の判定が確定している
- 既存共通モジュールの再利用箇所が Phase 5 ランブックの step 番号と対応している
- `scripts/staging-smoke/` 配下にファイルを作成していない
- `scripts/lib/redact.sh`（誤名）ではなく `scripts/lib/redaction.sh`（正本）が参照されている

## タスク100%実行確認

- [ ] 必須セクションがすべて埋まっている
- [ ] 完了済み本体タスクの復活ではなく follow-up gate の仕様になっている
- [ ] 本 Phase で実装、deploy、commit、push、PR を実行していない
- [ ] CONST_007 違反（「Phase XX で共通化」型の先送り）が無い

## 次 Phase への引き渡し

Phase 9 へ:
- 重複検出結果（D1〜D6）と inline / 起票判定
- 既存共通モジュール再利用箇所マトリクス
- evidence 完備 gate の検証手段（`evidence-check` 相当の inline コマンド）
- 共通化が起票された場合は `unassigned-task/task-09a-staging-smoke-helpers-001.md` のリンク

## 実行タスク

- [ ] phase-08 の既存セクションに記載した手順・検証・成果物作成を実行する。
