# Live Wiring タスク 運用パターン

> Cloudflare Worker / Slack incoming webhook / GitHub PAT / D1 secret を
> production にライブ接続する系のタスク（"live wiring"）で、Phase 1〜13 仕様書に
> 必ず反映すべき不変条件と Phase ごとの足し算ルール。
> Issue #553 (live audit-correlation endpoint) の実装結果を canonical 例とする。

## 適用条件（次のいずれか 1 件以上）

- production の Cloudflare Worker `scheduled` event を初めて有効化する
- 外部 webhook（Slack incoming webhook 等）に **HIGH 重大度の incident** を実投稿する
- 外部 audit log API（GitHub Audit / Cloudflare Audit 等）に PAT で実アクセスする
- redact-safe（fingerprint prefix のみ保存等）を保ちつつ D1 に finding 履歴を持たせる

実例: Issue #553 = U-FIX-CF-ACCT-01-DERIV-04-FU-04-FU-01。
`scheduled` cron + `/audit-correlation/run` internal endpoint の live 化。

---

## 1. Cloudflare `scheduled` event の retry-after 制約

Cloudflare Worker の `scheduled` event 内では **同期 sleep / リトライ待ち合わせを Worker 内で行わない**。
理由は CPU time 制約と「1 cron invocation = 1 実行」原則。

仕様書ルール:

- Phase 4（設計）: `scheduled` handler は `ctx.waitUntil(asyncWork().catch(logName))` パターンを正本とし、
  `setTimeout` / `await sleep` を禁則として明記する
- Phase 5（実装）: 失敗時のリトライは **次の cron cycle**（cron 間隔 = retry interval）に委ねる設計を artifacts に明記
- Phase 9（テスト）: `ctx.waitUntil` に Promise が渡ること / 同期 return / 失敗時 throw しないことを観測する
  （詳細 test pattern は int-test-skill `references/cloudflare-scheduled-and-redact-safe-pattern.md` 参照）
- 失敗 log は `name` のみ。`stack` / 値・hash・URL を **出さない**

---

## 2. redact-safe 不変条件を守る grep gate の配置位置

redact-safe（secret / 完全 hash / 完全 IP / 完全 UA / salt literal を **保存・通知・log しない**）を
コードレビューでなく **CI grep gate** で保証する。grep gate を置くべき 4 layer:

| layer | 監視対象ファイル | 禁則 literal |
|-------|----------------|-------------|
| route | `apps/api/src/routes/<area>/run.ts` | bearer token を 401 body に echo しない |
| persist | `apps/api/src/<area>/persist.ts` | 完全 fingerprint hash / 完全 IP を bind 引数に含めない |
| notify | `apps/api/src/<area>/notify-slack.ts` | webhook URL を payload body に echo しない |
| log | `console.error(...)` 全箇所 | `stack` / 値・hash・URL を出さない（`name` のみ） |

仕様書ルール:

- Phase 2（影響範囲）/ Phase 4（設計）で 4 layer 全部の grep gate コマンドを artifacts に literal で固定
- Phase 12 compliance check に「grep gate 4 layer 全実行 + exit code 記録」を必須項目化

---

## 3. test fixture placeholder と CI grep gate の整合

CI grep gate を src 配下のみに限定し、`__tests__/` 配下は除外する path フィルタを明示する。
test fixture には次の placeholder を canonical で固定:

| 役割 | placeholder |
|------|-------------|
| Slack webhook | `https://hooks.slack.com/services/X/Y/Z` |
| GitHub PAT | `ghp_dummy_test_value_xxxxxxxxxxxxxxxxxxxxxxxx` |
| salt | `'a'.repeat(32)` |
| internal token | `'t'.repeat(48)` |

仕様書ルール:

- Phase 9（テスト）outputs に **placeholder 一覧表** を固定し、
  実 secret / 実 webhook URL / 実 salt が test 配下に書かれない不変条件を artifacts に追加

---

## 4. fingerprintVersion による salt rotation 期間中の incident 履歴分離

