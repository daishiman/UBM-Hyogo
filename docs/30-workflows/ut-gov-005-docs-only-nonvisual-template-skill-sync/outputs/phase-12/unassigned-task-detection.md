# unassigned-task-detection.md

## メタ情報

| 項目 | 値 |
| --- | --- |
| 検出日 | 2026-04-29 |
| 親タスク | ut-gov-005-docs-only-nonvisual-template-skill-sync |
| 親 wave | governance（skill improvement / drink-your-own-champagne） |
| 検出方式 | SF-03 4 パターン照合 + 本タスク特有の MINOR 追跡（TECH-M-01〜04）転記 |

---

## 検出サマリー

本タスクスコープ外として明示的に切り出した派生タスクは **3 件（U-6 / U-7 / U-8）** + 任意候補 1 件（U-9）。
各 U-N は Phase 13 post-merge 後に GitHub Issue として起票する候補。

---

## 派生タスク一覧

| ID | 概要 | 推定スコア | 親 wave | 担当 | 検出日 |
| --- | --- | --- | --- | --- | --- |
| U-6 | UT-GOV-001〜007 系の遡及適用判定タスク | LOW | governance | TBD | 2026-04-29 |
| U-7 | mirror parity CI gate 強制タスク（pre-commit + GitHub Actions） | MEDIUM | governance | TBD | 2026-04-29 |
| U-8 | skill-fixture-runner への縮約テンプレ構造検証ルール拡張 | LOW | governance | TBD | 2026-04-29 |
| U-9 | VISUAL タスク向けテンプレ整理（NON_VISUAL 専用との対称化） | LOW | governance | TBD | 2026-04-29 |

---

## 詳細

### U-6: UT-GOV-001〜007 系の遡及適用判定タスク

- **概要**: TECH-M-03 遡及適用方針（新規=適用 / 進行中=Phase 11 着手時再判定 / 完了済=再生成しない）に従って、UT-GOV-001〜007 の各タスクで縮約テンプレ適用判定を実施する
- **根拠**: `documentation-changelog.md` §5 で明文化した 3 段階判定を機械的に実行する必要がある
- **推定スコア**: LOW（判定実施のみ、実改修は各タスク内で完結）
- **親 wave**: governance
- **依存**: 本タスク（UT-GOV-005）の縮約テンプレが merge 済であること
- **担当**: TBD（Phase 13 post-merge で起票）
- **検出日**: 2026-04-29

### U-7: mirror parity CI gate 強制タスク

- **概要**: `.claude/skills/` ⇄ `.agents/skills/` の `diff -qr` 0 行を pre-commit hook + GitHub Actions の双方で機械強制する
- **根拠**: TECH-M-02 として別タスク化決定。現在は手動 `diff -qr` のみで gate なし
- **推定スコア**: MEDIUM（lefthook config 修正 + GitHub Actions workflow 追加）
- **親 wave**: governance
- **依存**: なし（独立実施可能）
- **担当**: TBD
- **検出日**: 2026-04-29

### U-8: skill-fixture-runner 縮約テンプレ構造検証

- **概要**: skill-fixture-runner skill に「縮約テンプレが SKILL.md / references から正しく参照されているか」を検証するルールを追加
- **根拠**: TECH-M-04 として別タスク化決定。現在は文書間整合性が手動 grep 依存
- **推定スコア**: LOW（fixture スクリプト 1 本追加）
- **親 wave**: governance
- **依存**: U-7（CI gate 化）と並行実施可能
- **担当**: TBD
- **検出日**: 2026-04-29

### U-9（任意候補）: VISUAL タスク向けテンプレ整理

- **概要**: 本タスクは NON_VISUAL 専用の縮約テンプレを定義したが、VISUAL タスク側のテンプレも整理して対称化する
- **根拠**: 本タスク `skill-feedback-report.md` で「docs-only 以外でも適用しうる箇所の調査」として記録
- **推定スコア**: LOW（VISUAL 側は既存 phase-template-phase11.md フルテンプレを正本化するだけの可能性あり）
- **親 wave**: governance
- **依存**: U-6 完了後（遡及適用結果から VISUAL 側不足項目が見える）
- **担当**: TBD
- **検出日**: 2026-04-29

---

## SF-03 4 パターン照合

| パターン | 結果 | 説明 |
| --- | --- | --- |
| 型定義 → 実装 | 該当なし | docs-only / コード変更ゼロ |
| 契約 → テスト | 該当なし | API 変更なし / 契約テスト追加対象なし |
| UI 仕様 → コンポーネント | 該当なし | UI 変更なし / NON_VISUAL タスク |
| 仕様書間差異 → 設計決定 | TECH-M-03（遡及適用方針）として本 Phase で解決済 / U-6 として実施タスク化 |

---

## 検出件数

- 必須切り出し（TECH-M 由来）: **3 件**（U-6 / U-7 / U-8）
- 任意候補: 1 件（U-9）
- 合計: 4 件

各 U-N は Phase 13 post-merge 後に GitHub Issue として起票する。

---

## 完了確認

- [x] U-6 / U-7 / U-8 が表に記載
- [x] 各 U-N に概要 / 推定スコア / 親 wave / 担当 / 検出日が記載
- [x] SF-03 4 パターン照合結果を記載
- [x] 任意候補 U-9 を分離して記録
