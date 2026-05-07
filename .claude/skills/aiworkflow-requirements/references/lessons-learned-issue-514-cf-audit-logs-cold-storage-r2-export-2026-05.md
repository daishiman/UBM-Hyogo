# Lessons Learned — Issue #514 Cloudflare Audit Logs Cold Storage / R2 Export (2026-05)

Issue #408 で D1 `cf_audit_log` に 30 日保管された audit log を、半期監査用に R2 cold storage へ daily export する実装で得られた知見。根拠は `apps/api/migrations/0015_add_audit_export_manifest.sql` / `scripts/cf-audit-log/{export-to-r2,object-key,manifest-store,r2-client,redaction-guard,restore-drill}.ts` / `.github/workflows/cf-audit-log-cold-storage.yml` / `docs/30-workflows/completed-tasks/issue-514-cf-audit-logs-cold-storage-r2-export/outputs/phase-12/implementation-guide.md`。

---

## L-ISSUE514-001: artifacts.json は root 編集正本 + outputs/ mirror で同値性を `cmp -s` で保証する

### 現象
Phase 12 の strict 7 outputs 検証で `artifacts.json` が root と `outputs/artifacts.json` の双方で要求されるが、片方だけ更新する drift が発生し Phase 12 V-6 が PASS にならない。

### 原因分析
artifacts inventory は workflow root が編集正本、`outputs/` 側は Phase evidence mirror という二系統管理になっており、片方の手書き編集だけで完結すると非対称になる。

### 採用解決策
`artifacts.json` を root で編集した後、必ず `cp` または同内容で `outputs/artifacts.json` を更新し、Phase 12 V-6 の verification step として `cmp -s artifacts.json outputs/artifacts.json` を逐回実行する。差分が出た時点で fail-closed。

### 再利用ガイド
artifacts inventory を要する Phase 12 strict task は、root と outputs/ の `artifacts.json` を 2-file pair として扱う。片方だけ編集する手順を docs に書かない。

---

## L-ISSUE514-002: Phase 12 strict 7 outputs は PASS 判定前にすべて materialize する

### 現象
`main.md` だけ先に PASS 表記して残り 6 ファイルを後追いで作る運用に流れると、Phase 12 V-1 (`outputs/phase-12/` に 7 ファイル存在) が瞬間的に未充足のまま PASS が宣言される。

### 原因分析
Phase 12 は `main` / `implementation-guide` / `system-spec-update-summary` / `documentation-changelog` / `unassigned-task-detection` / `skill-feedback-report` / `phase12-task-spec-compliance-check` の 7 canonical outputs を strict に要求する。短縮名 (`impl-guide` / `feedback-report` 等) や欠損は許されない。

### 採用解決策
Phase 12 の execution 順序を「7 ファイルすべて draft 配置 → 各内容を埋める → PASS 表記」に固定する。`main.md` の PASS 行は他 6 ファイル materialize 完了後にのみ書く。

### 再利用ガイド
strict outputs を要する Phase は「全 placeholder 配置 → 内容充足 → PASS 宣言」の 3-step を厳守。途中で PASS 表記しない。

---

## L-ISSUE514-003: `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` は runtime PASS と区別する語彙境界

### 現象
SSOT 同期が完了し Phase 11/12 ledger が揃った段階で「PASS」と書くと、production runtime evidence (G1-G4) が未取得でも完了扱いに見える。

### 原因分析
NON_VISUAL タスクで production 操作 (R2 bucket 作成 / D1 migration apply / first export / restore drill) が未実行のうちは、boundary (spec / SSOT / local code) は同期されても runtime は pending という二重状態が存在する。語彙が一語化されると区別が消える。

### 採用解決策
`main.md` / `system-spec-update-summary.md` / `phase12-task-spec-compliance-check.md` の総合判定に `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` を採用し、`PASS` 単独セルは Phase 12 V-6 (`rg -n '^\| [^|]*\| PASS \|'` が 0 件) で禁止する。runtime PASS は G1-G4 完了後に別表記する。

### 再利用ガイド
NON_VISUAL implementation task で production 操作が user approval 待ちの段階は `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` を一貫して使う。`PASS` 単独表記は Phase 13 G4 完了後にのみ許可。

---

## L-ISSUE514-004: irreversible NON_VISUAL pre-deploy gate ordering を G1 -> G2 -> G3-prod -> G4 で固定する

### 現象
初版仕様で「first daily export」を D1 migration apply より先に実行する想定が書かれており、manifest table 不在のため最初の export が必ず失敗する依存関係矛盾が発生していた。

### 原因分析
G1 (R2 bucket / binding / Secret preflight) / G2 (D1 migration apply for `cf_audit_log_export_manifest`) / G3-prod (first export + restore drill) / G4 (commit / push / PR) は、後段が前段の成果物に依存する一方向 DAG。任意順 user approval にすると irreversible な production 操作で逆順が発生する。

### 採用解決策
仕様書 phase-12.md / phase-13.md / `references/observability-monitoring.md` / `references/deployment-secrets-management.md` / `docs/00-getting-started-manual/specs/15-infrastructure-runbook.md` で G1 -> G2 -> G3-prod -> G4 の順序を逐語明記し、Phase 13 skeleton outputs (g1/g2/g3 のログ placeholder) も同順で配置。

