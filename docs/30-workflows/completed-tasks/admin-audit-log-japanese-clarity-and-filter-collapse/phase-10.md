[実装区分: 実装仕様書]

# Phase 10: 最終レビュー

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | admin-audit-log-japanese-clarity-and-filter-collapse |
| Phase 番号 | 10 / 13 |
| Phase 名称 | 最終レビュー |
| 実行種別 | serial |
| 作成日 | 2026-06-11 |
| 上流 | Phase 9（品質保証） |
| 下流 | Phase 11（手動テスト・VISUAL screenshot） |
| 状態 | completed |
| 実装区分 | 実装仕様書（VISUAL / implemented_local_evidence_captured） |
| 関連 issue | なし（staging 観察起点・relatedIssue=null） |

## 目的

Phase 9 までで確定した仕様状態に対し、受入条件 AC-1〜AC-12 の最終充足観点と、`_shared-context.md` §8 の OOS（スコープ外）の扱いを確認する。Go/No-Go を 4 条件（価値性 / 実現性 / 整合性 / 運用性）+ AC 全充足観点 + token gate 観点 + 既存機能温存の合議で判定し、Phase 11（手動テスト・VISUAL screenshot 計画）へ進む条件、および Phase 13（PR 作成）を blocked に維持する条件を確定する。本ワークフローは `implemented_local_evidence_captured` であり、staging capture・commit・PR はユーザー明示承認後に行う。本 Phase は判定 Phase であり、commit・PR は一切行わない。

## 実行タスク

1. **AC 最終確認観点の固定**: AC-1〜AC-12 の各受入条件に対し「確認手段（自動テスト / token gate / 構造アサーション / 視覚証跡）」「blocker 判定基準」を `outputs/phase-10/main.md` に表で固定する。
2. **OOS（スコープ外）扱いの確認**: `_shared-context.md` §8 の OOS-1（CSV エクスポート / total 件数）/ OOS-2（query param キー日本語化不可）/ OOS-3（他 admin 画面）/ OOS-4（未登録 action コード SSOT 網羅）の扱いを確認し、Phase 12 の未タスク検出（baseline）へ申し送る。
3. **Go/No-Go 判定基準の確定**: 4 条件 + AC 全充足観点 + `verify-design-tokens` 観点 + 既存機能温存を Go 条件として `outputs/phase-10/go-no-go.md` に固定する。
4. **Phase 11 進行条件 / Phase 13 blocked 条件の確定**。

## 依存Phase成果物参照

| 依存Phase | 必須成果物 | 本Phaseでの使用 |
| --- | --- | --- |
| Phase 2 | `outputs/phase-02/main.md`（component-map / layout-blueprint） | AC 最終確認表の構造・コンポーネント境界の基準 |
| Phase 7 | `outputs/phase-07/ac-matrix.md` | AC↔テスト対応 |
| Phase 9 | `outputs/phase-09/main.md`（token-audit） | token gate 観点の根拠 |

## 参照資料

### タスク内部資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | _shared-context.md（§5 AC / §8 OOS / §10 完了判定） | AC-1〜AC-12 / OOS / 完了判定 |
| 必須 | outputs/phase-03/main.md（alternatives） | 設計レビュー時の MINOR / 代替案 |
| 必須 | outputs/phase-07/ac-matrix.md | AC↔テスト対応 |

### システム仕様（aiworkflow-requirements）

| 参照資料 | パス | 用途 |
| --- | --- | --- |
| デザイントークン正本 | `docs/00-getting-started-manual/specs/09b-design-tokens.md` | AC-8 token gate 根拠 |
| primitives 正本 | `docs/00-getting-started-manual/specs/09c-primitives.md` | AC-10 新規 primitive 非追加判定 |

## 実行手順

### ステップ 1: AC 最終確認観点の固定

- AC-1〜AC-12 を `outputs/phase-10/main.md` の「AC 最終確認表」に列挙し、各 AC に「確認手段」「blocker 判定」を割り当てる。
- VISUAL タスクであるため、AC-1（フォームラベル日本語）/ AC-2（段階開示）/ AC-3（カード日本語）/ AC-4（チップ日本語）/ AC-7（カード整列）は Phase 11 screenshot canonical 名へのマッピングを併記する。

### ステップ 2: OOS（スコープ外）扱いの確認

- OOS-1〜OOS-4 の扱いを `outputs/phase-10/main.md` の「OOS 確認表」に記録し、Phase 12 の `unassigned-task-detection.md` baseline へ申し送る。

