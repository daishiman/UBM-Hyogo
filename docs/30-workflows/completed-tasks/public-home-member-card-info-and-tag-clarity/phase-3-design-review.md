# Phase 3: 設計レビュー（ゲート）

- Phase 目的: Phase 4 へ進めるかを判定する。
- 入力: Phase 1（AC）、Phase 2（設計）。
- 出力: GO / NO-GO 判定と MINOR 指摘。

## 3.1 要件レビュー思考法（システム / 戦略・価値 / 問題解決）

### 真の論点
- 主問題: 「カードを見ても **何をやっているか分からない**」＝情報の**質**（事業内容）が出ておらず、出ている情報（地域タグ・表記ゆれ）が**ノイズ**になっている。
- `what`: 事業フェーズ + 業種/スキル + 事業概要をカードに、地域は落とす。
- `how`: 既存資産（expand=tags / businessOverview / Chip / tokens）を**接続・表現**するだけ。新規生成は純関数 util 1 つ。
- `why now`: staging 公開済みでユーザーが実利用上「分からない」と報告。
- `why this way`: API/D1/Form を触らず web 表現層 + list projection に閉じれば回帰リスク最小（mvp-recovery 不変条件と整合）。

### 因果・境界
- 強化ループ: curated タグ表示 → 「何をやっているか」即把握 → 一覧スキャン効率↑。
- バランスループ: タグ件数を density で制限・region 除外・business summary 120 字 cap → 情報過多を抑制（「見たくない」を回避）。
- 状態所有権: 表示選抜ロジックは `tag-display.ts`（純関数 UI util）に集約。データ projection は API use-case。色は `tones.ts`。責務が混在しない。

### 価値とコスト
- 初回価値: 公開カードで事業内容が一目で分かる。コスト最大部品 = businessSummary projection（payload 増）だが 120 字 cap で抑制。
- 将来層分離: タグ master 再設計・ubmZone 表記は本タスクに混ぜない。

### 4 条件評価
| 条件 | 評価 |
| --- | --- |
| 価値性 | ◎ 公開閲覧者の「何をやっている人か分からない」コストを直接低減 |
| 実現性 | ◎ 純関数 util + 既存 endpoint 拡張で 1 サイクル完結 |
| 整合性 | ◎ 責務境界・依存順序（zod 先行）が閉じている。API surface 不変 |
| 運用性 | ◎ verify:tokens / phase12-compliance / gate-metadata で回帰検知。staging 視覚証跡で確認 |

## 3.2 不変条件チェック

| 不変条件 | 適合 |
| --- | --- |
| #1 既存 API のみ接続（mvp-recovery） | ✅ 新 endpoint なし。businessSummary は既存 endpoint の projection 追加（surface 不変）/ expand=tags 既存 |
| #5 D1 直接アクセスは apps/api に閉じる | ✅ web は API 経由のみ |
| #8 test は `*.spec.{ts,tsx}` | ✅ |
| OKLch トークン正本・HEX 禁止 | ✅ AC-8 / verify:tokens gate |
| 新規 primitive を生やさない（#3） | ✅ Chip/tones 流用・util のみ新規 |

## 3.3 MINOR 指摘（Phase 4 以降で吸収・未タスク化不要）

- M-1: `app/(public)/page.tsx` が `listMembers` か `listMembersRaw` かを実装時に実確認（Phase 5 で grep）。`listMembersRaw` 経由なら query 文字列側で `expand=tags` を含める。
- M-2: businessOverview の visibility=public を field schema で実確認（Phase 5 前提チェック）。非 public 判明時は projection 分岐を入れる（設計済み）。
- M-3: `selectCardTags` の business/skill 並びは code 昇順。将来「件数順」希望が出たら topTags 集計を使うが本タスクでは YAGNI。

→ いずれも本サイクル内で解消可能。スコープ外送りなし。

## 3.4 判定

**GO**（Phase 4 へ進行）。設計は AC-1..AC-9 を満たし、責務境界・依存順序・回帰リスクが閉じている。

## Canonical Compliance Addendum

## メタ情報

- task_id: `public-home-member-card-info-and-tag-clarity`
- taskType: `implementation`
- visualEvidence: `VISUAL`
- workflow_state: `implemented_local_evidence_captured`

## 目的

本 Phase の上部本文を正本とし、AC-1..AC-9 を実コード・テスト・証跡へ接続する。

## 実行タスク

- [x] Phase 本文の該当タスクを完了
- [x] 実装対象・検証対象を AC trace に接続
- [x] Phase 12 / artifacts の状態語彙と整合

## 参照資料

- `index.md`
- `artifacts.json`
- `outputs/phase-12/phase12-task-spec-compliance-check.md`
- `docs/00-getting-started-manual/specs/01-api-schema.md`

## 成果物/実行手順

本ファイル本文の手順と `artifacts.json.metadata.verify_commands` を正本とする。実装済み成果物は `apps/web` / `apps/api` / `packages/shared` と Phase 11 / 12 outputs に反映済み。

## 完了条件

- [x] AC trace が維持されている
- [x] focused tests が PASS している
- [x] Phase 11 local visual evidence が存在する
- [x] Phase 12 strict 7 が存在する

## 統合テスト連携

focused Vitest 6 files / 50 tests PASS を主証跡とし、typecheck / lint / verify:tokens / verify:phase12-compliance / gate-metadata を全体 gate とする。

