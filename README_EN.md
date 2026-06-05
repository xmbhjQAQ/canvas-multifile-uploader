# Canvas Multi-File Upload Helper

[中文说明](./README.md)

A userscript for Canvas LMS assignment submission pages. It adds a small floating panel to the Canvas assignment page so you can select multiple local files at once, then fills Canvas upload rows one by one through the normal `Add Another File` flow.

The script does not submit your assignment automatically. After the files are filled in, review the file names yourself and submit in Canvas manually.

## Features

- Select multiple files in one picker.
- Automatically create Canvas upload rows for each file.
- Bilingual UI: English and Chinese.
- Defaults to your browser language and remembers manual language changes.
- Works with many classic Canvas LMS assignment upload pages.

## Installation

1. Install a userscript manager such as [Tampermonkey](https://www.tampermonkey.net/) or Violentmonkey.
2. Create a new userscript.
3. Paste the content of [canvas-multi-file-upload.user.js](./canvas-multi-file-upload.user.js).
4. Save the script.
5. Open a Canvas assignment page such as `/courses/.../assignments/...`.

## Usage

1. Open a Canvas assignment page.
2. Click `Submit Assignment` and switch to the `File Upload` tab.
3. Open the `Files / 文件` panel in the bottom-right corner.
4. Click `Choose files / 选择文件`.
5. Select multiple files.
6. Wait for the script to fill Canvas upload rows one by one.
7. Review the file names shown in Canvas.
8. Submit manually in Canvas.

## Compatibility

The script matches assignment page paths like:

```text
https://*/courses/*/assignments/*
http://*/courses/*/assignments/*
```

This is broader than `instructure.com`, so it may also work with Canvas instances hosted on custom school domains.

Canvas installations can differ. The script may not work if:

- Your school uses a new or heavily customized assignment submission UI.
- The classic `Add Another File` upload control is unavailable.
- Assignment submission is handled by a third-party LTI tool.
- The page DOM is substantially changed by a school theme or plugin.

## Known Limits

- The script cannot bypass browser security restrictions. Files must be selected by the user through the file picker.
- The script does not and should not submit assignments automatically.
- If Canvas shows only one selected file after you selected many, do not submit. That means the current page structure was not handled correctly.

## Files

- `canvas-multi-file-upload.user.js`: the Tampermonkey/Violentmonkey userscript.

## Disclaimer

Always verify the final file list before submitting. This script only automates file selection on the Canvas page. It is not guaranteed to work on every Canvas instance and is not responsible for incorrect, missing, or late submissions.
