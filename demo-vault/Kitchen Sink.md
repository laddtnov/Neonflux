# Cyberpunk Terminal

Every surface the theme touches, on one page. Read this in **Reading view**,
**Live Preview**, and **Source mode** — they render differently, and a rule
that looks right in one can break in another.

Body text is deliberately calm. Neon is a poster palette, not a reading
palette, so the accents live on headings, links, chrome, and code tokens
while prose stays a near-white you can sit with for an hour. This paragraph
is the actual test: if it is tiring to read, the theme has failed at its main
job no matter how good the screenshot looks.

## Script coverage

Latin: The quick brown fox jumps over the lazy dog — 0123456789

Cyrillic: Привіт, це тест кирилиці. Чи збігається шрифт?

Latin-ext: Vladyslav Novytskyi — Größe, año, çalışma

If the Cyrillic line renders in a visibly different face from the Latin line
above it, the display font has no Cyrillic coverage and the fallback stack has
taken over mid-document.

## Heading two

### Heading three

#### Heading four

##### Heading five

###### Heading six

## Inline formatting

**Bold text**, *italic text*, ***both at once***, ~~struck through~~,
==highlighted==, and `inline code` in a sentence.

An [[Unresolved Note]] link, an [[Kitchen Sink|alias to this note]], and an
[external link](https://laddtnov.xyz). Tags: #cyberpunk #design/tokens #wcag

## Blockquote

> The border is the affordance. Remove it and there is nothing left to show
> that a control exists at all.
>
> — the reason `--cyber-control-border` is a separate token

## Callouts

> [!note] Note
> Callouts inherit from `--color-*`, so they follow the palette without the
> theme writing a single callout rule.

> [!warning] Warning
> Check this one in both themes — warning yellow is the hue most likely to
> fail contrast on a light background.

> [!danger] Danger
> Red on near-black is the classic contrast trap.

> [!tip] Tip
> Accent-coloured callouts share the link colour.

## Code

```js
// Comments are text a reader parses, so they are held to 4.5:1 like prose.
const contrast = (foreground, background) => {
  const [hi, lo] = [luminance(foreground), luminance(background)].sort();
  return (hi + 0.05) / (lo + 0.05);
};

export const FLOOR = { text: 4.5, nonText: 3.0 };
```

```css
.theme-dark {
  --accent-h: 183;
  --text-accent: #00f2ff;
}
```

```python
def check(pairs: list[tuple[str, str]], floor: float = 4.5) -> bool:
    """Every pair must clear the floor."""
    return all(contrast(fg, bg) >= floor for fg, bg in pairs)
```

## Table

| Token | Dark | Light | Role |
| --- | --- | --- | --- |
| `--text-normal` | `#d1d1d1` | `#3a3a45` | body text |
| `--text-accent` | `#00f2ff` | `#00707f` | links, active state |
| `--cyber-control-border` | `#54686c` | `#6f8a8f` | control affordance |
| `--background-modifier-border` | `#2a2a31` | `#cfcfdc` | decorative edges |

## Tasks

- [ ] Check the focus ring by tabbing through the sidebar
- [x] Verify every text pair clears 4.5:1
- [ ] Look at the graph view in both themes
- [ ] Open Settings and check the form fields have visible borders

## Lists

1. Ordered item
2. Another, with nesting
   - Nested bullet
   - Another nested bullet
     - Third level, to check the indent guides
3. Back to the top level

---

## Form surfaces

Open **Settings** and the **Quick Switcher** (`Cmd-O`) — text inputs,
dropdowns, toggles, and sliders all live there, and none of them appear in a
note. They are the surfaces a theme most often forgets.

Footnote reference[^1].

[^1]: And the footnote itself, which renders in muted text.
