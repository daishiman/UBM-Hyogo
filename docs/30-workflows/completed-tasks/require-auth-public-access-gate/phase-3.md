# Phase 3: 設計レビュー（設計書）

## メタ情報

| 項目 | 値 |
|------|-----|
| Phase | 3 / 13 |
| 名称 | 設計レビュー |
| 判定 | **PASS（条件付き）** — MINOR 2 件を追跡し Phase 4 へ進む |
| gate | 本 Phase PASS まで Phase 4（実装相当）へ進まない |

## 目的

Phase 1-2 の設計が Phase 4 以降の実装へ進められるかを判定し、PASS/MINOR/MAJOR と戻り先を明示する。

## 実行タスク

1. レビュー観点ごとに PASS/MINOR/MAJOR を判定する（第 1 節）。
2. MINOR を追跡テーブルに記録し解決予定 Phase を決める（第 2 節）。
3. simpler alternative を比較し採否理由を記録する（第 3 節）。
4. リスクと対策を表で固定する（第 4 節）。
5. Phase 4 開始条件・Phase 13 blocked 条件を明示する（第 5 節）。

## 参照資料

| 参照資料 | パス | 内容 |
|---------|------|------|
| 要件定義 | `docs/30-workflows/completed-tasks/require-auth-public-access-gate/phase-1.md` | AC-1〜AC-13・命名規則 |
| 設計 | `docs/30-workflows/completed-tasks/require-auth-public-access-gate/phase-2.md` | topology・シグネチャ・doc 更新方針 |
| レビュー gate 基準 | `.claude/skills/task-specification-creator/references/review-gate-criteria.md` | PASS/MINOR/MAJOR 判定基準 |

## 1. レビュー結果サマリー

| 観点 | 判定 | 備考 |
|------|------|------|
| 主問題の固定 | PASS | 「認証境界が公開層に開いている」を 1 文で固定（Phase 1） |
| AC の検証可能性 | PASS | AC-1〜AC-13 が全て観測可能（描画分岐・HTTP status・header 有無） |
| 責務境界・state 所有権 | PASS | C1=web 認証境界 / C2=api 境界 + 消費者。混在なし |
| サーバー間互換 | PASS | sitemap/OG を内部認証で吸収。リグレッション回避設計あり |
| 不変条件整合 | PASS | D1 直接アクセス禁止 / env アクセサ / OKLch トークン / `*.spec` を遵守 |
| simpler alternative | 検討済（下記 §3） | middleware redirect 案を比較し、ユーザー選択（案内画面）を採用 |

## 2. MINOR 追跡テーブル

| MINOR ID | 指摘内容 | 解決予定Phase | 解決確認Phase |
|----------|---------|---------------|---------------|
| M-1 | C2 の会員セッション JWT 検証ロジックが `require-admin.ts` / `session-guard.ts` と重複し得る。共通ヘルパー抽出を検討 | Phase 8（リファクタリング） | Phase 9 |
| M-2 | `INTERNAL_AUTH_SECRET` 未設定の local/test での API ゲート挙動を明示する必要がある（session 経路は通る・内部経路は 401） | Phase 4（テスト） | Phase 7 |

## 3. simpler alternative 検討

| 案 | 内容 | 採否 | 理由 |
|----|------|------|------|
| A: middleware redirect | `(public)` ルートを middleware で `/login` へ 302 | **不採用** | ユーザーは「案内メッセージ表示」を明示選択（リダイレクトしない） |
| B: layout 案内画面（採用） | `(public)/layout.tsx` で session 検証し notice 描画 | **採用** | ユーザー選択に合致。RSC データ取得も同時に遮断できる（AC-5） |
| C: API ゲートを全 session 必須 | 内部認証バイパス無し | **不採用** | sitemap / OG ワーカーが破綻（RC-3）。多層防御が成立しない |
| D: API ゲートせず UI のみ | C1 のみ実装 | **不採用** | `/public/*` 直叩きで情報取得可能。ユーザー要望（情報管理）を満たさない |

## 4. リスクと対策

| リスク | 対策 | 確認Phase |
|--------|------|----------|
| C2 の web fetch 変更と API ゲートが非同期になると認証済みユーザーが 401 | Phase 5 で同一 wave 実装。Phase 6 で認証済み regression テスト | Phase 5/6 |
| `getSession()` throw 時に 500 になる | fail-closed（catch → notice 表示） | Phase 4/5 |
| OG ワーカーの env binding（`INTERNAL_AUTH_SECRET`）追加漏れ | Phase 2 §3.4 で型追加を明記・Phase 4 で header spec | Phase 4 |
| spec doc 更新漏れ（正本不整合） | AC-11 + Phase 12 Step 2 で 4 ファイル更新を必須化 | Phase 12 |

## 5. Phase 4 開始条件 / Phase 13 blocked 条件

- **Phase 4 開始条件**: 本 Phase PASS（MINOR は追跡）。AC-1〜AC-13 と命名規則が確定済み。
- **Phase 13 blocked 条件**: commit / PR / push はユーザー明示承認まで実行しない（CONST_002）。本 workflow ではコード実装も行わず、仕様書作成に留める（CONST_006）。

## 統合テスト連携

- Phase 4 で C1（web）/ C2（api・og・sitemap）の Red テストを設計する。
- 既存 `/profile`・`/admin/*` ゲートテストの GREEN 維持を回帰条件に含める。

## 多角的チェック観点（AIが判断）

- 因果ループ（バランス）: 認証ゲート強化 → サーバー間消費者破綻 → 内部認証付与で復元（バランスループ）。
- 因果ループ（強化）: UI gate + API gate 同時導入 → 多層防御 → 「情報管理ができる」価値の確立（強化ループ）。

## サブタスク管理

- [ ] PASS/MINOR/MAJOR 判定
- [ ] simpler alternative 記録
- [ ] Phase 4 gate 確定

## 成果物

| 成果物 | 配置 |
|--------|------|
| 設計レビュー（本書） | `docs/30-workflows/completed-tasks/require-auth-public-access-gate/phase-3.md` |

## 完了条件

- [ ] PASS 判定と戻り先が明示されている
- [ ] MINOR が追跡テーブルに記録されている
- [ ] simpler alternative の採否が記録されている

## タスク100%実行確認【必須】

- [ ] レビュー判定・MINOR・代替案・gate を記述した

## 次Phase

[phase-4.md](phase-4.md) — テスト作成（TDD Red）
