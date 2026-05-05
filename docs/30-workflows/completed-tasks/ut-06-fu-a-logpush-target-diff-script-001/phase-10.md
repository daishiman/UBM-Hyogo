# Phase 10: 最終レビュー

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | observability target 差分検証 script 追加 (UT-06-FU-A-LOGPUSH-TARGET-DIFF-SCRIPT-001) |
| Phase 番号 | 10 / 13 |
| Phase 名称 | 最終レビュー（Final Review Gate） |
| 作成日 | 2026-05-01 |
| 前 Phase | 9 (品質保証 / dry-run 検証) |
| 次 Phase | 11 (NON_VISUAL 手動検証) |
| 状態 | spec_created |
| タスク分類 | infrastructure-tooling（implementation / observability diff script） |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| user_approval_required | **true**（本 Phase は最終レビューゲート。承認まで Phase 11 着手禁止） |
| GitHub Issue | #329（Refs #329 で関連付け / Closes 不使用） |
| 親タスク | UT-06-FU-A-PROD-ROUTE-SECRET-001 |

## 目的

Phase 1〜9 で蓄積した「`ubm-hyogo-web-production` と旧 Worker の observability target（Workers Logs / Tail / Logpush / Analytics Engine）を読み取り専用で差分出力する script 仕様」を横断レビューし、AC1〜AC5 がすべて実装可能な spec に到達しているかを確定する。本タスクは **読み取り専用 script の追加** をスコープとし、observability 設定の変更や production deploy は実施しない。secret 値・token 値・sink URL の出力混入を redaction で防ぐ設計が確立していることを確認し、ユーザー承認を以て Phase 11 に進行する。

## 実行タスク

1. AC1〜AC5（旧/新 Worker observability target inventory / 差分出力 / redaction / `bash scripts/cf.sh` 経由 / golden output 比較）の達成状態を spec_created 視点で評価する。
2. 4 条件（価値性 / 実現性 / 整合性 / 運用性）に対する最終判定を確定する。
3. CLAUDE.md「wrangler 直接実行禁止」整合性を確認する（完了条件: script 内のすべての CLI 呼び出しが `bash scripts/cf.sh` 経由）。
4. aiworkflow-requirements `references/deployment-cloudflare.md` との整合性を確認する（完了条件: observability diff script 導線追加方針が一致）。
5. **読み取り専用スコープ境界**が script 仕様に明記されていることを確認する（完了条件: 「observability 設定変更しない」「deploy 非実行」が明文化）。
6. **redaction 設計**が完成していることを確認する（完了条件: token / secret / sink URL のパターン一覧と redaction 関数仕様が記述）。
7. **golden output** 設計が完成していることを確認する（完了条件: golden ファイル配置先と比較手順が記述）。
8. MAJOR 検出時の Phase 8/9 への戻りフローを定義する。
9. ユーザー承認ゲート: 承認まで Phase 11 着手禁止を明文化する。
10. GO/NO-GO 判定を確定し、`outputs/phase-10/go-no-go.md` を生成する。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ut-06-fu-a-logpush-target-diff-script-001/phase-07.md | AC × 検証 × script 仕様トレース |
| 必須 | docs/30-workflows/ut-06-fu-a-logpush-target-diff-script-001/phase-08.md | DRY 化結果 |
| 必須 | docs/30-workflows/ut-06-fu-a-logpush-target-diff-script-001/phase-09.md | QA 結果（dry-run / golden output 確認） |
| 必須 | docs/30-workflows/ut-06-fu-a-logpush-target-diff-script-001/index.md | AC / 不変条件 / scope |
| 必須 | CLAUDE.md | Cloudflare 系 CLI 実行ルール / wrangler 直接実行禁止 / secret hygiene |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md | scripts/cf.sh / observability target 正本 |
| 必須 | docs/30-workflows/completed-tasks/ut-06-fu-a-prod-route-secret-001-worker-migration-verification/ | 親タスク runbook（open question #2 起源） |
| 参考 | scripts/cf.sh | wrapper 仕様 |

