// Public-facing pages: Landing, Member list, Member detail (public view)

// ================== LANDING ==================
const LandingPage = ({ nav, tweaks }) => {
  const { MEMBERS, MEETINGS } = window.UBM;
  const visibleMembers = MEMBERS.filter((m) => m.isPublic && !m.isDeleted);
  const featured = visibleMembers.slice(0, 6);

  return (
    <div className="page-enter stack-lg">
      {/* Hero */}
      <section className="card" style={{ padding: "56px 48px", borderRadius: 28, position: "relative", overflow: "hidden" }}>
        <div style={{
          position: "absolute", top: -40, right: -40, width: 320, height: 320,
          background: "radial-gradient(circle, color-mix(in oklch, var(--accent) 14%, transparent), transparent 70%)",
          pointerEvents: "none"
        }} />
        <div style={{ maxWidth: 720, position: "relative" }}>
          <div className="eyebrow" style={{ marginBottom: 14 }}>UBM HYOGO · CHAPTER SITE</div>
          <h1 className="serif" style={{ fontSize: 54, lineHeight: 1.1, letterSpacing: "-0.03em", fontWeight: 600, margin: 0 }}>
            兵庫で、事業を育てる人の<br />つながりを可視化する。
          </h1>
          <p className="body" style={{ fontSize: 16, marginTop: 22, maxWidth: 560 }}>
            UBM兵庫支部会メンバーサイトは、Googleフォームから集めた支部会メンバーの自己紹介情報を、公開情報と会員限定情報に分けて整理・公開するサイトです。
          </p>
          <div className="btn-row" style={{ marginTop: 28 }}>
            <Button variant="primary" size="lg" iconRight="arrowRight" onClick={() => nav("members")}>
              メンバー一覧を見る
            </Button>
            <Button variant="ghost" size="lg" icon="key" onClick={() => nav("login")}>
              会員ログイン
            </Button>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="grid-4">
        <div className="card stat">
          <div className="stat-label">Members</div>
          <div className="stat-value">{visibleMembers.length}</div>
          <div className="stat-sub">公開中のメンバー</div>
        </div>
        <div className="card stat">
          <div className="stat-label">Zones</div>
          <div className="stat-value">3</div>
          <div className="stat-sub">0→1 / 1→10 / 10→100</div>
        </div>
        <div className="card stat">
          <div className="stat-label">Meetings / yr</div>
          <div className="stat-value">12</div>
          <div className="stat-sub">毎月の支部会</div>
        </div>
        <div className="card stat">
          <div className="stat-label">Last sync</div>
          <div className="stat-value" style={{ fontSize: 22 }}>数分前</div>
          <div className="stat-sub"><span className="badge-sync"><span className="dot"/>Forms 同期中</span></div>
        </div>
      </section>

      {/* About */}
      <section className="grid-2">
        <div className="card card-pad-lg">
          <div className="eyebrow">ABOUT</div>
          <h2 className="h-section" style={{ marginTop: 10 }}>事業支援コミュニティ「UBM」</h2>
          <p className="body" style={{ marginTop: 10 }}>
            UBM（Unlimited Business Members）は、事業フェーズに応じた3つの区画——<b>0→1</b>（立ち上げ）・<b>1→10</b>（拡大）・<b>10→100</b>（組織化）——に分かれて、メンバー同士が学び合うコミュニティです。
          </p>
          <p className="body" style={{ marginTop: 10 }}>
            兵庫支部会は、地域に根ざした事業者が月一で集まる場。本サイトでは、その「どんな人がいるのか」を可視化しています。
          </p>
        </div>
        <div className="card card-pad-lg">
          <div className="eyebrow">THREE ZONES</div>
          <h2 className="h-section" style={{ marginTop: 10 }}>UBM区画</h2>
          <div className="stack-sm" style={{ marginTop: 14 }}>
            {[
              { z: "0→1", label: "立ち上げフェーズ", desc: "着想と初期検証" },
              { z: "1→10", label: "拡大フェーズ", desc: "仕組み化と再現性" },
              { z: "10→100", label: "組織化フェーズ", desc: "組織と事業の複線化" },
            ].map((z) => (
              <div key={z.z} className="row" style={{ padding: "10px 0", borderTop: "1px solid var(--border)" }}>
                <Chip tone={zoneTone(z.z)} dot>{z.z}</Chip>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{z.label}</div>
                  <div className="small">{z.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured members */}
      <section>
        <div className="row-between" style={{ marginBottom: 16 }}>
          <div>
            <div className="eyebrow">FEATURED MEMBERS</div>
            <h2 className="h-section" style={{ marginTop: 8 }}>参加している事業者たち</h2>
          </div>
          <Button icon="users" onClick={() => nav("members")} iconRight="arrowRight">全員見る</Button>
        </div>
        <div className="member-grid-comfy">
          {featured.map((m) => (
            <MemberCardPublic key={m.id} m={m} density={tweaks.density} onOpen={() => nav("member", { id: m.id })} />
          ))}
        </div>
      </section>

      {/* Meetings */}
      <section className="card card-pad-lg">
        <div className="row-between">
          <div>
            <div className="eyebrow">RECENT MEETINGS</div>
            <h2 className="h-section" style={{ marginTop: 8 }}>最近の支部会</h2>
          </div>
          <Chip tone="accent" dot>毎月第2木曜開催</Chip>
        </div>
        <div className="timeline" style={{ marginTop: 14 }}>
          {MEETINGS.slice(0, 4).map((mt) => (
            <div key={mt.id} className="tl-row">
              <div className="tl-date">
                <div className="tl-y">{mt.date.slice(0, 7)}</div>
                <div>{mt.date.slice(8)}</div>
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{mt.label}</div>
                <div className="small">{mt.note}</div>
              </div>
              <div className="small">{mt.attendees}名参加</div>
            </div>
          ))}
        </div>
      </section>

      <section className="card card-pad-lg" style={{ background: "var(--text)", color: "var(--panel)", borderColor: "var(--text)" }}>
        <div className="row-between" style={{ gap: 32 }}>
          <div style={{ maxWidth: 520 }}>
            <div className="eyebrow" style={{ color: "color-mix(in oklch, white 60%, transparent)" }}>FOR MEMBERS</div>
            <h2 className="h-section" style={{ marginTop: 10, color: "inherit" }}>メンバー情報の掲載をお願いします</h2>
            <p className="body" style={{ marginTop: 10, color: "color-mix(in oklch, white 70%, transparent)" }}>
              最新のGoogleフォームから回答するだけで、このページに自動で反映されます。表記の修正は管理者が編集できます。
            </p>
          </div>
          <Button variant="accent" size="lg" iconRight="external" onClick={() => nav("member-form")}>
            回答フォームを開く
          </Button>
        </div>
      </section>
    </div>
  );
};

// ================== MEMBER CARD (public) ==================
const MemberCardPublic = ({ m, density = "comfy", onOpen }) => {
  if (density === "list") {
    return (
      <div className="mrow" onClick={onOpen}>
        <Avatar name={m.fullName} hue={m.hue} id={m.id}/>
        <div>
          <div style={{ fontWeight: 600, fontSize: 14 }}>{m.fullName}</div>
          <div className="small">{m.occupation}</div>
        </div>
        <div className="chip-row">
          <Chip tone={zoneTone(m.ubmZone)} dot>{m.ubmZone}</Chip>
          <Chip tone={statusTone(m.ubmMembershipType)}>{m.ubmMembershipType}</Chip>
        </div>
        <div className="small">
          <Icon name="mapPin" size={11} style={{ verticalAlign: -1 }}/> {m.location}
        </div>
        <Icon name="chevronRight" size={16} style={{ color: "var(--text-3)" }}/>
      </div>
    );
  }
  const cls = "mcard " + (density === "dense" ? "mcard-dense" : "mcard-comfy");
  return (
    <div className={cls} onClick={onOpen}>
      <div className="row" style={{ gap: 14, alignItems: "flex-start" }}>
        <Avatar name={m.fullName} size={density === "dense" ? "md" : "lg"} hue={m.hue} id={m.id}/>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="row-between" style={{ gap: 8, alignItems: "flex-start" }}>
            <div style={{ minWidth: 0 }}>
              <div className="h-card">{m.fullName}</div>
              {m.nickname && <div className="small" style={{ marginTop: 1 }}>{m.nickname}</div>}
            </div>
            <Chip tone={zoneTone(m.ubmZone)} dot>{m.ubmZone}</Chip>
          </div>
          <div className="small" style={{ marginTop: density === "dense" ? 6 : 10, display: "flex", flexDirection: "column", gap: 3 }}>
            <span><Icon name="briefcase" size={11} style={{ verticalAlign: -1, marginRight: 6 }}/>{m.occupation}</span>
            <span><Icon name="mapPin" size={11} style={{ verticalAlign: -1, marginRight: 6 }}/>{m.location}</span>
          </div>
        </div>
      </div>
      {density !== "dense" && m.businessOverview && (
        <p className="small" style={{ color: "var(--text-2)", lineHeight: 1.7, display: "-webkit-box", WebkitBoxOrient: "vertical", WebkitLineClamp: 2, overflow: "hidden" }}>
          {m.businessOverview}
        </p>
      )}
      <div className="chip-row">
        <Chip tone={statusTone(m.ubmMembershipType)}>{m.ubmMembershipType}</Chip>
        {(m.tags || []).slice(0, density === "dense" ? 2 : 3).map((t) => <Chip key={t}>{t}</Chip>)}
      </div>
    </div>
  );
};

// ================== MEMBER LIST ==================
const MemberListPage = ({ nav, tweaks }) => {
  const { MEMBERS, TAG_CATALOG, ALL_TAGS } = window.UBM;
  const [q, setQ] = useState("");
  const [zoneF, setZoneF] = useState("all");
  const [statusF, setStatusF] = useState("all");
  const [tagF, setTagF] = useState([]);
  const [sort, setSort] = useState("recent");
  const [density, setDensity] = useState(tweaks.density);

  useEffect(() => setDensity(tweaks.density), [tweaks.density]);

  const filtered = useMemo(() => {
    return MEMBERS.filter((m) => m.isPublic && !m.isDeleted)
      .filter((m) => {
        if (q) {
          const hay = [m.fullName, m.nickname, m.occupation, m.location, m.businessOverview, ...(m.tags||[])].join(" ").toLowerCase();
          if (!hay.includes(q.toLowerCase())) return false;
        }
        if (zoneF !== "all" && m.ubmZone !== zoneF) return false;
        if (statusF !== "all" && m.ubmMembershipType !== statusF) return false;
        if (tagF.length && !tagF.every((t) => (m.tags || []).includes(t))) return false;
        return true;
      })
      .sort((a, b) => {
        if (sort === "name") return a.fullName.localeCompare(b.fullName, "ja");
        if (sort === "recent") return b.updatedAt.localeCompare(a.updatedAt);
        return 0;
      });
  }, [q, zoneF, statusF, tagF, sort]);

  const toggleTag = (t) => setTagF((x) => x.includes(t) ? x.filter((y) => y !== t) : [...x, t]);
  const clear = () => { setQ(""); setZoneF("all"); setStatusF("all"); setTagF([]); };
  const hasFilters = Boolean(q || zoneF !== "all" || statusF !== "all" || tagF.length > 0);

  return (
    <div className="page-enter">
      <div className="page-head">
        <div>
          <div className="eyebrow">MEMBERS</div>
          <h1 className="h-page">メンバー一覧</h1>
          <p className="muted">兵庫支部会に参加する事業者たち。掲載に同意いただいた方のみ公開しています。</p>
        </div>
        <Segmented
          value={density}
          onChange={setDensity}
          options={[{ value: "comfy", label: "ゆったり" }, { value: "dense", label: "密" }, { value: "list", label: "リスト" }]}
        />
      </div>

      {/* Filters */}
      <div className="card card-pad" style={{ marginBottom: 20 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr 1fr auto", gap: 12, alignItems: "end" }}>
          <Field label={<><Icon name="search" size={12}/> キーワード検索</>}>
            <Search value={q} onChange={setQ} placeholder="名前・職業・事業内容..." />
          </Field>
          <Field label="UBM区画">
            <Select value={zoneF} onChange={(e) => setZoneF(e.target.value)}>
              <option value="all">すべて</option>
              <option value="0→1">0→1 立ち上げ</option>
              <option value="1→10">1→10 拡大</option>
              <option value="10→100">10→100 組織化</option>
            </Select>
          </Field>
          <Field label="参加ステータス">
            <Select value={statusF} onChange={(e) => setStatusF(e.target.value)}>
              <option value="all">すべて</option>
              <option>会員</option>
              <option>非会員</option>
              <option>アカデミー生</option>
            </Select>
          </Field>
          <Field label="並び替え">
            <Select value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="recent">最近の更新順</option>
              <option value="name">名前順</option>
            </Select>
          </Field>
          <Button variant="ghost" icon="undo" onClick={clear} disabled={!hasFilters}>クリア</Button>
        </div>
        <div className="divider" style={{ margin: "16px 0" }} />
        <div className="stack-sm">
          <div className="small" style={{ fontWeight: 500, color: "var(--text-2)" }}>
            <Icon name="tag" size={12} style={{ verticalAlign: -1 }}/> タグで絞り込み
          </div>
          <div className="row-wrap">
            {ALL_TAGS.slice(0, 18).map((t) => (
              <button key={t} className={"tag-pill" + (tagF.includes(t) ? " selected" : "")} onClick={() => toggleTag(t)}>
                {tagF.includes(t) && <Icon name="check" size={11} />} {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="row-between" style={{ marginBottom: 14 }}>
        <div className="small">
          <b style={{ color: "var(--text)", fontSize: 14 }}>{filtered.length}</b> 件 {hasFilters && <>/ 全 {MEMBERS.filter((m)=>m.isPublic&&!m.isDeleted).length} 件</>}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="card empty-state">
          <Icon name="search" size={28} style={{ color: "var(--text-3)" }} />
          <div style={{ marginTop: 10, fontSize: 14, color: "var(--text-2)" }}>条件に合うメンバーが見つかりません</div>
          <Button variant="ghost" size="sm" onClick={clear} style={{ marginTop: 12 }}>絞り込みをクリア</Button>
        </div>
      ) : density === "list" ? (
        <div className="member-grid-list">
          <div className="mrow mrow-h">
            <div />
            <div>氏名 / 職業</div>
            <div>区画 / ステータス</div>
            <div>所在地</div>
            <div />
          </div>
          {filtered.map((m) => (
            <MemberCardPublic key={m.id} m={m} density="list" onOpen={() => nav("member", { id: m.id })} />
          ))}
        </div>
      ) : (
        <div className={density === "dense" ? "member-grid-dense" : "member-grid-comfy"}>
          {filtered.map((m) => (
            <MemberCardPublic key={m.id} m={m} density={density} onOpen={() => nav("member", { id: m.id })} />
          ))}
        </div>
      )}
    </div>
  );
};

// ================== MEMBER DETAIL (public) ==================
const MemberDetailPage = ({ nav, params, tweaks }) => {
  const { MEMBERS } = window.UBM;
  const m = MEMBERS.find((x) => x.id === params?.id) || MEMBERS[0];
  const layout = tweaks.detailLayout;

  const Hero = () => {
    if (layout === "vertical") {
      return (
        <div className="card hero-center">
          <Avatar name={m.fullName} size="xl" hue={m.hue} id={m.id}/>
          <div style={{ fontSize: 11, letterSpacing: "0.14em", color: "var(--text-3)", textTransform: "uppercase", fontFamily: "var(--font-en)" }}>{m.nickname || "　"}</div>
          <h1 className="h-page" style={{ fontSize: 32, marginTop: 6 }}>{m.fullName}</h1>
          <div style={{ marginTop: 8, color: "var(--text-2)", fontSize: 15 }}>{m.occupation}</div>
          <div className="chip-row" style={{ marginTop: 16 }}>
            <Chip tone={zoneTone(m.ubmZone)} dot>{m.ubmZone}</Chip>
            <Chip tone={statusTone(m.ubmMembershipType)}>{m.ubmMembershipType}</Chip>
            <Chip><Icon name="mapPin" size={11}/>{m.location}</Chip>
          </div>
        </div>
      );
    }
    if (layout === "split2") {
      return (
        <div className="card card-pad-lg hero-2col">
          <div>
            <div className="eyebrow">MEMBER PROFILE</div>
            <div className="row" style={{ gap: 18, marginTop: 14, alignItems: "flex-start" }}>
              <Avatar name={m.fullName} size="xl" hue={m.hue} id={m.id}/>
              <div>
                <h1 className="h-page" style={{ fontSize: 32 }}>{m.fullName}</h1>
                {m.nickname && <div style={{ color: "var(--text-3)", fontSize: 13, marginTop: 4 }}>{m.nickname}</div>}
                <div style={{ marginTop: 10, color: "var(--text-2)", fontSize: 15 }}>{m.occupation}</div>
                <div className="chip-row" style={{ marginTop: 14 }}>
                  <Chip tone={zoneTone(m.ubmZone)} dot>{m.ubmZone}</Chip>
                  <Chip tone={statusTone(m.ubmMembershipType)}>{m.ubmMembershipType}</Chip>
                </div>
              </div>
            </div>
          </div>
          <div className="card-flat" style={{ padding: 18 }}>
            <div className="eyebrow">PROVIDE</div>
            <p className="body" style={{ marginTop: 8, color: "var(--text)" }}>
              {m.canProvide || "—"}
            </p>
            <div className="divider" style={{ margin: "14px 0" }}/>
            <div className="small">
              <Icon name="mapPin" size={12} style={{ verticalAlign: -2 }}/> {m.location}<br/>
              <Icon name="sparkle" size={12} style={{ verticalAlign: -2 }}/> {m.hometown || "—"}
            </div>
          </div>
        </div>
      );
    }
    return (
      <div className="card card-pad-lg hero-split">
        <Avatar name={m.fullName} size="xl" hue={m.hue} id={m.id}/>
        <div>
          <div className="eyebrow">MEMBER PROFILE</div>
          <h1 className="h-page" style={{ marginTop: 8, fontSize: 34 }}>{m.fullName}</h1>
          {m.nickname && <div style={{ color: "var(--text-3)", fontSize: 13, marginTop: 4 }}>{m.nickname}</div>}
          <div className="body" style={{ marginTop: 12, fontSize: 15 }}>{m.occupation}</div>
          <div className="chip-row" style={{ marginTop: 16 }}>
            <Chip tone={zoneTone(m.ubmZone)} dot>{m.ubmZone}</Chip>
            <Chip tone={statusTone(m.ubmMembershipType)}>{m.ubmMembershipType}</Chip>
            <Chip><Icon name="mapPin" size={11}/>{m.location}</Chip>
            {m.hometown && <Chip outline>出身 {m.hometown}</Chip>}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="page-enter stack-lg">
      <button className="row" style={{ color: "var(--text-3)", fontSize: 12.5, gap: 6 }} onClick={() => nav("members")}>
        <Icon name="arrowLeft" size={13}/> メンバー一覧に戻る
      </button>

      <Hero />

      <div className="grid-2">
        <div className="card card-pad-lg">
          <div className="eyebrow">BUSINESS OVERVIEW</div>
          <h2 className="h-section" style={{ marginTop: 8 }}>ビジネス概要</h2>
          <p className="body" style={{ marginTop: 10 }}>{m.businessOverview || "—"}</p>
          {m.skills && <><div className="divider" style={{ margin: "16px 0" }}/>
            <div className="small" style={{ color: "var(--text-2)", fontWeight: 500, marginBottom: 6 }}>得意分野・スキル</div>
            <div className="body">{m.skills}</div></>}
          {m.canProvide && <><div className="divider" style={{ margin: "16px 0" }}/>
            <div className="small" style={{ color: "var(--text-2)", fontWeight: 500, marginBottom: 6 }}>提供できること</div>
            <div className="body">{m.canProvide}</div></>}
        </div>
        <div className="card card-pad-lg">
          <div className="eyebrow">TAGS</div>
          <h2 className="h-section" style={{ marginTop: 8 }}>タグ</h2>
          <div className="chip-row" style={{ marginTop: 12 }}>
            {(m.tags || []).map((t) => <Chip key={t} tone="accent">{t}</Chip>)}
            {!(m.tags && m.tags.length) && <span className="small">タグ未設定</span>}
          </div>
          <div className="divider" style={{ margin: "20px 0" }}/>
          <div className="eyebrow">SNS / WEB</div>
          <h2 className="h-section" style={{ marginTop: 8 }}>リンク</h2>
          <div style={{ marginTop: 12 }}>
            <LinkPills member={m} />
          </div>
        </div>
      </div>

      <div className="card card-pad-lg">
        <div className="eyebrow">PERSONAL</div>
        <h2 className="h-section" style={{ marginTop: 8 }}>パーソナル</h2>
        <div style={{ marginTop: 16 }}>
          <KVList rows={[
            { k: "趣味・好きなこと", v: m.hobbies },
            { k: "最近ハマっていること", v: m.recentInterest },
            { k: "座右の銘", v: m.motto },
            { k: "仕事以外の活動", v: m.otherActivities },
          ]}/>
        </div>
      </div>

      {m.selfIntroduction && (
        <div className="card card-pad-lg" style={{ background: "var(--accent-soft)", borderColor: "color-mix(in oklch, var(--accent) 20%, transparent)" }}>
          <div className="eyebrow" style={{ color: "var(--accent-ink)" }}>MESSAGE</div>
          <p className="serif" style={{ fontSize: 20, lineHeight: 1.7, marginTop: 10, color: "var(--accent-ink)", fontWeight: 500, textWrap: "pretty" }}>
            「{m.selfIntroduction}」
          </p>
        </div>
      )}
    </div>
  );
};

Object.assign(window, { LandingPage, MemberListPage, MemberDetailPage, MemberCardPublic });
