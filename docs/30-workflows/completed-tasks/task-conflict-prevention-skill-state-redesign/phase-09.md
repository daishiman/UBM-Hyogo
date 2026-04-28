# Phase 9: 品質ゲート

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | task-conflict-prevention-skill-state-redesign |
| Phase 番号 | 9 / 13 |
| Phase 名称 | 品質ゲート |
| 視覚証跡区分 | NON_VISUAL |
| 作成日 | 2026-04-28 |
| 上流 | Phase 8 (リファクタ) |
| 下流 | Phase 10 (統合レビュー) |
| 状態 | pending |

## 目的

仕様書として満たすべき品質基準を 1 枚のチェックリストで判定する。

## 品質チェックリスト

### 構造

- [ ] index.md / artifacts.json / phase-01.md 〜 phase-13.md が全て存在
- [ ] outputs/phase-1 〜 phase-13/.gitkeep が存在
- [ ] artifacts.json が schemas/artifact-definition.json + task-definition.json の構造に概ね準拠

### 内容

- [ ] 全 phase が「目的」「実行タスク」「参照資料」「成果物」「完了条件」「次 Phase」を持つ
- [ ] AC-1 〜 AC-9 が index.md と phase-07.md でトレース可能
- [ ] A-1 / A-2 / A-3 / B-1 の各施策が Phase 5/6/7 で実装ランブック化されている
- [ ] Phase 4 に並列 commit シミュレーション手順がある
- [ ] Phase 11 に 4 worktree 手動検証手順がある
- [ ] Phase 12 に specs 反映と changelog がある

### コード非実装の確認

- [ ] 生成物が Markdown / JSON / .gitkeep のみ
- [ ] 実装コード（.ts / .js / .sh 等）が含まれていない
- [ ] git status で意図しないファイル変更がない

### Secret 衛生

- [ ] 仕様書中に API トークン / OAuth トークン / `.env` 実値が含まれていない
- [ ] op:// 参照が必要な箇所のみで使われている（本タスクは該当なし）

## 実行タスク

### タスク 1: チェックリスト実行

**実行手順**:
1. 上記チェックリストを一通り目視
2. NG 項目があれば対応 phase へ差し戻し
3. 結果を `outputs/phase-9/quality-checklist.md` に記録

### タスク 2: 品質ゲート判定

**実行手順**:
1. 全項目 PASS なら Phase 10 へ
2. NG があれば該当 Phase に戻る
3. `outputs/phase-9/main.md` に判定を記録

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | index.md | チェック対象 |
| 必須 | artifacts.json | チェック対象 |
| 必須 | phase-01.md 〜 phase-08.md | チェック対象 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-9/main.md | 品質ゲート判定 |
| ドキュメント | outputs/phase-9/quality-checklist.md | 詳細チェック結果 |

## 品質ゲート

- 全チェック項目 PASS で Phase 10 進行
- 1 つでも NG なら該当 Phase へ戻る

## 完了条件

- [ ] quality-checklist.md / main.md 作成
- [ ] 全項目 PASS
- [ ] artifacts.json の Phase 9 を completed に更新

## 次 Phase

- 次: Phase 10 (統合レビュー)
- 引き継ぎ事項: 品質ゲート判定

## Skill準拠補遺

## 統合テスト連携

本タスクは docs-only / NON_VISUAL のため、統合テストは実装タスクで実行する。ここでは手順、証跡名、リンク整合を固定する。

