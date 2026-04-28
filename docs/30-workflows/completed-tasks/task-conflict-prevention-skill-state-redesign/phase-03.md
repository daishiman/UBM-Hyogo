# Phase 3: 設計レビュー

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | task-conflict-prevention-skill-state-redesign |
| Phase 番号 | 3 / 13 |
| Phase 名称 | 設計レビュー（レビューゲート） |
| 視覚証跡区分 | NON_VISUAL |
| 作成日 | 2026-04-28 |
| 上流 | Phase 2 (設計) |
| 下流 | Phase 4 (テスト設計) |
| 状態 | pending |

## 目的

Phase 2 の設計成果物に対し、**既存 skill 実装への影響範囲**と**後方互換性**を多角的に評価し、
PASS / MINOR / MAJOR / CRITICAL の 4 値で判定する。CRITICAL なら Phase 1 へ差し戻す。

## レビュー観点

### 観点 1: 既存 skill 実装への影響範囲

- A-1 対象を gitignore 化することで、既存の参照コードが壊れないか
- A-2 で fragment 化されたファイルを既存スクリプトが参照していないか
- A-3 で SKILL.md を分割した場合、Progressive Disclosure を行っているコードが
  references の解決に対応できるか
- B-1 の `.gitattributes` 適用が既存 worktree の merge 履歴に影響しないか

### 観点 2: 後方互換性

- 既存 `LOGS.md` の history を fragment へ変換するか、`LOGS/_legacy.md` で温存するか
- `SKILL-changelog.md` を分割する際、既存の version エントリをどう移行するか
- 旧 path を参照している外部ドキュメントへのリダイレクト方針

### 観点 3: 並列開発シナリオでの正しさ

- 4 worktree が同時に fragment を生成した場合、衝突しないことを設計が保証しているか
- render script が重複 timestamp / 異常 front matter をどう扱うか
- `merge=union` 適用が「同一行を異なる内容で書き換える」ケースに耐えるか

### 観点 4: 運用性

- 新 fragment ファイルが大量に生成された場合の git tree への影響
- render script の手元実行のしやすさ
- 新人開発者が初見で迷わない構造か

## 判定マトリクス

| 判定 | 条件 | 次のアクション |
| --- | --- | --- |
| PASS | 全観点 OK | Phase 4 へ |
| MINOR | 軽微な指摘あり | 軽微対応の上 Phase 4 へ |
| MAJOR | 後方互換破壊 / 既存スクリプト破壊あり | Phase 2 へ戻る |
| CRITICAL | 並列開発シナリオで衝突が消えない設計 | Phase 1 へ戻る |

## 実行タスク

### タスク 1: 影響範囲マトリクス作成

**実行手順**:
1. `.claude/skills/` 配下のスクリプト・SKILL.md・hook を grep し、対象 ledger への参照を列挙
2. 参照箇所と Phase 2 の after 配置をクロスチェック
3. 影響あり / なしを表で `outputs/phase-3/impact-matrix.md` に記録

### タスク 2: 後方互換評価

**実行手順**:
1. 既存 history 保持の選択肢（A: 破棄、B: `_legacy/` 退避、C: fragment 変換）を評価
2. 推奨案を選択（推奨: B `_legacy/` 退避）
3. `outputs/phase-3/backward-compat.md` に決定理由を記録

### タスク 3: レビュー判定

**実行手順**:
1. 4 観点のレビュー結果を集約
2. PASS / MINOR / MAJOR / CRITICAL を判定
3. `outputs/phase-3/main.md` にゲート結果を記録

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-2/file-layout.md | レビュー対象 |
| 必須 | outputs/phase-2/fragment-schema.md | レビュー対象 |
| 必須 | outputs/phase-2/render-api.md | レビュー対象 |
| 必須 | outputs/phase-2/gitattributes-pattern.md | レビュー対象 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-3/main.md | レビュー結果サマリー |
| ドキュメント | outputs/phase-3/impact-matrix.md | 既存 skill への影響表 |
| ドキュメント | outputs/phase-3/backward-compat.md | 後方互換方針 |

## レビューゲート

| 判定 | 条件 | 次のアクション |
| --- | --- | --- |
| PASS | 全観点 OK | Phase 4 へ |
| MINOR | 軽微な指摘 | 修正後 Phase 4 |
| MAJOR | 設計問題 | Phase 2 へ |
| CRITICAL | 要件問題 | Phase 1 へ |

## 完了条件

- [ ] impact-matrix.md / backward-compat.md / main.md 作成
- [ ] 判定 PASS or MINOR
- [ ] AC-4 / AC-8 が確認済
- [ ] artifacts.json の Phase 3 を completed に更新

## 次 Phase

- 次: Phase 4 (テスト設計)
- 引き継ぎ事項: 影響範囲表、後方互換方針、レビュー判定

## Skill準拠補遺

## 統合テスト連携

本タスクは docs-only / NON_VISUAL のため、統合テストは実装タスクで実行する。ここでは手順、証跡名、リンク整合を固定する。

