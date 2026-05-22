# Phase 1: 要件定義

[実装区分: 実装仕様書]

> 判定根拠: `docs/00-getting-started-manual/specs/09-ui-ux.md` を契約のみ版へ全面書き換える物理的成果物が存在し、`grep gate`（§6.2）/ `trace check`（§6.4）/ 19 routes 網羅という決定論的検証で AC を判定する。docs-only ではなく実装仕様書として扱う。

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | ui-ux-contract-rewrite |
| Wave | 2 |
| 実行種別 | parallel |
| Phase 番号 | 1 / 13 |
| 作成日 | 2026-05-07 |
| 上流 Phase | なし |
| 下流 Phase | 2 (設計) |
| 状態 | completed |

## 目的

本タスクの真の論点（true issue）と依存境界、4 条件（価値性 / 実現性 / 整合性 / 運用性）を確定し、scope と AC を CLAUDE.md 不変条件 #2 / #3 / #5 / #6 と整合させる。後続 task-09（tailwind）/ task-10（primitives）/ task-11..17（各画面）/ task-19..22（09c..09h 詳細仕様）が「contract 1 行 → 実装 1 ファイル」の決定論的対応で並列実装可能となる土台を Phase 1 で固定する。

## 真の論点（true issue）

- **issue 1**: 現行 `09-ui-ux.md` 160 行は視覚詳細（Hero 構成順序 / 密度切替値 / KPI 文言 / 行範囲 / 余白値）と契約（props / state / a11y）が混在しており、grep で「ある画面の API 接続」「ある primitive の variants」を一意に取り出せない。後続 22 並列タスクが衝突なく進むには「契約 only」と「視覚詳細」の物理分離が必須。
- **issue 2**: 視覚詳細値（HEX / oklch / px / `bg-[#...]`）が `09-ui-ux.md` に残ると、task-08（09b 設計トークン）と二重正本になり、token 値変更時に同期事故が起きる。token 値の決定権は 09b に一元化し、09-ui-ux.md は token 名 prefix 参照のみにする必要がある。
- **issue 3**: prototype の EDITMODE 専用要素（TweaksPanel / theme switcher / AvatarStoreProvider の localStorage / `data-theme="warm"/"cool"`）と gas-prototype 由来挙動が「採用 or 不採用」の判定なくドキュメントに残っており、CLAUDE.md 不変条件 #6（GAS prototype 非昇格）と衝突する。§4.6 で明示削除リストを正本化する必要がある。
- **issue 4**: login 5 状態（input / sent / unregistered / deleted / error）と申請 server-pending state、dialog/drawer の WAI-ARIA Authoring Practices 準拠（`role="dialog" + aria-modal="true" + focus trap + Esc close`）が現行ドキュメントに散在しており、a11y 仕様が grep 不可。Phase 1 で「正本見出しを §4.2 / §4.3 / §5.2 に集約する」ことを要件化する。

## 依存境界

- **正本責務境界**: 契約（props / state / a11y / token 参照名 / API 接続）= `09-ui-ux.md`、視覚詳細値 = `09b-design-tokens.md`、prototype mapping = `09a-prototype-map.md`、primitive 完全仕様 = `09c-primitives.md`、screen blueprint = `09e/09f/09g`、icon = `09d`、shell + fixture = `09h`、component の正解スクリーンショット = Storybook VRT 画像。
- **API 接続境界**: API 接続表は `phase-3.md §2` を正本転記し、route × endpoint × method の 3 タプルを 1 字も改変しない。新 endpoint 追加 / D1 schema 変更 / Google Form 仕様変更は禁止。
- **token 名境界**: `--ubm-color-*` / `--ubm-radius-*` / `--ubm-shadow-*` / `--ubm-space-*` / `--ubm-text-*` / `--ubm-font-*` / `--ubm-dur-*` / `--ubm-ease-*` の正規 prefix 名のみ参照。値は記述しない。
- **D1 境界**: `apps/web` から D1 直接アクセス禁止（CLAUDE.md 不変条件 #5）。契約上も `apps/api` 経由のみ記述。

## 価値とコスト

| 観点 | 内容 |
| --- | --- |
| 初回価値 | 後続 task-09 / 10 / 11..17 / 19..22 が「契約 1 行 → 実装 1 ファイル」で並列着手可能。grep で「ある routes の API」「ある primitive の variants」を一意取得できる。 |
| 払うコスト | 19 routes × 統一列構成の表を機械的に書き切る筋力、prototype.jsx 約 2,000 行から契約抽出する読解工数 |
| 払わないコスト | token 値の決定（task-08）/ prototype 行範囲 mapping（task-07）/ 実装コード変更（task-09 以降）/ 09c..09h の詳細記述（task-19..22） |

## 4 条件評価

| 条件 | 問い | 判定 | 根拠 |
| --- | --- | --- | --- |
| 価値性 | 後続 task-09 / 10 / 11..17 / 19..22 を並列着手可能にできるか | PASS | 契約と視覚詳細の物理分離で 22 並列タスクの衝突がなくなる |
| 実現性 | 1 サイクルで完了するか（CONST_007） | PASS | 1.0 人日想定。書き換え 1 ファイルのみ、新規作成・削除なし |
| 整合性 | branch / env / runtime / data / secret / 不変条件と矛盾しないか | PASS | secrets 不使用。CLAUDE.md 不変条件 #2 / #3 / #5 / #6 を §2 / §4.6 で明示参照 |
| 運用性 | rollback / handoff / same-wave sync が成立するか | PASS | git revert で完全 rollback 可。task-07 / 08 と link path のみで疎結合。Phase 12 で implementation-guide を残す |

