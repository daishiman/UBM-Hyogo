---
phase: 12
title: ドキュメント — canonical 9 headings + 中学生レベル概念説明
workflow_id: ui-prototype-design-system-foundation
sub_workflow: serial-06-form-response-binding
status: draft
taskType: implementation
visualEvidence: VISUAL
implementation_mode: integration
---

# Phase 12 — ドキュメント

[実装区分: 実装仕様書]

## 1. 目的

本 sub-workflow で実装する「Google Form の回答が公開ページに自動で出る仕組み」を、ソースコードを読まなくても理解できる形で記録する。中学生でも「何をしている画面か」分かるレベルの言葉で書く。

## 2. canonical 9 headings（Phase 12 compliance 必須）

`pnpm verify:phase12-compliance` が要求する canonical 9 headings をこの章で必ず満たす（次節以降が本体）。

## 3. 概要

UBM 兵庫支部会のメンバーが Google Form で回答すると、その回答内容が会員ページ `/members/[id]` に自動で表示される。たとえば「名前は兵庫太郎」「住んでる場所は神戸市」「興味は機械学習」と書いてもらえれば、そのとおりにページに出る。

ただし全部を出すわけではなくて、「みんなに見せていい」と本人が許可した項目だけを出す。メールアドレスのような「会員にだけ見せたい情報」「管理者にだけ見せたい情報」は出さない。

## 4. 背景（なぜこの仕組みが必要か）

会員サイトは「自己紹介を読み合うこと」が中心の機能。だから「自分が書いた回答が公開ページに反映される」体験が壊れていると、サイトの存在意義そのものが薄くなる。

これまでは API（裏側のサーバー）は動いていたけれど、画面側で「API からもらったデータをどう表示するか」の橋渡し（adapter という部品）がなかったため、画面に何も出ていなかった。本サブワークフローはその橋渡しだけを作る。

## 5. アーキテクチャ

3 層構造で実装する:

1. **fetch 層**: 画面のサーバー部分が API に「この会員の情報をください」と問い合わせる
2. **adapter 層（新規）**: API から返ってきたデータを、画面部品（primitive）が使いやすい形に整える + 公開していい項目だけに絞り込む
3. **画面部品層**: 整えたデータを使って、見出し・タグ・項目一覧・参加履歴を描く

API の形式や画面部品の形式はどちらも変更しない。間に挟む「adapter」だけが新規。

## 6. 設計判断（なぜ adapter を間に挟むか）

API が返すデータ形式と画面部品が期待するデータ形式は、似ているがピッタリ同じではない。たとえば API は「publicSections」と呼ぶが、画面部品は「sections」と呼ぶ。

直接つなぐ方法もあるが、それだと「API か画面部品のどちらかが変わったら、もう片方も書き換える」必要があって面倒。adapter を挟めば、変更があったら adapter だけを直せばよくなる。

これは「変更の影響範囲を一箇所に閉じる」というソフトウェア設計の基本原則（Single Responsibility）に従った判断。

## 7. データ流（5 ステップ）

1. Google Form に会員が回答する（formId は `119ec...` 固定）
2. `apps/api` の `sync-forms-responses` job が D1（データベース）に保存する
3. ブラウザが `/members/abc-123` を開くと、画面のサーバー部分が `GET /public/members/abc-123` を API に投げる
4. API は「abc-123 番の会員の、公開していい項目だけ」を返す
5. adapter がデータを整え、画面部品が見出し・タグ・項目を描く

## 8. visibility（だれに見せるか）

各項目には「だれに見せていいか」のラベルが付いている:

- `public`: みんなに見せる（名前、ニックネーム、住んでる地域、職業 など）
- `member`: ログインした会員にだけ見せる（メールアドレスなど）
- `admin`: 管理者にだけ見せる（同意の状態など）

本サブワークフローでは `public` だけを画面に出す。`member` / `admin` は API 側で既に取り除かれているが、念のため画面側でももう一度フィルターをかける（二重防御）。

## 9. テスト

- adapter は「ちゃんと public だけ通すか」「変なデータが来ても壊れないか」を 6 ケースで unit test する
- 画面は Playwright で「6 セクションが出るか」「メールアドレスが画面に出ないか」を確認する
- 画像（スクリーンショット）も 1 枚記録する

## 10. 不変条件（変えてはいけないこと）

1. API の URL や戻り値の形式を変えない
2. D1（データベース）を画面側から直接触らない
3. 色は `tokens.css` 経由のみ（HEX 直書き禁止）
4. 既存の画面部品の使い方を変えない
5. 新しい画面部品を作らない（既存の部品の組み合わせだけで作る）

## 11. 用語集

| 用語 | 意味 |
|------|-----|
| primitive | 画面の最小部品（ボタン、見出し、タグ など） |
| adapter | データ形式を整える橋渡し部品 |
| Server Component | サーバー側で実行される画面部品（Next.js の機能） |
| stableKey | 各項目に付いた変わらない識別子（例: `full_name`） |
| visibility | だれに見せていいかのラベル（public / member / admin） |
| fixture | テスト用の代表データ |

## 12. 参照

- 同 sub-workflow Phase 1〜11
- `docs/00-getting-started-manual/specs/01-api-schema.md`
- `docs/00-getting-started-manual/google-form/01-design.md`
- CLAUDE.md「UI prototype alignment / MVP recovery」

## 13. Compliance チェック

- [ ] canonical 9 headings 揃っている
- [ ] 中学生レベルの言葉で説明されている
- [ ] 不変条件が明示されている
- [ ] 用語集がある
- [ ] `pnpm verify:phase12-compliance` が green
