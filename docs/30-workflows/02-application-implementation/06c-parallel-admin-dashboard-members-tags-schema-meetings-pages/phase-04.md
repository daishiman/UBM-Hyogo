# Phase 4: テスト戦略

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 06c-parallel-admin-dashboard-members-tags-schema-meetings-pages |
| Phase 番号 | 4 / 13 |
| Phase 名称 | テスト戦略 |
| Wave | 6 (parallel) |
| 作成日 | 2026-04-26 |
| 前 Phase | 3 (設計レビュー) |
| 次 Phase | 5 (実装ランブック) |
| 状態 | pending |

## 目的

unit / contract / E2E / authorization の 4 層 verify suite を設計し、AC 10 件 と 不変条件 7 件を test で担保できるようにする。実装 (Phase 5) に先行して assertion を確定する。

## 実行タスク

1. unit test 対象 component の列挙（完了条件: vitest test 計画）
2. contract test の対象 endpoint の列挙（完了条件: zod parse / status / payload 表）
3. Playwright E2E のシナリオ（完了条件: 09-ui-ux.md 検証マトリクスの admin 行）
4. authorization test 設計（完了条件: 401/403 ケース表）
5. ESLint test（D1 直接 import 検出）の設計

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | doc/00-getting-started-manual/specs/09-ui-ux.md | Playwright 検証マトリクス |
| 必須 | outputs/phase-02/admin-pages-design.md | component / data flow |
| 必須 | outputs/phase-01/main.md | AC quantitative |

## 実行手順

### ステップ 1: unit test
- `MemberDrawer.test.tsx`: profile 本文 input が render されないこと、tag 編集 form が無いこと
- `TagQueuePanel.test.tsx`: queue empty 時の文言、resolve POST 後の queue removal
- `SchemaDiffPanel.test.tsx`: unresolved を最上位で render
- `MeetingPanel.test.tsx`: attendance Combobox が isDeleted=true を除外

### ステップ 2: contract test
- 04c の各 endpoint を 08a で zod parse、本タスクは contract assertion を Phase 5 実装に組み込む
- response shape を `packages/shared/types/admin.ts` の view model と一致確認

### ステップ 3: E2E
- Playwright で desktop (1280) / mobile (375) 両方
- シナリオ: admin login → dashboard → members 一覧 → drawer 公開切替 → tag queue resolve → schema alias 割当 → meeting attendance 追加

### ステップ 4: authorization
- 未認証で `/admin/*` → `/login?next=...` redirect
- 非 admin user で `/admin/*` → `/login` または forbidden 表示
- session expired での再 fetch → 401 → 再 login

### ステップ 5: ESLint
- `no-restricted-imports` で D1 / wrangler / repository を ban
- `pnpm lint` で error が出ることを test

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 5 | test 計画を実装ランブックの assertion に転記 |
| Phase 7 | AC × 検証手段の対応を AC マトリクスへ |
| Phase 8a | contract / repo / authz test を 08a が網羅 |
| Phase 8b | Playwright E2E を 08b が実装 |

## 多角的チェック観点

| 不変条件 | test 観点 | 検証方法 |
| --- | --- | --- |
| #4 | profile 本文 input が UI に出ない | unit test (snapshot + queryByRole) |
| #5 | apps/web から D1 import が検出される | ESLint test |
| #11 | 管理者 UI で本文編集できない | unit test + E2E |
| #12 | admin_member_notes が public/member view へ漏れない | contract test (response schema) |
| #13 | tag は queue resolve 経由のみ | E2E + unit (drawer に tag form がない) |
| #14 | schema 操作が `/admin/schema` のみ | E2E (ナビ確認) |
| #15 | attendance Combobox の filter | unit test |
| 認可境界 | 401/403 redirect | E2E + contract test |
| 無料枠 | dashboard fetch 数 = 1 | network tab 確認（manual） |
| a11y | Drawer に role="dialog" | axe-core unit |

## verify suite 設計

| layer | tool | scope | 担当 wave |
| --- | --- | --- | --- |
| unit | vitest + RTL | component 単位 | 06c (本タスクで定義) / 08a (実行) |
| contract | vitest + zod | endpoint response shape | 08a |
| E2E | Playwright | 5 画面シナリオ × desktop/mobile | 08b |
| authz | Playwright + contract | 401/403 boundary | 08a / 08b |
| lint | ESLint | D1 直 import 禁止 | 08a |
| a11y | @axe-core/playwright | Drawer / Modal の WAI-ARIA | 08b |

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | unit test 計画 | 4 | pending | 各 component |
| 2 | contract test 対象列挙 | 4 | pending | 16 endpoints |
| 3 | E2E シナリオ | 4 | pending | 5 画面 |
| 4 | authorization 表 | 4 | pending | 401/403 |
| 5 | ESLint rule test | 4 | pending | no-restricted-imports |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-04/main.md | サマリー |
| ドキュメント | outputs/phase-04/admin-test-strategy.md | 4 層 verify suite 詳細 |
| メタ | artifacts.json | Phase 4 を completed |

## 完了条件

- [ ] unit / contract / E2E / authz / lint / a11y の 6 layer が表で確定
- [ ] 各 AC に対応する test ID が決まる
- [ ] 08a / 08b に handoff する test 一覧が抽出
- [ ] 不変条件 7 件すべてに test 観点が紐付く

## タスク100%実行確認

- 全成果物が outputs/phase-04 配下に配置
- AC 10 件すべてに verify 手段が紐付く
- artifacts.json で phase 4 を completed

## 次 Phase

- 次: 5 (実装ランブック)
- 引き継ぎ: test 計画を実装の assertion 文言に
- ブロック条件: AC × test の対応漏れがあれば差し戻し
