# Phase 3: 設計レビュー — ut-09a-cloudflare-auth-token-injection-recovery-001

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | ut-09a-cloudflare-auth-token-injection-recovery-001 |
| phase | 3 / 13 |
| wave | Wave 9 |
| mode | serial |
| 作成日 | 2026-05-04 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |

## 目的

Phase 1-2 で確定した scope / 設計（三段ラップ切り分け、`.env` op 参照存在確認、token scope 点検 SOP、`wrangler login` 残置検知）が、CLAUDE.md secret 管理ポリシー / Cloudflare CLI 実行ルール / 禁止事項、aiworkflow-requirements 不変条件と整合することをレビューで担保する。

## 実行タスク

1. `scripts/cf.sh` `scripts/with-env.sh` の三段ラップ構造が設計と一致していることを Read で確認する
2. CLAUDE.md「シークレット管理」「Cloudflare 系 CLI 実行ルール」「禁止事項」と設計が整合しているかを確認する
3. `.env` の中身を読まない原則が設計のどこにも違反していないかを確認する
4. `wrangler login` を採用する設計分岐がどこにも紛れ込んでいないかを確認する
5. evidence 化ルールが secret 非露出を構造的に担保しているかを確認する

## 参照資料

- scripts/cf.sh / scripts/with-env.sh
- CLAUDE.md（secret / cf.sh 規約 / 禁止事項）
- .claude/skills/aiworkflow-requirements/references/task-workflow-active.md

## 統合テスト連携

- 上流: 1Password CLI (`op`) signin / API Token 既発行 / ut-27 secrets
- 下流: Phase 11 復旧実測と `ut-09a-exec-staging-smoke-001` Phase 11 再実行へレビュー結果を渡す

## 実行手順

- レビューは grep / ls / Read 等の事実確認をもとに行い、想像で書かない
- 仮置きパスや仮置きコマンドが残っている場合は Phase 2 に差し戻す
- secret 値・実 vault 名・実 item 名・account id が一切埋め込まれていないことを grep で確認する

## レビュー観点

### ① 三段ラップ切り分けが実コードと整合するか

- `scripts/with-env.sh` が `op run --env-file=.env -- "$@"` 構造になっているか
- `scripts/cf.sh` が `mise exec -- wrangler "$@"` の前段で `with-env.sh` を呼んでいるか
- `whoami` サブコマンドが識別可能な形で実装されているか

### ② secret 非露出の構造的担保

- `scripts/cf.sh` / `scripts/with-env.sh` のいかなる log / echo 箇所も token 値を出力しないか
- evidence 化対象の log（exit code / account identity）に token / secret が混入する経路がないか
- redaction checklist が PASS 条件に組み込まれているか

### ③ `.env` 取扱の禁止事項遵守

- `.env` の値を `Read` / `cat` / `grep` で読む手順が設計に含まれていないか
- op 参照キー名抽出の grep が、値（`op://` 以降）を露出させない形になっているか
- 代替の「`scripts/cf.sh` 側からのキー名逆引き」が正本として位置付けられているか

### ④ `wrangler login` 禁止の遵守

- 設計のどこにも `wrangler login` 実行手順が含まれていないか
- 残置検知 / 除去 SOP は user 明示指示後にのみ実行する gate になっているか
- OAuth トークン経路を採用する分岐が紛れていないか

### ⑤ aiworkflow-requirements / CLAUDE.md との整合

- CLAUDE.md「Cloudflare 系 CLI 実行ルール」と矛盾していないか
- 不変条件 5「D1 への直接アクセスは `apps/api` に閉じる」と矛盾していないか
- `task-workflow-active.md` 反映ポイントが Phase 12 で曖昧でないか

## 多角的チェック観点

- システム系: 認証経路は op → mise → wrangler の 1 unified path に揃っている
- 戦略・価値系: staging evidence 復旧を最短で実現し、09c blocker 維持判断を governance として保持する目的に合致
- 問題解決系: `whoami` failure の真因（三段ラップのどの段で落ちたか）に対処する切り分け SOP が成立している

## サブタスク管理

- [ ] `scripts/cf.sh` `scripts/with-env.sh` 構造を Read で確認
- [ ] CLAUDE.md secret / cf.sh / 禁止事項との整合を確認
- [ ] `.env` を読まない原則が設計に守られているか確認
- [ ] `wrangler login` を採用する分岐がないか確認
- [ ] secret 値 / 実 vault 名が一切埋め込まれていないか grep で確認
- [ ] outputs/phase-03/main.md を作成する

## 成果物

- outputs/phase-03/main.md
- 差し戻しが必要な場合は outputs/phase-03/review-findings.md

## 完了条件

- 全レビュー観点（①〜⑤）で OK が確認されている
- 不整合があれば Phase 1 / 2 にフィードバックされている
- レビュー結果が Phase 4 以降の前提として明文化されている

## タスク100%実行確認

- [ ] 仮置き path / command が消えている
- [ ] secret / 実 vault 名 / 実 item 名 / account id / 個人情報が含まれていない
- [ ] `wrangler` 直接呼出が含まれていない
- [ ] `wrangler login` を採用する設計になっていない

## 次 Phase への引き渡し

Phase 4 へ、レビュー済 scope / 設計、解消した不整合一覧、残課題を渡す。
