---
spec_classification: implementation_spec
state: implemented_local_evidence_captured
phase: 10
phase_name: 最終レビュー
task_id: issue-1192-admin-account-profile-dedicated-ux
---

# Phase 10: 最終レビュー

## メタ情報

| キー | 値 |
|------|----|
| task_id | `issue-1192-admin-account-profile-dedicated-ux` |
| 対象 | AC-1..AC-9 充足 ↔ 成果物対応の突合 / 4 条件再評価 / 認証境界非接触の diff レビュー / Phase 11 evidence 計画引き継ぎ |
| 方針 | 各 AC に対応成果物と検証方法を明示し、未達は BLOCKER / MINOR で分類する。implemented_local_evidence_captured 段階では判定欄は計画（pending） |

---

## 目的

AC-1〜AC-9 の充足を成果物との突合表で確認し、4 条件（矛盾なし・漏れなし・整合性あり・依存関係整合）を実装後の最終状態で再評価し、認証境界非接触を diff レビューで確定して Phase 11 / 13 への引き継ぎ条件を固める。

## AC 全件 ↔ 成果物 突合表

| AC | 条件（要約） | 対応成果物 | 検証方法 | 判定 |
|----|------------|-----------|---------|------|
| AC-1 | isAdmin=true で管理者案内カード表示（`data-testid="profile-admin-access-notice"`） | `page.tsx` 条件描画 + `AdminAccessNotice.tsx` / T-P1（page.spec.tsx） | focused Vitest（V-3）GREEN | PASS（local evidence） |
| AC-2 | カード内に `/admin` 導線（accessible name「管理画面を開く」・`href="/admin"`） | `AdminAccessNotice.tsx` の `ButtonLink` / T-C2（AdminAccessNotice.component.spec.tsx） | focused Vitest GREEN | PASS（local evidence） |
| AC-3 | isAdmin=false でカード非描画（query null） | `page.tsx` 三項演算子 null 側 / T-P2 | focused Vitest GREEN | PASS（local evidence） |
| AC-4 | degrade 分岐の表示不変（既存テスト全 PASS） | `page.tsx` の degrade 分岐非接触 / 既存 page.spec.tsx 全件 + T-P3 | Phase 9 回帰確認（V-3） | PASS（local evidence） |
| AC-5 | AdminAccessNotice は props なし・member データ非描画（不変条件 #11） | `AdminAccessNotice.tsx`（静的・props なし）/ T-C3（member データ非含有 assertion） | gate-(d) + focused Vitest GREEN | PASS（local evidence） |
| AC-6 | 新規認証判定ロジックなし（`me.user.isAdmin` 参照のみ） | `page.tsx` の差分（import 1 行 + 条件描画 1 行） | gate-(a) + 本 Phase §認証境界非接触 diff レビュー | PASS（local evidence） |
| AC-7 | 既存トークン / primitives 経由のみ・HEX なし・新規 CSS なし | `AdminAccessNotice.tsx`（SectionCard / ButtonLink 再利用） | V-4 verify:tokens + gate-(b) | PASS（local evidence） |
| AC-8 | `apps/api` / `packages/` / D1 / Form 差分ゼロ | 変更 4 ファイル（全て `apps/web/app/(member)/profile/` 配下） | V-5 `git diff --name-only -- apps/api packages` = 0 行 | PASS（local evidence） |
| AC-9 | typecheck / lint / focused Vitest 全 PASS | 変更 4 ファイル全体 | V-1 / V-2 / V-3 | PASS（local evidence） |

> 確定テスト 6 件との対応: T-C1（見出し+本文描画→AC-1 補助）/ T-C2（→AC-2）/ T-C3（→AC-5）/ T-P1（→AC-1）/ T-P2（→AC-3）/ T-P3（→AC-4 degrade guard）。AC-6/7/8/9 はコマンド・grep で機械検証（Phase 9）。

## 4 条件再評価（実装後の最終状態で再判定）

Phase 3 の一次結論（全 PASS・GO）を、実装後の実コードで再評価する。

| 条件 | 再評価の観点 | PASS 基準 | 判定 |
|------|------------|----------|------|
| 矛盾なし | 実装が分岐 (b)（member プロフィール維持 + 補助導線）の通りで、(a)/(c) 的な挙動（プロフィール隠蔽・redirect）を混入していない | ProfileHeader 以下の member 本体描画が isAdmin 値に依存せず不変 | PASS（local evidence） |
| 漏れなし | AC-1〜AC-9 の全行が突合表で成果物 + 検証方法に traced されている | 突合表に空欄行なし・全行判定済み | PASS（local evidence） |
| 整合性あり | 不変条件 #2（consent キー非接触）/ #3（新規 primitive なし）/ #5（D1 直接アクセスなし）/ #8（`*.spec.tsx`）/ #11（memberId 非露出）と矛盾しない | Phase 9 gate 全 PASS + 目視レビュー | PASS（local evidence） |
| 依存関係整合 | `/me` の `isAdmin`・`SectionCard`・`ButtonLink` が実装時点の dev HEAD でも提供されている（rebase 後の drift なし） | typecheck（V-1）で import / 型解決 exit 0 | PASS（local evidence） |

## 認証境界非接触の diff レビュー手順

AC-6 / R-3（認証判定の所有権を `apps/api` に維持・fail-closed 不変）を diff レベルで確定する。

