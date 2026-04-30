# system-spec-update-summary.md

| spec | 差分 | 反映 |
| --- | --- | --- |
| `docs/00-getting-started-manual/specs/05-pages.md` | 公開 4 route と URL contract（`q/zone/status/tag/sort/density`）を正本化 | 反映済み |
| `docs/00-getting-started-manual/specs/12-search-tags.md` | `q` max 200、density 値 `comfy/dense/list`、`tag` repeated AND、tag 候補 UI は後続タスク扱いを明記 | 反映済み |
| `docs/00-getting-started-manual/specs/09-ui-ux.md` | 06a 公開層コンポーネント契約（Hero / StatCard / MemberCard / ProfileHero / FormPreviewSections）を追加 | 反映済み |
| `docs/00-getting-started-manual/specs/01-api-schema.md` | `responderUrl` を spec 固定値、`form-preview` の section 構成を確定 | 反映済み |

## 影響範囲

- 06b/06c は本仕様の URL helper / fetcher / EmptyState を再利用可能
- 08a contract test は `parseSearchParams` / `toApiQuery` の I/O を fixture に使用
- 08b Playwright は AC-12 の検証マトリクスを使用

## 追補同期

- `docs/00-getting-started-manual/specs/16-component-library.md` は存在しないため、旧参照を削除し、コンポーネント契約は `09-ui-ux.md` に集約した。
- `artifacts.json` は implementation / VISUAL に再分類し、root と `outputs/artifacts.json` を同一内容に同期した。
- `docs/30-workflows/06a-parallel-public-landing-directory-and-registration-pages/` を current canonical root とし、旧 `doc/02-application-implementation/...` 参照は legacy path として扱う。
