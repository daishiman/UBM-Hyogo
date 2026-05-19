# Phase 2 outputs — 設計判断

| Decision ID | 内容 | 理由 |
|------------|------|------|
| D-01 | exclude 解析は vitest.config.ts の text parse (regex) | 100 行未満で AST 不要、簡素優先 |
| D-02 | threshold 0.30 を canonical | issue #256 AC3 と一致 |
| D-03 | initial gate は soft warn (PR comment, exit 0) | required check 化は別タスクで判定 |
| D-04 | error.tsx の exclude 解除は scope out | getEnv throw boundary、unit test 困難。Phase 5 で確定 |
| D-05 | 慣用名 "19-route smoke" を残し runbook で実数 17 を併記 | 既存命名との互換性確保 |
| D-06 | runbook 配置は `docs/30-workflows/runbooks/` (既存ディレクトリ) | 既存規約準拠 |
