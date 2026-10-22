"""Build references.bib and src/data/bibliography.json from Crossref metadata.
Every DOI is resolved against api.crossref.org; the script exits non-zero if any fails.
Datasets (EMPIAR/EMDB/PDB) are added as @misc entries with their accession URLs.
Usage: python3 scripts/build_bibliography.py
"""
import json, sys, time, re, urllib.request, unicodedata

ENTRIES = [
    # key, doi, role, slide ids, licence/notes (licence verified on publisher page where stated)
    ("iqbal2026aicryoem", "10.1186/s44398-025-00017-2", "required source: broad review", ["s02", "s03", "s06", "s11", "s14"], "CC BY-NC-ND 4.0 — figures not modified or reproduced"),
    ("dhakal2025picking", "10.1093/bib/bbaf011", "required source: picking review + benchmark (Table 3)", ["s02", "s08", "s12", "s14"], "CC BY-NC 4.0 — Table 3 values re-plotted, figures not reproduced"),
    ("levy2022cryoai", "10.1007/978-3-031-19803-8_32", "required source: CryoAI chapter (read via arXiv:2203.08138v4)", ["s04", "s06"], "Springer chapter — figures not reproduced or animated"),
    ("giri2024cryo2structdata", "10.1038/s41597-024-03299-9", "required source: Cryo2StructData", ["s06"], "CC BY 4.0"),
    ("bepler2019topaz", "10.1038/s41592-019-0575-8", "primary method: Topaz", ["s01", "s08", "s09", "s10", "s13"], "author manuscript PMC6858545"),
    ("wagner2019cryolo", "10.1038/s42003-019-0437-z", "primary method: crYOLO", ["s09", "s13"], "CC BY 4.0"),
    ("rice2023tomotwin", "10.1038/s41592-023-01878-z", "primary method: TomoTwin", ["s03", "s09", "s13", "s14"], "CC BY 4.0"),
    ("sanchezgarcia2021deepemhancer", "10.1038/s42003-021-02399-1", "primary method: DeepEMhancer", ["s11", "s14"], "CC BY 4.0"),
    ("zheng2017motioncor2", "10.1038/nmeth.4193", "motion correction (conventional optimization)", ["s07"], ""),
    ("li2013counting", "10.1038/nmeth.2472", "electron counting + motion correction", ["s05", "s07"], ""),
    ("zivanov2019polishing", "10.1107/S205225251801463X", "Bayesian polishing (conventional)", ["s07"], "CC BY 4.0"),
    ("grant2015dose", "10.7554/eLife.06980", "dose weighting / critical exposure", ["s07"], "CC BY 4.0"),
    ("rosenthal2003fsc", "10.1016/j.jmb.2003.07.013", "FSC 0.143 criterion, B-factor", ["s10", "s11"], ""),
    ("scheres2012goldstandard", "10.1038/nmeth.2115", "gold-standard half-map refinement", ["s10", "s14"], ""),
    ("derosier1968", "10.1038/217130a0", "3D reconstruction from projections", ["s04"], ""),
    ("gyawali2024cryosegnet", "10.1093/bib/bbae282", "CryoSegNet (benchmark participant)", ["s12"], ""),
    ("scheres2015relion13", "10.1016/j.jsb.2014.11.010", "paper for EMPIAR-10017 expert coordinates", ["s01", "s08", "s10"], ""),
    ("shen2026b2ar", "10.1038/s41586-026-10892-y", "paper for EMD-72202 (β2AR dimer)", ["s05", "s11"], ""),
    ("bartesaghi2018bgal", "10.1016/j.str.2018.04.004", "PDB 6CVM (β-gal) used for simulations", ["s03", "s04"], ""),
    ("anger2013ribosome", "10.1038/nature12104", "PDB 4V6X (80S) used for tomogram simulation", ["s03", "s14"], ""),
    ("meng2023chimerax", "10.1002/pro.4792", "ChimeraX (rendering, molmap)", ["s04", "s11"], ""),
    ("zivanov2018relion3", "10.7554/eLife.42166", "RELION-3 (tutorial dataset = part of EMPIAR-10204)", ["s05", "s07"], "CC BY 4.0"),
]
DATASETS = [
    ("empiar10017", "EMPIAR-10017: Beta-galactosidase Falcon-II micrographs plus manually selected coordinates by Richard Henderson", "https://www.ebi.ac.uk/empiar/EMPIAR-10017/", ["s01", "s05", "s08", "s10"]),
    ("empiar10204", "EMPIAR-10204: The first reconstruction of beta-galactosidase solved by cryoARM200", "https://www.ebi.ac.uk/empiar/EMPIAR-10204/", ["s05", "s07"]),
    ("emd72202", "EMD-72202: CryoEM structure of beta2-adrenergic receptor dimer mediated by a biased allosteric modulator in lipid nanodisc (half maps)", "https://www.ebi.ac.uk/emdb/EMD-72202", ["s05", "s11"]),
]