### ステップ 3: Go/No-Go 判定

- `outputs/phase-10/go-no-go.md` に Go 条件（4 条件 + AC 全充足観点 + token gate 観点 + 既存機能温存）を固定する。
- いずれか 1 つでも未充足なら No-Go とし、戻り先 Phase を明記する。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 11 | Go 判定を受けて VISUAL screenshot capture 計画へ進む。AC-1/AC-2/AC-3/AC-4/AC-7 を screenshot canonical 名にマップ |
| Phase 12 | OOS 確認結果を documentation-changelog / unassigned-task-detection（baseline）に申し送り |
| Phase 13 | Go 判定が出ても commit / PR は user 承認後のみ。承認まで blocked 維持 |

## 多角的チェック観点（AIが判断）

| 観点 | AC / 不変条件 | 確認内容 |
| --- | --- | --- |
| 言葉の平易化 | AC-1 / AC-3 / AC-4 / AC-5 | フォームラベル・カード・チップ・datalist の英語キー名露出がゼロになるか |
| 段階開示の意味整合 | AC-2 | 常時表示（操作の種類 / 実行者 / 期間×2 / 表示件数）と詳細（対象 / 対象ID / 一括処理ID）の分割が初見負荷を下げ、値ありで `open` するか |
| SSOT 健全性 | AC-6 | `describeAuditAction` / `describeAuditTargetType` / `describeAuditField` が未登録 raw fallback を持つか |
| カード整列 | AC-7 | chip-row の `flex-wrap`・glossary グリッド・card meta グリッドが画面幅で破綻しないか |
| token 正本 | AC-8 | HEX 直書き / `bg-[#xxx]` / `text-[#xxx]` が 0 件（`verify-design-tokens` PASS） |
| データ層不変 | AC-9 | `apps/api` / `packages/shared` の diff が 0 件・query param キー名不変 |
| primitive 非追加 | AC-10 | 既存 primitive + ネイティブ `<details>` のみ・新規 primitive 0 件 |
| 機能温存 | AC-11 / AC-12 | a11y（label 関連付け / `<details>` キーボード操作 / `aria-label`）と既存挙動（検索 / リセット / cursor / PII / JSON / エラー親切化）が不変 |

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | AC 最終確認表 | 10 | implemented_local_evidence_captured | main.md |
| 2 | OOS 確認表 | 10 | implemented_local_evidence_captured | main.md |
| 3 | Go/No-Go 判定基準 | 10 | implemented_local_evidence_captured | go-no-go.md |
| 4 | Phase 11 進行条件 | 10 | runtime_pending | go-no-go.md |
| 5 | Phase 13 blocked 条件 | 10 | pending_user_gate | go-no-go.md |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-10/main.md | AC 最終確認表 + OOS 確認表 |
| ドキュメント | outputs/phase-10/go-no-go.md | Go/No-Go 判定基準・Phase 11 進行 / Phase 13 blocked 条件 |
| メタ | outputs/artifacts.json | Phase 10 を completed に維持 |

## 完了条件

- [ ] `outputs/phase-10/main.md` に AC-1〜AC-12 の最終確認表（確認手段 + blocker 判定）が固定されている
- [ ] OOS-1〜OOS-4 の扱いが記録され、Phase 12 baseline への申し送りが明記されている
- [ ] `outputs/phase-10/go-no-go.md` に Go 条件（4 条件 + AC 全充足観点 + token gate 観点 + 既存機能温存）が固定されている
- [ ] Phase 11 進行条件と Phase 13 blocked 条件が明記されている
- [ ] artifacts.json の Phase 10 ステータスが completed に整合している

## タスク100%実行確認【必須】

- [ ] サブタスク 1〜5 が完了している
- [ ] `outputs/phase-10/{main,go-no-go}.md` が実体ファイルとして配置済み
- [ ] AC-1〜AC-12 すべてに確認手段が割り当てられている（未割当 0 件）
- [ ] OOS 4 件すべてに扱いが記録されている（未記録 0 件）
- [ ] Go 条件のいずれかが未充足の場合は No-Go と戻り先が明記されている

## 次Phase

- 次: Phase 11（手動テスト・VISUAL screenshot 計画）
- 引き継ぎ事項: Go 判定 / AC↔screenshot マッピング / OOS 申し送り
- ブロック条件: Go 条件のいずれかが未充足の場合は該当戻り先 Phase（機能=Phase 5 / テスト=Phase 6 / token=Phase 9）へ戻る
