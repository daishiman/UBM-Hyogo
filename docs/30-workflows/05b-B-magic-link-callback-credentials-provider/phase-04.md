# Phase 4: テスト戦略 - 05b-B-magic-link-callback-credentials-provider

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | 05b-B-magic-link-callback-credentials-provider |
| phase | 4 / 13 |
| status | implemented-local |
| taskType | implementation |
| visualEvidence | NON_VISUAL |


## 目的

Magic Link callback と Auth.js session 確立を、UI screenshot ではなく決定論的な NON_VISUAL テストで固定する。

## テストマトリクス

| レイヤ | 観点 | 期待 |
| --- | --- | --- |
| Unit | Credentials `authorize()` success | verify user を Auth.js user として返す |
| Unit | Credentials failure reasons | `null` または typed failure を返し session を作らない |
| Route | `GET /api/auth/callback/email` success | 404 ではなく success redirect / cookie 設定 |
| Route | missing token/email | `/login?error=missing_*` |
| Route | expired / already_used / invalid | `/login?error=<mapped>` |
| Static | apps/web D1 direct import | 0件 |
| Type | session user shape | shared type と整合 |

## 推奨コマンド

実装時に current repo scripts を再解決してから固定する。

```bash
rg --files apps/web | rg 'auth|callback|test|spec'
mise exec -- pnpm --filter @repo/web typecheck
mise exec -- pnpm --filter @repo/web test
```

## Evidence Policy

- `NOT_EXECUTED_SPEC_ONLY` は実測 PASS ではない。
- Phase 11 で実測する場合は command、exit code、対象 commit、環境を記録する。
- screenshot は必須ではない。session/cookie は route test と curl/browser smoke のログを優先する。

## 実行タスク

1. Phase固有の判断と成果物を確認する。
2. `index.md`、`artifacts.json`、Phase 12成果物との整合を確認する。
3. 実装・deploy・commit・push・PRを実行しない境界を確認する。

## 参照資料

- `docs/30-workflows/05b-B-magic-link-callback-credentials-provider/index.md`
- `docs/30-workflows/05b-B-magic-link-callback-credentials-provider/artifacts.json`
- `docs/30-workflows/unassigned-task/task-05b-authjs-callback-route-credentials-provider-001.md`
- `.claude/skills/task-specification-creator/references/phase-12-spec.md`
- `.claude/skills/aiworkflow-requirements/indexes/resource-map.md`

## 実行手順

- Current canonical root is `docs/30-workflows/05b-B-magic-link-callback-credentials-provider/`.
- Old root `docs/30-workflows/02-application-implementation/05b-B-magic-link-callback-credentials-provider/` is legacy path only.
- Runtime implementation evidence is separated into Phase 11 reserved paths.

## 統合テスト連携

- Upstream: 05b-A auth mail env, 05b Magic Link verify API, 06b login UI.
- Downstream: 06b-C logged-in profile evidence, 08b auth E2E, 09a staging auth smoke.
- Boundary: apps/web must not access D1 directly.

## 成果物

- `outputs/phase-04/main.md`

## 完了条件

- [ ] AC-1〜AC-5 が少なくとも1つの自動または手動 evidence に対応している。
