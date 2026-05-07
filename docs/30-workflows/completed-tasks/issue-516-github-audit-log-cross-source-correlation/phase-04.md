# Phase 4: テストファースト / 契約テスト設計

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 4 |
| Source | `outputs/phase-4/phase-4.md` |
| 区分 | テスト設計（テストコードは Phase 5 と並行で red → green） |
| 想定所要 | 1 人日 |

## 目的

Phase 3 の契約に対するテストを先に整備し、Phase 5 実装が green になるまでの red baseline を作る。grep gate（secret / full IP / full UA 非保存）を CI 恒久化する設計を確定する。

## 実行タスク

1. **追加テストファイル一覧**

| ファイル | フレームワーク | 主目的 |
| --- | --- | --- |
| `apps/api/src/audit-correlation/__tests__/redact.test.ts` | vitest | redaction / fingerprint 決定論性 |
| `apps/api/src/audit-correlation/__tests__/correlate.test.ts` | vitest | timeline merge / severity 判定 |
| `apps/api/src/audit-correlation/__tests__/github-fetch.test.ts` | vitest + msw | pagination / 401 / 429 backoff |
| `apps/api/src/audit-correlation/__tests__/contract.test.ts` | vitest | 型契約 (Raw → Normalized) |
| `scripts/audit-correlation/__tests__/grep-gate.bats` | bats | 出力 JSON に secret / full IP / full UA が含まれない |
| `scripts/audit-correlation/__tests__/runner-determinism.bats` | bats | 同一 fixture で 2 回 run → diff なし |

2. **テストケース ID（TC-RED-NN）**

| ID | 対象 | 期待 |
| --- | --- | --- |
| TC-RED-01 | `computeFingerprint` 同一入力 + 同一 salt | 同じ hash |
| TC-RED-02 | `computeFingerprint` 同一入力 + 異なる salt | 異なる hash |
| TC-RED-03 | `computeFingerprint` 全 undefined 入力 | `FingerprintInputEmptyError` throw |
| TC-RED-04 | `redactGitHub` 出力に `actor_ip` 完全文字列が含まれない | 含まない |
| TC-RED-05 | `redactGitHub` 出力に `user_agent` 完全文字列が含まれない | 含まない |
| TC-RED-06 | `redactCloudflare` 出力に `actor.email` 完全文字列が含まれない | local-part は hash のみ、domain は別カラム |
| TC-RED-07 | `correlate` 同一 fingerprintHash の 2 件を 1 group に merge | merge される |
| TC-RED-08 | `correlate` 異なる fingerprintHash | 別 group |
| TC-RED-09 | `fetchGitHubAuditEvents` 401 → `AuditFetchAuthError` throw | throw |
| TC-RED-10 | `fetchGitHubAuditEvents` 429 → 指数バックオフ後 success | success |
| TC-RED-11 | `correlate` 5 分以内の権限変更 + IP 急変 → severity HIGH | HIGH |
| TC-RED-12 | grep gate: 出力 JSON 中に `\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b` が無い（fixture 込み確認） | 無い |
| TC-RED-13 | grep gate: 出力 JSON 中に `User-Agent: ` プレフィクス文字列が無い | 無い |
| TC-RED-14 | grep gate: 出力 JSON 中に AWS/GitHub PAT 形式（`ghp_*`, `github_pat_*`）が無い | 無い |

3. **synthetic event 構造（fixture）**
   - `fixtures/github-workflow-run-success.json`: 通常の workflow 完了。
   - `fixtures/github-org-update-member.json`: 権限変更（HIGH 候補）。
   - `fixtures/cloudflare-login-fail.json`: ログイン失敗。
   - `fixtures/cloudflare-token-rotate.json`: token 回転。
   - `fixtures/edge-empty.json`: 空配列。
   - `fixtures/edge-rate-limit.json`: 429 シミュレーション。

4. **grep gate スクリプト方針**
   - `scripts/audit-correlation/grep-gate.sh`: correlation 結果 JSON ファイルを引数に取り、3 種の禁止パターンを `grep -E` で否定検査。検出時 exit 1。
   - 禁止パターン: `(\\b\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\b)` / `User-Agent: .+` / `(ghp_|github_pat_)[A-Za-z0-9_]+`。

## ローカル実行コマンド

```bash
mise exec -- pnpm --filter @ubm/api test src/audit-correlation
mise exec -- bash scripts/audit-correlation/__tests__/grep-gate.bats
mise exec -- bash scripts/audit-correlation/__tests__/runner-determinism.bats
```

## 統合テスト連携

Phase 7 の `audit-correlation-verify.yml` で上記 vitest + bats + grep-gate を恒久実行。Phase 11 で実行ログを `outputs/phase-11/test.log` / `grep-gate.log` に保存。

## 参照資料

- Phase 3 outputs（型シグネチャ）
- vitest docs / msw docs / bats docs
- CLAUDE.md「シークレット管理」

## 成果物

- `outputs/phase-4/phase-4.md`
  - テストファイル一覧
  - TC-RED-01〜TC-RED-14 のケース定義
  - fixture 一覧
  - grep gate 仕様

## 完了条件（DoD）

- [ ] テストファイル 6 本の配置先と framework が確定。
- [ ] TC-RED-01〜14 がすべて Phase 3 契約と整合。
- [ ] fixture 6 種類の I/O 仕様が記述されている。
- [ ] grep gate の禁止パターン 3 種類が確定。
