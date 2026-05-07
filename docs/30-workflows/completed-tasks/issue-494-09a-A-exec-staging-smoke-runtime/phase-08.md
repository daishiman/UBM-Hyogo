# Phase 8: DRY 化 — issue-494-09a-A-exec-staging-smoke-runtime

[実装区分: 実装仕様書]

判定根拠: 本タスクは実 staging 環境に対する deploy / D1 migration apply / Forms API sync / wrangler tail の副作用を伴い、取得した evidence を repo にコミットする runtime 実行タスクである（CONST_004 区分: 副作用 + repo コミット成果物 → 実装仕様書）。本 Phase は Phase 5 / Phase 11 で実行される shell snippet 群を `scripts/cf.sh` ラッパー経由に統一し、evidence パス命名規則を Phase 2 と整合させ、redaction snippet を共通化する DRY 設計を確定する。

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | issue-494-09a-A-exec-staging-smoke-runtime |
| phase | 8 / 13 |
| wave | 9a-fu |
| mode | sequential（G1-G4 独立承認のため） |
| 作成日 | 2026-05-06 |
| taskType | implementation-spec |
| visualEvidence | VISUAL_ON_EXECUTION |
| issue | #494 (UT-09A-A-EXEC-STAGING-SMOKE-001) |

## 目的

09a-A spec（`docs/30-workflows/issue-494-09a-A-exec-staging-smoke-runtime/phase-08.md`）が確定した DRY 設計を本実行タスクで再利用しつつ、本タスク固有の責務である「実行手順 + evidence 取得」のみに記述を絞る。spec 側で確定済の判定基準・関数シグネチャ予約・unassigned-task 起票テンプレは spec 参照に委ね、本 Phase では重複しない。

## spec 側との重複排除（DRY 方針）

| 項目 | spec 側（09a-A `phase-08.md`） | 本タスク（issue-494） |
| --- | --- | --- |
| 重複検出対象 D1〜D6 の定義 | spec が正本。本タスクは参照のみ | 参照リンクのみ記載 |
| 共通化判定基準（再利用回数 ≥ 3） | spec が正本 | 参照リンクのみ記載 |
| `scripts/staging-smoke/` 配下の関数シグネチャ予約 | spec が正本 | 参照リンクのみ記載 |
| unassigned-task 起票テンプレ | spec が正本 | 参照リンクのみ記載 |
| 既存共通モジュールの呼出箇所マトリクス | spec が定義 | 本タスクの実行 step に **紐付ける** |
| 実 staging 実行 shell snippet | spec は inline 記述指示のみ | 本タスクが **実行可能形で記述** |
| evidence パス命名規則 | spec の Phase 2 が確定 | 本タスクは **その命名規則に従う** |

> 重複説明は禁止（CONST_007 隣接ルール）。spec 側で定義済の項目は参照リンクで完結させる。

## 本タスクの shell snippet 統一ルール（`scripts/cf.sh` 経由）

### 禁止事項

- `wrangler` を直接実行しない（CLAUDE.md「Cloudflare 系 CLI 実行ルール」）。
- `npx wrangler` / `pnpm wrangler` も禁止。
- `op run` を直接呼ばない（`scripts/cf.sh` 内部で `scripts/with-env.sh` 経由で注入される）。
- `~/.wrangler/config/default.toml` の OAuth トークンに依存しない。

### 必須ラッパー

| 操作 | コマンド形 |
| --- | --- |
| 認証確認 | `bash scripts/cf.sh whoami` |
| API/Web deploy | `bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging` / `--config apps/web/wrangler.toml --env staging` |
| D1 migration list | `bash scripts/cf.sh d1 migrations list ubm-hyogo-db-staging --env staging` / `... ubm-hyogo-db-prod --env production` |
| D1 migration apply（staging のみ） | `bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-staging --env staging` |
| D1 read-only query（PRAGMA / SELECT） | `bash scripts/cf.sh d1 execute <db> --env <env> --json --command "..."` |
| wrangler tail | `bash scripts/cf.sh tail ubm-hyogo-api-staging --env staging --format json` |
| deployments list（rollback 候補抽出） | `bash scripts/cf.sh deployments list --config apps/api/wrangler.toml --env staging` |
| rollback（取得不能時のみ） | `bash scripts/cf.sh rollback <VERSION_ID> --config apps/api/wrangler.toml --env staging` |

