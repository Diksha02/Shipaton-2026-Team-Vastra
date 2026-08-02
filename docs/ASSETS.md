# ASSETS

## Garment cutouts — PLACEHOLDER, must be replaced before store release

`apps/mobile/assets/garments/*.webp` — 17 transparent cutouts (800px) plus
`thumb/` (240px). ~420 KB total.

**Source:** Unsplash, downloaded via `https://unsplash.com/photos/<slug>/download`.
**Licence:** the [Unsplash Licence](https://unsplash.com/license) — free for
commercial use, no attribution required, modification permitted.

### How they were made

1. Downloaded as JPEG, converted to WebP (713 KB → 383 KB).
2. Backgrounds removed with **U2Net segmentation** (`rembg`), *not* a flood
   fill. A first attempt used corner flood fill: it cut bottoms, shoes and hats
   cleanly and **failed on every single top**, because tops are shot on white
   *wood* whose plank texture and shadows stop a fill dead.
3. Cropped to the garment's alpha bounding box, so every piece fills its zone
   on the figure.
4. Saved as WebP with alpha: **2552 KB PNG → 342 KB WebP, 87% smaller.**

`rembg` and `onnxruntime` are **asset-preparation tools on the dev machine
only**. They are not app dependencies, never ship, and are never called at
runtime. Scripts live in the session scratchpad — re-run them only when
replacing imagery.

### Why cutouts, not photographs

Two reasons, and both are load-bearing:

- **The figure.** A garment can only look *worn* if it has no background. A
  flat-lay dropped into a torso-shaped hole brings its kitchen table with it.
- **Consistency.** Every garment now sits on the app's own `surfaceGarment`
  colour, which removes the mismatched white-wood / grey-studio / pink
  backgrounds that made the grid read as stock photography.

### Still placeholders

- They are not the user's clothes, and the app's premise is *your* wardrobe.
- Some source poses are wrong for a figure — one pair of jeans is photographed
  with a leg splayed diagonally, so it does not hang like worn trousers.
- Only 3 tops survived review; the free pool of isolated product shots is thin.

Replace before T34 (store screenshots). Nothing in code changes: swap the
files, keep the names.

### Rejected during review

Of ~35 downloads, 18 were discarded after visual inspection on contact sheets.
Search alt-text did **not** reliably describe the actual photo, so every image
was checked before use.

- **Third-party trademarks** — Nike swoosh, Levi's tabs, a D&G bag.
- **Whole-outfit flat lays** where one garment was expected.
- **People wearing the garment** rather than the garment as a product.
- **Slogan text** on garments.
- **Segmentation failures** — `top-01`'s sweater vanished entirely because
  U2Net chose the sprig of greenery beside it as the subject; `top-03` nearly
  disappeared. Stacks of folded shirts also cut out as one indistinct block.

### Provenance

The 17 that survived review.

| File | Unsplash slug | What it shows |
|---|---|---|
| `top-04` | g3-0bNJzf-M | Mustard crochet knit |
| `top-06` | iYplxeukLjU | Black lace camisole |
| `top-07` | 7cERndkOyDw | White crew-neck sweatshirt |
| `bottom-03` | 9yoXrG6Er_g | Blue slim jeans |
| `bottom-04` | wNP79A-_bRY | Dark blue jeans, turn-up |
| `bottom-05` | muo8Zdkz_4w | Black jeans, folded |
| `outer-01` | YehJ089r0uY | Black leather biker jacket |
| `outer-05` | Vfy9pP8tkQg | Black leather jacket, cropped |
| `outer-06` | Fg15LdqpWrs | Rust bomber jacket |
| `shoe-02` | ksrsdzqxCPg | White trainers, pair |
| `shoe-03` | 9qyGYNJN0nI | White trainer, single |
| `bag-01` | tcVH_BwHtrc | Woven brown leather tote |
| `bag-02` | xzrJCS4grC4 | Tan saddle bag |
| `acc-01` | wjq8Zbh53Nw | Round sunglasses |
| `hat-01` | t8HiP3e5abg | White trucker cap |
| `hat-02` | 2loKxdi6Hmo | Washed grey cap |
| `hat-03` | SJmPgqY4Hrk | Two-tone trucker cap |

## App icon and splash

Generated from the Instrument Serif TTF so the mark and the in-app masthead are
the same letterform. `icon.png`, Android adaptive foreground/background/
monochrome, light and dark splash marks, favicon. See DECISIONS.md.
