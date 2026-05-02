# Phase 12: ドキュメント close-out / skill feedback

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | apps/web OpenNext Workers CD cutover (task-impl-opennext-workers-migration-001) |
| Phase 番号 | 12 / 13 |
| Phase 名称 | ドキュメント close-out / skill feedback |
| 作成日 | 2026-05-02 |
| 前 Phase | 11（NON_VISUAL 受入検証） |
| 次 Phase | 13（承認ゲート / PR 作成） |
| 状態 | spec_created |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| GitHub Issue | #355（CLOSED） |

## 目的

task-specification-creator の Phase 12 strict 7 files を実体として揃え、本 spec PR が close-out すべき documentation update / unassigned 検出 / skill feedback / compliance check の 7 成果物を確定する。本 workflow は spec_created のため、implementation 実 deploy は follow-up タスクへ委譲し、本 Phase の 7 成果物は **設計・記述レベル**で完結する。

## Strict 7 Files（最低 7 成果物）

| # | ファイル | 状態 | 主要内容 |
| --- | --- | --- | --- |
| 1 | `outputs/phase-12/implementation-guide.md` | spec_created | Part 1 中学生レベル + Part 2 技術者レベル。OpenNext / Workers / wrangler / edge / Pages の 5 用語自己チェック表を含む |
| 2 | `outputs/phase-12/system-spec-update-summary.md` | spec_created | CLAUDE.md スタック表追従 / ADR-0001 status 更新 / specs/ への影響 |
| 3 | `outputs/phase-12/documentation-changelog.md` | spec_created | docs/ 配下の追加・更新履歴を時系列で記録 |
| 4 | `outputs/phase-12/unassigned-task-detection.md` | spec_created | 検出 0 件でも出力必須。実装 follow-up / Logpush 経路再構築 / Pages 物理削除 / production custom domain 切替手動オペ等を formalize |
| 5 | `outputs/phase-12/skill-feedback-report.md` | spec_created | task-specification-creator への CD cutover タスク特殊点記録（NON_VISUAL かつ implementation で deploy なし、配信形態切替の二段戦略等） |
| 6 | `outputs/phase-12/phase12-task-spec-compliance-check.md` | spec_created | task1-5 + Phase 1-11 整合性確認 |
| 7 | `outputs/phase-12/phase12-task-spec-compliance-check.md` | spec_created | strict 7 files / Phase 1-11 / 4 条件 / follow-up 境界の最終確認 |

> 補助として `outputs/phase-12/main.md`（Phase 12 サマリ）を別途作成可能。canonical は上記 7 ファイル。

## Task 1: `implementation-guide.md` 設計

### Part 1: 中学生レベルの概念説明（なぜ先行）

#### 例え話: 「Webサイトを置く場所を引っ越しする」

ホームページを動かすのに、これまでは Cloudflare の「Pages」という建物に置いていました。今回は「Workers」という別の建物（同じ会社が運営する、もっと自由度の高い建物）に引っ越します。

引っ越しのとき大事なのは:

1. 新しい建物にちゃんと荷物（プログラム）を運び込めるか
2. お客さんが訪ねてくる住所（URL）を新しい建物に向け直すこと
3. 何かあったら古い建物にすぐ戻れるように、しばらく古い建物を残しておくこと

このタスクは、この 3 点を確実にやるための **段取り書（runbook）と自動引っ越し装置（CD パイプライン）の整備** です。

#### 専門用語セルフチェック表（5 用語）

| 用語 | 中学生レベルの説明 | 「これを言える」目安 |
| --- | --- | --- |
| **OpenNext** | Next.js（Web サイトを作るための部品セット）を、Cloudflare Workers の建物で動くカタチに **変換するための工具箱** | 「OpenNext は Next.js を Workers 用に翻訳するもの」と言える |
| **Workers** | Cloudflare の **小さく速いプログラム実行サービス**。世界中のサーバに同じプログラムをばらまいて、どこからアクセスされても近くで動く | 「Workers は世界中で同じプログラムを動かす仕組み」と言える |
| **Pages** | Cloudflare の **静的サイト寄りのホスティング**。今まで使っていた古い方の建物 | 「Pages は元々のホスティング、Workers の前世代」と言える |
| **wrangler** | Workers を操作するための **コマンドライン道具**。「deploy」「rollback」のような命令で建物を操作する | 「wrangler は Workers を動かす道具」と言える |
| **edge** | サーバが世界中に散らばっていて、ユーザーから **物理的に近い場所**で処理する仕組み。Workers はこの edge で動く | 「edge は近所のサーバで動かすこと」と言える |

