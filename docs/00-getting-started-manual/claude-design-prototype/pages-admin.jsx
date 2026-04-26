// Admin pages: Dashboard, Member management, Tag assignment, Schema diff

// ================== ADMIN DASHBOARD ==================
const AdminDashboardPage = ({ nav }) => {
  const { MEMBERS, MEETINGS, SCHEMA_DIFF } = window.UBM;
  const visible = MEMBERS.filter((m) => !m.isDeleted);
  const pending = SCHEMA_DIFF.filter((d) => d.type === "unresolved" || d.type === "added").length;
  const byZone = ["0→1", "1→10", "10→100"].map((z) => ({ z, n: visible.filter((m) => m.ubmZone === z).length }));
  const byStatus = ["会員", "アカデミー生", "非会員"].map((s) => ({ s, n: visible.filter((m) => m.ubmMembershipType === s).length }));
  const untagged = visible.filter((m) => !m.tags || m.tags.length === 0);
  const notPublic = visible.filter((m) => !m.isPublic);

  return (
    <div className="page-enter stack-lg">
      <div className="page-head">
        <div>
          <div className="eyebrow">ADMIN</div>
          <h1 className="h-page">管理ダッシュボード</h1>
          <p className="muted">フォーム回答・スキーマ・メンバーの健全性を一画面で把握できます。</p>
        </div>
        <div className="btn-row">
          <span className="badge-sync"><span className="dot"/>Google Forms と同期中</span>
          <Button variant="ghost" icon="refresh">今すぐ同期</Button>
        </div>
      </div>

      {/* Alerts */}
      {pending > 0 && (
        <div className="card card-pad" style={{ background: "var(--warn-soft)", borderColor: "color-mix(in oklch, var(--warn) 20%, transparent)" }}>
          <div className="row-between">
            <div className="row" style={{ gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: "var(--warn)", color: "#fff", display: "grid", placeItems: "center" }}>
                <Icon name="alertTriangle" size={18}/>
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14, color: "oklch(0.35 0.12 75)" }}>フォームスキーマに未解決の変更があります</div>
                <div className="small" style={{ color: "oklch(0.40 0.10 75)" }}>{pending}件の項目をレビューしてください。stableKey の割り当てが必要な項目があります。</div>
              </div>
            </div>
            <Button variant="ghost" iconRight="arrowRight" onClick={() => nav("schema-diff")}>差分をレビュー</Button>
          </div>
        </div>
      )}

      {/* KPIs */}
      <div className="grid-4">
        <div className="card stat">
          <div className="stat-label">Total members</div>
          <div className="stat-value">{visible.length}</div>
          <div className="stat-sub">退会: {MEMBERS.length - visible.length}名</div>
        </div>
        <div className="card stat">
          <div className="stat-label">Public on site</div>
          <div className="stat-value">{visible.filter((m) => m.isPublic).length}</div>
          <div className="stat-sub">非公開: {notPublic.length}名</div>
        </div>
        <div className="card stat">
          <div className="stat-label">Untagged</div>
          <div className="stat-value" style={{ color: untagged.length > 0 ? "var(--warn)" : undefined }}>{untagged.length}</div>
          <div className="stat-sub">タグ割当が必要</div>
        </div>
        <div className="card stat">
          <div className="stat-label">Schema issues</div>
          <div className="stat-value" style={{ color: pending > 0 ? "var(--warn)" : "var(--ok)" }}>{pending}</div>
          <div className="stat-sub">未解決の変更</div>
        </div>
      </div>

      <div className="grid-2">
        {/* Zone distribution */}
        <div className="card card-pad-lg">
          <div className="row-between">
            <div>
              <div className="eyebrow">DISTRIBUTION</div>
              <h2 className="h-section" style={{ marginTop: 8 }}>UBM区画の分布</h2>
            </div>
            <Icon name="barChart" size={18} style={{ color: "var(--text-3)" }}/>
          </div>
          <div className="stack" style={{ marginTop: 18 }}>
            {byZone.map((r) => (
              <div key={r.z}>
                <div className="row-between" style={{ marginBottom: 6 }}>
                  <div className="row" style={{ gap: 8 }}>
                    <Chip tone={zoneTone(r.z)} dot>{r.z}</Chip>
                    <span className="small" style={{ color: "var(--text-2)", fontWeight: 500 }}>{r.z === "0→1" ? "立ち上げ" : r.z === "1→10" ? "拡大" : "組織化"}</span>
                  </div>
                  <span className="mono" style={{ fontWeight: 600 }}>{r.n}名</span>
                </div>
                <div style={{ height: 8, background: "var(--bg)", borderRadius: 4, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${(r.n / visible.length) * 100}%`, background: `var(--${r.z === "0→1" ? "info" : r.z === "1→10" ? "accent" : "ok"})`, borderRadius: 4 }}/>
                </div>
              </div>
            ))}
          </div>
          <div className="divider" style={{ margin: "20px 0" }}/>
          <div className="stack-sm">
            <div className="eyebrow">BY STATUS</div>
            <div className="row-wrap">
              {byStatus.map((r) => (
                <div key={r.s} className="card-flat" style={{ padding: "10px 14px", display: "flex", flexDirection: "column", gap: 2 }}>
                  <div className="small">{r.s}</div>
                  <div className="mono" style={{ fontWeight: 600, fontSize: 18 }}>{r.n}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Activity */}
        <div className="card card-pad-lg">
          <div className="row-between">
            <div>
              <div className="eyebrow">ACTIVITY</div>
              <h2 className="h-section" style={{ marginTop: 8 }}>最近の支部会と出席</h2>
            </div>
            <Icon name="activity" size={18} style={{ color: "var(--text-3)" }}/>
          </div>
          <div className="timeline" style={{ marginTop: 10 }}>
            {MEETINGS.slice(0, 5).map((mt) => (
              <div key={mt.id} className="tl-row">
                <div className="tl-date">
                  <div className="tl-y">{mt.date.slice(0, 7)}</div>
                  <div>{mt.date.slice(8)}</div>
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{mt.label}</div>
                  <div className="small">{mt.note}</div>
                </div>
                <Chip tone="ok">{mt.attendees}名</Chip>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Shortcuts */}
      <div className="grid-3">
        <div className="card card-pad card-hover" onClick={() => nav("admin-members")} style={{ cursor: "pointer" }}>
          <Icon name="users" size={22} style={{ color: "var(--accent)" }}/>
          <h3 className="h-card" style={{ marginTop: 10 }}>メンバー管理</h3>
          <div className="small" style={{ marginTop: 4 }}>公開可否・編集・論理削除</div>
          <Icon name="arrowRight" size={14} style={{ color: "var(--text-3)", marginTop: 8 }}/>
        </div>
        <div className="card card-pad card-hover" onClick={() => nav("admin-tags")} style={{ cursor: "pointer" }}>
          <Icon name="tag" size={22} style={{ color: "var(--accent)" }}/>
          <h3 className="h-card" style={{ marginTop: 10 }}>タグ割当</h3>
          <div className="small" style={{ marginTop: 4 }}>未タグ付け: <b style={{ color: "var(--text)" }}>{untagged.length}名</b></div>
          <Icon name="arrowRight" size={14} style={{ color: "var(--text-3)", marginTop: 8 }}/>
        </div>
        <div className="card card-pad card-hover" onClick={() => nav("schema-diff")} style={{ cursor: "pointer" }}>
          <Icon name="gitCompare" size={22} style={{ color: "var(--accent)" }}/>
          <h3 className="h-card" style={{ marginTop: 10 }}>スキーマ差分</h3>
          <div className="small" style={{ marginTop: 4 }}>未解決: <b style={{ color: "var(--warn)" }}>{pending}件</b></div>
          <Icon name="arrowRight" size={14} style={{ color: "var(--text-3)", marginTop: 8 }}/>
        </div>
      </div>
    </div>
  );
};

// ================== ADMIN MEMBERS (list + editor drawer) ==================
const AdminMembersPage = ({ nav }) => {
  const { MEMBERS, ALL_TAGS } = window.UBM;
  const toast = useToast();
  const [q, setQ] = useState("");
  const [filterState, setFilterState] = useState("all");
  const [selected, setSelected] = useState(null);
  const [local, setLocal] = useState(MEMBERS);

  const rows = local.filter((m) => {
    if (filterState === "public" && !m.isPublic) return false;
    if (filterState === "private" && m.isPublic) return false;
    if (filterState === "deleted" && !m.isDeleted) return false;
    if (filterState !== "deleted" && m.isDeleted) return false;
    if (q) {
      const hay = [m.fullName, m.email, m.occupation].join(" ").toLowerCase();
      if (!hay.includes(q.toLowerCase())) return false;
    }
    return true;
  });

  const toggleVisibility = (id) => {
    setLocal((l) => l.map((m) => m.id === id ? { ...m, isPublic: !m.isPublic } : m));
    toast("公開ステータスを更新しました", "ok");
  };

  const member = selected ? local.find((m) => m.id === selected) : null;
  const updateMember = (patch) => setLocal((l) => l.map((m) => m.id === selected ? { ...m, ...patch } : m));

  return (
    <div className="page-enter">
      <div className="page-head">
        <div>
          <div className="eyebrow">ADMIN / MEMBERS</div>
          <h1 className="h-page">メンバー管理</h1>
          <p className="muted">回答データ・公開フラグ・タグ付けをここから操作します。</p>
        </div>
        <div className="btn-row">
          <Button variant="ghost" icon="upload">CSV エクスポート</Button>
          <Button variant="primary" icon="refresh">Forms から取り込み</Button>
        </div>
      </div>

      <div className="card card-pad" style={{ marginBottom: 16 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr auto auto", gap: 12, alignItems: "end" }}>
          <Field label="検索"><Search value={q} onChange={setQ} placeholder="名前・メール・職業..."/></Field>
          <Field label="状態">
            <div className="pill-nav">
              {[
                { v: "all", l: "すべて" },
                { v: "public", l: "公開中" },
                { v: "private", l: "非公開" },
                { v: "deleted", l: "退会済み" },
              ].map((o) => (
                <button key={o.v} className={filterState === o.v ? "active" : ""} onClick={() => setFilterState(o.v)}>{o.l}</button>
              ))}
            </div>
          </Field>
          <div className="small" style={{ paddingBottom: 10 }}>{rows.length}件</div>
        </div>
      </div>

      <table className="tbl">
        <thead>
          <tr>
            <th style={{ width: 40 }}></th>
            <th>メンバー</th>
            <th>メール</th>
            <th>区画 / ステータス</th>
            <th>タグ</th>
            <th>最終更新</th>
            <th style={{ width: 140 }}>公開</th>
            <th style={{ width: 60 }}></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((m) => (
            <tr key={m.id} onClick={() => setSelected(m.id)}>
              <td><Avatar name={m.fullName} size="sm" hue={m.hue} id={m.id}/></td>
              <td>
                <div style={{ fontWeight: 600 }}>{m.fullName}</div>
                <div className="small">{m.occupation}</div>
              </td>
              <td className="mono small">{m.email}</td>
              <td>
                <div className="chip-row">
                  <Chip tone={zoneTone(m.ubmZone)} dot>{m.ubmZone}</Chip>
                  <Chip tone={statusTone(m.ubmMembershipType)}>{m.ubmMembershipType}</Chip>
                </div>
              </td>
              <td>
                {(m.tags || []).length ? (
                  <div className="chip-row">
                    {(m.tags || []).slice(0, 2).map((t) => <Chip key={t}>{t}</Chip>)}
                    {m.tags.length > 2 && <Chip>+{m.tags.length - 2}</Chip>}
                  </div>
                ) : <Chip tone="warn" dot>未タグ</Chip>}
              </td>
              <td className="small mono">{m.updatedAt}</td>
              <td onClick={(e) => e.stopPropagation()}>
                {m.isDeleted ? (
                  <Chip tone="danger">退会</Chip>
                ) : (
                  <div className="row" style={{ gap: 8 }}>
                    <Switch on={m.isPublic} onToggle={() => toggleVisibility(m.id)}/>
                    <span className="small">{m.isPublic ? "公開" : "非公開"}</span>
                  </div>
                )}
              </td>
              <td onClick={(e) => { e.stopPropagation(); setSelected(m.id); }}>
                <Button variant="ghost" size="sm" icon="edit"/>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <Drawer open={!!selected} onClose={() => setSelected(null)}>
        {member && (
          <>
            <div className="drawer-head">
              <div className="row" style={{ gap: 12 }}>
                <Avatar name={member.fullName} hue={member.hue} id={member.id}/>
                <div>
                  <div className="h-section" style={{ fontSize: 16 }}>{member.fullName}</div>
                  <div className="small mono">{member.email} · {member.responseId}</div>
                </div>
              </div>
              <button className="btn btn-ghost btn-icon" onClick={() => setSelected(null)}><Icon name="x"/></button>
            </div>
            <div className="drawer-body">
              <div>
                <div className="eyebrow">VISIBILITY</div>
                <div className="card-flat" style={{ padding: 14, marginTop: 8, display: "flex", flexDirection: "column", gap: 12 }}>
                  <div className="row-between">
                    <div>
                      <div style={{ fontWeight: 500, fontSize: 13.5 }}>サイト公開</div>
                      <div className="small">メンバー一覧や詳細ページに掲載</div>
                    </div>
                    <Switch on={member.isPublic} onToggle={() => updateMember({ isPublic: !member.isPublic })}/>
                  </div>
                  <div className="divider"/>
                  <div className="row-between">
                    <div>
                      <div style={{ fontWeight: 500, fontSize: 13.5 }}>管理者メモ</div>
                      <div className="small">本人には見えません</div>
                    </div>
                  </div>
                  <Textarea rows={3} placeholder="管理者用メモ..." defaultValue=""/>
                </div>
              </div>

              <div>
                <div className="eyebrow">TAGS</div>
                <div className="card-flat" style={{ padding: 14, marginTop: 8 }}>
                  <div className="row-wrap">
                    {ALL_TAGS.slice(0, 14).map((t) => {
                      const on = (member.tags || []).includes(t);
                      return (
                        <button key={t} className={"tag-pill" + (on ? " selected" : "")} onClick={() => {
                          const cur = member.tags || [];
                          updateMember({ tags: on ? cur.filter((x) => x !== t) : [...cur, t] });
                        }}>
                          {on && <Icon name="check" size={11}/>}{t}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div>
                <div className="eyebrow">FORM RESPONSE</div>
                <KVList rows={[
                  { k: "回答ID", v: member.responseId },
                  { k: "送信日時", v: member.submittedAt },
                  { k: "UBM区画", v: member.ubmZone },
                  { k: "ステータス", v: member.ubmMembershipType },
                  { k: "お住まい", v: member.location },
                  { k: "職業", v: member.occupation },
                  { k: "ビジネス概要", v: member.businessOverview },
                ]}/>
              </div>

              {member.isDeleted && (
                <div className="card-flat" style={{ padding: 14, background: "var(--danger-soft)", borderColor: "color-mix(in oklch, var(--danger) 18%, transparent)" }}>
                  <div className="eyebrow" style={{ color: "var(--danger)" }}>DELETED</div>
                  <div className="small" style={{ marginTop: 6, color: "var(--text-2)" }}>
                    退会日: {member.deletedAt} · 理由: {member.deletedReason}
                  </div>
                  <Button variant="ghost" size="sm" icon="undo" style={{ marginTop: 10 }}>復元する</Button>
                </div>
              )}
            </div>
            <div className="drawer-foot">
              {!member.isDeleted && <Button variant="danger" icon="trash">退会処理（論理削除）</Button>}
              <div style={{ flex: 1 }}/>
              <Button variant="ghost" onClick={() => setSelected(null)}>閉じる</Button>
              <Button variant="primary" icon="check" onClick={() => { toast("保存しました", "ok"); setSelected(null); }}>保存</Button>
            </div>
          </>
        )}
      </Drawer>
    </div>
  );
};

// ================== ADMIN TAG ASSIGNMENT ==================
const AdminTagsPage = ({ nav }) => {
  const { MEMBERS, TAG_CATALOG, ALL_TAGS } = window.UBM;
  const toast = useToast();
  const [local, setLocal] = useState(MEMBERS);
  const [focus, setFocus] = useState(null);

  const untagged = local.filter((m) => !m.isDeleted && (!m.tags || m.tags.length === 0));
  const tagged = local.filter((m) => !m.isDeleted && m.tags && m.tags.length > 0);

  const setTags = (id, tags) => setLocal((l) => l.map((m) => m.id === id ? { ...m, tags } : m));

  const member = focus ? local.find((m) => m.id === focus) : null;

  return (
    <div className="page-enter">
      <div className="page-head">
        <div>
          <div className="eyebrow">ADMIN / TAGS</div>
          <h1 className="h-page">タグ割当</h1>
          <p className="muted">フォーム項目ではなく、管理者だけがタグを割り当てます。メンバー自身は選びません。</p>
        </div>
        <div className="btn-row">
          <Chip tone="warn" dot>未タグ {untagged.length}名</Chip>
          <Chip tone="ok">タグ済み {tagged.length}名</Chip>
        </div>
      </div>

      <div className="grid-2" style={{ alignItems: "flex-start" }}>
        {/* Left: queue */}
        <div className="card card-pad-lg">
          <div className="row-between" style={{ marginBottom: 14 }}>
            <h2 className="h-section">割当キュー</h2>
            <Chip tone="accent">{untagged.length}件</Chip>
          </div>
          <div className="stack-sm">
            {untagged.length === 0 ? (
              <div className="empty-state">
                <Icon name="checkCircle" size={28} style={{ color: "var(--ok)" }}/>
                <div style={{ marginTop: 10, fontSize: 14, color: "var(--text-2)" }}>未タグ付けのメンバーはいません</div>
              </div>
            ) : untagged.map((m) => (
              <div key={m.id} className={"schema-field-card" + (focus === m.id ? " " : "")} onClick={() => setFocus(m.id)} style={{ cursor: "pointer", borderColor: focus === m.id ? "var(--accent)" : undefined }}>
                <div className="row" style={{ gap: 12 }}>
                  <Avatar name={m.fullName} size="sm" hue={m.hue} id={m.id}/>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{m.fullName}</div>
                    <div className="small">{m.occupation}</div>
                  </div>
                </div>
                <Icon name="chevronRight" size={14} style={{ color: "var(--text-3)" }}/>
              </div>
            ))}
          </div>
          {tagged.length > 0 && (
            <>
              <div className="divider" style={{ margin: "20px 0" }}/>
              <div className="eyebrow">TAGGED</div>
              <div className="stack-sm" style={{ marginTop: 10, opacity: 0.7 }}>
                {tagged.slice(0, 4).map((m) => (
                  <div key={m.id} className="row" style={{ padding: "6px 0", cursor: "pointer" }} onClick={() => setFocus(m.id)}>
                    <Avatar name={m.fullName} size="sm" hue={m.hue} id={m.id}/>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{m.fullName}</div>
                      <div className="chip-row" style={{ marginTop: 4 }}>
                        {m.tags.slice(0, 3).map((t) => <Chip key={t}>{t}</Chip>)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Right: editor */}
        {member ? (
          <div className="card card-pad-lg" style={{ position: "sticky", top: 20 }}>
            <div className="row" style={{ gap: 14, marginBottom: 14 }}>
              <Avatar name={member.fullName} size="lg" hue={member.hue} id={member.id}/>
              <div>
                <div className="h-card" style={{ fontSize: 18 }}>{member.fullName}</div>
                <div className="small">{member.occupation} · {member.location}</div>
                <div className="chip-row" style={{ marginTop: 8 }}>
                  <Chip tone={zoneTone(member.ubmZone)} dot>{member.ubmZone}</Chip>
                  <Chip tone={statusTone(member.ubmMembershipType)}>{member.ubmMembershipType}</Chip>
                </div>
              </div>
            </div>

            <div className="card-flat" style={{ padding: 14 }}>
              <div className="eyebrow">BUSINESS</div>
              <p className="small" style={{ color: "var(--text-2)", marginTop: 6, lineHeight: 1.7 }}>{member.businessOverview}</p>
              {member.skills && <><div className="eyebrow" style={{ marginTop: 10 }}>SKILLS</div>
                <p className="small" style={{ color: "var(--text-2)", marginTop: 4 }}>{member.skills}</p></>}
            </div>

            <div className="divider" style={{ margin: "20px 0" }}/>

            <div className="eyebrow">ASSIGN TAGS</div>
            <div className="stack" style={{ marginTop: 12 }}>
              {TAG_CATALOG.map((g) => (
                <div key={g.category}>
                  <div className="small" style={{ fontWeight: 500, color: "var(--text-2)", marginBottom: 6 }}>{g.category}</div>
                  <div className="row-wrap">
                    {g.tags.map((t) => {
                      const on = (member.tags || []).includes(t);
                      return (
                        <button key={t} className={"tag-pill" + (on ? " selected" : "")}
                          onClick={() => setTags(member.id, on ? member.tags.filter((x) => x !== t) : [...(member.tags||[]), t])}>
                          {on && <Icon name="check" size={11}/>}{t}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="row-between" style={{ marginTop: 20 }}>
              <div className="small">選択中: <b style={{ color: "var(--text)" }}>{(member.tags || []).length}</b>件</div>
              <Button variant="primary" icon="check" onClick={() => { toast(`${member.fullName}のタグを保存しました`, "ok"); setFocus(null); }}>
                保存して次へ
              </Button>
            </div>
          </div>
        ) : (
          <div className="card card-pad-lg" style={{ position: "sticky", top: 20 }}>
            <div className="empty-state">
              <Icon name="tag" size={28} style={{ color: "var(--text-3)" }}/>
              <div style={{ marginTop: 10, fontSize: 14 }}>左のキューからメンバーを選択してください</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ================== SCHEMA DIFF ==================
const SchemaDiffPage = ({ nav }) => {
  const { SCHEMA_DIFF, SCHEMA_VERSIONS, ALIAS_HISTORY } = window.UBM;
  const toast = useToast();
  const [unresolvedKey, setUnresolvedKey] = useState("");

  const unresolved = SCHEMA_DIFF.filter((d) => d.type === "unresolved");
  const added = SCHEMA_DIFF.filter((d) => d.type === "added");
  const changed = SCHEMA_DIFF.filter((d) => d.type === "changed");
  const removed = SCHEMA_DIFF.filter((d) => d.type === "removed");

  return (
    <div className="page-enter stack-lg">
      <div className="page-head">
        <div>
          <div className="eyebrow">ADMIN / SCHEMA</div>
          <h1 className="h-page">スキーマ差分のレビュー</h1>
          <p className="muted">Googleフォームの設問が変更されたとき、この画面で新旧スキーマを照合し、stableKey を割り当てます。</p>
        </div>
        <Button variant="ghost" icon="refresh">スキーマを再取得</Button>
      </div>

      {/* Revision header */}
      <div className="card card-pad-lg">
        <div className="row-between" style={{ marginBottom: 16 }}>
          <div>
            <div className="eyebrow">CURRENT REVISION</div>
            <div className="row" style={{ gap: 10, marginTop: 8, alignItems: "baseline" }}>
              <h2 className="h-section" style={{ fontSize: 20 }} className="mono">{SCHEMA_VERSIONS[0].revisionId}</h2>
              <Chip tone="ok" dot>active</Chip>
            </div>
            <div className="small mono" style={{ marginTop: 4 }}>hash: {SCHEMA_VERSIONS[0].schemaHash} · 取得: {SCHEMA_VERSIONS[0].date}</div>
          </div>
          <div className="btn-row">
            <Button variant="ghost" icon="gitCompare">前バージョンと比較</Button>
            <Button variant="primary" icon="check" onClick={() => toast("全差分を承認しました", "ok")}>すべて承認</Button>
          </div>
        </div>

        <div className="grid-4">
          <div className="card-flat stat">
            <div className="stat-label">Unresolved</div>
            <div className="stat-value" style={{ color: unresolved.length > 0 ? "var(--warn)" : "var(--ok)" }}>{unresolved.length}</div>
            <div className="stat-sub">stableKey 未割当</div>
          </div>
          <div className="card-flat stat">
            <div className="stat-label">Added</div>
            <div className="stat-value" style={{ color: "var(--ok)" }}>{added.length}</div>
            <div className="stat-sub">新規設問</div>
          </div>
          <div className="card-flat stat">
            <div className="stat-label">Changed</div>
            <div className="stat-value" style={{ color: "var(--warn)" }}>{changed.length}</div>
            <div className="stat-sub">文言や型の変更</div>
          </div>
          <div className="card-flat stat">
            <div className="stat-label">Removed</div>
            <div className="stat-value" style={{ color: "var(--danger)" }}>{removed.length}</div>
            <div className="stat-sub">削除された設問</div>
          </div>
        </div>
      </div>

      {/* Diff list */}
      <div className="card card-pad-lg">
        <div className="row-between" style={{ marginBottom: 14 }}>
          <h2 className="h-section">項目別の差分</h2>
          <Segmented value="all" onChange={() => {}} options={[
            { value: "all", label: "すべて" }, { value: "unresolved", label: "要対応" },
          ]}/>
        </div>

        <div className="stack-sm">
          {SCHEMA_DIFF.map((d) => (
            <div key={d.questionId} className={"schema-field-card diff-" + d.type}>
              <div>
                <div className="row" style={{ gap: 10, marginBottom: 4 }}>
                  {d.type === "added" && <Chip tone="ok" dot>Added</Chip>}
                  {d.type === "changed" && <Chip tone="warn" dot>Changed</Chip>}
                  {d.type === "removed" && <Chip tone="danger" dot>Removed</Chip>}
                  {d.type === "unresolved" && <Chip tone="info" dot>Unresolved</Chip>}
                  <span style={{ fontWeight: 600, fontSize: 14 }}>{d.label}</span>
                </div>
                <div className="small">{d.note}</div>
                <div className="small mono" style={{ marginTop: 6, color: "var(--text-3)" }}>
                  questionId: {d.questionId}
                  {d.stableKey && <> · stableKey: <b style={{ color: "var(--text)" }}>{d.stableKey}</b></>}
                  {!d.stableKey && d.type !== "removed" && <> · stableKey: <span style={{ color: "var(--warn)" }}>未割当</span></>}
                </div>
                {d.type === "unresolved" && (
                  <div className="row" style={{ marginTop: 10, gap: 8 }}>
                    <Input placeholder="stableKey を入力（例: businessCard）" value={unresolvedKey} onChange={(e) => setUnresolvedKey(e.target.value)}/>
                    <Button variant="primary" size="sm" icon="link" onClick={() => { toast("stableKey を紐付けました", "ok"); setUnresolvedKey(""); }}>紐付け</Button>
                  </div>
                )}
              </div>
              <div className="btn-row">
                {d.type === "unresolved" && <Button variant="soft" size="sm">既存と統合</Button>}
                {d.type !== "unresolved" && <Button variant="soft" size="sm" icon="check">承認</Button>}
                <Button variant="ghost" size="sm" icon="moreH"/>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid-2">
        <div className="card card-pad-lg">
          <div className="eyebrow">REVISIONS</div>
          <h2 className="h-section" style={{ marginTop: 8 }}>バージョン履歴</h2>
          <div className="stack-sm" style={{ marginTop: 14 }}>
            {SCHEMA_VERSIONS.map((v) => (
              <div key={v.revisionId} className="schema-field-card">
                <div>
                  <div className="row" style={{ gap: 8 }}>
                    <span className="mono" style={{ fontWeight: 600 }}>{v.revisionId}</span>
                    {v.state === "active" ? <Chip tone="ok" dot>active</Chip> : <Chip>superseded</Chip>}
                  </div>
                  <div className="small mono" style={{ marginTop: 4 }}>hash: {v.schemaHash} · {v.fieldCount} fields · {v.unknownCount} unknown</div>
                  <div className="small" style={{ marginTop: 2 }}>{v.date}</div>
                </div>
                <Button variant="ghost" size="sm" icon="eye">開く</Button>
              </div>
            ))}
          </div>
        </div>
        <div className="card card-pad-lg">
          <div className="eyebrow">ALIAS HISTORY</div>
          <h2 className="h-section" style={{ marginTop: 8 }}>紐付け履歴</h2>
          <div className="stack-sm" style={{ marginTop: 14 }}>
            {ALIAS_HISTORY.map((a, i) => (
              <div key={i} className="card-flat" style={{ padding: 12 }}>
                <div className="row" style={{ gap: 8 }}>
                  <Icon name="link" size={13} style={{ color: "var(--accent)" }}/>
                  <span className="mono" style={{ fontSize: 12.5, fontWeight: 600 }}>{a.stableKey}</span>
                </div>
                <div className="small mono" style={{ marginTop: 6, color: "var(--text-3)", display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                  <span>{a.oldQuestionId}</span>
                  <Icon name="arrowRight" size={10}/>
                  <span style={{ color: "var(--text-2)" }}>{a.newQuestionId}</span>
                </div>
                <div className="small" style={{ marginTop: 4 }}>{a.resolvedAt} · {a.resolvedBy}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

Object.assign(window, { AdminDashboardPage, AdminMembersPage, AdminTagsPage, SchemaDiffPage });
