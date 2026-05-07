# Phase 5: コア実装（fetch / redact / correlate）

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 5 |
| Source | `outputs/phase-5/phase-5.md` |
| 区分 | 実装 |
| 想定所要 | 1.5 人日 |

## 目的

Phase 3 の契約と Phase 4 のテストを満たすコア実装を `apps/api/src/audit-correlation/` に追加する。GitHub fetch contract / redact / fingerprint / correlate の 4 機能を実装し、fixture-only MVP として vitest を全件 green にする。production GitHub audit log live 接続と credential mutation は live wiring follow-up に残す。

## 変更対象ファイル一覧

| パス | 種別 | 概要 |
| --- | --- | --- |
| `apps/api/src/audit-correlation/types.ts` | 新規 | Phase 3 で確定した型を実体化 |
| `apps/api/src/audit-correlation/errors.ts` | 新規 | `AuditFetchAuthError` / `FingerprintInputEmptyError` |
| `apps/api/src/audit-correlation/github-fetch.ts` | 新規 | GitHub `/orgs/{org}/audit-log` クライアント |
| `apps/api/src/audit-correlation/redact.ts` | 新規 | redaction + fingerprint |
| `apps/api/src/audit-correlation/correlate.ts` | 新規 | timeline merge + severity 判定 |
| `apps/api/src/audit-correlation/index.ts` | 新規 | barrel export |
| `apps/api/src/audit-correlation/__tests__/*.test.ts` | 新規 | Phase 4 テスト本体 |

## 主要関数シグネチャ（Phase 3 契約に従う）

```ts
export async function fetchGitHubAuditEvents(opts: GitHubFetchOpts): Promise<ReadonlyArray<RawGitHubAuditEvent>>;
export async function redactGitHub(ev: RawGitHubAuditEvent, opts: RedactOpts): Promise<NormalizedAuditEvent>;
export async function redactCloudflare(ev: RawCloudflareAuditEvent, opts: RedactOpts): Promise<NormalizedAuditEvent>;
export async function computeFingerprint(input: FingerprintInput, salt: string): Promise<FingerprintHash>;
export function correlate(github: ReadonlyArray<NormalizedAuditEvent>, cloudflare: ReadonlyArray<NormalizedAuditEvent>): ReadonlyArray<CorrelatedFinding>;
```

## 実行タスク

1. **types.ts / errors.ts** を Phase 3 通りに実装。`FingerprintHash` は branded type で誤代入を防ぐ。
2. **redact.ts**:
   - `normalizeEmail(raw)`: `@` で split し local-part を `lower(trim)`、domain を `actorDomain` に分離。
   - `truncateIp(raw)`: `net` モジュール非依存の純粋関数。IPv4 は `.` split → 3 octet、IPv6 は `:` split → 3 hextet。
   - `bucketUserAgent(raw)`: 主要 family（`chrome`, `safari`, `firefox`, `curl`, `gha-runner`）に正規表現でマッピング、unknown は `other`。
   - `computeFingerprint`: `crypto.subtle.digest('SHA-256', encode(salt + '|' + canonicalInput))` → hex 64 chars。全 undefined 入力時 `FingerprintInputEmptyError`。
3. **github-fetch.ts**:
   - `fetch('https://api.github.com/orgs/' + org + '/audit-log?per_page=100&...', { headers: { Authorization: 'token ' + pat, 'User-Agent': 'ubm-hyogo-audit/1.0' }})`。
   - 401/403 → `AuditFetchAuthError`。429 → `Retry-After` 尊重 + 指数 backoff (max 3 回 / base 1s)。
   - pagination は `Link` header の `rel="next"` を解釈して全件取得。
   - **PAT を error message / log に絶対に含めない**（マスク必須）。
   - 本タスクの runtime evidence は fixture-only。live API 呼び出しは unit / msw contract test までに留め、実 Org audit log 取得は follow-up。
4. **correlate.ts**:
   - `Map<FingerprintHash, NormalizedAuditEvent[]>` に GitHub / Cloudflare 両 source を投入。
   - 各 group を `occurredAt` 昇順ソート。
   - severity ロジック:
     - HIGH: 同 fingerprint で「権限変更系イベント（`org.update_member` / `account.member_role_change` 等）」と「IP prefix 変化」が 5 分（300_000ms）以内に共起。
     - MEDIUM: 単独 source のみで権限変更系イベント。
     - LOW: それ以外。
   - 出力は `ReadonlyArray<CorrelatedFinding>`。
5. **index.ts**: re-export。

## 入出力・副作用・エラーハンドリング

| 関数 | 副作用 | エラー |
| --- | --- | --- |
| `fetchGitHubAuditEvents` | network I/O のみ | `AuditFetchAuthError`（401/403）/ network throw |
| `redactGitHub` / `redactCloudflare` | `computeFingerprint` 呼び出しのみ | input 不正で throw なし（best-effort 正規化） |
| `computeFingerprint` | Web Crypto API のみ | `FingerprintInputEmptyError` |
| `correlate` | 副作用なし（pure） | throw なし |

## テスト方針

Phase 4 の vitest 6 本がすべて green になることを確認。msw でネットワーク stub を立て、TC-RED-09 / TC-RED-10 を実行。

## ローカル実行コマンド

```bash
mise exec -- pnpm --filter @ubm/api install
mise exec -- pnpm --filter @ubm/api typecheck
mise exec -- pnpm --filter @ubm/api lint
mise exec -- pnpm --filter @ubm/api test src/audit-correlation
mise exec -- pnpm --filter @ubm/api test:coverage src/audit-correlation
```

## 参照資料

- Phase 3 / Phase 4 outputs
- Web Crypto API: `crypto.subtle.digest`
- GitHub REST API audit-log

## 成果物

- 上記 7 ファイルの実装
- `outputs/phase-5/phase-5.md`（実装サマリ + 設計判断ログ）

## 完了条件（DoD）

- [ ] audit-correlation focused vitest が green。coverage 数値がローカル未収集の場合は Phase 11 の test inventory で主要分岐カバーを明記。
- [ ] `pnpm typecheck` / `pnpm lint` clean。
- [ ] PAT が log / error message に出力されないこと（手動レビュー + grep）。
- [ ] `correlate()` の severity HIGH ロジックが TC-RED-11 で検証済。
