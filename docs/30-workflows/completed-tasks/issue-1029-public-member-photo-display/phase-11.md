# Phase 11: 手動テスト / 視覚証跡（VISUAL_ON_EXECUTION）

> **[実装区分: 実装仕様書]**。本 Phase は public member photo display の視覚証跡を固定する。写真表示は UI 変更のため VISUAL であり、本 workflow は `implemented_local_runtime_pending`（実装済み・外部 ops pending）である。ローカル Playwright runtime screenshot は取得済み。staging deploy / R2 secret / 実 R2 presigned URL の最終確認のみ user-gated。

## メタ情報

- workflow_state: `implemented_local_runtime_pending` / taskType: `implementation` / visualEvidence: `VISUAL_ON_EXECUTION`
- 前提: Phase 10（最終レビュー）完了
- screenshot 取得: local Playwright mock runtime で取得済み。`outputs/phase-11/screenshot-plan.json` に canonical 名を固定

## VISUAL 宣言

- 本 task は public avatar に写真を render する UI 変更を含むため **VISUAL** である。
- 本 workflow は local implementation 完了・local runtime screenshot 取得済み。ステージング上の実 R2 presigned URL 確認は **VISUAL_ON_EXECUTION** の外部 ops として残す。
- `outputs/phase-11/manual-test-result.md`、`outputs/phase-11/evidence/*.log`、`outputs/phase-11/screenshots/*.png` は実体ファイルとして作成し、Phase 12 compliance が status=present で参照する。

## 11.1 評価の3層構造

| 層 | 観点 | 確認内容 |
|----|------|---------|
| Semantic | 構造・機能 | 写真あり member の `<img>` DOM、写真なし member の hue placeholder DOM、gate 不通過 member の photoUrl 省略 |
| Visual | 見た目・token | `<img>` 表示時のレイアウト崩れ無し、写真なし時の placeholder pixel diff ゼロ（AC-5）、comfy/dense/list 各 density の avatar サイズ整合 |
| AI UX | ユーザー体験 | 公開ディレクトリで会員写真が識別性を高めること、onError 時に崩れず hue placeholder へ自然に fallback すること |

## 11.2 本サイクルで取得した screenshot（canonical 名）

下記 3 種を local Playwright mock runtime で `outputs/phase-11/screenshots/` へ保存した。実 R2 presigned URL の staging capture は user-gated 外部 ops として別扱いにする。

```
outputs/phase-11/screenshots/
  public-members-photo-list-desktop.png    # ① public 一覧 desktop で photoUrl avatar が <img> 表示
  public-member-photo-detail-desktop.png   # ② public 詳細 ProfileHero desktop で photoUrl avatar が <img> 表示
  public-members-photo-list-mobile.png     # ③ public 一覧 mobile で写真 avatar が layout overlap なく表示
```

| # | canonical 名 | 検証 AC | density |
|---|--------------|---------|---------|
| ① | `public-members-photo-list-desktop.png` | AC-3/AC-5 | comfy desktop |
| ② | `public-member-photo-detail-desktop.png` | AC-4/AC-5 | 詳細 ProfileHero desktop |
| ③ | `public-members-photo-list-mobile.png` | AC-3/AC-5 | comfy mobile |

> DOM 検証: `apps/web/playwright/tests/issue-1029-public-member-photo-display.spec.ts` が list/detail の `.ui-avatar--photo img` と `src=data:image/svg+xml;base64,...` を assert する。comfy/dense/list 各 density の `Avatar src` 配線は `MemberCard.spec.tsx` で担保する。

## 11.3 Playwright visual 仕様（実装サイクル）

### テストファイル

```
apps/web/playwright/tests/issue-1029-public-member-photo-display.spec.ts
```

### Baseline 分離方針

| シナリオ | Baseline | AC |
|----------|---------|-----|
| 写真なし member の avatar | `public-placeholder-baseline` | AC-5（pixel diff = 0 必須） |
| 写真あり member の avatar（list/comfy/dense） | `public-photo-baseline` | AC-3 |
| profile hero の写真 | `public-profile-photo-baseline` | AC-4 |
| `<img>` onError 後の fallback | `public-placeholder-baseline` と同一 | AC-5（onError 後は hue placeholder と同一 DOM） |

### capture script パターン（FB-MSO-003 準拠）

capture script には必ず `try/finally { await browser.close() }` を入れる（前サイクル教訓 L-MSO-003）。finally ブロックを省略しない。