## レビュー観点と結果テーブル

> **評価基準**: spec_created 段階のため、「script 設計が production observability 環境を変更せず差分出力可能な粒度に到達しているか」「redaction が token / secret / sink URL を全件マスクできる設計か」「golden output 比較で検証可能か」で判定する。

### AC × 達成状態

| AC | 内容 | 達成状態（spec_created 時点） | 仕様確定先 | 判定 |
| --- | --- | --- | --- | --- |
| AC1 | `ubm-hyogo-web-production` および旧 Worker の Workers Logs / Tail / Logpush / Analytics Engine target inventory を読み取り専用で取得 | 未実装だが script 仕様確定 | Phase 5 script-implementation §inventory | PASS |
| AC2 | 旧/新 Worker の target 差分（追加 / 削除 / 変更）を構造化出力（JSON or markdown table）する | 未実装だが script 仕様確定 | Phase 5 script-implementation §diff | PASS |
| AC3 | 出力に token 値 / secret 値 / sink URL の実値が含まれない（redaction 適用） | 未実装だが redaction 仕様確定 | Phase 5 script-implementation §redaction | PASS |
| AC4 | すべての CLI 呼び出しが `bash scripts/cf.sh` 経由（wrangler 直呼び 0 件） | 未実装だが script 仕様確定 | Phase 5 script-implementation §cli-wrapper | PASS |
| AC5 | golden output ファイルとの diff で検証可能（CI / 手動再現可能） | 未実装だが golden 配置先確定 | Phase 5 script-implementation §golden-output | PASS |

### 観点 × 状態 × 証跡パス

| # | レビュー観点 | 状態 | 証跡パス | 判定 |
| --- | --- | --- | --- | --- |
| R-1 | AC1〜AC5 の検証手順が Phase 11 で再現可能 | spec 確定 | outputs/phase-07/ac-matrix.md | PASS |
| R-2 | CLAUDE.md「wrangler 直接実行禁止」整合（script 内 CLI が全て `bash scripts/cf.sh` 経由） | spec 確定 | outputs/phase-05/script-implementation.md（grep で `wrangler ` 直呼び 0 件） | PASS |
| R-3 | aiworkflow-requirements `deployment-cloudflare.md` との整合（追記方針が一致） | spec 確定 | outputs/phase-12/system-spec-update-summary.md（次 Phase で生成） | PASS |
| R-4 | 読み取り専用スコープ境界の明文化（observability 設定変更 / deploy 非実行） | spec 確定 | script-implementation 冒頭 scope 注意書き | PASS |
| R-5 | redaction 設計（token / secret / sink URL のパターン一覧 + 関数仕様） | spec 確定 | script-implementation §redaction | PASS |
| R-6 | golden output 配置先と比較手順 | spec 確定 | script-implementation §golden-output | PASS |
| R-7 | secret 値・token 値の漏洩なし（redaction grep で 0 件想定） | spec 確定 | Phase 11 redaction-grep 設計 | PASS |
| R-8 | 旧/新 Worker 名の inventory 取得手順（API or `cf.sh` 経由） | spec 確定 | script-implementation §inventory | PASS |
| R-9 | output 形式（JSON or markdown table）の決定 | spec 確定 | script-implementation §output-format | PASS |
| R-10 | NON_VISUAL 縮約の根拠が CLI 出力のみ（UI なし）と明示されている | spec 確定 | Phase 11 冒頭 NON_VISUAL 縮約適用宣言 | PASS |

## 4 条件最終判定

| 条件 | 判定 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | 親 UT-06-FU-A-PROD-ROUTE-SECRET-001 の手動 observability 突合を script 化し、route cutover 後の observability split-brain（旧 Worker のまま log が流れる / Logpush sink 切替漏れ）を読み取り専用で検出可能。 |
| 実現性 | PASS | 全 CLI が `bash scripts/cf.sh` 経由で完結し、op 経由の token 注入が CLAUDE.md ルールに整合。読み取り専用 API のみ使用するため observability 設定への副作用なし。 |
| 整合性 | PASS | 不変条件（CLAUDE.md「wrangler 直接実行禁止」/「`.env` 実値非保持」/「OAuth token ローカル保持禁止」）すべて満たす。aiworkflow-requirements `deployment-cloudflare.md` への導線追加方針も一致。 |
| 運用性 | PASS | golden output ファイルとの diff で再現性確保。redaction でログ・PR description・CI 出力に実値が混入しない。手動でも CI でも実行可能な構造。 |

