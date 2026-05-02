# Phase 09 Main — 品質保証

## Classification

| Field | Value |
| --- | --- |
| task | `06c-B-admin-members` |
| phase | `09 / 13` |
| taskType | `implementation-spec / docs-only` |
| docs_only | `true` |

## free-tier 見積もり

| 項目 | 想定 | Cloudflare 無料枠 | 判定 |
| --- | --- | --- | --- |
| Workers requests | admin 数 1〜数名、1 操作あたり list+detail+action で数 req | 100k/day | **OK**（実数 < 100/day 想定） |
| D1 reads | list 検索 1 回 = 1〜2 query（count + paged select）、index 利用前提 | 5M reads/day | **OK** |
| D1 writes | delete/restore = mutation 1 + audit 1 = 2 writes/操作 | 100k writes/day | **OK** |
| Pages | 1 page 最大 50 件、`members(zone, status)` / `member_tags(memberId, tag)` index 必須 | — | 全件スキャン回避 |

## secret hygiene チェックリスト

- [x] AUTH_SECRET / DATABASE 接続情報を仕様書中に記載していない
- [x] audit に PII（name / email）が漏れない（actor は memberId のみ、target も id のみ）
- [x] error response に内部 SQL / stack trace を含めない（apps/api の error handler で production は generic message）
- [x] apps/web 側で D1 binding を直参照しない（不変条件 #5、lint で構造的に禁止）
- [x] curl evidence 取得時に Authorization header の値を残さない（Phase 11 redaction checklist）

## a11y チェックリスト（09-ui-ux 整合 / WCAG AA）

- [x] 検索フォームの各 input に `<label>` が紐付く（zone / status / tag / sort / density / q）
- [x] table の column header が `<th scope="col">` で表現される
- [x] delete / restore の confirmation が `<dialog>` で focus trap される
- [x] error toast が `aria-live="polite"` で読み上げられる
- [x] keyboard で 一覧 → 詳細 → 操作 まで到達可能（tab order が論理順）
- [x] focus indicator が visible（color contrast AA）

## 多角的チェック

- #5: apps/web の D1 直参照を構造的に防止
- #13: audit 必須（write を transaction batch で保証）
- a11y: WCAG AA 必須項目を満たす
- 無料枠: 通常運用で D1 reads / writes / Workers requests がいずれも上限の <1%

## 完了条件チェック

- [x] 無料枠で運用可能
- [x] secret 漏洩経路ゼロ
- [x] a11y AA 必須項目を満たす

## 次 Phase への引き渡し

Phase 10 へ、QA 結果（free-tier OK / secret hygiene 通過 / a11y 通過）を渡す。
