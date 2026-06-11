# Phase 11: 手動テスト（視覚確認計画・VISUAL）

- task_id: `admin-dashboard-jp-clarity-and-card-ux`
- visualEvidence: `VISUAL`（管理ダッシュボード `/(admin)/admin` の見た目・文言・レイアウトが変わる）
- workflow_state: `implemented_local_runtime_pending`（apps/web 実装・focused Vitest 7 files / 77 tests PASS・staging スクリーンショットは認証 user-gated。本 Phase は視覚確認の **計画** を保持）
- evidence_status: `staging_visual_pending_user_gate`（実 PNG は未取得。`outputs/phase-11/screenshots/` は実装後 staging で生成・user-gated）

> **evidence 境界の明示**: implemented_local_runtime_pending 段階のため、`outputs/phase-11/screenshots/*.png` の実体は **本仕様作成時点では未生成（staging_visual_pending_user_gate）**。focused vitest（構造・文言・トークン）と staging スクリーンショット（レイアウト）の分担を記述し、実装後 staging 認証済みセッションで撮影する手順と PASS 観点を確定する。staging 認証・撮影は user-gated。

## 目的

jsdom（focused vitest）では検証できない「CSS の効き（カード内収まり・横バーのコンパクトさ・余白）」を、実装後に staging スクリーンショットで確認する手順と PASS 観点を確定する。本タスクは管理ダッシュボードの日本語化（AC-1/2/3）と情報設計是正（AC-4 カード化・AC-5 横バー化）が主目的の VISUAL タスクである。日本語表示・技術語排除は focused vitest で構造・文言を担保し、「はみ出さない / 横長でない」の最終視覚成立は staging スクリーンショットで担保する。

## 3 層評価の計画（Semantic / Visual / AI UX）

| 層 | 評価対象 | 担保手段 | 状態 |
| --- | --- | --- | --- |
| **Semantic（意味）** | KPI ラベル・アクション名・targetType・ステータスが日本語で意味的に正しい。技術語（スキーマ/alias/schema/DISTRIBUTION・生アクションコード）が排除されている。`aria-label="公開ステータス分布: …"` の意味的正確性 | focused vitest（文言 DOM 存在・glossary 変換）+ 実装後 staging 目視 | spec 計画（vitest は実装後実行） |
| **Visual（視覚）** | 直近のアクションがカード型リストで対象 ID がカード内に収まる（truncation）。公開ステータスがコンパクト横バーで 600px 横長余白がない。KPI が日本語で全大文字化されていない | staging スクリーンショット（desktop / mobile 幅）の pixel 確認 | `staging_visual_pending_user_gate`（user-gated） |
| **AI UX（運営者体験）** | エンジニアでない支部会運営者が「何が起きたか / 公開状態の内訳 / 要対応のフォーム項目」を迷わず読める。情報階層（アクション → 誰が・いつ → 対象）が直感的 | 実装後 staging スクリーンショットを用いた UX レビュー（運営者視点の可読性評価） | `staging_visual_pending_user_gate`（user-gated） |

## 実行タスク

### 1. 視覚確認対象と evidence 境界

| 対象 | staging route | jsdom で確認可 | staging 実機で確認すべき範囲 |
| --- | --- | --- | --- |
| KPI 4 枚（日本語ラベル・非 uppercase） | `/(admin)/admin` | ラベル文言 DOM・class 非付与（KpiGrid/KpiCard spec） | 日本語ラベルの視認性・全大文字でない表示 |
| 直近のアクション（カード型リスト） | 同上 | 構造（`recent-action-item`）・日本語アクション名・`truncate` class（RecentActionsTable spec） | 対象 ID が **カード内に収まる**（はみ出さない）描画結果 |
| 公開ステータス（横バーリスト） | 同上 | `aria-label` 維持・`status-bar` 構造・HEX 不在（StatusDistribution spec） | バーが **コンパクトな横棒** で 600px 横長にならないこと |
| SchemaAlertCard / eyebrow | 同上 | 平易日本語文言・`会員分布` の DOM 存在 | レイアウト内での視認性・配置 |

> jsdom は class 付与・DOM 文言・属性値までしか保証できず、`truncate` の効きや横バーのレンダリング幅は確認不能。その差分を staging スクリーンショットで埋める。

### 2. テストケース

> 視覚 TC は実装後 staging で取得する。本仕様作成時点では `PENDING_STAGING_SCREENSHOT`。

