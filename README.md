# My Week

A personal weekly timetable with a nice aesthetic inpired by liquid glass. It's built to run from local files as a browser homepage: no server, no account, and all data stays in the browser. Functionality and design is very minimalist as this is meant for personal use no collaboration.

Note that the data persistance is through local storage, which is per browser per computer per OS and per browser profile (in some cases). The intended use case is to set it as your homepage in one browser and only use it in one browser. Clearing browser data may wipe your data so there is an export and import function built for backing up. 

Mon–Sun, with 07:00–17:00 fully visible at once. Events are colour-coded by importance (High, Medium, Low, Personal).

## Run it

Requires Node.js (developed on v24) and npm.

```bash
npm install
npm run dev
```

Then open http://localhost:5173.

## Build the single-file version (Recommended)

```bash
npm run build
```

This writes one self-contained file, `dist/index.html`, with the JS and CSS inlined. Safari blocks module scripts loaded over `file://`, so the build has to be a single file. Open it straight from disk, or set it as your Safari homepage with `file:///…/MyWeek/dist/index.html`.

## Using it

- **Create an event:** click an empty slot for a 1-hour event, or click and drag to sweep out a range. A quick-create popover opens beside it. `+ New event` does the same.
- **Open an event:** click it to see its details. The pencil button edits it. You can also duplicate it, delete it, or change its colour from there.
- **Move:** drag an event by its body, including to another day. It snaps to 30 minutes and stays inside 07:00–17:00. A dashed ghost shows the snapped slot and a pill shows the live time.
- **Resize:** drag the top or bottom edge. It snaps to 30 minutes, with a 30-minute minimum.
- **Recurring events:** any edit (saving the form, a move or resize, a colour change) or delete opens a dialog: **This event**, **This and following events** or **All events**. Cancelling leaves the event untouched. If you change the repeat rule itself, "This event" isn't offered.
- **Navigate:** `‹ Today ›` in the header, or the keyboard: `t` for today, `←` / `→` for the previous / next week. The shortcuts are off while a popover or dialog is open or you're typing.
- **Backup:** the `⋯` button in the header has **Export JSON** (downloads `myweek-YYYY-MM-DD.json`) and **Import JSON…** (replaces your events after a confirmation; an invalid file is rejected without changing anything).
- **Escape** cancels a drag (the event snaps back) or closes the open popover. Clicking outside a popover closes it.
- **Overlapping events** squeeze into the same column, each getting a thinner share of the width.

The full brief and build order are in [design/HANDOFF.md](design/HANDOFF.md).

## How it works

- **Stack:** Svelte 5 (runes) + Vite, with `vite-plugin-singlefile` for the single-file build. No date or recurrence libraries.
- **Storage:** events are saved as one JSON blob in `localStorage` under `myweek.v1`. The first run seeds some sample events. Clearing site data resets it, and the data is per browser, so use Export JSON for backups (see below).
- **Data model:** the app stores rules, not expanded copies. An event has a first date, start and end in minutes since midnight, a repeat rule (`none`, `daily`, `weekly` or `weekdays`), and per-date `overrides`. "This event" writes an override, "This and following" splits the series with `until`, and "All events" edits the series record (time shifts are relative to the occurrence). The occurrences for the visible week are worked out when it renders. Dates are plain `YYYY-MM-DD` strings plus minutes, so daylight-saving changes can't shift events.
- **Layout:** event positions are percentages of the 07:00–17:00 span, so the grid fills the window with no scrolling.

## Where your data lives

`localStorage` belongs to one browser on one machine, and to the page's origin. Chrome, another Mac, or a different `file://` location won't see Safari's copy. Use **Export JSON** regularly. In Safari, "Clear History and Website Data" or a private window can wipe it, and moving or renaming the built file may start you on an empty calendar. Import brings it back.

## Project layout

```
src/
  App.svelte               app state, popover flow
  lib/
    WeekGrid.svelte        the week grid, event cards, drag to create / move / resize
    Header.svelte          title, legend, navigation
    Popover.svelte         glass popover shell (positioning, outside click, Escape)
    EventForm.svelte       quick-create and edit form
    EventDetails.svelte    details popover
    Select.svelte          dropdown used by the form
    RecurringDialog.svelte this / following / all dialog
    events.js              expansion of repeat rules, overlap layout, localStorage
    dates.js               plain-date helpers
    sample.js              seed events
design/                    design brief and reference screens
```
