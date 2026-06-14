# Unassigned Task Detection — admin-schema-terminology-clarity

`[実装区分: 実装仕様書]` / status: `implemented_local_evidence_captured`

本タスク仕様の作成過程で派生した「未割当タスク」を検出し記録する。0 件でも本ファイルは必須出力。
**current（本タスクスコープ内で未消化のもの）** と **baseline（スコープ外・将来候補）** を分離する。

---

## current 未タスク: **0 件**

本タスクのスコープ（`/admin/schema` とその波及先のエンジニア用語・英語表記を平易な日本語へリネームし、
生 revisionId を非表示にする・apps/web 表現層のみ）は `shared-context.md` §2 の用語リネーム正本テーブル・
§4 の変更ファイル一覧・§6 DoD に完全に閉じている。仕様作成過程で、スコープ内に未消化・未割当のまま
取りこぼした作業項目は検出されなかった。

- §2-1〜§2-10 の全リネーム行が変更ファイル表（§4）にマップ済み。
- 新規 helper `formatJstDate` は §3 にシグネチャ・fail-soft 仕様が確定済み。
- テスト更新（T1〜T6）・Playwright 文言整合・grep gate も §4 / §6 に列挙済み。

したがって current の未割当タスクは 0 件。

## baseline 候補（スコープ外・将来タスク化の検討対象）

下記は本タスクのスコープ外であり、本ウェーブでは起票しない。将来の独立タスク候補として記録する。

| # | 候補 | 理由（なぜ本タスク外か） | 起票判断 |
|---|------|--------------------------|----------|
| B-1 | `SchemaDiffBulkRollbackModal.tsx` の実文字列の最終日本語化確認 | 本 wave で実装・grep 確認済み。独立タスク化は不要 | 起票しない（消化済み） |
| B-2 | Playwright staging visual の実取得 | local evidence は captured。authenticated staging に対する実スクリーンショット取得は VISUAL 証跡の user-gated 作業で、Phase 11 / Phase 13 の承認フローに内包される。独立タスクではなく本ワークフローの後続ステップ | 起票しない（本 WF の user-gated 後続） |

> baseline 2 候補はいずれも本ワークフローのライフサイクル（local implementation / user-gated 証跡取得）に
> 内包されるため、別 Issue / 別タスクとしての起票は不要と判定する。

## 関連タスク差分確認（重複起票チェック）

| 確認対象 | 結果 |
|----------|------|
| `admin-schema-diff-review-resolve-ux`（completed） | 操作 UX 改善で責務直交。本タスクの用語リネームと重複なし |
| `admin-schema-page-purpose-clarity-ux`（completed） | 目的説明 UI 導入済み。本タスクは eyebrow リネームのみで重複なし |
| `admin-schema-history-purpose-clarity-and-filter-fix`（completed） | history 機能改善済み。本タスクは history の文言波及リネームで重複なし |
| open issues（用語・schema 関連） | current 0 件のため新規起票なし。baseline 2 候補も上記理由で起票しない |

**結論: 重複起票なし。新規 Issue 起票は本ウェーブでは行わない（current 0 件・baseline は WF 内包）。**