### 再利用ガイド
irreversible production 操作を含む multi-gate user-approval workflow は「gate sequence DAG」を仕様書の単一節に固定し、複数 SSOT に同順で複写する。逆順を許す書き方 (gate を箇条書き flat list で並べる等) は禁止。

---

## L-ISSUE514-005: 月次 cadence は daily `0 2 * * *` + `[now - 29d, now - 26d)` window + completed manifest skip に補正する

### 現象
初版で「月次 export」と仕様化したところ、(a) D1 30 日 retention に間に合わない (29 日目に単発 export だと前月分が落ちる)、(b) cron 失敗時のリカバリ window が 1 ヶ月空く、(c) manifest UNIQUE key を月単位にすると粒度が粗く再 export が困難、という 3 つの問題が同時発生した。

### 原因分析
cold storage cadence は「retention TTL より十分短い間隔」で「冪等な partition」で「再 run 可能」である必要があるが、monthly では 3 条件すべてを満たせない。

### 採用解決策
daily `0 2 * * *` で `[now - 29d, now - 26d)` の 3 日 window を export し、`cf_audit_log_export_manifest` が completed の partition は skip する idempotent 設計に変更。1 partition = 1 UTC 日 = 1 R2 object key (`audit/v1/yyyy=YYYY/mm=MM/dd=DD/cf-audit-log-YYYYMMDD.jsonl.gz`)。

### 再利用ガイド
TTL 付き source からの cold storage export は「TTL の 3-10% 程度の cadence」「partition = 最小 calendar 単位 (UTC day)」「completed manifest skip による冪等性」を default とする。monthly export を仕様初版で書かない。

---

## L-ISSUE514-006: exporter schema は source D1 (`cf_audit_log.occurred_at`) に整合し、manifest に `r2_etag` を追加する

### 現象
exporter 初版が独自 timestamp 列を要求し、`cf_audit_log.occurred_at_ms` (Issue #408 schema) と非互換だったため、export 行が source schema と乖離。また manifest に `r2_etag` 列がなく R2 PUT 後の整合性検証ができなかった。

### 原因分析
新規 cold storage 機能を独立設計すると、source schema を再発明してしまう。R2 PUT は eventually consistent なので etag を保持しないと事後検証が `LIST + HEAD` 二段になり高コスト。

### 採用解決策
exporter は `cf_audit_log` の `occurred_at_ms` (BIGINT) を読み、UTC 日付に変換して partition 化する。manifest table に `r2_etag TEXT` を追加し、R2 `If-None-Match: *` PUT のレスポンス etag を completed 行に書き込む。`scripts/cf-audit-log/export-to-r2.ts` / migration `0015_add_audit_export_manifest.sql` で実装。

### 再利用ガイド
既存 D1 table から派生する cold storage は、source schema column を再発明せず参照する。R2 PUT を伴う manifest は etag / sha256 を必ず保持する。

---

## L-ISSUE514-007: redaction guard は raw token / Bearer / full IP / UA / email / secret hash を全 sink で additive に enforce する

### 現象
cold storage は半期監査で人手参照されるため、D1 上で部分 redaction されている値でも JSONL 化過程で raw 値が混入する余地があった。grep guard を「主要 field 1-2 件」だけにすると新規 field 追加時に見落とす。

### 原因分析
redaction policy は negative list (これは隠す) で書くと将来 field 追加時に拡張漏れが起きる。grep guard を 1 ファイルだけに置くと sink (export JSONL / log line / Issue body) が増えた時に局所化できない。

### 採用解決策
`scripts/cf-audit-log/redaction-guard.ts` で raw token regex / `Bearer ` prefix / full IPv4/IPv6 / User-Agent string / email pattern / secret hash の 6 カテゴリすべてを追加方式で grep し、export JSONL / restore drill 出力 / 失敗 Issue body の 3 sink に同一 guard を適用。違反時は fail-closed で R2 PUT を止め manifest `failed` + security Issue 起票。

### 再利用ガイド
個人情報 / 認証情報を含む可能性がある cold storage / log export では、redaction を「全カテゴリ additive grep + 全 sink 共通 guard + fail-closed」の 3 軸で固定する。sink 追加時に guard 適用を忘れない仕組みを CI で担保する。

---

## 参照元

- `apps/api/migrations/0015_add_audit_export_manifest.sql` (manifest schema)
- `scripts/cf-audit-log/export-to-r2.ts` (daily export entry)
- `scripts/cf-audit-log/object-key.ts` (`audit/v1/yyyy=.../cf-audit-log-YYYYMMDD.jsonl.gz`)
- `scripts/cf-audit-log/manifest-store.ts` (`pending -> completed/failed` 2-phase)
- `scripts/cf-audit-log/r2-client.ts` (`If-None-Match: *` PUT + etag capture)
- `scripts/cf-audit-log/redaction-guard.ts` (6-category additive grep, all sinks)
- `scripts/cf-audit-log/restore-drill.ts` (sha256 round-trip, temp-table verify)
- `.github/workflows/cf-audit-log-cold-storage.yml` (`0 2 * * *`, `[now-29d, now-26d)`)
- `docs/30-workflows/completed-tasks/issue-514-cf-audit-logs-cold-storage-r2-export/outputs/phase-12/implementation-guide.md`
- `docs/00-getting-started-manual/specs/15-infrastructure-runbook.md` (G1-G4 runbook)
