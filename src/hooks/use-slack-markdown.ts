import type { Node as MdNode } from "markdown-ast";
import parseMd from "markdown-ast";
import React from "react";

export const useSlackMarkdown = (markdown: string) => {
  const [ast, setAst] = React.useState<MdNode[]>([]);

  React.useEffect(() => {
    const nodes = parseMd(markdown);
    setAst(nodes);
  }, [markdown]);

  return ast;
};