**最終判定: GO（PASS）**

## blocker 一覧（Phase 11 着手前提として確認必須）

| ID | blocker | 種別 | 解消条件 | 確認方法 |
| --- | --- | --- | --- | --- |
| B-01 | 親 UT-06-FU-A-PROD-ROUTE-SECRET-001 タスクの完了 | 上流タスク | 親 runbook に本タスクへの link が存在 | `docs/30-workflows/completed-tasks/ut-06-fu-a-prod-route-secret-001-worker-migration-verification/` |
| B-02 | `bash scripts/cf.sh whoami` が production Token で成功する | 環境準備 | アカウント名出力（token 値含まない） | CLI 確認 |
| B-03 | 1Password に `CLOUDFLARE_API_TOKEN`（observability read scope）登録済み | 環境準備 | `op` 経由で `.env` を解決可能 | `scripts/with-env.sh` 動作確認 |
| B-04 | 旧 Worker 名（rename 前 entity）が一覧化されている | 事前調査 | script 仕様 §inventory に記載 | script-implementation 目視 |
| B-05 | aiworkflow-requirements `deployment-cloudflare.md` 最新版の取得 | 整合確認 | 当該ファイル存在 | `ls .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md` |
| B-06 | golden output 配置先（`tests/golden/observability-target-diff/`）の決定 | 設計前提 | script-implementation §golden-output に明記 | script-implementation 目視 |
| B-07 | redaction パターン一覧（token / secret / sink URL）の決定 | 設計前提 | script-implementation §redaction に明記 | script-implementation 目視 |

> B-01〜B-07 のいずれかが未完了の場合、Phase 11 着手は NO-GO となる。

## MAJOR 検出時の Phase 8/9 への戻りフロー

| 検出例 | 戻り先 Phase | 再評価条件 |
| --- | --- | --- |
| script 内に `wrangler` 直呼びが残存 | Phase 8（DRY 化） | 全 CLI を `bash scripts/cf.sh` に統一して再 grep で 0 件 |
| AC1〜AC5 のいずれかに検証手順未記載 | Phase 7 → Phase 8 | AC matrix の証跡列に手順を埋め、DRY 化で重複解消 |
| redaction パターンに sink URL / token 漏れ | Phase 9（QA） | redaction 関数のテストケースを追加し全パターンマスク確認 |
| golden output が固定値を含み環境依存 | Phase 9 | 環境依存値を redaction で置換、golden 比較で 0 diff |
| script が observability 設定を書き換える呼び出しを含む | Phase 8 → Phase 9 | 読み取り専用 API のみに限定、destructive 呼び出し除去 |
| output 形式が JSON / markdown 両方で曖昧 | Phase 8 | 形式を一意に決定し、golden output と整合 |
| `bash scripts/cf.sh` ラッパーで対応していない API を直接呼んでいる | Phase 8 | ラッパー経由に変更 or ラッパー拡張タスクを unassigned-task へ起票 |

> MAJOR が一つでも検出された場合、ユーザー承認は得られず Phase 11 へ進めない。

## ユーザー承認ゲート【user_approval_required: true】

| 段階 | アクション | 承認証跡パス |
| --- | --- | --- |
| 1. 観点マトリクス提示 | R-1〜R-10 + 4 条件 + AC1〜AC5 + blocker をユーザーに提示 | outputs/phase-10/go-no-go.md §「観点マトリクス」 |
| 2. MAJOR 不在の確認 | MAJOR 0 を明示 | outputs/phase-10/go-no-go.md §「MAJOR 判定結果」 |
| 3. ユーザー承認取得 | ユーザーから「Phase 11 進行 OK」の明示的応答を得る | outputs/phase-10/approval-record.md |
| 4. 承認後 Phase 11 着手 | 承認証跡へのリンクを Phase 11 冒頭に記載 | phase-11.md 冒頭 |

