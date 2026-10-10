# Who Holds the Strings?

A 3-D presentation about **leaders and manipulators** for a Year 5–6 class.
White card-stock folders hang on fine threads in a turning "star" carousel. The front folder is the largest and is mirrored on a glossy floor. Tap it to open it, then flip through its pages; each page curls as it turns.

**Languages:** English, Español, Русский. **Appearance:** Day, Night or Auto (by time of day), plus a brightness slider. Both are in the ☀ settings button (top right). The site always opens in English; Day/Night and brightness are remembered on each screen.

Built with [Three.js](https://threejs.org) (3-D) and [PDF.js](https://mozilla.github.io/pdf.js/) (PDFs). There's no install and no build step, and it works without internet.

---

## How to present

| What you want | Touch / mouse | Keyboard or clicker |
|---|---|---|
| Turn the carousel | Swipe left or right, or tap a side file | ← → |
| Open the front file | Tap it, or press **Open** | Enter, Space, Page Down |
| Next page / previous page | Swipe on the page, or **Next** / **Back** | → / ← (Page Down / Page Up) |
| Play the video, open a PDF, show a quiz answer | The gold button under the page | Enter |
| Close the file | **✕ Close** | Esc |
| Full screen | **Full screen** button | F |

**With a presentation clicker**, just keep pressing "next". It opens each file, flips the pages, shows each quiz answer, and moves on to the next file at the end.

**Jump straight to a part:** add `#file=3&page=2` to the end of the address.

**Slow smart board?** The site lowers its own quality when it detects slowness. You can also add `?quality=low` to the address to start in the lightest mode.

---

## Three ways to show it

### 1. From the internet (GitHub Pages), the easiest option for school
1. Push this folder to the GitHub repository.
2. On GitHub, go to **Settings → Pages → Branch: `main` / root → Save**.
3. After a minute it's live at `https://don-xoce.github.io/1252/`.

The repository must be **public** for free GitHub Pages.

### 2. From a USB stick
Copy the **whole folder** to the USB stick and double-click `index.html`. Use **Chrome** or **Edge**.
Everything works offline. The only difference is that the small preview pictures on video/picture pages show an icon instead (browsers block that from USB). The videos and PDFs themselves still open.

### 3. From a laptop plugged into the board
Same as the USB option, or open the GitHub Pages link.

---

## How to add videos, slides, PDFs and pictures

### Permanent (stays in the presentation)
1. Put the file in the **`media`** folder, for example `media/my-slides.pdf`.
2. Open **`js/content.js`** in any text editor.
3. Add a page inside a folder's `pages: [ ... ]` list:

```js
{ type: "video",   title: { en: "My video", es: "Mi video", ru: "Моё видео" },  src: "media/my-video.mp4", caption: "Watch this!" },
{ type: "pdf",     title: "My slides", src: "media/my-slides.pdf" },
{ type: "image",   title: "A picture", src: "media/photo.jpg" },
{ type: "gallery", title: "Slides",    images: ["media/slide1.png", "media/slide2.png"] },
```

**Slides made with Claude:** download them as **PDF** and use `type: "pdf"`. Each slide becomes a page you can step through with Next/Back.
**Videos:** use **.mp4** files. Keep each one under about 90 MB (the GitHub limit is 100 MB).

### Quick (just for today)
Press **+ Add files**, or drag files onto the page. They appear in a new "Added Files" folder.
These disappear when the page is reloaded.

### Changing the words
All the text is in **`js/content.js`**, written three times: `{ en: "...", es: "...", ru: "..." }`. Button labels are in **`js/i18n.js`**. Each folder has a `tab`, a `color` (the small dot), a `title`, a `subtitle` (shown under the front folder) and `pages`.
The comments at the top of that file list every page type you can use. If the page goes blank after an edit, check for a missing comma or quote mark.

---

## Files

```
index.html          the page
css/style.css       buttons and colours
js/content.js       ← ALL THE WORDS, in 3 languages (edit this)
js/i18n.js          button labels in 3 languages
js/settings.js      language, Day/Night/Auto, brightness
js/pages.js         draws each page
js/app.js           the 3-D carousel, folders and page flips
js/media.js         full-screen video / PDF / picture viewer
media/              videos, PDFs, pictures
fonts/              the Inter font, Latin + Cyrillic (saved locally so it works offline)
vendor/             Three.js r158 and PDF.js 3.11 (saved locally so it works offline)
```
