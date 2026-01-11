import type {
  SentenceStructureDiagramNode,
  SentenceStructureDiagramTree,
} from "@sentence-structure-diagram-app/sentence-structure-diagram-tree";

type WordPosition = {
  wordIndex: number;
  start: number;
  end: number;
  top: number;
  bottom: number;
};

export function extractWordPositions(
  treePosition: SentenceStructureDiagramTree,
): WordPosition[] {
  const wordPositions: WordPosition[] = [];

  function traverse(node: SentenceStructureDiagramNode): void {
    if (!("children" in node)) {
      wordPositions.push({
        wordIndex: node.word.index,
        start: node.position.start,
        end: node.position.end,
        top: node.position.top,
        bottom: node.position.bottom,
      });
      return;
    }
    for (const child of node.children) {
      traverse(child);
    }
  }

  traverse(treePosition);

  return wordPositions.sort((a, b) => a.wordIndex - b.wordIndex);
}

type SpanPosition = {
  start: number;
  end: number;
  top: number;
  bottom: number;
}[];

export function extractSpanPosition(
  wordPositions: WordPosition[],
  startWordIndex: number,
  endWordIndex: number,
): SpanPosition {
  const wordPositionsInRange = wordPositions.filter(
    (wordPosition) =>
      startWordIndex <= wordPosition.wordIndex &&
      wordPosition.wordIndex <= endWordIndex,
  );

  const rangePosition: SpanPosition = [];

  for (const wordPosition of wordPositionsInRange) {
    if (wordPosition.bottom === rangePosition.at(-1)?.bottom) {
      rangePosition.at(-1)!.end = wordPosition.end;
    } else {
      rangePosition.push({
        start: wordPosition.start,
        end: wordPosition.end,
        top: wordPosition.top,
        bottom: wordPosition.bottom,
      });
    }
  }

  return rangePosition;
}
