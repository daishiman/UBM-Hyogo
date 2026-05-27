# Phase 13 — PR

[実装区分: 実装仕様書]

## 13.1 PR メタ情報

| 項目 | 値 |
|------|-----|
| base | `dev` (CLAUDE.md「既定ブランチは dev」) |
| head | `feat/admin-ui-prototype-alignment` |
| title 案 | `feat(admin): /admin dashboard 404 recovery + byZone supply (Task B)` |

## 13.2 PR 本文テンプレート

```markdown
## Summary

- staging `/admin` の ADMIN_FETCH_404 を根本原因切り分けの上で復旧
- 既存 `GET /admin/dashboard` endpoint の response に `byZone` (区画 0→1 / 1→10 / 10→100) optional 拡張を追加
- `<ZoneDistribution>` をプロトタイプ `pages-admin.jsx` L70-107 準拠 DOM に書き換え

## 変更点

- `packages/shared/src/zod/viewmodel.ts`: `AdminDashboardViewZ` に `byZone` optional (length=3) field 追加 (後方互換)
- `apps/api/src/routes/admin/_shared/byZone.ts` (新規): `buildByZoneSlices` pure fn
- `apps/api/src/routes/admin/dashboard.ts`: `aggregatePublicZones` → bucket → response に `byZone` 同梱
- `apps/web/src/lib/admin/admin-dashboard-ui.ts`: `ZoneSlice` 型再定義・`parseZoneSlices` 新 shape 対応
- `apps/web/src/features/admin/components/_dashboard/ZoneDistribution.tsx`: linear-gradient 撤去・`var(--ubm-color-bg)` 上に固定色塗り
- 404 該当系統 (H1/H2/H3 のどれか) の 1 系統のみ修正

## 404 切り分け結果

確定 hypothesis: **H?** (PR 提出時に該当を記載)
詳細: `outputs/phase-10/root-cause.md`

## 検証ログ

### curl + jq (staging)

```
$ curl -s -H "cookie: ***" $API_BASE/admin/dashboard | jq '.byZone | length, [.byZone[].key]'
3
["0to1","1to10","10to100"]
```

### playwright smoke

```
tests/e2e/admin-dashboard-staging.spec.ts ✓ ...
```

## スクリーンショット

| # | キャプション | ファイル |
|---|--------------|----------|
| 1 | staging `/admin` 全景 | outputs/phase-11/admin-dashboard-200-overview.png |
| 2 | byZone 3 行クローズアップ | outputs/phase-11/admin-dashboard-byZone-detail.png |

## DoD checklist

- [ ] staging `/admin` が 200 + KPI 4 + Zone 3 bar + Status 3 + Activity + SchemaAlertCard を表示
- [ ] `AdminDashboardViewZ` の byZone 拡張が optional・既存 consumer 全 green
- [ ] H1/H2/H3 のいずれかに原因特定が完了・該当 1 系統のみ commit に含まれる
- [ ] `pnpm typecheck` / `pnpm lint` / `pnpm test (shared/api/web)` 全 green
- [ ] `verify:phase12-compliance` / `gate-metadata:validate` / `indexes:rebuild` drift 0
- [ ] プロトタイプ pages-admin.jsx と DOM 比較で差分なし
- [ ] OKLch token のみ使用 (`verify-design-tokens` green / HEX / `bg-[#xxx]` 0 件)

## Test plan

- [x] T-B-01..T-B-06 unit/component (local)
- [ ] T-B-07 playwright staging smoke (staging deploy 後)
- [ ] T-B-08 curl jq (staging deploy 後)

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

## 13.3 作成コマンド

```bash
gh pr create --base dev --title "feat(admin): /admin dashboard 404 recovery + byZone supply (Task B)" \
  --body "$(cat <<'EOF'
... 上記テンプレを埋めて記載 ...
EOF
)"
```

## 13.4 user-gated チェックリスト

- [ ] **commit / push / PR 作成は user 明示承認後のみ** (CLAUDE.md「PR作成までは自律実行」セクションに準拠しつつ、本 task は手動承認運用)
- [ ] staging deploy も user 明示承認後
- [ ] base = `dev` 固定 (production リリース時のみ `dev → main`)
- [ ] required check `verify-design-tokens` / `playwright-smoke / smoke (chromium)` / `verify-indexes-up-to-date` / `verify-gate-metadata` 全 green

## 13.5 PR 提出前 pre-flight

```bash
git status --porcelain
git diff dev...HEAD --name-only
bash scripts/verify-pr-ready.sh
```

- `git status` が空であること
- `git diff dev...HEAD --name-only` が PR に含めるファイル一覧として取得可能
- `verify-pr-ready.sh` が exit 0

## 13.6 ロールバック方針

- Cloudflare deploy: `bash scripts/cf.sh rollback <VERSION_ID> --config apps/web/wrangler.toml --env staging` / `--config apps/api/wrangler.toml --env staging`
- code: PR revert
- `byZone` は optional field のため、API revert 後も UI は placeholder 表示で degrade し画面停止しない
