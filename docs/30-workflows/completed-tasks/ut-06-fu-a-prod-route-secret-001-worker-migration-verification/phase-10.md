# Phase 10: 最終レビュー

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | apps/web production Worker route / secret / observability 移行確認 (UT-06-FU-A-PROD-ROUTE-SECRET-001) |
| Phase 番号 | 10 / 13 |
| Phase 名称 | 最終レビュー（Final Review Gate） |
| 作成日 | 2026-04-30 |
| 前 Phase | 9 (品質保証 / runbook 検証) |
| 次 Phase | 11 (NON_VISUAL 手動検証) |
| 状態 | spec_created |
| タスク分類 | infrastructure-verification（docs-only / final review gate） |
| taskType | docs-only |
| visualEvidence | NON_VISUAL |
| user_approval_required | **true**（本 Phase は最終レビューゲート。承認まで Phase 11 着手禁止） |
| GitHub Issue | #246（CLOSED 状態のままで OK・本タスクは spec_created） |

## 目的

Phase 1〜9 で蓄積した正本仕様読解・ギャップ整理・runbook 設計・チェックリスト整備・AC マトリクス・DRY 化・QA 結果の各成果物を横断レビューし、UT-06-FU-A-PROD-ROUTE-SECRET-001 の **AC1〜AC5（正本 §2.2）** がすべて達成可能な spec に到達しているかを確定する。本タスクは **production deploy を実行しないスコープ**であり、runbook 文書整備と検証手順の正本化のみを成果物とする。MAJOR 検出時は Phase 8（DRY 化）/ Phase 9（QA）への戻りフローを明示し、ユーザー承認を以て Phase 11 へ進行する。

## 実行タスク

1. AC1〜AC5（正本 §2.2）の達成状態を spec_created 視点で評価する（完了条件: 全件に「未適用だが runbook 確定」「runbook 未確定」のいずれかが付与）。
2. 4条件（価値性 / 実現性 / 整合性 / 運用性）に対する最終判定を確定する（完了条件: PASS/MINOR/MAJOR が一意に決定）。
3. CLAUDE.md「wrangler 直接実行禁止」整合性を確認する（完了条件: runbook 内のすべての CLI が `bash scripts/cf.sh` 経由）。
4. aiworkflow-requirements `references/deployment-cloudflare.md` との整合性を確認する（完了条件: production Worker 名 / route / secret / observability 検証フローの追記方針が一致）。
5. **production deploy 実行を含まないスコープ境界**が runbook に明記されていることを確認する（完了条件: 「本タスクは deploy を実行しない」「DNS 切替は別タスク」が明文化）。
6. **rollback 余地（旧 Worker 早期削除禁止）**が runbook に明記されていることを確認する（完了条件: P7 旧 Worker 処遇記録セクションに「安定確認まで残置」が明示）。
7. **secret 値・OAuth トークン値の漏洩がないか**を runbook 全体で確認する（完了条件: key 名のみ記録 / 値の転記禁止が明記、`.env` Read 禁止が再掲）。
8. MAJOR 検出時の Phase 8/9 への戻りフローを定義する（完了条件: 戻り先 Phase と再評価条件が記述）。
9. ユーザー承認ゲート: 承認まで Phase 11 着手禁止を明文化する（完了条件: 承認手順と承認証跡パスが記述）。
10. GO/NO-GO 判定を確定し、`outputs/phase-10/go-no-go.md` を生成する（完了条件: GO/NO-GO の根拠と署名欄が記述）。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/unassigned-task/UT-06-FU-A-production-route-secret-observability.md | 正本仕様（AC1〜AC5 / scope / 苦戦箇所） |
| 必須 | docs/30-workflows/ut-06-fu-a-prod-route-secret-001-worker-migration-verification/phase-07.md | AC × 検証 × runbook トレース |
| 必須 | docs/30-workflows/ut-06-fu-a-prod-route-secret-001-worker-migration-verification/phase-08.md | DRY 化結果 |
| 必須 | docs/30-workflows/ut-06-fu-a-prod-route-secret-001-worker-migration-verification/phase-09.md | QA 結果（runbook 通読 / dry-run） |
| 必須 | docs/30-workflows/ut-06-fu-a-prod-route-secret-001-worker-migration-verification/index.md | AC / 不変条件 / scope |
| 必須 | CLAUDE.md（プロジェクトルート）| Cloudflare 系 CLI 実行ルール / wrangler 直接実行禁止 |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md | scripts/cf.sh / Worker / route / secret / observability 正本 |
| 必須 | apps/web/wrangler.toml | `[env.production].name = "ubm-hyogo-web-production"` 確認 |
| 参考 | docs/30-workflows/ut-06-followup-A-opennext-workers-migration/ | 親タスク runbook |
| 参考 | docs/30-workflows/ut-04-d1-schema-design/phase-10.md | 最終レビュー参照事例 |