> **承認まで Phase 11 着手禁止**。

## open question の Phase 振り分け

| # | 質問 | 受け皿 Phase | 状態 |
| --- | --- | --- | --- |
| 1 | script を CI（GitHub Actions）に組み込むか | Phase 12 unassigned-task-detection | unassigned-task 候補 |
| 2 | golden output の自動更新ワークフロー | Phase 12 unassigned-task-detection | unassigned-task 候補 |
| 3 | `cf.sh` ラッパー未対応 API（Logpush jobs list 等）の追加 | Phase 12 unassigned-task-detection | unassigned-task 候補 |

## Phase 11 進行 GO / NO-GO

### GO 条件（すべて満たすこと）

- [ ] AC1〜AC5 すべて PASS
- [ ] 4 条件最終判定が PASS
- [ ] R-1〜R-10 観点マトリクスすべて PASS
- [ ] MAJOR が一つもない
- [ ] blocker B-01〜B-07 のうち実行ブロッカーが解消
- [ ] ユーザー承認が取得済み（`outputs/phase-10/approval-record.md` 添付）
- [ ] CLAUDE.md「wrangler 直接実行禁止」「`.env` Read 禁止」「OAuth token 非保持」整合
- [ ] 読み取り専用スコープ境界が script 仕様に明記
- [ ] redaction 設計（token / secret / sink URL）が完成

### NO-GO 条件（一つでも該当）

- 4 条件のいずれかに MAJOR が残る
- AC1〜AC5 のうち PASS でないものがある
- ユーザー承認が未取得
- script に `wrangler` 直呼びが 1 件でも残存
- secret / token / sink URL の漏洩痕跡
- observability 設定書き換え呼び出しの混入

## 実行手順

### ステップ 1: AC マトリクス再評価
- Phase 7 の AC マトリクスを基に AC1〜AC5 を spec_created 視点で評価。

### ステップ 2: 4 条件最終判定
- Phase 9 QA 結果を踏まえ価値性 / 実現性 / 整合性 / 運用性を確定。

### ステップ 3: 観点マトリクス R-1〜R-10 を確定
- 上記 10 観点をテーブルで明示し、すべて PASS を確認。

### ステップ 4: MAJOR 検出時の戻りフロー定義
- 7 ケース分の戻り先 Phase と再評価条件を記述。

### ステップ 5: blocker 一覧確定
- B-01〜B-07 を列挙し、解消条件 / 確認方法を記述。

### ステップ 6: ユーザー承認取得
- `outputs/phase-10/go-no-go.md` をユーザーに提示し、承認応答を `approval-record.md` に記録。

### ステップ 7: GO/NO-GO 確定
- すべての GO 条件充足を確認し GO 判定を `outputs/phase-10/go-no-go.md` に記述。

### ステップ 8: open question を Phase 12 へ送出
- 3 件すべてに受け皿 Phase 指定。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 11 | GO 判定 + ユーザー承認証跡を入力に NON_VISUAL 検証実施 |
| Phase 12 | open question #1〜#3（CI 組込 / golden 自動更新 / `cf.sh` 拡張）を unassigned-task として formalize |
| Phase 13 | GO/NO-GO 結果を PR description に転記 |
| 親 UT-06-FU-A-PROD-ROUTE-SECRET-001 | observability diff の自動化として spec を申し送り |

## 多角的チェック観点

