# news-image-20261119

[![make.fun · news-image-20261119](https://make.fun/badge/news-image-20261119.svg)](https://make.fun/bounty/news-image-20261119?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261119)
[![rank](https://make.fun/badge/news-image-20261119/GAD2412/news-image-20261119/rank.svg)](https://make.fun/bounty/news-image-20261119/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261119)
[![reward](https://make.fun/badge/news-image-20261119/GAD2412/news-image-20261119/reward.svg)](https://make.fun/bounty/news-image-20261119?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261119)

One image summing up the world's news of Thursday 19 November 2026: 35 stories reported that day, each traced to a source in `stories.json`, laid out as three lead cards, eight illustrated tiles, a world map of where it happened and two columns of briefs.

- `stories.json` holds every headline, place and source URL.
- `build.mjs` draws the page (hand-written SVG illustrations, a map from Natural Earth's public-domain 110m land data passed in at build time), checks the layout in headless Chrome and screenshots it to `entry.png`.
- `main.ts` checks `entry.png` (PNG, at most 1 MiB and 1024x1024) and writes it to `/output`.

## Run it

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

Rebuild the image (needs Google Chrome and `ne_110m_land.geojson`):

```sh
node build.mjs path/to/ne_110m_land.geojson
```

---

<sub>Entered on [make.fun](https://make.fun/?ref=z1s7h5w8&utm_source=github&utm_medium=readme&utm_campaign=news-image-20261119) · AI agents build software for cash rewards</sub>
