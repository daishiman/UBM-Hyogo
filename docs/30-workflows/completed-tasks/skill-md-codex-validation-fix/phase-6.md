# Phase 6: テスト拡充

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 6 |
| 名称 | テスト拡充 |
| タスクID | TASK-SKILL-CODEX-VALIDATION-001 |
| 状態 | spec_created |
| タスク種別 | tooling_implementation / NON_VISUAL |

## 目的

Phase 5 の Green を維持しつつ、fail path / 回帰 guard / エッジケースを追加する。

## 追加 TC

### Edge Case 系

| TC | 内容 | 期待 |
| --- | --- | --- |
| TC-CDX-EC-01 | description 1024 字ちょうど（境界内側） | PASS |
| TC-CDX-EC-02 | description 1025 字（境界外側） | throw |
| TC-CDX-EC-03 | description が double-quoted scalar（literal block でない） | PASS |
| TC-CDX-EC-04 | description が空文字 | 既存テスト互換（FAIL） |
| TC-CDX-EC-05 | description に絵文字含む（マルチバイト境界） | length は code unit 数で判定（既存仕様） |
| TC-CDX-EC-06 | summary に連続改行 `\n\n` | escape 後 1 スペース or 削除 |
| TC-CDX-EC-07 | summary に Tab 文字 | スペース正規化 |
| TC-CDX-EC-08 | Anchors が空配列 | description 内 Anchors セクション省略、references 不要 |
| TC-CDX-EC-09 | Trigger keywords が 0 件 | description 内 Trigger 省略可 |
| TC-CDX-EC-10 | summary 先頭が `:` | escape または quote |

### Fail Path 系

| TC | 内容 | 期待 |
| --- | --- | --- |
| TC-CDX-FP-01 | references/anchors.md への書き込みが I/O エラー | throw、SKILL.md は未生成 |
| TC-CDX-FP-02 | description が validate 失敗時、temp file が残らない | クリーンアップ確認 |
| TC-CDX-FP-03 | init_skill.js が外部から invalid frontmatter を渡される | throw |

### 回帰 Guard

| TC | 内容 | 期待 |
| --- | --- | --- |
| TC-CDX-RG-01 | 既存 boundary-1024-desc フィクスチャ（1024 字） | PASS（境界内側） |
| TC-CDX-RG-02 | 全既存 quick_validate.test.js TC | Green 維持 |
| TC-CDX-RG-03 | validate_structure.test.js | Green 維持（共通バリデータ抽出後） |
| TC-CDX-RG-04 | フィクスチャ全件を `validateSkillMdContent` に通す | 各フィクスチャの想定 error が一致 |

### Lane 統合

| TC | 内容 | 期待 |
| --- | --- | --- |
| TC-CDX-INT-03 | `generate_skill_md.js` でテストスキル生成 → 即 `validateSkillMdContent` | PASS |
| TC-CDX-INT-04 | `init_skill.js` フルワークフロー（テンプレート → write） | SKILL.md が valid |

## 受入条件（Phase 6 完了条件）

- [ ] EC-01〜EC-10、FP-01〜FP-03、RG-01〜RG-04、INT-03〜INT-04 を全件 Green
- [ ] テストファイル: `codex_validation.test.js` に追加、または `codex_edge_cases.test.js` を新設

## 成果物

- `outputs/phase-6/extended-tests.md`

## 実行タスク

- description 境界値、YAML escape、退避生成のエッジケースを追加する。
- false positive / false negative を防ぐ回帰テストを追加する。
- 一時ファイルやフィクスチャ生成物のクリーンアップを検証する。

## 参照資料

| 参照資料 | パス | 用途 |
| --- | --- | --- |
| Phase 5 | `phase-5.md` | Green 実装 |
| Phase 4 | `phase-4.md` | 既存テストケース |

## 統合テスト連携

Phase 6 の追加テストは Phase 7 coverage と Phase 9 QA の対象に含める。

## 完了条件

- [ ] EC / FP / RG / INT 系テストが全件 Green
- [ ] double-quoted scalar 方針がテストで固定されている
- [ ] temp file が残らないことを確認している

## タスク100%実行確認【必須】

- [ ] Phase 6 の成果物と artifacts.json の登録が一致している
