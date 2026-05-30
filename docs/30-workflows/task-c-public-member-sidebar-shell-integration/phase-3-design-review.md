# Phase 3: 設計レビュー（Phase 4 進行可否判定）

## レビュー観点と判定

| 観点 | 判定 | 根拠 |
| --- | --- | --- |
| スコープ整合 | PASS | 公開 6 + 会員 1 = 7 route、admin は Task D へ分離（不変条件 #7） |
| 依存解決 | PASS | A/B/E shell primitive は本サイクルで先行実装済み。Task C layout 統合まで同一サイクルで完了 |
| 責務境界 | PASS | shell 内部実装は A/B/E、Task C は配線のみ。role 再判定なし（AC-C5） |
| auth 境界不変 | PASS | middleware / D1 / API 変更なし（AC-C8）。`x-pathname` は fallback + client `usePathname()` |
| URL 不変性 | PASS | route group `()` は URL に非寄与。`git mv` で履歴保持 |
| token 正本 | PASS | HEX 直書きなし。shell token は Task A の tokens.css 追加に依存 |
| test 規約 | PASS | co-location `*.spec.tsx`。新規ディレクトリ `__tests__/(public)-layout...` は作らず既存 spec 編集 |

## 設計上のリスクと緩和

| リスク | 深刻度 | 緩和策 | 検証 Phase |
| --- | --- | --- | --- |
| route 移動で相対 import 破壊 | HIGH | Phase 5 移動チェックリスト + typecheck gate。`@/` alias 箇所は不変 | 5 / 9 |
| `login/` dir 移動で _components / __tests__ の参照断絶 | HIGH | dir ごと `git mv`。dir 内相対は不変、dir 外参照のみ補正 | 5 / 9 |
| `x-pathname` 未配線で SSR active state が崩れる | MEDIUM | fallback + client `usePathname()` で graceful degradation。崩れる場合 Phase 12 で未タスク化 | 11 / 12 |
| A/B/E 未実装のまま実装着手 | RESOLVED | A/B/E → C の順で本サイクル内に実装済み | 9 / 10 |
| profile/page.tsx の MemberHeader 2 箇所剥がしで段組崩れ | LOW | layout が shell を持つため page は content のみに。Phase 11 visual で確認 | 11 |
| smoke route（`app/__smoke__`, `app/smoke`）が移動 page を参照 | LOW | Phase 5 で grep 確認。移動対象は `/` `/privacy` `/terms` `/login` のみで smoke は別 path | 5 / 9 |

## MINOR 指摘（→ Phase 12 未タスク検出で再評価）

- M-1: middleware `x-pathname` 注入の是非。本タスクでは AC-C8 維持のため未実施。active state が fallback で不足する場合は未タスク候補。
- M-2: `(public)` group 集約後、root 直下に残る page（`smoke` / `visual-harness` 等）との責務整理。本タスクスコープ外（dev/smoke 用途）。

## 判定

**PASS** — 依存 A/B/E は本サイクルで解消済み。残る visual runtime evidence は Gate-C として分離する。
MINOR 指摘 M-1/M-2 は Phase 12 `unassigned-task-detection.md` で current/baseline 分離して再評価する。

## 完了条件

全観点が PASS / CONDITIONAL で判定され、リスク緩和策が Phase 4/5/9/11 へ trace されている。