#### このタスクで何が変わる？（中学生レベル）

- 変わる: ホームページを置く場所（Pages → Workers）
- 変わる: 引っ越しの手順書（runbook）が新しくできる
- 変わる: 自動引っ越し装置（CD）が新しい場所に運び込むようになる
- 変わらない: ホームページの **見た目・URL・機能**（だから screenshot は不要）

### Part 2: 技術者レベル（詳細）

#### OpenNext build pipeline

```
apps/web (Next.js source)
  ├─ pnpm --filter @ubm-hyogo/web build:cloudflare
  │    ├─ opennextjs-cloudflare build
  │    │    ├─ next build (内部で実行)
  │    │    └─ .open-next/{worker.js, assets/, ...} を生成
  │    └─ node ../../scripts/patch-open-next-worker.mjs
  │         （Cloudflare Workers 互換のための後処理）
  └─ artifact: apps/web/.open-next/
       ├─ worker.js   ← wrangler.toml `main` の参照先
       └─ assets/     ← wrangler.toml `[assets].directory` の参照先
```

#### wrangler deploy mechanism

- `wrangler deploy --env staging`:
  - `apps/web/wrangler.toml` の `[env.staging]` セクションを起点に
  - `name = ubm-hyogo-web-staging` の Worker script として `.open-next/worker.js` を upload
  - `[assets]` セクションに従い `.open-next/assets/` を Workers KV-backed asset store へ upload
  - `[[env.staging.services]]` の `API_SERVICE` binding を解決
  - `[env.staging.observability]` を有効化
  - 完了時に `Current Version ID: <UUID>` を出力（rollback 起点）

#### binding migration

| binding | 旧（Pages） | 新（Workers） | 出典 |
| --- | --- | --- | --- |
| ASSETS | Pages 内部で自動 | `[assets] binding = "ASSETS"` | wrangler.toml |
| API_SERVICE | Pages の Functions binding | `[[env.<stage>.services]]` で service binding | wrangler.toml |
| 環境変数 | Pages の environment variables | `[env.<stage>.vars]` | wrangler.toml |

#### DNS 切替（production のみ）

1. Workers script `ubm-hyogo-web-production` の Custom Domains に target hostname を Add
2. SSL 証明書発行待ち（5 分目安）
3. Pages project の Custom Domains から該当 hostname を Remove
4. `dig` / `curl -v` で TLS 証明書発行元と CNAME ターゲットが Workers 側に切替わったことを確認

#### CD パイプライン差分

Phase 2 web-cd-diff.md 参照。要点:
- build step: `build` → `build:cloudflare`
- deploy step: `pages deploy .next ...` → `deploy --env <stage>`
- `vars.CLOUDFLARE_PAGES_PROJECT` 参照削除

#### rollback 戦略（二段）

1. 一次（推奨）: `bash scripts/cf.sh rollback <VERSION_ID> --config apps/web/wrangler.toml --env <stage>`
2. 二次（cutover 直後 dormant 期間内のみ）: 旧 Pages project の Resume Deployments → custom domain re-attach

## Task 2: `system-spec-update-summary.md` 設計

| 対象 | 更新内容 | 反映先 |
| --- | --- | --- |
| `CLAUDE.md` スタック表 | 「Web UI: Cloudflare Workers + Next.js App Router via `@opennextjs/cloudflare` (`apps/web`)」に既に整合済。**追加変更なし** | — |
| `docs/00-getting-started-manual/specs/00-overview.md` | 配信形態 Pages → Workers の事実を反映 | 影響あり（実装 follow-up で更新） |
| ADR-0001（OpenNext on Workers 採用） | status を `Accepted` から `Implemented (CD cutover via task-impl-opennext-workers-migration-001)` へ更新 | 実装 follow-up で更新 |
| `docs/00-getting-started-manual/specs/08-free-database.md` | D1 binding に変更なし（apps/api 経由は維持） | 影響なし |
| `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare-opennext-workers.md` | 本 task の runbook へのリンク追加 | 実装 follow-up で追記 |

## Task 3: `documentation-changelog.md` 設計

| 日時 | ファイル | 種別 | 概要 |
| --- | --- | --- | --- |
| 2026-05-02 | `docs/30-workflows/issue-355-opennext-workers-cd-cutover-task-spec/phase-01.md` 〜 `phase-13.md` | 追加 | Phase 1-13 タスク仕様書を作成 |
| 2026-05-02 | `outputs/phase-12/implementation-guide.md` | 追加 | 中学生レベル + 技術者レベル ガイド |
| 2026-05-02 | `outputs/phase-05/cutover-runbook.md` | 参照 | Cloudflare side runbook 正本。Phase 12 には別名 runbook を作成しない |
| 2026-05-02 | `outputs/artifacts.json` | 追加 | Phase 1-13 メタ情報 |
| TBD（実装 follow-up） | `.github/workflows/web-cd.yml` | 更新 | build:cloudflare + wrangler deploy 切替 |
| TBD（実装 follow-up） | ADR-0001 status | 更新 | Implemented へ |

