# Manual Smoke Log（チェックリストテンプレート）

> 本ファイルは spec_created 段階のテンプレート。実機実行は別実装タスクで「実施日時」「実観測結果」「判定」を埋める。

## 結果記録フォーマット（共通）

```markdown
- 実施日時: YYYY-MM-DD HH:MM (JST)
- 実行コマンド: `<command>`
- 期待結果: <expected>
- 実観測結果: <actual / 出力テキストの抜粋>
- 判定: PASS | FAIL | BLOCKED
- 備考: <env blocker [WEEKGRD-01] 等 / 補足>
```

source-level PASS（設計上正しい）と環境ブロッカー（実機未検証）は別カテゴリで記録する。

---

## TC-01: cc 起動直後の mode 表示

- 実施日時: ____-__-__ __:__
- 実行コマンド: `cc`
- 期待結果: 起動直後の mode 表示が `bypassPermissions`
- 実観測結果: ____
- 判定: PENDING
- 備考: 起動 banner / `/status` 出力で確認

## TC-02: reload / session 切替後の mode 維持

- 実施日時: ____-__-__ __:__
- 実行コマンド: `cc` 起動 → `/clear` または再起動
- 期待結果: 再起動後も `bypassPermissions` 維持
- 実観測結果: ____
- 判定: PENDING
- 備考: 階層上書きが効いていることの確認

## TC-03: 別プロジェクトでの cc 起動

- 実施日時: ____-__-__ __:__
- 実行コマンド: `cd <other-project> && cc`
- 期待結果: project 直下に `.claude/settings.json` がある場合はその値、無ければ globalLocal の `bypassPermissions`
- 実観測結果: ____
- 判定: PENDING
- 備考: 階層優先順位の境界確認

## TC-04: whitelist 効果（pnpm 実行）

- 実施日時: ____-__-__ __:__
- 実行コマンド: claude 内で `pnpm install` 等の whitelist 対象コマンドを実行
- 期待結果: 確認 prompt が出ない
- 実観測結果: ____
- 判定: PENDING
- 備考: `permissions.allow` の Bash パターンが効いていること

## TC-05: deny 効果（force push dummy）

- 実施日時: ____-__-__ __:__
- 実行コマンド: claude 内で `git push --force` 相当の dummy コマンドを依頼
- 期待結果: `permissions.deny` で block され、bypass モードでも実行されない
- 実観測結果: ____
- 判定: PENDING
- 備考: bypass + deny の優先関係（[Remaining Blocker]）

## TC-F-01: 不正な defaultMode 値

- 実施日時: ____-__-__ __:__
- 実行コマンド: `defaultMode: "invalidMode"` を含む settings で起動
- 期待結果: エラーまたは安全側 fallback（`acceptEdits` 相当）
- 実観測結果: ____
- 判定: PENDING
- 備考: 終了後 settings を元に戻すこと

## TC-F-02: alias typo

- 実施日時: ____-__-__ __:__
- 実行コマンド: `claude --dangerouslyy-skip-permissions`（typo）
- 期待結果: `unknown flag` エラー
- 実観測結果: ____
- 判定: PENDING
- 備考: alias 定義側の typo 検出シミュレーション

## TC-R-01: alias 行 grep 確認

- 実施日時: ____-__-__ __:__
- 実行コマンド: `grep -nE '^alias cc=' ~/.zshrc | wc -l`
- 期待結果: 出力が `1`（重複定義なし）
- 実観測結果: ____
- 判定: PENDING
- 備考: 多重 alias によるモード上書き事故を防止

---

## 集計テンプレート

| TC | 判定 | 備考 |
| --- | --- | --- |
| TC-01 | PENDING | |
| TC-02 | PENDING | |
| TC-03 | PENDING | |
| TC-04 | PENDING | |
| TC-05 | PENDING | |
| TC-F-01 | PENDING | |
| TC-F-02 | PENDING | |
| TC-R-01 | PENDING | |

合計: 8 件 / PASS: 0 / FAIL: 0 / BLOCKED: 0 / PENDING: 8
