# Phase 7: 検証項目網羅性

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | Cloudflare R2 ストレージ設定 (UT-12) |
| Phase 番号 | 7 / 13 |
| Phase 名称 | 検証項目網羅性 |
| 作成日 | 2026-04-27 |
| 前 Phase | 6 (異常系検証) |
| 次 Phase | 8 (設定 DRY 化) |
| 状態 | pending |
| タスク種別 | spec_created（docs-only） |

## 目的

AC-1〜AC-8 の全受入条件に対して、Phase 4-6 の検証項目が完全にトレースされていることを確認する。Phase 4-6 で確認できなかった項目を特定し、補完計画（Phase 8 以降または別タスク委譲）を立てる。`[Feedback BEFORE-QUIT-002]` の方針に従い、全ファイル一律の検証ではなく「変更点ベースの局所検証スコープ」を明示する。

## 参照資料（前提成果物 / 前 Phase の成果物）

- `outputs/phase-04/precheck-checklist.md` - 事前検証結果（全 PASS）
- `outputs/phase-05/r2-setup-runbook.md` / `smoke-test-result.md` / `cors-config-applied.json.md` / `wrangler-toml-final.md` / `binding-name-registry.md`
- `outputs/phase-06/anomaly-test-cases.md` / `anomaly-test-result.md`
- `index.md` - AC-1〜AC-8 の正本

## 成果物（出力一覧）

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-07/coverage-matrix.md | AC × 検証項目（Phase 4-6）のトレース表 |
| ドキュメント | outputs/phase-07/coverage-report.md | 未カバー項目・補完計画・局所検証スコープ宣言 |
| メタ | artifacts.json | Phase 状態と outputs の記録 |

> 上記成果物の実体ファイルは Phase 7 実行時に作成する。本 phase 仕様書では作成しない。

## 実行タスク（チェックボックス形式）

### ステップ 1: AC-1〜AC-8 の検証項目トレース

- [ ] index.md の AC-1〜AC-8 を再読する
- [ ] 各 AC に対し、Phase 4-6 のどの作業手順 / 成果物が証跡となるかを特定する
- [ ] coverage-matrix.md に下表テンプレートで記入する

### ステップ 2: coverage-matrix.md の作成（テンプレート）

| AC | 内容 | 検証項目 | 担当 Phase | 証跡パス | 充足状態 |
| --- | --- | --- | --- | --- | --- |
| AC-1 | バケット作成・命名整合 | バケット作成 / 命名衝突確認 | Phase 4 / Phase 5 | precheck-checklist.md / r2-setup-runbook.md | TBD |
| AC-2 | wrangler.toml `[[r2_buckets]]` バインディング | wrangler.toml diff 適用確認 / dry-run | Phase 4 / Phase 5 | wrangler-toml-final.md | TBD |
| AC-3 | API Token R2:Edit スコープ | Token スコープ確認 / 専用 Token 作成 | Phase 4 / Phase 5 / Phase 6 | precheck-checklist.md / r2-setup-runbook.md / anomaly-test-result.md (FC-02) | TBD |
| AC-4 | smoke test 動作確認 | PUT/GET 実行と diff 確認 | Phase 5 | smoke-test-result.md | TBD |
| AC-5 | CORS 設定適用 | CORS JSON 適用 / CORS 違反検証 | Phase 5 / Phase 6 | cors-config-applied.json.md / anomaly-test-result.md (FC-01) | TBD |
| AC-6 | 無料枠モニタリング方針 | 仕様確認・UT-17 連携 TODO | Phase 6 | anomaly-test-result.md (FC-03) | TBD |
| AC-7 | 下流向けバインディング名公開 | binding-name-registry.md 作成 | Phase 5 | binding-name-registry.md | TBD |
| AC-8 | パブリック / プライベート選択基準・UT-17 連携 | runbook 内方針記載 / UT-16 申し送り | Phase 5 | r2-setup-runbook.md / binding-name-registry.md | TBD |

### ステップ 3: 未カバー項目の特定

