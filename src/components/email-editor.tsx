"use client";

import { ChangeEvent, MouseEvent, useRef, useState } from "react";

const buttonClass =
  "rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm font-black text-gray-200 hover:border-blue-500 hover:text-white";

const selectClass =
  "rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm font-bold text-gray-200 outline-none hover:border-blue-500 focus:border-blue-500";

const colorInputClass =
  "h-10 w-12 cursor-pointer rounded-xl border border-white/10 bg-white/[0.04] p-1";

export function EmailEditor({
  defaultValue,
  name,
}: {
  defaultValue: string;
  name: string;
}) {
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const savedRangeRef = useRef<Range | null>(null);
  const [html, setHtml] = useState(defaultValue);

  function syncHtml() {
    setHtml(editorRef.current?.innerHTML ?? "");
  }

  function keepEditorSelection(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
  }

  function getEditorRange() {
    const editor = editorRef.current;
    const selection = window.getSelection();

    if (!editor || !selection || !selection.rangeCount) {
      return null;
    }

    const range = selection.getRangeAt(0);

    if (!editor.contains(range.commonAncestorContainer)) {
      return null;
    }

    return range;
  }

  function saveEditorRange() {
    const range = getEditorRange();

    if (range) {
      savedRangeRef.current = range.cloneRange();
    }
  }

  function insertHtml(htmlToInsert: string) {
    editorRef.current?.focus();
    const range = getEditorRange() ?? savedRangeRef.current;

    if (!range) {
      editorRef.current?.insertAdjacentHTML("beforeend", htmlToInsert);
      syncHtml();
      return;
    }

    range.deleteContents();
    const wrapper = document.createElement("div");
    wrapper.innerHTML = htmlToInsert;
    const fragment = document.createDocumentFragment();
    let lastNode: ChildNode | null = null;

    while (wrapper.firstChild) {
      lastNode = fragment.appendChild(wrapper.firstChild);
    }

    range.insertNode(fragment);

    if (lastNode) {
      const selection = window.getSelection();
      const nextRange = document.createRange();
      nextRange.setStartAfter(lastNode);
      nextRange.collapse(true);
      selection?.removeAllRanges();
      selection?.addRange(nextRange);
    }

    syncHtml();
  }

  function getSelectedText() {
    const range = getEditorRange();

    return range?.toString().trim() ?? "";
  }

  function applyInlineStyle(style: string, fallbackText = "Styled text") {
    const selectedText = getSelectedText();
    const text = selectedText || fallbackText;

    insertHtml(`<span style="${style}">${text}</span>`);
  }

  function getSelectedListItems() {
    const range = getEditorRange();

    if (!range) {
      return [];
    }

    const fragment = range.cloneContents();
    const blockElements = Array.from(
      fragment.querySelectorAll("p, div, li, h1, h2, h3"),
    );
    const blockItems = blockElements
      .map((element) => element.textContent?.trim() ?? "")
      .filter(Boolean);

    if (blockItems.length > 1) {
      return blockItems;
    }

    return range
      .toString()
      .split(/\n+/)
      .flatMap((line) => line.split(/\s{2,}/))
      .map((item) => item.trim())
      .filter(Boolean);
  }

  function runCommand(command: string, value?: string) {
    editorRef.current?.focus();
    document.execCommand(command, false, value);
    syncHtml();
  }

  function addHeading(level: "large" | "sub") {
    const selectedText = getSelectedText();
    const text = selectedText || (level === "large" ? "Large header" : "Subheader");
    const tag = level === "large" ? "h1" : "h2";
    const style =
      level === "large"
        ? "margin:0 0 16px;font-size:34px;line-height:1.05;font-weight:900;color:#0f172a;"
        : "margin:0 0 14px;font-size:24px;line-height:1.2;font-weight:800;color:#1d4ed8;";

    insertHtml(`<${tag} style="${style}">${text}</${tag}><p><br></p>`);
  }

  function addList(type: "ul" | "ol") {
    const items = getSelectedListItems();
    const resolvedItems = items.length ? items : ["List item"];
    const listItems = resolvedItems.map((item) => `<li>${item}</li>`).join("");
    const style =
      type === "ul"
        ? "margin:0 0 16px 22px;padding:0;list-style-type:disc;"
        : "margin:0 0 16px 22px;padding:0;list-style-type:decimal;";

    insertHtml(`<${type} style="${style}">${listItems}</${type}><p><br></p>`);
  }

  function addLink() {
    const url = window.prompt("Paste the link URL");

    if (url) {
      const text = getSelectedText() || url;
      insertHtml(
        `<a href="${url}" style="color:#1d4ed8;font-weight:700;text-decoration:underline;">${text}</a>`,
      );
    }
  }

  function setAlignment(alignment: "left" | "center" | "right") {
    const selectedText = getSelectedText();
    const content = selectedText || "Aligned text";

    insertHtml(
      `<p style="margin:0 0 16px;text-align:${alignment};">${content}</p>`,
    );
  }

  function chooseImage() {
    saveEditorRange();
    fileInputRef.current?.click();
  }

  function getImageDimensions() {
    const widthValue = window.prompt(
      "Image width in pixels. Maximum recommended width is 600.",
      "560",
    );

    if (widthValue === null) {
      return null;
    }

    const width = Math.min(
      600,
      Math.max(40, Number.parseInt(widthValue, 10) || 560),
    );
    const heightValue = window.prompt(
      "Optional image height in pixels. Leave blank to keep proportions.",
      "",
    );
    const height = heightValue
      ? Math.max(20, Number.parseInt(heightValue, 10) || 0)
      : null;

    return { height, width };
  }

  function addImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result ?? "");

      if (!result) {
        return;
      }

      const dimensions = getImageDimensions();

      if (!dimensions) {
        event.target.value = "";
        return;
      }

      const heightStyle = dimensions.height
        ? `height:${dimensions.height}px;object-fit:cover;`
        : "height:auto;";

      insertHtml(
        `<img src="${result}" alt="" style="display:block;width:100%;max-width:${dimensions.width}px;${heightStyle}margin:18px auto;border-radius:12px;" />`,
      );
      event.target.value = "";
    };
    reader.readAsDataURL(file);
  }

  return (
    <div>
      <input name={name} type="hidden" value={html} />

      <div className="flex flex-wrap gap-2">
        <button
          className={buttonClass}
          onMouseDown={keepEditorSelection}
          onClick={() => runCommand("bold")}
          type="button"
        >
          <span className="font-black">B</span>
        </button>
        <button
          className={buttonClass}
          onMouseDown={keepEditorSelection}
          onClick={() => runCommand("italic")}
          type="button"
        >
          <span className="italic">I</span>
        </button>
        <button
          className={buttonClass}
          onMouseDown={keepEditorSelection}
          onClick={() => addHeading("large")}
          type="button"
        >
          Large Header
        </button>
        <button
          className={buttonClass}
          onMouseDown={keepEditorSelection}
          onClick={() => addHeading("sub")}
          type="button"
        >
          Subheader
        </button>
        <button
          className={buttonClass}
          onMouseDown={keepEditorSelection}
          onClick={() => addList("ul")}
          type="button"
        >
          • List
        </button>
        <button
          className={buttonClass}
          onMouseDown={keepEditorSelection}
          onClick={() => addList("ol")}
          type="button"
        >
          1. List
        </button>
        <button
          className={buttonClass}
          onMouseDown={keepEditorSelection}
          onClick={addLink}
          type="button"
        >
          Link
        </button>
        <button
          className={buttonClass}
          onMouseDown={keepEditorSelection}
          onClick={chooseImage}
          type="button"
        >
          Upload Image (max 600px)
        </button>
        <label className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm font-bold text-gray-200">
          Text
          <input
            className={colorInputClass}
            defaultValue="#0f172a"
            onChange={(event) =>
              applyInlineStyle(`color:${event.target.value};`)
            }
            onMouseDown={saveEditorRange}
            type="color"
          />
        </label>
        <label className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm font-bold text-gray-200">
          Highlight
          <input
            className={colorInputClass}
            defaultValue="#fef08a"
            onChange={(event) =>
              applyInlineStyle(`background-color:${event.target.value};`)
            }
            onMouseDown={saveEditorRange}
            type="color"
          />
        </label>
        <select
          className={selectClass}
          defaultValue=""
          onChange={(event) => {
            if (event.target.value) {
              applyInlineStyle(`font-family:${event.target.value};`);
              event.target.value = "";
            }
          }}
          onMouseDown={saveEditorRange}
        >
          <option value="">Font</option>
          <option value="Arial, Helvetica, sans-serif">Arial</option>
          <option value="Georgia, serif">Georgia</option>
          <option value="'Times New Roman', Times, serif">Times</option>
          <option value="'Courier New', Courier, monospace">Courier</option>
          <option value="Verdana, Geneva, sans-serif">Verdana</option>
        </select>
        <select
          className={selectClass}
          defaultValue=""
          onChange={(event) => {
            if (event.target.value) {
              applyInlineStyle(`font-size:${event.target.value}px;`);
              event.target.value = "";
            }
          }}
          onMouseDown={saveEditorRange}
        >
          <option value="">Size</option>
          {[12, 14, 16, 18, 20, 24, 28, 32, 36].map((size) => (
            <option key={size} value={size}>
              {size}px
            </option>
          ))}
        </select>
        <button
          className={buttonClass}
          onMouseDown={keepEditorSelection}
          onClick={() => setAlignment("left")}
          type="button"
        >
          Left
        </button>
        <button
          className={buttonClass}
          onMouseDown={keepEditorSelection}
          onClick={() => setAlignment("center")}
          type="button"
        >
          Center
        </button>
        <button
          className={buttonClass}
          onMouseDown={keepEditorSelection}
          onClick={() => setAlignment("right")}
          type="button"
        >
          Right
        </button>
        <input
          accept="image/*"
          className="hidden"
          onChange={addImage}
          ref={fileInputRef}
          type="file"
        />
      </div>

      <div className="mt-4 rounded-3xl border border-white/10 bg-white p-4 text-slate-950">
        <div
          className="mx-auto min-h-96 max-w-[600px] rounded-2xl border border-slate-200 bg-white p-6 leading-7 outline-none"
          contentEditable
          dangerouslySetInnerHTML={{ __html: defaultValue }}
          onBlur={saveEditorRange}
          onInput={syncHtml}
          onKeyUp={saveEditorRange}
          onMouseUp={saveEditorRange}
          ref={editorRef}
          suppressContentEditableWarning
        />
      </div>
    </div>
  );
}
