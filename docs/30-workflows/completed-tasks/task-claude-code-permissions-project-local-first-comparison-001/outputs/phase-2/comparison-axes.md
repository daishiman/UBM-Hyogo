# 5 評価軸の定義とスコアリング方針（D-2）

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 2 / 13 |
| 区分 | 設計成果物（評価軸の固定） |
| 確定 Phase | Phase 5 比較表 Section 3 で実評価値に展開 |
| 作成日 | 2026-04-28 |
| visualEvidence | NON_VISUAL |

## 1. 5 軸サマリ

| ID | 軸 | 定義 | 良い状態 | 確認方法 |
| --- | --- | --- | --- | --- |
| AX-1 | 影響半径 | 設定変更が波及するスコープ（マシン全体 / 当該プロジェクト / 当該 worktree） | 当該プロジェクト・worktree に閉じる | 変更対象の階層を確認 |
| AX-2 | 再発リスク | 新規 worktree / 新規プロジェクトで prompt 復帰が起きる可能性 | fresh 環境でも prompt 復帰しない | 公式仕様引用 / 読み取り専用観測 |
| AX-3 | rollback コスト | 設定を元に戻すための手間（差分保存 / 復元コマンド数） | ファイル削除または単一差分復元で戻る | 手順レビュー（dry-run） |
| AX-4 | 他プロジェクト副作用 | `scripts/cf.sh` / `op run` / 他 worktree の権限評価への影響 | 0 件 | `~/dev/**/.claude/settings.json` の grep メタ情報 + scripts 経路レビュー |
| AX-5 | fresh 環境挙動 | global.local / project.local 未配置の fresh 環境での `defaultMode` 最終値 | 想定通り（許容判断付き） | シナリオ C / D |

## 2. スコアリング方針

| 軸 | スコア定義 | 注記 |
| --- | --- | --- |
| AX-1 影響半径 | 狭いほど良: project.local（当該 worktree） < project（リポジトリ） < global.local（マシン） < global（マシン横断） | shell alias 変更は別途「shell 全体」として最広域扱い |
| AX-2 再発リスク | 低いほど良: fresh worktree で再発しないなら「低」、する場合は「高」、回避策があるが手作業介入が必要なら「中」 | `.local` を git ignore する運用と相性 |
| AX-3 rollback コスト | 低いほど良: ファイル 1 つ削除で戻る = 「低」、settings + zshrc の dotfile バックアップ復元 = 「中」、複数機微経路の復元 = 「高」 | 採用案ごとに復元コマンド列を Phase 5 Section 4 に列挙 |
| AX-4 他プロジェクト副作用 | 0 件 = 「無」、grep 1 件以上で値変化あり = 「中」、shell 全体波及 = 「高」 | `wrangler` 直接実行を勧める変更は禁止（CLAUDE.md ルール） |
| AX-5 fresh 環境挙動 | 想定通り = ACCEPT、想定外だが個人開発マシン限定で許容 = CONDITIONAL ACCEPT、想定外で許容不可 = REJECT | Phase 3 シナリオ C / D で評価 |

## 3. 各軸の判定基準（Phase 5 で参照）

### AX-1 影響半径

- 案 A: shell 全体 + 全プロジェクト（global + alias）
- 案 B: 当該プロジェクトのみ（project.local）
- ハイブリッド: 段階的（基本は案 B、fresh 時のみ global fallback）

### AX-2 再発リスク

- `.local` 系は通常 git ignore のため、新規 worktree では再生成されず prompt 復帰の可能性あり
- global / project（共有層）に置けば再生成不要だが影響半径が広がる
- Phase 3 R-2 で 1 結論（公式仕様引用 or 実機観測）として記録する

### AX-3 rollback コスト

| 案 | 復元手順 | コスト評価 |
| --- | --- | --- |
| 案 A | `~/.claude/settings.json` + `~/.zshrc` の 2 ファイルを timestamp バックアップから復元、`source ~/.zshrc` 反映 | 中 |
| 案 B | `<project>/.claude/settings.local.json` を削除または編集 | 低 |
| ハイブリッド | 採用要素ごとに上記手順を組み合わせ | 中 |

### AX-4 他プロジェクト副作用

確認手順（読み取りのみ）:

```bash
# defaultMode 明示プロジェクトの件数（値は記録しない）
grep -rln '"defaultMode"' ~/dev/**/.claude/settings.json 2>/dev/null | wc -l

# scripts/cf.sh / op run 経路への影響レビュー（コードレビュー、書き換えなし）
```

評価項目:

- `scripts/cf.sh` 経由 Cloudflare CLI 運用への影響
- `op run --env-file=.env` 注入経路への影響
- `~/dev/**` 配下の他 worktree / 他リポジトリでの `defaultMode` 最終値変化

### AX-5 fresh 環境挙動

シナリオ C / D（Phase 3 R-4）に対応:

- シナリオ C: global / project のみ配置 → 案 A は bypass、案 B は default に戻る
- シナリオ D: global のみ配置 → 同上

許容判断: 個人開発マシン限定 + `task-claude-code-permissions-deny-bypass-verification-001` の deny 実効性確認後にのみ ACCEPT。

## 4. 出典スロット

各軸の評価値（Phase 5 Section 3）には以下のいずれかの出典を 1 つ以上紐付ける:

- `[公式 docs: settings 階層 / defaultMode / --dangerously-skip-permissions]`
- `[実機観測: fresh プロジェクト, 2026-04-28]`
- `[Phase 3 シナリオ A / B / C / D 対応]`
- `[Phase 3 影響分析（impact-analysis.md）]`

## 5. Phase 5 への申し送り

- 5 軸 × 3 案 = 15 セルの比較表を生成し、各セルに出典スロット 1 つ以上
- AX-3 rollback コストの「中」セルには Phase 5 Section 4 の rollback コマンド列へのリンク
- AX-4 他プロジェクト副作用の評価は Phase 3 `impact-analysis.md` を直接参照
- AX-5 fresh 環境挙動の許容判断は ACCEPT / CONDITIONAL ACCEPT / REJECT を明記

## 6. 参照資料

- `phase-02.md` D-2
- `outputs/phase-1/main.md` §5 / §6
- `.claude/skills/aiworkflow-requirements/references/claude-code-settings-hierarchy.md`
