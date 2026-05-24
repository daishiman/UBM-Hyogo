---
phase: 3
title: タスク分解 — SRP に沿った最小単位への分解
workflow_id: ui-prototype-design-system-foundation
sub_workflow: serial-06-form-response-binding
status: spec_created
taskType: implementation
visualEvidence: VISUAL
implementation_mode: integration
---

# Phase 3 — タスク分解

[実装区分: 実装仕様書]

## 1. 分解原則

Clean Code SRP（Single Responsibility Principle）に沿い、1 ファイル 1 責務で分解する。adapter / primitive / route / fixture / test の 5 系統に分離する。各タスクは Phase 5 の実装ガイドに対応する。

## 2. タスク一覧（CONST_005 必須項目: 変更対象 / 種別 / シグネチャ / I/O / テスト / DoD）

| ID | タスク | 変更対象ファイル（絶対パス） | 種別 | 主要シグネチャ / I/O | 所要 | 依存 |
|----|-------|---------------------------|------|---------------------|-----|------|
| T-01 | adapter 実装（pure function, visibility filter, unknown kind 防御） | `/apps/web/src/lib/adapters/member-detail.ts` | 新規 | `toMemberDetailProps(profile: PublicMemberProfile): MemberDetailProps` / I/O 無し / 副作用無し | M | — |
| T-02 | adapter unit spec | `/apps/web/src/lib/adapters/__tests__/member-detail.spec.ts` | 新規 | vitest `describe/it`, 6 ケース（Phase 6 §2.1） | M | T-01, T-03 |
| T-03 | fixture（代表 Member 1 件、6 sections × visibility 混在） | `/apps/web/src/fixtures/public-member-profile.ts` | 新規 | `export const samplePublicMemberProfile: PublicMemberProfile` | S | — |
| T-04 | MemberDetail primitive 新規 or 編集 | `/apps/web/src/components/public/MemberDetail.tsx` | 新規 or 編集 | `function MemberDetail(props: MemberDetailProps): JSX.Element` | M | T-01 |
| T-05 | page.tsx fetch + adapter + notFound 配線 | `/apps/web/app/(public)/members/[id]/page.tsx` | 編集 | `default async function MemberDetailPage({ params }: PageProps)` / `fetch` / `notFound()` 分岐 | M | T-01, T-04 |
| T-06 | Playwright visual spec + visibility filter assertion | `/apps/web/playwright/tests/serial-06-member-detail.spec.ts` | 新規 | Playwright `test(...)` × 1 case（chromium）+ screenshot file capture | M | T-03, T-05 |
| T-07 | （T-06 と同梱）visibility filter DOM assertion（`response_email` / `public_consent` が DOM に無い） | T-06 と同一ファイル | 編集 | `await expect(page.locator('[data-stable-key="response_email"]')).toHaveCount(0)` | S | T-06 |
| T-08 | Phase 11 evidence 集約（snapshot / spec output / typecheck / lint / verify-pr-ready） | `/docs/30-workflows/ui-prototype-design-system-foundation/serial-06-form-response-binding/outputs/phase-11/` | 新規 | Phase 11 §1 表に従い 7 ファイル配置 | S | T-06 |

サイズ目安: S = 30 行未満 / M = 30〜150 行 / L = 150 行以上

## 3. 依存グラフ

```
T-03 (fixture) ──┐
T-01 (adapter) ──┴─► T-02 (adapter spec)
              │
              └────► T-04 (MemberDetail) ──► T-05 (page.tsx) ──► T-06 (Playwright) ──► T-07
                                                                                  └─► T-08
```

## 4. 並列実行ポリシー

- T-01 と T-03 は同時着手可（依存なし）
- T-02 は T-01 / T-03 完了後に着手
- T-04 は T-01 完了後に着手可
- T-05 は T-01 + T-04 完了後
- T-06 / T-07 は T-03 + T-05 完了後
- T-08 は T-06 完了後

## 5. 単一責務原則チェック

| ファイル | 単一責務 | 含めない |
|---------|---------|---------|
| `adapters/member-detail.ts` | API response → primitive props 整形 + visibility filter + unknown kind 防御 | fetch / I/O / Date.now / cookie / headers 参照 |
| `fixtures/public-member-profile.ts` | 代表 case の data 提供 | logic / runtime 分岐 |
| `MemberDetail.tsx` | composition layer（4 primitive 組み立て） | fetch / adapter 呼び出し / state |
| `page.tsx` | URL params parse / fetch / schema parse / adapter 呼び出し / notFound 分岐 | JSX 組み立て（primitive に委譲） |
| `member-detail.spec.ts` | adapter の純粋関数挙動検証 | E2E / DOM / Playwright |
| `public-member-detail.spec.ts`（Playwright） | 描画と visibility filter assertion | adapter ロジック検証 |

## 6. 完了条件

- 全 8 タスクが done
- adapter spec が 6 ケース green（`mise exec -- pnpm --filter @ubm-hyogo/web test -- adapters/__tests__/member-detail`）
- Playwright spec が chromium 1 case green
- Phase 11 evidence 7 ファイルが揃う
- Phase 7 ゲート G-01〜G-10 全 green

## 7. 参照

- Phase 2 アーキテクチャ図
- Phase 4 契約
- Phase 5 実装ガイド
- Phase 7 品質ゲート
- `apps/web/src/components/public/` 既存 primitive 群
