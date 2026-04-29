# テストシナリオ（TC-01〜TC-04 + EC-01〜EC-03）

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 4 / 13 |
| 区分 | 検証シナリオ（手動レビュー前提） |
| 作成日 | 2026-04-28 |
| visualEvidence | NON_VISUAL |
| 実施 Phase | Phase 11（手動レビュー）で PASS/FAIL を記録 |

## 共通注意事項

- 実 `~/.claude/settings.json` / `~/.zshrc` / 他プロジェクト settings の書き換えは禁止
- `.env` の中身を `cat` / `Read` で開かない（CLAUDE.md ルール）
- API token / OAuth トークン値を一切記録しない
- `wrangler` 直接実行を勧める手順を含めない（`scripts/cf.sh` 経由）

## TC-01: project-local-first 単独で fresh プロジェクトの `defaultMode` が `bypassPermissions` を維持するか

| 項目 | 内容 |
| --- | --- |
| 紐付け AC | AC-2（再発判定） |
| 前提 | Phase 5 比較表 Section 2 が確定し、Phase 3 R-2 結論が記載されている |
| 操作 | 比較表「fresh 環境挙動」列の根拠が、公式 docs 引用 or 実機読み取り観測ログで裏付けられているか確認 |
| 期待結果 | project-local-first 単独では fresh プロジェクトで `bypassPermissions` を維持できない（**再発する**）旨が明示されている。または維持できる場合は引用付きの根拠が存在 |
| 失敗条件 | 根拠が任意推論のみで出典がない / 結論の表記が曖昧 |
| 実施 | Phase 11 |
| PASS/FAIL | （Phase 11 で記入） |

## TC-02: 案 A 適用後、シナリオ A / B の最終 `defaultMode` が変化しないこと

| 項目 | 内容 |
| --- | --- |
| 紐付け AC | AC-1, AC-3, AC-7 |
| 前提 | Phase 3 シナリオ A〜D 対応表が `outputs/phase-3/impact-analysis.md` §2 に存在 |
| 操作 | 評価順序（`global → global.local → project → project.local`）と勝ち優先順位（`project.local > project > global.local > global`）から、シナリオ A / B の最終値が案 A 採用後も不変であることを表で読み取り |
| 期待結果 | シナリオ A / B では最終 `defaultMode` が変化しないことが評価過程付きで記述されている |
| 失敗条件 | 評価過程が省略されており結論のみ記載 / 評価順序と勝ち順序が併記されていない |
| 実施 | Phase 11 |
| PASS/FAIL | （Phase 11 で記入） |

## TC-03: 案 A 適用後、fresh 環境（シナリオ C / D）で意図せず bypass 化することの許容判断

| 項目 | 内容 |
| --- | --- |
| 紐付け AC | AC-3, AC-4, AC-7 |
| 前提 | Phase 5 比較表 AX-5「fresh 環境挙動」にシナリオ C / D の挙動と許容判断が書かれている |
| 操作 | 「個人開発マシン限定」前提で、fresh 環境 bypass 化を ACCEPT / CONDITIONAL ACCEPT / REJECT のいずれで扱うか確認 |
| 期待結果 | 許容判断が明文化され、`task-claude-code-permissions-deny-bypass-verification-001` 結果との依存関係が記載されている |
| 失敗条件 | 許容判断欠落 / deny 検証タスクとの依存関係不明 |
| 実施 | Phase 11 |
| PASS/FAIL | （Phase 11 で記入） |

## TC-04: rollback 手順を dry-run で読み合わせ（実行禁止）

| 項目 | 内容 |
| --- | --- |
| 紐付け AC | AC-5, AC-6 |
| 前提 | Phase 5 比較表 Section 4 に global 採用時の rollback 手順がコマンドレベルで記述されている |
| 操作 | rollback 手順を上から順に「読み」、各コマンドが副作用なしで dry-run できるか確認（実行はしない） |
| 期待結果 | バックアップ取得 → 差分復元 → `source ~/.zshrc` 等が抜けなく並び、各コマンドが他プロジェクト副作用を生まない |
| 失敗条件 | 手順に抜け / 順序ミス / `wrangler` 直接実行など `scripts/cf.sh` / `op run` 経路を破る記述 / `.env` 実値を読む記述 |
| 実施 | Phase 11 |
| PASS/FAIL | （Phase 11 で記入） |

## エッジケース

### EC-01: deny 検証タスク未着で本タスク完了

| 項目 | 内容 |
| --- | --- |
| シナリオ | `task-claude-code-permissions-deny-bypass-verification-001` の成果物が未着で Phase 11〜12 を回す |
| 期待 | 比較表に「deny 実効性」軸を保留扱いで明示し、結果到着後に追記する旨を `unassigned-task-detection.md` に残す |
| 実施 | Phase 12 で記録 |

### EC-02: `~/dev` 配下に `defaultMode` 明示プロジェクトが存在

| 項目 | 内容 |
| --- | --- |
| シナリオ | grep で件数 1 以上を観測 |
| 期待 | 全件列挙し、案 A 採用時の最終値変化有無を表化（実値は記録しない） |
| 実施 | Phase 11（読み取り観測） |

### EC-03: fresh 環境で `~/.claude/settings.json` 自体が未配置

| 項目 | 内容 |
| --- | --- |
| シナリオ | 完全 fresh マシン（`~/.claude/` ディレクトリ自体未生成） |
| 期待 | 公式 docs の組み込み default を引用し、bypass 化リスクを評価 |
| 実施 | Phase 11（公式 docs 引用） |

## 環境ブロッカー記録欄

| ブロッカー | 状態 | 影響 TC |
| --- | --- | --- |
| `task-claude-code-permissions-deny-bypass-verification-001` 結果未着 | （未着の場合は CONDITIONAL ACCEPT） | TC-03（alias 強化を含む案の判定） |
| Anthropic 公式 docs で `defaultMode` 未指定時の挙動が未文書化 | 公式 docs 引用 + 補助観測ログ | TC-01 |

## 参照資料

- `phase-04.md` §テストシナリオ
- `outputs/phase-3/impact-analysis.md` §2 シナリオ A〜D
- ソース MD §6 検証手順
