# Phase 10: 最終レビュー

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | admin-requests-approval-publish-state-diff |
| Phase 番号 | 10 / 13 |
| Phase 名称 | 最終レビュー |
| 実行種別 | serial |
| 作成日 | 2026-06-11 |
| 担当 | web (apps/web 表現層) |
| タスク種別 | implementation（VISUAL） |
| 上流 | Phase 9（品質保証） |
| 下流 | Phase 11（手動テスト・VISUAL screenshot） |
| 状態 | completed |
| 関連 issue | [#1188](https://github.com/daishiman/UBM-Hyogo/issues/1188)（OPEN・据え置き） |

## 目的

Phase 9 までで確定した品質保証計画に対し、4 条件（価値性 / 実現性 / 整合性 / 運用性）の最終判定と、受入条件 AC-1〜AC-10 の充足見込みを確認し、Go/No-Go を合議で確定する。Go 判定が出ても、コード実装サイクル・staging VISUAL capture・commit・PR は user-gated（後続）であることを明記する。本 Phase は判定 Phase であり `spec_created`（仕様書作成のみ）。コード変更・commit・PR は一切行わない。

## 実行タスク

1. **4 条件の最終判定**: 価値性 / 実現性 / 整合性 / 運用性を Phase 1-9 の確定事項を根拠に最終評価し、`outputs/phase-10/main.md` に固定する。
2. **AC-1〜AC-10 充足見込みの確認**: 各 AC に「確認手段（focused vitest / token gate / 構造アサーション / staging VISUAL 証跡）」「blocker 判定基準」を `outputs/phase-10/main.md` に表で固定する。VISUAL 系（AC-1 / AC-2 / AC-9）は Phase 11 screenshot canonical 名へのマッピングを併記する。
3. **Go/No-Go 判定基準の確定**: 4 条件 + AC 充足見込み + `verify-design-tokens` PASS 計画 + `apps/api` / `packages/shared` diff ゼロ + 既存機能温存を Go 条件として `outputs/phase-10/go-no-go.md` に固定する。
4. **残ゲートの確定**: Phase 11（staging capture）進行条件、実装サイクル・commit・PR が user-gated である残ゲートを `outputs/phase-10/go-no-go.md` に明記する。

## 参照資料

### タスク内部資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | _shared-context.md（§6 AC / §10 メタ情報） | AC-1〜AC-10 / 裏取り確定表 |
| 必須 | phase-03.md / outputs/phase-03/main.md | 4 条件レビューの登録元・最終設計確定 |
| 必須 | outputs/phase-07/ac-matrix.md | AC↔テスト対応 |
| 必須 | outputs/phase-09/{main,token-audit}.md | 品質保証結果・token-audit |

### システム仕様（aiworkflow-requirements）

| 参照資料 | パス | 用途 |
| --- | --- | --- |
| UI/UX 設計原則 | `.claude/skills/aiworkflow-requirements/references/ui-ux-design-principles-core.md` | diff 可視化・焦点の最終評価根拠 |
| アーキテクチャ境界 | `.claude/skills/aiworkflow-requirements/references/architecture-admin-api-client.md` | データ層不変（AC-7）の最終裏取り |

### プロジェクト spec

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/00-getting-started-manual/specs/09b-design-tokens.md | AC-4 token gate 根拠 |
| 必須 | docs/00-getting-started-manual/specs/09g-screen-blueprints-admin.md | `/admin/requests` 画面 contract（既存表示温存） |
| 参照 | apps/api/src/testing/test-accounts/catalog.ts | V01/V02/D01 fixture（VISUAL capture 対象） |

## 実行手順

### ステップ 1: 4 条件の最終判定

- `outputs/phase-10/main.md` に 4 条件（価値性 / 実現性 / 整合性 / 運用性）の最終判定表を固定する。Phase 3 の◯評価を Phase 5-9 の確定事項（helper 集約・token-audit 計画・diff ゼロ）で裏付ける。

### ステップ 2: AC 最終確認観点の固定

- AC-1〜AC-10 を `outputs/phase-10/main.md` の「AC 最終確認表」に列挙し、各 AC に「確認手段」「blocker 判定」を割り当てる。
- VISUAL タスクであるため、AC-1（公開状態 diff 強調）/ AC-2（在籍→退会の意味軸分岐）/ AC-9（a11y）は Phase 11 screenshot canonical 名へのマッピングを併記する。

### ステップ 3: Go/No-Go 判定

- `outputs/phase-10/go-no-go.md` に Go 条件を固定する。いずれか 1 つでも未充足見込みなら No-Go とし、戻り先 Phase を明記する。
- Go 判定でも実装サイクル・staging capture・commit・PR は user-gated である残ゲートを明記する。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 11 | Go 判定を受けて VISUAL screenshot capture（V01/V02/D01）へ進む。AC-1/AC-2/AC-9 を screenshot canonical 名にマップ |
| Phase 12 | 最終レビュー結果を documentation-changelog / unassigned-task-detection に申し送り |
| Phase 13 | Go 判定が出ても commit / PR は user 承認後のみ。承認まで blocked 維持 |

## 多角的チェック観点（AIが判断）

| 観点 | AC / 不変条件 | 確認内容 |
| --- | --- | --- |
| 公開状態 diff の成立 | AC-1 / AC-3 | `公開 → 非公開` 等が 1 箇所に強調表示され、英語生値が露出しない |
| 意味軸分岐 | AC-2 | `delete_request` が「在籍 → 退会（論理削除）」で公開状態 diff と混同されない |
| token 正本 | AC-4 / AC-5 | HEX 0 件（`verify-design-tokens` PASS）・既存トークンのみ |
| primitive 非追加 | AC-6 | `components/ui/` 新規追加 0 件（新規は helper のみ） |
| データ層不変 | AC-7 | `apps/api` / `packages/shared` diff 0 件・3 値限定 |
| ダイアログ文言 | AC-8 | visibility=具体遷移文言 / delete=既存退会文言 |
| a11y | AC-9 | 矢印 `aria-hidden` / dl 構造 / 既存 aria 不変 |
| 既存温存 | AC-10 | 既存 3 spec green・ルート/API パス/セレクタ不変 |

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 4 条件最終判定表 | 10 | completed | main.md |
| 2 | AC-1〜AC-10 最終確認表 | 10 | completed | main.md |
| 3 | Go/No-Go 判定基準 | 10 | completed | go-no-go.md |
| 4 | Phase 11 進行条件 | 10 | completed | go-no-go.md |
| 5 | 残ゲート（実装/capture/commit/PR が user-gated） | 10 | completed | go-no-go.md |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-10/main.md | 4 条件最終判定表 + AC-1〜AC-10 最終確認表 |
| ドキュメント | outputs/phase-10/go-no-go.md | Go/No-Go 判定・Phase 11 進行条件・残ゲート（user-gated） |
| メタ | artifacts.json | Phase 10 を completed に同期 |

## 完了条件

- [ ] `outputs/phase-10/main.md` に 4 条件（価値性/実現性/整合性/運用性）の最終判定表がある
- [ ] `outputs/phase-10/main.md` に AC-1〜AC-10 の最終確認表（確認手段 + blocker 判定）が固定されている
- [ ] VISUAL 系 AC（AC-1/AC-2/AC-9）に Phase 11 screenshot canonical 名のマッピングがある
- [ ] `outputs/phase-10/go-no-go.md` に Go 条件（4 条件 + AC 充足見込み + token gate PASS 計画 + diff ゼロ + 既存温存）が固定されている
- [ ] Go 判定でも実装サイクル・staging capture・commit・PR が user-gated である残ゲートが明記されている
- [ ] artifacts.json の Phase 10 ステータスが completed に整合している

## タスク100%実行確認【必須】

- [ ] サブタスク 1〜5 が完了している
- [ ] `outputs/phase-10/{main,go-no-go}.md` が実体ファイルとして配置済み
- [ ] AC-1〜AC-10 すべてに確認手段が割り当てられている（未割当 0 件）
- [ ] Go 条件のいずれかが未充足見込みの場合は No-Go と戻り先が明記されている
- [ ] 実装/commit/PR が user-gated である旨が明記されている

## 次Phase

- 次: Phase 11（手動テスト・VISUAL screenshot）
- 引き継ぎ事項: Go 判定 / AC↔screenshot マッピング / 残ゲート（user-gated）
- ブロック条件: Go 条件のいずれかが未充足見込みの場合は該当戻り先 Phase（実装=Phase 5 / テスト=Phase 4・6 / token=Phase 9）へ戻る