## 11.4 staging / 環境ブロッカー（user-gated）

| 操作 | 区分 |
|------|------|
| R2 bucket `ubm-hyogo-member-photos-staging` 作成 | user-gated |
| `R2_*` secret 投入（`bash scripts/cf.sh secret put`） | user-gated |
| staging deploy（`bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env staging`） | user-gated |
| staging public 一覧 / 詳細の実 R2 presigned URL capture | user-gated |

> public ディレクトリは未認証でも閲覧可。ローカルでは mock API の public-safe `photoUrl` で UI runtime screenshot を取得済み。実 R2 presigned URL を使った最終 capture は R2 secret 投入 + staging deploy が前提のため user-gated runtime operation として残す。

## 11.5 手動テスト チェックリスト（実装サイクル）

### 環境

| 項目 | 値 |
|------|-----|
| local dev | `mise exec -- pnpm --filter @ubm-hyogo/web dev`（R2 secret 無し → photoUrl 省略で placeholder 動作確認） |
| staging | `https://ubm-hyogo-web-staging.daishimanju.workers.dev/`（user-gated deploy 後） |
| R2 bucket | `ubm-hyogo-member-photos-staging`（user-gated） |

### チェック項目

- [x] `/(public)/members` で写真あり member の avatar が `<img>`（hue ではなく写真）で表示される（local mock runtime）
- [x] comfy / dense / list の 3 density すべてで `<img>` が render される（component test）
- [x] 写真なし member の avatar は現行 hue placeholder へ fallback する（component test）
- [x] `/(public)/members/[id]` の ProfileHero に写真が `<img>` で表示される（local mock runtime）
- [x] 壊れた presigned URL（TTL 切れ等）で onError → hue placeholder へ fallback する（Avatar behavior test / component fallback）
- [ ] DevTools で `<img src>` が `r2.cloudflarestorage.com` の presigned URL（bucket 名・object key が API response body に露出していない）
- [ ] R2 secret 未設定時に list / profile が 200 を返し photoUrl を省略する（fail-soft / AC-8）

## 完了条件（Phase 11）

- [x] VISUAL_ON_EXECUTION 宣言（staging/R2 実 URL capture の user-gated 境界）が記録されている
- [x] local Playwright screenshot 3 枚の canonical 名が `screenshot-plan.json` に `status: "present"` で固定されている
- [x] AC-5 fallback の検証方法が固定されている
- [x] staging / R2 secret / deploy /実 R2 capture が user-gated であることが明記されている
- [x] `outputs/phase-11/manual-test-result.md` が実体ファイルとして作成されている
- [x] Playwright 実行ログが `outputs/phase-11/evidence/playwright-public-photo.log` に保存されている

## 目的

public member photo display の semantic / visual / AI UX 証跡を local runtime で取得し、staging/R2 実 URL capture の外部 ops 境界を固定する。

## 実行タスク

- 本実装サイクルで canonical 名 3 screenshot を取得する。
- AC-5 fallback・fail-soft（200 維持）を確認する。
- staging capture は user-gated runbook に従いユーザー承認後のみ実行する。

## 参照資料

- `index.md`（§2 AC-3/AC-4/AC-5/AC-8）/ `phase-2.md`（§1.3 UI データフロー）/ `phase-10.md`（AC 判定表）
- `outputs/phase-11/manual-test-result.md` / `outputs/phase-11/screenshot-plan.json`
- `apps/web/src/components/ui/Avatar.tsx`（`src` / `onError` fallback）
- `apps/web/src/components/public/MemberCard.tsx` / `apps/web/src/components/public/ProfileHero.tsx`
- `.claude/skills/aiworkflow-requirements/references/ui-ux-evaluation.md`（3 層評価）
- `docs/30-workflows/issue-983-member-photo-avatar-r2-storage/phase-11.md`（FB-MSO-003 capture パターン先例）

## 成果物

- Phase 11 視覚証跡計画（本ファイル）
- `outputs/phase-11/manual-test-result.md`（実体ファイル）
- `outputs/phase-11/screenshot-plan.json`（canonical 名 / `status: "present"`）

## 統合テスト連携

Phase 4/6 の consent/publish matrix・fail-soft test が semantic 層を、Playwright visual spec（実装サイクル）が visual 層（AC-3/4/5）を担保し、Phase 12 compliance の evidence 根拠になる。
