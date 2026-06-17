# Phase 12: skill feedback report

`[実装区分: 実装仕様書]`

## メタ情報

| 項目 | 値 |
| --- | --- |
| workflow_id | `profile-me-404-authenticated-admin-recovery` |
| Phase | 12 / 13 |
| taskType | implementation |
| visualEvidence | VISUAL_ON_EXECUTION |
| workflow_state | `implemented_local_runtime_pending` |

## 目的

task-specification-creator / aiworkflow-requirements の運用で得た、テンプレート観点・ワークフロー観点・ドキュメント観点の気づきを記録する。改善点なしでも出力する。本ワークフローは「web↔api の片側のみ自動 CD という構造欠陥（D-A）を起点に、サブ原因未確定のまま S1/S2 のどちらでも復旧する多層防御を 1 サイクルで仕様化する」recovery 型タスクであり、CD パイプラインの非対称性を spec 段階で検知できる項目の有無が固有の論点だった。

## テンプレート観点

| 気づき | 内容 | アクション |
| --- | --- | --- |
| spec 段階の inventory に「CD ワークフロー有無」確認項目があると構造欠陥を早期検知できる | 本 WF の最有力サブ原因 S1（api-staging deploy/route ドリフト）の構造的素因は D-A（`web-cd.yml` は apps/web のみ deploy し apps/api には自動 CD が皆無）だった。これは `ls .github/workflows` で grep すれば即判明するが、Phase 1 の inventory 段階で「各 deploy 単位（apps/web / apps/api）に自動 CD が存在するか」を確認する項目があれば、障害発生前に構造欠陥として検知できた。**web↔api のような片側自動・片側手動という非対称 CD は、境界障害（/me 404 等）を反復生成する強化ループ R1 の素因**であり、recovery でなく予防として spec 段階で拾える | 提案: task-specification-creator の Phase 1 inventory チェックに「deploy 単位ごとの自動 CD 有無」項目を加える候補（今回は WF 内で D-A として吸収・必須改善ではない） |
| 「サブ原因未確定でも復旧する多層防御」recovery テンプレ | 観測 404 の data-cause は staging ランタイムログでのみ最終確定できる（S1 か S2 か）。本 WF は「S1/S2 のどちらでも復旧する共通対策（T02 api 自動 CD で route を最新化）＋ ログだけで一意特定する観測性（T01/T03/T04）」を today's fix とし、確定は deploy 後の RT-E に置いた。**「サブ原因列挙 → 全サブ原因をカバーする共通対策 → 確定は deploy 後」の recovery テンプレ**は再利用価値が高い | 既存運用で吸収（WF 内に反映済・先行 `profile-session-staging-transport-recovery` でも同型） |
| VISUAL_ON_EXECUTION × implemented_local_runtime_pending の Phase 11 証跡 3 分割 | NON_VISUAL のコード変更（API ログ / CI/CD / 診断 / web transport ログ）で UI 描画が不変のため、「現象 screenshot=user-provided（文中参照・n/a）/ 復旧後 PNG=pending（user-gated）/ 手順 doc=present」の 3 分割が compliance §4 の厳密トークンと整合する | 既存テンプレ（phase12-task-spec-compliance-template.md）で吸収済 |

## ワークフロー観点

| 気づき | 内容 | アクション |
| --- | --- | --- |
| UI 文言の専用性からの仮説空間圧縮 | `MEMBER_SESSION_404` 専用文言（`session-error-display.ts:24-31`）が表示されている事実だけで、(a) 401 ではない（401 なら redirect・F-3）(b) `/me` が HTTP 404 を返した（F-2）を確定でき、ユーザー提供スクショ単体で仮説を route 層（S1/S2）へ圧縮できた。「status 別の専用文言 × 表示事実」での仮説除外は調査コストが極小 | 提案: 診断パターン候補（任意・今回は WF 内に反映） |
| secret 非漏洩の二重防御（命名 + boolean 化） | notFound 診断ログで「鍵を持っていたか」を記録する際、`hasAuthorization`/`hasSessionCookie` という boolean 名にすることで `@ubm-hyogo/shared/logging` の `SENSITIVE_KEY_SUBSTRINGS` redaction の誤発火を避けつつ、値を boolean 化して二重に secret 非漏洩を担保する設計は、観測性追加時の汎用パターン | 既存運用で吸収（T01 §4.1.1 で固定） |

## ドキュメント観点

| 気づき | 内容 | アクション |
| --- | --- | --- |
| ログ 3 軸での排他判定フロー | `API notFound の method+path`（route 未マッチか）× `web transportKind`（service-binding/http）× `認証 /me の status`（200/401/410）の 3 軸で S1〜S3 を排他判定するフロー（Phase 11 RT-E）を仕様書段階で固定したことで、staging runtime 検証者が判断に迷わない構造になった | 既存運用が良好・新規改善要求なし |

## 改善要求サマリ

- **緊急の skill 改善要求: 反映済み。** `implementation / VISUAL_ON_EXECUTION` かつ具体的な実装対象が明確な recovery workflow を `implemented_local_runtime_pending` のまま閉じないため、task-specification-creator / aiworkflow-requirements の最新履歴に本実例を同期した。
- **将来提案: 2 件（任意・promotion target を明記）。**
  - (1) task-specification-creator の Phase 1 inventory に「deploy 単位ごとの自動 CD 有無」確認項目を追加（promotion target: `task-specification-creator` reference・no-op reason: 本 WF は D-A として WF 内で吸収済・evidence path: 本ファイル「テンプレート観点」+ `_shared-context.md` F-8/D-A）。
  - (2) 「status 別専用文言 × 表示事実による仮説除外」を診断パターン化（promotion target: `aiworkflow-requirements/references/lessons-learned*.md`・no-op reason: 本 WF 内に F-1〜F-3 として反映済・evidence path: 本ファイル「ワークフロー観点」）。
  - いずれも本 WF 内に反映済で、緊急の skill 更新は不要。

## 完了条件

- [x] テンプレート / ワークフロー / ドキュメントの 3 観点で記録
- [x] 「web↔api の片側のみ自動 CD という構造欠陥は spec 段階の inventory で CD ワークフロー有無を確認する項目があると早期検知できる」気づきを記録
- [x] 改善要求サマリ（緊急なし・将来提案 2 件・promotion target / no-op reason / evidence path 付き）を記録

## 成果物

- `outputs/phase-12/skill-feedback-report.md`（本ファイル）

## 参照資料

- `_shared-context.md` §1（F-1〜F-9・F-8 CD 不在）/ §2（S1〜S3）/ §3（因果ループ R1）
- `outputs/phase-11/manual-test-result.md`（RT-E 排他判定フロー）
- `.claude/skills/task-specification-creator/assets/phase12-task-spec-compliance-template.md`
