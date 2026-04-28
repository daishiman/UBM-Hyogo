# unassigned-task-detection

02c の scope 外で「実装が必要だが未割当」の項目を顕在化し、担当候補 task に申し送る。

| # | 項目 | 担当候補 task | 対応方針 |
| --- | --- | --- | --- |
| 1 | `apps/api/src/env.ts`（`DB: D1Database` binding を含む env 型 + helper） | 00 foundation | 既存の Worker env 型定義があればそれを使用。なければ 02c の `_shared/db.ts` の `ctx(env)` で吸収済み |
| 2 | `apps/api/src/route/` の hono router（admin / member / sync 各 endpoint） | 04c（admin） / 04b（member） | 04c が `auditLog.append()` を全 admin 操作に挿入する責務 |
| 3 | `auditLog.metadata`（before / after）に何を載せるかのガイドライン | 04c / 07c | 各タスクで「PII / token は載せない、変更前後の業務的 diff のみ」を明文化 |
| 4 | Magic Link の HMAC key (`MAGIC_LINK_HMAC_KEY` secret)、メール送信（Resend / SES 等） | 05b | 05b で secret 導入 + 送信 provider 選定 |
| 5 | sync 失敗時の admin 通知（Slack / mail / dashboard） | 09b（cron）または 06c（admin UI） | `syncJobs.findLatest` で失敗を表示する admin UI が現実的 |
| 6 | `__fixtures__/` の prod build 除外設定（`tsconfig.build.json` 分割 or vitest 専用 include） | 00 foundation | apps/api のビルドで `__fixtures__/` / `__tests__/` を除外する設定を一元化 |
| 7 | dep-cruiser バイナリ導入 + CI gate（`pnpm depcruise`） | 09a / Wave 2 統合 PR | `.dependency-cruiser.cjs` は完成済み。バイナリを入れた瞬間に S-5 / S-6 が動く |
| 8 | staging D1 上の admin smoke seed（`scripts/seed-admin-smoke.sql`） | 09a | phase-11.md の S-1 / S-2 を staging で実行するための SQL |
| 9 | adminNotes の embed / 検索（admin UI からの query） | 06c | repository は `listByMemberId` のみ提供。UI 層は 06c の責務 |
| 10 | `_setup.ts` の miniflare D1 singleton 並列性 | 02c 保守 | テスト並列化時に scoped DB に切り替えるか、`describe.concurrent` を制限する判断が必要 |

## 02c で担保しないが将来の前提

- `_shared/brand.ts` に追加 brand を入れる時は **02c が正本変更**、02a / 02b は import のみ。
- `_setup.ts` の signature 変更も同様（02a / 02b の test を壊さないよう breaking change は注意）。
