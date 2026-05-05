[実装区分: 実装仕様書]

# Phase 1: 要件定義 — ut-web-cov-01-admin-components-coverage

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | ut-web-cov-01-admin-components-coverage |
| phase | 1 / 13 |
| wave | ut-coverage |
| mode | parallel |
| 作成日 | 2026-05-01 (regenerated 2026-05-03) |
| taskType | implementation |
| visualEvidence | NON_VISUAL |

## 目的

`apps/web/src/components/admin/*` および `apps/web/src/components/layout/AdminSidebar.tsx` の Vitest unit coverage を、本サイクル内で **Stmts/Lines/Funcs ≥85% / Branches ≥80%** まで引き上げるためのテスト追加スコープ・対象 component 一覧・成功条件を確定する。本 Phase で「テストのみ追加（本体改修なし）」というスコープ確定を行う。

## 実行タスク

1. 起票時 baseline coverage と対象 component 一覧を確定する。完了条件: 対象 7 component と現行 coverage 値が記録される。
2. 本サイクルで追加すべき test ケース粒度（happy/authz-fail/empty/mutation/error/edge）を確認する。完了条件: Phase 5 で着手する追加 it ケース名が概念レベルで列挙される。
3. user approval / 上流 gate を分離する。完了条件: D1 直叩きや deploy を行わないことが明記される。

## 参照資料

- 起票根拠: 2026-05-01 実測 apps/web coverage (lines=39.39%, branches=68.01%, functions=43.51%, statements=39.39%)
- 対象 component baseline:
  - `MembersClient.tsx` 0% (4 既存 it)
  - `TagQueuePanel.tsx` 0% (8 既存 it)
  - `AdminSidebar.tsx` 0% (3 既存 it)
  - `SchemaDiffPanel.tsx` L=58.62 / B=38.46 / F=16.66 (6 既存 it)
  - `MemberDrawer.tsx` L=63.68 / B=50 / F=9.09 (12 既存 it)
  - `MeetingPanel.tsx` L=66.44 / B=80 / F=33.33 (14 既存 it)
  - `AuditLogPanel.tsx` L=98.5 / B=74.19 / F=100 (30+ 既存 it)
- vitest config: `vitest.config.ts` (jsdom, globals=false, testTimeout=30s, v8 provider, coverage threshold 未設定 → CI gate で担保)
- docs/00-getting-started-manual/specs/02-auth.md（admin authz boundary の根拠）
- CLAUDE.md 不変条件 #5 / #6

## 実行手順

- 対象 directory: `docs/30-workflows/ut-web-cov-01-admin-components-coverage/`
- 本仕様書では本体コード変更・deploy・commit・push・PR を行わない。
- 実装は Phase 5 runbook、実測 evidence は Phase 11 に従う。
- 検証コマンドは `pnpm --filter @ubm-hyogo/web test:coverage` のみ。

## 統合テスト連携

- 上流: `06c-A-admin-dashboard`, `06c-B-admin-members`, `06c-C-admin-tags`, `06c-D-admin-schema`, `06c-E-admin-meetings`
- 下流: `09b-A-observability-sentry-slack-runtime-smoke`

## 多角的チェック観点

- #5 public/member/admin boundary を mock 越境のみで検証
- #6 `apps/web` から D1 直接アクセス禁止 → fetch / `lib/admin/api` mock のみ使用
- snapshot 不使用、明示 assertion
- 既存 web test に regression なし

## サブタスク管理

- [x] 対象 component と baseline coverage 確定
- [x] 追加 it ケース粒度の概念列挙
- [x] approval gate（D1 直叩き / deploy）分離
- [ ] outputs/phase-01/main.md を作成する

## 成果物

- outputs/phase-01/main.md
- 本仕様書（phase-01.md）

## 完了条件 (DoD)

- 対象 7 component すべて Stmts/Lines/Funcs ≥85% / Branches ≥80%
- 各 component に happy / authz-fail / empty / mutation の最低 4 ケース
- snapshot ではなく明示 assertion
- 既存 web test に regression なし
- `pnpm --filter @ubm-hyogo/web test:coverage` PASS

## タスク100%実行確認

- [ ] 本 Phase 必須セクションがすべて埋まっている
- [ ] 本体改修ではなく test 追加 follow-up gate になっている
- [ ] 実装/deploy/commit/push/PR を実行していない

## 次 Phase への引き渡し

Phase 2 へ、対象 component 一覧 / baseline coverage / 追加 it ケース粒度 / mock 方針候補（next/navigation, lib/admin/api, fetch stub）を渡す。
