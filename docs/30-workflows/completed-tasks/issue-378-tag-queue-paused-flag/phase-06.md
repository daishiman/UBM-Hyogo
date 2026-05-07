# Phase 6: 失敗ケース整理

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 6 |
| タスク | issue-378-tag-queue-paused-flag |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| 状態 | completed |


[実装区分: 実装仕様書]
判定根拠: env binding 追加・関数シグネチャ変更・テスト追加・runbook 新規作成を伴うため、コード変更が必須。

## 目的

flag 解釈・運用誤操作・boolean parse 周辺の異常系を列挙し、対応方針を fix する。

## 失敗ケース一覧

| # | ケース | 影響 | 対応方針 |
| --- | --- | --- | --- |
| F-1 | env `"True"` / `"TRUE"` / `"1"` / `"yes"` 等の typo | 停止しない（enqueue 継続） | 厳格 parse（`"true"` 完全一致のみ true）で**意図しない停止を防ぐ**。runbook に「`true` 小文字必須」と明記。 |
| F-2 | env 未設定 | enqueue 継続 | default disabled。意図通り。 |
| F-3 | wrangler.toml 編集後 deploy 忘れ | 停止が反映されない | runbook の手順 2 で deploy を必須項目化。手順チェックリスト化。 |
| F-4 | `[vars]` のみ更新し `[env.production.vars]` を更新し忘れ | production が停止しない | wrangler.toml の 3 セクション全てに記載することを phase-05 で必須化。 |
| F-5 | 復旧時に `"false"` への戻し忘れ | 永続停止 → queue が枯渇 | runbook の復旧手順 1 を必須項目化。pause 解除の確認 SQL を併記。 |
| F-6 | `parsePaused` への env 伝播漏れ（job 関数 scope） | 型エラーで build fail | typecheck で検知。phase-09 品質ゲートで担保。 |
| F-7 | structured log が candidate ごとに出る | log 容量増加 | pause 中の運用確認を優先し、`enqueueTagCandidate` 呼び出しごとに 1 行出す。batch 集約や sampling は現時点の要件外であり、0 件として検出済み。 |
| F-8 | 削除済み member skip との順序逆転 | log に paused が出ず、削除済み skip log が先に出る | pause guard を**先頭**に置く（phase-02 確定）。test case で順序確認は不要だが、guard 位置を review で確認。 |

## 実行タスク

- [x] Phase 6 の目的に沿って、本文で定義した確認・実装・検証を実施する。
- [ ] 関連する実コード、実仕様書、実スキル参照を同一サイクルで更新する。

## 参照資料

- `.claude/skills/task-specification-creator/SKILL.md`
- `.claude/skills/aiworkflow-requirements/SKILL.md`
- `docs/30-workflows/issue-378-tag-queue-paused-flag/artifacts.json`

### 依存 Phase

- Phase 5: `phase-05.md`

## 成果物

- `docs/30-workflows/issue-378-tag-queue-paused-flag/phase-06.md`
- Phase 6 に対応する `outputs/phase-06/` 成果物

## 統合テスト連携

- [ ] NON_VISUAL のため、統合テストは `pnpm --filter @ubm-hyogo/api test` と focused Vitest evidence に集約する。
- [ ] runtime Cloudflare mutation は user approval gate の外では実行しない。

## 完了条件

- [x] Phase 6 の完了条件を満たす。

- 失敗ケース 8 件が列挙されている。
- 各ケースの対応方針が phase-05 / runbook と整合している。
