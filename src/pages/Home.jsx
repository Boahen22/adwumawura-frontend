// src/pages/Home.jsx
// Colorful Home with guaranteed dark base tiles/chips.
// Palette: pine #247e6d, midnight #031c26, rosy #b19888.

import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const COLORS = { pine: "#247e6d", midnight: "#031c26", rosy: "#b19888" };

// Dark card style used for hero + value props (fixed dark in both themes)
const DARK_CARD_BG = "#1e3540";       // rich, deep teal
const DARK_CARD_BORDER = "rgba(255,255,255,0.15)";

const POPULAR = [
  "Carpenter","Mason","Electrician","Plumber","Welder","Mechanic","Driver","Delivery rider",
  "Painter","Tiler","Barber","Hairdresser","Seamstress","Baker","Cook","Cleaner","Security guard","Shop assistant",
];

// 9 sectors (3×3 grid). Colors are assigned evenly by index at render time.
const SECTORS = [
  { label: "Construction & Building",  query: "construction,mason,tiler,plumber,carpenter" },
  { label: "Trades & Repairs",         query: "electrician,welder,mechanic,technician" },
  { label: "Transport & Logistics",    query: "driver,rider,dispatch,loader" },
  { label: "Hospitality & Food",       query: "cook,chef,waiter,baker" },
  { label: "Household Services",       query: "cleaner,nanny,househelp,gardener" },
  { label: "Retail & Sales",           query: "shop assistant,cashier,merchandiser" },
  { label: "Agriculture & Farming",    query: "farm,agro,laborer" },
  { label: "Manufacturing & Production", query: "factory,production,assembler,packer" },
  { label: "Mining & Quarry",            query: "mining,quarry,excavation,driller" },
];

// Ghana regions — alphabetical
const REGIONS = [
  "Ahafo","Ashanti","Bono","Bono East","Central","Eastern","Greater Accra","North East",
  "Northern","Oti","Savannah","Upper East","Upper West","Volta","Western","Western North",
];

// helpers for greeting + first name
function getGreeting(d = new Date()) {
  const h = d.getHours();
  if (h < 12) return "Good Morning";
  if (h < 18) return "Good Afternoon";
  return "Good Evening";
}
function firstWord(s = "") {
  return s.trim().split(/\s+/)[0] || "";
}

