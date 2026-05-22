# Phase 4: 環境準備 / 前提条件確認（着手 Gate と production verify）

## 目的

production env 切替（`CF_AUDIT_CLASSIFIER=threshold` → `=ml`）に着手する前段として、Gate-A〜C の通過を evidence で確認し、ローカル開発環境（mise / pnpm / 1Password CLI / Cloudflare API Token via `op`）と production D1 schema / model artifact の前提条件をすべて満たしていることを検証する。Phase 5 以降の実装計画 / 実装手順を着手可能な状態にする。

> 本タスク仕様書では index.md の Phase 名「I/O 契約」を Phase 5 へ繰り下げる代わりに、issue-549 固有の運用ゲート（Gate-A〜C / 7 日観測 / forward-safe rollback）を確実に踏むため、Phase 4 を「環境準備 / 前提条件確認」として再定義する（Phase 5/6/7 も同様に再定義）。設計内容は index.md / phase-01〜03 と完全整合する。

## 完了条件

- [ ] Gate-A〜C の evidence ファイル（`outputs/phase-11/gate/`）への参照が確定し、未通過時は本サイクル merge を行わない方針が明記されている
- [ ] ローカル環境で Node 24 / pnpm 10 が `mise exec --` 経由で確実に使えることを確認した
- [ ] `bash scripts/cf.sh whoami` が production account で 200 を返す
- [ ] production D1 (`ubm-hyogo-db-prod`) で `0016_cf_audit_log_classification.sql` が apply 済みであることを `bash scripts/cf.sh d1 migrations list` で再確認した
- [ ] production storage に model artifact が配置済みであることを `ML_MODEL_PATH=op://Employee/ubm-hyogo-env/CF_AUDIT_ML_MODEL_PATH_PROD` の参照経由で確認した
- [ ] 1Password に `CLOUDFLARE_API_TOKEN` / `cf-audit-ml/model_url` 等の Item が存在し、`op item get` で参照可能（実値は出力しない）

## 前 Phase 依存

- Phase 1: Gate decision table / 4 観測軸（Issue 起票数 / fallback rate / leakage grep / p95 latency）
- Phase 2: `cf-audit-log-monitor.yml` の post-step 挿入位置 / `MLClassifier` の `ML_MODEL_PATH` 読取経路
- Phase 3: env 切替フロー / model artifact 配布候補 / forward-safe rollback の 3 step

## 4-1. 着手 Gate の evidence 確認手順

| Gate | 必要 evidence | 確認コマンド / 参照先 | NG 時の挙動 |
| --- | --- | --- | --- |
| Gate-A | FU-03-C #548 offline replay で ML > threshold を示す JSON / md | `cat docs/30-workflows/<FU-03-C 配置先>/outputs/phase-11/replay-summary.md` | 切替を中止し index.md Gate-D（threshold 継続）へ |
| Gate-B | fallback rate / Issue body redaction が許容内 | 同上 evidence 内の `fallbackRate <= 0.05` / `leakageGrepResult == "clean"` | 切替を中止し artifact 再選定 Issue を起票 |
| Gate-C | rollback approval（rollback approval/governance evidence） | `gh pr view <rollback-runbook PR>` / `15-infrastructure-runbook.md` の承認履歴 | 承認取得まで merge 凍結 |

> 本サイクルでは env 切替 + observation script + runbook の contract を確定する。PR diff 作成と実 merge は Gate-A〜C 全通過 + rollback approval/governance evidence 後の実装サイクルに限定する（CONST_007 例外条件 1: 外部依存待ち）。

## 4-2. ローカル環境の前提

```bash
# Node 24 / pnpm 10 の確実化
mise install
mise exec -- node -v   # v24.15.0
mise exec -- pnpm -v   # 10.33.2

# 依存
mise exec -- pnpm install

# 1Password CLI
op --version           # 2.x 以上
op signin              # 既にログイン済みなら no-op

# 静的検査（後続 Phase の前提）
mise exec -- pnpm typecheck
mise exec -- pnpm lint
```

期待出力: いずれも exit 0。失敗時は Phase 5 へ進まず原因を解消する。

## 4-3. Cloudflare 認証 / production D1 確認

`scripts/cf.sh` 経由のみで実行する（`wrangler` を直接叩かない）。実値は `op run --env-file=.env` 経由で揮発的に注入される。

