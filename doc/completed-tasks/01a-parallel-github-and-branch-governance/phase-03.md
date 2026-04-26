# Phase 3: 設計レビュー

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | github-and-branch-governance |
| Phase 番号 | 3 / 13 |
| Phase 名称 | 設計レビュー |
| 作成日 | 2026-04-23 |
| 前 Phase | 2 (設計) |
| 次 Phase | 4 (事前検証手順) |
| 状態 | pending |

## 目的

Phase 2 で作成した `github-governance-map.md` が AC-1〜5 を完全に満たし、正本仕様（`deployment-branch-strategy.md`）と矛盾しないことを確認する。Phase 4 以降の実行を安全に開始できる状態にする。

## 実行タスク

### ステップ 1: input と前提の確認

- `outputs/phase-02/github-governance-map.md` を読む
- `outputs/phase-01/main.md` の要件定義書と照合する
- 正本仕様（`deployment-branch-strategy.md`）を再参照する

### ステップ 2: レビューチェックリスト実施

#### 2-A: AC 完全性チェック

| AC | チェック内容 | 設計での対応箇所 | 判定 |
| --- | --- | --- | --- |
| AC-1 | main: reviewer 2名、dev: reviewer 1名 | Branch Protection 設計表 | TBD |
| AC-2 | production → main のみ、staging → dev のみ | GitHub Environments 設計表 | TBD |
| AC-3 | PR template に true issue / dependency / 4条件の欄 | PR Template 設計 | TBD |
| AC-4 | CODEOWNERS と task 責務が衝突しない | CODEOWNERS 設計 | TBD |
| AC-5 | close-out path (local-check-result.md, change-summary.md) の確認 | Phase 13 成果物 path | TBD |

#### 2-B: 正本仕様整合チェック

| 確認点 | 正本仕様の記述 | 設計の対応 | 一致 |
| --- | --- | --- | --- |
| main: review 2名 | `deployment-branch-strategy.md` | Branch Protection main: 2 名 | TBD |
| dev: review 1名 | `deployment-branch-strategy.md` | Branch Protection dev: 1 名 | TBD |
| force push 禁止 | `deployment-branch-strategy.md` | main/dev: Allow force pushes OFF | TBD |
| CI ステータスチェック | `deployment-core.md` 品質ゲート | status checks: ci / Validate Build | TBD |
| production env: main | `deployment-branch-strategy.md` 環境マッピング | environments production: main | TBD |
| staging env: dev | `deployment-branch-strategy.md` 環境マッピング | environments staging: dev | TBD |

#### 2-C: Secrets 境界チェック

| 確認点 | 期待値 | 判定 |
| --- | --- | --- |
| `CLOUDFLARE_API_TOKEN` の配置先 | GitHub Secrets（実値なし） | TBD |
| `CLOUDFLARE_ACCOUNT_ID` の配置先 | GitHub Secrets（実値なし） | TBD |
| runtime secrets の配置先 | Cloudflare Secrets（このタスクでは非対象） | TBD |
| 実値の記載 | なし（プレースホルダーのみ） | TBD |

#### 2-D: スコープ境界チェック

| 確認点 | 期待 | 判定 |
| --- | --- | --- |
| Cloudflare deploy 実行が含まれていない | 設計に deploy 手順なし | TBD |
| secret 実値投入が含まれていない | placeholder のみ | TBD |
| 実コード実装が含まれていない | docs only | TBD |
| 他 Wave 1 並列タスク（01b, 01c）との干渉なし | CODEOWNERS が衝突しない | TBD |

### ステップ 3: 設計改善（必要であれば）

レビューで問題が発見された場合は `outputs/phase-02/github-governance-map.md` を修正し、再レビューする。

### ステップ 4: Phase 4 への handoff 確認

- open question リストを作成
- Phase 4 事前検証で確認すべき current state を明記

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | `outputs/phase-01/main.md` | 要件定義書 |
| 必須 | `outputs/phase-02/github-governance-map.md` | レビュー対象設計書 |
| 必須 | `.claude/skills/aiworkflow-requirements/references/deployment-branch-strategy.md` | 正本仕様 |
| 必須 | `.claude/skills/aiworkflow-requirements/references/deployment-core.md` | CI 品質ゲート |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 4 | レビュー完了後の設計を事前検証の入力として使用 |
| Phase 7 | AC トレースマトリクスのベースラインとして使用 |
| Phase 10 | 最終 gate 判定の根拠として設計レビュー結果を参照 |

## 多角的チェック観点

- **価値性**: AC が全て正本仕様に根拠を持つか
- **実現性**: 設計の全設定項目が GitHub UI で実現可能か
- **整合性**: secrets 境界・scope 境界が侵犯されていないか
- **運用性**: emergency admin bypass（force push, direct push）の対処が runbook に含まれているか

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | input 読み込み | 3 | pending | phase-01/02 outputs を読む |
| 2 | AC 完全性チェック (2-A) | 3 | pending | AC-1〜5 全て |
| 3 | 正本仕様整合チェック (2-B) | 3 | pending | deployment-branch-strategy.md との照合 |
| 4 | Secrets 境界チェック (2-C) | 3 | pending | 実値なし・placeholder のみを確認 |
| 5 | スコープ境界チェック (2-D) | 3 | pending | deploy 実行・実コードなし確認 |
| 6 | 設計改善（必要なら） | 3 | pending | phase-02 outputs 修正 |
| 7 | Phase 4 への handoff 記録 | 3 | pending | outputs/phase-03/main.md |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | `outputs/phase-03/main.md` | 設計レビュー結果・open questions・Phase 4 handoff |
| メタ | `artifacts.json` | Phase 3 status を completed に更新 |

## 完了条件

- [ ] `outputs/phase-03/main.md` が作成済み
- [ ] AC-1〜5 の判定がすべて PASS
- [ ] 正本仕様整合チェック (2-B) がすべて一致
- [ ] Secrets 境界チェック (2-C) がすべて PASS（実値なし確認）
- [ ] スコープ境界チェック (2-D) がすべて PASS
- [ ] Phase 4 への handoff items が記録済み

## タスク 100% 実行確認【必須】

- [ ] 全実行タスクが completed
- [ ] 全成果物が指定パスに配置済み
- [ ] 全完了条件にチェック済み
- [ ] 異常系（権限・drift・実値混入）も検証済み
- [ ] 次 Phase への引き継ぎ事項を記述済み
- [ ] `artifacts.json` の phase 3 を completed に更新済み

## 次Phase

- 次: 4 (事前検証手順)
- 引き継ぎ事項: レビュー済み設計書（`github-governance-map.md`）と open questions を Phase 4 に渡す
- ブロック条件: AC 完全性チェックに FAIL がある場合は Phase 4 に進まない。Phase 2 に差し戻す

## 4条件評価

| 条件 | 問い | 判定 |
| --- | --- | --- |
| 価値性 | 設計が全 AC をカバーし reviewer 不在リスクを排除するか | 要レビュー |
| 実現性 | 全設定項目が GitHub UI で設定可能か | PASS（標準機能のみ） |
| 整合性 | secrets 実値・scope 外サービスが混入していないか | 要レビュー |
| 運用性 | admin bypass 手順が Phase 5 runbook に含まれているか | Phase 5 で確認 |
