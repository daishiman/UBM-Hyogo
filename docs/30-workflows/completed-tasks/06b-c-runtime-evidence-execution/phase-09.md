# Phase 9: secret 露出チェック — 06b-c-runtime-evidence-execution

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | 06b-c-runtime-evidence-execution |
| phase | 9 / 13 |
| 作成日 | 2026-05-04 |
| taskType | implementation（execution + verification） |
| user_approval_required | false |

## 目的

ここまでに生成した evidence・更新した docs に email / token / cookie / storageState 値が露出していないことを最終確認する。Phase 13 で commit する前に実施する最後の自動検査ゲート。

## 入力 / 出力

| | 内容 |
| --- | --- |
| 入力 | Phase 5–8 で更新したすべての docs / evidence ファイル |
| 出力 | `outputs/phase-09/main.md`（grep / git ls-files の結果） |

## 9.1 storageState が tracked になっていないこと

```bash
git ls-files apps/web/playwright/.auth/ | grep -v '\.gitkeep$'
```

期待: 出力 0 行。1 行以上あれば即停止し、`git rm --cached <file>` で untrack（実体は残す）してから `.gitignore` を確認。

## 9.2 未追跡を含む docs/evidence と git diff 上に token / cookie / Magic Link が無いこと

```bash
rg -n "(__Secure-next-auth\.session-token|next-auth\.session-token|csrf-token|access_token|refresh_token|id_token=|callback/email\?token=|authorization: bearer|cookie:.*=eyJ)" \
  docs/30-workflows/06b-c-runtime-evidence-execution/ \
  docs/30-workflows/completed-tasks/06b-C-profile-logged-in-visual-evidence/outputs/phase-11/ \
  docs/30-workflows/completed-tasks/06b-C-profile-logged-in-visual-evidence/outputs/phase-12/ \
  || echo "OK: no auth tokens in docs/evidence files"

git diff | grep -E "(__Secure-next-auth\.session-token|next-auth\.session-token|csrf-token|access_token|refresh_token|id_token=|callback/email\?token=)" || echo "OK: no auth tokens in git diff"

git diff --staged | grep -E "(__Secure-next-auth\.session-token|next-auth\.session-token|csrf-token|access_token|refresh_token|id_token=|callback/email\?token=)" || echo "OK: no auth tokens in staged diff"
```

期待: いずれも `OK:` のみ。マッチしたら該当行を redact し、必要に応じて明示 `git add` 後に再検査する。

## 9.3 docs に test account email が混入していないこと

```bash
rg -n -e "(manjumoto\.daishi@senpai-lab\.com|manju\.manju\.03\.28@gmail\.com)" \
  docs/30-workflows/06b-c-runtime-evidence-execution/ \
  docs/30-workflows/completed-tasks/06b-C-profile-logged-in-visual-evidence/outputs/phase-11/ \
  docs/30-workflows/completed-tasks/06b-C-profile-logged-in-visual-evidence/outputs/phase-12/ \
  || echo "OK: no test account emails leaked"
```

期待: `OK: no test account emails leaked`。マッチしたら当該箇所を `<member-email>` 等に置換。

**注意**: 本仕様書（`docs/30-workflows/06b-c-runtime-evidence-execution/phase-01.md`）にはテストアカウント email が table で記載されているが、これは Phase 1 の手順説明として必要であり「test account を docs に書かない」という規則には抵触しない（Phase 1 が user 承認 gate 自体を扱うため）。Phase 9 の grep が phase-01.md にヒットすることは許容する。**ただし他 phase 仕様書 / outputs / evidence ファイル / commit message / PR body には絶対に書かない**。

修正: 上記 grep の対象から phase-01.md を除外する場合は以下:

```bash
rg -n -e "(manjumoto\.daishi@senpai-lab\.com|manju\.manju\.03\.28@gmail\.com)" \
  docs/30-workflows/06b-c-runtime-evidence-execution/ \
  docs/30-workflows/completed-tasks/06b-C-profile-logged-in-visual-evidence/outputs/phase-11/ \
  docs/30-workflows/completed-tasks/06b-C-profile-logged-in-visual-evidence/outputs/phase-12/ \
  | grep -v 'docs/30-workflows/06b-c-runtime-evidence-execution/phase-01.md' \
  || echo "OK: no test account emails outside Phase 1 spec"
```

## 9.4 evidence ファイル名に PII が無いこと

```bash
ls docs/30-workflows/completed-tasks/06b-C-profile-logged-in-visual-evidence/outputs/phase-11/screenshots/ \
   docs/30-workflows/completed-tasks/06b-C-profile-logged-in-visual-evidence/outputs/phase-11/dom/ \
  | grep -E "(@|gmail|senpai-lab)" || echo "OK: filenames clean"
```

期待: `OK: filenames clean`

## 9.5 PR body / commit message draft の事前チェック

Phase 13 の draft `outputs/phase-13/main.md` に対しても 9.2 / 9.3 を流す:

```bash
grep -E "(manjumoto\.daishi@|manju\.manju\.03\.28@|session-token|access_token|refresh_token|callback/email\?token=)" \
  docs/30-workflows/06b-c-runtime-evidence-execution/outputs/phase-13/main.md 2>/dev/null \
  || echo "OK: phase-13 draft clean"
```

## 9.6 結果の保存

各 grep / `git ls-files` 結果を `outputs/phase-09/main.md` の表に貼り、PASS / FAIL を marker する。

| 項目 | コマンド | 期待 | 実測 |
| --- | --- | --- | --- |
| storageState untrack | `git ls-files apps/web/playwright/.auth/ \| grep -v .gitkeep` | 0 行 | … |
| token grep | `git diff --staged \| grep -E "(session-token\|access_token\|...)"` | OK | … |
| email grep | 9.3 | OK | … |
| filename grep | 9.4 | OK | … |
| phase-13 draft | 9.5 | OK | … |

## 完了条件チェックリスト

- [ ] 5 検査すべて PASS
- [ ] FAIL があった場合は当該箇所を redact し再検査までループ
- [ ] `outputs/phase-09/main.md` に検査結果表が記録

## 次 Phase への引き渡し

Phase 10 へ。失敗があった場合は Phase 10 の retry note に登録し、必要に応じて Phase 5 / 8 へ戻る。
