# Task E skill-feedback-report

## テンプレ改善

CI hard gate 化タスクでは、単に `grep -nE "continue-on-error"` を verify command に置くと「不在が正しい」状態で exit 1 になり、PASS 条件とコマンド終了コードが逆転する。task-specification-creator の CI/NON_VISUAL テンプレには、不在確認コマンドを `! grep ...` または対象 block 限定 `awk ... END{exit found ? 1 : 0}` として記述する注意を追加する余地がある。

## ワークフロー改善

coverage gate の soft gate 期間から hard gate へ昇格するタスクでは、`.github/workflows/ci.yml` の変更だけでなく、再混入防止の静的テスト（例: `scripts/coverage-guard.test.ts`）を同一タスクの完了条件に含めるべき。

## ドキュメント改善

aiworkflow-requirements の CI/CD current facts に `soft gate` 表現が残ると、実装済み hard gate と仕様が矛盾する。Phase 12 Step 2 では `deployment-gha.md` / `deployment-core.md` / `quality-requirements-advanced.md` の3点を同時確認対象にする。
