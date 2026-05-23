# Phase 3: 設計レビュー

## 3.1 設計判断の妥当性

| 観点 | 判定 | 根拠 |
|---|---|---|
| 不変条件 1 (既存 API のみ) | ◯ | 採用案 C は UI 1 ファイル局所注入。API endpoint 触らず |
| 不変条件 2 (OKLch token 正本) | ◯ | `StatusDistribution.tsx` の `fill={bar.colorVar}` は `var(--ubm-color-*)` を維持。HEX 化しない |
| 不変条件 3 (chart dep 禁止) | ◯ | SVG 直書きのまま。新規 dependency 追加なし |
| 不変条件 4 (D1 直接禁止) | ◯ | `apps/web` 配下のみ・D1 binding 触らず |
| 不変条件 5 (StatusDistribution ロジック不変) | ◯ | `StatusDistribution.tsx` 本体には触らず、caller (page) で prop を一時上書きするのみ |
| CONST_007 (1 サイクル完了) | ◯ | screenshot 2 枚取得 + ドキュメント update のみ。先送り要素なし |

## 3.2 リスクと緩和策

| リスク | 緩和策 | 担保 phase |
|---|---|---|
| fixture 注入の revert 漏れ | Phase 11 末尾で `git status apps/web/ apps/api/` を必須実行し、出力をログに残す | Phase 11 §後処理 |
| PII (撮影者 email / device 情報) の PNG 混入 | `optipng -strip all` または `magick mogrify -strip` を必須化 | Phase 11 §後処理 |
| PNG サイズ過大による git LFS 化 | viewport を chart 周辺に絞る・`optipng -o2` で圧縮・上限 500KB 目視確認 | Phase 11 §AC |
| 親 workflow doc 編集が他タスクの差分と衝突 | 編集前に `git pull --rebase origin dev` を実行。本タスクは `completed-tasks/` 下のため通常並列衝突は稀 | Phase 5 §前処理 |
| Issue 819 が closed のまま PR 作成 → reviewer 混乱 | PR 本文冒頭に「closed issue の遺残作業」を明記 (Phase 13 で実装) | Phase 13 |
| Local dev で admin 認証 setup が未整備 | `docs/00-getting-started-manual/specs/13-mvp-auth.md` を再確認。Magic Link 経路で admin email にログイン | Phase 11 §前提 |

## 3.3 代替案レビュー（B 案: API patch）

- B 案 (API patch) は typecheck/lint/test の連鎖影響を受けるため、本タスクの 0.25 人日スコープを超過するリスクがある
- ただし C 案で UI caller の構造が `slices` を prop で受けない (SWR 内部で取得) 等であれば B 案に切替
- Phase 5 開始時に `apps/web/src/app/(admin)/admin/page.tsx` 周辺の caller 構造を `Read` で確認し、C 案で対応可能かを判定する

## 3.4 レビュー結論

設計は妥当。Phase 4 (test plan) へ進行可。
## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 3 |
| taskType | implementation |
| visualEvidence | VISUAL_ON_EXECUTION |

## 目的

Phase 2 の設計が不変条件と skill 境界に反していないことを確認する。

## 実行タスク

- API surface、design token、dependency、D1 boundary、revert boundary を確認する。
- 破棄再構成が不要であることを判定する。

## 参照資料

- `phase-2-design.md`
- `artifacts.json`
- 親 workflow Phase 11 / Phase 12 outputs

## 成果物

- 設計レビュー結果
- 不変条件チェック

## 完了条件

Phase 5 実行へ進める blocker がない。

- [ ] API surface / token / dependency / D1 boundary / revert boundary に blocker がない

## 統合テスト連携

Phase 11 の typecheck / lint / focused test / build でレビュー結果を実測確認する。
