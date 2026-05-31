<!-- workflow: issue-1005-members-ux-playwright-baseline-stabilization / phase: 9 -->

[実装区分: 実装仕様書]

# Phase 9 — QA

## 1. QA チェックリスト

### 1.1 cold start / evidence run

- [ ] cold start で evidence run が PASS する（AC-1）
  - `CI=1 mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test apps/web/playwright/tests/members-ux-clarity.spec.ts --project=desktop-chromium`
  - `CI=1` 付与で `reuseExistingServer` を無効化し、webServer 起動からの cold start を再現する
- [ ] webServer ready URL が `${localBaseURL}/members` を解決して起動完了する（route warm-up 成立）

### 1.2 PNG 生成 / 命名

- [ ] 24 PNG が spec 本体で生成される（AC-2）
  - `find docs/30-workflows/completed-tasks/members-list-ux-clarity/outputs/phase-11/screenshots -name 'members-ux-clarity-*.png' | wc -l` が `≥24`
- [ ] 命名規約 `members-ux-clarity-${density}-${state}-${viewport}.png` に全 24 件が一致
  - 例: `members-ux-clarity-comfy-filtered-mobile.png` / `members-ux-clarity-list-empty-wide.png`
- [ ] baseline PNG の mask 領域が `data-role=pagination-meta` のまま維持されている（`fullPage: true`）

### 1.3 path drift 補正

- [ ] 出力先が `docs/30-workflows/completed-tasks/members-list-ux-clarity/outputs/phase-11/screenshots/` に補正されている（AC-3）
- [ ] 旧 dir に PNG が生成されない（旧 path への drift が解消されている）
- [ ] `MEMBERS_UX_EVIDENCE_DIR` override 指定時に当該 dir へ出力される

### 1.4 単一 project / runtime-notes

- [ ] evidence flag 未設定時に `fixtureGatedTestIgnore` で当該 spec が除外される
- [ ] evidence run が desktop-chromium のみ 1 回で完結する（冗長 project 実行なし・AC-4）
- [ ] `outputs/phase-11/runtime-notes.md` が更新され、補完不要である証跡が記録されている（AC-5）

### 1.5 CI gate / 非回帰

- [ ] `mise exec -- pnpm --filter @ubm-hyogo/web typecheck` GREEN（AC-6）
- [ ] `mise exec -- pnpm lint` GREEN（AC-6）
- [ ] config diff に既存 `is*` 分岐（`isMembersPrototypeAlignment` 等）の挙動変更がないこと（AC-7・非回帰）
- [ ] 既存 run（他 evidence flag run）が非回帰であること

### 1.6 不変条件

- [ ] INV-1（API 不変）: 新規 endpoint / D1 schema / Form 仕様変更なし
- [ ] INV-5（test ファイル不増）: 新規 `*.spec.{ts,tsx}` を増やさない（変更は既存 spec 1 本のみ）

## DoD

- [ ] cold start / PNG / path / project / CI gate / 不変条件の各軸チェックリストが配置されている
- [ ] 各項目に検証コマンドまたは確認手段が併記されている
