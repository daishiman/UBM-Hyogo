# UT-08A-02: visual regression test の整備

## メタ情報

| 項目 | 内容 |
| --- | --- |
| タスクID | UT-08A-02 |
| タスク名 | visual regression test の整備 |
| 分類 | implementation / VISUAL |
| 対象機能 | `apps/web` 公開ディレクトリ / 会員マイページの UI regression 監視 |
| 優先度 | 低 |
| 見積もり規模 | 中規模 |
| ステータス | 未実施 |
| 発見元 | 08a Phase 12 unassigned-task-detection §2 |
| 発見日 | 2026-04-30 |
| 検出元ファイル | `docs/30-workflows/08a-parallel-api-contract-repository-and-authorization-tests/outputs/phase-12/unassigned-task-detection.md` |
| 推奨割当 | 08b（フロント a11y / visual 強化 wave） |

## 概要

`@playwright/test --update-snapshots` ベースの visual regression を `apps/web` に導入し、公開ディレクトリ・会員マイページ・admin バックオフィスの主要画面の UI 退行を CI で検出可能にする。

## 背景

08a は `apps/api` 単独スコープであり、UI レイヤの visual regression は対象外として明示的に scope out された。一方で `claude-design-prototype/` のデザイン正本との乖離は手動目視に依存しており、leaf component 変更時の意図しない layout 退行を検知する仕組みが存在しない。08b 以降のフロント wave に組み込むのが妥当。

## 受入条件

- `apps/web` に Playwright visual regression suite を追加し、公開トップ・会員ディレクトリ・マイページ・admin ダッシュボードの 4 画面以上を baseline 化する。
- CI で `playwright --update-snapshots` を main ブランチでのみ更新可能とし、PR では diff 検出にとどめる。
- baseline 画像は LFS or `.gitattributes` 設定を含めてリポジトリ運用方針を確定する。
- 失敗時の re-run / approve runbook を `docs/30-workflows/` に同梱する。

## 苦戦箇所【記入必須】

- 対象: `apps/web` の SSR / Workers 実行モードにおける font / locale 差異
- 症状: `@opennextjs/cloudflare` Workers ランタイムでは Node ローカルとフォントレンダリング差が出やすく、CI と開発機の screenshot 完全一致を取るのが難しい。08a スコープ外として送ったが、08b 着手時に「OS-level font をどこに揃えるか」「miniflare で screenshot するのか CF Workers preview に対するのか」を最初に決めないと baseline が安定しない。
- 参照: `docs/30-workflows/08a-parallel-api-contract-repository-and-authorization-tests/outputs/phase-12/unassigned-task-detection.md` §2

## リスクと対策

| リスク | 対策 |
| --- | --- |
| baseline 画像でリポジトリが肥大化する | Git LFS or 専用 storage への退避を Phase 1 で意思決定する |
| font / OS 差で恒常的に diff が出る | Playwright docker image 固定 or Workers preview screenshot に統一する |
| 08b 本体タスクの障害になる | 08b の前提条件ではなく後続 PR として独立させ、scope out を明示する |

## 検証方法

### 要件検証

```bash
rg "visual regression|playwright|--update-snapshots" docs apps/web
```

期待: 既存設計に visual regression の定義が無いことを確認し、本タスクで初出となることを担保する。

### 環境確認

```bash
mise exec -- pnpm --filter @ubm-hyogo/web exec playwright --version
```

期待: Playwright が `apps/web` で利用可能 / 未導入の場合は本タスクで導入する。

## スコープ

### 含む

- Playwright visual regression suite 導入
- baseline 画像の保管方針確定
- CI snapshot update workflow と runbook

### 含まない

- 08a の API contract / authz / repository / type / lint テスト（完了済み）
- a11y 自動検査（08b 別 sub-task で対応）
- production 環境での負荷テスト（UT-08A-03）

## 関連

- `docs/30-workflows/08a-parallel-api-contract-repository-and-authorization-tests/outputs/phase-12/unassigned-task-detection.md`
- `docs/00-getting-started-manual/claude-design-prototype/`
