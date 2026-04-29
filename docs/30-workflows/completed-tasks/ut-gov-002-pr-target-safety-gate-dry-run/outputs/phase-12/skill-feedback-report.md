# Phase 12: skill フィードバックレポート (skill-feedback-report)

task-specification-creator / aiworkflow-requirements skill を本タスクで運用した経験に基づくフィードバック。**改善点なしでも出力必須**だが、本タスクでは複数の論点を検出した。

## task-specification-creator skill

### 1. `spec_created` 状態の扱い（重要度: 中）

- **観察**: 本タスクは GitHub Issue #145 が CLOSED の状態で、仕様書のみを再構築する `spec_created` ワークフローを採った。Issue ライフサイクルと仕様作成行為を切り離す方針（index.md Decision Log）が必要だったが、skill SKILL.md には CLOSED Issue を再利用する場合のガイドが薄い。
- **提案**: `spec_created` の節に「CLOSED Issue を reopen せず、仕様作成行為のみで履歴を完結させる場合の注意点」を 1 段落追加すると、governance タスクで仕様再構築する局面の判断が明確になる。

### 2. `docs-only` × `NON_VISUAL` × Phase 11 の関係（重要度: 中）

- **観察**: Phase 11 「手動テスト」は本来 UI 視覚検証を想定するが、本タスクのような `docs-only` では「整合性検査ログ」に翻訳される。SKILL.md の Phase 11 説明はやや UI 寄りの記述に偏る。
- **提案**: Phase 11 spec 内に「`visualEvidence: NON_VISUAL` の場合のテンプレ（manual-smoke-log.md / link-checklist.md）」を例示パターンとして追加すると、本タスクのようなケースで再現性が上がる。

### 3. Phase 13 `local-check-result.md` の発見性（重要度: 低）

- **観察**: Phase 13 は `local-check-result.md` を必須成果物として要求するが、Phase テンプレを浅く読むと見落としやすい。
- **提案**: Phase 13 quick-summary に `local-check-result.md` を明示する（既存のフィードバックと同方向）。

### 4. outputs ディレクトリ構造の検証フィクスチャ（重要度: 低）

- **観察**: 13 Phase × 複数 outputs の整合（artifacts.json の outputs 配列と実体ファイル一致）を都度手動で検証している。
- **提案**: skill 側に `verify-outputs` 的な軽量スクリプト（artifacts.json と実体 ls の diff）を提示すると効率化できる。

## aiworkflow-requirements skill

### 1. governance / security 系タスクの Step 2 = N/A 経路（重要度: 中）

- **観察**: 本タスクは API/D1/IPC/UI/auth/Cloudflare Secret のいずれにも影響しないため Step 2 = N/A だが、quick-reference に「GitHub Actions governance / branch protection 系タスクは原則 N/A」というショートカットが無く、毎回 7 観点を個別判定する必要がある。
- **提案**: `references/quick-reference.md` に「governance 系タスク → 既定 N/A、ただし OIDC / `workflow_run` を新規採用する場合は再判定」というテーブル行を追加。

### 2. CLAUDE.md 参照との重複防止（重要度: 低）

- **観察**: CLAUDE.md と aiworkflow-requirements の両方にブランチ戦略・solo CI gate の記載があり、どちらが正本か迷う場面があった。本タスクでは CLAUDE.md を一次参照、aiworkflow-requirements を補強としたが、明文化のガイドが欲しい。
- **提案**: aiworkflow-requirements の topic-map に「CLAUDE.md と重複する項目はどちらが正本か」を表で明示。

## 改善点なしの領域

- Phase 1-3 のメタ情報フォーマット（互換性は完全）
- artifacts.json の JSON Schema 互換性
- task-specification-creator の Phase 12 必須 5 タスクの分類

## 総合所感

skill 全体としては本タスクの完了に十分な情報が提供されており、致命的な不足は無い。上記提案は Wave N+1 以降の skill 改善 PR で取り込み可能な粒度。