## 実行タスク

1. 真の論点 4 件（issue 1〜4）を outputs/phase-01/main.md に明文化する
2. 依存境界 4 区分（正本責務 / API 接続 / token 名 / D1）を確定する
3. 19 routes（公開 6 + 会員 2 + 管理 8 + 共通 3）+ `global-error.tsx` fallback の網羅性を phase-1.md / phase-3.md と突合する
4. primitives 13 + feature components 一覧の網羅性を phase-2.md と突合する
5. CLAUDE.md 不変条件 #2 / #3 / #5 / #6 を後続 Phase の多角的チェック観点へ伝播する素地を作る
6. AC-1〜AC-14 が quantitative（exit 0 / 件数 / grep 0 件）であることを確認する

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/00-getting-started-manual/specs/09-ui-ux.md（現行 160 行） | 書き換え前ベース |
| 必須 | docs/30-workflows/ui-prototype-alignment-mvp-recovery/outputs/phase-1/phase-1.md | 19 routes 一覧 |
| 必須 | docs/30-workflows/ui-prototype-alignment-mvp-recovery/outputs/phase-2/phase-2.md | primitives + feature components 列挙 |
| 必須 | docs/30-workflows/ui-prototype-alignment-mvp-recovery/outputs/phase-3/phase-3.md | API 接続表 / 未掲載画面派生ルール |
| 必須 | CLAUDE.md | 不変条件 #2 / #3 / #5 / #6 / UI prototype alignment セクション |
| 参考 | docs/00-getting-started-manual/claude-design-prototype/{primitives,pages-public,pages-member,pages-admin,app}.jsx | 契約抽出元 |

## 多角的チェック観点（不変条件参照）

- **#2（consent キー統一）**: §2 register / profile 表で `publicConsent` / `rulesConsent` の 2 種のみ参照することを Phase 1 で要件化
- **#3（responseEmail は system field）**: §2 profile / admin members 表で system field として記述する素地を Phase 1 で確保
- **#5（apps/web → D1 禁止）**: §2 全 routes の API 列で `apps/api` 経由のみ記述することを Phase 1 で要件化
- **#6（GAS prototype 非昇格）**: §4.6 で gas-prototype 由来挙動を不採用明示することを Phase 1 で要件化
- **a11y**: dialog / drawer / form / live region の WAI-ARIA Authoring Practices 準拠を §5 で要件化
- **正本順位**: SCOPE.md → phase-1/2/3.md → 既存 specs → prototype の優先度を Phase 1 で確認

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 真の論点 4 件確定 | 1 | completed | issue 1〜4 を outputs/phase-01/main.md へ |
| 2 | 依存境界 4 区分明文化 | 1 | completed | 正本責務 / API / token / D1 |
| 3 | 4 条件 PASS 判定 | 1 | completed | 全条件 PASS の根拠記述 |
| 4 | AC-1〜AC-14 quantitative 化 | 1 | completed | 全 AC が exit code / 件数で判定可能 |
| 5 | 不変条件マッピング | 1 | completed | #2 / #3 / #5 / #6 を全 Phase に伝播 |
| 6 | 19 routes / primitives 網羅性突合 | 1 | completed | phase-1.md / phase-2.md と突合 |
| 7 | outputs 作成 | 1 | completed | outputs/phase-01/main.md |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 2 | 真の論点 → 章立て差分・テーブル列構成の入力 |
| Phase 4 | AC → verify suite（grep gate / markdown lint / trace check）の入力 |
| Phase 7 | AC マトリクスのトレース元 |
| Phase 10 | GO/NO-GO の根拠 |
| Phase 12 | implementation-guide.md の根拠 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-01/main.md | 真の論点 / 依存境界 / 価値とコスト / 4 条件評価 / 不変条件マッピング |
| メタ | artifacts.json | Phase 1 を completed に更新 |

## 完了条件

- [ ] 真の論点 4 件、依存境界 4 区分、4 条件 PASS、AC-1〜AC-14、不変条件 #2 / #3 / #5 / #6 が outputs/phase-01/main.md に明記
- [ ] 不変条件 #2 / #3 / #5 / #6 が後続 Phase の「多角的チェック観点」に伝播される素地が整っている
- [ ] index.md の「含む」「含まない」と乖離しない
- [ ] 19 routes（公開 6 + 会員 2 + 管理 8 + 共通 3）+ `global-error.tsx` fallback と primitives 13 + feature components の網羅性が phase-1.md / phase-2.md / phase-3.md と一致

## タスク 100% 実行確認【必須】

- [ ] 全実行タスク（7 件）が completed
- [ ] outputs/phase-01/main.md が指定パスに配置済み
- [ ] AC-1〜AC-14 が quantitative
- [ ] 不変条件 #2 / #3 / #5 / #6 が明記
- [ ] 4 条件評価が全 PASS
- [ ] artifacts.json の phase 1 を completed に更新

## 次 Phase

- 次: Phase 2（設計）
- 引き継ぎ事項: 真の論点 4 件 → 章立て差分（§1〜§10）/ §2 routes 表列構成 / §3 component 表列構成 / §4.5 prototype 由来契約 19 行
- ブロック条件: outputs/phase-01/main.md が未作成なら Phase 2 着手不可
