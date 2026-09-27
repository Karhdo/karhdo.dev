# Third-party notices

karhdo.dev's own code is MIT-licensed (see [LICENSE](LICENSE)). The site also ships or embeds the third-party
material below. npm dependencies that are only bundled as code keep their own licences in `node_modules`.
This file lists what needs attribution or a notice: redistributed assets, derived files and copied code.

| Material                                | Where it's used                                                           | Licence      |
| --------------------------------------- | ------------------------------------------------------------------------- | ------------ |
| Tokyonight (folke/tokyonight.nvim)      | Site palette (`src/styles/theme.css`), Day code theme (converted JSON)     | Apache-2.0   |
| Lucide brand glyphs                     | GitHub / LinkedIn / Facebook / Twitter icons (`src/components/icons/lucide-brands.ts`) | ISC |
| Twemoji graphics (jdecked/twemoji)      | Vendored SVGs in `public/static/twemoji/`                                  | CC-BY 4.0    |
| simple-icons                            | Brand logos in the Daily stack and project chips                          | CC0 1.0      |
| Heroicons "link" (mini)                | Heading anchor icon (`src/plugins/heading-link-icon.mjs`)                 | MIT          |
| leohuynh.dev (hta218/leohuynh.dev)      | Tilted-grid background pattern, borrowed code patterns                    | MIT          |
| Liquid logo (`src/assets/icons/liquid.svg`) | Liquid chip on project cards (simple-icons has no Liquid logo)        | See below    |
| Outfit font                             | Site webfont; embedded in the generated `/og/*.png` cards                  | SIL OFL 1.1  |
| JetBrains Mono font                     | Monospace webfont (code blocks, statusline)                               | SIL OFL 1.1  |

---

## Tokyonight: folke/tokyonight.nvim

