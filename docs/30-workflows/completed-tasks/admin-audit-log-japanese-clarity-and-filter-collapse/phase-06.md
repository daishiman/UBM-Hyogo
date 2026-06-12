[実装区分: 実装仕様書]

# Phase 6: テスト拡充（fail path / 回帰 guard）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | admin-audit-log-japanese-clarity-and-filter-collapse |
| Phase 番号 | 6 / 13 |
| Phase 名称 | テスト拡充（fail path / 回帰 guard） |
| 実行種別 | serial |
| 作成日 | 2026-06-11 |
| 担当 | web (apps/web 表現層) |
| タスク種別 | implementation（VISUAL / コード変更を伴う） |
| 上流 | Phase 5（実装・TC-XX Green 化） |
| 下流 | Phase 7（カバレッジ確認） |
| 状態 | completed |

## 目的

Phase 4 の正常系 Red を Phase 5 で Green 化した後、**異常系・境界値（fail path）テスト（TC-E-XX）**を追加して堅牢性を担保する。具体的には (a) 未登録 action コード → 生コード raw fallback 表示、(b) `targetType=null` → 「—」表示、(c) 詳細フィルタ（targetType / targetId / batchId）全空 → `<details>` 閉（`open` 属性なし）、(d) 詳細フィルタにいずれか値あり → `<details open>`、(e) `appliedFilters` 空 → チップ非表示（「なし（直近 N 件…）」表示）、をカバーする。さらに **回帰 guard** として `verify-design-tokens`（HEX 0 件 = AC-8）と既存挙動温存（検索 / リセット / ページネーション / PII マスク / JSON 開示）の不変を位置づける。本 Phase はテスト拡充の設計（TC-E-XX 一覧 + 回帰 guard の位置づけ）を文書化する。

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-06/main.md | 拡充方針 + 正常/異常責務分担 + 回帰 guard 位置づけ |
| ドキュメント | outputs/phase-06/failure-cases.md | TC-E-XX 一覧（異常系 / 境界値） |
| メタ | artifacts.json | Phase 6 を completed に維持 |

## 実行タスク

1. **拡充方針の文書化**: `outputs/phase-06/main.md` に Phase 4 Red → Phase 5 Green 後の拡充方針を書く。正常系（Phase 4 = 日本語ラベル描画 / 2 層構造 / チップ日本語化）と異常系（Phase 6 = raw fallback / null 表示 / details 開閉 / チップ非表示）の責務分担を明示する。
2. **fail path / 境界値 TC-E-XX の作成**: `outputs/phase-06/failure-cases.md` に異常系・境界値ケースを採番し、対象 / 操作（入力データ）/ 期待値 / 配置 spec を書く。
3. **回帰 guard の位置づけ**: `verify-design-tokens`（HEX 0 件 = AC-8）と既存挙動温存（AC-12: 検索 / リセット / cursor ページネーション / PII マスク / JSON 開示 / エラー親切メッセージ）を回帰 guard として位置づける。
4. **境界値網羅の確認**: action（登録済 / 未登録）、targetType（登録済 / 未登録 / null）、詳細フィルタ（全空 / 一部あり / 全あり）、appliedFilters（空 / 1 件 / 複数）の組合せを網羅する。

## 参照資料

### タスク内部資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-04/test-plan.md | 正常系 TC-XX（fail path との責務分担） |
| 必須 | outputs/phase-05/runbook.md | describe helper の raw fallback 分岐 / details 開閉条件 / 検証コマンド |
| 必須 | _shared-context.md §3 | ユーザー確定方針（生コード非表示・未登録のみ fallback） |
| 必須 | _shared-context.md §5 | AC-3 / AC-4 / AC-8 / AC-12 |

### システム仕様（aiworkflow-requirements）

| 参照資料 | パス | 用途 |
| --- | --- | --- |
| テスト コンポーネントパターン詳細 | `.claude/skills/aiworkflow-requirements/references/testing-component-patterns-details.md` | fail path / 境界値の component spec 書式 |
| アクセシビリティテスト | `.claude/skills/aiworkflow-requirements/references/testing-accessibility.md` | `<details>`/`<summary>` キーボード操作 / FormField label 関連付け |

## 実行手順

### ステップ 1: 拡充方針概要（main.md）

- 正常系（Phase 4）= 日本語ラベル / 2 層構造 / チップ日本語化。異常系（Phase 6）= raw fallback / null 表示 / details 開閉 / チップ非表示。責務分担を明記。

