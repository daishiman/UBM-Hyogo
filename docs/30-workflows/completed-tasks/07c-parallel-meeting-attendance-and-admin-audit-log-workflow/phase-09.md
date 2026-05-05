# Phase 9: 品質保証

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 07c-parallel-meeting-attendance-and-admin-audit-log-workflow |
| Phase 番号 | 9 / 13 |
| Phase 名称 | 品質保証 |
| 作成日 | 2026-04-26 |
| 前 Phase | 8 (DRY 化) |
| 次 Phase | 10 (最終レビュー) |
| 状態 | completed |

## 目的

型安全 / lint / test / a11y / 無料枠 / secret hygiene の 6 観点で本タスクの spec / runbook / verify suite を最終チェックし、Phase 10 の GO 判定材料を整備する。

## 実行タスク

- [ ] 無料枠見積（D1 reads / writes、Workers req、audit_log 容量）
- [ ] secret hygiene チェック（新規 secret なし、`.env` 漏れなし）
- [ ] a11y チェック（Drawer / Switch / Button / Toast の aria 属性）
- [ ] 型安全チェック（MemberId / SessionId / ResponseId brand 型）
- [ ] lint / test 実行ガイド

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/00-getting-started-manual/specs/08-free-database.md | 無料枠 |
| 必須 | docs/00-getting-started-manual/specs/09-ui-ux.md | a11y 期待 |
| 必須 | docs/00-getting-started-manual/specs/15-infrastructure-runbook.md | secret 管理 |
| 必須 | CLAUDE.md | 不変条件 / secret 平文禁止 |

## 無料枠見積

| 項目 | 単位 | 1 操作 | 想定 / 月 | 合計 | 上限 | 余裕 |
| --- | --- | --- | --- | --- | --- | --- |
| D1 writes (attendance INSERT) | 1 | 1 | 200 | 200 | 100,000 / day → 3M / 月 | 充分 |
| D1 writes (audit_log INSERT) | 1 | 1 | 200 | 200 | 同上 | 充分 |
| D1 reads (candidates resolver) | 1 SELECT JOIN | 1 | 100 | 100 | 5,000,000 / day | 充分 |
| audit_log row 容量 | ≒200 byte/行 | — | 200 行/月 | 40 KB | 5GB | 充分 |
| Workers req | 1 | 1 | 600 (200 add + 200 delete + 200 candidate) | 600 / 月 | 100,000 / day | 充分 |

## secret hygiene チェック

| 項目 | 状態 | 確認方法 |
| --- | --- | --- |
| 新規 secret 追加 | なし | secrets_introduced=[] in artifacts.json |
| `.env` 平文化 | 行わない | `git status` で `.env` 差分なし |
| `wrangler secret list` 増減 | 増減なし | 既存の `GOOGLE_SERVICE_ACCOUNT_JSON` 等のみ |
| audit_log payload に secret 漏れ | なし | hook で `c.req.json()` から token / secret を strip |
| 1Password 同期 | 不要 | 新規 secret なし |

### payload sanitize 規約

```ts
function sanitizePayload(p: unknown): unknown {
  // payload に "token" / "secret" / "key" / "password" を含む property を REDACTED に置換
  return walk(p, (k, v) => /token|secret|key|password/i.test(k) ? '[REDACTED]' : v)
}
```

## a11y チェック

| UI 要素 | 期待 aria | 配置 | spec 出典 |
| --- | --- | --- | --- |
| attendance Switch (UI 06c) | `aria-label="参加を記録"` `aria-pressed` | `/admin/meetings` | 09 |
| 409 Toast | `role="status"` `aria-live="polite"` | toast root | 09 |
| candidates list | `aria-label="候補メンバー一覧"` | drawer | 09 |
| Drawer close ボタン | `aria-label="閉じる"` | drawer | 16 |
| Modal 確認ダイアログ | `aria-modal="true"` | dialog | 16 |

## 型安全チェック

| 型 | 配置 | 用途 | 違反検知 |
| --- | --- | --- | --- |
| `MemberId` brand | packages/shared/src/types | attendance.memberId | `responseId` 代入 → ts error |
| `MeetingSessionId` brand | packages/shared | attendance.sessionId | string 直接代入 → ts error |
| `AdminId` brand | packages/shared | actor_id | session 由来のみ |
| `AdminAuditAction` enum | packages/shared/audit/actions | hook 引数 | typo → ts error |

## lint / test 実行ガイド

```bash
pnpm typecheck                          # MemberId / SessionId 型混同を検知
pnpm lint                               # eslint: apps/web から D1 import 禁止 (#6)
pnpm --filter @ubm/api test             # unit + contract + authz + DB constraint
pnpm --filter @ubm/api test -- --coverage  # AC マトリクス全行が test でカバー
```

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 10 | 6 観点の評価を GO/NO-GO 材料に |
| Phase 11 | manual smoke の curl / wrangler 出力に sanitize 確認を含める |
| Phase 12 | implementation-guide に sanitize / a11y を反映 |

## 多角的チェック観点

- 不変条件 **#5** authz 401/403 を実機で確認できること（Phase 11 で curl）
- 不変条件 **#6** apps/web から D1 import がないことを lint で確認
- 不変条件 **#7** candidates resolver が is_deleted=0 を保証
- 不変条件 **#11** profile 編集 endpoint がコードに存在しないことを grep で確認
- 不変条件 **#13** meeting / attendance を Forms sync 対象から除外
- 不変条件 **#14** 無料枠余裕（上記見積）
- 不変条件 **#15** UNIQUE constraint が migration で apply 済みを確認

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 無料枠見積 | 9 | pending | D1 / Workers / 容量 |
| 2 | secret hygiene | 9 | pending | sanitize 規約 |
| 3 | a11y 表 | 9 | pending | aria 属性 |
| 4 | 型安全 | 9 | pending | brand 型 |
| 5 | lint / test ガイド | 9 | pending | コマンド |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-09/main.md | QA 結果 |
| メタ | artifacts.json | phase 9 status |

## 完了条件

- [ ] 無料枠見積済み（D1 / Workers / audit_log 容量）
- [ ] secret hygiene 確認済み（新規なし + sanitize 規約）
- [ ] a11y 表記述
- [ ] brand 型 4 種列挙
- [ ] lint / test コマンド明記

## タスク100%実行確認【必須】

- [ ] 全実行タスク completed
- [ ] 成果物配置済み
- [ ] 多角的チェック観点記述済み
- [ ] artifacts.json の phase 9 を completed

## 次 Phase

- 次: Phase 10 (最終レビュー)
- 引き継ぎ: 6 観点 PASS 状況
- ブロック条件: いずれかの観点が NO-GO 候補なら Phase 10 で blocker