- [ ] coverage-matrix.md で「TBD」または「未充足」となっている AC を抽出
- [ ] 未カバーの理由を分類:
  - 上流タスク未完了によるもの（UT-16 / UT-16 など）
  - docs-only スコープ外のもの（実装タスク委譲）
  - Phase 4-6 の手順漏れ（Phase 内補完）
- [ ] coverage-report.md に分類結果と補完計画を記載

### ステップ 4: 局所検証スコープの明示（[Feedback BEFORE-QUIT-002]）

- [ ] coverage-report.md の冒頭に「局所検証スコープ宣言」セクションを設ける
- [ ] 検証対象を以下に限定する旨を明記:
  - `apps/api/wrangler.toml`（変更点）
  - 新規 R2 バケット 2 個
  - 新規 / 拡張 API Token
  - 新規 CORS 設定
  - 新規ドキュメント（outputs/phase-04/05/06/07）
- [ ] 検証対象外（変更しない領域）:
  - `apps/web/wrangler.toml`（不変条件 5）
  - 既存 D1 バインディング
  - 既存 KV / Secrets

### ステップ 5: 補完テスト計画

- [ ] 未カバー項目について以下を決定:
  - 補完先 Phase（Phase 8 設定 DRY 化 / Phase 11 手動 smoke test / Phase 12 ドキュメント更新）
  - 別タスク委譲（UT-16 / UT-17 / ファイルアップロード実装）
- [ ] 各補完項目に期限・担当・前提条件を記録

### ステップ 6: 整合性確認・ハンドオフ

- [ ] AC-1〜AC-8 のうち 1 件以上が「補完不能」または「BLOCKER」となっている場合は Phase 10 最終レビューで GO/NO-GO 再判定する旨を coverage-report.md に明記
- [ ] coverage-matrix.md / coverage-report.md を Phase 8 に渡す

## 完了条件（受入条件 + AC-X との紐付け）

- [ ] AC-1〜AC-8 の全行に検証項目・担当 Phase・証跡パス・充足状態が記載されている → 全 AC のトレース
- [ ] 未カバー項目の補完計画が coverage-report.md に記載されている
- [ ] 局所検証スコープが明示されている（[Feedback BEFORE-QUIT-002]）
- [ ] AC × FC（Phase 6 の異常系）の対応関係が確認されている
- [ ] Phase 10 GO/NO-GO 判定で参照可能な状態にあること

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 8 | coverage gap のうち重複・命名ずれに由来する項目を DRY 化対象へ渡す |
| Phase 9 | AC カバレッジ表を品質保証の入力にする |
| Phase 10 | 未充足 AC と residual risk を final review に渡す |

## レビューポイント / リスク / 落とし穴

- AC-4 smoke test を staging のみで実施した場合、production 側の動作保証は「手動 smoke test (Phase 11)」または別タスクへ委譲することを明記
- AC-6 無料枠モニタリングは UT-17 未着手だと「将来宿題」になるが、申し送り経路（Phase 12 implementation-guide）が確保されていれば MINOR 許容
- AC-8 UT-17 連携は将来作業のため、現時点では「方針記載」をもって充足とする。実 origin 値の更新は UT-16 完了後
- 局所検証スコープを明示しないと Phase 9 品質保証で全ファイル一律のチェック漏れ判定をされる可能性がある（[Feedback BEFORE-QUIT-002]）
- 「TBD」が残ったまま Phase 10 に進めない。本 Phase で全 AC の充足状態を確定する
- coverage-matrix.md の証跡パスが実在しない（Phase 4-6 で作成されていない）場合は当該 Phase に差し戻す

## 次フェーズへの引き渡し

- Phase 8 への入力: coverage-matrix.md / coverage-report.md / 未カバー項目補完計画
- Phase 8 で実施すべき内容: 設定の DRY 化（wrangler.toml の env 別記述の重複削減 / CORS JSON テンプレ化検討）
- ブロック条件: AC-1〜AC-8 のうち未充足が「補完計画なしで」残っている場合は次 Phase に進まない
- Phase 10 への申し送り: coverage-matrix.md は GO/NO-GO 判定の根拠資料として使用する
- Phase 12 への申し送り: 局所検証スコープ宣言は implementation-guide にも転記する
