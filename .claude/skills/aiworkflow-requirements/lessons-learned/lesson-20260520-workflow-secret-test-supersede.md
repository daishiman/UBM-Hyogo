# Lesson — workflow secret 参照変更時の spec test 同期更新

> 起源: task-cf-token-staging-injection-fix-001 / PR #847 (2026-05-20)
> 失敗事象: `workflow-shell-lint` job が `workflow-env-scope.test.sh` で fail
> 関連 spec: `docs/30-workflows/task-cf-token-staging-injection-fix-001/index.md`

## 何が起きたか

backend-ci.yml の deploy step が参照する secret 名を、GitHub Environment 上の実在 secret (`CLOUDFLARE_API_TOKEN`) に統一する変更を入れた。しかし `scripts/__tests__/workflow-env-scope.test.sh` には先行 issue #718 で導入された「backend-ci は CF_TOKEN_D1_* / CF_TOKEN_WORKERS_* (scoped tokens) を使うべし」という assertion が残っており、新 SSOT と矛盾して CI が fail した。

## 教訓

`.github/workflows/*.yml` の secret / env 参照を変更するタスクでは、**同一 PR 内で必ず以下 3 つを同期する**:

1. workflow YAML の secret 参照
2. spec test (`scripts/__tests__/workflow-env-scope.test.sh` など) の assertion
3. spec 本体 (`docs/30-workflows/<task>/index.md`) の「supersede 宣言」

`scripts/__tests__/` 配下の workflow lint test は **過去 SSOT のスナップショット** であり、新 SSOT 確立時には silent な前 SSOT の生き残りを生む。Phase 5 (実装) の checklist に「workflow YAML 変更時は `grep -rn '<旧 secret 名>' scripts/__tests__/` で衝突箇所を列挙」を入れること。

## EVALS / Phase 12 への組み込み示唆

- Phase 12 compliance check に `bash scripts/__tests__/workflow-env-scope.test.sh` のローカル実行を必須化
- secret 名変更を伴う task では `outputs/phase-12/` に「supersede 対象 issue 一覧 + test 更新差分」を evidence として残す

## 適用範囲

- backend-ci.yml / web-cd.yml / post-release-dashboard.yml の secret 参照変更
- 将来の scoped token (CF_TOKEN_*) 復活時にも本 lesson は逆方向で適用される（test を scoped 期待に戻す）

## アンチパターン

- ❌ workflow YAML だけ修正して push → CI fail → 後追いで test 修正（履歴が分断され bisect 不能）
- ❌ test 側 assertion を理由コメントなしで差し替え（過去 SSOT の意図が消える）
