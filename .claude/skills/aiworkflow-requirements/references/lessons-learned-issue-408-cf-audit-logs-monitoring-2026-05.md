# Lessons Learned — Issue #408 Cloudflare Audit Logs Monitoring (2026-05)

Cloudflare Account-level Audit Logs を D1 へ取り込み、severity classifier と GitHub Issue 連携で監視する実装で得られた知見。根拠は `apps/api/migrations/0014_create_cf_audit_log.sql` / `scripts/cf-audit-log/*.ts` / `docs/30-workflows/completed-tasks/issue-408-cf-audit-logs-monitoring/outputs/phase-12/implementation-guide.md`。

---

## L-ISSUE408-001: Audit Logs API は cursor pagination + INSERT OR IGNORE で中断耐性を持たせる

### 現象
Cloudflare Audit Logs API は `per_page=1000` の cursor-based pagination を採る。ネットワーク断や rate limit で取り込みが中断すると、次回 run で重複 fetch が発生し PRIMARY KEY 衝突で D1 INSERT が失敗する。

### 原因分析
イベント `id` は CF 側が一意採番するため再 fetch しても同じ id が返る。PK 衝突を例外で扱うと部分成功時の re-run が困難になる。

### 採用解決策
`scripts/cf-audit-log/d1-client.ts` の `insertAuditEvents` で `INSERT OR IGNORE INTO cf_audit_log (...)` を使い、重複は黙殺する。cursor は最終 page まで進めることのみ責務とし、ingest の冪等性は PK + IGNORE に寄せる。

### 再利用ガイド
外部 API の cursor pagination を D1 へ取り込む場合、API 側で安定した一意 ID を持つなら `INSERT OR IGNORE` を default とする。アプリ層で「重複検知 → skip」を書かない。

---

## L-ISSUE408-002: Account-level Audit Logs には Account scope の API Token が必須

### 現象
deploy 用に流用していた Zone scope token で audit logs endpoint を叩くと 403 が返り、ingest が一切進まない。

### 原因分析
Cloudflare Audit Logs は account-level resource。Zone:Read や Workers:Edit では到達できず、明示的に `Account: Audit Logs:Read` scope を付与した token が必要。

### 採用解決策
監視専用 token `CF_AUDIT_TOKEN_PROD` を新規発行し `Account: Audit Logs:Read` のみ付与。`scripts/cf-audit-log/cloudflare-client.ts` から参照する。deploy 用 `CLOUDFLARE_API_TOKEN` とは secret 名を分離。

### 再利用ガイド
Cloudflare の新規 API endpoint を採用する際は最初に `Account scope か Zone scope か` を判定し、deploy token を流用しない。L-ISSUE408-007 と併読。

---

## L-ISSUE408-003: WranglerD1 経由の `wrangler d1 execute` は数値以外を quote して shell injection を防ぐ

### 現象
ローカル node スクリプトから D1 へ書き込むため `wrangler d1 execute --remote --json` を `execFileSync` で呼ぶ際、actor_email / raw_json などに `'` `;` を含む文字列が来ると SQL が破壊される/任意コマンド実行余地が生じる。

### 原因分析
`wrangler d1 execute --command "<sql>"` は SQL 文字列をそのまま受け取り placeholder binding を持たない。文字列パラメータを連結すると quote escape が必須になる。

### 採用解決策
`scripts/cf-audit-log/d1-client.ts` の WranglerD1 実装で、param が `number` ならそのまま、それ以外は `'...'` で quote し内部 `'` は `''` にエスケープして埋め込む。`execFileSync("bash", args)` で argv-list 渡しにし、shell concat を排除。

### 再利用ガイド
Workers binding を介さず CLI 経由で D1 を書く場合、param 型ごとの quoting helper を必ず噛ませる。テンプレートリテラルでの直接展開は禁止。

---

## L-ISSUE408-004: GitHub Issue 連携は Octokit を避けて `fetch` 直叩き

### 現象
`@octokit/rest` を依存に入れると node スクリプトの bundle と install 時間が膨らみ、cron 実行 latency が悪化する。

### 原因分析
監視用途で必要な操作は `POST /repos/{owner}/{repo}/issues` と `PATCH` の数 endpoint のみ。Octokit のフル機能は不要。

