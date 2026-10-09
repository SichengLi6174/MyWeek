# Weekly Timetable — build brief

A personal weekly timetable that runs as my Safari homepage from local files.
It works like Google Calendar's week view, with a liquid-glass look.

## Visual references
- **Week view:** `design-reference.png` shows the target look, and `design-reference.html` is the same screen as static HTML/CSS.
- **Popovers:**
  - `popover-create.png`: the quick-create popover, with the Repeat menu open.
  - `popover-details.png`: the details popover for an existing event.
  - `popover-recurring.png`: the recurring-edit dialog shown after a drag.
  - `popovers-reference.html?screen=create|details|recurring`: the same three screens as static HTML/CSS, laid over the week view.

Match their tokens, spacing and glass treatment. The references are static; build the behaviour described below.

## Layout
- One week (Mon–Sun), with **07:00–17:00 fully visible at once**. No vertical scrolling at a normal laptop viewport.
- **One gridline per hour**, very faint (`rgba(255,255,255,0.09)`). There are no half-hour lines.
- **Time labels** use the 24h `HH:00` format and sit in a 64px gutter.
- **Today** has a filled red date pill, a slightly lighter column, and a red current-time line with a dot.
- **Header:** month and year, week number and range, the importance legend, a `‹ Today ›` segmented control, and a `+ New event` button.
- The layout scales to the viewport (the reference is 1440×900). The hour height comes from the available height: `(panel height) / 10`.

## Look
- Dark base `#0B0F1C` with soft blurred colour blobs behind everything. The glass needs something colourful behind it to blur.
- **Panel:** `rgba(255,255,255,0.055)` with `backdrop-filter: blur(30px) saturate(160%)`, a 28px radius, and an inset top highlight.
- **Event card:** rounded 14px, a vertical gradient of the tint (0.46 → 0.26 alpha), a 1px white border at 0.28, an inset top highlight, `backdrop-filter: blur(18px) saturate(180%)`, and a soft drop shadow.
  - Contents: a coloured dot, the title, a repeat icon if recurring, and the time range when the card is at least 50px tall.
- **Selected event:** a brighter border, a 3px tint ring, and pill-shaped handles on the top and bottom edges.
- **Font:** the system font stack (SF Pro on macOS), with tabular numbers for times.
- **Do not** use SVG displacement "refraction" filters. Safari doesn't support them inside `backdrop-filter`.

## Importance colours (fixed swatches, not a free picker)
| Level    | RGB           |
|----------|---------------|
| High     | 255, 99, 88   |
| Medium   | 255, 184, 76  |
| Low      | 92, 168, 255  |
| Personal | 70, 210, 150  |

## Interactions (Google Calendar parity)
- **Create:** click-and-drag on empty space to sweep out a time range; a single click makes a 1-hour event. A placeholder event appears in the slot and the quick-create popover opens beside it (see Popovers).
- **Move:** drag an event's body. It can move across days and snap to 30 minutes.
- **Resize:** drag the top or bottom edge (an 8px hit zone). It snaps to 30 minutes, with a 30-minute minimum length.
- **Clamping:** events can't be dragged or resized outside 07:00–17:00.
- **Feedback while dragging:**
  - the card follows the pointer, and a ghost shows the snapped position
  - a live time readout updates as it moves
  - the cursor changes to `grab` on the body and `ns-resize` on the edges
- **Open:** clicking an event opens the details popover; its pencil button switches to the edit form.
- **Recurring edits:** any change to a recurring event opens the recurring dialog. That includes saving the form, a move, a resize, and a colour change from the details popover.
- **Recurring deletes:** deleting a recurring event opens the same dialog, titled "Delete recurring event".
- **Escape** cancels an in-progress drag or closes the open popover. If a drag of a recurring event is cancelled from the dialog, the event snaps back.
- **Clicking outside** a popover closes it. Closing an unsaved quick-create discards the placeholder event.

## Popovers
All popovers use the darker popover glass, so form text stays legible over busy content:
- vertical gradient `rgba(44,50,74,·)` → `rgba(22,26,42,·)` at about 0.75–0.9 alpha
- `backdrop-filter: blur(40px) saturate(180%)`, 26px radius
- a 1px white border at 0.18, an inset top highlight, and a deep shadow

Inside a popover:
- Fields are glass "wells": `rgba(255,255,255,0.08)` with a 12px radius.
- The primary button is a near-white pill with dark text.
- Every button and control is at least 44px tall.

