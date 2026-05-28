---
spec_classification: implementation_spec
state: implemented_local_runtime_pending
phase: 13
phase_name: PR
created_at: 2026-05-27
---

# Phase 13: PR

[実装区分: 実装仕様書]

## 1. branch

`feat/admin-ui-prototype-alignment`（親 workflow / Task A-D と同一）。

## 2. base

`dev`（CLAUDE.md `# 既定ブランチは dev`）。

## 3. PR タイトル案

`feat(admin-visual): admin 10 required + 2 gated routes baseline`

## 4. PR 本文要点

- Task A-D 完了を前提とする admin 10 required routes + env-gated 2 detail routes baseline 取得
- 撮影 spec 12 + helper 1 + config 1 + workflow 1 を追加、旧 `admin-dashboard.spec.ts` を統合削除
- baseline 数: 既定 40 PNG（env-gated 2 routes skip）、seed 投入時 48 PNG。**中間値 44 PNG は禁止運用**
- env-gated 2 routes（`PLAYWRIGHT_ADMIN_MEMBER_DETAIL_ID` / `PLAYWRIGHT_ADMIN_MEETING_DETAIL_ID`）の運用方針
- bot push 後の空コミット再トリガーを明記（GITHUB_TOKEN は `pull_request` 非発火のため）
- required status check 候補 4 件（実 PUT は user-gated）

---

## 5. required status check 候補（user-gated PUT）

- `playwright-smoke / admin visual (mobile)`
- `playwright-smoke / admin visual (tablet)`
- `playwright-smoke / admin visual (desktop)`
- `playwright-smoke / admin visual (wide)`

実 `gh api -X PUT /repos/{owner}/{repo}/branches/{dev,main}/protection` への追加は **user 明示承認後のみ**。read-only `gh api` で before JSON を事前 evidence として取得可能。

---

## 6. DoD（Definition of Done）

- [ ] 12 spec + helper + config + workflow 配置（Phase 5 §1 §3 §4 §6）
- [ ] CI `admin-visual` 4 viewport matrix 全 green
- [ ] `-linux.png` baseline が 40（env-gate 無）または 48（有）配置（44 不採用）
- [ ] regression dry-run（token 改変 → fail → revert）で diff 検出を確認
- [ ] grep gate: 旧 `admin-dashboard.spec.ts` / `admin-dashboard.spec.ts-snapshots` への参照 0 件
- [ ] Phase 11 evidence 表埋め（baseline path / status）
- [ ] required check 候補列挙（実 PUT は user-gated・未実施でも DoD pass）
- [ ] `mise exec -- pnpm typecheck` green
- [ ] `mise exec -- pnpm lint` green
- [ ] `mise exec -- bash scripts/verify-pr-ready.sh` green
- [ ] `mise exec -- pnpm gate-metadata:validate` ERROR:0
- [ ] `mise exec -- pnpm verify:phase12-compliance` pass
- [ ] `mise exec -- pnpm indexes:rebuild` idempotent（md5 一致）
- [ ] 不変条件: macOS 撮影分の `-darwin.png` が staged になっていない
- [ ] bot baseline push 後の空コミット再トリガーが実施済み（user-gated）

---

## 7. 実行コマンド（PR 作成）

```bash
# 既定ブランチ dev に対する PR
gh pr create --base dev --title "feat(admin-visual): admin 10 required + 2 gated routes baseline" \
  --body "$(cat <<'EOF'
## Summary
- Task A-D 完了を前提とする admin 10 required routes + env-gated 2 detail routes staging-visual baseline 取得
- 撮影 spec 12 + helper 1 + playwright.config 1 + workflow 1 追加
- 旧 admin-dashboard.spec.ts を統合削除
- baseline: 既定 40 PNG / seed 投入時 48 PNG（44 は不採用）
- env-gated detail 2 routes は seed ID 注入時のみ撮影
- bot push 後の空コミット再トリガーを明記

## Test plan
- [ ] CI `admin-visual` matrix 4 viewport 全 green
- [ ] `find apps/web/playwright/tests/visual/admin-shell -name '*-linux.png' | wc -l` = 40 or 48
- [ ] regression dry-run で diff 検出
- [ ] 旧 spec / snapshot dir 参照 0 件

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

---

## 8. 不変条件再掲

- `-linux.png` 正本（macOS 撮影分は commit しない）
- 認証 cookie 経路は既存 `staging-visual-authenticated` storageState setup / runtime-smoke-mint パターンを継承
- bot baseline push 後は **空コミット再トリガー必須**（GITHUB_TOKEN の `pull_request` 非発火制限）
- env-gated 2 routes は seed が両方そろうまで skip（44 PNG 不採用）
- 要確認箇所は admin storageState path / staging seed ID の 2 点のみ
