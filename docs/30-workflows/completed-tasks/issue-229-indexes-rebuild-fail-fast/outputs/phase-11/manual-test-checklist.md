# manual-test-checklist — issue-229 generate-index fail-fast 手動 smoke checklist

> 本ワークフロー（仕様書整備）では実走済み。本 checklist は実装サイクル担当が利用する操作仕様。

## 1. 前提確認（gate）

- [ ] `generate-index.js` の hardening 差分（atomic helper / decisive log / silent catch 分離 / CLI ガード / export）が手元の作業ブランチに準備されている
- [ ] 回帰 spec test `scripts/__tests__/generate-index-fail-fast.spec.ts` が作成済み
- [ ] `mise install` 済み / `pnpm install` 済み
- [ ] `git status` がクリーン

## 2. S-1 正常系 byte-identical

- [ ] `mise exec -- pnpm indexes:rebuild; echo "exit=$?"` を実行し `exit=0` を確認（AC-1）
- [ ] `git diff --quiet -- .claude/skills/aiworkflow-requirements/indexes` が差分 0 件（AC-4 byte-identical）
- [ ] exit code と diff 結果を `manual-smoke-log.md` §3 に転記

## 3. S-2 失敗注入 fail-fast

- [ ] 出力経路を一時的に書き込み不可化（例: `chmod -w` で indexes dir を read-only）
- [ ] `mise exec -- pnpm indexes:rebuild; echo "exit=$?"` を実行し `exit=1` を確認（AC-1）
- [ ] stderr に `[generate-index] <skill> / <index-file> <step> 失敗:` が出力されることを確認（AC-3）
- [ ] 書き込み権限を復旧（`chmod +w`）
- [ ] exit code と stderr 実出力を `manual-smoke-log.md` §4 に転記

## 4. S-3 atomic（部分書き込みなし）

- [ ] S-2 失敗注入直後に `find ... -name '*.tmp' | wc -l` が `0`（tmp 残存なし）（AC-2）
- [ ] `git diff --quiet -- indexes` が差分 0 件（本ファイルへの部分書き込みなし）（AC-2）
- [ ] 結果を `manual-smoke-log.md` §5 に転記

## 5. S-4 回帰 spec test

- [ ] `mise exec -- pnpm vitest run scripts/__tests__/generate-index-fail-fast.spec.ts` を実行
- [ ] write plan byte stability PASS
- [ ] `writeIndexFilesAtomically` 正常 commit PASS
- [ ] tmp write failure で本ファイル不変 + tmp 削除 PASS
- [ ] rename failure rollback PASS
- [ ] `extractHeadings` ENOENT 継続 / その他 I/O エラー throw PASS
- [ ] decisive log フォーマット PASS
- [ ] 結果を `manual-smoke-log.md` §6 に転記（AC-7）

## 6. S-5 hook / CI 回帰

- [ ] `bash scripts/hooks/indexes-drift-guard.sh; echo "exit=$?"` がグリーン（drift 0）（AC-4）
- [ ] `bash scripts/verify-pr-ready.sh` の indexes:rebuild drift gate が PASS

## 7. 副作用ガード確認

- [ ] 変更ファイルが `generate-index.js` + 新規 spec test の 2 件のみ（`git status --porcelain`）
- [ ] index ファイルに勝手な差分が staged されていない

## 8. 完了条件

- [ ] 全チェックボックスが ✓
- [ ] `manual-smoke-log.md` / `manual-test-result.md` を実値で更新
- [ ] 失敗事象は `discovered-issues.md` に追記