## レビュー観点（最終）と結果テーブル

> **評価基準**: spec_created 段階のため、「runbook が production deploy 承認直前に実行可能な粒度に到達しているか」「実 deploy・実 secret 値・実トラフィックを伴わずに verify 可能か」で判定する。

### AC × 達成状態

| AC | 内容（正本 §2.2 より） | 達成状態（spec_created 時点） | 仕様確定先 | 判定 |
| --- | --- | --- | --- | --- |
| AC1 | production deploy 前チェックリスト（route / custom domain / secrets / observability）が runbook に追記される | 未適用だが runbook 確定 | Phase 5 runbook + Phase 7 AC matrix | PASS |
| AC2 | `bash scripts/cf.sh secret list --config apps/web/wrangler.toml --env production` の出力スナップショットが取得され、想定 secret 一覧と差分が 0 | 未適用だが runbook 確定（key 名のみ記録ルール明記） | Phase 5 §3.3 secret snapshot | PASS |
| AC3 | route / custom domain が新 Worker (`ubm-hyogo-web-production`) を指していることがダッシュボード or API で確認される | 未適用だが runbook 確定 | Phase 5 §3.2 route 突合 | PASS |
| AC4 | `bash scripts/cf.sh tail --config apps/web/wrangler.toml --env production` が新 Worker を tail できることが deploy 直後に確認される | 未適用だが runbook 確定（deploy 後手順として明示） | Phase 5 §3.4 observability 確認 | PASS |
| AC5 | 旧 Worker が残っている場合、無効化 / 削除 / route 切り戻しのいずれかの判断が記録される | 未適用だが runbook 確定（rollback 余地確保のため安定確認まで残置） | Phase 5 §3.5 旧 Worker 処遇記録 | PASS |

### 観点 × 状態 × 証跡パス（最終レビュー観点マトリクス）

| # | レビュー観点 | 状態 | 証跡パス | 判定 |
| --- | --- | --- | --- | --- |
| R-1 | AC1〜AC5 の実 evidence 添付状態（spec_created では runbook 内 placeholder としての記述） | spec 確定 | outputs/phase-07/ac-matrix.md | PASS |
| R-2 | CLAUDE.md「wrangler 直接実行禁止」整合（runbook 内 CLI が全て `bash scripts/cf.sh` 経由） | spec 確定 | outputs/phase-05/runbook.md（grep で `wrangler ` 直呼び 0 件） | PASS |
| R-3 | aiworkflow-requirements `deployment-cloudflare.md` との整合（追記方針が一致） | spec 確定 | outputs/phase-12/system-spec-update-summary.md（次 Phase で生成） | PASS |
| R-4 | production deploy 実行を含まないスコープ境界の明文化 | spec 確定 | 正本 §2.3「含まないもの」/ runbook 冒頭 scope 注意書き | PASS |
| R-5 | rollback 余地（旧 Worker 早期削除禁止）の runbook 明記 | spec 確定 | runbook P7 旧 Worker 処遇記録 §「安定確認まで残置」 | PASS |
| R-6 | secret 値・OAuth トークン値の漏洩なし（key 名のみ記録 / `.env` Read 禁止） | spec 確定 | runbook §3.3 注意書き / CLAUDE.md「禁止事項」cross-link | PASS |
| R-7 | DNS 切替が別タスク（UT-16）へ委譲されている明記 | spec 確定 | 正本 §2.3 / runbook 冒頭 scope | PASS |
| R-8 | 旧 Worker / 新 Worker 名の inventory 取得手順 | spec 確定 | runbook P1 事前確認 | PASS |
| R-9 | observability target（Logpush / Tail / Analytics）が新 Worker を指す確認手順 | spec 確定 | runbook P5 observability 設定確認 | PASS |
| R-10 | NON_VISUAL 縮約の根拠が runbook 文書のみ（UI なし）と明示されている | spec 確定 | Phase 11 冒頭 NON_VISUAL 縮約適用宣言 | PASS |

## 4条件最終判定

