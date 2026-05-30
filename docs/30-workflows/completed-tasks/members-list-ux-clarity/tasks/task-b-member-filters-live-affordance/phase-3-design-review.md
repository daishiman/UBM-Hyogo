<!-- workflow: members-list-ux-clarity / task: B / phase: 3 -->

[実装区分: 実装仕様書]

# Phase 3 — 設計レビュー (Task B: member-filters-live-affordance)

> 前提: [phase-1-requirements.md](./phase-1-requirements.md) / [phase-2-design.md](./phase-2-design.md)

## 1. 真の論点

- 親 workflow 課題のうち「即発火 affordance」「適用中条件の可視化」「クリア位置最適化」を、`MemberFilters` 内部と新規 `SelectedFiltersBar` だけで完結させる
- 既存 `SelectedTagsBar` の API を壊さず汎化する (R-B-1)
- 既存 `MemberFilters.client.spec.tsx` の 7 ケース後方互換を維持する (AC-B-7)

## 2. 代替案比較

### 2.1 chip 列 component の作り方: 新規 + wrapper (採用) vs 既存ファイル拡張

| 観点 | A: 新規 `SelectedFiltersBar` + 旧 wrapper (採用) | B: `SelectedTagsBar` を内部拡張 |
| ---- | ----------------------------------------------- | ------------------------------- |
| 命名整合 | 責務 (tag だけでない) と名前が一致 | tag だけでない実装が "Tags" 名で残る |
| 後方互換 | wrapper で旧 API を提供 | 既存 props 拡張で済む |
| 移行容易性 | 段階的に呼び出し側を新名に切替 | 名前変更が必要なら結局 rename が発生 |
| spec 影響 | 既存 spec の SelectedTagsBar 部分はそのまま動く | props 追加で既存 spec も無影響 |

**採用根拠**: A。命名整合が長期保守で効く。

### 2.2 既存 `[data-role="clear"]` 廃止 vs エイリアス併設

| 観点 | A: 廃止 (採用) | B: clear-all に alias `data-role="clear"` 併設 |
| ---- | -------------- | --------------------------------------------- |
| spec 後方互換 | 既存ケースは `hasFilters=false → 非描画` に書き換えが必要 | 既存 selector で disabled 検証→ロジック変化で fail |
| DOM 単純さ | 1 button = 1 役割 | 1 button に 2 role |
| 親 Phase 3 § 2.4 | A 採用に整合 | 並存は disabled 状態維持を再導入することになり Phase 3 § 2.4 と矛盾 |

**採用根拠**: A。spec は Phase 4 で「`hasFilters=false` のとき `SelectedFiltersBar` が null」検証に書き換える。

### 2.3 件数文言: `X 件中 Y 件を表示しています` (採用) vs `Y 件 (全 X 件)`

親 Phase 3 § 6 で既決定。本タスクは決定を踏襲。

### 2.4 page.tsx 改修: 本タスクで実施 (採用) vs Task C に委譲

| 観点 | A: 本タスクで最小差分実施 (採用) | B: Task C 完了まで `totalCount=0` 固定 |
| ---- | ------------------------------- | --------------------------------------- |
| 機能完結性 | 本タスク単独で AC-B-2 が満たせる | Task C 完了まで件数表示は壊れた状態 |
| Task C への影響 | Task C は visual baseline 撮影に専念できる | Task C 側で実装と撮影を両方やる必要が出る |
| 差分 | +4 行のみ | 0 行 |

**採用根拠**: A。Task A / B / C 並列着手を前提に、各タスクの完結性を優先。

## 3. 価値とコスト

| 項目 | 値 |
| ---- | -- |
| 期待効果 | (1) 適用中条件の可視化 / 個別解除 (2) 即発火の明示 (3) クリア配置最適化 (4) SR への件数通知 |
| 推定 LOC | +260 / -60 |
| 推定工数 | 半日 (component spec → 実装 → visual baseline は Task C) |
| 影響範囲 | `/members` route のみ。`SelectedTagsBar` 他 route 参照は wrapper で吸収 |
| 新 primitive | 0 |
| API / Schema / Token 変更 | 0 |

