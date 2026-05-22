# Phase 12 — SSOT 同期 / compliance check

## phase12 strict outputs

| パス | 内容 |
| --- | --- |
| `outputs/phase-12/main.md` | Phase 12 サマリ |
| `outputs/phase-12/implementation-guide.md` | 実装ガイド（実装内容と運用境界、Phase 4/7/9 を要約） |
| `outputs/phase-12/system-spec-update-summary.md` | SSOT 更新差分サマリ（02-auth.md / backlog.md） |
| `outputs/phase-12/documentation-changelog.md` | docs 変更履歴 |
| `outputs/phase-12/unassigned-task-detection.md` | 未割当タスク（admin authenticated LHCI を follow-up 候補として記録） |
| `outputs/phase-12/skill-feedback-report.md` | task-specification-creator skill 適用フィードバック |
| `outputs/phase-12/phase12-task-spec-compliance-check.md` | Phase 12 compliance gate（canonical heading SSOT） |

## SSOT 同期対象

本 workflow は現時点で `implemented-local-runtime-pending` であり、実装コード差分、CI workflow 差分、focused unit test は本サイクルに含まれる。
task-specification-creator の Phase 12 strict outputs と root/output artifacts parity は、本サイクルの実装状態に合わせて同期する。
Issue #630 は 2026-05-12T06:26:21Z に CLOSED 済みのため、後続 PR は close keyword ではなく `Refs #630` を使用する。

### `docs/00-getting-started-manual/specs/02-auth.md`

追記節（例）:

```markdown
## LHCI 用 test session JWT

- 目的: LHCI で `/profile` 等の authenticated 画面の a11y を計測する
- 生成: `apps/web/scripts/lhci-auth-storage.ts` が `signSessionJwt(AUTH_SECRET, {...})` で発行
- cookie: name `authjs.session-token` / domain `localhost` / path `/` / httpOnly / sameSite=Lax / TTL 60 分
- secret: env `AUTH_SECRET`（CI は GitHub Secrets、ローカルは 1Password op 参照）
- 用途: LHCI puppeteerScript (`apps/web/lhci/lhci-auth.cjs`) で計測前に注入
- 制約: TEST_MEMBER_ID (`e2e-lhci-member-0001`) / role=member 固定、admin / 実 user 流用禁止
```

### `docs/30-workflows/e2e-quality-uplift/backlog.md`

`EXT-X1` 行を以下に更新:

```
| EXT-X1 | 3a Lighthouse CI | mid | Stage 4 | closed-by-issue #630 / implemented-local-runtime-pending successor | Authenticated `/profile` LHCI implementation lives under docs/30-workflows/issue-630-authenticated-profile-lhci-a11y/; Issue #630 is already CLOSED, so PR uses Refs #630. |
```

## CLAUDE.md / 不変条件チェック

- `apps/web` env アクセス不変条件: `lhci-auth-storage.ts` は `process.env.AUTH_SECRET` を script 文脈で読む（ランタイム外）。`getEnv()` 経由不要であることを確認済み（script は Workers ランタイムではない）。
- secret 管理: AUTH_SECRET の実値はコード・ドキュメント・log に書かない（CONST 遵守）。
- D1 直接アクセス禁止: 本タスクは D1 に触れない。

## compliance check

| 項目 | 状態 |
| --- | --- |
| 実装区分明示 | index.md 冒頭に `[実装区分: 実装仕様書]` あり |
| CONST_005 必須項目 | 変更対象ファイル / 関数シグネチャ / I/O / テスト / 実行コマンド / DoD すべて明記済み |
| CONST_007 単一サイクル完了 | 全 step が 1 PR で完了可能 |
| canonicalRoot | `docs/30-workflows/issue-630-authenticated-profile-lhci-a11y/` |
| artifacts parity | `artifacts.json` と `outputs/artifacts.json` の同値配置を本サイクルで実施 |