salt rotation を実施すると、同一 actor に対して **rotation 前後で fingerprint hash が別値** になる。
incident 履歴の継続性を保つため、UNIQUE 制約と correlationKey に `fingerprintVersion` を必ず含める。

仕様書ルール:

- Phase 4 設計: `correlationKey = (fingerprintHash, fingerprintVersion)` を契約として固定
- Phase 5 migration: D1 unique index に `fingerprint_hash_prefix + observed_at + event_type` を入れ、
  `fingerprint_version` カラムも persist する（rotation 後の履歴衝突回避）
- Phase 12 implementation-guide: salt rotation 手順節に「rotation 前後の incident は別系列として
  扱う」「fingerprintVersion を bump する」を明記

---

## 5. Cloudflare Secrets 投入は 1Password op 参照経由のみ

ローカル `.env` には実値を絶対書かず、**`op://Vault/Item/Field` 参照のみ** を記述する
（CLAUDE.md `apps/web` env アクセス不変条件と同じポリシー）。

仕様書ルール:

- Phase 5 / Phase 13: secret 投入手順は **`bash scripts/cf.sh secret put <NAME> --env <env>`** で固定
  （`wrangler secret put` 直接実行を禁則化）
- Phase 13 outputs `secrets-injection-summary.md` に投入対象 secret 名一覧（**値は記載禁止**）と
  op 参照パスのみを残す
- `.dev.vars.example` には op 参照のみを書き、実値を書かない

投入対象例（Issue #553）:

- `GITHUB_AUDIT_PAT`
- `SLACK_AUDIT_INCIDENT_WEBHOOK_URL`
- `AUDIT_CORRELATION_SALT`
- `AUDIT_CORRELATION_INTERNAL_TOKEN`

---

## 6. Phase ごとの足し算チェックリスト

| Phase | live wiring 系で必須化する追加項目 |
|-------|----------------------------------|
| Phase 1 | taskType=implementation / visualEvidence=NON_VISUAL の宣言 + `references/non-visual-irreversible-task-rules.md` の参照タグ付け（Cloudflare Secrets 投入が含まれる場合） |
| Phase 2 | 影響範囲に「4 layer grep gate（route/persist/notify/log）」を明示 |
| Phase 4 | `scheduled` handler の `ctx.waitUntil` パターン / `correlationKey + fingerprintVersion` 契約 |
| Phase 5 | migration literal pin（NON_VISUAL ルール継承）+ secret 投入は `scripts/cf.sh secret put` 経由 |
| Phase 9 | scheduled handler / redact-safe / D1 INSERT OR IGNORE / authz 4 軸の Vitest contract test |
| Phase 11 | NON_VISUAL evidence 5 点（typecheck/lint/test/build/grep-gate）+ 4 layer grep gate exit code |
| Phase 12 | Phase 12 strict 7 outputs + grep gate 4 layer 実行記録 + redact-safe 不変条件 trace |
| Phase 13 | secret 投入手順は op 参照のみ / 実値・webhook URL の記載禁止 / Gate B（merge）と Gate C（cron schedule ON / secrets 投入）の独立承認 |

---

## アンチパターン

- ❌ `scheduled` handler 内で `setTimeout` / `await sleep` でリトライ
- ❌ webhook URL / salt literal / PAT 様 token を仕様書 / outputs / test fixture に直接記載
- ❌ grep gate を route layer のみに置き、persist / notify / log layer を未保護のまま release
- ❌ salt rotation 設計を後回しにし、`correlationKey` から `fingerprintVersion` を省く
- ❌ `wrangler secret put` を仕様書手順に書く（`scripts/cf.sh` ラッパー必須）

---

## 関連 reference

- [non-visual-irreversible-task-rules.md](non-visual-irreversible-task-rules.md) — 3-gate 分離 / migration literal pin
- [patterns-validation-and-audit.md](patterns-validation-and-audit.md) — 4 層 validator
- [phase-12-spec.md](phase-12-spec.md) — Phase 12 strict 7 outputs
- int-test-skill `references/cloudflare-scheduled-and-redact-safe-pattern.md` — 対応する test pattern
