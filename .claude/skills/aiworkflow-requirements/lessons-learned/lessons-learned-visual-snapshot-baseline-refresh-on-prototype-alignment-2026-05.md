# Lessons Learned — prototype alignment PR の visual snapshot baseline 取り扱い (2026-05)

prototype 適用系の workflow（例: `login-page-prototype-alignment`, `home-page-prototype-alignment`, `members-page-prototype-alignment-spec` ほか UI prototype alignment 系全般）では、page.tsx / primitives / tokens を意図的に書き換えるため、`apps/web/playwright/tests/visual-full/full-visual.spec.ts-snapshots/` の対象ルート baseline が**確定的に陳腐化**する。本書は CI 上で初めて検出した際の標準復旧手順の正本。

## L-VISBASE-001: prototype 適用コミットで該当ルートの baseline 更新が抜けると CI `playwright-visual-full / visual-full (desktop|tablet|mobile)` が必ず fail する
- 症状: GitHub Actions の `playwright-visual-full` job 3 つ（desktop / tablet / mobile）が `Expected: .../full-visual-<route>-<viewport>-visual-full-chromium-<viewport>-linux.png` の diff で失敗。`X pixels (ratio Y of all image pixels) are different` と報告。
- 原因: prototype 適用 commit がコード（page.tsx / primitives）のみ変更し、`apps/web/playwright/tests/visual-full/full-visual.spec.ts-snapshots/` 内の該当 PNG を差し替えていない。
- pre-flight gate (`scripts/verify-pr-ready.sh`) は visual 比較を実行しないため、pre-push では気付かず push 後の CI で初めて検出される。これは**期待される動作**（ローカル mac で linux baseline を生成するとフォント / hinting 差で flaky になるため CI に集約する設計）。

## L-VISBASE-002: 標準復旧手順（CI artifact から actual.png を baseline に昇格させる）
失敗 job の `playwright-visual-<viewport>-diff` artifact に `<route>-<viewport>-actual.png` が含まれている。これを baseline に上書きする。

```bash
# 1. 失敗 run id を取得
gh pr checks <PR番号> --watch=false | awk -F'\t' '$2=="fail" {print $1, $4}'

# 2. 全 viewport の diff artifact をダウンロード
TMP=$(mktemp -d) && for v in desktop tablet mobile; do
  (cd "$TMP" && gh run download <RUN_ID> -R daishiman/UBM-Hyogo \
     -n "visual-full-$v-diff" -D "$v")
done

# 3. actual.png を baseline に上書き（非 retry ディレクトリを優先採用）
DEST=apps/web/playwright/tests/visual-full/full-visual.spec.ts-snapshots
for v in desktop tablet mobile; do
  ACTUAL=$(find "$TMP/$v" -path "*chromium-$v/full-visual-<route>-$v-actual.png" | head -1)
  cp "$ACTUAL" "$DEST/full-visual-<route>-$v-visual-full-chromium-$v-linux.png"
done

# 4. commit & push
git add "$DEST"/full-visual-<route>-*.png
git commit -m "test(visual-full): refresh <route> baselines after prototype alignment"
git push
```

- **retry 版を採用しない**: `*-retry1/` ディレクトリは再試行で生成されたもの。flakiness を baseline に焼き付けないため**非 retry 版を優先**する。両者が存在しない場合のみ retry 版で代替。
- **linux baseline は CI artifact から取るのが唯一の正解**: ローカル mac で `playwright test --update-snapshots` を走らせて作った PNG はフォントレンダリング差で linux CI と diff が出続けるため**禁止**。

## L-VISBASE-003: prototype alignment 系 PR の Phase 11 evidence チェックリスト
prototype alignment 系 task spec の Phase 11 manual-test-result 作成時に、以下を必須確認項目として明記する:

- [ ] `apps/web/playwright/tests/visual-full/full-visual.spec.ts-snapshots/full-visual-<route>-{desktop,tablet,mobile}-visual-full-chromium-{desktop,tablet,mobile}-linux.png` の 3 ファイルが該当 PR diff に含まれているか
- [ ] baseline 差し替えは **CI artifact (`visual-full-<viewport>-diff`) の `*-actual.png`** から取得したか（ローカル `--update-snapshots` 出力は不可）
- [ ] baseline 更新は prototype 適用 commit と分けても良いが、push 前に同一 PR に同梱する

## L-VISBASE-004: Next.js dev indicator が baseline に映り込むリスク
CI 環境で `NEXT_DEV_INDICATOR` 等が disable されていないと画面端に小さな黒丸（"N" アイコン等）が映り込み、baseline が将来の Next.js バージョン差分で破綻しやすくなる。

- 症状: baseline 採用後、Next.js minor bump 等で indicator 形状が変わると全ルートが一斉に微小 diff で fail する。
- 対策: visual-full project の playwright config で `NEXT_PUBLIC_DISABLE_DEV_INDICATOR=1` 相当の env を設定するか、`page.addStyleTag` で `#__next-route-announcer__, [data-nextjs-dev-tools-button]` 等を `display: none` する step を追加する（task-18 follow-up 対象）。
- 暫定運用: 現状 baseline には indicator が含まれている前提で運用し、Next.js bump 時に L-VISBASE-002 の標準復旧手順で再ベースラインする。

## 適用範囲
- `docs/30-workflows/*-prototype-alignment*/` 系の全 task（19 routes scope の UI prototype alignment / MVP recovery 配下）
- `docs/00-getting-started-manual/claude-design-prototype/` を正本とする UI 差し替え PR 全般
- 関連 ref:
  - `.claude/skills/task-specification-creator/references/phase-11-non-visual-alternative-evidence.md`（non-visual evidence のフォールバック）
  - CLAUDE.md `UI prototype alignment / MVP recovery` セクション
