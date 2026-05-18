# Phase 7 — カバレッジ確認

## 適用可否

本タスクは GitHub Actions YAML 修正のみで、TypeScript/JavaScript ソースコードを変更しないため **行カバレッジ / 分岐カバレッジの概念は適用外**。

## 代替: 修正カバレッジ表

| 修正対象 fail mode | task-02 で塞ぐか | 経路 |
| ------------------ | ---------------- | ---- |
| environment secret 未登録 | YES | B1 |
| environment secret rotation 名前不一致 | YES | B1 (旧名 delete + 新名 set) |
| `with.apiToken` が空評価される | YES | B2 (env fallback) |
| `with.accountId` が空評価される | YES | B2 (CLOUDFLARE_ACCOUNT_ID env も二重化) |
| `deploy-production` 同等 fail | NO | UNASSIGNED-02 として別タスク化 |

## coverage-guard hook

`scripts/coverage-guard.sh` は TypeScript 系のみを対象とするため、本タスクの YAML 修正は `--changed` モードでも対象外。pre-push hook は merge commit を含まない `--changed` push でも本 PR を block しないことを確認 (ローカルで `pnpm coverage:guard --changed` を空打ちして exit 0 を期待)。

## 結論

カバレッジ観点での追加作業なし。Phase 9 (品質保証) に進む。