## Task 4: `unassigned-task-detection.md` 設計（0 件でも出力必須）

| # | 検出タスク | 起票推奨先 | 関連 |
| --- | --- | --- | --- |
| U-1 | 実装 follow-up（CD 改修 PR 実行 + staging cutover + production cutover） | 別 Issue で fork（Issue #355 は CLOSED のため再 open しない） | AC-1〜AC-6 実測 PASS |
| U-2 | production custom domain 切替手動オペレーション実行 | runbook S4 を実行する手動運用タスク。実装 follow-up に内包可 | AC-6 / RISK-2 |
| U-3 | Pages project 物理削除（dormant 期間 2 週間後） | UT-28 系列 / 別タスクで委譲 | runbook S6 |
| U-4 | Logpush 経路再構築（Pages → Workers 切替に伴う log destination 再配線） | 別 unassigned タスクで起票 | 観測継続性 |
| U-5 | UT-29（API CD パイプライン）との job 構造整合性レビュー | 別タスク（軽量） | governance |

> 0 件 placeholder ではなく、5 件を formalize する。

## Task 5: `skill-feedback-report.md` 設計

CD cutover タスクの特殊点（task-specification-creator への feedback）:

| # | 観察 | 改善案 |
| --- | --- | --- |
| F-1 | implementation かつ NON_VISUAL かつ「実 deploy は spec PR では行わない」という三重条件は珍しい。Phase 11 の「設計レベル PASS / 実測 PASS 分離」テンプレが docs-only タスクと implementation タスクで共通化できる | references に「deploy-deferred implementation pattern」を 1 セクション追加 |
| F-2 | 配信形態切替（Pages → Workers）は wrangler.toml が既に整備済で、実体差分が `web-cd.yml` 1 ファイル + runbook のみ。「既実装状態調査（P50）」が他タスクより重要 | Phase 1 テンプレで「既実装状態調査」をより目立たせる |
| F-3 | rollback 二段戦略（wrangler / Pages dormant）は infra 系 cutover タスクに頻出パターン。Phase 11 evidence に E-5 rollback-readiness 型を標準化 | references に rollback-readiness テンプレ追加 |
| F-4 | GitHub Issue が CLOSED のまま spec を作るケース（user 明示指示）への対応。`Refs #` / `Closes` 使い分け、再 open 禁止方針が明確に必要 | Phase 13 テンプレに「CLOSED issue への対応分岐」を追記 |
| F-5 | 5 用語セルフチェック表（OpenNext / Workers / Pages / wrangler / edge）の網羅性は適切。implementation-guide テンプレで 5 用語を標準化したい | 中学生レベル説明テンプレに用語数の下限指針を追加 |

> no-op ではなく、本タスク特有の 5 件を promotion target として記録。

## Task 6: `phase12-task-spec-compliance-check.md` 設計

| 観点 | 確認項目 | 判定 |
| --- | --- | --- |
| Task 1 整合 | Phase 1 AC が implementation-guide Part 2 に反映 | PASS |
| Task 2 整合 | system-spec-update-summary が CLAUDE.md スタック表 / ADR-0001 / specs/ に対応 | PASS |
| Task 3 整合 | documentation-changelog が時系列で 6 行以上 | PASS |
| Task 4 整合 | unassigned-task-detection が 0 件 placeholder ではなく 5 件 formalize | PASS |
| Task 5 整合 | skill-feedback-report が no-op ではなく 5 件記録 | PASS |
| Phase 1 整合 | AC-1〜AC-6 / RISK-1〜RISK-5 が後続 Phase で参照 | PASS |
| Phase 2 整合 | wrangler.toml 最終形 / web-cd.yml 差分 / runbook 設計骨子が後続 Phase で展開 | PASS |
| Phase 3 整合 | NG-1〜NG-5 が Phase 11 evidence にマップ | PASS |
| Phase 11 整合 | E-1〜E-5 が AC に対応 | PASS |
| Strict files 整合 | 7 ファイルが揃う | PASS |

## Runbook 正本境界