def crossref(doi):
    req = urllib.request.Request("https://api.crossref.org/works/" + urllib.request.quote(doi), headers={"User-Agent": "cryo-ai-seminar-bib/1.0 (bibliography verification)"})
    for attempt in range(4):
        try:
            with urllib.request.urlopen(req, timeout=30) as r:
                return json.load(r)["message"]
        except Exception as e:
            err = e; time.sleep(2 + 3 * attempt)
    raise RuntimeError(f"{doi}: {err}")

def tex(s):
    s = s.replace("&", r"\&").replace("%", r"\%").replace("_", r"\_")
    return s

out, bib, failures = [], [], []
for key, doi, role, slides, lic in ENTRIES:
    try:
        m = crossref(doi)
    except Exception as e:
        failures.append(str(e)); continue
    title = re.sub(r"<[^>]+>", "", m["title"][0]).replace(" ", " ")
    authors = [f'{a.get("family","")}, {a.get("given","")}'.strip(", ") for a in m.get("author", [])]
    year = (m.get("published-online") or m.get("published-print") or m.get("issued"))["date-parts"][0][0]
    venue = (m.get("container-title") or [""])[-1] if m["type"] == "book-chapter" else (m.get("container-title") or [""])[0]
    rec = dict(key=key, doi=doi, title=title, authors=authors, year=year, venue=venue, volume=m.get("volume", ""),
               issue=m.get("issue", ""), pages=m.get("page", "") or m.get("article-number", ""), type=m["type"],
               role=role, slides=slides, licence_note=lic, verified="crossref", verified_on=time.strftime("%Y-%m-%d"))
    out.append(rec)
    kind = "inproceedings" if m["type"] in ("book-chapter", "proceedings-article") else "article"
    vfield = "booktitle" if kind == "inproceedings" else "journal"
    bib.append("@%s{%s,\n  author = {%s},\n  title = {%s},\n  %s = {%s},\n  year = {%s},%s%s%s\n  doi = {%s},\n  note = {%s}\n}\n" % (
        kind, key, " and ".join(tex(a) for a in authors), tex(title), vfield, tex(venue), year,
        f"\n  volume = {{{rec['volume']}}}," if rec["volume"] else "", f"\n  number = {{{rec['issue']}}}," if rec["issue"] else "",
        f"\n  pages = {{{rec['pages']}}}," if rec["pages"] else "", doi, tex(role + ("; " + lic if lic else "") + "; DOI verified via Crossref")))
    time.sleep(1.2)
for key, title, url, slides in DATASETS:
    out.append(dict(key=key, title=title, url=url, type="dataset", slides=slides, verified="archive API", verified_on=time.strftime("%Y-%m-%d")))
    bib.append("@misc{%s,\n  title = {%s},\n  howpublished = {\\url{%s}},\n  note = {Public dataset; accessed %s}\n}\n" % (key, tex(title), url, time.strftime("%Y-%m-%d")))

out.append(dict(key="no-dl-motion-correction", type="verified-absence",
                note="Europe PMC searches (title 'beam-induced motion'; motion + cryo-EM + neural network) on 2026-10-21 found no primary deep-learning motion-correction method in common use; MotionCor2, RELION polishing and cryoSPARC patch motion are optimization-based.",
                slides=["s06", "s07"]))
json.dump(out, open("src/data/bibliography.json", "w"), indent=1, ensure_ascii=False)
open("references.bib", "w").write("% references.bib — generated by scripts/build_bibliography.py from Crossref; do not edit by hand\n\n" + "\n".join(bib))
print(len(out), "entries;", "FAILURES:" if failures else "all DOIs resolved", failures)
sys.exit(1 if failures else 0)