**Positioning:**
- Anchor the popover beside the event, on the right by default. Flip it to the left near the right edge, and clamp it vertically to the viewport.
- The recurring dialog is centred instead, over a dimmed and slightly blurred backdrop.

### 1. Quick create (`popover-create.png`)
Top to bottom:
1. A grabber bar and a close button.
2. A large **title** input with "Add title" as placeholder. It is auto-focused, and its focus ring takes the selected importance colour.
3. **Date and time:** a date button, a start-time button and an end-time button, plus the duration ("1 hr").
   - Times go in 30-minute steps.
   - Changing the start keeps the duration the same; changing the end changes the duration.
4. **Repeat** dropdown with four options:
   - Does not repeat
   - Daily
   - Weekly on {weekday of the event}
   - Every weekday (Mon–Fri)
5. **Importance:** the 4 swatches as a radio group, defaulting to Medium. Picking one recolours the placeholder event live.
6. **Notes:** a single-line field that grows as you type.
7. **Footer:** a "More options" link on the left (it can open the full edit view later; out of scope for v1) and **Save** on the right.

Enter saves. An empty title saves as "(No title)".

### 2. Event details (`popover-details.png`)
- **Toolbar** (top right): Edit, Duplicate, Delete and Close icon buttons. Each needs an `aria-label`.
- **Body:**
  - a rounded square in the event's colour, the title, and "Friday, 9 October · 14:00 – 15:00"
  - the repeat summary with the repeat icon ("Weekly on Friday"); hide this row if the event doesn't repeat
  - the notes; hide this row if there are none
- **Footer:** a quick importance switcher, made of the 4 swatches plus a label naming the current level.
- The clicked event gets a white ring in the grid while the popover is open.

### 3. Recurring dialog (`popover-recurring.png`)
- **Title:** "Edit recurring event" (or "Delete recurring event").
- **Subtitle:** what changed, for example "Weekly review moved to 15:00 – 16:00".
- **Radio choices:** **This event** (the default), **This and following events**, **All events**. These are real radio inputs.
- **Buttons:** Cancel and OK.
- **While the dialog is open:** after a drag, the grid shows the original slot as a dashed outline and the moved event at its new spot.

## Data model
Store rules, not expanded copies.
```ts
type Event = {
  id: string
  date: string          // "2026-10-09", first occurrence
  startMin: number      // minutes since midnight, multiple of 30
  endMin: number
  title: string
  colour: 'high' | 'medium' | 'low' | 'personal'
  repeat: 'none' | 'daily' | 'weekly' | 'weekdays'
  notes?: string
  until?: string        // last date (inclusive) for a split series
  overrides: Record<string, Partial<Event> | 'deleted'>  // keyed by occurrence date
}
```
The three recurring choices map onto this model as follows:
- **"This event"** writes `overrides[date]` (or `'deleted'` for a delete).
- **"This and following events"** splits the series: set `until` on the old series to the day before, and create a new series from the edited occurrence onward. For a delete, just set `until`.
- **"All events"** edits the series record itself.
  - A time shift is applied relative to the series, so dragging one occurrence +1h moves every occurrence +1h.
  - A delete removes the whole record.
- **Weekly and weekday rules:** `'weekly'` repeats on the weekday of `date`; `'weekdays'` repeats Monday to Friday.
- Expand the occurrences for the visible week at render time.
- Use plain dates plus minutes, with no timezone maths, so clock changes can't shift events.

## Tech decisions
- **Svelte 5** (runes) **+ Vite**, using **`vite-plugin-singlefile`** so the build is a single `dist/index.html`. Safari blocks module scripts loaded over `file://`, so the build must be one inlined file.
- **Drag and resize:** hand-rolled with Pointer Events plus `setPointerCapture`; snap with `Math.round(min / 30) * 30`. No list-based drag-and-drop library.
- **Libraries:** no date library and no rrule library needed.
- **Storage:** `localStorage` as one JSON blob. Add **Export / Import JSON** buttons as a backup.
- **No server.** The final product is a single HTML file, set as the Safari homepage via `file:///…/dist/index.html`.

## Suggested build order
1. Static week grid matching the reference.
2. Event rendering from the data model, plus `localStorage` persistence.
3. Popover shell (positioning, flipping, click-outside, Escape), then the quick-create and details popovers.
4. Drag to move, then resize, with snapping and clamping.
5. Recurrence expansion and the recurring dialog, wired to edits, drags and deletes.
6. Export/import, keyboard shortcuts (`t` = today, `←`/`→` = previous/next week), and polish.