```bash
# 認証
bash scripts/cf.sh whoami

# production D1 schema (forward-safe 列の存在確認)
bash scripts/cf.sh d1 migrations list ubm-hyogo-db-prod --env production

# 期待: 0016_cf_audit_log_classification.sql が "applied" として表示される
# 列は parent #515 で apply 済みのため本サイクルでは追加 migration を作成しない（不変条件）

# 行サンプル（最小列のみ。raw_json は触らない）
bash scripts/cf.sh d1 execute ubm-hyogo-db-prod --env production \
  --command "SELECT classifier_used, classifier_version, COUNT(*) AS n FROM cf_audit_log GROUP BY 1,2 LIMIT 10;"
```

NG 時の対処:

- 0016 が未 apply → 本サイクルを停止し、issue-515 の migration apply フローに差し戻す（本タスクで apply しない）
- whoami が fail → 1Password Item / CLOUDFLARE_API_TOKEN op 参照を確認（実値はログに残さない）

## 4-4. model artifact / `ML_MODEL_PATH` 配置確認

| 配布候補 | 確認コマンド（実値は出力しない） | 期待 |
| --- | --- | --- |
| Cloudflare R2 | `bash scripts/cf.sh r2 object get $(op read 'op://Employee/ubm-hyogo-env/CF_AUDIT_ML_MODEL_PATH_PROD') --pipe \| wc -c` | `> 0` バイト |
| Workers AI binding | `bash scripts/cf.sh deploy --dry-run --config scripts/cf-audit-log/wrangler.toml --env production`（binding 解決のみ確認） | エラーなし |

> 配布先の確定は FU-03-C #548 成果物に従う。本 Phase では `ML_MODEL_PATH` が op 参照で resolve 可能であり、production storage に物理オブジェクトが存在することを確認するに留める。

## 4-5. 観測準備（4 観測軸の baseline）

production switch 前に threshold 期 baseline を取得し、phase-03 のサマリ表で比較できるよう保存する。

```bash
# 直近 7 日の hourly run 集計（threshold 期 baseline）
bash scripts/cf.sh d1 execute ubm-hyogo-db-prod --env production --command \
  "SELECT strftime('%Y-%m-%d %H:00', when_iso) AS hour,
          COUNT(*) AS events,
          SUM(CASE WHEN severity IN ('HIGH','MEDIUM') THEN 1 ELSE 0 END) AS issues
   FROM cf_audit_log
   WHERE classifier_used = 'threshold'
     AND when_iso >= datetime('now','-7 day')
   GROUP BY 1 ORDER BY 1;" \
  --json > /tmp/threshold-baseline-7day.json
```

baseline JSON は `outputs/phase-11/observation/baseline-threshold-7day.json` として後続で commit する（実値は redact 済み列のみ）。

## 4-6. 不変条件チェック

- D1 直接アクセス禁止 (apps/web): 本タスクは scripts 層 + workflow yml + docs のみ。apps/web へ変更を入れない
- `scripts/cf.sh` 経由のみ使用。`wrangler` を直接呼ばない
- 平文 `.env` 禁止。op 参照のみ
- `Closes` を使わない。PR 本文は `Refs #549`

## Handoff（Phase 5 へ渡す入力）

- Gate-A〜C の通過状態（`outputs/phase-11/gate/status.md` への参照）
- production D1 で 0016 列が apply 済みであることを示す migrations list 出力
- `ML_MODEL_PATH` が解決する production artifact の存在確認結果
- threshold 期 7 日 baseline JSON（後続の 7 日観測サマリ比較に使用）
- ローカル `pnpm typecheck` / `pnpm lint` が exit 0 であること

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 04 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| state | spec_created |

## 参照資料

- `index.md` ・ `phase-01.md` ・ `phase-02.md` ・ `phase-03.md`
- `docs/30-workflows/completed-tasks/issue-515-cf-audit-logs-ml-anomaly/outputs/phase-12/implementation-guide.md`
- `CLAUDE.md`（Cloudflare CLI 規約 / `apps/web` env 不変条件）
- `docs/00-getting-started-manual/specs/15-infrastructure-runbook.md`

## 実行タスク

| Task | 内容 |
| --- | --- |
| 04-1 | Gate-A〜C と production verify の前提を contract として確認する |
| 04-2 | 本サイクルでは runtime mutation を実行しない境界を記録する |

## 成果物/実行手順

本 Phase の成果物は `phase-04.md`。実行手順は Gate evidence path と production verify command contract の確認までであり、production mutation は実装サイクルへ渡す。

## 統合テスト連携

runtime integration test は実装サイクルで取得する。本 Phase は test plan の入力契約のみを定義する。