### 採用解決策
`scripts/cf-audit-log/issue-reporter.ts` で `globalThis.fetch` を直接使い `Authorization: token <GITHUB_TOKEN>` で REST を呼ぶ。型は最小限の interface だけ宣言。

### 再利用ガイド
GitHub REST 利用箇所が 3 endpoint 以下の小規模スクリプトでは Octokit を入れず fetch 直叩きを default にする。多機能化が確定した時点で Octokit に移行。

---

## L-ISSUE408-005: API Token rotation 中の誤検知抑止は環境変数の時刻 window で行う

### 現象
監視 token / deploy token の rotation 直後は `actor_email` が新規になり、severity classifier の baseline 比較で `unknown actor surge` を発火させてしまう。

### 原因分析
classifier は過去 N 日 baseline と当日 actor 集合を diff するため、rotation 由来の新規 actor も異常扱いされる。

### 採用解決策
`CF_AUDIT_ROTATION_WINDOW="<startISO>,<endISO>"` を classifier に渡し、window 内に occurred_at が入る event は `severity` を 1 段下げて Issue 起票しない。`scripts/cf-audit-log/severity-classifier.ts` で参照。

### 再利用ガイド
人為操作で誤検知が確定する期間は config secret ではなく run-time 環境変数で window 指定する。コード側に rotation 履歴を残さない（git log で残る粒度に留める）。

---

## L-ISSUE408-006: TTL purge は migration ではなく `analyze.ts` 末尾で毎時 DELETE する

### 現象
30日 TTL を migration の trigger / scheduled query で実装しようとすると、D1 は `EVENT` トリガを持たないため、結局アプリ側の DELETE が必要になる。migration を re-run / rollback する設計も困難。

### 原因分析
D1 migration は `IF NOT EXISTS` で冪等化する前提で、purge ロジックを混ぜると schema と data lifecycle が結合し再適用困難になる。

### 採用解決策
`scripts/cf-audit-log/analyze.ts` の末尾で `purgeOlderThan(db, untilMs - 30 * 86_400_000)` を実行し、毎時 schedule 駆動で `DELETE FROM cf_audit_log WHERE occurred_at_ms < ?` を発火する。migration 0014 には DDL のみ置く。

### 再利用ガイド
D1 で TTL が必要なテーブルは「DDL は migration、purge はアプリの schedule」に責務分離する。schema migration に DML / lifecycle を入れない。

---

## L-ISSUE408-007: 監視 token と deploy token は必ず別 secret で保つ

### 現象
初期検討で `CLOUDFLARE_API_TOKEN` を audit ingest にも流用する案が出たが、deploy token は `Workers Scripts:Edit` など書き込み権限を持つため、監視ジョブのログ流出時の被害半径が過大になる。

### 原因分析
権限境界の最小化原則。監視は read-only で十分なのに deploy 権限を持つ token を使うと「監視ジョブ侵害 = 全 production への deploy 可能」となる。

### 採用解決策
`CF_AUDIT_TOKEN_PROD` (Account: Audit Logs:Read のみ) と `CLOUDFLARE_API_TOKEN` (deploy) を GitHub Secrets / 1Password 上で別 item として管理。`scripts/cf.sh` 経由の deploy では後者、`scripts/cf-audit-log/*` では前者のみ参照。

### 再利用ガイド
新規ジョブを追加する際は「必要な scope を最小に絞った専用 token を新規発行する」を default とし、既存 token 流用は禁止する。L-ISSUE408-002 と併読。

---

## 参照元

- `apps/api/migrations/0014_create_cf_audit_log.sql`
- `scripts/cf-audit-log/d1-client.ts` (INSERT OR IGNORE / WranglerD1 quoting / purgeOlderThan)
- `scripts/cf-audit-log/analyze.ts` (TTL purge schedule)
- `scripts/cf-audit-log/severity-classifier.ts` (rotation window)
- `scripts/cf-audit-log/issue-reporter.ts` (fetch 直叩き)
- `docs/30-workflows/completed-tasks/issue-408-cf-audit-logs-monitoring/outputs/phase-12/implementation-guide.md`
