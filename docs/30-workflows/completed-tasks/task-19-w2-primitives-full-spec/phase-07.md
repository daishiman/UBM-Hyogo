# Phase 7: リファクタリング（重複排除・章構成の調整）

[実装区分: ドキュメントのみ]（CONST_004 例外: 純粋なドキュメント作成）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | task-19-w2-primitives-full-spec |
| Phase 番号 | 7 / 13 |
| Phase 名称 | リファクタリング（仕様書の整形） |
| 作成日 | 2026-05-07 |
| 前 Phase | 6 (テスト実行) |
| 次 Phase | 8 (品質保証) |
| 状態 | completed |
| task_kind | NON_VISUAL（pure-docs） |

## 目的

Phase 5 で執筆し Phase 6 で検証された `09c-primitives.md` の章構成・記述粒度を **動作（grep gate）を変えずに**整形する。タスク正本 §4.2 共通テンプレへの準拠を全 §X で確認し、重複表現の集約、token 参照名の統一、§99 不採用テーブルの理由列整形を行う。

## 実行タスク

- §X 共通テンプレ準拠（X.1〜X.6 の 6 構成）の全数チェック
- token 参照名の集約（同一 token を参照する primitive 間で表記揺れを解消）
- 重複表現の排除（a11y / variants の同文反復を共通リード文に切り出し）
- §99 不採用テーブルの理由列整形（出典行 + 1 行説明の形式統一）
- 用語統一（primitive / variant / token / a11y の表記）

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ui-prototype-alignment-mvp-recovery/03-spec-source/task-19-w2-par-primitives-full-spec.md | §4.2 template / §0.8 用語 |
| 必須 | docs/00-getting-started-manual/specs/09c-primitives.md | リファクタ対象 |
| 必須 | outputs/phase-06/grep-gate-result.md | Phase 6 lint warning 一覧 |

## 実行手順

### ステップ 1: §X 共通テンプレ準拠チェック
1. §1〜§18 の各セクションを走査し、X.1〜X.6 の 6 サブセクションが順序通りに揃っているか確認
2. 順序揺れ・サブセクション欠落があれば §4.2 template に合わせて並び替え

### ステップ 2: token 参照名の集約
- 全 §X.5 を集計し、同一 token 名（例: `--ubm-color-accent`）の表記が揃っているか確認
- aliases（旧名 / 別名）が混在している場合は task-08（09b）の正本名へ統一

### ステップ 3: 重複表現の排除
- 「`:focus-visible` ring を token 経由で表示」のような a11y 共通記述は仕様書冒頭に共通リード文として 1 回だけ記載し、各 §X.4 では「上記共通 a11y 規約に従う」と短縮
- variants 表で同一 token を参照する説明文は 1 行に圧縮

### ステップ 4: §99 不採用テーブルの整形
- 各行を `primitive | 出典 (file Lx-Ly) | 採用しない理由（1 行）` の 3 列形式に統一
- TweaksPanel / data-theme switcher / AvatarStoreProvider#localStorage の 3 件を確実に列挙

### ステップ 5: 用語統一
- 「コンポーネント」/「部品」→「primitive」
- 「色トークン」/「カラー」→「color token」
- 「キーボード操作」→「keyboard」
- §0.8 用語に従い表記を一本化

### ステップ 6: 整形後の Phase 6 gate 再実行
- §6.1 / §6.2 / §6.3 / markdown lint を再度実行し、整形によって新たな違反が入らないことを確認

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 6 | gate 再実行で整形の安全性を担保 |
| Phase 8 | 整形後の link 整合性検証へ引き継ぎ |
| Phase 9 | DoD §8 の「markdown lint で error 0」担保 |

## 多角的チェック観点（AIが判断）

- 保守性: 共通記述の 1 箇所集約により 09b 改訂時の波及が小さくなるか
- 整合性: 用語統一が §0.8 と一致しているか
- 完全性: §X 共通テンプレに対する欠落セクションが 0 件か
- 副作用ゼロ: §6 grep gate が整形後も全 pass か

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | §X テンプレ準拠チェック | 7 | pending | 18 primitive |
| 2 | token 参照名集約 | 7 | pending | 09b 正本名へ |
| 3 | 重複表現排除 | 7 | pending | 共通リード文 |
| 4 | §99 整形 | 7 | pending | 3 列化 |
| 5 | 用語統一 | 7 | pending | §0.8 |
| 6 | gate 再実行 | 7 | pending | §6 全 pass |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | docs/00-getting-started-manual/specs/09c-primitives.md | 整形済み（diff のみ） |
| ログ | outputs/phase-07/refactor-diff.md | 整形差分の要点 |
| メタ | artifacts.json | Phase 7 状態更新 |

## 完了条件

- [ ] 全 §X が X.1〜X.6 の順序を満たす
- [ ] token 参照名が 09b 正本に統一されている
- [ ] §99 が 3 列形式・3 件で整形済み
- [ ] 用語が §0.8 と一致
- [ ] §6 gate（§6.1 / §6.2 / §6.3 / markdown lint）が再実行で全 pass
- [ ] coverage AC 適用外（pure-docs）

## タスク100%実行確認【必須】

- [ ] 6 サブタスク全て completed
- [ ] refactor-diff.md に主要差分が記録されている
- [ ] 全完了条件にチェック
- [ ] §6 gate が整形前後で結果同等（pass）を維持
- [ ] 次 Phase への引き継ぎ事項を記述
- [ ] artifacts.json の Phase 7 を refined に更新

## 次 Phase

- 次: 8 (品質保証)
- 引き継ぎ事項: link 整合性（09a / 09b / 09e/09f/09g）の最終照合へ
- ブロック条件: gate 再実行で 1 件でも fail なら次 Phase に進まない
