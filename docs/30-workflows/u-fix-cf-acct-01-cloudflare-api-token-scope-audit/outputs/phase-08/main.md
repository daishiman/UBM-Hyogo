# Phase 8: DRY 化

## メタ情報

| 項目 | 値 |
| --- | --- |
| Task ID | U-FIX-CF-ACCT-01 |
| Phase | 8 |
| 状態 | spec_created |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| 上流 | outputs/phase-02/main.md, outputs/phase-05/main.md, outputs/phase-07/main.md |
| 下流 | outputs/phase-09/main.md, outputs/phase-12/system-spec-update-summary.md（Phase 12 生成） |

## 1. 目的

Token スコープ最小化の設計・運用が並列タスク **U-FIX-CF-ACCT-02** と独立に存在するため、共通化（ADR 統合 / 共通ランブック化 / 命名規約集約）の必要性と過剰抽象化の境界を判定する。本 Phase の責務は「**不要な抽象化を作らない**」ことの明文化である（YAGNI 原則）。

## 2. 重複構造の点検

| 観点 | 結果 |
| --- | --- |
| 権限マトリクスの構造 | wrangler-action / D1 migration / Pages deploy の 3 経路 × 6 権限という 1 表で完結（Phase 2 §3）。複数 phase に分散していない |
| `gh secret set --env {staging,production}` の手順 | staging / production で同形のコマンドを 2 回呼ぶ構造。値が環境ごとに異なるため関数化メリット小 |
| ADR 化方針 | 本タスクと U-FIX-CF-ACCT-02 双方が `docs/30-workflows/.../outputs/phase-12/adr-*.md` を生成する設計。重複懸念あり |
| `scripts/cf.sh` 経由実行 | 既に共通化済み。本タスクで追加ラッパは作らない |
| Token 値非記録ガード | Phase 4 §6 / Phase 5 §6 / Phase 6 §3 に再掲がある。意図的な再掲（境界別の文脈で必要）として許容 |

## 3. DRY 化候補の評価（YAGNI 適用）

| 候補 | 内容 | 採否 | 理由 |
| --- | --- | --- | --- |
| 共通 ADR 1 本化 | U-FIX-CF-ACCT-01 と U-FIX-CF-ACCT-02 の ADR を統合し `docs/40-adr/cloudflare-cicd-credentials.md` 等に集約 | **不採用** | 責務境界が「Token 権限監査」と「wrangler.toml warning」で異なり、レビュー観点・rollback 経路も別。1 本化すると変更影響範囲が肥大化 |
| ADR 相互参照のみ | 各タスクが独立 ADR を持ち、冒頭セクションで cross-reference する | **採用** | Phase 2 §9 ADR 化方針と整合。重複ゼロ・参照コスト最小 |
| 共通ランブック化 | Token 再発行手順を `scripts/cf-token-rotate.sh` 化 | **不採用** | 1 年に 1〜2 回の運用頻度で、対話的 Dashboard 操作を含むため自動化価値低い（YAGNI） |
| 権限マトリクスの集約 | `aiworkflow-requirements` 配下に「Cloudflare Token 必要権限一覧」を切り出し | **不採用（将来候補）** | 現時点では参照元が本タスク 1 件。OIDC 移行時に再評価し、Phase 12 `unassigned-task-detection.md` に記録 |
| 命名規約 (`staging-` / `prod-` prefix) の集約 | Token 命名規約を別ドキュメントに切り出し | **不採用** | Phase 5 ランブックに記載するだけで足りる。集約コスト > 効果 |
| Token 値非記録ガード共通モジュール化 | `set -x` 禁止・stdin 経路強制を skill リファレンス化 | **将来候補** | OIDC 移行 ADR と同タイミングで `aiworkflow-requirements/references/deployment-secrets-management.md` 強化として再評価 |

## 4. 並列タスクとの責務境界（重複回避）

| 領域 | 本タスク (U-FIX-CF-ACCT-01) | 並列タスク (U-FIX-CF-ACCT-02) |
| --- | --- | --- |
| Token 権限の最小化 | 担当 | 触らない |
| Token 値の分離（staging/prod） | 担当 | ADR 内で参照のみ |
| `apps/api/wrangler.toml` の vars 継承 warning | 触らない | 担当 |
| `apps/web/wrangler.toml` の `pages_build_output_dir` warning | 触らない | 担当 |
| ADR 文書 | `adr-cloudflare-token-scope.md` | `adr-cloudflare-wrangler-config.md` |
| ADR cross-reference | 02 を参照 | 01 を参照 |

## 5. navigation drift 確認

| 観点 | 結果 |
| --- | --- |
| 既存 `vars.CLOUDFLARE_ACCOUNT_ID` / `vars.CLOUDFLARE_PAGES_PROJECT` との命名整合 | OK（資格情報 = `secrets.`、識別子 = `vars.` の住み分け維持） |
| `scripts/cf.sh` 命名との整合 | OK（新規ラッパ追加なし） |
| skill リファレンス（`deployment-secrets-management.md`）との整合 | OK（Token 運用ルールは既存記述を逸脱しない） |
| Phase 7 AC マトリクスとの整合 | OK（AC-10 が ADR cross-reference を要求し本 Phase が採用案で応える） |

## 6. 統合テスト連携

- 本タスクは Cloudflare Token の権限編集・GitHub Secret 更新であり、アプリケーション統合テスト追加は行わない。
- 代替検証は Phase 4 / Phase 5 / Phase 11 の `gh secret list` / `scripts/cf.sh` dry-run / Cloudflare Dashboard 手動確認で担保する。

## 7. 判定結果

**DRY 化適用なし（最小限の cross-reference のみ）**。

- 採用案: 各タスクの ADR を独立配置し、相互参照する方式（Phase 2 §9 ADR 化方針と整合）。
- 抽象化を作らない理由: 運用頻度が低く、責務境界が明確に分かれているため、共通化の保守コストが効果を上回る（YAGNI）。
- 将来の見直し: OIDC 移行（Option D）が ADR 化された段階で「権限マトリクス集約」「Token 値非記録ガード共通化」を再評価し、Phase 12 `unassigned-task-detection.md` に記録する。

## 8. AC マッピング（Phase 8 内 完結分）

| AC | 本 Phase での貢献 |
| --- | --- |
| AC-10 | ADR cross-reference 採用案を確定 |
| AC-11 | 「漏れなし / 整合性」観点で重複構造点検結果を提供 |

## 9. 完了条件

- [ ] 重複構造の点検結果が記録されている
- [ ] DRY 化候補 6 件が採否判定されている
- [ ] 並列タスク U-FIX-CF-ACCT-02 との責務境界が表化されている
- [ ] DRY 化適用なし（cross-reference のみ）の判定理由が明記されている
- [ ] 将来再評価条件（OIDC 移行時）が unassigned-task 候補として記録されている

## 10. 成果物

- 本ファイル: `outputs/phase-08/main.md`
