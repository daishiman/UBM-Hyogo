# Phase 12: ドキュメント同期（task-02）

| 項目 | 値 |
|------|----|
| 入力 | `phase-11.md` evidence 取得 |
| 出力 | runbook 配置確認 / CLAUDE.md 整合性 / 未タスク同期 |

---

## 1. runbook 配置確認

| 項目 | 確認 |
|---|---|
| path | `docs/30-workflows/ci-secret-alignment-and-runtime-smoke-recovery/runbooks/secret-provisioning.md` |
| 親 index 参照 | 親 `index.md` の「不変条件 1」「実行 DoD」と内容一致 |
| 章立て | phase-5 §2.2 の 7 章を網羅 |
| 実値 | 存在しない（grep gate 0 件） |
| 禁止事項 §  | 「AI エージェントに `gh secret set` の実値投入を依頼しない」を含む |

---

## 2. CLAUDE.md シークレット管理セクションとの整合

CLAUDE.md `## シークレット管理` セクションの不変条件と本 runbook を突合:

| CLAUDE.md 記載 | runbook 整合 |
|---|---|
| ランタイムシークレットは Cloudflare Secrets | `STAGING_*` は Cloudflare Worker 起動時に Worker 自身が参照する secret ではなく、smoke 実行用の **GitHub Environment Secret** である点を runbook §目的 で明示済 |
| CI/CD シークレットは GitHub Secrets | runbook §投入手順 が `gh secret set --env staging-runtime-smoke` を採用 |
| ローカル秘密情報の正本は 1Password | `SLACK_WEBHOOK_INCIDENT` の取得元として 1Password Vault `UBM-Hyogo / Slack incident webhook` を runbook §必要 secret 一覧 で参照 |
| 平文 `.env` をコミットしない | runbook が `.env` への記載を求めない（`gh secret set` 経由のみ） |
| AI が `op run` 経由のラッパー以外で実値を扱わない | runbook §禁止事項 に明示 |

→ CLAUDE.md の更新は **不要**（運用ポリシーは既存記述で十分）。

---

## 3. 親ワークフローとの整合

| 親ファイル | 整合性 |
|---|---|
| 親 `index.md` 不変条件 3 「`runtime-smoke-staging.yml` は必須 env が空のとき early-fail で readiness 不足を明示」 | 本 task の workflow YAML 編集で実装 |
| 親 `index.md` 不変条件 4 「secret 値そのものは仕様書・ドキュメント・コミットメッセージに一切記載しない」 | 本 task の runbook で grep gate 通過 |
| 親 `index.md` DoD 「`runtime-smoke-staging / smoke` が成功するか、または readiness 不足を明示する exit でユーザーに必要 secret を伝える」 | 本 task の pre-check step で達成 |
| 親 `outputs/phase-3/phase-3.md` 実装計画 | 本 task の Phase 3 と整合 |

---

## 4. 未タスク検出

| 候補 | 判定 |
|------|------|
| task-01（`web-cd.yml` secret 名整合） | **既存サブタスクとして並列**で進行。未タスクではない |
| smoke スクリプトの再設計 | スコープ外。後続 task として起票するかは task-02 完了後の運用判断に委ねる |
| `staging` / `production` env の secret provisioning runbook | task-01 のスコープ（または別 runbook）。本 task では扱わない |
| その他 | **0 件** |

→ 新規タスク起票: 不要。

---

## 5. ドキュメント更新サマリ

| 種別 | path | 状態 |
|------|------|------|
| new | `docs/.../runbooks/secret-provisioning.md` | 新規作成 |
| new | `docs/.../task-02-.../index.md` | 新規作成 |
| new | `docs/.../task-02-.../phase-{1..13}.md` | 新規作成 |
| new | `docs/.../task-02-.../artifacts.json` | 新規作成 |
| new (evidence) | `docs/.../task-02-.../outputs/phase-11/evidence/*` | runtime 観測時に生成 |
| edit | （対象なし） | CLAUDE.md / 親 index.md の改訂は不要 |
| delete | `docs/.../task-02-.../main.md` | 既存単一ファイルから Phase 1-13 構成への移行に伴い削除（情報は phase-* / runbook に分散済） |

---

## 6. リンク整合確認

- 親 `index.md` の「サブタスク一覧 task-02」が本 task の `index.md` と整合する。
- pre-check step の `::error::` メッセージ内の runbook 相対 path が実在 path と一致する: `docs/30-workflows/ci-secret-alignment-and-runtime-smoke-recovery/runbooks/secret-provisioning.md`。
- 本 phase-12 から runbook への相対参照が正しく解決できる。