- 価値性: route cutover 後の observability split-brain 検出が手動依存から script 自動化へ移行。
- 実現性: 全手順 `scripts/cf.sh` 経由 / 読み取り専用 API のみ使用。
- 整合性: CLAUDE.md / aiworkflow-requirements / 親 UT-06-FU-A-PROD-ROUTE-SECRET-001 と矛盾なし。
- 運用性: golden output 比較で再現性確保 / redaction で実値混入防止。
- 認可境界: token 値・OAuth token は op 経由のみで揮発、ログに残らない。
- Secret hygiene: redaction で全パターンマスク、key 名のみ出力。
- スコープ境界: observability 設定変更 / deploy は非実行。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | AC1〜AC5 達成状態評価 | 10 | spec_created | 5 件 |
| 2 | 4 条件最終判定 | 10 | spec_created | PASS |
| 3 | 観点マトリクス R-1〜R-10 | 10 | spec_created | 10 件 |
| 4 | CLAUDE.md 整合性確認 | 10 | spec_created | wrangler 直呼び 0 |
| 5 | aiworkflow-requirements 整合性確認 | 10 | spec_created | deployment-cloudflare.md |
| 6 | スコープ境界確認（読み取り専用 / deploy 非実行） | 10 | spec_created | script-implementation 冒頭 |
| 7 | redaction 設計確認 | 10 | spec_created | token / secret / sink URL |
| 8 | golden output 設計確認 | 10 | spec_created | 配置先 / 比較手順 |
| 9 | MAJOR 戻りフロー定義 | 10 | spec_created | 7 ケース |
| 10 | ユーザー承認取得 | 10 | spec_created | approval-record |
| 11 | GO/NO-GO 確定 | 10 | spec_created | GO |
| 12 | open question 送出 | 10 | spec_created | 3 件 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-10/main.md | 最終レビューサマリー |
| ドキュメント | outputs/phase-10/go-no-go.md | GO/NO-GO 判定・AC マトリクス・観点マトリクス・4 条件・blocker・MAJOR 戻りフロー |
| 承認証跡 | outputs/phase-10/approval-record.md | ユーザー承認応答の記録 |
| メタ | artifacts.json | Phase 10 状態の更新 |

## 完了条件

- [ ] AC1〜AC5 全件に達成状態が付与され、すべて PASS
- [ ] 4 条件最終判定が PASS
- [ ] 観点マトリクス R-1〜R-10 がすべて PASS
- [ ] CLAUDE.md「wrangler 直接実行禁止」整合確認済み
- [ ] aiworkflow-requirements `deployment-cloudflare.md` との追記方針一致
- [ ] 読み取り専用スコープ境界が script 仕様に明記
- [ ] redaction 設計（token / secret / sink URL）が完成
- [ ] golden output 配置先と比較手順が決定
- [ ] secret 値・token 値の漏洩 0 件
- [ ] MAJOR 検出時の Phase 8/9 戻りフローが定義済み
- [ ] blocker 一覧（B-01〜B-07）が記述
- [ ] open question 3 件すべてに受け皿 Phase 指定
- [ ] ユーザー承認取得（approval-record.md 添付）
- [ ] GO 判定が `outputs/phase-10/go-no-go.md` に確定

## タスク 100% 実行確認【必須】

- 全実行タスク（10 件）が `spec_created`
- 成果物 `outputs/phase-10/{main,go-no-go,approval-record}.md` の 3 ファイルが配置予定
- AC × 4 条件 × 観点マトリクス × blocker × MAJOR 戻りフロー × ユーザー承認 × GO/NO-GO の 7 観点すべて記述
- artifacts.json の `phases[9].status` が `spec_created`

## 次 Phase への引き渡し

- 次 Phase: 11 (NON_VISUAL 手動検証)
- 引き継ぎ事項:
  - GO 判定 + ユーザー承認証跡パス
  - blocker B-01〜B-07（Phase 11 着手前再確認必須）
  - open question #1〜#3 を Phase 12 で formalize
  - NON_VISUAL 縮約（visualEvidence=NON_VISUAL / taskType=implementation だが UI なし script）の根拠を Phase 11 冒頭に再宣言する設計
  - secret / token / sink URL の漏洩防止ルール（redaction grep で 0 件）
- ブロック条件:
  - 4 条件のいずれかが MAJOR
  - AC1〜AC5 で PASS でないものが残る
  - ユーザー承認が未取得
  - script に `wrangler` 直呼びが残存
  - observability 設定書き換え呼び出しの混入
