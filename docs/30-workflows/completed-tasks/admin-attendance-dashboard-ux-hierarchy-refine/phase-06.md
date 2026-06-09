# Phase 6: テスト拡充（fail path / 回帰 guard）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | admin-attendance-dashboard-ux-hierarchy-refine |
| Phase 番号 | 6 / 13 |
| Phase 名称 | テスト拡充（fail path / 回帰 guard） |
| 実行種別 | serial |
| 作成日 | 2026-06-08 |
| 担当 | web (apps/web 表現層) |
| タスク種別 | implementation（VISUAL / コード変更を伴う） |
| 上流 | Phase 5（実装・TC-XX Green 化） |
| 下流 | Phase 7（統合テスト） |
| 状態 | spec_created |

## 目的

Phase 4 の正常系 Red を Phase 5 で Green 化した後、**異常系・境界値（fail path）テスト（TC-E-XX）**を追加して堅牢性を担保する。具体的には (a) overview error 時の PRIMARY degrade、(b) 欠席者 0 件の EmptyState、(c) 全 SafeResult error 時の全ゾーン degrade、(d) Segmented 初期タブ、(e) 欠席者数境界（0/1/多数）でのトーン切替、(f) フィルタ変更後の再 fetch 挙動不変、をカバーする。さらに **回帰 guard** として `verify-design-tokens`（HEX 0 件）と playwright visual smoke の位置づけを確定する。本 Phase はテスト拡充の設計（TC-E-XX 一覧 + 回帰 guard の位置づけ）を文書化する。

## 実行タスク

1. **拡充方針の文書化**: `outputs/phase-06/main.md` に Phase 4 Red → Phase 5 Green 後の拡充方針を書く。正常系（Phase 4）と異常系（Phase 6）の責務分担を明示する。
2. **fail path / 境界値 TC-E-XX の作成**: `outputs/phase-06/failure-cases.md` に異常系・境界値ケースを採番し、対象 / 操作 / 期待値 / 配置 spec を書く。
3. **回帰 guard の位置づけ**: `verify-design-tokens`（HEX 0 件 = AC-5）と playwright visual smoke（3 層レイアウトの認証済み admin 画面）を回帰 guard として位置づける。
4. **境界値網羅の確認**: 欠席者数（0 / 1 / 多数）、SafeResult（全 ok / 部分 error / 全 error）、Segmented 初期タブの組合せを網羅する。

## 参照資料

### タスク内部資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-04/test-plan.md | 正常系 TC-XX（fail path との責務分担） |
| 必須 | outputs/phase-05/runbook.md | degrade 分岐 / `data-attendance-follow` / 検証コマンド |
| 必須 | outputs/phase-02/layout-blueprint.md | `data-attendance-follow` トーンマッピング |
| 必須 | _shared-context.md | AC-4 / AC-5 / AC-10 / 回帰 guard（verify-design-tokens / playwright） |

### システム仕様（aiworkflow-requirements）

| 参照資料 | パス | 用途 |
| --- | --- | --- |
| テスト コンポーネントパターン詳細 | `.claude/skills/aiworkflow-requirements/references/testing-component-patterns-details.md` | fail path / 境界値の component spec 書式 |
| アクセシビリティテスト | `.claude/skills/aiworkflow-requirements/references/testing-accessibility.md` | degrade 時の a11y / 見出し階層維持 |
| Playwright E2E | `.claude/skills/aiworkflow-requirements/references/testing-playwright-e2e.md` | visual smoke の位置づけ |
| UI/UX admin dashboard | `.claude/skills/aiworkflow-requirements/references/ui-ux-admin-dashboard.md` | EmptyState / degrade の UX 妥当性 |

## 実行手順

### ステップ 1: 拡充方針概要（main.md）

- 正常系（Phase 4）= 描画 / 排他 / トーン。異常系（Phase 6）= error degrade / EmptyState / 境界値。責務分担を明記。

### ステップ 2: TC-E-XX 採番（failure-cases.md）

- (a)〜(f) の異常系・境界値を TC-E-01 以降で採番し、対象 / 操作 / 期待値 / 配置 spec を書く。

### ステップ 3: 回帰 guard の位置づけ

