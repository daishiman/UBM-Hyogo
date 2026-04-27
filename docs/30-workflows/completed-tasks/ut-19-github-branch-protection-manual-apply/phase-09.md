# Phase 9: 品質保証

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | GitHub ブランチ保護・Environments 手動適用 (UT-19) |
| Phase 番号 | 9 / 13 |
| Phase 名称 | 品質保証 |
| 作成日 | 2026-04-27 |
| 前 Phase | 8 (設定 DRY 化) |
| 次 Phase | 10 (最終レビュー) |
| 状態 | completed |

## 目的

UT-19 の docs-only 成果物が、line budget・link 健全性・mirror parity（index.md / artifacts.json / phase-*.md / outputs の整合）・AC トレース完全性・spec 一致性（`gh api` レスポンス vs index.md 期待値）の観点で品質基準を満たしていることを一括判定する。個人開発方針（reviews=0, enforce_admins=false, CI ゲートのみ）が secret hygiene / 無料枠制約と矛盾しないことも確認する。最終的に品質ゲート PASS / FAIL を判定する。

## 実行タスク

- 各 phase-*.md / index.md / artifacts.json の line budget を確認する
- 内部リンク（相対パス）の健全性を確認する
- index.md の Phase 一覧と artifacts.json の `phases` 配列、phase-*.md の存在を mirror parity で照合する
- AC-1〜AC-7 のトレースが Phase 7 の coverage-matrix で完全であるかを確認する
- `gh api` レスポンス（after JSON）と index.md の AC 期待値の spec 一致性を確認する
- 無料枠（GitHub Free / Actions 無料枠）と secret hygiene の遵守を確認する
- 品質ゲート PASS / FAIL を判定する

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ut-19-github-branch-protection-manual-apply/index.md | AC・成果物一覧の正本 |
| 必須 | docs/30-workflows/ut-19-github-branch-protection-manual-apply/artifacts.json | 機械可読サマリー |
| 必須 | docs/30-workflows/ut-19-github-branch-protection-manual-apply/outputs/phase-05/gh-api-after-main.json | 実適用結果（main） |
| 必須 | docs/30-workflows/ut-19-github-branch-protection-manual-apply/outputs/phase-07/coverage-matrix.md | AC × Phase トレース |
| 必須 | docs/30-workflows/ut-19-github-branch-protection-manual-apply/outputs/phase-08/runbook-dry-diff.md | DRY 化方針 |
| 参考 | CLAUDE.md | シークレット管理方針 |

## 実行手順

### ステップ 1: line budget・link 健全性の確認

- 全 phase-*.md / index.md / outputs 配下の主要 md について line budget（120-200 行 / phase, 200 行以下 / outputs）を確認する
- 内部相対リンクが解決可能であること（typo / 旧パス / 削除済みファイル参照がないこと）を確認する

### ステップ 2: mirror parity 確認

- index.md の Phase 一覧（13 行）と artifacts.json の `phases` 配列が完全一致であることを確認する
- artifacts.json `keyArtifacts` に列挙された全成果物が index.md / phase-*.md と整合していることを確認する
- root の artifacts.json と outputs/artifacts.json が同期コピーであることを確認する

### ステップ 3: AC トレース完全性 と spec 一致性

- coverage-matrix.md が AC-1〜AC-7 全行に検証項目・証跡パス・担当 Phase を記載していることを確認する
- `gh-api-after-main.json` / `gh-api-after-dev.json` の各キーが index.md の AC-1 / AC-2 期待値と一致していることを確認する
- 個人開発方針（reviews=0, enforce_admins=false）が JSON 実値と一致していることを確認する

### ステップ 4: 品質ゲート判定

- 各観点 PASS / FAIL を集計する
- 1 つでも FAIL があれば全体 FAIL として Phase 10 に差し戻す方針を明記する

## Line Budget / Link 健全性チェック【必須】

| 対象 | 期待値 | 確認方法 | 判定 |
| --- | --- | --- | --- |
| index.md | 120-200 行 | `wc -l` | pending |
| phase-01〜13.md | 各 120-200 行 | `wc -l` 一括 | pending |
| outputs/phase-*/main 成果物 | 200 行以下 | `wc -l` | pending |
| 内部相対リンク | 全て解決可能 | 手動 / `markdown-link-check` 相当 | pending |
| 旧 `develop` 正式指定 | 0 件 | `grep -rn "develop" docs/30-workflows/ut-19-github-branch-protection-manual-apply/` の結果から検査コマンド例・旧名説明を除外 | pending |

## Mirror Parity 確認【必須】

| 比較対象 | 期待 | 判定 |
| --- | --- | --- |
| index.md Phase 一覧 ⇄ artifacts.json `phases` | 行数・名称・file・outputs が完全一致 | pending |
| artifacts.json `keyArtifacts` ⇄ phase-*.md 成果物 | 全パスが phase-*.md の「成果物」節に存在 | pending |
| root artifacts.json ⇄ outputs/artifacts.json | バイト一致（同期コピー） | pending |
| index.md AC-1〜AC-7 ⇄ artifacts.json `acceptanceCriteria` | 7 件完全一致 | pending |

## Spec 一致性（gh api レスポンス vs index.md 期待値）【必須】

