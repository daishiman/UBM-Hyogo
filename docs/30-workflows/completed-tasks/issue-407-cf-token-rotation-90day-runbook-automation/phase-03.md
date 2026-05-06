# Phase 3: 設計レビュー — issue-407-cf-token-rotation-90day-runbook-automation

[実装区分: 実装仕様書]

判定根拠: Phase 2 で設計した runbook / 実施記録テンプレ / GitHub Actions workflow yaml は実運用システムへの副作用（自動 Issue 起票、rotation 手順正本）を持つ。CONST_004 に従い本 Phase も実装仕様書として扱う。

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | issue-407-cf-token-rotation-90day-runbook-automation |
| phase | 3 / 13 |
| wave | post-U-FIX-CF-ACCT-01 |
| mode | sequential |
| 作成日 | 2026-05-06 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |

## 目的

Phase 2 の設計を 4 観点（システム整合性 / 戦略・価値 / 問題解決 / 4 条件評価）でレビューし、CONST_004-007 の遵守を確認した上で GO/NO-GO を判定する。NO-GO 要素が残る場合は Phase 2 へ差し戻す。

## レビュー 1: システム整合性

### aiworkflow-requirements 整合

| 観点 | 確認 | 判定 |
| --- | --- | --- |
| `references/deployment-secrets-management.md` | 既存 secrets 正本に「Cloudflare API Token rotation」セクションが追記される設計。runbook へのリンクのみで Token 値非掲載 | GO |
| `references/task-workflow-active.md` | 本タスク完了後に状態更新する旨を Phase 12 へ引き渡し済み（Phase 1 サブタスク） | GO |
| `aiworkflow-requirements/indexes` | 仕様書追加と yaml 追加のみで indexes 再生成は不要。Phase 13 PR で `pnpm indexes:rebuild` 実行可否を最終チェックする | GO |
| `task-specification-creator` | 13 phase 構造、`[実装区分: 実装仕様書]` 明記、CONST_005 必須項目（変更対象ファイル / yaml 構造 / 入出力 / テスト方針 / ローカル実行 / DoD）を Phase 02 で具体化済み | GO |

### CLAUDE.md 整合

| 項目 | 確認 | 判定 |
| --- | --- | --- |
| Cloudflare 系 CLI 実行ルール | runbook の全 CLI 操作が `bash scripts/cf.sh` 経由 | GO |
| ローカル `.env` 運用ルール | Token 値は op:// 参照のみ、ファイル / log / Issue 本文に書かない | GO |
| ブランチ戦略 | 本タスクの成果物投入は `feature/* → dev → main` 経路。workflow yaml の有効化は main merge 後 | GO |
| Governance / CODEOWNERS | `.github/workflows/**` は CODEOWNERS 対象 path であり、追加 yaml も owner 明示が継承される | GO |
| シークレット管理 | runtime secrets（CLOUDFLARE_API_TOKEN）は GitHub Secrets / 1Password で既存運用、新規 secret 導入なし | GO |
| Free-tier 遵守 | 日次 cron 1 回 < 1 分の workflow は GitHub Actions free-tier 内 | GO |

### CONST_004-007 遵守

| 制約 | 確認 | 判定 |
| --- | --- | --- |
| CONST_004（実装区分判定） | runbook .md / 実施記録 .md / workflow yaml の新規作成を伴うため実装仕様書と判定。冒頭に明記 | GO |
| CONST_005（必須項目） | 変更対象ファイル一覧 / yaml 構造 / 入出力 / エラーハンドリング / セキュリティ / ローカル実行コマンド / Rollback / DoD を Phase 02 で具体化 | GO |
| CONST_006（依存・スコープ明示） | index.md の Scope In/Out、Depends On / Blocks / Related で明示済み | GO |
| CONST_007（先送り禁止） | Wave 1 と Wave 2 を本サイクル内で完結。Phase 11 で yaml dry-run を実測 | GO |

## レビュー 2: 戦略・価値

| 観点 | 評価 |
| --- | --- |
| ビジネス価値 | (a) 漏洩 blast radius を 90 日に短縮、(b) staging-first / 24h 並行 / rollback 3 段ガードで rotation 失敗の業務影響をゼロ化、(c) 自動 Issue 起票で「期日忘れ」を構造的に排除 |
| MVP 適合性 | runbook + 自動通知の最小セットに留め、Token 発行の自動化は OIDC 化（DERIV-01）に委譲。MVP の運用負荷を増やさない |
| 持続性 | 実施記録 append-only により四半期 rotation の運用傾向（所要時間 / 失敗率）を定量化可能 |
| 拡張性 | 同じパターンで D1 health DB token rotation（#245）にも展開可能（章立てと yaml 構造を雛形化） |

## レビュー 3: 問題解決

