# Phase 2: アーキテクチャ設計 / モジュール配置 / データフロー

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 2 |
| Source | `outputs/phase-2/phase-2.md` |
| 区分 | 設計 |
| 想定所要 | 0.5 人日 |

## 目的

Phase 1 で確定した SSOT を前提に、`apps/api/src/audit-correlation/`、`scripts/audit-correlation/`、`.github/workflows/audit-correlation-verify.yml` の物理配置 / データフロー / 外部接続点 / ストレージ設計を確定する。

## 実行タスク

1. **モジュール配置**
   - `apps/api/src/audit-correlation/`: 純粋関数 + GitHub fetch クライアント。Hono ルートからは独立（バックグラウンド処理 / cron / on-demand 起動の双方で利用可能な pure module）。
   - `scripts/audit-correlation/`: ローカル / CI 用 fixture runner（bash + node 経由で TS を実行）。
   - `scripts/audit-correlation/fixtures/`: 入力 fixture（GitHub / Cloudflare 各 3 件以上 + edge case）。
   - `.github/workflows/audit-correlation-verify.yml`: PR / push トリガで fixture 駆動 verify を恒久実行。

2. **データフロー**
   ```
   [GitHub /orgs/{org}/audit-log]  --(fetch)-->  rawGitHubEvents[]
   [Cloudflare audit logs (#408)]  --(read)-->   rawCloudflareEvents[]
              ↓                                          ↓
       redact() + fingerprint()                  redact() + fingerprint()
              ↓                                          ↓
       normalizedGitHub[]   ─────── correlate() ─────── normalizedCloudflare[]
                                       ↓
                          CorrelatedFinding[] (timeline merge)
                                       ↓
                        runbook trigger / evidence emit
   ```

3. **外部 API 接続点**
   - GitHub: `GET /orgs/{org}/audit-log?per_page=100&phrase=...`（pagination 対応 / rate limit 検出時 exponential backoff）。
   - Cloudflare 側: Issue #408 の正規化済み出力（D1 or KV or stdout JSON）を入力として受ける。本タスクでは fixture からのみ読む。

4. **ストレージ設計**
   - 本タスクは **stateless 処理** を基本とし、D1 への書き込みは行わない。
   - 出力は JSON stdout のみ（runbook / runner が消費）。永続化が必要になった場合の D1 schema は将来 follow-up で別途設計。

5. **`.github/workflows/*.yml` 実在確認 gate**
   - 既存ワークフロー名と衝突しないことを `ls .github/workflows/` で確認。
   - actionlint が利用可能（fallback として `pnpm dlx @rhysd/actionlint-runner` 等）。

## 統合テスト連携

Phase 4 で「fetch クライアントが pagination の last page を正しく終了する」「rate limit 429 で backoff する」契約テストを設計。Phase 10 で fixture 駆動 dry-run を実施。

## 参照資料

- Phase 1 outputs（join key SSOT）
- GitHub REST API docs: organizations/audit-log
- CLAUDE.md「主要ディレクトリ」「重要な不変条件 5」（D1 直接アクセスは apps/api に閉じる）

## 成果物

- `outputs/phase-2/phase-2.md`
  - モジュール配置図（テキスト ASCII）
  - データフロー図（上記）
  - 外部接続点の一覧
  - ストレージ判断（stateless）
  - 既存ワークフロー名衝突なしの確認結果

## 完了条件（DoD）

- [ ] モジュール配置が `apps/api/src/audit-correlation/`、`scripts/audit-correlation/`、`.github/workflows/audit-correlation-verify.yml` の 3 拠点で確定。
- [ ] データフローが Phase 1 の SSOT と整合（redact → fingerprint → correlate の順）。
- [ ] stateless 処理を採用する根拠が記述されている。
- [ ] `.github/workflows/audit-correlation-verify.yml` 名が既存と衝突しないことを確認。