### redaction 統一

すべての log / curl / d1 dump / wrangler tail の保存前に以下のパイプを通す（spec 側 phase-08 D4 項目と整合）:

```
| bash scripts/lib/redaction.sh
```

`scripts/lib/redact.sh` という名称は **存在しない**。正本は `scripts/lib/redaction.sh`（spec 側 phase-08 の誤名注記と整合）。

redaction 対象パターン（既存 `scripts/lib/redaction.sh` が保持）:

- `Authorization: Bearer ...`
- `Cookie: ...`
- email アドレス（`[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}`）
- `token=...` / `access_token=...` / `refresh_token=...`
- API key 文字列（`sk-` プレフィックス、`API_KEY=...`）
- IPv4 / IPv6（client IP）

## evidence パス命名規則（Phase 2 と整合）

Phase 2 で確定した evidence root は `docs/30-workflows/issue-494-09a-A-exec-staging-smoke-runtime/outputs/phase-11/evidence/` である（issue 本文「必須証跡パス」表で明示）。本タスクの evidence は **すべて spec タスク側の root に保存する**（issue-494 タスクディレクトリには Phase 8〜10 の `outputs/phase-XX/main.md` のみ保存）。

| 種別 | 命名規則 | 例 |
| --- | --- | --- |
| preflight | `preflight/cf-whoami.log` | （単一ファイル） |
| deploy | `deploy/deploy-<api\|web>-staging.log` | `deploy/deploy-api-staging.log` |
| D1 migration | `d1/d1-migrations-<staging\|prod>.log` | `d1/d1-migrations-staging.log` |
| D1 schema parity | `d1/d1-schema-parity.json` | （単一ファイル） |
| Forms sync | `forms/<forms-schema-sync\|forms-responses-sync\|sync-jobs-staging\|audit-log-staging>.<log\|json>` | `forms/sync-jobs-staging.json` |
| Playwright | `playwright/` ディレクトリ（report / trace） | `playwright/index.html` |
| screenshots | `screenshots/<public-members\|login\|me\|admin>-staging.png` | `screenshots/me-staging.png` |
| wrangler tail | `wrangler-tail/api-30min.log` | （単一ファイル） |
| QA | `qa-<gate>.{log,json,md,diff}` | `qa-secret-leak.log` |

> placeholder（`NOT_EXECUTED`）と実測 evidence は **物理パス分離不要**（同一ファイルを上書きする）。ただし上書き後に `grep -r 'NOT_EXECUTED'` で 0 hit を検証する（Phase 9 Q6）。

## 実行手順（本 Phase の作業）

1. spec 側 `phase-08.md` の重複検出対象 D1〜D6 と関数シグネチャ予約を**参照のみ**で取り込む。本タスクで再カウント・再判定はしない（spec 確定済）。
2. 本タスクの Phase 5 / Phase 11 ランブック草案を読み、`scripts/cf.sh` 直接呼び出し以外の wrangler 系コマンドが残存していないことを grep 検証（`grep -nE '(^|[^/])wrangler ' phase-*.md` が 0 hit）。
3. redaction パイプ（`| bash scripts/lib/redaction.sh`）が log / curl / d1 dump / wrangler tail の保存ステップにすべて付与されていることを grep 検証（`grep -c 'redaction.sh' phase-05.md phase-11.md` が想定回数以上）。
4. evidence パス命名規則の整合確認（本 Phase「evidence パス命名規則」表 ↔ Phase 2 ↔ Phase 11 ランブック）。
5. 本 Phase の成果物 `outputs/phase-08/main.md` に判定結果（grep 件数 / 整合 OK / NG）と spec 側 phase-08 への参照リンクを記録する。

## 既存共通モジュール再利用箇所マトリクス（本タスク step 紐付け）

