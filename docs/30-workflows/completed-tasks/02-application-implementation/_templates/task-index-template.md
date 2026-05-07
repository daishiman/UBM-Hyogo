# タスク index テンプレート（app）

`<task-dir>/index.md` は次の章構成で書く。

## 必須章

1. **task name** — ディレクトリ名と同一
2. **wave / mode / owner** — Wave 番号、serial/parallel、担当エージェント名（未割当時は `-`）
3. **purpose** — 何を成立させるか（1〜2 文）
4. **scope in / out** — 含むもの・含まないもの
5. **dependencies** — 上流 wave / task、下流 wave / task
6. **refs** — 参照する specs/、prototype/、doc/01-infrastructure-setup/
7. **AC**（Acceptance Criteria） — 完了判定基準（quantitative）
8. **13 phases** — phase-01.md〜phase-13.md の概要 1 行ずつ
9. **outputs** — `outputs/phase-XX/` 配下に何を生成するか
10. **services / secrets** — 利用する Cloudflare service / 環境変数 / secret
11. **invariants touched** — 触れる不変条件番号（CLAUDE.md と phase-1-requirements.md の不変条件 #1〜#15 から）
12. **completion definition** — 全 phase が green かつ phase-13 で PR 作成完了
