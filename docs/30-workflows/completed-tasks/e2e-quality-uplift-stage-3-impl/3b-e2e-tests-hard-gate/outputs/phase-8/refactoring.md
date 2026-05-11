# Phase 8 — リファクタリング evidence

`scripts/coverage-gate-e2e.sh` は単一スクリプト構成で完結。fixture override (`THRESHOLD_FIXTURE`) によりプロダクション path とテスト path の責務を分離済。workflow YAML は step 単位で意味が独立しており追加抽象化は不要。reporter 配列は既存 3 件 + monocart の単純末尾追加に留め、CI のみ `PLAYWRIGHT_EVIDENCE_DIR=playwright/evidence` で artifact upload path と reporter 出力先を固定する。