| テストケース | 確認対象（AC） | 何を見れば PASS か | 想定証跡ファイル | 状態 |
| --- | --- | --- | --- | --- |
| TC-11-1 | AC-1 KPI 日本語化 | KPI 4 枚が `会員総数` / `サイト公開中` / `タグ未設定` / `要対応のフォーム項目` で、全大文字化されていない | `screenshots/admin-dashboard-desktop.png` | `PENDING_STAGING_SCREENSHOT` |
| TC-11-2 | AC-2/3 技術語排除 | SchemaAlertCard が平易な日本語（スキーマ/alias/schema 非表示）、eyebrow が `会員分布`（`DISTRIBUTION` 非表示） | `screenshots/admin-dashboard-desktop.png` | `PENDING_STAGING_SCREENSHOT` |
| TC-11-3 | AC-4 直近のアクション カード化 | 各アクションが 1 件 = 1 カードで、アクション名が日本語、対象が `truncate` で **カード幅を超えずカード内に収まる**（テーブルのはみ出しが解消） | `screenshots/recent-actions-card-list.png` | `PENDING_STAGING_SCREENSHOT` |
| TC-11-4 | AC-5 公開ステータス 横バー化 | 公開ステータスが **コンパクトな横バーリスト**（公開/会員限定/非公開 + 件数）で、600px 固定 SVG の横長余白が解消されている | `screenshots/status-distribution-bars.png` | `PENDING_STAGING_SCREENSHOT` |
| TC-11-5 | AC-4/5 モバイル幅 fallback | モバイル幅でカードリスト・横バーが縦積みで潰れず読め、対象 ID が truncation でカード内に収まる | `screenshots/admin-dashboard-narrow-mobile.png` | `PENDING_STAGING_SCREENSHOT` |

### 3. 画面カバレッジマトリクス

canonical 命名は `<component>-<state>.png` 形式に統一する。

| テストケース | 画面 / 状態 | viewport | 撮影セレクタ / 対象 | 対応 AC | canonical ファイル名 |
| --- | --- | --- | --- | --- | --- |
| TC-11-1 / TC-11-2 | ダッシュボード全景 | desktop（≈1280px） | ページ全体（KPI + SchemaAlertCard + eyebrow） | AC-1/2/3 | `admin-dashboard-desktop.png` |
| TC-11-3 | 直近のアクション カード | desktop | `[data-testid="recent-actions-list"]` 配下の `recent-action-item` 群 | AC-4 | `recent-actions-card-list.png` |
| TC-11-4 | 公開ステータス 横バー | desktop | `[data-testid="status-distribution-list"]`（`status-bar` 群） | AC-5 | `status-distribution-bars.png` |
| TC-11-5 | モバイル幅 縦積み fallback | narrow（≈390px） | ページ全体 | AC-4/5 | `admin-dashboard-narrow-mobile.png` |

> N/A（暗黙スキップ禁止の明示記録）:
> - ダークモード: admin ダッシュボードはダークテーマ対象外 → N/A。
> - インタラクション状態（modal / hover）: 本タスクは静的表示の日本語化・情報設計是正で対話状態追加なし → N/A。

### 4. jsdom で確認できない CSS の「効き」と staging の境界

| 視覚要素 | jsdom で確認できない理由 | 代替 evidence（vitest / gate 側） | staging で確認する内容 |
| --- | --- | --- | --- |
| 対象 ID の truncation | `text-overflow:ellipsis` の折り畳みは jsdom 非算出 | `truncate` class 付与の確認（RecentActionsTable spec） | 対象 ID がカード幅を超えずカード内に収まること |
| 横バーのコンパクトさ | `viewBox="0 0 100 8"` + `width` レンダリング結果は jsdom 非算出 | `status-bar` 構造・幅計算ロジックの spec | バーがコンパクトな横棒で 600px 横長にならないこと |
| KPI ラベルの非 uppercase | `text-transform` の表示結果は描画依存 | `uppercase` class 非付与の spec | 日本語が自然に表示されること |
| モバイル幅 縦積み | flex / grid の折り返しは jsdom 非算出 | レイアウト class の確認 | 縦積みで潰れず読めること |

代替 evidence のコマンド（Phase 9 で確定済を再掲・実装後実行）:

```bash
# focused vitest（DOM 構造 / 文言 / glossary 変換）
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts \
  apps/web/src/features/admin/components/_dashboard \
  apps/web/src/lib/admin/__tests__/dashboardGlossary.spec.ts

# トークン gate（HEX 不在） / API 非変更
mise exec -- pnpm verify:tokens
git diff --name-only -- apps/api | grep . && echo "[FAIL]" || echo "[PASS: api untouched]"
```

### 5. スクリーンショット取得・配置計画（実装後・staging 認証 user-gated）

実装完了後、ユーザー承認のもと staging 認証済みセッションで撮影する。staging 認証（Google OAuth / Magic Link）の実行は user-gated。

| 配置先 | 内容 | 状態（本仕様作成時点） |
| --- | --- | --- |
| `outputs/phase-11/screenshots/admin-dashboard-desktop.png` | desktop 全景（KPI 日本語・技術語排除） | `staging_visual_pending_user_gate` |
| `outputs/phase-11/screenshots/recent-actions-card-list.png` | 直近のアクション カード型リスト（truncation） | `staging_visual_pending_user_gate` |
| `outputs/phase-11/screenshots/status-distribution-bars.png` | 公開ステータス コンパクト横バー | `staging_visual_pending_user_gate` |
| `outputs/phase-11/screenshots/admin-dashboard-narrow-mobile.png` | モバイル幅 縦積み fallback | `staging_visual_pending_user_gate` |
| `outputs/phase-11/screenshot-inventory.json` | screenshot inventory | `staging_visual_pending_user_gate` |
| `outputs/phase-11/manual-test-result.md` | TC-11-* の PASS/FAIL 記録・仕様照合サマリー | `staging_visual_pending_user_gate` |

