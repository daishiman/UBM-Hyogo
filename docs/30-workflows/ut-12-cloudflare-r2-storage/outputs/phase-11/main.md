# Phase 11 Main Report — 手動 smoke test（NON_VISUAL）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク | UT-12 / Cloudflare R2 ストレージ設定 |
| Phase | 11 / 13 (手動 smoke test) |
| 種別 | docs-only / spec_created |
| 実行モード | **NON_VISUAL** |
| 主証跡 | `outputs/phase-11/manual-smoke-log.md`（CLI 出力テキスト + curl HTTP ヘッダ） |
| 副証跡 | `outputs/phase-11/link-checklist.md`（前後 Phase リンク整合） |
| 関連 AC | AC-4 / AC-5 |
| 規約参照 | [UBM-002] [UBM-003] / [Feedback 4] |

## NON_VISUAL 宣言

本タスクは Cloudflare R2 のバケット作成・wrangler.toml バインディング・CORS 設定をスコープとする docs-only タスクであり、UI コンポーネントの新規追加・変更が一切ない。検証手段は以下のみで成立する。

- `wrangler r2 object put / get / delete` による CLI 出力テキスト
- `curl -i -X OPTIONS` による HTTP レスポンスヘッダ（`Access-Control-Allow-Origin` 等）
- `wrangler r2 bucket cors get` による CORS ルール JSON 突合

スクリーンショットを撮ると false green の温床になるため、`outputs/phase-11/screenshots/` ディレクトリおよび `.gitkeep` プレースホルダーは作成しない（[UBM-002] [UBM-003] / [Feedback 4]）。

## 実施概要（docs-only として手順を確定する旨）

本 Phase の目的は「実環境 smoke test の実施」ではなく、**将来のファイルアップロード実装タスク（future-file-upload-implementation）が再現可能な手順を文書として確定させる**ことにある。実コマンド実行・実 HTTP リクエスト発行は本 Phase ではゼロ件で、すべて手順書（`manual-smoke-log.md`）として固定する。実出力欄は実装タスク側で追記する空欄として用意する。

## AC 充足見込み判定

| AC | 内容 | Phase 11 充足見込み | 証跡パス |
| --- | --- | --- | --- |
| AC-4 | R2 PUT / GET / DELETE smoke test の手順と証跡パス定義 | **PASS（手順確定）** | `outputs/phase-11/manual-smoke-log.md` PUT / GET / DELETE セクション |
| AC-5 | CORS 設定 JSON と適用確認手順、ブラウザ直接アップロード経路の検証観点明示 | **PASS（手順確定）** | `outputs/phase-11/manual-smoke-log.md` CORS curl + `wrangler r2 bucket cors get` セクション |

> AC-4 / AC-5 の「実行による証跡」は実装タスク着手時に `manual-smoke-log.md` 実出力欄に追記される運用ハンドオフとする（Phase 12 implementation-guide でも申し送り）。

## screenshots 不作成方針の明記

- `outputs/phase-11/screenshots/` は **作成しない**
- `.gitkeep` プレースホルダーも作成しない
- 理由: NON_VISUAL タスク（[UBM-002] [UBM-003]）。視覚的差分が皆無のため。
- Phase 12 `phase12-task-spec-compliance-check.md` でも本方針を再確認する。

## サブタスク状態テーブル

| # | サブタスク | 状態 | 証跡 |
| --- | --- | --- | --- |
| 1 | NON_VISUAL 宣言と証跡方針記録 | DONE | 本 main.md |
| 2 | PUT / GET / DELETE 手順設計（staging 限定） | DONE | manual-smoke-log.md §2 |
| 3 | CORS curl 検証手順設計（許可 / 不許可 origin） | DONE | manual-smoke-log.md §3 |
| 4 | `wrangler r2 bucket cors get` ルール確認手順 | DONE | manual-smoke-log.md §4 |
| 5 | manual-smoke-log.md 構造化 | DONE | manual-smoke-log.md 全体 |
| 6 | link-checklist.md 作成 | DONE | link-checklist.md |

## 完了条件チェックリスト

- [x] `main.md` / `manual-smoke-log.md` / `link-checklist.md` の 3 点が揃っている
- [x] NON_VISUAL である理由・主証跡・screenshots 不作成方針が `main.md` に明記
- [x] `screenshots/` および `.gitkeep` が作成されていない
- [x] AC-4 の証跡パスが `manual-smoke-log.md` に固定
- [x] AC-5 の curl 検証手順（許可 / 不許可 origin / CORS get）が確定
- [x] `link-checklist.md` で前後 Phase（5 / 6 / 8 / 10）参照リンクが有効

## 次 Phase への引き渡し

- 次 Phase: 12 (ドキュメント更新)
- 引き継ぎ事項:
  - NON_VISUAL 証跡方針（screenshots 不要 / CLI + HTTP ヘッダで完結）
  - smoke test 手順（PUT / GET / DELETE / CORS curl / `bucket cors get`）
  - link-checklist 結果（Phase 5 / 6 / 8 / 10 整合 PASS）
  - AC-4 / AC-5 の証跡パス（`manual-smoke-log.md`）
  - 実出力欄は実装タスク側で追記される運用ハンドオフ
- ブロック条件: 必須 3 点欠落 / NON_VISUAL 理由未記載 → Phase 12 進行不可
