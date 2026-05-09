# Phase 3: 設計レビュー — issue-571-runtime-smoke-ci-staging-integration

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| phase | 3 / 13 |
| 入力 | Phase 2 outputs（workflow YAML 設計 / ADR 骨子 / file inventory） |
| 出力 | `outputs/phase-03/main.md`（レビュー観点ごとの判定 / 修正指示 / 残課題） |

## 目的

Phase 2 の設計を **3 系統レビュー（システム系・戦略価値系・問題解決系）** で検証し、Phase 4 以降に持ち込むべき修正・残課題を確定する。task-specification-creator skill `references/requirements-review.md` の手順に従う。

## レビュー観点（必須）

### システム系
1. **trigger 制約**: `workflow_call` 採用は API staging deploy 後に同一 ref で smoke を実行できるか？
   - 判定条件: dispatch 元 workflow が dev branch で実行されても dispatch payload が staging-runtime-smoke へ届くこと
   - リスク: reusable workflow call の接続 drift。`backend-ci.yml` と `runtime-smoke-staging.yml` を actionlint と grep gate で固定
2. **secret scope**: Environment-scoped secret が production secret と混線しないか？
   - 判定条件: `staging-runtime-smoke` Environment が production secret を継承しないこと（GitHub Environment は明示しない限り継承しない仕様）
   - 検証: `gh api repos/{owner}/{repo}/environments/staging-runtime-smoke/secrets` で list し、`STAGING_*` のみが含まれること
3. **`::add-mask::` 順序**: secret 参照前の `::add-mask::` 宣言は無効。設計 A.3 の順序が正しいか？
   - 判定条件: secret を `env:` で渡し、最初の `run:` step で `::add-mask::` を即時宣言。以降の step は mask 後に値を参照
   - 既存事故: `set -x` が `::add-mask::` 宣言前に有効化され、env dump で leak した事例
4. **timeout / concurrency**: `timeout-minutes: 10` / `concurrency.cancel-in-progress: false` で十分か？
   - 判定: smoke 1 回 < 2min を Phase 11 で実測。queue が長期化したら別途 dispatch 抑制
5. **artifact retention**: 30 日が evidence 保管要件と整合するか？
   - 判定: 30 日連続 PASS gate（required 昇格条件）と整合。長期保管は別仕組み

### 戦略価値系
6. **無料枠見積もり**: GitHub Actions 無料枠（public repo: 無制限 / private: 2,000 min/月）を超えないか？
   - 試算: staging deploy 月 30 回 × smoke 2 min = 60 min/月。failure 再実行を 5 倍と見ても 300 min。十分余裕
7. **required check 昇格の費用対効果**: required 昇格は merge を block するため、偽陽性率 < 2% 担保が必須
   - 戦略: 30 日 optional 運用 → 偽陽性率実測 → 昇格判断（別サイクル G5）

### 問題解決系
8. **redaction 偽陰性（base64 cookie）**: `scripts/smoke/redact.sh` が `Cookie: <base64>` を hit しない可能性
   - 対策: `scripts/smoke/__tests__/redact.test.sh` で `base64 -d` 後の文字列が evidence に残らないことを assert（Phase 4 テスト戦略）
9. **`set -x` × `::add-mask::` 事故再発**: 設計上 `set -x` を全削除しても、将来 PR で再導入されるリスク
   - 対策: grep gate を `.github/workflows/verify-no-debug-trace.yml`（既存 gate があれば流用）に追加。Phase 9 品質保証で fix
10. **Environment secret rotation**: `staging-runtime-smoke` secrets の rotate 手順が runbook にあるか？
    - 対策: ADR-runtime-smoke-secret-injection に rotate 手順（90 日 cron reminder）を追記

## レビュー判定

| 観点 | 判定 | 修正指示 |
| --- | --- | --- |
| 1. trigger 制約 | PASS | `backend-ci.yml` の `deploy-staging` 後に reusable workflow call |
| 2. secret scope | PASS | Phase 5 で `gh api .../secrets` 確認 step を runbook に含める |
| 3. `::add-mask::` 順序 | PASS | 設計 A.3 の順序を Phase 5 で逐語コピー。`set -x` 禁止を grep gate 化（Phase 9） |
| 4. timeout / concurrency | PASS | Phase 11 で実測値を取得し、長期化したら次サイクル調整 |
| 5. artifact retention | PASS | 30 日で確定 |
| 6. 無料枠 | PASS | 試算を Phase 12 implementation-guide に記録 |
| 7. required 昇格 | DEFER | 別サイクル G5。本サイクルでは optional 維持 |
| 8. redaction 偽陰性 | CONDITIONAL | Phase 4 で `redact.test.sh` 追加を必須化 |
| 9. `set -x` 再発 | CONDITIONAL | Phase 9 で grep gate 追加を必須化 |
| 10. Environment secret rotation | CONDITIONAL | runbook に rotate 手順追記（Phase 5） |

## 残課題（Phase 4 以降に引き渡す）

- R-1: redaction 偽陰性テスト（base64 cookie）の fixture 設計（→ Phase 4）
- R-2: `set -x` 再導入防止 grep gate（→ Phase 9）
- R-3: Environment secret 90 日 rotate automation（→ 実 secret 作成後に別 Issue 候補）
- R-4: required 昇格判断（→ 別サイクル / G5）
- R-5: production 拡張（→ 別 Issue）

## 検証コマンド

```bash
SPEC_DIR=docs/30-workflows/issue-571-runtime-smoke-ci-staging-integration
grep -q "trigger 制約\|secret scope\|::add-mask::\|redaction 偽陰性" "$SPEC_DIR/outputs/phase-03/main.md"
grep -q "R-1\|R-5" "$SPEC_DIR/outputs/phase-03/main.md"
```

## 完了条件（DoD）

- [ ] レビュー観点 10 項目に判定（PASS / CONDITIONAL / DEFER）が付与
- [ ] 修正指示が Phase 4 以降の対応 phase に紐付け
- [ ] 残課題 R-1〜R-5 が確定
- [ ] 設計上の致命的欠陥が無いことを明示
