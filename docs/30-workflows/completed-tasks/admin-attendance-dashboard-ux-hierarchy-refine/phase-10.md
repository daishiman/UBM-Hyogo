# Phase 10: 最終レビュー

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | admin-attendance-dashboard-ux-hierarchy-refine |
| Phase 番号 | 10 / 13 |
| Phase 名称 | 最終レビュー |
| 実行種別 | serial |
| 作成日 | 2026-06-08 |
| 上流 | Phase 9（品質保証） |
| 下流 | Phase 11（手動テスト・VISUAL screenshot） |
| 状態 | completed |
| 実装区分 | 実装仕様書（VISUAL） |
| 関連 issue | なし（staging 観察起点・relatedIssue=null） |

## 目的

Phase 9 までで確定した品質状態に対し、受入条件 AC-1〜AC-10 の最終充足確認と、Phase 3 で登録された MINOR M-1 / M-2 / M-3 の解決確認を行う。Go/No-Go を 4 条件 + AC 全充足 + token gate PASS + 既存機能温存の合議で判定し、Phase 11（手動テスト・VISUAL screenshot）へ進む条件、および Phase 13（PR 作成）を blocked に維持する条件を確定する。本 Phase は判定 Phase であり、コード変更・commit・PR は一切行わない。

## 実行タスク

1. **AC 最終確認観点の固定**: AC-1〜AC-10 の各受入条件に対し「確認手段（自動テスト / token gate / 構造アサーション / 視覚証跡）」「blocker 判定基準」を `outputs/phase-10/main.md` に表で固定する。
2. **MINOR 解決確認**: M-1（route 二重 className 整理）/ M-2（要フォロー属性名 `data-attendance-follow` 命名分離）/ M-3（既存 spec のレイアウト追従）の解決状態を確認し、未解決があれば戻り先 Phase を明記する。
3. **Go/No-Go 判定基準の確定**: 4 条件（価値性 / 実現性 / 整合性 / 運用性）+ AC 全充足 + `verify-design-tokens` PASS + 既存機能温存を Go 条件として `outputs/phase-10/go-no-go.md` に固定する。
4. **Phase 11 進行条件 / Phase 13 blocked 条件の確定**。

## 依存Phase成果物参照

| 依存Phase | 必須成果物 | 本Phaseでの使用 |
| --- | --- | --- |
| Phase 2 | `outputs/phase-02/component-map.md` / `outputs/phase-02/layout-blueprint.md` | AC 最終確認表の構造・コンポーネント境界の基準 |

## 参照資料

### タスク内部資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | _shared-context.md（§6 AC / §10 メタ情報） | AC-1〜AC-10 / 裏取り確定表 |
| 必須 | phase-03.md / outputs/phase-03/main.md | MINOR M-1/M-2/M-3 の登録元 |
| 必須 | outputs/phase-09/main.md | 品質保証結果 |
| 必須 | outputs/phase-07/ac-matrix.md | AC↔テスト対応 |

### システム仕様（aiworkflow-requirements）

| 参照資料 | パス | 用途 |
| --- | --- | --- |
| UI/UX 設計原則 | `.claude/skills/aiworkflow-requirements/references/ui-ux-design-principles-core.md` | 階層・焦点の最終評価根拠 |
| UI/UX admin dashboard | `.claude/skills/aiworkflow-requirements/references/ui-ux-admin-dashboard.md` | ダッシュボード情報設計の妥当性 |
| デザイントークン正本 | `docs/00-getting-started-manual/specs/09b-design-tokens.md` | AC-5 token gate 根拠 |

## 実行手順

### ステップ 1: AC 最終確認観点の固定

- AC-1〜AC-10 を `outputs/phase-10/main.md` の「AC 最終確認表」に列挙し、各 AC に「確認手段」「blocker 判定」を割り当てる。
- VISUAL タスクであるため、AC-1（ヒーロー特大タイポ）/ AC-4（要フォロートーン切替）/ AC-8（レスポンシブ）は Phase 11 screenshot canonical 名へのマッピングを併記する。

### ステップ 2: MINOR 解決確認