### ステップ 2: TC-E-XX 採番（failure-cases.md）

- (a)〜(e) の異常系・境界値を TC-E-01 以降で採番し、対象 / 入力データ / 期待値 / 配置 spec を書く。

### ステップ 3: 回帰 guard の位置づけ

- `verify-design-tokens`（CI gate・HEX 0）と既存挙動温存（AC-12）を回帰 guard として位置づけ、Phase 9 / Phase 11 への連携を書く。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 5 | raw fallback / null 表示 / details 開閉 / チップ非表示を fail path で再検証 |
| Phase 7 | カバレッジトレースへ正常系 + 異常系の全 TC を引き渡す |
| Phase 9 | vitest 対象限定で TC-E-XX を含む全 TC Green を確認 |
| Phase 11 | 日本語ラベル / 2 層フィルタ / カード整列の screenshot baseline を取得 |

## 多角的チェック観点（AIが判断）

| 観点 | AC / 不変条件 | 確認内容 |
| --- | --- | --- |
| 未登録 raw fallback | AC-3 | `describeAuditAction("unknown.code")` が `"unknown.code"` を返し、UI に表示される（情報欠落防止） |
| targetType null | AC-3 | `describeAuditTargetType(null)` が `"—"` を返す |
| details 既定 閉 | AC-2 | 詳細フィルタ 3 項目全空で `<details>` に `open` 属性が付かない |
| details 既定 開 | AC-2 | 詳細フィルタいずれか値ありで `<details open>` |
| チップ非表示 | AC-4 | `appliedFilters` 空で `data-testid="audit-applied-filters"` 内に chip が無く「なし」表示 |
| 英語キー名ゼロ | AC-4 | チップ label / value に `action` / `actor` 等の英語キー名が出ない |
| HEX 回帰 guard | AC-8 | `verify-design-tokens` が HEX 0 件で pass |

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 拡充方針概要 | 6 | completed | main.md |
| 2 | TC-E-XX 採番 | 6 | completed | failure-cases.md |
| 3 | 未登録 action raw fallback | 6 | completed | TC-E |
| 4 | targetType=null → 「—」 | 6 | completed | TC-E |
| 5 | details 開閉（全空 / 値あり） | 6 | completed | TC-E |
| 6 | appliedFilters 空 → チップ非表示 | 6 | completed | TC-E |
| 7 | 回帰 guard（verify-design-tokens / 挙動温存） | 6 | completed | main.md |

## 完了条件

- [ ] `outputs/phase-06/main.md` に Phase 4 Red → Phase 5 Green 後の拡充方針が記載され、正常系（Phase 4）/ 異常系（Phase 6）の責務分担が明示されている
- [ ] `outputs/phase-06/failure-cases.md` に TC-E-XX が採番され、各 TC に対象 / 入力データ / 期待値 / 配置 spec が記載されている
- [ ] (a) 未登録 action コード → 生コード raw fallback が TC-E でカバーされている
- [ ] (b) `targetType=null` → 「—」表示が TC-E でカバーされている
- [ ] (c) 詳細フィルタ全空 → `<details>` 閉、(d) 値あり → `<details open>` が TC-E でカバーされている
- [ ] (e) `appliedFilters` 空 → チップ非表示（「なし」表示）が TC-E でカバーされている
- [ ] 回帰 guard として `verify-design-tokens`（HEX 0 件）と既存挙動温存（AC-12）の位置づけが `outputs/phase-06/main.md` に記載されている

## タスク100%実行確認【必須】

- [ ] サブタスク 1〜7 が完了している
- [ ] `outputs/phase-06/{main,failure-cases}.md` が配置済み
- [ ] 全 TC-E-XX が AC-2 / AC-3 / AC-4 / AC-8 / AC-12 のいずれかにマップされている
- [ ] 境界値（登録済/未登録/null・全空/一部/全あり・空/1/複数）が網羅されている
- [ ] テスト書式が既存（jsdom + testing-library + `*.spec.{ts,tsx}`）を踏襲している
- [ ] artifacts.json の Phase 6 ステータスが completed に整合している

## 次Phase

- 次: Phase 7（カバレッジ確認）
- 引き継ぎ事項: TC-E-XX 一覧 / 回帰 guard（verify-design-tokens / 挙動温存）/ 全 TC（正常 + 異常）
- ブロック条件: TC-E が AC にマップできない、または境界値が網羅できない場合は Phase 4（テスト設計）に戻る