| 条件 | 判定 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | production deploy 直前の Worker 名 split-brain（route 旧 / deploy 新）リスクを排除する一次防御線が runbook で確立。secret 不在による 5xx と observability 盲点を deploy 前に検知可能。 |
| 実現性 | PASS | 全手順が `bash scripts/cf.sh` で完結し、op 経由の secret 注入が CLAUDE.md ルールに整合。dry-run（runbook 通読 + 想定オペレーション）で実 deploy なしに verify 可能。 |
| 整合性 | PASS | 不変条件（CLAUDE.md「wrangler 直接実行禁止」/「`.env` 実値非保持」/「OAuth token ローカル保持禁止」）すべて満たす。aiworkflow-requirements `deployment-cloudflare.md` との追記方針も一致。 |
| 運用性 | PASS | rollback 余地（旧 Worker 残置）が明記。route / secret / observability の snapshot 取得 → 差分検証 → 再注入 → deploy → tail 観測の順序が runbook 化。NON_VISUAL 代替 evidence で完結。 |

**最終判定: GO（PASS）**

## blocker 一覧（Phase 11 着手前提として確認必須）

| ID | blocker | 種別 | 解消条件 | 確認方法 |
| --- | --- | --- | --- | --- |
| B-01 | UT-06-FU-A 親タスク（OpenNext Workers 移行）の Phase 12 完了 | 上流タスク | 親 runbook に本タスクへの link が存在 | `docs/30-workflows/ut-06-followup-A-opennext-workers-migration/outputs/phase-12/` |
| B-02 | `apps/web/wrangler.toml` に `[env.production].name = "ubm-hyogo-web-production"` が確定 | 設定固定 | grep で当該行が確認できる | `grep -n 'ubm-hyogo-web-production' apps/web/wrangler.toml` |
| B-03 | `bash scripts/cf.sh whoami` が production Token で成功する | 環境準備 | アカウント名出力（トークン値含まない） | CLI 確認 |
| B-04 | 1Password に CLOUDFLARE_API_TOKEN（production scope）登録済み | 環境準備 | `op` 経由で `.env` を解決可能 | `scripts/with-env.sh` 動作確認 |
| B-05 | 想定 secret 一覧（key 名のみ）が確定済み | 設計前提 | runbook §3.3 に list 添付 | runbook 目視 |
| B-06 | 旧 Worker 名（rename 前 entity）が一覧化されている | 事前調査 | runbook P1 inventory に記載 | runbook 目視 |
| B-07 | aiworkflow-requirements `deployment-cloudflare.md` 最新版の取得 | 整合確認 | 当該ファイル存在 | `ls .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md` |

> B-01〜B-07 のいずれかが未完了の場合、Phase 11 着手は NO-GO となる。

## MAJOR 検出時の Phase 8/9 への戻りフロー

| 検出例 | 戻り先 Phase | 再評価条件 |
| --- | --- | --- |
| runbook の CLI に `wrangler` 直呼びが残存 | Phase 8（DRY 化） | 全 CLI を `bash scripts/cf.sh` に統一して再 grep で 0 件 |
| AC1〜AC5 のいずれかに証跡採取手順未記載 | Phase 7 → Phase 8 | AC matrix の証跡列に手順を埋め、DRY 化で重複解消 |
| 旧 Worker 早期削除手順が runbook 内で「即削除」になっている | Phase 9（QA） | 「安定確認まで残置」に書き換え、rollback 戦略再記述 |
| secret 値が runbook サンプルに転記されている | Phase 8 → Phase 9 | 全箇所マスク化 / key 名のみに修正、QA で grep 検証 |
| observability target が旧 Worker のままのケースが想定されていない | Phase 9 | observability 切替手順を追加し再 dry-run |
| DNS 切替が本タスクスコープに混入 | Phase 8 | UT-16 へ委譲する記述を冒頭 scope に追加 |
| docs-only スコープ逸脱（実 deploy 手順を実行する記述） | Phase 8 → Phase 9 | scope 境界を再宣言、deploy 実行を「ユーザー承認後」と明記 |

> MAJOR が一つでも検出された場合、ユーザー承認は得られず Phase 11 へ進めない。戻り Phase で修正後、Phase 10 を再実行する。

## ユーザー承認ゲート【user_approval_required: true】