export default function Home() {
  const navigate = useNavigate();
  const { user: authUser } = useAuth() || {};
  const [q, setQ] = useState("");
  const [where, setWhere] = useState("");

  const qs = useMemo(() => {
    const p = new URLSearchParams();
    if (q.trim()) p.set("search", q.trim());
    if (where.trim()) p.set("location", where.trim());
    return p.toString();
  }, [q, where]);

  const submit = (e) => {
    e.preventDefault();
    navigate(qs ? `/jobs?${qs}` : "/jobs");
  };

  // compute greeting + first name (name optional)
  const greeting = useMemo(() => getGreeting(), []);
  const firstName = useMemo(() => firstWord(authUser?.name || ""), [authUser]);

  return (
    <main className="relative min-h-screen">
      {/* Scoped CSS: force Popular searches to white in dark mode only */}
      <style>{`
        html.dark .popular-searches,
        html.dark .popular-searches * {
          color: #ffffff !important;
        }
      `}</style>

      {/* Hero — stays dark in both themes (no theme button here) */}
      <section className="mx-auto max-w-6xl px-4 pt-12 sm:pt-16">
        <div
          className="rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.25)] px-6 py-7 sm:px-8 border"
          style={{ backgroundColor: DARK_CARD_BG, borderColor: DARK_CARD_BORDER, color: "#fff" }}
        >
          <h1 className="text-3xl sm:text-4xl font-extrabold">
            {greeting}{firstName ? `, ${firstName}` : ""}
          </h1>
          <p className="mt-2 text-white/90">
            Search and apply for jobs across Ghana. Discover real work in the informal sector.
          </p>

          <form onSubmit={submit} className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
            {/* Keyword */}
            <div className="flex-1">
              <label className="sr-only">Job title, skill or company</label>
              <div className="flex items-center gap-2 rounded-full bg-white text-gray-800 shadow ring-1 ring-black/10 px-3 py-2">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-gray-500">
                  <circle cx="11" cy="11" r="7" />
                  <path d="m21 21-4.3-4.3" />
                </svg>
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  className="w-full outline-none text-sm bg-transparent"
                  placeholder="Job title, skill or company"
                />
              </div>
            </div>

            {/* Region */}
            <div className="flex-1">
              <label className="sr-only">Region</label>
              <div className="flex items-center gap-2 rounded-full bg-white text-gray-800 shadow ring-1 ring-black/10 px-3 py-2">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-gray-500">
                  <path d="M12 22s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12Z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                <input
                  value={where}
                  onChange={(e) => setWhere(e.target.value)}
                  className="w-full outline-none text-sm bg-transparent"
                  placeholder="Region (e.g., Ashanti, Volta)"
                  list="region-suggestions"
                />
                <datalist id="region-suggestions">
                  {REGIONS.map((r) => (
                    <option key={r} value={r} />
                  ))}
                </datalist>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="rounded-full px-6 py-2.5 text-sm font-semibold shadow-md text-white"
              style={{ backgroundColor: COLORS.pine }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#1f6a5c")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = COLORS.pine)}
            >
              Search
            </button>
          </form>
        </div>
      </section>

      {/* Popular searches */}
      <section className="mx-auto max-w-6xl px-4 mt-10 popular-searches">
        <div className="border-b border-black/10 pb-2">
          <nav className="flex gap-6 text-sm">
            <span className="font-semibold border-b-2 pb-2" style={{ borderColor: COLORS.pine }}>
              Popular searches
            </span>
            <span className="text-gray-700">Jobs by sector</span>
            <span className="text-gray-700">Jobs by region</span>
          </nav>
        </div>

        {/* Two columns even on small screens */}
        <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-2 text-[15px]">
          {POPULAR.map((p) => (
            <Link
              key={p}
              to={`/jobs?search=${encodeURIComponent(p)}`}
              className="hover:underline text-gray-900"
            >
              {p} jobs
            </Link>
          ))}
        </div>
      </section>

      {/* Sectors — 9 tiles (3×3) with evenly distributed colors */}
      <section className="mx-auto max-w-6xl px-4 mt-12">
        <h2 className="text-lg font-semibold text-gray-900">Jobs by sector</h2>
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {SECTORS.map((s, i) => {
            const bg = i % 3 === 0 ? COLORS.pine : i % 3 === 1 ? COLORS.rosy : "#0b2f33";
            return (
              <Link
                key={s.label}
                to={`/jobs?search=${encodeURIComponent(s.query)}`}
                className="block rounded-xl px-5 py-4 text-white shadow-lg hover:shadow-xl transition-shadow"
                style={{ background: bg }}
              >
                {s.label}
              </Link>
            );
          })}
        </div>
      </section>

      {/* Regions — two neat rows, 8 per row */}
      <section className="mx-auto max-w-6xl px-4 mt-12">
        <h2 className="text-lg font-semibold text-gray-900">Jobs by region</h2>

        {([REGIONS.slice(0, 8), REGIONS.slice(8)]).map((row, idx) => (
          <div
            key={idx}
            className={`${idx === 0 ? "mt-3" : "mt-2"} grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2`}
          >
            {row.map((r, i) => {
              const globalIndex = idx * 8 + i;
              const bg = globalIndex % 3 === 0 ? COLORS.pine : globalIndex % 3 === 1 ? COLORS.rosy : "#0b2f33";
              return (
                <Link
                  key={r}
                  to={`/jobs?location=${encodeURIComponent(r)}`}
                  className="rounded-full px-3 py-1.5 text-sm text-center shadow hover:opacity-90"
                  style={{ background: bg, color: "#fff", border: "1px solid rgba(0,0,0,0.0)" }}
                >
                  {r}
                </Link>
              );
            })}
          </div>
        ))}
      </section>

      {/* Value props — stays dark in both themes */}
      <section className="mx-auto max-w-6xl px-4 mt-14 grid grid-cols-1 md:grid-cols-3 gap-5 mb-20">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="rounded-2xl p-5 shadow border"
            style={{ backgroundColor: DARK_CARD_BG, borderColor: DARK_CARD_BORDER, color: "#fff" }}
          >
            {i === 0 && (
              <>
                <h3 className="font-semibold">Find work fast</h3>
                <p className="mt-1 text-white/90 text-sm">
                  Create a simple profile and apply to nearby jobs in minutes. Most roles are practical skills
                  and on-site work.
                </p>
                <Link to="/jobs" className="mt-3 inline-block underline underline-offset-4 text-white">Browse jobs</Link>
              </>
            )}
            {i === 1 && (
              <>
                <h3 className="font-semibold">Hire trusted workers</h3>
                <p className="mt-1 text-white/90 text-sm">
                  Post a job and reach verified carpenters, masons, drivers, cleaners and more across Ghana.
                </p>
                <Link to="/post-job" className="mt-3 inline-block underline underline-offset-4 text-white">Post a job</Link>
              </>
            )}
            {i === 2 && (
              <>
                <h3 className="font-semibold">Built for Ghana</h3>
                <p className="mt-1 text-white/90 text-sm">
                  Adwumawura focuses on the informal sector. Clear job details, local regions and simple
                  connections between workers and employers.
                </p>
                <Link to="/verify" className="mt-3 inline-block underline underline-offset-4 text-white">Get verified</Link>
              </>
            )}
          </div>
        ))}
      </section>
    </main>
  );
}
