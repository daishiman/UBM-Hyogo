# Phase 12: 正本同期 / 実装ガイド

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase 番号 | 12 / 13 |
| 前 Phase | 11 (視覚検証) |
| 次 Phase | 13 (PR・振り返り) |
| 状態 | completed |

## 目的

後続実装者・レビュアー・将来の自分が、実装内容を中学生レベルの平易さで理解できるようにする。Phase 13 PR 本文の正本ソースとなる。

## 1. このタスクは何をしたか（中学生レベル説明）

参加履歴のページに「もっと見る」ボタンを付けました。最初はサーバーが標準で返す 50 件までを表示して、ボタンを押すと次の履歴が下に追加されます。全部表示し終わったらボタンが消えます。失敗したらエラーメッセージが出ます。

## 2. 用語

| 用語 | 平易な説明 |
| --- | --- |
| cursor | 「次のページのしおり」のような文字列。サーバが「次取りたければこれを送ってね」と返してくる |
| paging | 大量のデータを一気に取らず、少しずつ取る仕組み |
| Server Component | サーバで描画して HTML を返す部品 |
| Client Component | ブラウザで動く部品。ボタンや状態の変化はこっち |
| opaque | 「中身を覗かない」。文字列をそのまま使うだけ |

## 3. 何を変えたか

| ファイル | 変更 |
| --- | --- |
| `apps/web/src/lib/api/me-types.ts` | サーバから返ってくる「参加履歴 1ページ分」の型を追加 |
| `apps/web/app/profile/_components/AttendanceList.tsx` | 新規。ボタン・読み込み中表示・エラー表示を持つ部品 |
| `apps/web/app/profile/page.tsx` | サーバで最初の default 50 件を取って、上の部品に渡す |
| `apps/web/app/profile/_components/AttendanceList.spec.tsx` | 部品が正しく動くかを自動で確認するテスト |

## 4. なぜこの設計か

- **サーバで最初の default 50 件を取る理由**: 最初の表示が速くなる（SEO にも有利）うえ、正本 API 仕様と一致する
- **ボタンで追加する理由**: 無限スクロールはスクリーンリーダーが読みにくいし、勝手に通信が走るとデータ通信量がかさむ
- **cursor をフロントで触らない理由**: 中身が変わってもフロントを直さなくて済む

## 5. 動作確認手順

```bash
mise exec -- pnpm install
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm --filter @ubm-hyogo/web test -- AttendanceList
mise exec -- pnpm --filter @ubm-hyogo/web test -- profile
mise exec -- pnpm --filter @ubm-hyogo/web dev
# → http://localhost:3000/profile を開いて「もっと見る」を確認
```

## 6. 不変条件チェック

- [x] `apps/web` から D1 を直接触っていない
- [x] HEX 直書きなし、tokens.css 経由
- [x] テストファイル名は `*.spec.tsx`
- [x] `*.test.tsx` なし
- [x] cursor を opaque として扱う

## 7. 次に何が起こるか

Phase 13 で commit / push / PR を作成する。ユーザー承認後のみ実行する。

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-12/implementation-guide.md | 実装ガイド（PR 本文の正本） |

## 完了条件

- [x] 中学生レベルの平易な説明
- [x] 変更ファイルが一覧化
- [x] 動作確認手順が記述
- [x] 不変条件が再確認

## 次 Phase

- 次: 13 (PR・振り返り)
