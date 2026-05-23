[実装区分: 実装仕様書]

# Phase 3 — 設計レビュー

## 3.1 レビュー観点

1. 修正方針が CLAUDE.md の OKLch token 正本化方針（不変条件 §2）と矛盾しないか
2. 代替案（HEX → OKLch literal 置換）を不採用とした根拠が妥当か
3. exclude pattern 拡大による未検知リスクがないか
4. 影響範囲が局所化されているか

## 3.2 代替案評価

### 案 A（採用）: exclude regex 拡張

- 対応箇所: `scripts/verify-design-tokens.ts` のみ（1 ファイル / 4 行追加）
- 影響: `apps/web` ランタイムに変更なし
- 整合性: 既存 file convention exclude と対称
- リスク: 後述 §3.3 で評価

### 案 B（不採用）: HEX → OKLch literal 置換

- 対応箇所: `apps/web/app/(public)/members/[id]/opengraph-image/route.tsx` の 41-42 行
- 例: `#1e3a8a` → `oklch(30% 0.15 264)` などへ置換
- 不採用理由:
  1. **drift script の精神と矛盾**: 「色は token 経由で参照する」というポリシーに反し、token 化されていない literal を量産する。OKLch literal も drift script から見れば同質の「token を経由しない直書き」であり、現状の正規表現が HEX のみ検出するため一時的に回避できているだけ。将来 OKLch literal も検出対象に拡張された場合、再度同じ問題が再発する。
  2. **実質的な改善ゼロ**: satori が展開する最終色は HEX / OKLch literal で完全等価。可読性・保守性の改善がない。
  3. **theme switching との非整合**: token bridge を経由しないため warm / cool / dark の theme に追随できない。OG 画像は SSG static のため switching 不要だが、設計の純度が下がる。
  4. **review burden 増**: 該当ファイルを触ることで Issue #806 の visual regression を再検証する必要が生じる。

### 案 C（不採用）: `// drift-allow-color-literal` 等の inline 抑制コメント機構を追加

- 不採用理由:
  1. drift script 側に新規 syntax / parser を追加する必要があり、本来の CI 修正に対し over-engineering。
  2. inline 抑制は「個別ファイル単位で逃がす」用途で、本ケースのように **structurally 制約がある convention 全体** を扱うには粒度が粗すぎる / 細かすぎるの両方の問題がある。

## 3.3 案 A の未検知リスク評価

| リスク | 影響 | 判定 |
|---|---|---|
| 開発者が任意の route.tsx を「OG だ」と称して HEX を直書きする | exclude pattern は **`opengraph-image` / `twitter-image` / `icon` / `apple-icon` のいずれか直下の `route.tsx`** にのみマッチするため、汎用 route handler は引き続き検出対象 | 低 |
| `app/api/.../route.tsx`（API handler）が誤マッチ | API handler は `route.ts`（`.tsx` ではない）で書くのが通例。`.tsx` で書く場合も上記 4 命名のいずれかを親 dir に含まなければマッチしない | 極低 |
| Next.js が新 metadata convention を追加 | 都度 exclude を見直せばよい。drift script が**過検出する**側に倒すデフォルトなので fail-safe | 低（運用対応） |
| OKLch literal も将来検出対象に | 案 A はそもそも HEX を残すため、OKLch 検出器が追加されても影響を受けない | なし |

→ いずれも許容範囲。汎用コードへの抑制リークは構造的に発生しない。

## 3.4 不変条件との整合確認

| 不変条件 | 整合 |
|---|---|
| CLAUDE.md §2 OKLch token 正本化 | ✓ tokens.css / design-tokens.md に変更なし。例外は satori 配下のみに限定 |
| `apps/web` から D1 直接アクセス禁止 | ✓ 影響なし |
| GAS prototype の非昇格 | ✓ 影響なし |
| 既存 file convention exclude との対称性 | ✓ 同一の satori 制約を route handler convention にも対称適用 |

## 3.5 残課題 / フォロー

- `scripts/verify-design-tokens.ts` の hardcoded root OG filter と重複 `excludes.some(...)` は Phase 5 で削除し、除外条件を `DEFAULTS.colorLiteralExcludes` に集約する。
- exclude pattern を 1 箇所（`DEFAULTS.colorLiteralExcludes`）に集約しているため、将来の追加・削除コストは低い。

## 3.6 レビュー判定

**承認**: 案 A（exclude regex 拡張）で Phase 4 以降の実装に進む。