## 4. 4 条件評価

| 条件 | 評価 | 根拠 |
| ---- | ---- | ---- |
| 整合性 (INV-1..6 / 親 Phase 2 / プロトタイプ) | ◎ | URL query SSOT / OKLch tokens / 新 primitive 0 |
| 価値性 | ◎ | 親 AC-3..6 / AC-9 を本タスクで全部担当 |
| 実現性 | ◎ | 1 サイクル + 並列着手可 |
| 運用性 | ○ | wrapper で旧 API 維持 / 既存 spec は Phase 4 で書換方針確定 |

## 5. risks (Phase 4 へ持越し)

| ID | リスク | 監視・対策 |
| -- | ------ | ---------- |
| R-B-1 | `SelectedTagsBar` 別 route 参照で破壊 | Phase 5 冒頭で `git grep -n SelectedTagsBar apps/` を実行。wrapper 維持で吸収 |
| R-B-2 | aria-live 二重宣言 | `<output>` 1 箇所のみ。`pagination-meta` には付けない |
| R-B-3 | 既存 spec の `clearBtn.disabled` 検証が破壊 | Phase 4 でテスト書換方針を確定 (`hasFilters=false → SelectedFiltersBar 非描画` に置換) |
| R-B-4 | page.tsx 改修が Task C と競合 | 本タスクは prop 渡しのみ。Task C は visual baseline と既存 spec への影響確認に専念 |
| R-B-5 | chip ラベル日本語化辞書の散逸 | `SelectedFiltersBar` 内に 1 箇所だけ default labels を持つ |
| R-B-6 | `<output>` の `role="status"` 冗長宣言で SR が二重通知 | `<output>` は HTML 仕様で暗黙 `role="status"` を持つが、testing-library での `getByRole("status")` の確実性のため明示。SR 実装上の冗長性は許容 |

## 6. open questions の解消

| Q | A |
| - | - |
| chip clear で個別解除した直後の focus 戻し先 | `MemberFilters` root form (`<form>` 自体)。chip が消えると focus 喪失するため。実装は `onClearOne` 後に form の `focus()` を呼ばない (デフォルトの document.body fallback で許容)。複雑化させない |
| `tag` chip の表示名は label か code か | 本タスクでは `#<code>` 形式 (現状の SelectedTagsBar 互換)。label 解決は別タスク化候補 |
| 旧 `[data-role="clear"]` セレクタを後方互換で残すか | 残さない。テストを書換える (Phase 4 § 2 で方針確定) |

## 7. 改善優先順位 (Phase 4 以降)

1. Phase 4 でテスト計画を確定 — 既存 7 ケースのうち修正対象を明示
2. Phase 5 で `SelectedFiltersBar` を先に新規実装 → `MemberFilters` を改修 → `page.tsx` の prop を渡す
3. Phase 6 で chip 個別解除の URL 反映を AAA テストで確認
4. Phase 11 は component spec の自動結果 + (必要なら) staging への手動確認 (visual baseline は Task C)

## 8. 承認可否

| 項目 | 結果 |
| ---- | ---- |
| Phase 1 AC (B-1..B-10) との整合 | ○ |
| 不変条件 (INV-1..6) との整合 | ○ |
| 親 Phase 2 § 3 / Phase 3 § 2.3..2.4 整合 | ○ |
| 新 primitive 追加 | 0 |
| API / Schema / Token 変更 | 0 |

**結論**: Phase 4 へ進行可。

## 9. DoD

- [x] 代替案比較が AC ごと / 論点ごとに記録
- [x] 採用根拠を明示
- [x] risks を ID 付きで列挙
- [x] open questions に解答付与
- [x] 4 条件評価を表で提示
