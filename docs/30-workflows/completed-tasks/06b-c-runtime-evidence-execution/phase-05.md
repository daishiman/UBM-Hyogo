# Phase 5: capture wrapper 実行 — 06b-c-runtime-evidence-execution

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | 06b-c-runtime-evidence-execution |
| phase | 5 / 13 |
| 作成日 | 2026-05-04 |
| taskType | implementation（execution） |
| user_approval_required | false（Phase 1 の target / storageState / account / commit 範囲承認が済んでいる前提。Phase 11 は取得後の最終配置承認であり Phase 5 の前提ではない） |

## 目的

Phase 4 で確定したコマンドを実行し、M-08 / M-09 / M-10 / M-16 の evidence ファイルを `docs/30-workflows/completed-tasks/06b-C-profile-logged-in-visual-evidence/outputs/phase-11/` に生成する。command log を漏れなく `outputs/phase-05/main.md` に保存する。

## 入力 / 出力

| | 内容 |
| --- | --- |
| 入力 | Phase 4 確定 command、Phase 1 storageState |
| 出力 | screenshot / DOM dump 群（先行タスク phase-11 配下）、`outputs/phase-05/main.md`、`outputs/phase-05/command-log.md` |
| 副作用 | Playwright が target host に HTTP アクセスし `/profile` / `/profile?edit=true` / logout endpoint を読み取る |

## 実行手順

### 5.1 storageState 取得（必要時のみ。1 回限り）

storageState がまだ無い、または `phase-04` の期限切れチェックで失敗した場合のみ実行する。

```bash
mkdir -p apps/web/playwright/.auth
mise exec -- pnpm --filter @ubm-hyogo/web exec playwright codegen \
  --save-storage=apps/web/playwright/.auth/state.json \
  <approved-target>/login
```

ブラウザが開くので Phase 1 で承認した `<member-email>` または `<admin-email>` で Magic Link / Google OAuth ログインし、`/profile` まで到達したら codegen を閉じる。

**重要**:
- state.json は `.gitignore` で除外されている。`git status` で当該 path が untracked にも staged にも出ないことを確認
- state.json の中身を `cat` / `Read` / `grep` しない

### 5.2 capture wrapper 実行（M-08 / M-09 / M-10 / M-16 一括取得）

```bash
mise exec -- bash scripts/capture-profile-evidence.sh \
  --base-url <approved-target> \
  --storage-state apps/web/playwright/.auth/state.json \
  --out-dir docs/30-workflows/completed-tasks/06b-C-profile-logged-in-visual-evidence/outputs/phase-11 \
  --project staging \
  --markers M-08,M-09,M-10,M-16 \
  2>&1 | tee /tmp/06b-c-runtime-capture.log
```

成功条件:
- exit 0
- stdout に `7 passed` 等、すべての test ケースが PASS
- `outputs/phase-11/screenshots/` に M-08 (desktop / mobile)、M-10 (desktop / mobile)、M-16 = 5 ファイル以上
- `outputs/phase-11/dom/` に M-09 (desktop / mobile)、M-10 (desktop / mobile) = 4 ファイル以上の JSON

### 5.3 command log 保存

`/tmp/06b-c-runtime-capture.log` の内容を `docs/30-workflows/06b-c-runtime-evidence-execution/outputs/phase-05/command-log.md` に転記する。転記時に下記を redact:

- 実 base URL（staging hostname の本体部分）→ `<approved-target>` でマスク
- email pattern → `<member-email>` でマスク
- token / cookie 様の長い base64 文字列 → `<redacted>` でマスク

### 5.4 生成ファイル一覧の取得

```bash
ls -la docs/30-workflows/completed-tasks/06b-C-profile-logged-in-visual-evidence/outputs/phase-11/screenshots/ \
  docs/30-workflows/completed-tasks/06b-C-profile-logged-in-visual-evidence/outputs/phase-11/dom/
```

ファイル名・サイズ・mtime を `outputs/phase-05/main.md` に記録する。

## 失敗時のエスカレーション

| 失敗パターン | 対応 |
| --- | --- |
| exit 1（baseURL guard） | Phase 1 / 3 を再確認し base URL を再承認 |
| exit 4（storageState not found） | 5.1 を実行 |
| Playwright timeout | Phase 10 へ進み再実行条件を整理 |
| 401 / 403 | storageState 期限切れの可能性。5.1 を再実行 |
| HTTP 5xx | target サーバ側障害。Phase 10 を経由し再試行 |

## 完了条件チェックリスト

- [ ] wrapper exit 0
- [ ] screenshot ≥ 5 / DOM dump ≥ 4 が生成された
- [ ] command log が `outputs/phase-05/command-log.md` に redact 済で保存された
- [ ] 生成ファイル一覧が `outputs/phase-05/main.md` に記録された
- [ ] state.json が `git status` で出てこない（`git ls-files apps/web/playwright/.auth/ \| grep -v .gitkeep` 0 件）

## 次 Phase への引き渡し

Phase 6 へ「生成ファイル一覧」を引き渡す。Phase 6 は内容検査（counts = 0、redaction、解像度等）。