- `verify-design-tokens`（CI gate・HEX 0）と playwright visual smoke を回帰 guard として位置づけ、Phase 9 / Phase 11 への連携を書く。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 5 | degrade 分岐 / EmptyState / `data-attendance-follow` を fail path で再検証 |
| Phase 7 | 統合テストへ正常系 + 異常系の全 TC を引き渡す |
| Phase 9 | vitest 対象限定で TC-E-XX を含む全 TC Green を確認 |
| Phase 11 | playwright visual smoke（3 層レイアウト）の baseline を取得 |

## 多角的チェック観点（AIが判断）

| 観点 | AC / 不変条件 | 確認内容 |
| --- | --- | --- |
| 部分 degrade の独立性 | AC-10 | 1 ゾーン error が他ゾーンの描画を阻害しない |
| 全 error degrade | AC-10 | 全 SafeResult error でも UI が crash せず全ゾーン degrade 表示 |
| EmptyState | AC-10 | 欠席者 0 件で `data-attendance-follow="none"` + 「いません」表示 |
| 境界値トーン | AC-4 | 欠席者数 0 / 1 / 多数でトーンが none/warn に正しく切替 |
| Segmented 初期タブ | AC-3 | 初期タブ = "session"（または initialTab）で他タブ body 非生成 |
| フィルタ再 fetch 不変 | AC-10 | フィルタ変更で既存挙動（searchParams 更新 → 再 fetch）が不変 |
| HEX 回帰 guard | AC-5 | `verify-design-tokens` が HEX 0 件で pass |

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 拡充方針概要 | 6 | spec_created | main.md |
| 2 | TC-E-XX 採番 | 6 | spec_created | failure-cases.md |
| 3 | overview error PRIMARY degrade | 6 | spec_created | TC-E |
| 4 | 欠席者 0 件 EmptyState | 6 | spec_created | TC-E |
| 5 | 全 SafeResult error 全ゾーン degrade | 6 | spec_created | TC-E |
| 6 | 欠席者数境界 / Segmented 初期タブ | 6 | spec_created | TC-E |
| 7 | 回帰 guard（verify-design-tokens / playwright） | 6 | spec_created | main.md |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-06/main.md | 拡充方針 + 正常/異常責務分担 + 回帰 guard 位置づけ |
| ドキュメント | outputs/phase-06/failure-cases.md | TC-E-XX 一覧（異常系 / 境界値） |
| メタ | artifacts.json | Phase 6 を spec_created に維持 |

## 完了条件

- [ ] `outputs/phase-06/main.md` に Phase 4 Red → Phase 5 Green 後の拡充方針が記載され、正常系（Phase 4）/ 異常系（Phase 6）の責務分担が明示されている
- [ ] `outputs/phase-06/failure-cases.md` に TC-E-XX が採番され、各 TC に対象 / 操作 / 期待値 / 配置 spec が記載されている
- [ ] (a) overview error 時の PRIMARY degrade が TC-E でカバーされている
- [ ] (b) 欠席者 0 件の EmptyState（`data-attendance-follow="none"`）が TC-E でカバーされている
- [ ] (c) 全 SafeResult error 時の全ゾーン degrade が TC-E でカバーされている
- [ ] (d) Segmented 初期タブ、(e) 欠席者数境界（0/1/多数）トーン切替、(f) フィルタ変更後の再 fetch 挙動不変が TC-E でカバーされている
- [ ] 回帰 guard として `verify-design-tokens`（HEX 0 件）と playwright visual smoke の位置づけが `outputs/phase-06/main.md` に記載されている

## タスク100%実行確認【必須】

- [ ] サブタスク 1〜7 が完了している
- [ ] `outputs/phase-06/{main,failure-cases}.md` が配置済み
- [ ] 全 TC-E-XX が AC-4 / AC-5 / AC-10 のいずれかにマップされている
- [ ] 境界値（0/1/多数・全 ok/部分/全 error）が網羅されている
- [ ] テスト書式が既存（happy-dom + testing-library + `afterEach(cleanup)` + `fireEvent`）を踏襲している
- [ ] artifacts.json の Phase 6 ステータスが spec_created に整合している

## 次Phase

- 次: Phase 7（統合テスト）
- 引き継ぎ事項: TC-E-XX 一覧 / 回帰 guard（verify-design-tokens / playwright visual smoke）/ 全 TC（正常 + 異常）
- ブロック条件: TC-E が AC にマップできない、または境界値が網羅できない場合は Phase 4（テスト設計）に戻る
