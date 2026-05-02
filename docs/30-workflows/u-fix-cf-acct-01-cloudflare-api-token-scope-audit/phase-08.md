# Phase 8: DRY 化

## メタ情報

| 項目 | 値 |
| --- | --- |
| Task ID | U-FIX-CF-ACCT-01 |
| Phase | 8 |
| 状態 | spec_created |
| taskType | implementation |
| visualEvidence | NON_VISUAL |

## 実行タスク

1. Phase 1〜7 の成果物に重複構造があるかを点検する。
2. 並列タスク U-FIX-CF-ACCT-02 との設計重複（ADR・命名・運用ルール）を確認する。
3. DRY 化候補を YAGNI 原則で評価し、抽象化を適用する／しない判断と根拠を残す。

## 目的

Token スコープ最小化の設計・運用が U-FIX-CF-ACCT-02 と独立に存在するため、共通化（ADR 統合 / 共通ランブック化 / 命名規約集約）の必要性と過剰抽象化の境界を判定する。本 Phase の責務は「不要な抽象化を作らない」ことの明文化である。

## 参照資料

- `index.md`
- `artifacts.json`
- `phase-02.md`（権限マトリクス・ADR 化方針）
- `phase-05.md`（実装ランブック）
- 並列タスク: `../completed-tasks/fix-cf-account-id-vars-reference/U-FIX-CF-ACCT-02-cicd-runtime-warning-cleanup.md`
- `.claude/skills/task-specification-creator/references/phase-12-spec.md`

## 入力

- Phase 2 設計（権限マトリクス・適用順序・rollback・ADR 化方針）
- Phase 5 ランブック（Token 再発行・Secret 更新手順）
- U-FIX-CF-ACCT-02 の seed spec（wrangler runtime warning 対応）

## 重複構造の点検

| 観点 | 結果 |
| --- | --- |
| 権限マトリクスの構造 | wrangler-action / D1 migration / Pages deploy の 3 経路 × 6 権限という 1 表で完結。複数 phase に分散していない |
| `gh secret set --env staging` / `--env production` の手順 | staging / production で同じコマンド形を 2 回呼ぶ構造。共通化価値はあるが「環境ごとの Token 値が異なる」点で関数化メリット小 |
| ADR 化方針 | 本タスクと U-FIX-CF-ACCT-02 の双方が `docs/30-workflows/.../outputs/phase-12/adr-*.md` を生成する設計。重複懸念あり |
| `scripts/cf.sh` 経由実行 | 既に共通化済み。本タスクで追加ラッパは作らない |

## DRY 化候補の評価（YAGNI 適用）

| 候補 | 内容 | 採否 | 理由 |
| --- | --- | --- | --- |
| 共通 ADR 1 本化 | U-FIX-CF-ACCT-01 と U-FIX-CF-ACCT-02 の ADR を統合し `docs/40-adr/cloudflare-cicd-credentials.md` 等に集約 | 不採用 | 責務境界が「Token 権限監査」と「wrangler.toml warning」で異なり、レビュー観点・rollback 経路も別。1 本化すると変更影響範囲が肥大化 |
| ADR 相互参照のみ | 各タスクが独立 ADR を持ち、冒頭セクションで cross-reference する | 採用 | Phase 2 の ADR 化方針と整合。重複ゼロ・参照コスト最小 |
| 共通ランブック化 | Token 再発行手順を `scripts/cf-token-rotate.sh` 化 | 不採用 | 1 年に 1〜2 回の運用頻度で、対話的 Dashboard 操作を含むため自動化価値低い（YAGNI） |
| 権限マトリクスの集約 | aiworkflow-requirements 配下に「Cloudflare Token 必要権限一覧」を切り出し | 不採用（将来候補） | 現時点では参照元が本タスク 1 件。将来 OIDC 移行時に再評価し、Phase 12 unassigned-task に記録 |
| 命名規約 (`staging-` / `prod-` prefix) の集約 | Token 命名規約を別ドキュメントに切り出し | 不採用 | Phase 5 ランブックに記載するだけで足りる。集約コスト > 効果 |

## 並列タスクとの責務境界（重複回避）

| 領域 | 本タスク (01) | 並列タスク (02) |
| --- | --- | --- |
| Token 権限の最小化 | 担当 | 触らない |
| Token 値の分離（staging/prod） | 担当 | ADR で参照のみ |
| `apps/api/wrangler.toml` の vars 継承 warning | 触らない | 担当 |
| `apps/web/wrangler.toml` の `pages_build_output_dir` warning | 触らない | 担当 |
| ADR 文書 | `adr-cloudflare-token-scope.md` | `adr-cloudflare-wrangler-config.md` |

## navigation drift 確認

| 観点 | 結果 |
| --- | --- |
| 既存 `vars.CLOUDFLARE_ACCOUNT_ID` / `vars.CLOUDFLARE_PAGES_PROJECT` との命名整合 | OK（資格情報は `secrets.`、識別子は `vars.` の住み分けを維持） |
| `scripts/cf.sh` 命名との整合 | OK（新規ラッパ追加なし） |
| skill リファレンス（`deployment-secrets-management.md`）との整合 | OK（Token 運用ルールは既存記述を逸脱しない） |

## 統合テスト連携

- 本タスクは Cloudflare Token の権限編集・GitHub Secret 更新であり、アプリケーション統合テスト追加は行わない。
- 代替検証は Phase 4 / Phase 5 / Phase 11 の `gh secret list` / `scripts/cf.sh` dry-run / Cloudflare Dashboard 手動確認で担保する。

## 判定結果

**DRY 化適用なし（最小限の cross-reference のみ）**。

- 採用案: 各タスクの ADR を独立配置し、相互参照する方式（Phase 2 ADR 化方針と整合）。
- 抽象化を作らない理由: 運用頻度が低く、責務境界が明確に分かれているため、共通化の保守コストが効果を上回る（YAGNI）。
- 将来の見直し: OIDC 移行（Option D）が ADR 化された段階で「権限マトリクス集約」を再評価する。Phase 12 `unassigned-task-detection.md` に記録する。

## 完了条件

- [ ] 重複構造の点検結果が記録されている
- [ ] DRY 化候補 5 件が採否判定されている
- [ ] 並列タスク U-FIX-CF-ACCT-02 との責務境界が表化されている
- [ ] DRY 化適用なし（cross-reference のみ）の判定理由が明記されている
- [ ] 将来再評価条件（OIDC 移行時）が unassigned-task 候補として記録されている

## 苦戦想定

**1. ADR 1 本化への誘惑**
2 タスクとも Cloudflare CI/CD まわりのため統合 ADR にしたくなるが、レビュー時の差分追跡コストが上がるため、本 Phase で「独立 ADR + cross-reference」を明文化しておく。

**2. 共通ランブック化の判断基準**
スクリプト化すると Cloudflare Dashboard 操作（GUI）が分断されるため、対話手順を含むランブックは Markdown のままが妥当である点を明示する。

## 関連リンク

- 上位 index: `./index.md`
- 設計: `./phase-02.md`
- 並列タスク seed: `../completed-tasks/fix-cf-account-id-vars-reference/U-FIX-CF-ACCT-02-cicd-runtime-warning-cleanup.md`

## 成果物

- `outputs/phase-08/main.md`