| AC | index.md 期待値 | after JSON 実値キー | 判定 |
| --- | --- | --- | --- |
| AC-1 | contexts=[ci, Validate Build] | `required_status_checks.contexts` | pending |
| AC-1 | reviews=0 | `required_pull_request_reviews.required_approving_review_count` | pending |
| AC-1 | force_pushes=false | `allow_force_pushes.enabled` | pending |
| AC-1 | deletions=false | `allow_deletions.enabled` | pending |
| AC-1 | enforce_admins=false | `enforce_admins.enabled` | pending |
| AC-2 | dev も AC-1 と同等 | dev 側 JSON | pending |
| AC-3 | production: main のみ / Reviewers 0 | UI 目視 + smoke test | pending |
| AC-4 | staging: dev のみ | UI 目視 | pending |

## 無料枠確認

| 制約項目 | 無料枠上限 | 本タスク影響 | 判定 |
| --- | --- | --- | --- |
| GitHub Free（branch protection） | 個人 public/private で無料 | 設定のみ・コスト対象外 | PASS |
| GitHub Actions 無料枠 | 2,000 min/月（private） | 検証用 CI を1回以上実行する程度 | PASS |
| GitHub Environments | Free tier で利用可（Required Reviewers 制約なし） | 0 名運用のため制約に抵触しない | PASS |
| `gh` CLI | 無料 | 無料枠内 | PASS |

## Secret Hygiene 確認

| 確認項目 | 方針 | 状態 |
| --- | --- | --- |
| `gh api` レスポンス JSON | 機密情報なし（公開可能） | pending |
| `apply-execution-log.md` | トークン / PAT が出力されていないこと | pending |
| Repository secret の言及 | パス参照のみで実値非掲載 | pending |
| ドキュメント内の token 例示 | プレースホルダー（`<TOKEN>`）のみ | pending |

## 個人開発方針 整合確認

| 不変条件 | 期待 | 判定 |
| --- | --- | --- |
| Required Reviewers 0 名（main / dev / production） | 全て 0 | pending |
| enforce_admins=false | main / dev とも false | pending |
| CI ゲートのみ必須（contexts のみ非空） | contexts=[ci, Validate Build] のみ | pending |
| `develop` 旧名の正式指定残存ゼロ | grep 結果から検査コマンド例・旧名説明を除外して 0 件 | pending |

## 品質ゲート判定

| 観点 | 判定 | 備考 |
| --- | --- | --- |
| line budget | pending | Phase 9 で確定 |
| link 健全性 | pending | 内部リンク全解決 |
| mirror parity | pending | index ⇄ artifacts ⇄ phase ⇄ outputs |
| AC トレース完全性 | pending | coverage-matrix で 7/7 |
| spec 一致性 | pending | after JSON ⇄ index 期待値 |
| 無料枠 | PASS | GitHub Free で完結 |
| secret hygiene | pending | トークン非露出 |
| 個人開発方針整合 | pending | reviews=0 / enforce_admins=false |
| **総合** | **pending** | 1 件でも FAIL なら Phase 10 差し戻し |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 5 | 実適用 JSON を spec 一致性確認の入力に使用 |
| Phase 7 | coverage-matrix を AC トレース完全性の入力に使用 |
| Phase 8 | DRY 化方針が品質基準と矛盾しないか確認 |
| Phase 10 | 品質ゲート判定を GO/NO-GO に反映 |
| Phase 12 | quality-report をドキュメント更新時の品質根拠として参照 |

## 多角的チェック観点（AIが判断）

- 価値性: 品質ゲート PASS により後続タスク（UT-05 / UT-06）の手戻りリスクが最小化されるか。
- 実現性: docs-only タスクとして JSON / md / grep のみで全観点を判定できるか。
- 整合性: 個人開発方針が `gh api` 実値・index.md・runbook で完全に一致するか。
- 運用性: FAIL 発生時に差し戻し先 Phase が一意に特定できる構造になっているか。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | line budget / link 健全性確認 | 9 | pending | wc -l + リンク解決 |
| 2 | mirror parity 確認 | 9 | pending | index ⇄ artifacts ⇄ phase |
| 3 | spec 一致性確認 | 9 | pending | after JSON ⇄ index 期待値 |
| 4 | 無料枠 / secret hygiene 確認 | 9 | pending | GitHub Free / token 非露出 |
| 5 | 品質ゲート総合判定 | 9 | pending | outputs/phase-09/quality-report.md |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-09/quality-report.md | line budget / link / mirror / AC / spec / 無料枠 / secret 一括判定レポート |
| メタ | artifacts.json | Phase 状態の更新 |

## 完了条件

- line budget / link 健全性 / mirror parity / AC トレース / spec 一致性 / 無料枠 / secret hygiene / 個人開発方針整合の全観点で判定が記録されている
- 総合判定が PASS であるか、FAIL の場合は差し戻し先 Phase が明示されている
- quality-report.md が outputs/phase-09/ に配置されている

## タスク100%実行確認【必須】

- 全実行タスクが completed
- 全成果物が指定パスに配置済み
- 全完了条件にチェック
- 異常系（FAIL 時の差し戻しフロー）も検証済み
- 次 Phase への引き継ぎ事項を記述
- artifacts.json の該当 phase を completed に更新

## 次 Phase

- 次: 10 (最終レビュー)
- 引き継ぎ事項: 品質ゲート判定結果（PASS / FAIL）・FAIL 時の差し戻し先・無料枠 PASS・secret hygiene 確認結果を Phase 10 に引き継ぐ。
- ブロック条件: 品質ゲートに FAIL がある場合は Phase 10 に進まず該当 Phase に差し戻す。
