# Phase 2: 設計

## 2.1 アーキテクチャ判断

本タスクは **コード変更ゼロが理想**だが、`byStatus` populated 状態の screenshot を取得するには「実 DB / 実 Form 回答を populate」「API 側で固定値を返す patch」「UI 側 prop を固定値で注入」のいずれかが必要。3 案を比較する。

| 案 | 影響範囲 | revert 漏れリスク | 採否 |
|---|---|---|---|
| A. 実 DB に member データを seed して populated 状態を作る | D1 binding が必要・admin auth と並行で複雑 | seed データの掃除漏れ | × 採用しない |
| B. `apps/api/src/routes/admin/dashboard.ts` を一時 patch | API 層を編集 → typecheck/lint/test 連鎖影響 | git diff で 1 ファイル監視可 | △ 次善 |
| C. `StatusDistribution.tsx` の caller (`apps/web/src/app/(admin)/admin/page.tsx` 周辺) で `<StatusDistribution slices={[...]} />` をハードコード注入 | UI 1 ファイルのみ | git diff で 1 ファイル監視可 | ◯ **採用** |

理由: C 案は API と `StatusDistribution.tsx` 本体を触らずに済み、`grep -nE 'fill="#'` の grep-gate にも影響しない。注入対象は caller の単一ファイルに局所化されるため revert 確認が `git checkout -- <path>` 1 行で済む。

## 2.2 fixture 注入仕様（C 案詳細）

### 2.2.1 placeholder 状態の取得

- 対象: dashboard 画面の `StatusDistribution` レンダ部
- 注入値: `<StatusDistribution slices={undefined} />`（= 既定の "分布データは現在集計対象外です" 表示）
- 注意: 既存の admin/page (dashboard) コードで `slices` プロップを実 API 値で渡している場合は、その引数を `undefined` で上書きする 1 行の patch を入れる

### 2.2.2 populated 状態の取得

- 注入値:
  ```tsx
  <StatusDistribution
    slices={[
      { status: "public", count: 12 },
      { status: "member_only", count: 7 },
      { status: "hidden", count: 3 },
    ]}
  />
  ```
- 値の妥当性: max=12 で bar 高さの差が明瞭。`STATUS_ORDER = ["public","member_only","hidden"]` 順で 3 本描画される
- 期待 aria-label: `公開ステータス分布: 公開 12, 会員限定 7, 非公開 3`

### 2.2.3 撮影対象矩形

- `data-testid="status-distribution-chart"` を含む `<section class="ui-card ...">` を含む viewport 撮影
- フル page screenshot ではなく `<section>` 周辺を含む clip でもよい（最低 200x100 px）

## 2.3 Screenshot 取得手段

| 手段 | 採否 | 理由 |
|---|---|---|
| 手動 (Cmd+Shift+4 等 OS native) | ◯ 採用可 | サイズ小・admin 認証済み browser があれば即実行可能 |
| Playwright script | △ 任意 | 既存 `playwright-smoke` 系に admin 認証 setup がある場合のみ。本タスクの 0.25 人日スコープでは手動推奨 |
| Chrome DevTools `Capture node screenshot` | ◯ 推奨 | DOM element 単位で clip 可能。PII 写り込みを避けやすい |

→ **Chrome DevTools の "Capture node screenshot" を第一手段**、手動 OS スクショを fallback とする。

## 2.4 PNG 後処理

```bash
# PII (撮影者 user / device 情報) を strip
optipng -strip all -o2 <file>.png   # 圧縮 + metadata 剥がし
# size 確認
ls -la <file>.png   # ≤ 500KB を担保
file <file>.png     # 解像度確認 (≥ 200x100)
```

`optipng` 未導入環境では `magick mogrify -strip <file>.png` で代替。

## 2.5 親 workflow ドキュメント編集仕様

| ファイル | 編集箇所 | before | after |
|---|---|---|---|
| `outputs/phase-11/main.md` | screenshot section | `status: runtime_pending` 等の行 | `status: runtime_completed` + 取得日 `2026-05-20` 追記 |
| `outputs/phase-12/main.md` | §6 残課題 | `authenticated runtime screenshot: pending` | 該当行削除 or `consumed by issue-819-admin-dashboard-runtime-screenshot` |
| `outputs/phase-12/unassigned-task-detection.md` | followup table | `step-05-followup-001 ... status: unassigned` | `consumed: 2026-05-20 (issue-819)` 追記 |

実際の文字列は Phase 5 / Phase 11 実装時に該当ファイルを `Read` してから patch 内容を確定する（仕様ドリフト対策）。

## 2.6 unassigned-task spec の consumed 化

`docs/30-workflows/unassigned-task/step-05-followup-001-admin-dashboard-runtime-screenshot-capture.md` は完了後に下記いずれかで処理:

- (推奨) `git mv` で親 completed-tasks 配下 `step-05-dashboard-chart-implementation/consumed-followups/` に移動
- (簡易) 当該ファイル冒頭に `Status: consumed by issue-819-admin-dashboard-runtime-screenshot (2026-05-20)` 行を追記

→ Phase 5 時点で親 workflow の運用慣行を `Read` で確認し決定する。

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 2 |
| taskType | implementation |
| visualEvidence | VISUAL_ON_EXECUTION |

## 目的

runtime screenshot を最小差分で取得する設計を確定する。

## 実行タスク

- fixture 注入案を比較する。
- caller 一時注入と revert の境界を定義する。
- PNG 後処理と親 workflow 反映先を決める。

## 参照資料

- `apps/web/app/(admin)/admin/page.tsx`
- `apps/web/src/features/admin/components/_dashboard/StatusDistribution.tsx`
- 親 workflow `outputs/phase-11/` と `outputs/phase-12/`

## 成果物

- fixture 注入設計
- screenshot 取得手段
- 親 workflow 更新仕様

## 完了条件

恒久コード変更なしで Phase 11 を実行できる設計になっている。

- [ ] caller 一時注入、PNG 取得、revert、親 workflow 更新の順序が定義されている

## 統合テスト連携

Phase 11 の focused component test と grep-gate で設計の不変条件を確認する。
