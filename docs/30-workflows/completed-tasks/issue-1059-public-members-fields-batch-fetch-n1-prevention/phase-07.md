# Phase 7: カバレッジ確認

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 公開 members list の fields 一括取得 N+1 防止 (issue-1059) |
| Phase 番号 | 7 / 13 |
| Phase 名称 | カバレッジ確認 |
| 作成日 | 2026-06-02 |
| 状態 | completed |
| 前 Phase | 6 (テスト実行) |
| 次 Phase | 8 (リファクタリング) |
| タスク種別 | implementation / NON_VISUAL / implementation_mode: new |

## 目的

本タスクの変更箇所（`listFieldsByResponseIds` helper と use-case の fields groupBy ブロック）に
限定してカバレッジを実測し、line / branch が分岐網羅されていることを証跡に残す。全ファイル一律
の閾値判定にはせず、**変更ファイル / 変更ブロックの実測値**を Phase 7 の証跡とする
（Feedback BEFORE-QUIT-002: 全ファイル一律指定にしない / Feedback 5: 変更箇所の line/branch 実測を残す）。

## 対象範囲（限定）

本 Phase の評価対象は以下 2 箇所に限定する。リポジトリ全体・無関係ファイルの閾値は対象外。

| # | 対象 | 評価する分岐 |
| --- | --- | --- |
| C-1 | `apps/api/src/repository/responseFields.ts` の `listFieldsByResponseIds` | (a) 空配列ガード `if (rids.length === 0) return []`（真／偽の両分岐）、(b) `placeholders` + `IN (...)` query 経路 |
| C-2 | `apps/api/src/use-cases/public/list-public-members.ts` の fields groupBy ブロック（L94-121 を置換した範囲） | (a) `memberRows.length > 0` 経路、(b) `fieldsByResponseId.get(...) ?? []` の hit / miss（既存 lookup なし → 新規配列）、(c) SUMMARY_KEYS フィルタの includes 真／偽 |

> 単数 `listFieldsByResponseId`（既存）はスコープ外（温存のみ）。本 Phase では新規 `listFieldsByResponseIds` と
> use-case の置換ブロックのみを評価する。

## 実行タスク

1. 対象 vitest（リポジトリルートから）を実行し、Phase 4 で作成したテストが全緑であることを確認する。
   ```bash
   mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts \
     apps/api/src/repository/__tests__/responseFields.repository.spec.ts \
     apps/api/src/use-cases/public/__tests__/list-public-members.spec.ts
   ```
   完了条件: 上記 2 spec が全 PASS。
2. apps/api のユニットカバレッジを実行し、変更 2 箇所（C-1 / C-2）の line / branch 実測値を取得する。
   ```bash
   mise exec -- pnpm --filter @ubm-hyogo/api test:coverage:unit
   ```
   coverage レポート（テキスト or HTML）から `repository/responseFields.ts` と
   `use-cases/public/list-public-members.ts` の行を抽出し、`listFieldsByResponseIds` /
   groupBy ブロックの line・branch カバレッジ実測値を証跡として記録する。
   完了条件: C-1 / C-2 の line / branch 実測値が `outputs/phase-07/main.md` に表で残っている。
3. C-1（`listFieldsByResponseIds`）の line / branch 100% を目標として確認する。未到達分岐があれば
   Phase 4 のテストへフィードバックする分岐（空配列 / IN 句）を特定する。
   完了条件: C-1 の空配列分岐・IN 句分岐の両方がテストでカバーされている（または未カバー分岐が明示されている）。
4. C-2（use-case groupBy ブロック）の line / branch 実測値を記録し、lookup hit / miss と SUMMARY_KEYS
   フィルタ分岐がカバーされているかを確認する。
   完了条件: C-2 の実測値が記録され、未カバー分岐の有無が判定されている。
5. カバレッジの数値だけで PASS としない。「対象 2 箇所の分岐が論理的に網羅されているか」を
   定性確認として併記する（Feedback: ファイル削除や数値達成を唯一の PASS 基準にしない）。
   完了条件: 定性確認コメントが残っている。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | phase-04.md | テスト戦略・必須ケース（F-2 複数 member 引き当て / 空配列） |
| 必須 | phase-06.md | テスト実行結果（緑前提） |
| 必須 | apps/api/src/repository/responseFields.ts | C-1 評価対象 |
| 必須 | apps/api/src/use-cases/public/list-public-members.ts | C-2 評価対象 |
| 参考 | apps/api/src/repository/_shared/sql.ts | `placeholders` の挙動確認 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-07/main.md | カバレッジ確認主成果物（対象限定 + C-1/C-2 の line/branch 実測表 + 定性確認） |
| メタ | artifacts.json | Phase 7 状態の更新（completed） |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 6 | 対象 vitest 全緑を前提に受け取る |
| Phase 8 | カバレッジ実測で判明した未カバー分岐・命名の不整合をリファクタ入力へ渡す |
| Phase 9 | 対象 vitest コマンドと coverage 証跡を最終 QA の入力に渡す |

## 完了条件 (Acceptance Criteria for this Phase)

- [ ] 対象範囲が変更 2 箇所（C-1 / C-2）に限定明記されている（全ファイル一律でない）
- [ ] 対象 2 spec が全緑であることを確認している
- [ ] C-1（`listFieldsByResponseIds`）の line / branch 実測値が記録され、空配列分岐・IN 句分岐の網羅が確認されている
- [ ] C-2（use-case groupBy ブロック）の line / branch 実測値が記録されている
- [ ] coverage コマンド（`pnpm --filter @ubm-hyogo/api test:coverage:unit`）と対象 include が明記されている
- [ ] 数値だけでなく分岐網羅の定性確認が併記されている

## タスク100%実行確認【必須】

- 全実行タスク（5 件）が completed
- 成果物が `outputs/phase-07/main.md` に配置済み
- C-1 / C-2 の line / branch 実測値が表として残っている
- 対象範囲が「変更ファイル / 変更ブロック限定」で明記されている（一律閾値でない）
- artifacts.json の `phases[6].status` が completed

## 次 Phase への引き渡し

- 次 Phase: 8 (リファクタリング)
- 引き継ぎ事項:
  - C-1 / C-2 の line / branch 実測値と未カバー分岐の有無
  - 命名整合の候補（`fieldsByResponseId` / `responseIds`）と `as never` 除去の検討点
- ブロック条件:
  - 対象 spec が緑でない
  - C-1 の空配列分岐 / IN 句分岐のいずれかが未カバーかつ理由が明示されていない
