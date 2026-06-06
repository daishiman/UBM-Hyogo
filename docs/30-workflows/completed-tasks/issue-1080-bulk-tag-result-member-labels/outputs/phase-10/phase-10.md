# Phase 10: 最終レビュー

implemented local 段階のレビュー。各 AC は実コードと focused component test で判定する。staging visual evidence は user-gated。

---

## 10.1 AC 判定表

| AC | 内容 | 設計上の充足根拠 | 検証ケース | 判定 |
|----|------|------------------|------------|------|
| AC-1 | skipped 行に member の fullName を表示 | BulkActionBar に `membersById` prop 追加 + skipped 行で `membersById?.[r.memberId]?.fullName` 解決。MembersClientShell が `initial.members` から注入 | TC-BAB-TAG-06 | 設計上充足・実装で検証 |
| AC-2 | tag_not_found 行に tag label を表示（未解決時 `{tagId}（未登録）`） | `tagLabelById`（`available` 由来）で label 解決、未解決時 `${r.tagId}（未登録）` fallback | TC-BAB-TAG-06 / TC-BAB-TAG-07 | PASS |
| AC-3 | API contract / shape を膨らませない | apps/api 非接触。表示名・label は UI 側 `membersById`（props）と `fetchTagMaster().available`（既存）で解決。`BulkTagResultItem` 型変更なし | Phase 9 #5（apps/api diff 空） | 設計上充足 |
| AC-4 | 表示名が無いとき memberId へ fallback | `?? r.memberId` の nullish fallback。`membersById` optional・空 Record・id 不在を全吸収 | TC-BAB-TAG-07 | PASS |
| AC-5 | component test で担保 | BulkActionBar.spec.tsx に TC-BAB-TAG-06..09 追加。後方互換 TC-BAB-TAG-03 維持 | Phase 4 / Phase 6 | 設計上充足・実装で検証 |

---

## 10.2 不変条件適合

| 不変条件 | 適合 |
|----------|------|
| #3 D1 直接アクセス禁止 | 追加なし（純粋表示解決） |
| #9 admin form input は FormField 経由 | 本タスクは form input 非追加（表示のみ） |
| #10 admin mutation は features hooks の useAdminMutation 経由 | 既存 `../../hooks/useAdminMutation` を維持・新規 mutation なし |
| プロトタイプ正本順位 / 新規 primitive を生やさない | li / ul / 既存 className 維持・新規 primitive なし |
| OKLch トークン正本 / HEX 直書き禁止 | 色変更なし |

---

## 10.3 MINOR 指摘（Phase 12 未タスク化候補）

| ID | 指摘 | 重大度 | 扱い |
|----|------|--------|------|
| M-1 | summary 行で member を fullName のみ表示し email を出さない。将来「同名 member の識別」要件が出た場合、tooltip / 副次表示（maskEmail）が欲しくなる可能性 | MINOR | 本タスクスコープ外（PII 表示拡大回避が SSOT）。需要発生時に Phase 12 detection で未タスク化候補 |
| M-2 | `tagLabelById` は `available`（picker 用 master）由来のため、`available` 未ロード（fetch 失敗）時は全 notFound が `（未登録）` 表示になる。実害は小（not_found は元々レア）だが、label 解決の信頼度は available ロード状態に依存 | MINOR | fallback 仕様で吸収済み（TC-BAB-TAG-07）。追加対応不要 |
| M-3 | 表示名解決ロジックを共通ヘルパに抽出していない（1 箇所のみのため YAGNI 判断） | INFO | 他 component で同種需要発生時に抽出を検討 |

---

## 10.4 blocker 判定

- **blocker: なし。**
- apps/api 非接触・後方互換 optional prop・既存 testid/key 維持により、回帰リスクは最小。
- 残作業は実装サイクル（Gate-B）での実コード反映・TDD green・typecheck/lint・visual evidence（VISUAL_ON_EXECUTION）取得。これらは user-gated。
- 実装・commit・PR・GitHub issue 状態変更・staging authenticated visual baseline は本 spec のスコープ外（runtime_boundary に従い user-gated）。
