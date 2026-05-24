---
phase: 12
title: Compliance check — Form response binding spec readiness
workflow_id: ui-prototype-design-system-foundation
sub_workflow: serial-06-form-response-binding
status: spec_created
taskType: implementation
visualEvidence: VISUAL
implementation_mode: integration
---

# Phase 12 — Compliance check

[実装区分: 実装仕様書]

本 phase は `serial-06-form-response-binding` が親 workflow
`ui-prototype-design-system-foundation` 配下の sub-workflow として成立していることを検証する。
Phase 12 strict 7 は親 root `outputs/phase-12/` に集約し、本 sub-workflow では compliance check のみを保持する。

## 1. 概要

UBM 兵庫支部会のメンバーが Google Form で回答すると、その回答内容が会員ページ `/members/[id]` に自動で表示される。たとえば「名前は兵庫太郎」「住んでる場所は神戸市」「興味は機械学習」と書いてもらえれば、そのとおりにページに出る。

ただし全部を出すわけではない。「みんなに見せていい」と本人が許可した項目（`visibility: public`）だけを出す。メールアドレスのような「会員にだけ見せたい情報」（`visibility: member`）、同意の状態のような「管理者にだけ見せたい情報」（`visibility: admin`）は出さない。

## 2. 背景

会員サイトは「自己紹介を読み合うこと」が中心の機能。だから「自分が書いた回答が公開ページに反映される」体験が壊れていると、サイトの存在意義そのものが薄くなる。

これまでは API（裏側のサーバー）は動いていたけれど、画面側で「API からもらったデータをどう表示するか」の橋渡し（adapter という部品）がなかったため、画面に何も出ていなかった。本サブワークフローはその橋渡しだけを作る。

## 3. アーキテクチャ

3 層構造で実装する:

1. **fetch 層**: 画面のサーバー部分（Server Component）が API に「この会員の情報をください」と問い合わせる
2. **adapter 層（新規）**: API から返ってきたデータを、画面部品（primitive）が使いやすい形に整える + 公開していい項目だけに絞り込む
3. **画面部品層**: 整えたデータを使って、見出し・タグ・項目一覧・参加履歴を描く

API の形式や画面部品の形式はどちらも変更しない。間に挟む「adapter」だけが新規。

中学生向け説明: 「お店（API）が箱（データ）を渡してくる。箱の中身を、お皿（画面部品）に綺麗に盛り付け直す係（adapter）を新しく雇う」というイメージ。

## 4. 設計判断

### 4.1 なぜ adapter を間に挟むか

API が返すデータ形式と画面部品が期待するデータ形式は、似ているがピッタリ同じではない。たとえば API は「publicSections」と呼ぶが、画面部品は「sections」と呼ぶ。

直接つなぐ方法もあるが、それだと「API か画面部品のどちらかが変わったら、もう片方も書き換える」必要があって面倒。adapter を挟めば、変更があったら adapter だけを直せばよくなる。

これは「変更の影響範囲を一箇所に閉じる」というソフトウェア設計の基本原則（Single Responsibility Principle）に従った判断。

### 4.2 なぜ visibility filter を UI 側でも実行するか（二重防御）

API 側で既に member / admin を除外している。しかし API にバグがあって member field を漏らした場合、本来見えてはいけない情報がブラウザに到達してしまう。adapter で再度 filter することで、API バグ時の安全網になる。これを「二重防御 (defense in depth)」と呼ぶ。

### 4.3 なぜ unknown kind を silent skip するか

Google Form の項目は将来増えるかもしれない。新しい `kind` が来たときに画面全体が壊れるのは最悪。なので「知らない `kind` は無視するだけにする」設計にする。logger も呼ばない（production console を汚染しない）。

## 5. データ流（5 ステップ）

1. Google Form に会員が回答する（formId は `119ec539YYGmkUEnSYlhI-zMXtvljVpvDFMm7nfhp7Xg` 固定）
2. `apps/api` の `sync-forms-responses` job が D1（データベース）に保存する
3. ブラウザが `/members/abc-123` を開くと、画面のサーバー部分（Server Component）が `GET /public/members/abc-123` を API に投げる
4. API は「abc-123 番の会員の、公開していい項目だけ」を返す
5. adapter がデータを整え、画面部品が見出し・タグ・項目を描く

## 6. visibility（だれに見せるか）

各項目には「だれに見せていいか」のラベルが付いている:

| visibility | 意味 | 例 |
|------------|-----|-----|
| `public` | みんなに見せる | 名前、ニックネーム、住んでる地域、職業、興味分野 |
| `member` | ログインした会員にだけ見せる | メールアドレス（system field） |
| `admin` | 管理者にだけ見せる | 同意の状態（`public_consent` / `rules_consent`） |

本サブワークフローでは `public` だけを画面に出す。`member` / `admin` は API 側で既に取り除かれているが、念のため画面側でももう一度フィルターをかける（二重防御）。

## 7. テスト

| 種別 | 対象 | ツール | ケース数 |
|------|-----|--------|---------|
| Unit | adapter | vitest | 8 |
| E2E | 画面描画 + visibility filter | Playwright (chromium) | 1 |
| Visual | snapshot baseline | Playwright | 1（serial-07 で 4 screens に拡張） |