| 元の課題 | 設計上の解決 |
| --- | --- |
| 90 日経過を覚えていられない | `vars.CF_TOKEN_ISSUED_AT` を起点に schedule workflow が 85 日経過時点で自動 Issue 起票 |
| rotation 手順違反で旧 Token を即削除 | runbook §4.7 / §5.7 で「無効化」と「削除」を 24h 間隔の 2 段階に分離 |
| staging を飛ばして production を rotation | runbook §5 冒頭に「§4 全 PASS を G2 で承認してから本節へ進む」と明記 |
| rotation 失敗時に旧 Token を取り戻せない | runbook §6 で旧 Token 再有効化 → `gh secret set` 再注入 → 新 Token 失効の手順を確立 |
| 実施記録に Token 値が混入 | 実施記録テンプレを「時刻 / 結果 / 関連 Issue」のみに限定し Token 値項目を持たない |
| 自動化が暴走して誤起票 | dry-run + 重複起票検知（`gh issue list --search`）+ `gh workflow disable` 緊急停止経路 |

## レビュー 4: 4 条件評価（リスクマトリクス）

| # | リスク | likelihood | impact | mitigation |
| --- | --- | --- | --- | --- |
| R1 | runbook / 実施記録 / yaml / step ログに Token 値・Token ID・scope 値が混入 | 低 | 致命 | テンプレ自体に Token 値フィールドを置かない設計 + Phase 7 AC マトリクスで grep（`AAAA-BBBB` 風 ID パターン / `CLOUDFLARE_API_TOKEN=` 直値）が 0 件であることを確認するゲート + Phase 13 PR 作成前に `git diff` レビュー必須 |
| R2 | 90 日選定が短すぎ / 長すぎ | 中 | 中 | runbook §1.1 に「経験則」と明記し、初回 rotation 後の運用観察で短縮 / 延長判断するレビューポイントを設置（次サイクルで unassigned-task 起票） |
| R3 | 24h 並行根拠が薄い（検知前失効 vs blast radius のトレードオフ） | 中 | 中 | runbook §1.2 で「24h は検知猶予の経験則」と明記し、インシデント発生時に短縮レビューする TODO を残す |
| R4 | scope creep（「Token 発行も自動化したい」誘惑） | 中 | 高 | index.md / Phase 1 制約条件に「Wave 2 は通知のみ」と明記。OIDC 化（DERIV-01）への委譲先も明示 |
| R5 | rollback 失敗（旧 Token を削除済みで再有効化不可） | 低 | 致命 | 「24h 並行運用中は disable のみ・delete 禁止」を runbook §4.7 / §5.7 に強調。実施記録テンプレに「無効化時刻」と「削除時刻」を分離 |
| R6 | `vars.CF_TOKEN_ISSUED_AT` 未設定で workflow が無音 fail | 中 | 高 | step `Compute elapsed days` の guard で `::error::` を出して workflow 自体を fail させる。runbook §3 の事前確認に「初回 rotation 後に CF_TOKEN_ISSUED_AT を更新」を必須項目化 |
| R7 | 重複起票で Issue が氾濫 | 中 | 中 | `gh issue list --search "in:title <prefix>" --state open` で既存検知。`existing.count >= 1` で起票 step を skip |
| R8 | dry-run と本番起票の混乱 | 中 | 中 | `workflow_dispatch` の dry-run 既定値を `true`、`schedule` 経由は本番起票（dry-run しない）と yaml で明示分岐 |
| R9 | GitHub Actions free-tier 超過 | 低 | 低 | 日次 cron 1 回 < 1 分。月 < 30 分で free-tier 内 |
| R10 | OIDC 化（DERIV-01）後に runbook が陳腐化 | 中 | 中 | runbook §9 末尾に「OIDC 化後は本 runbook を改訂対象とする」と明記。DERIV-01 起票時に本仕様書を引用 |

## レビュー 5: 代替案検討

| 代替案 | 内容 | 採否 | 根拠 |
| --- | --- | --- | --- |
| A1: 採用案 — runbook + schedule workflow（Issue 起票のみ） | Token 発行は手動、期日通知のみ自動化 | 採用 | scope creep を防ぎつつ「期日忘れ」を構造排除。OIDC 化までの暫定運用として最小コスト |
| A2: Token 発行 API も自動化 | Cloudflare API で Token を作成・配布まで CI から実行 | 不採用 | scope 設計の人手レビューが消える / API Token 管理権限を CI に集約することで blast radius が拡大 / OIDC 化の方が解として正しい |
| A3: 通知を Slack / Email にする | Issue ではなく外部通知 | 不採用 | (a) 1Password / GitHub に閉じた運用と整合しない、(b) 通知の audit trail が弱い、(c) Issue は CODEOWNERS / 既存 review プロセスとの統合が容易 |
| A4: schedule cron を週次にする | 計算負荷を下げる | 不採用 | 日次でも free-tier 内。週次にすると最大 6 日のラグが発生し 85 日 threshold の精度が劣化 |
| A5: 自動 PR で `CF_TOKEN_ISSUED_AT` を更新 | rotation 完了時に PR で variables を書き換え | 不採用（次サイクル検討） | GitHub Variables の更新は API で可能だが、誤更新時の rollback が非自明。MVP では runbook §5.9 で手動更新する方が安全 |
| A6: dry-run 既定値を schedule でも `true` | schedule 経由で起票せず手動再実行で起票 | 不採用 | 「期日忘れ」防止の主目的に反する |