- Source: https://github.com/folke/tokyonight.nvim, pinned at commit
  [`cdc07ac78467a233fd62c493de29a17e0cf2b2b6`](https://github.com/folke/tokyonight.nvim/tree/cdc07ac78467a233fd62c493de29a17e0cf2b2b6)
- Copyright (c) Folke Lemaitre
- Licence: Apache License 2.0. Full text at the pinned commit:
  https://github.com/folke/tokyonight.nvim/blob/cdc07ac78467a233fd62c493de29a17e0cf2b2b6/LICENSE (also https://www.apache.org/licenses/LICENSE-2.0)

What this repository uses:

- **`src/styles/ec-tokyonight-day.json`** is a **converted derivative** of
  [`extras/sublime/tokyonight_day.tmTheme`](https://github.com/folke/tokyonight.nvim/blob/cdc07ac78467a233fd62c493de29a17e0cf2b2b6/extras/sublime/tokyonight_day.tmTheme)
  at the pinned commit. `scripts/convert-tmtheme.ts` converted it from a TextMate plist to VS Code theme JSON for
  Expressive Code. Colours and scopes are unchanged; the file's `$comment` field records the source and the
  change, as section 4(b) of the licence requires. Re-run the script to reproduce the file or pin it to a newer commit.
- **`src/styles/theme.css`** (mirrored in `src/styles/palette.ts`) uses the Tokyonight Day and Night colour values as
  design tokens.
- The dark code theme is Shiki's bundled `tokyo-night` theme (MIT, from the Tokyo Night VS Code theme), loaded by
  Expressive Code as a package dependency, not copied into this repository.

## Lucide brand glyphs

`src/components/icons/lucide-brands.ts` copies the node data of the `github`, `linkedin`, `facebook` and
`twitter` icons from `lucide-static` v0.544.0 (https://lucide.dev), because Lucide 1.x no longer ships brand icons.

```text
ISC License

Copyright (c) for portions of Lucide are held by Cole Bemis 2013-2023 as part of Feather (MIT).
All other copyright (c) for Lucide are held by Lucide Contributors 2025.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted, provided that the above
copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
```

The other icons come from the `@lucide/astro` package (ISC, same notice).

## Twemoji graphics

- Emoji graphics from [Twemoji](https://github.com/jdecked/twemoji), the maintained fork by jdecked, version
  **v17.0.3** (`TWEMOJI_VERSION` in `src/lib/emoji.ts`).
- Copyright 2019 Twitter, Inc and other contributors; copyright 2022–present Jason Sofonia & Justine De Caires
  (jdecked) and other contributors.
- Graphics licensed under **CC-BY 4.0**: https://creativecommons.org/licenses/by/4.0/
  ([LICENSE-GRAPHICS at v17.0.3](https://github.com/jdecked/twemoji/blob/v17.0.3/LICENSE-GRAPHICS)).
- Only the emoji the site uses are vendored, unmodified, in `public/static/twemoji/{codepoint}.svg`.

## simple-icons

- Brand SVG paths from [simple-icons](https://simpleicons.org) (`simple-icons` npm package), rendered as inline SVG at
  build time by `src/components/ui/SimpleIcon.astro` and tinted with Tokyonight tokens instead of brand colours.
- Licence: **CC0 1.0 Universal** (public domain dedication): https://creativecommons.org/publicdomain/zero/1.0/
- The logos remain trademarks of their owners. Using them doesn't imply endorsement.

## Heroicons

The heading anchor icon in `src/plugins/heading-link-icon.mjs` is the two `path` elements of the Heroicons
20 × 20 solid ("mini") `link` icon, carried over from v1 (https://heroicons.com).

```text
MIT License

Copyright (c) Tailwind Labs, Inc.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## leohuynh.dev

- Source: https://github.com/hta218/leohuynh.dev, Copyright (c) 2024 Leo Huynh, MIT License
  (https://github.com/hta218/leohuynh.dev/blob/main/LICENSE; same terms as the Heroicons text above).
- the tilted-grid pattern (72 × 56 cells, -18deg skew), redrawn inline in `src/components/ui/TiltedGridBackground.astro` (v2 frost grid) and in the OG cards by `src/lib/og/tree.ts`
  comes from it, carried over from v1.
- v2 also borrows code patterns from it: the Astro config layout, the content collection schema,
  `remark-code-titles`, the Twemoji component and emoji map, the Biome config, `vercel.json` and the postgres.js pool.

## Liquid logo

`src/assets/icons/liquid.svg` was carried over from v1 (added in commit `fcd2157`, 2023) and is used because
simple-icons has no Liquid logo. Its source wasn't recorded then. Its shape and `0 0 81.97 122.88` viewBox match
the UXWing free icon set, whose licence allows use without attribution. It's noted here for completeness. If the
source turns out to be different, update this entry.

## Fonts (SIL Open Font License 1.1)

- **Outfit**: Copyright 2021 The Outfit Project Authors (https://github.com/Outfitio/Outfit-Fonts).
  Served through `@fontsource-variable/outfit` as the site webfont. The static `@fontsource/outfit` WOFF files are
  embedded by Satori into the generated `/og/*.png` social cards.
- **JetBrains Mono**: Copyright 2020 The JetBrains Mono Project Authors (https://github.com/JetBrains/JetBrainsMono).
  Served through `@fontsource-variable/jetbrains-mono`.

Both are licensed under the SIL Open Font License, Version 1.1, reproduced below (also at
https://openfontlicense.org).

```text
-----------------------------------------------------------
SIL OPEN FONT LICENSE Version 1.1 - 26 February 2007
-----------------------------------------------------------

PREAMBLE
The goals of the Open Font License (OFL) are to stimulate worldwide
development of collaborative font projects, to support the font creation
efforts of academic and linguistic communities, and to provide a free and
open framework in which fonts may be shared and improved in partnership
with others.

The OFL allows the licensed fonts to be used, studied, modified and
redistributed freely as long as they are not sold by themselves. The
fonts, including any derivative works, can be bundled, embedded,
redistributed and/or sold with any software provided that any reserved
names are not used by derivative works. The fonts and derivatives,
however, cannot be released under any other type of license. The
requirement for fonts to remain under this license does not apply
to any document created using the fonts or their derivatives.

DEFINITIONS
"Font Software" refers to the set of files released by the Copyright
Holder(s) under this license and clearly marked as such. This may
include source files, build scripts and documentation.

"Reserved Font Name" refers to any names specified as such after the
copyright statement(s).

"Original Version" refers to the collection of Font Software components as
distributed by the Copyright Holder(s).

"Modified Version" refers to any derivative made by adding to, deleting,
or substituting -- in part or in whole -- any of the components of the
Original Version, by changing formats or by porting the Font Software to a
new environment.

"Author" refers to any designer, engineer, programmer, technical
writer or other person who contributed to the Font Software.

PERMISSION & CONDITIONS
Permission is hereby granted, free of charge, to any person obtaining
a copy of the Font Software, to use, study, copy, merge, embed, modify,
redistribute, and sell modified and unmodified copies of the Font
Software, subject to the following conditions:

1) Neither the Font Software nor any of its individual components,
in Original or Modified Versions, may be sold by itself.

2) Original or Modified Versions of the Font Software may be bundled,
redistributed and/or sold with any software, provided that each copy
contains the above copyright notice and this license. These can be
included either as stand-alone text files, human-readable headers or
in the appropriate machine-readable metadata fields within text or
binary files as long as those fields can be easily viewed by the user.

3) No Modified Version of the Font Software may use the Reserved Font
Name(s) unless explicit written permission is granted by the corresponding
Copyright Holder. This restriction only applies to the primary font name as
presented to the users.

4) The name(s) of the Copyright Holder(s) or the Author(s) of the Font
Software shall not be used to promote, endorse or advertise any
Modified Version, except to acknowledge the contribution(s) of the
Copyright Holder(s) and the Author(s) or with their explicit written
permission.

5) The Font Software, modified or unmodified, in part or in whole,
must be distributed entirely under this license, and must not be
distributed under any other license. The requirement for fonts to
remain under this license does not apply to any document created
using the Font Software.

TERMINATION
This license becomes null and void if any of the above conditions are
not met.

DISCLAIMER
THE FONT SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO ANY WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT
OF COPYRIGHT, PATENT, TRADEMARK, OR OTHER RIGHT. IN NO EVENT SHALL THE
COPYRIGHT HOLDER BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
INCLUDING ANY GENERAL, SPECIAL, INDIRECT, INCIDENTAL, OR CONSEQUENTIAL
DAMAGES, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF THE USE OR INABILITY TO USE THE FONT SOFTWARE OR FROM
OTHER DEALINGS IN THE FONT SOFTWARE.
```