取得手順（実装後・user-gated）:

1. `apps/web` 実装を staging へ deploy（`bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env staging`・user-gated）。
2. staging に管理者として認証ログイン（Google OAuth / Magic Link・user-gated）。
3. `/(admin)/admin` を desktop（≈1280px）・narrow（≈390px）で開き、上記 canonical 名で撮影。
4. `outputs/phase-11/screenshots/` に配置し、`screenshot-inventory.json` / `manual-test-result.md` を生成。

> **スクリーンショットの実体は本 implemented_local_runtime_pending 段階では未生成**（`outputs/phase-11/screenshots/` は `staging_visual_pending_user_gate`）。実装・deploy・認証・撮影はすべて後続のユーザー承認後に実施する。

## 参照資料

| 種別 | Path | 用途 |
| --- | --- | --- |
| 要件（AC 正本） | `docs/30-workflows/completed-tasks/admin-dashboard-jp-clarity-and-card-ux/phase-1-requirements.md` | AC-1..AC-10 / 根本原因 |
| 設計 | `docs/30-workflows/completed-tasks/admin-dashboard-jp-clarity-and-card-ux/phase-2-design.md` | カード型 / 横バー DOM 設計・truncation 根拠 |
| QA | `docs/30-workflows/completed-tasks/admin-dashboard-jp-clarity-and-card-ux/phase-9-qa.md` | 検証コマンド・gate・AC マッピング |
| 最終レビュー | `docs/30-workflows/completed-tasks/admin-dashboard-jp-clarity-and-card-ux/phase-10-final-review.md` | AC trace・DoD |
| テンプレート | `.claude/skills/task-specification-creator/references/phase-11-screenshot-guide.md` | 必須セクション・selector ルール |

### システム仕様（aiworkflow-requirements）

| 参照資料 | パス | 内容 |
| --- | --- | --- |
| design-tokens | `.claude/skills/aiworkflow-requirements/references/design-tokens.md` | OKLch トークン正本・HEX 禁止不変条件 |
| ui-ux-navigation | `.claude/skills/aiworkflow-requirements/references/ui-ux-navigation.md` | admin ナビ / 画面構成の正本 |

## 成果物

| 成果物 | 種別 | 状態 |
| --- | --- | --- |
| 本 Phase 11 仕様書 | 文書 | 作成済（視覚確認計画・3 層評価・TC-11-1..5・カバレッジマトリクス・jsdom 境界） |
| `outputs/phase-11/screenshots/*.png` | visual evidence | `staging_visual_pending_user_gate`（実装後 staging で生成・user-gated） |
| `outputs/phase-11/screenshot-inventory.json` | visual inventory | `staging_visual_pending_user_gate` |
| `outputs/phase-11/manual-test-result.md` | evidence + runtime boundary | `staging_visual_pending_user_gate` |

## 統合テスト連携

- **focused vitest（構造・文言・トークン）**: KPI 日本語ラベル・glossary 変換・`truncate` class 付与・`status-bar` 構造・`aria-label` 維持・HEX 不在を担保する（Phase 9 タスク 3）。実装後の実行で AC-1/2/3/6/9/10 の Semantic 層判定根拠となる。
- **staging スクリーンショット（レイアウト）**: jsdom で確認できない「対象 ID がカード内に収まる（truncation の効き）」「公開ステータスがコンパクト横バーで横長でない」「モバイル幅で縦積みに潰れず読める」の Visual / AI UX 層を担保する（AC-4 / AC-5）。
- 分担: focused vitest が **構造・文言・トークン** を、staging スクリーンショットが **レイアウト（CSS の効き）** を担保する。両者が揃って AC-4 / AC-5 の視覚成立が確定する。

## 完了条件

- [ ] 3 層評価（Semantic / Visual / AI UX）の計画が記述されている。
- [ ] AC-1/2/3/4/5 の視覚確認観点（TC-11-1..5）と「何を見れば PASS か」が確定している。
- [ ] スクリーンショット canonical 名（`admin-dashboard-desktop.png` / `admin-dashboard-narrow-mobile.png` / `recent-actions-card-list.png` / `status-distribution-bars.png`）が `<component>-<state>.png` 形式で確定している。
- [ ] jsdom で確認できない CSS の「効き」と staging の境界・代替 evidence が記載されている。
- [ ] focused vitest（構造/文言/トークン）と staging スクリーンショット（レイアウト）の分担が `## 統合テスト連携` に記述されている。
- [ ] スクリーンショットの実体が本 implemented_local_runtime_pending 段階では未生成（`staging_visual_pending_user_gate`）であることを明記した。
- [ ] 実装後の取得手順（staging deploy / 認証 / 撮影）が user-gated として記載されている。
