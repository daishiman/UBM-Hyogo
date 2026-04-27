# Phase 1: 要件定義

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | D1 読み書き競合対策の設定可否確認 (UT-02) |
| Phase 番号 | 1 / 13 |
| Phase 名称 | 要件定義 |
| 作成日 | 2026-04-26 |
| 前 Phase | なし |
| 次 Phase | 2 (設計) |
| 状態 | spec_created |

## 目的

Cloudflare D1 に対して `PRAGMA journal_mode=WAL` を永続設定できるという未検証前提を排除し、D1 の読み書き競合対策を docs-only の安全な仕様として確定する。

## 実行タスク

- 公式対応確認を最初のゲートとして定義する
- WAL を確定設定ではなく条件付き選択肢へ再定義する
- 02-serial / UT-09 への委譲境界を明確化する
- 4条件評価を確定する
- 受入条件を検証可能な形へ修正する

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md | D1 / wrangler 基本方針 |
| 必須 | docs/ut-02-d1-wal-mode/index.md | タスク概要・AC |
| 必須 | docs/ut-02-d1-wal-mode/outputs/phase-01/requirements.md | Phase 1 確定成果物 |
| 参考 | docs/completed-tasks/02-serial-monorepo-runtime-foundation | 組み込み先の実在パス |

## 実行手順

### ステップ 1: P50チェック

- `git status --short` で本タスクが未追跡 docs-only 変更であることを確認する
- 対象ファイルが `docs/ut-02-d1-wal-mode/` に存在することを確認する
- 旧パス `docs/01-infrastructure-setup/ut-02-d1-wal-mode/` を参照しない

### ステップ 2: 公式対応ゲート

- Cloudflare D1 の compatible PRAGMA list に `journal_mode` が含まれるか確認する
- D1 PRAGMA の効果範囲が current transaction 限定か確認する
- 永続 WAL が確認できない場合、production mutation を禁止する

### ステップ 3: 要件確定

- AC-2 を「WALを必ず適用」から「公式対応時のみ適用、非対応時は代替策へ委譲」へ修正する
- 代替策を retry/backoff、queue serialization、short transaction、batch sizing として明記する

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 2 | 条件付き WAL 方針を設計入力にする |
| Phase 4 | 実行コマンドを mutation ではなく証跡確認として扱う |
| Phase 10 | GO は docs-only close-out に限定する |

## 多角的チェック観点（AIが判断）

- 価値性: unsupported なD1挙動を後続実装が前提にしないか
- 実現性: docs-only 範囲で証跡と委譲が完結するか
- 整合性: WAL が全Phaseで条件付き方針として扱われているか
- 運用性: production mutation を明示的に禁止できているか

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 公式対応ゲート定義 | 1 | spec_created | requirements.md に記録 |
| 2 | 4条件評価 | 1 | spec_created | 全件 PASS |
| 3 | AC 再定義 | 1 | spec_created | AC-2 を条件付き化 |
| 4 | 正本仕様参照表の確認 | 1 | spec_created | deployment-cloudflare.md 確認 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-01/requirements.md | 要件定義の主成果物 |
| メタ | artifacts.json | Phase 状態と outputs の記録 |

## 完了条件

- [ ] 真の論点が「WAL設定」ではなく「D1競合対策の公式対応確認」に再定義されている
- [ ] 4条件評価が全て PASS で確定している
- [ ] AC が条件付きかつ検証可能な形で定義されている
- [ ] downstream handoff が明記されている

## タスク100%実行確認【必須】

- 全実行タスクが spec_created
- 全成果物が指定パスに配置済み
- 異常系（WAL非対応・PRAGMA transaction scope）も確認済み
- 次 Phase への引き継ぎ事項を記述
- artifacts.json の該当 phase を spec_created に更新

## 次 Phase

- 次: 2 (設計)
- 引き継ぎ事項: 条件付き WAL 方針と代替策を設計の入力として渡す
- ブロック条件: 公式対応ゲートが未定義なら次 Phase に進まない
