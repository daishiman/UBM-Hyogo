# Lessons Learned — NON_VISUAL governance タスクパターン

> 起源: UT-GOV-004 required-status-checks-context-sync（2026-04-29）
> Feedback 源: `docs/30-workflows/completed-tasks/ut-gov-004-required-status-checks-context-sync/outputs/phase-12/skill-feedback-report.md`
> 関連: [references/phase-11-non-visual-alternative-evidence.md](../references/phase-11-non-visual-alternative-evidence.md) / [references/phase-template-phase8-10.md](../references/phase-template-phase8-10.md) / [references/phase-template-phase13-detail.md](../references/phase-template-phase13-detail.md)

## 適用条件

以下を **同時に満たす** タスクで本パターンを使う。

1. taskType = implementation だが、変更対象が GitHub Branch Protection / CI workflow / lefthook / docs governance 等の **非 UI / 非ランタイム** governance 設定
2. visualEvidence = NON_VISUAL（UI 差分が出ない）
3. 完了判定が `gh api ...` / `gh workflow run` 等の **CLI 実績エビデンス** で確定するシナリオ
4. 後続タスク（UT-GOV-001 等）への入力契約が必要

## パターン本体

### 1. Phase 8 を「単一正本 YAML」入力契約に固定する

- Phase 8（設計・契約整理）の出力として `outputs/phase-08/confirmed-contexts.yml` のような **機械可読 YAML 1 ファイル** を必ず生成する
- 後続タスク（例: UT-GOV-001）は **この YAML だけを唯一の入力源** として参照する契約にする
- 効果: ドキュメント間 drift を吸収し、後続タスクの「どの仕様が正本か」議論を消す
- 実例: UT-GOV-004 の `outputs/phase-08/confirmed-contexts.yml` が UT-GOV-001 への引き渡しを単一化した

### 2. `gh api check-runs` 実績確認を Phase 4 / 5 / 6 に並走させる

| Phase | 担当軸 | check-runs 利用箇所 |
| --- | --- | --- |
| Phase 4 | テスト戦略 | required contexts と実 check name の一致確認テスト設計 |
| Phase 5 | 実装ランブック | `gh api repos/:owner/:repo/commits/:sha/check-runs` で適用後実績取得 |
| Phase 6 | 異常系検証 | 故意に context drift を起こし fail を確認する負ケース |

- 三重で並走するため、いずれか 1 経路の見落としで failure を見逃す事故を防げる
- Phase 11（NON_VISUAL）では「実行ログ + check-runs JSON」が screenshot の代替 evidence になる

### 3. Phase 11 は「手動 smoke test + リンクチェック」役割で固定する

- NON_VISUAL governance タスクでは Phase 11 が UI/UX 検証から役割変質する
- 必ず以下 2 点を含める:
  - **手動 smoke test**: `gh api` / `gh workflow run` の実走ログ + 期待 JSON 抜粋
  - **リンクチェック**: 関連 docs / Issue / PR の URL 到達確認（Markdown link checker でも可）
- `phase-11-non-visual-alternative-evidence.md` の 4 階層（L1〜L4）と組み合わせて使う

### 4. Phase 13 の二重承認ゲートを明示する

- NON_VISUAL governance タスクは「production 設定変更」を伴うため、commit / push の **両方** をユーザー明示承認後のみ実行する
- Phase 13 main.md に以下の 2 ゲートを明記する:
  1. **Commit gate**: 変更サマリー提示 → ユーザー承認 → `git commit`
  2. **Push gate**: PR ブランチ確認 → ユーザー承認 → `git push` / `gh pr create`
- 自動実行（auto-commit / auto-push）はこのパターンでは禁止

### 5. artifacts.json 自動更新の検討（改善余地）

- 現状は Phase 完了時に `complete-phase.js` 経由で手動更新
- `outputs/verification-report.md` に「artifacts.json 未更新警告」が出やすい
- 将来案: Phase 完了 hook で artifacts.json を機械的に再生成する仕掛け（未実装）

## 必須チェック

- [ ] Phase 8 出力に機械可読 YAML（`confirmed-contexts.yml` 等）を 1 ファイル含めた
- [ ] 後続タスクが参照する入力契約として該当 YAML を Phase 1 AC に明記した
- [ ] Phase 4 / 5 / 6 で `gh api check-runs` 実績確認手順を並走させた
- [ ] Phase 11 main.md に「手動 smoke test + リンクチェック」セクションを設けた
- [ ] Phase 13 main.md に commit / push の **二重承認ゲート** を明示した
- [ ] artifacts.json 更新を Phase ごとに `complete-phase.js` で実行した

## やってはいけないこと

- Phase 8 の正本 YAML を後付けで複数ファイルに分散させる（drift の温床）
- `gh api check-runs` を Phase 5 だけで済ませる（並走確保が崩れる）
- Phase 11 を「NON_VISUAL なのでスキップ」と書く（必ず代替 evidence を出す）
- Phase 13 で commit / push を 1 つの承認で同時実行する

## 参照実例

- `docs/30-workflows/completed-tasks/ut-gov-004-required-status-checks-context-sync/outputs/phase-08/confirmed-contexts.yml`
- `docs/30-workflows/completed-tasks/ut-gov-004-required-status-checks-context-sync/outputs/phase-11/`
- `docs/30-workflows/completed-tasks/ut-gov-004-required-status-checks-context-sync/outputs/phase-12/skill-feedback-report.md`
