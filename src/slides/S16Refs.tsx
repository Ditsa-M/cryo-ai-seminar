import { useState } from "react";
import { SlideFrame } from "../components/SlideFrame";
import bib from "../data/bibliography.json";

type Entry = { key: string; title: string; authors?: string[]; year?: number; venue?: string; volume?: string; pages?: string; doi?: string; url?: string; type: string; role?: string };
const ESSENTIAL = ["iqbal2026aicryoem", "dhakal2025picking", "levy2022cryoai", "giri2024cryo2structdata", "bepler2019topaz", "wagner2019cryolo",
  "rice2023tomotwin", "sanchezgarcia2021deepemhancer", "zheng2017motioncor2", "shen2026b2ar", "scheres2015relion13", "scheres2012goldstandard"];
const fmt = (e: Entry) => {
  if (e.type === "dataset") return <>{e.title}. <span className="muted">{e.url}</span></>;
  const a = e.authors ?? [];
  const au = a.length > 2 ? `${a[0].split(",")[0]} et al.` : a.map((x) => x.split(",")[0]).join(" & ");
  return <>{au} ({e.year}). {e.title}. <i>{e.venue}</i>{e.volume ? ` ${e.volume}` : ""}{e.pages ? `:${e.pages}` : ""}. <span className="muted">doi:{e.doi}</span></>;
};
export function S16Refs() {
  const [open, setOpen] = useState(false);
  const all = (bib as Entry[]).filter((e) => e.type !== "verified-absence");
  const ess = ESSENTIAL.map((k) => all.find((e) => e.key === k)!).filter(Boolean);
  return (
    <SlideFrame id="s16" hideChrome>
      <h2 style={{ marginTop: -50, fontSize: 60 }}>Key references · <span data-hand="questions" style={{ color: "var(--accept)" }}>Questions?</span></h2>
      <ol style={{ fontSize: 25, lineHeight: 1.3, columns: 2, columnGap: 48, paddingLeft: "1.3em", margin: 0 }}>
        {ess.map((e) => <li key={e.key} style={{ breakInside: "avoid", margin: "0 0 12px" }}>{fmt(e)}</li>)}
      </ol>
      <p className="small muted" style={{ marginTop: 14 }}>Data: EMPIAR-10017, EMPIAR-10204, EMD-72202 (public). Tools run by the presenter: Topaz 0.3.20, DeepEMhancer 0.18, ChimeraX 1.12. Claim ledger, BibTeX and asset provenance ship with the deck.</p>
      <p style={{ fontSize: 34, marginTop: 22 }}>
        Questions later? Email me at <a data-hand="email" href="mailto:dmallic1@asu.edu" style={{ color: "var(--accept)", fontFamily: "var(--mono)", fontWeight: 700, textDecoration: "none" }}>dmallic1@asu.edu</a>
      </p>
      <button onClick={() => setOpen(!open)} style={{ position: "absolute", right: 64, bottom: 30, fontSize: 18, padding: "8px 14px", background: "#14232F", color: "#EEF3F6", border: "1px solid #4FD1E8", borderRadius: 4, cursor: "pointer", fontFamily: "var(--mono)" }} aria-expanded={open}>
        {open ? "Close" : "Full bibliography"} ({all.length})
      </button>
      {open && (
        <div style={{ position: "absolute", inset: "40px 40px 80px", background: "#0F1C26", border: "1px solid #2A3D4C", padding: 24, overflowY: "auto", zIndex: 20, fontSize: 17 }} role="dialog" aria-label="Full bibliography">
          <ol style={{ paddingLeft: "1.4em", margin: 0 }}>{all.map((e) => <li key={e.key} style={{ marginBottom: 6 }}>{fmt(e)} {e.role ? <span className="muted"> — {e.role}</span> : null}</li>)}</ol>
        </div>
      )}
    </SlideFrame>
  );
}
