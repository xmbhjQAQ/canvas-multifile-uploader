// ==UserScript==
// @name         Canvas Multi-File Upload Helper
// @namespace    https://frostburg.instructure.com/
// @version      1.0.5
// @description  Add a bilingual Canvas assignment UI for selecting and assigning multiple upload files at once.
// @match        https://*.instructure.com/courses/*/assignments/*
// @match        http://*.instructure.com/courses/*/assignments/*
// @match        https://*/courses/*/assignments/*
// @match        http://*/courses/*/assignments/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(() => {
  "use strict";

  const CONFIG = {
    rootId: "cmfuh-root",
    langStorageKey: "cmfuh-lang",
    addButtonSelectors: [".add_another_file_link", "button", "a"],
    fileInputSelector:
      "#submit_online_upload_form .submission_attachment:not(#submission_attachment_blank) input[type='file'], " +
      ".submission_attachment:not(#submission_attachment_blank) input[type='file'], " +
      "#submit_online_upload_form input[type='file'], " +
      "input[type='file']",
    addButtonText: /add another file/i,
    waitTimeoutMs: 5000,
    waitIntervalMs: 50,
  };

  const sleep = (ms) => new Promise((resolve) => window.setTimeout(resolve, ms));
  const unique = (items) => Array.from(new Set(items));

  const I18N = {
    en: {
      title: "Canvas multi-file upload",
      toggle: "Files",
      choose: "Choose files",
      check: "Check",
      lang: "中文",
      close: "Close",
      checkTitle: "Check whether Canvas upload controls are visible",
      meta: "Open the Canvas File Upload tab first. This helper fills files but never submits.",
      ready: "Ready. Canvas has {inputCount} upload row(s); {emptyCount} are empty and no file is selected there yet.",
      waiting: "Waiting for Canvas upload controls. Open the File Upload tab or click Submit Assignment.",
      noDataTransfer: "This browser does not support DataTransfer-based file assignment.",
      chooseFromComputer: "Choose files from your computer...",
      noFiles: "No files selected.",
      selected: "Selected {count} file(s). Preparing Canvas rows...",
      addingRow: "Adding Canvas file row for {current}/{total}...",
      missingEmptyRow: "Canvas did not provide an empty upload row for file {current}.",
      assigning: "Assigning file {current}/{total}: {name}",
      nextRowFailed: "Canvas did not create the next upload row after file {current}.",
      assigned: "Assigned {count} file(s). Review the file names, then submit in Canvas.",
      missingAdd: 'Could not find the visible Canvas "Add Another File" control.',
    },
    zh: {
      title: "Canvas 多文件上传",
      toggle: "文件",
      choose: "选择文件",
      check: "检查",
      lang: "English",
      close: "关闭",
      checkTitle: "检查 Canvas 上传控件是否可见",
      meta: "请先打开 Canvas 的 File Upload 标签。本工具只填入文件，不会自动提交。",
      ready: "已就绪。Canvas 当前有 {inputCount} 个上传行；其中 {emptyCount} 个还是空的，尚未选择文件。",
      waiting: "正在等待 Canvas 上传控件。请打开 File Upload 标签，或先点击 Submit Assignment。",
      noDataTransfer: "当前浏览器不支持基于 DataTransfer 的文件填充。",
      chooseFromComputer: "请从电脑中选择文件...",
      noFiles: "没有选择文件。",
      selected: "已选择 {count} 个文件，正在准备 Canvas 上传行...",
      addingRow: "正在为第 {current}/{total} 个文件添加 Canvas 上传行...",
      missingEmptyRow: "Canvas 没有为第 {current} 个文件提供空上传行。",
      assigning: "正在填入第 {current}/{total} 个文件：{name}",
      nextRowFailed: "Canvas 在第 {current} 个文件之后没有创建下一个上传行。",
      assigned: "已填入 {count} 个文件。请检查文件名，然后在 Canvas 中手动提交。",
      missingAdd: '找不到可见的 Canvas "Add Another File" 控件。',
    },
  };

  let currentLang = (() => {
    const saved = window.localStorage.getItem(CONFIG.langStorageKey);
    if (saved === "en" || saved === "zh") return saved;
    return /^zh\b/i.test(navigator.language || "") ? "zh" : "en";
  })();

  const format = (template, values = {}) =>
    template.replace(/\{(\w+)\}/g, (match, key) =>
      Object.prototype.hasOwnProperty.call(values, key) ? String(values[key]) : match
    );

  const t = (key, values) => format(I18N[currentLang][key] || I18N.en[key] || key, values);

  const isCanvasAssignmentPage = () =>
    /\/courses\/[^/]+\/assignments\/[^/]+/.test(window.location.pathname);

  const visible = (element) => {
    if (!element) return false;
    const style = window.getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    return (
      style.display !== "none" &&
      style.visibility !== "hidden" &&
      rect.width > 0 &&
      rect.height > 0
    );
  };

  const findByText = (selectors, pattern) => {
    const candidates = selectors.flatMap((selector) =>
      Array.from(document.querySelectorAll(selector))
    );
    return candidates.find((element) => {
      if (element.closest(`#${CONFIG.rootId}`)) return false;
      if (!visible(element)) return false;
      return pattern.test(element.textContent || "");
    });
  };

  const findAddButton = () => {
    const direct = Array.from(document.querySelectorAll(".add_another_file_link")).find(visible);
    if (direct) return direct;
    return findByText(CONFIG.addButtonSelectors, CONFIG.addButtonText);
  };

  const getFileInputs = () =>
    unique(Array.from(document.querySelectorAll(CONFIG.fileInputSelector))).filter((input) => {
      if (!(input instanceof HTMLInputElement)) return false;
      if (input.type !== "file") return false;
      if (input.closest("#submission_attachment_blank")) return false;
      if (input.disabled) return false;
      return visible(input) || input.closest(".submission_attachment");
    });

  const getEmptyFileInputs = () =>
    getFileInputs().filter((input) => !input.files || input.files.length === 0);

  const getCanvasUploadAvailable = () => Boolean(findAddButton() || getFileInputs().length > 0);

  const createFileList = (files) => {
    const transfer = new DataTransfer();
    files.forEach((file) => transfer.items.add(file));
    return transfer.files;
  };

  const dispatchFileInputEvents = (input) => {
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
  };

  const assignFile = (input, file) => {
    input.files = createFileList([file]);
    dispatchFileInputEvents(input);
  };

  const waitForMoreEmptyInputs = async (previousEmptyCount) => {
    const deadline = Date.now() + CONFIG.waitTimeoutMs;

    while (Date.now() < deadline) {
      const emptyInputs = getEmptyFileInputs();
      if (emptyInputs.length > previousEmptyCount) return emptyInputs;
      await sleep(CONFIG.waitIntervalMs);
    }

    return getEmptyFileInputs();
  };

  const makeRowCreationError = (message) => {
    return new Error(message);
  };

  const dispatchMouseSequence = (element) => {
    ["pointerdown", "mousedown", "pointerup", "mouseup", "click"].forEach((type) => {
      element.dispatchEvent(
        new MouseEvent(type, {
          bubbles: true,
          cancelable: true,
          view: window,
        })
      );
    });
  };

  const triggerAddAnotherFile = async (previousEmptyCount) => {
    const addButton = findAddButton();
    if (!addButton) {
      throw makeRowCreationError(t("missingAdd"));
    }

    addButton.scrollIntoView({ block: "center", inline: "nearest" });
    if (typeof addButton.focus === "function") addButton.focus();

    addButton.click();
    let emptyInputs = await waitForMoreEmptyInputs(previousEmptyCount);
    if (emptyInputs.length > previousEmptyCount) return emptyInputs;

    if (typeof window.jQuery === "function") {
      window.jQuery(addButton).trigger("click");
      emptyInputs = await waitForMoreEmptyInputs(previousEmptyCount);
      if (emptyInputs.length > previousEmptyCount) return emptyInputs;
    }

    dispatchMouseSequence(addButton);
    return waitForMoreEmptyInputs(previousEmptyCount);
  };

  const waitForEmptyInput = async () => {
    const deadline = Date.now() + CONFIG.waitTimeoutMs;

    while (Date.now() < deadline) {
      const emptyInput = getEmptyFileInputs()[0];
      if (emptyInput) return emptyInput;
      await sleep(CONFIG.waitIntervalMs);
    }

    return getEmptyFileInputs()[0] || null;
  };

  const assignFilesSequentially = async (files, setStatus) => {
    for (let index = 0; index < files.length; index += 1) {
      let emptyInput = getEmptyFileInputs()[0];

      if (!emptyInput) {
        const beforeEmptyCount = getEmptyFileInputs().length;
        setStatus(t("addingRow", { current: index + 1, total: files.length }), "busy");
        await triggerAddAnotherFile(beforeEmptyCount);
        emptyInput = await waitForEmptyInput();
      }

      if (!emptyInput) {
        throw makeRowCreationError(t("missingEmptyRow", { current: index + 1 }));
      }

      setStatus(t("assigning", { current: index + 1, total: files.length, name: files[index].name }), "busy");
      assignFile(emptyInput, files[index]);
      await sleep(150);

      if (index < files.length - 1) {
        const beforeEmptyCount = getEmptyFileInputs().length;
        setStatus(t("addingRow", { current: index + 2, total: files.length }), "busy");
        const emptyInputs = await triggerAddAnotherFile(beforeEmptyCount);
        if (emptyInputs.length === beforeEmptyCount) {
          throw makeRowCreationError(t("nextRowFailed", { current: index + 1 }));
        }
      }
    }

    return {
      mode: "rows",
      count: files.length,
      message: t("assigned", { count: files.length }),
    };
  };

  const pickFiles = () =>
    new Promise((resolve) => {
      const picker = document.createElement("input");
      picker.type = "file";
      picker.multiple = true;
      picker.style.position = "fixed";
      picker.style.left = "-9999px";
      picker.style.top = "-9999px";
      picker.addEventListener(
        "change",
        () => {
          const files = Array.from(picker.files || []);
          picker.remove();
          resolve(files);
        },
        { once: true }
      );
      document.body.appendChild(picker);
      picker.click();
    });

  const createStyles = () => {
    const style = document.createElement("style");
    style.textContent = `
      #${CONFIG.rootId} {
        position: fixed;
        right: 18px;
        bottom: 18px;
        z-index: 2147483647;
        font-family: Lato, Arial, sans-serif;
        color: #1f2933;
      }

      #${CONFIG.rootId} .cmfuh-card {
        width: 296px;
        max-width: calc(100vw - 32px);
        background: #fff;
        border: 1px solid #c7cdd1;
        border-radius: 8px;
        box-shadow: 0 10px 28px rgba(17, 24, 39, 0.18);
        overflow: hidden;
      }

      #${CONFIG.rootId} .cmfuh-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        padding: 10px 12px;
        background: #f5f7f8;
        border-bottom: 1px solid #d8dde1;
        font-size: 14px;
        font-weight: 700;
      }

      #${CONFIG.rootId} .cmfuh-header-actions {
        display: flex;
        align-items: center;
        gap: 6px;
        flex-shrink: 0;
      }

      #${CONFIG.rootId} .cmfuh-lang {
        min-height: 28px;
        padding: 0 8px;
        border: 1px solid #c7cdd1;
        border-radius: 4px;
        background: #fff;
        color: #1f2933;
        cursor: pointer;
        font-size: 12px;
      }

      #${CONFIG.rootId} .cmfuh-lang:hover {
        background: #e8ecef;
      }

      #${CONFIG.rootId} .cmfuh-close {
        width: 28px;
        height: 28px;
        border: 0;
        border-radius: 4px;
        background: transparent;
        cursor: pointer;
        font-size: 20px;
        line-height: 1;
        color: #334451;
      }

      #${CONFIG.rootId} .cmfuh-close:hover {
        background: #e8ecef;
      }

      #${CONFIG.rootId} .cmfuh-body {
        padding: 12px;
      }

      #${CONFIG.rootId} .cmfuh-actions {
        display: flex;
        gap: 8px;
        align-items: center;
      }

      #${CONFIG.rootId} .cmfuh-primary,
      #${CONFIG.rootId} .cmfuh-toggle {
        border: 1px solid #0b5d8e;
        border-radius: 4px;
        background: #0b5d8e;
        color: #fff;
        cursor: pointer;
        font-size: 14px;
        font-weight: 700;
      }

      #${CONFIG.rootId} .cmfuh-primary {
        flex: 1;
        min-height: 36px;
        padding: 0 12px;
      }

      #${CONFIG.rootId} .cmfuh-primary:disabled {
        cursor: wait;
        opacity: 0.7;
      }

      #${CONFIG.rootId} .cmfuh-toggle {
        min-width: 52px;
        min-height: 42px;
        padding: 0 12px;
        box-shadow: 0 8px 22px rgba(17, 24, 39, 0.2);
      }

      #${CONFIG.rootId} .cmfuh-secondary {
        min-height: 36px;
        padding: 0 10px;
        border: 1px solid #c7cdd1;
        border-radius: 4px;
        background: #fff;
        color: #1f2933;
        cursor: pointer;
        font-size: 14px;
      }

      #${CONFIG.rootId} .cmfuh-status {
        min-height: 38px;
        margin-top: 10px;
        padding: 8px;
        border-radius: 4px;
        background: #f5f7f8;
        border: 1px solid #d8dde1;
        font-size: 13px;
        line-height: 1.35;
      }

      #${CONFIG.rootId} .cmfuh-status[data-tone="ok"] {
        background: #eef8f1;
        border-color: #9fd5aa;
        color: #1f5f2e;
      }

      #${CONFIG.rootId} .cmfuh-status[data-tone="busy"] {
        background: #eef6fb;
        border-color: #9bc8e2;
        color: #164d6b;
      }

      #${CONFIG.rootId} .cmfuh-status[data-tone="error"] {
        background: #fff1f1;
        border-color: #e6a0a0;
        color: #8a1f1f;
      }

      #${CONFIG.rootId} .cmfuh-meta {
        margin-top: 8px;
        color: #536471;
        font-size: 12px;
        line-height: 1.35;
      }

      #${CONFIG.rootId}[data-open="false"] .cmfuh-card {
        display: none;
      }

      #${CONFIG.rootId}[data-open="true"] .cmfuh-toggle {
        display: none;
      }
    `;
    document.head.appendChild(style);
  };

  const createUi = () => {
    if (document.getElementById(CONFIG.rootId)) return;

    createStyles();

    const root = document.createElement("div");
    root.id = CONFIG.rootId;
    root.dataset.open = "false";

    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "cmfuh-toggle";
    toggle.textContent = t("toggle");
    toggle.title = t("title");

    const card = document.createElement("div");
    card.className = "cmfuh-card";

    const header = document.createElement("div");
    header.className = "cmfuh-header";
    const title = document.createElement("span");
    title.textContent = t("title");

    const headerActions = document.createElement("div");
    headerActions.className = "cmfuh-header-actions";

    const lang = document.createElement("button");
    lang.type = "button";
    lang.className = "cmfuh-lang";
    lang.textContent = t("lang");

    const close = document.createElement("button");
    close.type = "button";
    close.className = "cmfuh-close";
    close.textContent = "x";
    close.title = t("close");

    const body = document.createElement("div");
    body.className = "cmfuh-body";

    const actions = document.createElement("div");
    actions.className = "cmfuh-actions";

    const choose = document.createElement("button");
    choose.type = "button";
    choose.className = "cmfuh-primary";
    choose.textContent = t("choose");

    const refresh = document.createElement("button");
    refresh.type = "button";
    refresh.className = "cmfuh-secondary";
    refresh.textContent = t("check");
    refresh.title = t("checkTitle");

    const status = document.createElement("div");
    status.className = "cmfuh-status";
    status.dataset.tone = "busy";

    const meta = document.createElement("div");
    meta.className = "cmfuh-meta";
    meta.textContent = t("meta");

    const setStatus = (message, tone = "busy") => {
      status.textContent = message;
      status.dataset.tone = tone;
    };

    const refreshStatus = () => {
      const inputCount = getFileInputs().length;
      const emptyCount = getEmptyFileInputs().length;
      if (getCanvasUploadAvailable()) {
        setStatus(
          t("ready", { inputCount, emptyCount }),
          "ok"
        );
      } else {
        setStatus(t("waiting"), "busy");
      }
    };

    const renderTexts = () => {
      toggle.textContent = t("toggle");
      toggle.title = t("title");
      title.textContent = t("title");
      lang.textContent = t("lang");
      close.title = t("close");
      choose.textContent = t("choose");
      refresh.textContent = t("check");
      refresh.title = t("checkTitle");
      meta.textContent = t("meta");
      refreshStatus();
    };

    const runUpload = async () => {
      if (typeof DataTransfer === "undefined") {
        throw new Error(t("noDataTransfer"));
      }

      setStatus(t("chooseFromComputer"), "busy");
      const files = await pickFiles();
      if (files.length === 0) {
        setStatus(t("noFiles"), "busy");
        return;
      }

      choose.disabled = true;
      setStatus(t("selected", { count: files.length }), "busy");

      try {
        const result = await assignFilesSequentially(files, setStatus);
        setStatus(result.message, result.mode === "rows" ? "ok" : "busy");
      } finally {
        choose.disabled = false;
      }
    };

    toggle.addEventListener("click", () => {
      root.dataset.open = "true";
      refreshStatus();
    });
    close.addEventListener("click", () => {
      root.dataset.open = "false";
    });
    refresh.addEventListener("click", refreshStatus);
    lang.addEventListener("click", () => {
      currentLang = currentLang === "zh" ? "en" : "zh";
      window.localStorage.setItem(CONFIG.langStorageKey, currentLang);
      renderTexts();
    });
    choose.addEventListener("click", () => {
      runUpload().catch((error) => {
        choose.disabled = false;
        setStatus(error.message, "error");
        console.error("[Canvas multi-file upload]", error);
      });
    });

    actions.append(choose, refresh);
    body.append(actions, status, meta);
    headerActions.append(lang, close);
    header.append(title, headerActions);
    card.append(header, body);
    root.append(toggle, card);
    document.body.appendChild(root);
    refreshStatus();
  };

  const init = () => {
    if (!isCanvasAssignmentPage()) return;
    createUi();
  };

  init();

  let lastPath = window.location.pathname;
  window.setInterval(() => {
    if (window.location.pathname !== lastPath) {
      lastPath = window.location.pathname;
      init();
    }
  }, 1000);
})();