Phase 12 strict 7 files に `post-promotion-runbook.md` は含めない。Cloudflare side runbook の正本は Phase 5 `outputs/phase-05/cutover-runbook.md` とし、Phase 12 は `implementation-guide.md` / `system-spec-update-summary.md` から参照する。二重管理を避けるため、Phase 12 配下に runbook 別名ファイルは作成しない。

Phase 5 runbook は 6 セクション構成とする:

### S1. 前提
- 対象環境（staging / production）と URL
- 必要権限（Cloudflare API Token scope: Workers Scripts:Edit / Workers Routes:Edit / Zone:Read（Pages:Edit は dormant 操作用の別承認 token のみ））
- `bash scripts/cf.sh whoami` で認証通過

### S2. staging cutover 手順
1. `dev` ブランチに本タスク改修を merge → `web-cd / deploy-staging` 自動起動
2. CD 内で `bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env staging` 相当を実行
3. `https://ubm-hyogo-web-staging.<account>.workers.dev` の HTTP 200 確認
4. UT-06 Phase 11 smoke S-01〜S-10 を staging URL に対し実行
5. 旧 staging Pages project の Pause Deployments

### S3. production cutover 手順
1. AC-3 staging 全 smoke PASS gate 通過後のみ
2. `main` merge → `web-cd / deploy-production` 自動起動
3. `wrangler deploy --env production` 完了確認、`VERSION_ID` 記録
4. custom domain 移譲（S4）
5. production smoke 再実行

### S4. custom domain 移譲
1. Workers script `ubm-hyogo-web-production` の Custom Domains に target を Add
2. SSL 証明書発行待ち
3. 旧 Pages project の Custom Domains から該当を Remove
4. `dig` / `curl -v` で TLS 切替確認
- staging は `*.workers.dev` 完結のため対象外

### S5. rollback 手順
- 一次: `bash scripts/cf.sh rollback <VERSION_ID> --config apps/web/wrangler.toml --env <stage>`
- 二次（dormant 期間内のみ）: Pages project Resume Deployments → custom domain re-attach
- 通知: Issue / Slack 記録テンプレ

### S6. Pages dormant 期間運用
- 期間: cutover 完了後 2 週間
- 期間中: Pages project は Pause Deployments、custom domain unbind
- 期間後: Pages project delete（手動）

## 統合テスト連携

| 連携先 | 連携内容 |
| --- | --- |
| Phase 11 | E-1〜E-5 設計を implementation-guide / system-spec-update-summary に転記 |
| Phase 13 | strict 7 files 揃いを承認 gate の入力に |
| 親タスク群 | UT-28（配信形態決定） / UT-29（API CD） / ADR-0001 へ status 反映 |
| 後続 unassigned | U-1〜U-5 の起票方針を反映 |

## 多角的チェック観点

- 価値性: 7 strict files で documentation close-out 完了
- 実現性: spec_created 範囲で 7 ファイル全て記述可能
- 整合性: Phase 1-11 と矛盾なし
- 運用性: Phase 5 cutover-runbook が Cloudflare 側手動オペを完全カバー
- Secret hygiene: implementation-guide / runbook に実値 token を含めない

## 完了条件

- [ ] strict 7 files の実体が `outputs/phase-12/` に配置
- [ ] implementation-guide が Part 1（中学生レベル + 5 用語表）+ Part 2（技術詳細）構成
- [ ] system-spec-update-summary が CLAUDE.md / ADR-0001 / specs/ への影響を網羅
- [ ] documentation-changelog が時系列記載
- [ ] unassigned-task-detection が 0 件 placeholder ではなく 5 件 formalize
- [ ] skill-feedback-report が no-op ではなく 5 件記録
- [ ] phase12-task-spec-compliance-check が task1-5 + Phase 1-11 整合性を PASS で記録
- [ ] Phase 5 cutover-runbook が 6 セクション存在
- [ ] root / outputs artifacts parity 維持

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| guide | outputs/phase-12/implementation-guide.md | Part 1 + Part 2 |
| spec | outputs/phase-12/system-spec-update-summary.md | CLAUDE.md / ADR / specs 影響 |
| history | outputs/phase-12/documentation-changelog.md | 時系列更新履歴 |
| unassigned | outputs/phase-12/unassigned-task-detection.md | 5 件 formalize |
| feedback | outputs/phase-12/skill-feedback-report.md | 5 件 promotion target |
| compliance | outputs/phase-12/phase12-task-spec-compliance-check.md | Task1-5 + Phase 1-11 整合 |
| main | outputs/phase-12/main.md | Phase 12 集約サマリ |

## 次の Phase

Phase 13: 承認ゲート / PR 作成（user 承認まで blocked）
