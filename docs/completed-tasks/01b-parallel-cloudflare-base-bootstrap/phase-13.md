# Phase 13: PR作成

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | cloudflare-base-bootstrap |
| Phase 番号 | 13 / 13 |
| Phase 名称 | PR作成 |
| 作成日 | 2026-04-23 |
| 前 Phase | 12 (ドキュメント更新) |
| 次 Phase | なし |
| 状態 | pending |

## 目的

Phase 1〜12 の全成果物を含む PR を作成する。ユーザーの明示的な承認なしに実行しない。PR マージはユーザーが行う。

## ユーザー承認確認文 (冒頭必須)

この Phase はユーザーの明示承認がある場合のみ実行する。実行前に必ずユーザーへ確認し、承認を得てから PR を作成すること。

## 実行タスク

- PR 作成前チェックリストを全項目確認する
- PR タイトルと本文を定義されたテンプレートに沿って作成する
- CI チェックを通す
- close-out チェックリストを確認する

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md | Cloudflare セットアップ |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-core.md | Pages / Workers / D1 役割 |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md | token placement |
| 必須 | .claude/skills/aiworkflow-requirements/references/architecture-overview-core.md | web/api split |
| 参考 | Cloudflare Dashboard / Wrangler CLI | 初回セットアップ |

## PR 作成前チェックリスト

| チェック項目 | 確認方法 |
| --- | --- |
| ユーザーの明示的承認を得た | ユーザーの指示確認 |
| Phase 1〜12 が全て完了している | artifacts.json の status 確認 |
| AC-1〜AC-5 が全て PASS | Phase 10 の AC 最終判定テーブル確認 |
| ブロッカーがない | Phase 10 のブロッカー確認リスト確認 |
| MINOR M-01 が対応済み | deployment-cloudflare.md の develop 表記ゼロ |

## PR タイトルと本文テンプレート

### PR タイトル

```
docs: cloudflare-base-bootstrap タスク仕様書作成（Phase 1-13）
```

### PR 本文テンプレート

```markdown
### 概要
Cloudflare Pages / Workers / D1 の基盤ブートストラップタスク仕様書（Phase 1-13）を作成しました。

### 変更内容
- `doc/01b-parallel-cloudflare-base-bootstrap/` に Phase 1〜13 仕様書を配置
- `doc/01-infrastructure-setup/01b-parallel-cloudflare-base-bootstrap/` から移動
- 各 Phase に Cloudflare 固有の具体的な内容を追加

### 主要成果物
- `outputs/phase-02/cloudflare-topology.md`: サービス topology 定義
- `outputs/phase-05/cloudflare-bootstrap-runbook.md`: セットアップ手順書
- `outputs/phase-05/token-scope-matrix.md`: API Token スコープ定義
- `outputs/phase-11/manual-cloudflare-checklist.md`: 手動確認チェックリスト

### 受入条件（AC）
- [x] AC-1: Pages / Workers / D1 の役割が分離されている
- [x] AC-2: staging / production の環境名が branch strategy と一致
- [x] AC-3: Cloudflare API Token は最小権限（3スコープのみ）
- [x] AC-4: Pages build budget と Workers/D1 quota を両方追跡できる
- [x] AC-5: rollback 導線が Pages と Workers で分かれている

### 下流タスクへの影響
- 02-serial-monorepo-runtime-foundation: wrangler.toml の名前定義を参照可能
- 03-serial-data-source-and-storage-contract: D1 database name を参照可能
- 04-serial-cicd-secrets-and-environment-sync: GitHub Secrets 名を参照可能
```

## 実行手順

### ステップ 1: input と前提の確認

- 上流 Phase（Phase 12）の成果物と index.md を読む
- PR 作成前チェックリストを全項目確認する
- 正本仕様との差分を先に洗い出す

### ステップ 2: PR 作成

- PR タイトルと本文をテンプレートに沿って作成する
- `gh pr create` コマンドを使用して PR を作成する
- PR URL をユーザーに報告する

### ステップ 3: CI チェック

- docs lint / link check / required validation を通す
- CI が PASS していることを確認する

### ステップ 4: 4条件と handoff の確認

- 価値性 / 実現性 / 整合性 / 運用性を再確認する
- 最終 Phase のため引き継ぎ先はなし。残課題（UN-01〜UN-05）を記録に残す

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 12 | close-out と spec sync 判断（本 Phase の入力） |
| Phase 7 | AC トレースに使用 |
| Phase 10 | gate 判定の根拠 |

## 多角的チェック観点（AIが判断）

- 価値性: 誰のどのコストを下げるか明確か。
- 実現性: 初回無料運用スコープで成立するか。
- 整合性: branch / env / runtime / data / secret が一致するか。
- 運用性: rollback / handoff / same-wave sync が可能か。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | input 確認 | 13 | pending | upstream を読む |
| 2 | PR 作成前チェックリスト確認 | 13 | pending | 全項目 PASS 必須 |
| 3 | PR 作成 | 13 | pending | ユーザー承認後のみ実行 |
| 4 | CI チェック確認 | 13 | pending | PASS 確認 |
| 5 | 成果物記録 | 13 | pending | outputs/phase-13/main.md |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-13/main.md | Phase 13 の主成果物 |
| メタ | artifacts.json | Phase 状態と outputs の記録 |

## 完了条件

- ユーザーの承認を得た上で PR を作成し、CI が PASS していること
- PR のマージはユーザーが行う
- 主成果物が作成済み
- close-out チェックリストが全て完了

## タスク100%実行確認【必須】

- 全実行タスクが completed
- 全成果物が指定パスに配置済み
- 全完了条件にチェック
- 異常系（権限・無料枠・drift）も検証済み
- 最終 Phase のため引き継ぎ事項は残課題（UN-01〜UN-05）のみ
- artifacts.json の該当 phase を completed に更新

## 次 Phase

- 次: なし
- 引き継ぎ事項: cloudflare-base-bootstrap タスクは完了。残課題（UN-01〜UN-05）は別タスクとして登録する。
- ブロック条件: 本 Phase の主成果物が未作成なら PR は作成しない。

## 変更サマリー

- docs 変更: doc/01b-parallel-cloudflare-base-bootstrap/ 配下の Phase 1〜13 仕様書
- downstream 影響: 02/03/04 タスクが cloudflare-base-bootstrap の成果物を参照可能になる
- residual risk: UN-01〜UN-05 は将来タスクとして未着手

## CI チェック

- docs lint / link check / required validation を通す

## close-out チェックリスト

- 承認あり
- outputs/phase-12/implementation-guide.md が作成済み
- outputs/phase-12/system-spec-update-summary.md が作成済み
- outputs/phase-12/documentation-changelog.md が作成済み
- outputs/phase-12/unassigned-task-detection.md が作成済み
- outputs/phase-12/skill-feedback-report.md が作成済み
- outputs/phase-12/phase12-task-spec-compliance-check.md が作成済み
- Phase 12 close-out 済み
- M-01 対応済み（deployment-cloudflare.md の develop 表記ゼロ）
