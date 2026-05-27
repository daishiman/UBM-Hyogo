# Phase 7: テスト戦略

## 1. テスト層

| 層 | tool | 対象 | 実行コマンド |
|---|---|---|---|
| unit | vitest | `IdentityConflictRow.spec.tsx` / (H5 hit 時) `proxy-path.spec.ts` | `pnpm --filter @ubm-hyogo/web vitest run -- IdentityConflictRow` / `... -- proxy-path` |
| component | vitest + testing-library | `page.component.spec.tsx`（page Server Component の rendered HTML 構造） | `pnpm --filter @ubm-hyogo/web vitest run -- identity-conflicts.page` |
| contract | vitest（D1 lane） | `apps/api/src/routes/admin/identity-conflicts.contract.spec.ts` （既存・無改変） | `pnpm --filter @ubm-hyogo/api test:contract` |
| e2e | playwright | `apps/web/playwright/tests/admin-identity-conflicts.spec.ts` | `pnpm exec playwright test admin-identity-conflicts` |
| visual snapshot | playwright (local) | Phase 11 で `phase-11/screenshots/admin-identity-conflicts-{list,empty,merge-step1}.png` 取得 | `pnpm exec playwright test admin-identity-conflicts --update-snapshots`（baseline 必要時のみ） |
| a11y axe | playwright + @axe-core/playwright | row + modal の AA contrast / role 確認 | `pnpm exec playwright test admin-identity-conflicts --grep axe`（既存に axe テストがあれば extend、無ければ最小 axe assertion を Phase 11 で 1 件追加） |
| runtime smoke | curl + tail | staging で `/api/admin/identity-conflicts` 200 を確認 | `curl -v -H "Cookie:..." https://<staging-web>/api/admin/identity-conflicts` |

## 2. テスト追加方針

- spec ファイル命名は **`*.spec.{ts,tsx}` 必須**（invariant #8、`*.test.*` 禁止）
- 新規 vitest は `apps/web/src/components/admin/__tests__/` または該当 page 配下 `__tests__/` に配置
- Playwright spec は既存 ファイル更新が原則。新規追加は最小限

## 3. Visual baseline 更新方針

- A の primitive 置換で見た目が変わるため、Phase 11 で baseline 再取得が必要
- baseline は `apps/web/playwright/visual/__snapshots__/admin-identity-conflicts-*.png-linux.png` 命名（既存 admin alignment と同 pattern）
- Linux baseline は CI で生成する。local Darwin で取得した png は evidence 用（phase-11/screenshots/）として残し、baseline には commit しない
- baseline 更新 commit は別 commit で分離（diff レビュー容易化）

## 4. CI gate

| gate | 関連 |
|---|---|
| `verify-design-tokens` | HEX 直書き / Tailwind 色 utility 0 件を保証 |
| `verify-test-suffix` | `*.spec.{ts,tsx}` 強制 |
| `verify-indexes-up-to-date` | aiworkflow indexes drift 防止（Phase 12 skill sync で hit） |
| `verify-gate-metadata` | artifacts.json の zod schema |
| `verify-phase12-compliance` | strict 7 + Phase 11 evidence 表 + workflow root scan |
| `playwright-smoke` | 既存 admin smoke（required check 既存設定に従う） |

## 5. テスト DoD

- [ ] unit / component / e2e すべて PASS
- [ ] contract spec 無改変で PASS
- [ ] visual baseline 更新差分が PR diff に含まれる（更新が必要な場合のみ）
- [ ] a11y axe で `serious` / `critical` 違反 0 件
- [ ] staging runtime smoke が 200 OK を返す
- [ ] CI required check 全部 green

---

## 次 agent (Phase 8-13) への引継ぎ事項

### 完了済（本 agent / Phase 1-7）

1. `index.md` + `outputs/artifacts.json` 配置済（status=`spec_created`、Gate-A/B/C は全 pending）
2. Phase 1 (`phase-1.md` + `spec-extraction-map.md`) で要件 / インベントリ / AC 列挙
3. Phase 2 でタスク分解（A-1..6 + B-1..5）と DoD
4. Phase 3 で UI 構成図 + API 復旧手順設計
5. Phase 4 で実装仕様（変更ファイル / 関数 signature / 型 / spec file / 実行コマンド / DoD）
6. Phase 5 で依存グラフ + 着手順序（B-1 先行 → A 並行 → B-3/4）
7. Phase 6 でリスク / rollback / feature flag 不要根拠
8. Phase 7 でテスト戦略 + CI gate 一覧

### Phase 8-13 担当者がやること

- **Phase 8**: 実装着手（Stream A の A-1..A-6 を順次、Stream B の B-1 観測を並行）
- **Phase 9**: コード review + lint / typecheck / vitest / playwright 全 PASS まで持っていく
- **Phase 10**: B-2 triage レポート + B-3 復旧手段確定（必要なら H5 patch 適用 + vitest 追加）
- **Phase 11**: evidence 取得
  - local screenshots 3 枚: `screenshots/admin-identity-conflicts-{list,empty,merge-step1}.png`
  - staging 復旧 evidence: `evidence/staging-recovery.txt`（curl 出力、secret マスク）
  - root-cause triage: `evidence/root-cause-triage.md`
  - local 検証ログ: `evidence/local-validation-summary.txt`
- **Phase 12**: strict 7 (`main.md` / `implementation-guide.md` / `system-spec-update-summary.md` / `documentation-changelog.md` / `unassigned-task-detection.md` / `skill-feedback-report.md` / `phase12-task-spec-compliance-check.md`) + unassigned-task detection（H4 関連で別 issue 起票が必要かどうかも判定）
- **Phase 13**: branch sync → commit → push → PR (`gh pr create --base dev`)。Gate-C 越えに必要な user 承認は: (a) staging api/web 再 deploy（H1/H2/H5 hit 時）/ (b) D1 migration apply（H3 hit 時）/ (c) PR 作成と merge

### 既知の未決事項（次 agent が判断）

1. `Chip` / `Modal` primitive の実在確認 — `grep -rln 'export function Chip' apps/web/src/components/ui/` で実在しなければ既存 admin modal 流用に切り替える
2. H4 (session 失効) hit 時の Auth.js 設定見直しを本 workflow scope に含めるか別 issue 起票するか — 推奨は別 issue 起票
3. R-3 (staging 再 deploy の WIP 巻き込み回避) のため `origin/dev` HEAD を事前確認する手順は Gate-C 直前 user 提示が必須
4. A のみ先行 merge / B は後続 PR、という分割は CONST_007 に反するため **非推奨**。1 PR で完結させる

### 触ってはいけないファイル / 範囲

- `apps/api/src/routes/admin/identity-conflicts.ts`
- `apps/api/src/repository/identity-conflict.repository.ts`
- `apps/api/migrations/*identity*.sql`
- `apps/web/src/lib/admin/server-fetch.ts`（B-5 で H5 hit 時にも変更しない。proxy だけ patch）
- D1 schema 全般
