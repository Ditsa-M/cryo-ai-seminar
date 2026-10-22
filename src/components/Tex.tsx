import katex from "katex";
import "katex/dist/katex.min.css";

export function Tex({ children, display }: { children: string; display?: boolean }) {
  const html = katex.renderToString(children, { displayMode: !!display, throwOnError: true, output: "html" });
  return <span dangerouslySetInnerHTML={{ __html: html }} />;
}