| 段階 | アクション | 承認証跡パス |
| --- | --- | --- |
| 1. 観点マトリクス提示 | R-1〜R-10 + 4条件 + AC1〜AC5 + blocker をユーザーに提示 | outputs/phase-10/go-no-go.md §「観点マトリクス」 |
| 2. MAJOR 不在の確認 | MAJOR 0 を明示 | outputs/phase-10/go-no-go.md §「MAJOR 判定結果」 |
| 3. ユーザー承認取得 | ユーザーから「Phase 11 進行 OK」の明示的応答を得る | outputs/phase-10/approval-record.md |
| 4. 承認後 Phase 11 着手 | 承認証跡へのリンクを Phase 11 冒頭に記載 | phase-11.md 冒頭 |

> **承認まで Phase 11 着手禁止**。Phase 11 が NON_VISUAL 縮約タスクであっても、本ゲートをスキップしてはならない。

## open question の Phase 振り分け

| # | 質問 | 受け皿 Phase | 状態 |
| --- | --- | --- | --- |
| 1 | route 自動 inventory のスクリプト化（API 経由） | Phase 12 unassigned-task-detection | unassigned-task 候補 |
| 2 | Logpush ターゲット差分検証スクリプト化 | Phase 12 unassigned-task-detection | unassigned-task 候補 |
| 3 | DNS 切替自動化（UT-16 への申し送り） | Phase 12 unassigned-task-detection | unassigned-task 候補 |
| 4 | 旧 Worker の最終削除タイミング（安定運用 N 日後の判断） | UT-06 親タスク runbook 後続 | 観測後判断 |

## Phase 11 進行 GO / NO-GO

### GO 条件（すべて満たすこと）

- [ ] AC1〜AC5 すべて PASS
- [ ] 4条件最終判定が PASS
- [ ] R-1〜R-10 観点マトリクスすべて PASS
- [ ] MAJOR が一つもない
- [ ] blocker B-01〜B-07 のうち実行ブロッカーが解消（B-05/B-06 は spec 内で確定）
- [ ] ユーザー承認が取得済み（`outputs/phase-10/approval-record.md` 添付）
- [ ] CLAUDE.md「wrangler 直接実行禁止」「`.env` Read 禁止」「OAuth token 非保持」整合
- [ ] production deploy 実行を含まないスコープ境界が runbook 内に明記
- [ ] 旧 Worker 早期削除禁止（rollback 余地確保）が runbook 内に明記

### NO-GO 条件（一つでも該当）

- 4条件のいずれかに MAJOR が残る
- AC1〜AC5 のうち PASS でないものがある
- ユーザー承認が未取得
- runbook に `wrangler` 直呼びが 1 件でも残存
- secret 値・OAuth token 値の漏洩痕跡
- DNS 切替や production deploy 実行が本タスクスコープに混入
- 旧 Worker 早期削除手順が runbook に残っている

## 実行手順

### ステップ 1: AC マトリクス再評価
- Phase 7 の AC マトリクスを基に AC1〜AC5 を spec_created 視点で評価。

### ステップ 2: 4条件最終判定
- Phase 9 QA 結果を踏まえ価値性 / 実現性 / 整合性 / 運用性を確定。

### ステップ 3: 観点マトリクス R-1〜R-10 を確定
- 上記 10 観点をテーブルで明示し、すべて PASS を確認。

### ステップ 4: MAJOR 検出時の戻りフロー定義
- 7 ケース分の戻り先 Phase と再評価条件を runbook に記述。

### ステップ 5: blocker 一覧確定
- B-01〜B-07 を列挙し、解消条件 / 確認方法を記述。

### ステップ 6: ユーザー承認取得
- `outputs/phase-10/go-no-go.md` をユーザーに提示し、承認応答を `approval-record.md` に記録。

### ステップ 7: GO/NO-GO 確定
- すべての GO 条件充足を確認し GO 判定を `outputs/phase-10/go-no-go.md` に記述。

### ステップ 8: open question を Phase 12 へ送出
- 4 件すべてに受け皿 Phase 指定。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 11 | GO 判定 + ユーザー承認証跡を入力に NON_VISUAL 検証実施 |
| Phase 12 | open question #1〜#3（route 自動 inventory / Logpush 差分 / DNS 切替自動化）を unassigned-task として formalize |
| Phase 13 | GO/NO-GO 結果を PR description に転記 |
| 親 UT-06-FU-A | runbook の link を双方向化 |
| UT-16 | DNS 切替の委譲を申し送り |

## 多角的チェック観点

