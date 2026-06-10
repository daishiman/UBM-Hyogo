# Phase 11 手動テスト結果（VISUAL 証跡計画）

- task_id: `public-home-member-card-info-and-tag-clarity`
- mode: **VISUAL** / status: **implemented_local_evidence_captured（staging pending user gate）**

## 証跡メタ

- **主ソース = local component harness screenshot + focused tests**。staging screenshot は user-gated。
- `outputs/phase-11/screenshots/member-card-home-comfy-with-tags.png` を Playwright local harness で取得済み。
- capture metadata（`phase11-capture-metadata.json`）の `status` は `local_captured_staging_pending`、`captured` は local PNG 1 件。
- [Feedback 4]: staging 実証跡は deploy 後・user-gated。撮影タイミングは Phase 13 の user 承認に従う。

## 3 層評価（実装後に実施）

| 層 | 観点 | 検証 AC |
| --- | --- | --- |
| Semantic | DOM に `biz-summary` / `tag-row` / `tag-chip[data-phase]` が出る・region/role/status 非表示 | AC-2/AC-4/AC-5/AC-6 |
| Visual | local PNG でプロトタイプ意図と整合・OKLch トークン経由（HEX なし） | AC-4/AC-8 |
| AI UX | 「何をやっているか」即把握・`0→1` 矢印表記・地域タグ消滅・情報過多回避 | AC-1/AC-2/AC-6/AC-7 |

## 撮影予定 screenshot（実装後 staging）

| canonical 名 | 検証 AC |
| --- | --- |
| `member-card-home-comfy-with-tags.png` | AC-1 / AC-2 / AC-4 / AC-5 / AC-6（captured local） |
| `member-card-tag-phase-emphasis.png` | AC-1 / AC-2 / AC-4 |
| `member-card-dense.png` | AC-4 / AC-5 |
| `member-card-list.png` | AC-4 |
| `tag-picker-arrow-normalized.png` | AC-1 / AC-7 |

## 判定

- 本 Phase は local evidence として完了。staging capture は deploy/user-gated で追加取得する。
