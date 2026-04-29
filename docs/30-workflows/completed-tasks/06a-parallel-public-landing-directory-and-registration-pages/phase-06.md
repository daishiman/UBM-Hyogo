# Phase 6: 異常系検証

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | public-landing-directory-and-registration-pages |
| Phase 番号 | 6 / 13 |
| Phase 名称 | 異常系検証 |
| 作成日 | 2026-04-26 |
| 前 Phase | 5 (実装ランブック) |
| 次 Phase | 7 (AC マトリクス) |
| 状態 | pending |

## 目的

公開 4 ルートに対する異常系（404 / 422 / 5xx / sync 失敗 / 検索 0 件 / 不正 query / 大量 tag）を網羅し期待挙動を固定する。

## 実行タスク

1. 4 page × HTTP 異常系
2. 検索 query 異常
3. form-preview sync 中の挙動
4. 不適格メンバー leak 防止

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-04/test-matrix.md | test ID |
| 必須 | outputs/phase-05/runbook.md | 正常系手順 |
| 参考 | docs/00-getting-started-manual/specs/05-pages.md | 空状態 |

## 実行手順

### ステップ 1: failure cases

| ID | 入力 | 期待 status | 期待 UI | 不変条件 |
| --- | --- | --- | --- | --- |
| F-01 | `/members/UNKNOWN` | 404 | `notFound()` page、 戻る CTA | - |
| F-02 | `/public/members/:id` 5xx | 500 | error.tsx で「再試行」表示 | #5 |
| F-03 | `/public/members` 5xx | 500 | error boundary | #5 |
| F-04 | `/members?density=invalid` | 200 | density=comfy にフォールバック | #8 |
| F-05 | `/members?zone=foo` | 200 | zone=all にフォールバック | - |
| F-06 | `/members?tag=` 50 件 | 200 | 5 件で truncate | - |
| F-07 | `/members?q=<長文 200 文字>` | 200 | q=trim 200 文字 | - |
| F-08 | `/public/form-preview` 5xx | 500 | `/register` で「フォーム情報を取得できません」表示 + responderUrl だけ表示 | - |
| F-09 | non-public member detail（leak 試行） | 404 扱い | API が hide → page も 404 | #5 |
| F-10 | deleted member detail | 404 | 同上 | #5 |
| F-11 | public_consent != consented | 404 | 同上 | #5 |
| F-12 | publishState != public | 404 | 同上 | #5 |
| F-13 | 検索結果 0 件 | 200 | 「該当メンバーなし」+「絞り込みをクリア」CTA | - |
| F-14 | API 接続失敗（DNS） | 500 | error boundary | #5 |
| F-15 | localStorage に query 退避試行（不採用案） | lint error | - | #8 |

### ステップ 2: 不適格メンバー leak 検証

- F-09〜F-12: 04a 側で hide される前提だが、apps/web からも `/members/[id]` を fetch して 404 を確認
- API が誤って leak 候補を返した場合のための安全網は 04a の責務（本タスクは追加 filter しない）

### ステップ 3: form-preview 障害

- F-08: `/register` は responderUrl への遷移を最優先とし、preview 取得失敗でも登録導線は維持

### ステップ 4: 検索 0 件 UX

- F-13: 「絞り込みをクリア」CTA で `/members` へ replace、空状態画面は specs 09-ui-ux と一致

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 7 | 異常系 ID を AC × test ID 表に組み込む |
| 08a | F-01〜F-12 contract test |
| 08b | F-13 の Playwright |

## 多角的チェック観点

- 不変条件 #1: F-04〜F-07 の query 不正値処理で stableKey 既知値のみ受け入れ
- 不変条件 #5: F-09〜F-12 で apps/web 独自 filter ではなく 04a の hide を信頼
- 不変条件 #6: F-15 で localStorage 復活を阻止
- 不変条件 #8: F-04 で URL query 正本を担保
- 不変条件 #9: 異常系で `/no-access` redirect は一切なし
- 不変条件 #10: 5xx 時に re-fetch が暴走しない（error.tsx のみ）

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | F-01〜F-03 HTTP 異常 | 6 | pending | 404 / 5xx |
| 2 | F-04〜F-07 query 異常 | 6 | pending | zod fallback |
| 3 | F-08 form-preview 障害 | 6 | pending | responderUrl のみ表示 |
| 4 | F-09〜F-12 leak 防止 | 6 | pending | 404 |
| 5 | F-13 0 件 UX | 6 | pending | クリア CTA |
| 6 | F-14 API 接続失敗 | 6 | pending | error boundary |
| 7 | F-15 localStorage 阻止 | 6 | pending | lint |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-06/main.md | failure cases + 対策 |
| メタ | artifacts.json | phase 6 status |

## 完了条件

- [ ] F-01〜F-15 が網羅
- [ ] 各 case に期待 status / UI が明記
- [ ] leak 防止が 04a 信頼ベースで設計
- [ ] error boundary 配置の方針あり

## タスク100%実行確認【必須】

- 全 7 サブタスクが completed
- outputs/phase-06/main.md 配置
- 不変条件 #1, #5, #6, #8, #9, #10 への対応が明記
- 次 Phase へ failure ID 一覧を引継ぎ

## 次 Phase

- 次: 7 (AC マトリクス)
- 引き継ぎ事項: F-XX を AC × test ID と紐付け
- ブロック条件: leak 防止の方針が未定なら進まない
