"use client";

import { ChangeEvent, MouseEvent, useRef, useState } from "react";

const buttonClass =
  "rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm font-black text-gray-200 hover:border-blue-500 hover:text-white";

export function EmailEditor({
  defaultValue,
  name,
}: {
  defaultValue: string;
  name: string;
}) {
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [html, setHtml] = useState(defaultValue);
  const [imageMaxWidth, setImageMaxWidth] = useState(560);

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

  function insertHtml(htmlToInsert: string) {
    editorRef.current?.focus();
    const range = getEditorRange();

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
    const selectedText = getSelectedText();
    const items = (selectedText ? selectedText.split(/\n+/) : ["List item"])
      .map((item) => item.trim())
      .filter(Boolean);
    const listItems = items.map((item) => `<li>${item}</li>`).join("");
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

  function chooseImage() {
    fileInputRef.current?.click();
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

      insertHtml(
        `<img src="${result}" alt="" style="display:block;width:100%;max-width:${imageMaxWidth}px;height:auto;margin:18px auto;border-radius:12px;" />`,
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
          B
        </button>
        <button
          className={buttonClass}
          onMouseDown={keepEditorSelection}
          onClick={() => runCommand("italic")}
          type="button"
        >
          I
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
          Bullet List
        </button>
        <button
          className={buttonClass}
          onMouseDown={keepEditorSelection}
          onClick={() => addList("ol")}
          type="button"
        >
          Numbered List
        </button>
        <button
          className={buttonClass}
          onMouseDown={keepEditorSelection}
          onClick={addLink}
          type="button"
        >
          Link
        </button>
        <label className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm font-bold text-gray-200">
          Image max width
          <input
            className="w-20 rounded-lg border border-white/10 bg-black/45 px-2 py-1 text-white outline-none focus:border-blue-500"
            max="600"
            min="120"
            onChange={(event) => setImageMaxWidth(Number(event.target.value))}
            type="number"
            value={imageMaxWidth}
          />
          px
        </label>
        <button
          className={buttonClass}
          onMouseDown={keepEditorSelection}
          onClick={chooseImage}
          type="button"
        >
          Upload Image
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
          onInput={syncHtml}
          ref={editorRef}
          suppressContentEditableWarning
        />
      </div>
    </div>
  );
}
