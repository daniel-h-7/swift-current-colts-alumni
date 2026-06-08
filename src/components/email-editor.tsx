"use client";

import { useRef, useState } from "react";

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
  const [html, setHtml] = useState(defaultValue);

  function runCommand(command: string, value?: string) {
    editorRef.current?.focus();
    document.execCommand(command, false, value);
    setHtml(editorRef.current?.innerHTML ?? "");
  }

  function addLink() {
    const url = window.prompt("Paste the link URL");

    if (url) {
      runCommand("createLink", url);
    }
  }

  function addImage() {
    const url = window.prompt("Paste the image URL");

    if (url) {
      runCommand("insertImage", url);
    }
  }

  return (
    <div>
      <input name={name} type="hidden" value={html} />

      <div className="flex flex-wrap gap-2">
        <button
          className={buttonClass}
          onClick={() => runCommand("bold")}
          type="button"
        >
          B
        </button>
        <button
          className={buttonClass}
          onClick={() => runCommand("italic")}
          type="button"
        >
          I
        </button>
        <button
          className={buttonClass}
          onClick={() => runCommand("formatBlock", "h2")}
          type="button"
        >
          H2
        </button>
        <button
          className={buttonClass}
          onClick={() => runCommand("insertUnorderedList")}
          type="button"
        >
          List
        </button>
        <button className={buttonClass} onClick={addLink} type="button">
          Link
        </button>
        <button className={buttonClass} onClick={addImage} type="button">
          Image
        </button>
      </div>

      <div className="mt-4 rounded-3xl border border-white/10 bg-white p-4 text-slate-950">
        <div
          className="mx-auto min-h-96 max-w-[600px] rounded-2xl border border-slate-200 bg-white p-6 leading-7 outline-none"
          contentEditable
          dangerouslySetInnerHTML={{ __html: defaultValue }}
          onInput={() => setHtml(editorRef.current?.innerHTML ?? "")}
          ref={editorRef}
          suppressContentEditableWarning
        />
      </div>
    </div>
  );
}
