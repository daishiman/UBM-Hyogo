# Phase 3: 設計レビュー

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 06c-parallel-admin-dashboard-members-tags-schema-meetings-pages |
| Phase 番号 | 3 / 13 |
| Phase 名称 | 設計レビュー |
| Wave | 6 (parallel) |
| 作成日 | 2026-04-26 |
| 前 Phase | 2 (設計) |
| 次 Phase | 4 (テスト戦略) |
| 状態 | pending |

## 目的

Phase 2 で固めた構成に対して alternative 3 案を比較し、PASS / MINOR / MAJOR 判定で確定する。本人本文編集禁止と queue / schema 集約の不変条件を破る方向の代替案を排除する。

## 実行タスク

1. alternative 3 案を起こす（完了条件: 案ごとに pros / cons / 不変条件影響）
2. 各案を PASS / MINOR / MAJOR で判定（完了条件: 採否と理由）
3. blocker と open question を Phase 4 へ handoff（完了条件: handoff 表）

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-02/admin-pages-design.md | レビュー対象 |
| 必須 | doc/00-getting-started-manual/specs/11-admin-management.md | 不変条件根拠 |
| 必須 | doc/00-getting-started-manual/specs/12-search-tags.md | tag queue 仕様 |

## 実行手順

### ステップ 1: alternative 起こし
- 案 A: middleware.ts による admin gate（layout.tsx ではなく Edge middleware）
- 案 B: ドロワー内タグ直接編集を許可（不変条件 #13 違反、検証目的で出す）
- 案 C: 全画面 Client Component + SWR、Server Component を使わない

### ステップ 2: 評価
- 案 A: middleware は Edge runtime 制約で Auth.js v5 の session 取得が複雑 → MINOR
- 案 B: 不変条件 #13 違反、tag queue の audit 経路が破綻 → MAJOR、不採用
- 案 C: 一覧の hydration cost が無料枠を圧迫 → MINOR、不採用

### ステップ 3: 確定
- 採用: Phase 2 案（layout.tsx 内 admin gate + Server/Client 混在）
- 理由: 不変条件 #5, #11, #13, #14 を最も自然に守れる

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 4 | レビュー結果を test 戦略の前提に |
| Phase 7 | AC マトリクスの「設計選択の根拠」列に転記 |
| Phase 10 | gate 判定の根拠 |

## 多角的チェック観点

| 不変条件 | チェック | 理由 |
| --- | --- | --- |
| #11 | 案 B のような「ドロワーで本文編集」を絶対採用しない | 本人本文の管理者編集禁止 |
| #13 | 案 B のような「ドロワーでタグ編集」を絶対採用しない | tag は queue 経由 |
| #14 | schema 解消 UI を `/admin/members` に分散しない | 集約の原則 |
| 認可境界 | admin gate の配置（middleware vs layout）の trade-off を記録 | runtime コスト判断 |
| 無料枠 | Server vs Client Component の hydration cost 比較 | Workers 100k 内 |

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | alternative 3 案 | 3 | pending | A / B / C |
| 2 | PASS-MINOR-MAJOR 判定 | 3 | pending | 採否と理由 |
| 3 | handoff 表 | 3 | pending | Phase 4 入力 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-03/main.md | alternative 比較表 + 判定 |
| メタ | artifacts.json | Phase 3 を completed |

## 完了条件

- [ ] alternative 3 案が pros / cons 付きで列挙
- [ ] 各案に PASS / MINOR / MAJOR 判定
- [ ] 不変条件違反案（B）が MAJOR で不採用
- [ ] handoff 表が Phase 4 へ渡せる状態

## タスク100%実行確認

- 全 alternative が記載
- 採用案が確定
- 不変条件違反案の理由が明記
- artifacts.json で phase 3 を completed

## 次 Phase

- 次: 4 (テスト戦略)
- 引き継ぎ: 採用設計を test 戦略の前提に
- ブロック条件: alternative 評価が未完了なら次へ進めない

## Alternative 3 案

### 案 A: middleware.ts による admin gate
- pros: page navigation 前に弾ける、Server Component 側で session 取得不要
- cons: Edge runtime で Auth.js v5 の session decode が複雑、worker bundle size 増加
- 不変条件影響: なし
- 判定: **MINOR**（不採用、layout.tsx で十分）

### 案 B: ドロワー内タグ・本文直接編集を許可
- pros: 操作が 1 画面で完結、admin の手数が減る
- cons: 不変条件 #11, #13 を破る、tag queue の audit が抜ける
- 不変条件影響: #11, #13 違反
- 判定: **MAJOR**（不採用）

### 案 C: 全 Client Component + SWR
- pros: SPA 的な体感、ページ遷移が高速
- cons: 一覧の hydration cost、SEO は不要だが初回 fetch コストが高い
- 不変条件影響: なし（無料枠制約に近接）
- 判定: **MINOR**（不採用）

### 採用案: Phase 2 案（layout.tsx 内 admin gate + Server/Client 混在）
- 不変条件 #5, #11, #13, #14 を最も自然に守れる
- 一覧と dashboard は Server Component、ドロワー / queue / panel は Client Component で SWR

## Handoff to Phase 4

| 項目 | 内容 |
| --- | --- |
| 採用設計 | layout.tsx admin gate + Server/Client 混在 |
| 確定 component 一覧 | AdminSidebar / MemberDrawer / TagQueuePanel / SchemaDiffPanel / MeetingPanel |
| open question | dashboard の auto-refresh 周期（Phase 4 で決定） |
| blocker | なし（上流 04c, 05a, 05b の AC が満たされていれば） |