中学生向け説明: 「adapter のテストは『盛り付け係がちゃんと public だけ皿に乗せるか』『変な物を渡されても落とさないか』を 8 パターンで確認する。画面のテストは『実際に皿（画面）を見て、メールアドレスが出ていないか』を Playwright というロボットに確認させる」。

## 8. 不変条件

CLAUDE.md と整合する不変条件:

1. 既存 API endpoint surface（`GET /public/members/:memberId`）を変更しない
2. D1（データベース）を画面側（`apps/web`）から直接触らない
3. 色は `apps/web/src/styles/tokens.css` 経由のみ（HEX 直書き禁止）
4. 既存の画面部品（primitive）の props を変えない
5. 新しい primitive を作らない（既存 4 primitive の組み合わせだけで作る）
6. 新規 test ファイルは `*.spec.{ts,tsx}` のみ
7. adapter は pure function（I/O・logger を含まない）
8. `process.env.*` を直接参照しない（`getEnv()` 経由のみ）

## 9. 用語集

| 用語 | 意味 |
|------|-----|
| primitive | 画面の最小部品（ボタン、見出し、タグ など） |
| adapter | データ形式を整える橋渡し部品 |
| Server Component | サーバー側で実行される画面部品（Next.js の機能） |
| stableKey | 各項目に付いた変わらない識別子（例: `full_name`） |
| visibility | だれに見せていいかのラベル（public / member / admin） |
| fixture | テスト用の代表データ |
| composition layer | 複数の primitive を組み合わせて 1 つの画面を作る層 |
| 二重防御 | 同じセキュリティ判定を 2 箇所で行うこと（片方バグっても安全） |

## 10. Compliance チェック

- [x] canonical 9 headings 揃っている（§1〜§9）
- [x] 中学生レベルの言葉で説明されている
- [x] 不変条件が明示されている
- [x] 用語集がある
- [x] standalone `docs/30-workflows/serial-06-form-response-binding/` を残していない
- [x] 親 artifacts / outputs artifacts に `serial-06-form-response-binding` を登録済み
- [ ] `mise exec -- pnpm verify:phase12-compliance` が green

## 11. automation-30 compact evidence

30 種の思考法は次の 7 観点へ集約して適用した。小規模 docs/spec 補正のため長文化せず、各カテゴリの判断根拠を evidence として残す。

| 観点 | 適用した思考法 | 判定 |
|------|----------------|------|
| 論理分析 | 批判的思考 / 演繹 / 帰納 / アブダクション / 垂直思考 | task-specification-creator の parent-sub workflow 規則から、standalone root 追加は不整合と演繹。canonical 親配下へ統合する判断が最小修正 |
| 構造分解 | 要素分解 / MECE / 2軸 / プロセス思考 | Phase 1-13 / artifacts / Phase 11 evidence / Phase 12 compliance / aiworkflow inventory を分解し、重複 root と missing parent artifact を検出 |
| メタ抽象 | メタ思考 / 抽象化 / ダブルループ | 「ユーザー指定 path が正本」という前提を再検討し、親 workflow index と既存 serial-05 pattern を正本 topology として採用 |
| 発想拡張 | ブレスト / 水平 / 逆説 / 類推 / if / 素人思考 | 破棄ではなく、詳細仕様を canonical path へ移植して重複 root だけを除去する案が価値保持と複雑性削減を両立 |
| システム | システム思考 / 因果関係分析 / 因果ループ | sub-workflow に strict 7 を複製すると parent/output artifacts と index が drift するため、parent strict7 集約を維持 |
| 戦略価値 | トレードオン / プラスサム / 価値提案 / 戦略的思考 | API / primitive を変えない adapter 方針を維持し、仕様精度を上げながら実装対象の blast radius を最小化 |
| 問題解決 | why / 改善 / 仮説 / 論点 / KJ法 | 論点を path topology、evidence status、test gate、正本同期にクラスタ化。今回サイクル内で補正可能なものは完了 |

## 12. 4条件再検証

| 条件 | 判定 | 根拠 |
|------|------|------|
| 矛盾なし | PASS | `workflow_id=ui-prototype-design-system-foundation` + `sub_workflow=serial-06-form-response-binding` に統一 |
| 漏れなし | PASS | Phase 1-13、adapter/page/fixture/test/evidence/PR gate、親 artifacts 登録を保持 |
| 整合性あり | PASS | path は `docs/30-workflows/ui-prototype-design-system-foundation/serial-06-form-response-binding/` に統一 |
| 依存関係整合 | PASS | `parallel-01..04 → serial-05 → serial-06 → serial-07` の順序と親 strict7 集約を維持 |

## 13. 参照

- 同 sub-workflow Phase 1〜11
- `docs/00-getting-started-manual/specs/01-api-schema.md`
- `docs/00-getting-started-manual/google-form/01-design.md`
- CLAUDE.md「UI prototype alignment / MVP recovery」「フォーム固定値」「重要な不変条件」
- `.claude/skills/task-specification-creator/references/phase-12-spec.md`