- M-1 / M-2 / M-3 の解決状態を `outputs/phase-10/main.md` の「MINOR 解決確認表」に記録する。
- 未解決の MINOR がある場合は blocker か否かを判定し、blocker なら戻り先 Phase（M-1=Phase 5 / M-2=Phase 5 / M-3=Phase 4・6）を明記する。

### ステップ 3: Go/No-Go 判定

- `outputs/phase-10/go-no-go.md` に Go 条件（4 条件 + AC 全充足 + token gate PASS + 既存機能温存）を固定する。
- いずれか 1 つでも未充足なら No-Go とし、戻り先 Phase を明記する。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 11 | Go 判定を受けて VISUAL screenshot capture へ進む。AC-1/AC-4/AC-8 を screenshot canonical 名にマップ |
| Phase 12 | MINOR 解決結果を documentation-changelog / unassigned-task-detection に申し送り |
| Phase 13 | Go 判定が出ても commit / PR は user 承認後のみ。承認まで blocked 維持 |

## 多角的チェック観点（AIが判断）

| 観点 | AC / 不変条件 | 確認内容 |
| --- | --- | --- |
| 階層の焦点成立 | AC-1 / AC-2 | PRIMARY が最大視覚ウェイトを持ち、最重要 2 判断（出席率 / 要フォロー）が最上部に到達するか |
| 段階的開示 | AC-3 | DETAIL の 3 テーブルが Segmented で排他統合され初期スクロール量が削減されるか |
| トーン切替の意味整合 | AC-4 | 要フォロー 0 名 = neutral/success、1+ = warning。issue-1112 の `data-attendance-level` と命名分離されているか（M-2） |
| token 正本 | AC-5 | HEX 直書き / `bg-[#xxx]` / `text-[#xxx]` が 0 件（`verify-design-tokens` PASS） |
| primitive 非追加 | AC-6 | `components/ui/` への新規 primitive 追加が 0 件 |
| データ層不変 | AC-7 | `apps/api` / `packages/shared` の diff が 0 件 |
| 機能温存 | AC-10 | フィルタ / CSV / drilldown modal / SafeResult degrade が挙動不変 |

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | AC 最終確認表 | 10 | spec_created | main.md |
| 2 | MINOR M-1/M-2/M-3 解決確認 | 10 | spec_created | main.md |
| 3 | Go/No-Go 判定基準 | 10 | spec_created | go-no-go.md |
| 4 | Phase 11 進行条件 | 10 | spec_created | go-no-go.md |
| 5 | Phase 13 blocked 条件 | 10 | spec_created | go-no-go.md |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-10/main.md | AC 最終確認表 + MINOR 解決確認表 |
| ドキュメント | outputs/phase-10/go-no-go.md | Go/No-Go 判定基準・Phase 11 進行 / Phase 13 blocked 条件 |
| メタ | outputs/artifacts.json | Phase 10 を spec_created に維持 |

## 完了条件

- [ ] `outputs/phase-10/main.md` に AC-1〜AC-10 の最終確認表（確認手段 + blocker 判定）が固定されている
- [ ] MINOR M-1 / M-2 / M-3 の解決確認が記録され、未解決時の戻り先 Phase が明記されている
- [ ] `outputs/phase-10/go-no-go.md` に Go 条件（4 条件 + AC 全充足 + token gate PASS + 既存機能温存）が固定されている
- [ ] Phase 11 進行条件と Phase 13 blocked 条件が明記されている
- [ ] artifacts.json の Phase 10 ステータスが spec_created に整合している

## タスク100%実行確認【必須】

- [ ] サブタスク 1〜5 が完了している
- [ ] `outputs/phase-10/{main,go-no-go}.md` が実体ファイルとして配置済み
- [ ] AC-1〜AC-10 すべてに確認手段が割り当てられている（未割当 0 件）
- [ ] MINOR 3 件すべてに解決状態が記録されている（未記録 0 件）
- [ ] Go 条件のいずれかが未充足の場合は No-Go と戻り先が明記されている

## 次Phase

- 次: Phase 11（手動テスト・VISUAL screenshot）
- 引き継ぎ事項: Go 判定 / AC↔screenshot マッピング / MINOR 解決結果
- ブロック条件: Go 条件のいずれかが未充足の場合は該当戻り先 Phase（M-1/M-2=Phase 5 / M-3=Phase 4・6 / token=Phase 9）へ戻る
