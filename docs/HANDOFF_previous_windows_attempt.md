# Handoff / Continuation Notes

Read this first if you're picking this project up on a different machine. It captures exactly
where the build stands, what's verified vs. still open, and the exact commands to get back to a
working state. See also `README.md` for user-facing install/run instructions — this file is the
"what happened and what's next" companion to it.

## 1. Get the project onto the new laptop

This repo is a local git repository (not yet pushed anywhere). Easiest options, in order of
preference:

- **Push it to a remote** (GitHub/GitLab/etc.) from this machine, then `git clone` on the new one:
  ```powershell
  cd C:\Users\dmallic1\cryo-ai-seminar
  git remote add origin <your-repo-url>
  git push -u origin master
  ```
- **Copy the folder directly** (USB drive, cloud-synced folder, `scp`, etc.) — just exclude
  `node_modules/` and `dist/` (both are in `.gitignore` and fully regenerable via `npm install` /
  `npm run build`). Everything else, including `.git/`, should come along.

## 2. Tooling the new machine needs

This was built on Windows with **only Node/npm pre-installed**; everything else was added during
the session via `winget` (Windows's built-in package manager) and `npm`. On a fresh machine, run:

```powershell
# Node.js 20+ (this session used v24.19.0) — install from nodejs.org if not already present

winget install --id Git.Git -e
winget install --id Gyan.FFmpeg -e
winget install --id oschwartz10612.Poppler -e
# (restart the shell after these three so PATH picks them up)

cd cryo-ai-seminar
npm install
npx playwright install chromium   # needed only for the PDF/MP4 backup export scripts
```

**Not installed anywhere yet** (optional, only needed if you want real molecular renders or Manim
math animations instead of the current SVG schematics):
- **ChimeraX** — no winget package exists; download directly from https://www.cgl.ucsf.edu/chimerax/
  (free for non-commercial/academic use, accept their license during install).
- **Python 3** (prerequisite for **Manim**) — `winget install --id Python.Python.3.12 -e`, then
  `pip install manim`.

On macOS/Linux, swap `winget install` for `brew install git ffmpeg poppler` / your distro's package
manager — everything else (npm commands, project structure) is OS-agnostic.

## 3. Resume commands

```powershell
cd cryo-ai-seminar
npm install                  # if node_modules isn't already present
npm run dev                  # live dev server, http://localhost:5173 — view the deck
npm run qa                   # claim-ledger / timing / word-count / bibliography QA gate
npm run build                # offline static production build -> dist/
npm run preview              # serve the production build, http://localhost:4173

# Backups (run AFTER `npm run preview` is already running in another terminal):
npm run export:pdf           # -> backup/deck.pdf
npm run export:mp4           # -> backup/deck-backup.mp4, public/posters/deck-backup-poster.png
```

Presenter controls in the live deck: arrow keys / space to advance (click-by-click, nothing
auto-advances), `S` for reveal.js speaker view (current/next slide, timer, notes), `M` toggles the
reduced-motion fallback.

## 4. What's actually done

- **Full 16-slide timed script**, `src/data/story.yaml` — 15:00 total, 1803 words, passes QA.
  Every slide has the exact narration, click cues, source, essential qualification, one optional
  deeper explanation, and one likely Q&A pair.
- **Scientific claim ledger**, `src/data/claims.yaml` — every quantitative/evidence claim traced
  to a source, with `verify_status: verified` / `pending` / `unverifiable_flagged`.
- **Bibliography**, `src/data/bibliography.json` + `references.bib` — **all 9 required sources
  verified**, not placeholders:
  - The 4 required local PDFs (in `Downloads/`), verified by **direct PDF text extraction**
    (via `pdfjs-dist`, since `pdftoppm`/image rendering wasn't available until partway through):
    Iqbal et al. 2026 (BMC Artificial Intelligence, DOI 10.1186/s44398-025-00017-2, CC BY-NC-ND),
    Dhakal et al. 2025 (Briefings in Bioinformatics, DOI 10.1093/bib/bbaf011),
    Levy et al. 2022 (CryoAI, ECCV/LNCS, DOI 10.1007/978-3-031-19803-8_32, Springer-restricted —
    figures NOT reproduced),
    Giri et al. 2024 (Cryo2StructData, Scientific Data, DOI 10.1038/s41597-024-03299-9).
  - 5 supplementary primary papers, verified via publisher search (WebSearch, not a local PDF):
    Topaz (Bepler et al. 2019, Nat. Methods, 10.1038/s41592-019-0575-8), crYOLO (Wagner et al.
    2019, Commun. Biol., 10.1038/s42003-019-0437-z), TomoTwin (Rice et al. 2023, Nat. Methods,
    10.1038/s41592-023-01878-z), DeepEMhancer (Sanchez-Garcia et al. 2021, Commun. Biol.,
    10.1038/s42003-021-02399-1), MotionCor2 (Zheng et al. 2017, Nat. Methods, 10.1038/nmeth.4193 —
    confirmed conventional optimization, NOT deep learning).
  - A targeted search for a genuine primary deep-learning motion-correction paper came back
    **negative** — documented as a verified absence in `bibliography.json` (key
    `no-primary-dl-motion-correction`), not silently skipped.
- **Table 3 benchmark data verified exactly** against the real PDF (see
  `provenance/bbaf011_table3_extract.txt` for the full extracted table + surrounding prose), and a
  genuine **prose/table discrepancy** was found and documented: the paper's text says
  CryoTransformer is best on EMPIAR-10093/CryoPPP, but its own table shows Topaz is actually lower
  (better), 6.12 Å vs. 6.81 Å. The deck uses the table-derived value, per instruction. See
  `claims.yaml` entry `c12-conflict` and `src/data/benchmarks.json`.
- **3 of 16 slides implemented** as working React components (the prototype checkpoint):
  - `src/slides/Slide01Title.tsx` — title + low-SNR opening visual (seeded procedural simulation).
  - `src/slides/Slide09Comparison.tsx` — Topaz / crYOLO / TomoTwin conceptual comparison + table.
  - `src/slides/Slide12Benchmark.tsx` — six-picker resolution benchmark chart, 6-step reveal order.
- **Design system**, `src/styles/theme.css` — dark navy/charcoal, cyan/amber/magenta particle
  legend (always paired with line-style, never color alone), workflow indicator bar, citation
  strip, reduced-motion support.
- **QA gate**, `scripts/qa-check.mjs` (`npm run qa`) — fails the build if a slide lacks a target
  duration/source/qualification/Q&A, if total timing/word-count drifts out of range, or if a claim
  references a nonexistent slide.
- **PDF backup** (`backup/deck.pdf`) and **silent MP4 backup** (`backup/deck-backup.mp4`, 185s =
  30+80+75s for the 3 built slides), produced by a real headless-Chromium (Playwright) + ffmpeg
  pipeline — `scripts/export-pdf.mjs` / `scripts/export-mp4.mjs`. These auto-extend to cover more
  slides as they're built; they walk whatever's actually in the DOM, nothing is hardcoded to 3 or
  16.
- **Git repository**, initialized and committed (2 commits so far).

## 5. What's NOT done yet

- **Slides 2–8, 10–11, 13–16** (13 of 16) — fully scripted in `story.yaml` already, just not yet
  built as React components. Follow the exact same pattern as the 3 built slides:
  1. Create `src/slides/SlideNN<Name>.tsx`.
  2. Pull its content via `getSlide("sNN")` from `src/data/loadStory.ts`.
  3. Build the visual per that slide's `visual:` field in `story.yaml` (SVG/CSS, following the
     established color/line-style legend in `theme.css` — cyan solid = accepted, amber dashed =
     uncertain, magenta cross-hatch = rejected, violet = neural-network representation).
  4. Add `<WorkflowIndicator active="..."/>` if the slide has a `workflow_stage`.
  5. Add `<CitationStrip provenance="..." text="..."/>` for any evidence slide.
  6. Add `<SpeakerNotes slide={slide}/>` (handles the notes automatically from story.yaml).
  7. Add `data-story-id={slide.id}` on the `<section>` (needed by the MP4 export script).
  8. Wire it into `src/main.tsx`'s `<RevealDeck>` children, in slide order.
- **ChimeraX renders, Manim animations** — blocked by missing local tooling (see §2). Everything
  that would need them is currently an original, clearly labeled SVG schematic instead — this is
  intentional (the spec forbids fabricating scientifically-meaningful pixels), not an oversight.
- **Full transcript document** (a clean, readable write-up of all 16 scripts together, separate
  from the speaker-notes-in-slides format) — not yet produced as a standalone file.
- **Formal QA report document** — `npm run qa` gives a console report; a written QA report
  document (covering keyboard nav, speaker view, reduced-motion, 1920×1080 / 1366×768, offline use,
  etc. per the original spec's testing checklist) has not been separately written up.
- Once all 16 slides are built, **regenerate** `backup/deck.pdf` and `backup/deck-backup.mp4` (see
  §3) so they cover the complete deck instead of just the 3 prototype slides.

## 6. Things worth knowing before you continue

- **A background research agent went out of scope mid-build**: it was asked to only verify
  citations from the source PDFs, but instead also wrote its own competing (and partly
  corrupted — visible UTF-8 mojibake) version of `story.yaml`/`claims.yaml`. This was caught,
  the agent was stopped, and the correct files were restored before continuing. Nothing from that
  detour made it into the final files, but if anything in `story.yaml`/`claims.yaml` looks odd,
  that's the incident to check against (it's fully resolved as of the current git history).
- **ffmpeg concat-demuxer gotcha**: the `duration` directive in a concat-demuxer file list proved
  unreliable for the *last* entry's hold time with the installed ffmpeg build (tested empirically —
  neither the "repeat last file" nor "omit repeat" recipe gave correct durations). The working
  fix in `export-mp4.mjs`: encode each slide's PNG into its own correctly-timed video segment
  first (`-loop 1 -i img -t <seconds>`), then concatenate the segments with `-c copy`. If you
  modify that script, keep this approach rather than reverting to image-duration directives.
  Needing to re-derive a `$env:Path` refresh (`[System.Environment]::GetEnvironmentVariable(...)`)
  in each new PowerShell invocation was also necessary after the winget installs, since PATH
  changes don't propagate to already-open shells — a plain shell restart avoids this on a fresh
  machine.
- **reveal.js print-pdf makes one PDF page per fragment step**, not one per topic slide — the
  current `backup/deck.pdf` has 16 pages, but that's fragment-steps across only 3 slides, a
  coincidence in count, not full topic-slide coverage. Don't mistake "16-page PDF" for "all 16
  slides built" — check `src/main.tsx` for the actual slide count.
- **No connected browser was available to this agent** — the build was verified via `tsc -b`,
  `vite build`, HTTP checks, and the headless-Chromium export scripts, but never visually
  screenshotted by a human-facing browser tool. Open `npm run dev` yourself and actually look at
  it before presenting, especially for projector readability at 1920×1080 and 1366×768.

## 7. Suggested next step

Ask your assistant to continue by building the remaining 13 slides (§5, item 1), following the
same pattern as the 3 already built. Everything needed to do that — narration, visuals, citations,
design tokens — is already in place in `story.yaml`, `claims.yaml`, `theme.css`, and the shared
components under `src/components/`.