採用案 A1 は CLAUDE.md / aiworkflow-requirements / unassigned-task DERIV-03 の Scope In/Out に整合する唯一の選択肢。

## 設計の盲点レビュー（Phase 5/11 への補強指示）

| 観点 | 指摘 | Phase 5/11 への反映指示 |
| --- | --- | --- |
| `gh issue list --search` の title マッチ精度 | プレフィックスが他 Issue と衝突する可能性 | Phase 5 で固有プレフィックス `[cf-token-rotation]` を確定。Phase 11 で実 Issue を使った重複検知を実測 |
| `date -u -d` の GNU date 依存 | macOS の BSD date と挙動差。GitHub Actions ubuntu-latest は GNU date 前提のため OK | Phase 5 で「ubuntu-latest 固定」と明記、ローカル検証時は `gdate` を案内 |
| `gh workflow run` の dry-run 経路 | `workflow_dispatch` 入力 `dry_run` の choice 型と string 比較の挙動 | Phase 11 で実 dry-run と本番起票（テスト環境で `ISSUED_AT` を 86 日前に設定）を両方実測 |
| `gh issue create --label` の label 事前作成 | label 未存在で fail する可能性 | Phase 5 で `ops` / `cloudflare` / `token-rotation` の事前作成手順を明記 |
| 1Password expiry reminder のチーム共有 | solo 運用なので個人 vault 通知のみ | runbook §7 で個人通知前提と明記。将来 team 化時は再設計 |
| `vars.CF_TOKEN_ISSUED_AT` の初期化タイミング | U-FIX-CF-ACCT-01 完了直後に設定する必要 | Phase 5 で runbook §3 と U-FIX-CF-ACCT-01 完了 checklist を相互参照 |

## GO/NO-GO 判定

- システム整合性: 全 GO
- CLAUDE.md / CONST_004-007 整合: 全 GO
- 戦略・価値: GO
- リスク R1〜R10: 全て mitigation 設定済み
- 代替案: A1 採用妥当
- 設計盲点 6 項目: Phase 5 / 11 への引き渡し条件として確定

判定: **GO**（Phase 4 テスト戦略へ進む）

## 参照資料

- `phase-01.md`
- `phase-02.md`
- `index.md`
- `docs/30-workflows/unassigned-task/U-FIX-CF-ACCT-01-DERIV-03-token-rotation-90day-runbook.md`
- `docs/00-getting-started-manual/specs/15-infrastructure-runbook.md`
- `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md`
- `CLAUDE.md`

## 統合テスト連携

- 上流: U-FIX-CF-ACCT-01 完了状態
- 下流: U-FIX-CF-ACCT-01-DERIV-01（OIDC 化）— 本タスクの GO 判定が DERIV-01 起票時の前提を構成

## 多角的チェック観点

- リスク mitigation が「先送り」になっていない（CONST_007）
- 代替案の不採用理由が CLAUDE.md / scope と整合
- 機密値非掲載が grep で機械検証可能な構造になっている
- staging-first / 24h 並行 / rollback の 3 段ガードが runbook 構造に組み込まれている
- 自動化が「通知のみ」に限定され Token 発行に踏み込まない設計になっている

## サブタスク管理

- [ ] aiworkflow-requirements 整合 4 項目を判定
- [ ] CLAUDE.md 整合 6 項目を判定
- [ ] CONST_004-007 4 項目を判定
- [ ] リスク 10 件にすべて mitigation を割当
- [ ] 代替案 6 件を比較し A1 採用を確定
- [ ] 設計盲点 6 項目を Phase 5 / 11 へ引き渡し条件として記録
- [ ] `outputs/phase-03/main.md` を作成

## 成果物

- `outputs/phase-03/main.md`

## 完了条件

- [ ] 不変条件チェック・リスクマトリクス・代替案・aiworkflow-requirements 整合のすべてに判定が記載されている
- [ ] GO/NO-GO 判定の根拠が明文化されている
- [ ] Phase 4 以降への引き渡し項目が runbook 章立て / yaml 構造 / approval gate / 設計盲点の 4 種で揃っている

## タスク100%実行確認

- [ ] 必須セクションがすべて埋まっている
- [ ] 設計レビューで NO-GO 要素が残っていない
- [ ] 本 Phase で commit / push / PR / Token 発行 / secret 投入を実行していない

## 次 Phase への引き渡し

Phase 4（テスト戦略）以降に渡す:

- runbook 章立て 9 節 / 実施記録テンプレ 13 フィールド / yaml 7 ブロック構造
- approval gate G1〜G4
- リスク mitigation のうち Phase 11 実行時に再確認が必要な項目（R1 機密値非掲載 grep / R6 `CF_TOKEN_ISSUED_AT` 初期化 / R7 重複起票検知 / R8 dry-run 分岐）
- 設計盲点 6 項目（title プレフィックス確定 / GNU date 依存 / dry-run 実測 / label 事前作成 / 1Password 個人通知 / `CF_TOKEN_ISSUED_AT` 初期化タイミング）

## 実行タスク

- [ ] phase-03 の既存セクションに記載した手順・検証・成果物作成を実行する。