| モジュール | 本タスク呼出箇所 |
| --- | --- |
| `scripts/cf.sh` | Phase 5 G1 deploy / G2 D1 apply / G3 wrangler tail、Phase 11 全 D1 系 evidence 取得、Phase 6 rollback / deployments list |
| `scripts/with-env.sh` | `cf.sh` 内部経由のみ。直接呼び出し禁止 |
| `scripts/lib/redaction.sh` | Phase 5 G1〜G3 の log 保存前パイプ、Phase 11 全 evidence 保存前パイプ、Phase 9 Q4 secret leak 再検証 |
| `mise exec --` | Phase 11 Playwright 実行（`mise exec -- pnpm --filter web exec playwright test ...`）、`pnpm` 系全般 |

## 多角的チェック観点

- spec 側 phase-08 と内容が重複していない（参照リンクのみ）
- `wrangler` / `npx wrangler` / `pnpm wrangler` 直接実行が phase-05 / phase-11 に残っていない
- redaction snippet が log / curl / d1 / tail のすべての保存ステップに付与されている
- evidence パス命名規則が Phase 2 / issue 本文「必須証跡パス」表と一致している
- production への副作用が混入しない（`--env production` は read-only `migrations list` / `PRAGMA` / `SELECT` のみ）
- secret / PII を本 Phase 仕様書に書かない（コマンドの引数値は plaintext で記述しない）
- CONST_007: spec 側で確定済の項目を本 Phase で先送り再判定しない

## サブタスク管理

- [ ] spec 側 `phase-08.md` 参照リンクの整合確認
- [ ] `wrangler` 直接実行の grep 検証（0 hit）
- [ ] `scripts/lib/redaction.sh` パイプの grep 検証
- [ ] evidence パス命名規則の整合確認（Phase 2 / issue 本文 / 本 Phase 表）
- [ ] 既存共通モジュール再利用箇所マトリクスを Phase 5 / Phase 11 step に紐付け
- [ ] `outputs/phase-08/main.md` を作成

## 成果物

- `docs/30-workflows/issue-494-09a-A-exec-staging-smoke-runtime/outputs/phase-08/main.md`

## 完了条件

- [ ] 本 Phase の成果物と検証結果を確認済み。

- spec 側 phase-08 との重複排除（参照リンク化）が完了している
- `wrangler` 直接実行 0 hit / `redaction.sh` パイプ付与の grep 検証が記録されている
- evidence パス命名規則が spec 側 Phase 2 と整合している
- 既存共通モジュール再利用箇所マトリクスが本タスク step に紐付いている
- `outputs/phase-08/main.md` に判定結果が記録されている

## タスク100%実行確認

- [ ] 必須セクションがすべて埋まっている
- [ ] 本 Phase で実装、deploy、commit、push、PR を実行していない
- [ ] CONST_007 違反（「Phase XX で再判定」型の先送り）が無い
- [ ] secret / PII の plaintext を本仕様書に書いていない

## 次 Phase への引き渡し

Phase 9 へ:

- `wrangler` 直接実行 0 hit と redaction パイプ付与の grep 検証結果
- evidence パス命名規則の整合判定
- 既存共通モジュール再利用箇所マトリクス（Phase 5 / Phase 11 step 紐付け済）
- spec 側 phase-08 参照リンク（unassigned-task 起票が必要な場合の経路）

## 参照資料

- `docs/30-workflows/issue-494-09a-A-exec-staging-smoke-runtime/phase-08.md`（spec 正本）
- `docs/30-workflows/issue-494-09a-A-exec-staging-smoke-runtime/phase-02.md`（evidence パス命名規則 正本）
- `docs/30-workflows/issue-494-09a-A-exec-staging-smoke-runtime/phase-11.md`（実行 step）
- `scripts/cf.sh` / `scripts/with-env.sh` / `scripts/lib/redaction.sh`
- `CLAUDE.md`（Cloudflare 系 CLI 実行ルール / シークレット管理）
- GitHub Issue #494

## 実行タスク

- [ ] phase-08 の既存セクションに記載した手順・検証・成果物作成を実行する。

## 統合テスト連携

Phase 8 自体では統合テストを実行しない。Phase 11 runtime execution の Playwright staging smoke、D1 schema parity、Forms sync dump、wrangler tail redaction check が同じ `outputs/phase-11/evidence/` root を使うように、Phase 8 では出力先と共通 helper の重複排除を確認する。