- 価値性: production deploy 直前の split-brain リスクを runbook で網羅。
- 実現性: 全手順 `scripts/cf.sh` 経由 / dry-run で verify 可能。
- 整合性: CLAUDE.md / aiworkflow-requirements / 親 UT-06-FU-A と矛盾なし。
- 運用性: rollback 余地（旧 Worker 残置）が確保。
- 認可境界: secret 値・OAuth token は op 経由のみで揮発、ログに残らない。
- Secret hygiene: key 名のみ記録ルール、`.env` Read 禁止が再掲。
- スコープ境界: production deploy 非実行、DNS 切替は UT-16 へ委譲。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | AC1〜AC5 達成状態評価 | 10 | spec_created | 5 件 |
| 2 | 4条件最終判定 | 10 | spec_created | PASS |
| 3 | 観点マトリクス R-1〜R-10 | 10 | spec_created | 10 件 |
| 4 | CLAUDE.md 整合性確認 | 10 | spec_created | wrangler 直呼び 0 |
| 5 | aiworkflow-requirements 整合性確認 | 10 | spec_created | deployment-cloudflare.md |
| 6 | スコープ境界確認（deploy 非実行 / DNS 別タスク） | 10 | spec_created | runbook 冒頭 scope |
| 7 | rollback 余地確認（旧 Worker 残置） | 10 | spec_created | P7 |
| 8 | secret / OAuth 漏洩確認 | 10 | spec_created | key 名のみ |
| 9 | MAJOR 戻りフロー定義 | 10 | spec_created | 7 ケース |
| 10 | ユーザー承認取得 | 10 | spec_created | approval-record |
| 11 | GO/NO-GO 確定 | 10 | spec_created | GO |
| 12 | open question 送出 | 10 | spec_created | 4 件 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-10/go-no-go.md | GO/NO-GO 判定・AC マトリクス・観点マトリクス・4条件・blocker・MAJOR 戻りフロー |
| 承認証跡 | outputs/phase-10/approval-record.md | ユーザー承認応答の記録 |
| メタ | artifacts.json | Phase 10 状態の更新 |

## 完了条件

- [ ] AC1〜AC5 全件に達成状態が付与され、すべて PASS
- [ ] 4条件最終判定が PASS
- [ ] 観点マトリクス R-1〜R-10 がすべて PASS
- [ ] CLAUDE.md「wrangler 直接実行禁止」整合確認済み
- [ ] aiworkflow-requirements `deployment-cloudflare.md` との追記方針一致
- [ ] production deploy 実行を含まないスコープ境界が runbook に明記
- [ ] rollback 余地（旧 Worker 早期削除禁止）が runbook に明記
- [ ] secret 値・OAuth トークン値の漏洩 0 件
- [ ] MAJOR 検出時の Phase 8/9 戻りフローが定義済み
- [ ] blocker 一覧（B-01〜B-07）が記述
- [ ] open question 4 件すべてに受け皿 Phase 指定
- [ ] ユーザー承認取得（approval-record.md 添付）
- [ ] GO 判定が `outputs/phase-10/go-no-go.md` に確定

## タスク100%実行確認【必須】

- 全実行タスク（10 件）が `spec_created`
- 成果物 `outputs/phase-10/go-no-go.md` / `approval-record.md` の 2 ファイルが配置予定
- AC × 4条件 × 観点マトリクス × blocker × MAJOR 戻りフロー × ユーザー承認 × GO/NO-GO の 7 観点すべて記述
- artifacts.json の `phases[9].status` が `spec_created`

## 次 Phase への引き渡し

- 次 Phase: 11 (NON_VISUAL 手動検証)
- 引き継ぎ事項:
  - GO 判定 + ユーザー承認証跡パス
  - blocker B-01〜B-07（Phase 11 着手前再確認必須）
  - open question #1〜#4 を Phase 12 で formalize
  - NON_VISUAL 縮約（visualEvidence=NON_VISUAL / taskType=docs-only）の根拠を Phase 11 冒頭に再宣言する設計
  - secret 値・OAuth token 値の漏洩防止ルール（key 名のみ記録 / `.env` Read 禁止）
- ブロック条件:
  - 4条件のいずれかが MAJOR
  - AC1〜AC5 で PASS でないものが残る
  - ユーザー承認が未取得
  - runbook に `wrangler` 直呼びが残存
  - production deploy 実行 / DNS 切替が本タスクスコープに混入
  - 旧 Worker 早期削除手順が runbook に残存