| 手順 | コマンド / 観点 | PASS 基準 |
|------|----------------|----------|
| DR-1 | `git diff --name-only dev...HEAD` | 変更ファイルが Phase 2 確定の 4 件のみ（`apps/web/app/(member)/profile/` 配下に閉じる）。`middleware.ts` / `src/lib/env.ts` / `src/lib/api/` / `apps/api/` への差分 0 |
| DR-2 | `git diff dev...HEAD -- 'apps/web/app/(member)/profile/page.tsx'` を目視 | 追加が import 1 行 + `{me.user.isAdmin ? <AdminAccessNotice /> : null}` 1 行のみ。既存の認証エラーハンドリング（401 redirect / degrade 分岐）に変更なし |
| DR-3 | gate-(a)（Phase 9）の結果確認 | `isAdmin` の参照が「`/me` レスポンスの読み取り」のみで、cookie 解析・session 検証・role 解決の新規実装が 0 |
| DR-4 | `AdminAccessNotice.tsx` の目視 | fetch / hook / 環境変数アクセスが 0（純表示）。`getAuthEnv()` 等の env アクセサにも触れない |

> DR-1〜DR-4 のいずれかが FAIL の場合は BLOCKER（認証境界への意図しない接触）として Phase 5 へ差し戻す。

## blocker 判定基準

| 分類 | 条件 | 扱い |
|------|------|------|
| **BLOCKER** | AC-1〜AC-9 のいずれか FAIL / DR-1〜DR-4 のいずれか FAIL / 既存 page.spec.tsx に RED | PR 不可。Phase 5/8/9 へ差し戻し、本サイクル内で解消（CONST_007） |
| **MINOR** | AC は満たすが改善余地（文言の微調整・カード配置の好み等） | Phase 12 で current / out-of-scope / baseline non-issue に分類。current は同サイクルで修正。BLOCKER の格下げは禁止 |

## Phase 11（視覚証跡）/ Phase 13（PR）引き継ぎ条件

### Phase 11 へ引き継ぐ evidence 計画

| 引き継ぎ項目 | 内容 |
|-------------|------|
| tier1（一次証跡） | focused Vitest 6 件（T-C1〜T-C3 / T-P1〜T-P3）GREEN + V-1/V-2 exit 0。実装サイクルで取得 |
| ローカル静的 UI contract screenshot | `AdminAccessNotice` の視覚契約（Playwright Chromium・実装サイクルで取得可能）。`outputs/phase-11/screenshot-plan.json` の 3 枚計画に従う |
| tier2（二次証跡・user-gated） | staging `/profile` の管理者アカウント認証 runtime screenshot。Claude Code は staging 認証ログインしないため **user-gated pending** |
| 前提条件 | AC-9（V-1/V-2/V-3 全 GREEN）PASS 後に screenshot 取得へ進む。implemented_local_evidence_captured 段階では screenshot 全て pending（PNG 実体なし・`screenshots/.gitkeep` のみ） |

### Phase 13（PR）への引き継ぎ条件

- AC-1〜AC-9 が全て PASS（突合表の判定欄が埋まっている）。
- VISUAL タスクのため、Phase 11 のローカル screenshot が取得済みであること（staging runtime は user-gated のため PR blocker にしない。pending として PR 本文に明記）。
- BLOCKER 0 件。MINOR は Phase 12 で分類済み。
- PR は base=`dev`。実装・commit・PR はユーザー明示承認後のみ（workflow_state: implemented_local_evidence_captured の間は実行しない）。Issue #1192 は CLOSED のまま維持し、PR 本文から本ワークフローを参照する。

---

## 実行タスク（local 実装サイクルで実施済み）

1. AC 全件 ↔ 成果物 突合表の判定欄を Phase 9 の実結果で埋める。
2. 4 条件再評価を実装後の実コードで行い、全 PASS を確認する。
3. DR-1〜DR-4 の認証境界非接触 diff レビューを実施し、FAIL は BLOCKER として差し戻す。
4. MINOR 指摘を Phase 12 分類ルールへ申し送る（current は同サイクル修正）。
5. Phase 11 / 13 への引き継ぎ条件の充足を確認する。

## 参照資料

| 種別 | Path | 用途 |
|------|------|------|
| 要件 | `phase-1-requirements.md` | AC-1..AC-9・R-1..R-3 の正本 |
| 設計 | `phase-2-design.md` | 変更 4 ファイル・DOM 契約・責務境界 |
| 設計レビュー | `phase-3-design-review.md` | 4 条件の一次結論（再評価の基準） |
| QA | `phase-9-qa.md` | V-1..V-5 / gate-(a)..(d) の実結果 |
| 視覚証跡 | `phase-11-manual-test.md` | two-tier evidence 設計（引き継ぎ先） |

## 成果物

- `phase-10-final-review.md`（AC ↔ 成果物 突合表 / 4 条件再評価 / 認証境界 diff レビュー手順 DR-1..DR-4 / Phase 11・13 引き継ぎ条件）

## 統合テスト連携

本タスクは apps/web 表現層への極小追加であり、統合観点の検証は focused Vitest と Phase 11 の視覚証跡計画で行う。apps/api との統合 contract は変更しない（DR-1 / V-5 で機械保証）。AC trace は Phase 1 → 4 → 5/6 → 9 → 10 → 11 の順に連結する。

## 完了条件

- [ ] AC-1..AC-9 の突合表が成果物・検証方法付きで定義されている（本書・済）。
- [ ] 4 条件再評価の観点と PASS 基準が定義されている（本書・済）。
- [ ] （実装サイクル）突合表・4 条件・DR-1..DR-4 が全 PASS、BLOCKER 0 件。
- [ ] （実装サイクル）Phase 11 / 13 への引き継ぎ条件を満たす（tier2 staging runtime は user-gated pending のままで可）。
