import {
  addCoordination,
  addModification,
  addSentenceStructureElement,
  allowedSentenceElementNameOptions,
  createSentenceStructureDocumentFromWords,
  type CoordinationPartType,
  type SentenceStructureDocument,
} from "@sv-marker/sentence-structure-document";
import type {
  StanzaDependencyLabel,
  StanzaParsedDocument,
  StanzaConstituencyNode,
  StanzaParsedSentence,
  StanzaParsedWord,
} from "./types.js";

function getConstituencyLeafNodes(
  constituencyNode: StanzaConstituencyNode,
): StanzaConstituencyNode[] {
  if (constituencyNode.children.length === 0) {
    return [constituencyNode];
  }
  return constituencyNode.children.flatMap((child) =>
    getConstituencyLeafNodes(child),
  );
}

function getCorrespondingConstituencyLeafNode(
  sentence: StanzaParsedSentence,
  dependencyWord: StanzaParsedWord,
): StanzaConstituencyNode {
  const dependencyWords = sentence.tokens.flatMap((token) => token.words);
  const constituencyLeafNodes = getConstituencyLeafNodes(sentence.constituency);
  const correspondingConstituencyLeafNode = constituencyLeafNodes.at(
    dependencyWords.indexOf(dependencyWord),
  );
  if (!correspondingConstituencyLeafNode) {
    throw new Error("Corresponding constituency leaf node not found");
  }
  return correspondingConstituencyLeafNode;
}

function getConstituencyParentNode(
  sentence: StanzaParsedSentence,
  constituencyNode: StanzaConstituencyNode,
): StanzaConstituencyNode | null {
  if (sentence.constituency === constituencyNode) {
    return null;
  }

  function findConstituencyParentNode(
    currentConstituencyNode: StanzaConstituencyNode,
  ): StanzaConstituencyNode | null {
    if (currentConstituencyNode.children.includes(constituencyNode)) {
      return currentConstituencyNode;
    }

    for (const constituencyChildNode of currentConstituencyNode.children) {
      const constituencyParentNode = findConstituencyParentNode(
        constituencyChildNode,
      );
      if (constituencyParentNode) {
        return constituencyParentNode;
      }
    }

    return null;
  }

  const constituencyParentNode = findConstituencyParentNode(
    sentence.constituency,
  );
  if (!constituencyParentNode) {
    throw new Error("Constituency parent node not found");
  }

  return constituencyParentNode;
}

function getConstituencyDirectChildNodeOnPathToLeafNode(
  constituencyNode: StanzaConstituencyNode,
  targetLeafNode: StanzaConstituencyNode,
): StanzaConstituencyNode {
  const constituencyDirectChildNodeOnPathToLeafNode =
    constituencyNode.children.find((childNode) =>
      getConstituencyLeafNodes(childNode).includes(targetLeafNode),
    );
  if (!constituencyDirectChildNodeOnPathToLeafNode) {
    throw new Error(
      "Constituency direct child node on path to leaf node not found",
    );
  }

  return constituencyDirectChildNodeOnPathToLeafNode;
}

function getConstituencyNodeSpan(
  sentence: StanzaParsedSentence,
  constituencyNode: StanzaConstituencyNode,
): { startWordIndex: number; endWordIndex: number } {
  const sentenceLeafNodes = getConstituencyLeafNodes(sentence.constituency);
  const subtreeLeafNodes = getConstituencyLeafNodes(constituencyNode);

  const subtreeStartLeafNode = subtreeLeafNodes.at(0);
  const subtreeEndLeafNode = subtreeLeafNodes.at(-1);
  if (!subtreeStartLeafNode || !subtreeEndLeafNode) {
    throw new Error("Constituency node has no leaf nodes");
  }

  const startWordIndex = sentenceLeafNodes.indexOf(subtreeStartLeafNode);
  const endWordIndex = sentenceLeafNodes.indexOf(subtreeEndLeafNode);
  if (startWordIndex === -1 || endWordIndex === -1) {
    throw new Error("Constituency node is not in the tree");
  }

  return { startWordIndex, endWordIndex };
}

function isCoordinationNode(
  sentence: StanzaParsedSentence,
  constituencyNode: StanzaConstituencyNode,
): boolean {
  const dependencyWords = sentence.tokens.flatMap((token) => token.words);
  const childNodeSpans = constituencyNode.children.map((childNode) =>
    getConstituencyNodeSpan(sentence, childNode),
  );
  return dependencyWords.some((dependentWord, dependentWordIndex) => {
    if (dependentWord.deprel !== "conj") {
      return false;
    }

    const dependencyHeadWordIndex = dependencyWords.findIndex(
      (candidateDependencyWord) =>
        candidateDependencyWord.id === dependentWord.head,
    );
    if (dependencyHeadWordIndex === -1) {
      throw new Error("Dependency head word not found");
    }

    const dependentWordChildNodeSpan = childNodeSpans.find(
      ({ startWordIndex, endWordIndex }) =>
        startWordIndex <= dependentWordIndex &&
        dependentWordIndex <= endWordIndex,
    );
    const dependencyHeadWordChildNodeSpan = childNodeSpans.find(
      ({ startWordIndex, endWordIndex }) =>
        startWordIndex <= dependencyHeadWordIndex &&
        dependencyHeadWordIndex <= endWordIndex,
    );
    if (!dependentWordChildNodeSpan || !dependencyHeadWordChildNodeSpan) {
      return false;
    }

    return dependentWordChildNodeSpan !== dependencyHeadWordChildNodeSpan;
  });
}

function getCoreNominalSpan(
  sentence: StanzaParsedSentence,
  dependencyHeadWord: StanzaParsedWord,
): { startWordIndex: number; endWordIndex: number } | null {
  try {
    const correspondingConstituencyHeadLeafNode =
      getCorrespondingConstituencyLeafNode(sentence, dependencyHeadWord);

    function ascendToCandidateCoreNominalNode(
      constituencyNode: StanzaConstituencyNode,
    ): StanzaConstituencyNode {
      if (
        constituencyNode.label === "NP" ||
        constituencyNode.label === "WHNP"
      ) {
        return constituencyNode;
      }

      const constituencyParentNode = getConstituencyParentNode(
        sentence,
        constituencyNode,
      );
      if (!constituencyParentNode) {
        throw new Error("Candidate core nominal node not found");
      }

      return ascendToCandidateCoreNominalNode(constituencyParentNode);
    }

    function descendToCoreNominalNode(
      constituencyNode: StanzaConstituencyNode,
    ): StanzaConstituencyNode {
      if (isCoordinationNode(sentence, constituencyNode)) {
        return descendToCoreNominalNode(
          getConstituencyDirectChildNodeOnPathToLeafNode(
            constituencyNode,
            correspondingConstituencyHeadLeafNode,
          ),
        );
      }

      return constituencyNode;
    }

    const candidateCoreNominalNode = ascendToCandidateCoreNominalNode(
      correspondingConstituencyHeadLeafNode,
    );
    const coreNominalNode = descendToCoreNominalNode(candidateCoreNominalNode);
    const coreNominalSpan = getConstituencyNodeSpan(sentence, coreNominalNode);

    const dependencyWords = sentence.tokens.flatMap((token) => token.words);
    const predicateConstituents = getPredicateConstituents(sentence);
    const coreNominalEndWordIndex = (() => {
      const adnominalClauseHeadWords = dependencyWords.filter(
        (dependencyWord) =>
          dependencyWord.head === dependencyHeadWord.id &&
          (dependencyWord.deprel === "acl" ||
            dependencyWord.deprel === "acl:relcl"),
      );
      const firstAdnominalClauseStartWordIndex =
        adnominalClauseHeadWords.length === 0
          ? null
          : Math.min(
              ...adnominalClauseHeadWords.map((adnominalClauseHeadWord) => {
                const adnominalClauseHeadWordIndex = dependencyWords.indexOf(
                  adnominalClauseHeadWord,
                );
                if (adnominalClauseHeadWordIndex === -1) {
                  throw new Error("Adnominal clause head word not found");
                }

                const adnominalClausePredicateConstituent =
                  predicateConstituents.find(
                    (predicateConstituent) =>
                      predicateConstituent.predicateHeadWord.id ===
                      adnominalClauseHeadWord.id,
                  ) ?? null;
                return (
                  adnominalClausePredicateConstituent?.span.startWordIndex ??
                  adnominalClauseHeadWordIndex
                );
              }),
            );
      if (
        firstAdnominalClauseStartWordIndex === null ||
        coreNominalSpan.endWordIndex < firstAdnominalClauseStartWordIndex
      ) {
        return coreNominalSpan.endWordIndex;
      }

      let endWordIndex = firstAdnominalClauseStartWordIndex - 1;
      while (
        coreNominalSpan.startWordIndex < endWordIndex &&
        dependencyWords.at(endWordIndex)?.upos === "PUNCT"
      ) {
        endWordIndex--;
      }
      return endWordIndex;
    })();

    return {
      startWordIndex: coreNominalSpan.startWordIndex,
      endWordIndex: coreNominalEndWordIndex,
    };
  } catch (error) {
    console.error(error);
    return null;
  }
}

function getCoreVerbComplexSpan(
  sentence: StanzaParsedSentence,
  predicateCarrierWord: StanzaParsedWord,
): { startWordIndex: number; endWordIndex: number } | null {
  try {
    const dependencyWords = sentence.tokens.flatMap((token) => token.words);
    const coreVerbComplexWords = (() => {
      if (predicateCarrierWord.deprel === "cop") {
        const copHeadWord = dependencyWords.find(
          (dependencyWord) => dependencyWord.id === predicateCarrierWord.head,
        );
        if (!copHeadWord) {
          throw new Error("Cop head word not found");
        }

        const predicateCarrierWordIndex =
          dependencyWords.indexOf(predicateCarrierWord);
        if (predicateCarrierWordIndex === -1) {
          throw new Error("Predicate carrier word not found");
        }

        const previousCopDependentWordIndex = dependencyWords.findLastIndex(
          (dependencyWord, dependencyWordIndex) =>
            dependencyWord.deprel === "cop" &&
            dependencyWord.head === copHeadWord.id &&
            dependencyWordIndex < predicateCarrierWordIndex,
        );

        return dependencyWords
          .slice(
            previousCopDependentWordIndex + 1,
            predicateCarrierWordIndex + 1,
          )
          .filter(
            (dependencyWord) =>
              dependencyWord.id === predicateCarrierWord.id ||
              (dependencyWord.head === copHeadWord.id &&
                (dependencyWord.deprel === "aux" ||
                  dependencyWord.deprel === "aux:pass")),
          );
      }
      return dependencyWords.filter(
        (dependencyWord) =>
          dependencyWord.id === predicateCarrierWord.id ||
          (dependencyWord.head === predicateCarrierWord.id &&
            (dependencyWord.deprel === "aux" ||
              dependencyWord.deprel === "aux:pass")),
      );
    })();

    if (coreVerbComplexWords.length === 0) {
      throw new Error("Core verb complex words not found");
    }

    return {
      startWordIndex: dependencyWords.indexOf(coreVerbComplexWords.at(0)!),
      endWordIndex: dependencyWords.indexOf(coreVerbComplexWords.at(-1)!),
    };
  } catch (error) {
    console.error(error);
    return null;
  }
}

function getCoreAdjectivalSpan(
  sentence: StanzaParsedSentence,
  dependencyHeadWord: StanzaParsedWord,
): { startWordIndex: number; endWordIndex: number } | null {
  const correspondingConstituencyHeadLeafNode =
    getCorrespondingConstituencyLeafNode(sentence, dependencyHeadWord);

  function ascendToCoreAdjectivalNode(
    constituencyNode: StanzaConstituencyNode,
  ): StanzaConstituencyNode | null {
    if (constituencyNode.label === "WHADJP") {
      return constituencyNode;
    }

    const constituencyParentNode = getConstituencyParentNode(
      sentence,
      constituencyNode,
    );
    if (!constituencyParentNode) {
      return null;
    }

    return ascendToCoreAdjectivalNode(constituencyParentNode);
  }

  const coreAdjectivalNode = ascendToCoreAdjectivalNode(
    correspondingConstituencyHeadLeafNode,
  );

  if (coreAdjectivalNode) {
    return getConstituencyNodeSpan(sentence, coreAdjectivalNode);
  }

  const dependencyWords = sentence.tokens.flatMap((token) => token.words);
  const dependencyHeadWordIndex = dependencyWords.findIndex(
    (dependencyWord) => dependencyWord.id === dependencyHeadWord.id,
  );
  if (dependencyHeadWordIndex === -1) {
    throw new Error("Dependency head word not found");
  }
  return {
    startWordIndex: dependencyHeadWordIndex,
    endWordIndex: dependencyHeadWordIndex,
  };
}

function getVerbalPhraseSpan(
  sentence: StanzaParsedSentence,
  dependencyHeadWord: StanzaParsedWord,
): { startWordIndex: number; endWordIndex: number } | null {
  try {
    const correspondingConstituencyHeadLeafNode =
      getCorrespondingConstituencyLeafNode(sentence, dependencyHeadWord);

    function ascendToCandidateVerbalPhraseNode(
      constituencyNode: StanzaConstituencyNode,
    ): StanzaConstituencyNode {
      const constituencyParentNode = getConstituencyParentNode(
        sentence,
        constituencyNode,
      );

      if (constituencyNode.label === "S") {
        if (
          constituencyParentNode?.label === "SBAR" ||
          constituencyParentNode?.label === "PP"
        ) {
          return constituencyParentNode;
        }
        return constituencyNode;
      }

      if (
        constituencyNode.label === "VP" &&
        constituencyParentNode?.label === "NP"
      ) {
        return constituencyNode;
      }

      if (constituencyNode.label === "NP") {
        return constituencyNode;
      }

      if (!constituencyParentNode) {
        throw new Error("Candidate verbal phrase node not found");
      }

      return ascendToCandidateVerbalPhraseNode(constituencyParentNode);
    }

    function descendToVerbalPhraseNode(
      constituencyNode: StanzaConstituencyNode,
    ): StanzaConstituencyNode {
      if (isCoordinationNode(sentence, constituencyNode)) {
        return descendToVerbalPhraseNode(
          getConstituencyDirectChildNodeOnPathToLeafNode(
            constituencyNode,
            correspondingConstituencyHeadLeafNode,
          ),
        );
      }

      if (constituencyNode.children.length === 1) {
        return descendToVerbalPhraseNode(constituencyNode.children.at(0)!);
      }

      return constituencyNode;
    }

    const candidateVerbalPhraseNode = ascendToCandidateVerbalPhraseNode(
      correspondingConstituencyHeadLeafNode,
    );
    const verbalPhraseNode = descendToVerbalPhraseNode(
      candidateVerbalPhraseNode,
    );
    return getConstituencyNodeSpan(sentence, verbalPhraseNode);
  } catch (error) {
    console.error(error);
    return null;
  }
}

function getClauseSpan(
  sentence: StanzaParsedSentence,
  dependencyHeadWord: StanzaParsedWord,
): { startWordIndex: number; endWordIndex: number } | null {
  try {
    const correspondingConstituencyHeadLeafNode =
      getCorrespondingConstituencyLeafNode(sentence, dependencyHeadWord);

    function ascendToClauseNode(
      constituencyNode: StanzaConstituencyNode,
    ): StanzaConstituencyNode {
      const constituencyParentNode = getConstituencyParentNode(
        sentence,
        constituencyNode,
      );
      if (!constituencyParentNode) {
        throw new Error("Clause node not found");
      }

      if (
        constituencyNode.label === "S" ||
        constituencyNode.label === "SQ" ||
        constituencyNode.label === "SINV"
      ) {
        if (
          (constituencyParentNode.label === "S" ||
            constituencyParentNode.label === "SQ" ||
            constituencyParentNode.label === "SINV") &&
          isCoordinationNode(sentence, constituencyParentNode)
        ) {
          return ascendToClauseNode(constituencyParentNode);
        }
        if (
          constituencyParentNode.label === "SBAR" ||
          constituencyParentNode.label === "SBARQ"
        ) {
          return constituencyParentNode;
        }
        return constituencyNode;
      }

      return ascendToClauseNode(constituencyParentNode);
    }

    const clauseNode = ascendToClauseNode(
      correspondingConstituencyHeadLeafNode,
    );
    return getConstituencyNodeSpan(sentence, clauseNode);
  } catch (error) {
    console.error(error);
    return null;
  }
}

function getModifierPhraseSpan(
  sentence: StanzaParsedSentence,
  dependencyHeadWord: StanzaParsedWord,
): { startWordIndex: number; endWordIndex: number } | null {
  try {
    const dependencyWords = sentence.tokens.flatMap((token) => token.words);
    const correspondingConstituencyHeadLeafNode =
      getCorrespondingConstituencyLeafNode(sentence, dependencyHeadWord);

    function ascendToModifierPhraseNode(
      constituencyNode: StanzaConstituencyNode,
    ): StanzaConstituencyNode {
      const constituencyNodeSpan = getConstituencyNodeSpan(
        sentence,
        constituencyNode,
      );
      const hasCrossingFixedDependency = dependencyWords.some(
        (dependentWord, dependentWordIndex) => {
          if (dependentWord.head === 0 || dependentWord.deprel !== "fixed") {
            return false;
          }

          const dependencyHeadWordIndex = dependencyWords.findIndex(
            (dependencyWord) => dependencyWord.id === dependentWord.head,
          );
          if (dependencyHeadWordIndex === -1) {
            throw new Error("Dependency head word not found");
          }

          const isDependentWordInsideConstituencyNodeSpan =
            constituencyNodeSpan.startWordIndex <= dependentWordIndex &&
            dependentWordIndex <= constituencyNodeSpan.endWordIndex;
          const isHeadwordInsideConstituencyNodeSpan =
            constituencyNodeSpan.startWordIndex <= dependencyHeadWordIndex &&
            dependencyHeadWordIndex <= constituencyNodeSpan.endWordIndex;

          return (
            isDependentWordInsideConstituencyNodeSpan !==
            isHeadwordInsideConstituencyNodeSpan
          );
        },
      );

      if (
        (constituencyNode.label === "PP" ||
          constituencyNode.label === "ADVP" ||
          constituencyNode.label === "PRT" ||
          constituencyNode.label === "WHPP" ||
          constituencyNode.label === "WHADVP") &&
        !hasCrossingFixedDependency
      ) {
        return constituencyNode;
      }

      const constituencyParentNode = getConstituencyParentNode(
        sentence,
        constituencyNode,
      );
      if (!constituencyParentNode) {
        throw new Error("Modifier phrase node not found");
      }

      return ascendToModifierPhraseNode(constituencyParentNode);
    }

    const modifierPhraseNode = ascendToModifierPhraseNode(
      correspondingConstituencyHeadLeafNode,
    );
    return getConstituencyNodeSpan(sentence, modifierPhraseNode);
  } catch (error) {
    console.error(error);
    return null;
  }
}

function getResolvedDependencyLabel(
  sentence: StanzaParsedSentence,
  dependentWord: StanzaParsedWord,
): Exclude<StanzaDependencyLabel, "conj"> {
  const dependencyWords = sentence.tokens.flatMap((token) => token.words);

  if (dependentWord.deprel === "conj") {
    const dependencyHeadWord = dependencyWords.find(
      (dependencyWord) => dependencyWord.id === dependentWord.head,
    );
    if (!dependencyHeadWord) {
      throw new Error("Dependency head word not found");
    }
    return getResolvedDependencyLabel(sentence, dependencyHeadWord);
  }

  return dependentWord.deprel;
}

function getResolvedDependencyHeadWord(
  sentence: StanzaParsedSentence,
  dependentWord: StanzaParsedWord,
): StanzaParsedWord | null {
  const dependencyWords = sentence.tokens.flatMap((token) => token.words);

  if (dependentWord.head === 0) {
    return null;
  }

  const dependencyHeadWord = dependencyWords.find(
    (dependencyWord) => dependencyWord.id === dependentWord.head,
  );
  if (!dependencyHeadWord) {
    throw new Error("Dependency head word not found");
  }

  if (dependentWord.deprel === "conj") {
    return getResolvedDependencyHeadWord(sentence, dependencyHeadWord);
  }

  return dependencyHeadWord;
}

function getDependencySpanConnectorWord(
  sentence: StanzaParsedSentence,
  span: { startWordIndex: number; endWordIndex: number },
): StanzaParsedWord | null {
  const dependencyWords = sentence.tokens.flatMap((token) => token.words);
  const connectorWords = dependencyWords.filter(
    (dependencyWord, dependencyWordIndex) => {
      if (dependencyWord.head === 0) {
        return false;
      }

      const dependencyHeadWordIndex = dependencyWords.findIndex(
        (candidateDependencyWord) =>
          candidateDependencyWord.id === dependencyWord.head,
      );
      if (dependencyHeadWordIndex === -1) {
        throw new Error("Dependency head word not found");
      }

      return (
        span.startWordIndex <= dependencyWordIndex &&
        dependencyWordIndex <= span.endWordIndex &&
        (dependencyHeadWordIndex < span.startWordIndex ||
          span.endWordIndex < dependencyHeadWordIndex)
      );
    },
  );

  if (connectorWords.length !== 1) {
    return null;
  }

  return connectorWords.at(0)!;
}

function getPredicateFiniteness(
  sentence: StanzaParsedSentence,
  predicateCarrierWord: StanzaParsedWord,
): "non-finite" | "finite" | null {
  const dependencyWords = sentence.tokens.flatMap((token) => token.words);

  const coreVerbComplexWords = (() => {
    const coreVerbComplexSpan = getCoreVerbComplexSpan(
      sentence,
      predicateCarrierWord,
    );
    if (!coreVerbComplexSpan) {
      return [];
    }
    return dependencyWords.slice(
      coreVerbComplexSpan.startWordIndex,
      coreVerbComplexSpan.endWordIndex + 1,
    );
  })();
  if (coreVerbComplexWords.length === 0) {
    return null;
  }

  if (
    coreVerbComplexWords.every(
      (coreVerbComplexWord) =>
        !coreVerbComplexWord.feats?.includes("VerbForm=Fin"),
    ) &&
    coreVerbComplexWords.some(
      (coreVerbComplexWord) =>
        coreVerbComplexWord.feats?.includes("VerbForm=Inf") ||
        coreVerbComplexWord.feats?.includes("VerbForm=Part") ||
        coreVerbComplexWord.feats?.includes("VerbForm=Ger"),
    )
  ) {
    return "non-finite";
  }

  if (
    coreVerbComplexWords.some((coreVerbComplexWord) =>
      coreVerbComplexWord.feats?.includes("VerbForm=Fin"),
    )
  ) {
    return "finite";
  }

  return null;
}

type PredicateConstituent = {
  type: "verbal-phrase" | "clause";
  predicateHeadWord: StanzaParsedWord;
  predicateCarrierWord: StanzaParsedWord;
  connectorWord: StanzaParsedWord | null;
  span: { startWordIndex: number; endWordIndex: number };
};

function getPredicateConstituents(
  sentence: StanzaParsedSentence,
): PredicateConstituent[] {
  const dependencyWords = sentence.tokens.flatMap((token) => token.words);

  function isPredicateCarrierWord(dependencyWord: StanzaParsedWord): boolean {
    return (
      dependencyWord.deprel === "cop" ||
      ((dependencyWord.upos === "VERB" || dependencyWord.upos === "AUX") &&
        dependencyWord.deprel !== "aux" &&
        dependencyWord.deprel !== "aux:pass")
    );
  }

  return dependencyWords.flatMap((predicateCarrierWord) => {
    if (!isPredicateCarrierWord(predicateCarrierWord)) {
      return [];
    }

    const predicateHeadWord =
      predicateCarrierWord.deprel === "cop"
        ? (dependencyWords.find(
            (dependencyWord) => dependencyWord.id === predicateCarrierWord.head,
          ) ?? null)
        : predicateCarrierWord;
    if (!predicateHeadWord) {
      throw new Error("Predicate head word not found");
    }

    const predicateConstituent = (() => {
      const predicateFiniteness = getPredicateFiniteness(
        sentence,
        predicateCarrierWord,
      );
      switch (predicateFiniteness) {
        case "non-finite": {
          const verbalPhraseSpan = getVerbalPhraseSpan(
            sentence,
            predicateCarrierWord,
          );
          if (!verbalPhraseSpan) {
            return null;
          }
          return {
            type: "verbal-phrase" as const,
            predicateHeadWord,
            predicateCarrierWord,
            connectorWord: getDependencySpanConnectorWord(
              sentence,
              verbalPhraseSpan,
            ),
            span: verbalPhraseSpan,
          };
        }
        case "finite": {
          const clauseSpan = getClauseSpan(sentence, predicateCarrierWord);
          if (!clauseSpan) {
            return null;
          }
          return {
            type: "clause" as const,
            predicateHeadWord,
            predicateCarrierWord,
            connectorWord: getDependencySpanConnectorWord(sentence, clauseSpan),
            span: clauseSpan,
          };
        }
        case null: {
          return null;
        }
        default: {
          predicateFiniteness satisfies never;
          throw new Error("Unreachable");
        }
      }
    })();
    if (!predicateConstituent) {
      return [];
    }

    return [predicateConstituent];
  });
}

function getSentenceStructureElements(sentence: StanzaParsedSentence): (
  | {
      kind: "core-sentence-element";
      sentenceElementName: (typeof allowedSentenceElementNameOptions)["core-sentence-element"][number];
      span: { startWordIndex: number; endWordIndex: number };
    }
  | {
      kind: "sentence-constituent";
      type: "verbal-phrase";
      usage: "nominal";
      sentenceElementName: (typeof allowedSentenceElementNameOptions)["sentence-constituent"]["verbal-phrase"]["nominal"][number];
      span: { startWordIndex: number; endWordIndex: number };
    }
  | {
      kind: "sentence-constituent";
      type: "verbal-phrase";
      usage: "adjectival";
      sentenceElementName: null;
      span: { startWordIndex: number; endWordIndex: number };
    }
  | {
      kind: "sentence-constituent";
      type: "verbal-phrase";
      usage: "adverbial";
      sentenceElementName: null;
      span: { startWordIndex: number; endWordIndex: number };
    }
  | {
      kind: "sentence-constituent";
      type: "clause";
      usage: "nominal";
      sentenceElementName: (typeof allowedSentenceElementNameOptions)["sentence-constituent"]["clause"]["nominal"][number];
      span: { startWordIndex: number; endWordIndex: number };
    }
  | {
      kind: "sentence-constituent";
      type: "clause";
      usage: "adjectival";
      sentenceElementName: null;
      span: { startWordIndex: number; endWordIndex: number };
    }
  | {
      kind: "sentence-constituent";
      type: "clause";
      usage: "adverbial";
      sentenceElementName: null;
      span: { startWordIndex: number; endWordIndex: number };
    }
  | {
      kind: "sentence-constituent";
      type: "modifier-phrase";
      sentenceElementName: null;
      span: { startWordIndex: number; endWordIndex: number };
    }
)[] {
  const dependencyWords = sentence.tokens.flatMap((token) => token.words);
  const predicateConstituents = getPredicateConstituents(sentence);

  const sentenceStructureElements: ReturnType<
    typeof getSentenceStructureElements
  > = [];

  for (const dependencyWord of dependencyWords) {
    const resolvedDependencyLabel = getResolvedDependencyLabel(
      sentence,
      dependencyWord,
    );

    if (
      (dependencyWord.upos === "VERB" || dependencyWord.upos === "AUX") &&
      resolvedDependencyLabel === "root"
    ) {
      const coreVerbComplexSpan = getCoreVerbComplexSpan(
        sentence,
        dependencyWord,
      );
      if (coreVerbComplexSpan) {
        sentenceStructureElements.push({
          kind: "core-sentence-element",
          sentenceElementName: "V",
          span: coreVerbComplexSpan,
        });
      } else {
        console.error("Core verb complex span not found");
      }
    }

    switch (resolvedDependencyLabel) {
      case "cop": {
        const currentCopulaWord = dependencyWord;
        const currentCopulaWordIndex = dependencyWords.findIndex(
          (candidateDependencyWord) =>
            candidateDependencyWord.id === currentCopulaWord.id,
        );
        if (currentCopulaWordIndex === -1) {
          throw new Error("Current copula word not found");
        }
        const copHeadWord = dependencyWords.find(
          (candidateDependencyWord) =>
            candidateDependencyWord.id === currentCopulaWord.head,
        );
        if (!copHeadWord) {
          throw new Error("Dependency head word not found");
        }
        const copulaWordsForCopHead = dependencyWords.filter(
          (candidateDependencyWord) =>
            candidateDependencyWord.head === copHeadWord.id &&
            candidateDependencyWord.deprel === "cop",
        );

        if (getResolvedDependencyLabel(sentence, copHeadWord) === "root") {
          const coreVerbComplexSpan = getCoreVerbComplexSpan(
            sentence,
            currentCopulaWord,
          );
          if (coreVerbComplexSpan) {
            sentenceStructureElements.push({
              kind: "core-sentence-element",
              sentenceElementName: "V",
              span: coreVerbComplexSpan,
            });
          } else {
            console.error("Core verb complex span not found");
          }
        }

        const copComplementHeadWords =
          currentCopulaWord.id === copulaWordsForCopHead.at(-1)!.id
            ? dependencyWords.filter((candidateDependencyWord) => {
                if (candidateDependencyWord.id === copHeadWord.id) {
                  return true;
                }

                if (
                  candidateDependencyWord.head !== copHeadWord.id ||
                  candidateDependencyWord.deprel !== "conj"
                ) {
                  return false;
                }

                if (
                  (candidateDependencyWord.upos === "VERB" ||
                    candidateDependencyWord.upos === "AUX") &&
                  getPredicateFiniteness(sentence, candidateDependencyWord) ===
                    "finite"
                ) {
                  return false;
                }

                const followingCopulaWord =
                  dependencyWords.find(
                    (otherCandidateDependencyWord) =>
                      otherCandidateDependencyWord.head ===
                        candidateDependencyWord.id &&
                      otherCandidateDependencyWord.deprel === "cop",
                  ) ?? null;

                if (
                  followingCopulaWord &&
                  getPredicateFiniteness(sentence, followingCopulaWord) ===
                    "finite"
                ) {
                  return false;
                }

                return true;
              })
            : [copHeadWord];
        for (const copComplementHeadWord of copComplementHeadWords) {
          const followingCopulaWord =
            dependencyWords.find(
              (candidateDependencyWord, candidateDependencyWordIndex) =>
                candidateDependencyWord.head === copComplementHeadWord.id &&
                candidateDependencyWord.deprel === "cop" &&
                currentCopulaWordIndex < candidateDependencyWordIndex,
            ) ?? null;
          if (followingCopulaWord) {
            const followingCopPredicateConstituent =
              predicateConstituents.find(
                (predicateConstituent) =>
                  predicateConstituent.predicateCarrierWord.id ===
                  followingCopulaWord.id,
              ) ?? null;
            if (!followingCopPredicateConstituent) {
              console.error("Predicate constituent type not found");
              continue;
            }

            sentenceStructureElements.push({
              kind: "sentence-constituent",
              type: followingCopPredicateConstituent.type,
              usage: "nominal",
              sentenceElementName: "C",
              span: followingCopPredicateConstituent.span,
            });

            const coreVerbComplexSpan = getCoreVerbComplexSpan(
              sentence,
              followingCopPredicateConstituent.predicateCarrierWord,
            );
            if (!coreVerbComplexSpan) {
              console.error("Core verb complex span not found");
              continue;
            }
            sentenceStructureElements.push({
              kind: "core-sentence-element",
              sentenceElementName: "V",
              span: coreVerbComplexSpan,
            });
            continue;
          }

          switch (copComplementHeadWord.upos) {
            case "ADJ": {
              const coreAdjectivalSpan = getCoreAdjectivalSpan(
                sentence,
                copComplementHeadWord,
              );
              if (!coreAdjectivalSpan) {
                console.error("Core adjectival span not found");
                break;
              }
              sentenceStructureElements.push({
                kind: "core-sentence-element",
                sentenceElementName: "C",
                span: coreAdjectivalSpan,
              });
              break;
            }
            case "NOUN":
            case "PROPN":
            case "PRON":
            case "NUM":
            case "SYM":
            case "INTJ":
            case "X": {
              if (
                dependencyWords.some(
                  (dependentWord) =>
                    dependentWord.head === copComplementHeadWord.id &&
                    dependentWord.deprel === "case",
                )
              ) {
                const modifierPhraseSpan = getModifierPhraseSpan(
                  sentence,
                  copComplementHeadWord,
                );
                if (!modifierPhraseSpan) {
                  console.error("Modifier phrase span not found");
                  break;
                }
                sentenceStructureElements.push({
                  kind: "sentence-constituent",
                  type: "modifier-phrase",
                  sentenceElementName: null,
                  span: modifierPhraseSpan,
                });
                break;
              }

              const coreNominalSpan = getCoreNominalSpan(
                sentence,
                copComplementHeadWord,
              );
              if (!coreNominalSpan) {
                console.error("Core nominal span not found");
                break;
              }
              sentenceStructureElements.push({
                kind: "core-sentence-element",
                sentenceElementName: "C",
                span: coreNominalSpan,
              });
              break;
            }
            case "ADV":
            case "ADP": {
              const modifierPhraseSpan = getModifierPhraseSpan(
                sentence,
                copComplementHeadWord,
              );
              if (!modifierPhraseSpan) {
                console.error("Modifier phrase span not found");
                break;
              }
              sentenceStructureElements.push({
                kind: "sentence-constituent",
                type: "modifier-phrase",
                sentenceElementName: null,
                span: modifierPhraseSpan,
              });
              break;
            }
            case "VERB": {
              const copComplementHeadWordPredicateConstituent =
                predicateConstituents.find(
                  (predicateConstituent) =>
                    predicateConstituent.predicateCarrierWord.id ===
                    copComplementHeadWord.id,
                ) ?? null;
              if (!copComplementHeadWordPredicateConstituent) {
                console.error("Predicate constituent type not found");
                break;
              }

              sentenceStructureElements.push({
                kind: "sentence-constituent",
                type: copComplementHeadWordPredicateConstituent.type,
                usage: "nominal",
                sentenceElementName: "C",
                span: copComplementHeadWordPredicateConstituent.span,
              });

              const coreVerbComplexSpan = getCoreVerbComplexSpan(
                sentence,
                copComplementHeadWordPredicateConstituent.predicateCarrierWord,
              );
              if (!coreVerbComplexSpan) {
                console.error("Core verb complex span not found");
                break;
              }
              sentenceStructureElements.push({
                kind: "core-sentence-element",
                sentenceElementName: "V",
                span: coreVerbComplexSpan,
              });
              break;
            }
            case "AUX":
            case "CCONJ":
            case "DET":
            case "PART":
            case "PUNCT":
            case "SCONJ": {
              console.error("Unexpected cop head UPOS");
              break;
            }
            default: {
              copComplementHeadWord.upos satisfies never;
              throw new Error("Unreachable");
            }
          }
        }
        break;
      }
      case "nsubj":
      case "nsubj:pass":
      case "nsubj:outer": {
        const predicateConstituentForDependencyWord =
          dependencyWord.xpos === "WP" || dependencyWord.xpos === "WRB"
            ? (predicateConstituents.find(
                (predicateConstituent) =>
                  predicateConstituent.connectorWord?.id === dependencyWord.id,
              ) ?? null)
            : null;

        if (predicateConstituentForDependencyWord) {
          sentenceStructureElements.push({
            kind: "sentence-constituent",
            type: predicateConstituentForDependencyWord.type,
            usage: "nominal",
            sentenceElementName: "S",
            span: predicateConstituentForDependencyWord.span,
          });

          const coreVerbComplexSpan = getCoreVerbComplexSpan(
            sentence,
            predicateConstituentForDependencyWord.predicateCarrierWord,
          );
          if (!coreVerbComplexSpan) {
            console.error("Core verb complex span not found");
            break;
          }
          sentenceStructureElements.push({
            kind: "core-sentence-element",
            sentenceElementName: "V",
            span: coreVerbComplexSpan,
          });
          break;
        }

        const coreNominalSpan = getCoreNominalSpan(sentence, dependencyWord);
        if (!coreNominalSpan) {
          console.error("Core nominal span not found");
          break;
        }
        sentenceStructureElements.push({
          kind: "core-sentence-element",
          sentenceElementName: "S",
          span: coreNominalSpan,
        });
        break;
      }
      case "csubj":
      case "csubj:pass":
      case "csubj:outer": {
        const predicateConstituentForDependencyWord =
          predicateConstituents.find(
            (predicateConstituent) =>
              predicateConstituent.predicateHeadWord.id === dependencyWord.id,
          ) ?? null;

        if (!predicateConstituentForDependencyWord) {
          console.error("Predicate constituent type not found");
          break;
        }

        sentenceStructureElements.push({
          kind: "sentence-constituent",
          type: predicateConstituentForDependencyWord.type,
          usage: "nominal",
          sentenceElementName: "S",
          span: predicateConstituentForDependencyWord.span,
        });

        const coreVerbComplexSpan = getCoreVerbComplexSpan(
          sentence,
          predicateConstituentForDependencyWord.predicateCarrierWord,
        );
        if (!coreVerbComplexSpan) {
          console.error("Core verb complex span not found");
          break;
        }
        sentenceStructureElements.push({
          kind: "core-sentence-element",
          sentenceElementName: "V",
          span: coreVerbComplexSpan,
        });
        break;
      }
      case "obj":
      case "iobj": {
        const predicateConstituentForDependencyWord =
          dependencyWord.xpos === "WP" || dependencyWord.xpos === "WRB"
            ? (predicateConstituents.find(
                (predicateConstituent) =>
                  predicateConstituent.connectorWord?.id === dependencyWord.id,
              ) ?? null)
            : null;

        if (predicateConstituentForDependencyWord) {
          sentenceStructureElements.push({
            kind: "sentence-constituent",
            type: predicateConstituentForDependencyWord.type,
            usage: "nominal",
            sentenceElementName: "O",
            span: predicateConstituentForDependencyWord.span,
          });

          const coreVerbComplexSpan = getCoreVerbComplexSpan(
            sentence,
            predicateConstituentForDependencyWord.predicateCarrierWord,
          );
          if (!coreVerbComplexSpan) {
            console.error("Core verb complex span not found");
            break;
          }
          sentenceStructureElements.push({
            kind: "core-sentence-element",
            sentenceElementName: "V",
            span: coreVerbComplexSpan,
          });
          break;
        }

        const coreNominalSpan = getCoreNominalSpan(sentence, dependencyWord);
        if (!coreNominalSpan) {
          console.error("Core nominal span not found");
          break;
        }
        sentenceStructureElements.push({
          kind: "core-sentence-element",
          sentenceElementName: "O",
          span: coreNominalSpan,
        });
        break;
      }
      case "ccomp": {
        const predicateConstituentForDependencyWord =
          predicateConstituents.find(
            (predicateConstituent) =>
              predicateConstituent.predicateHeadWord.id === dependencyWord.id,
          ) ?? null;

        if (!predicateConstituentForDependencyWord) {
          console.error("Predicate constituent type not found");
          break;
        }

        sentenceStructureElements.push({
          kind: "sentence-constituent",
          type: predicateConstituentForDependencyWord.type,
          usage: "nominal",
          sentenceElementName: "O",
          span: predicateConstituentForDependencyWord.span,
        });

        const coreVerbComplexSpan = getCoreVerbComplexSpan(
          sentence,
          predicateConstituentForDependencyWord.predicateCarrierWord,
        );
        if (!coreVerbComplexSpan) {
          console.error("Core verb complex span not found");
          break;
        }
        sentenceStructureElements.push({
          kind: "core-sentence-element",
          sentenceElementName: "V",
          span: coreVerbComplexSpan,
        });
        break;
      }
      case "xcomp": {
        const predicateConstituentForDependencyWord =
          predicateConstituents.find(
            (predicateConstituent) =>
              predicateConstituent.predicateHeadWord.id === dependencyWord.id,
          ) ?? null;

        if (predicateConstituentForDependencyWord) {
          const dependencyHeadWord = dependencyWords.find(
            (candidateDependencyWord) =>
              candidateDependencyWord.id === dependencyWord.head,
          );
          if (!dependencyHeadWord) {
            throw new Error("Dependency head word not found");
          }

          const xcompSentenceElementName = dependencyWords.some(
            (dependentWord) =>
              dependentWord.head === dependencyHeadWord.id &&
              (dependentWord.deprel === "obj" ||
                dependentWord.deprel === "iobj"),
          )
            ? "C"
            : "O";
          sentenceStructureElements.push({
            kind: "sentence-constituent",
            type: predicateConstituentForDependencyWord.type,
            usage: "nominal",
            sentenceElementName: xcompSentenceElementName,
            span: predicateConstituentForDependencyWord.span,
          });

          const coreVerbComplexSpan = getCoreVerbComplexSpan(
            sentence,
            predicateConstituentForDependencyWord.predicateCarrierWord,
          );
          if (!coreVerbComplexSpan) {
            console.error("Core verb complex span not found");
            break;
          }
          sentenceStructureElements.push({
            kind: "core-sentence-element",
            sentenceElementName: "V",
            span: coreVerbComplexSpan,
          });
          break;
        }

        switch (dependencyWord.upos) {
          case "ADJ": {
            const coreAdjectivalSpan = getCoreAdjectivalSpan(
              sentence,
              dependencyWord,
            );
            if (!coreAdjectivalSpan) {
              console.error("Core adjectival span not found");
              break;
            }
            sentenceStructureElements.push({
              kind: "core-sentence-element",
              sentenceElementName: "C",
              span: coreAdjectivalSpan,
            });
            break;
          }
          case "NOUN":
          case "PROPN":
          case "PRON":
          case "NUM":
          case "SYM":
          case "INTJ":
          case "X": {
            const coreNominalSpan = getCoreNominalSpan(
              sentence,
              dependencyWord,
            );
            if (!coreNominalSpan) {
              console.error("Core nominal span not found");
              break;
            }
            sentenceStructureElements.push({
              kind: "core-sentence-element",
              sentenceElementName: "C",
              span: coreNominalSpan,
            });
            break;
          }
          case "ADP":
          case "ADV":
          case "AUX":
          case "CCONJ":
          case "DET":
          case "PART":
          case "PUNCT":
          case "SCONJ":
          case "VERB": {
            console.error("Unexpected xcomp dependent UPOS");
            break;
          }
          default: {
            dependencyWord.upos satisfies never;
            throw new Error("Unreachable");
          }
        }
        break;
      }
      case "advmod": {
        if (dependencyWord.xpos === "WRB") {
          break;
        }

        const modifierPhraseSpan = getModifierPhraseSpan(
          sentence,
          dependencyWord,
        );
        if (!modifierPhraseSpan) {
          console.error("Modifier phrase span not found");
          break;
        }
        sentenceStructureElements.push({
          kind: "sentence-constituent",
          type: "modifier-phrase",
          sentenceElementName: null,
          span: modifierPhraseSpan,
        });
        break;
      }
      case "obl":
      case "obl:agent":
      case "nmod":
      case "compound:prt": {
        const modifierPhraseSpan = getModifierPhraseSpan(
          sentence,
          dependencyWord,
        );
        if (!modifierPhraseSpan) {
          console.error("Modifier phrase span not found");
          break;
        }
        sentenceStructureElements.push({
          kind: "sentence-constituent",
          type: "modifier-phrase",
          sentenceElementName: null,
          span: modifierPhraseSpan,
        });
        break;
      }
      case "obl:tmod":
      case "obl:npmod":
      case "obl:unmarked": {
        const coreNominalSpan = getCoreNominalSpan(sentence, dependencyWord);
        if (!coreNominalSpan) {
          console.error("Core nominal span not found");
          break;
        }
        sentenceStructureElements.push({
          kind: "sentence-constituent",
          type: "modifier-phrase",
          sentenceElementName: null,
          span: coreNominalSpan,
        });
        break;
      }
      case "expl": {
        if (dependencyWord.text.toLowerCase() === "there") {
          sentenceStructureElements.push({
            kind: "sentence-constituent",
            type: "modifier-phrase",
            sentenceElementName: null,
            span: {
              startWordIndex: dependencyWords.findIndex(
                (candidateDependencyWord) =>
                  candidateDependencyWord.id === dependencyWord.id,
              ),
              endWordIndex: dependencyWords.findIndex(
                (candidateDependencyWord) =>
                  candidateDependencyWord.id === dependencyWord.id,
              ),
            },
          });
        } else if (dependencyWord.text.toLowerCase() === "it") {
          const dependencyHeadWord = getResolvedDependencyHeadWord(
            sentence,
            dependencyWord,
          );
          if (!dependencyHeadWord) {
            throw new Error("Dependency head word not found");
          }

          const hasOtherNominalSubject = dependencyWords.some(
            (candidateDependencyWord) =>
              candidateDependencyWord.id !== dependencyWord.id &&
              candidateDependencyWord.head === dependencyHeadWord.id &&
              (candidateDependencyWord.deprel === "nsubj" ||
                candidateDependencyWord.deprel === "nsubj:pass" ||
                candidateDependencyWord.deprel === "nsubj:outer"),
          );
          sentenceStructureElements.push({
            kind: "core-sentence-element",
            sentenceElementName: hasOtherNominalSubject ? "O" : "S",
            span: {
              startWordIndex: dependencyWords.findIndex(
                (candidateDependencyWord) =>
                  candidateDependencyWord.id === dependencyWord.id,
              ),
              endWordIndex: dependencyWords.findIndex(
                (candidateDependencyWord) =>
                  candidateDependencyWord.id === dependencyWord.id,
              ),
            },
          });
        } else {
          console.error("Unexpected expletive word");
        }
        break;
      }
      case "acl":
      case "acl:relcl": {
        const predicateConstituentForDependencyWord =
          predicateConstituents.find(
            (predicateConstituent) =>
              predicateConstituent.predicateHeadWord.id === dependencyWord.id,
          ) ?? null;

        if (!predicateConstituentForDependencyWord) {
          console.error("Predicate constituent type not found");
          break;
        }

        sentenceStructureElements.push({
          kind: "sentence-constituent",
          type: predicateConstituentForDependencyWord.type,
          usage: "adjectival",
          sentenceElementName: null,
          span: predicateConstituentForDependencyWord.span,
        });

        const coreVerbComplexSpan = getCoreVerbComplexSpan(
          sentence,
          predicateConstituentForDependencyWord.predicateCarrierWord,
        );
        if (!coreVerbComplexSpan) {
          console.error("Core verb complex span not found");
          break;
        }
        sentenceStructureElements.push({
          kind: "core-sentence-element",
          sentenceElementName: "V",
          span: coreVerbComplexSpan,
        });
        break;
      }
      case "advcl":
      case "advcl:relcl": {
        const predicateConstituentForDependencyWord =
          predicateConstituents.find(
            (predicateConstituent) =>
              predicateConstituent.predicateHeadWord.id === dependencyWord.id,
          ) ?? null;

        if (!predicateConstituentForDependencyWord) {
          console.error("Predicate constituent type not found");
          break;
        }

        sentenceStructureElements.push({
          kind: "sentence-constituent",
          type: predicateConstituentForDependencyWord.type,
          usage: "adverbial",
          sentenceElementName: null,
          span: predicateConstituentForDependencyWord.span,
        });

        const coreVerbComplexSpan = getCoreVerbComplexSpan(
          sentence,
          predicateConstituentForDependencyWord.predicateCarrierWord,
        );
        if (!coreVerbComplexSpan) {
          console.error("Core verb complex span not found");
          break;
        }
        sentenceStructureElements.push({
          kind: "core-sentence-element",
          sentenceElementName: "V",
          span: coreVerbComplexSpan,
        });
        break;
      }
      case "root":
      case "amod":
      case "appos":
      case "aux":
      case "aux:pass":
      case "case":
      case "cc":
      case "cc:preconj":
      case "compound":
      case "dep":
      case "det":
      case "det:predet":
      case "discourse":
      case "dislocated":
      case "fixed":
      case "flat":
      case "goeswith":
      case "list":
      case "mark":
      case "nmod:desc":
      case "nmod:poss":
      case "nmod:unmarked":
      case "nummod":
      case "orphan":
      case "parataxis":
      case "punct":
      case "reparandum":
      case "vocative": {
        break;
      }
      default: {
        resolvedDependencyLabel satisfies never;
        throw new Error("Unreachable");
      }
    }
  }

  return sentenceStructureElements;
}

function getCoordinations(sentence: StanzaParsedSentence): {
  type: CoordinationPartType;
  span: { startWordIndex: number; endWordIndex: number };
}[][] {
  const dependencyWords = sentence.tokens.flatMap((token) => token.words);

  function getCoordinationParts(
    sentence: StanzaParsedSentence,
    constituencyHeadNode: StanzaConstituencyNode,
  ): ReturnType<typeof getCoordinations>[number] {
    const childNodeSpans = constituencyHeadNode.children.map((childNode) =>
      getConstituencyNodeSpan(sentence, childNode),
    );

    function isCoordinationMarker(
      constituencyNode: StanzaConstituencyNode,
    ): boolean {
      return (
        constituencyNode.label === "CC" || constituencyNode.label === "CONJP"
      );
    }

    function isConjunct(constituencyNode: StanzaConstituencyNode): boolean {
      const constituencyNodeSpan = childNodeSpans.find(
        ({ startWordIndex, endWordIndex }) =>
          startWordIndex ===
            getConstituencyNodeSpan(sentence, constituencyNode)
              .startWordIndex &&
          endWordIndex ===
            getConstituencyNodeSpan(sentence, constituencyNode).endWordIndex,
      );
      if (!constituencyNodeSpan) {
        throw new Error("Constituency node span not found");
      }

      return dependencyWords.some((dependentWord, dependentWordIndex) => {
        if (dependentWord.deprel !== "conj") {
          return false;
        }

        const dependencyHeadWordIndex = dependencyWords.findIndex(
          (candidateDependencyWord) =>
            candidateDependencyWord.id === dependentWord.head,
        );
        if (dependencyHeadWordIndex === -1) {
          throw new Error("Dependency head word not found");
        }

        const dependentWordChildNodeSpan = childNodeSpans.find(
          ({ startWordIndex, endWordIndex }) =>
            startWordIndex <= dependentWordIndex &&
            dependentWordIndex <= endWordIndex,
        );
        const dependencyHeadWordChildNodeSpan = childNodeSpans.find(
          ({ startWordIndex, endWordIndex }) =>
            startWordIndex <= dependencyHeadWordIndex &&
            dependencyHeadWordIndex <= endWordIndex,
        );
        if (!dependentWordChildNodeSpan || !dependencyHeadWordChildNodeSpan) {
          return false;
        }

        return (
          (dependentWordChildNodeSpan === constituencyNodeSpan ||
            dependencyHeadWordChildNodeSpan === constituencyNodeSpan) &&
          dependentWordChildNodeSpan !== dependencyHeadWordChildNodeSpan
        );
      });
    }

    const isCorrelativeCoordination =
      constituencyHeadNode.children.some(
        (childNode) => childNode.label === "CONJP",
      ) ||
      dependencyWords.some((dependentWord, dependentWordIndex) => {
        if (dependentWord.deprel !== "cc:preconj") {
          return false;
        }

        const dependencyHeadWordIndex = dependencyWords.findIndex(
          (candidateDependencyWord) =>
            candidateDependencyWord.id === dependentWord.head,
        );
        if (dependencyHeadWordIndex === -1) {
          throw new Error("Dependency head word not found");
        }

        const dependentWordChildNodeSpan = childNodeSpans.find(
          ({ startWordIndex, endWordIndex }) =>
            startWordIndex <= dependentWordIndex &&
            dependentWordIndex <= endWordIndex,
        );
        const dependencyHeadWordChildNodeSpan = childNodeSpans.find(
          ({ startWordIndex, endWordIndex }) =>
            startWordIndex <= dependencyHeadWordIndex &&
            dependencyHeadWordIndex <= endWordIndex,
        );
        if (!dependentWordChildNodeSpan || !dependencyHeadWordChildNodeSpan) {
          return false;
        }

        return dependentWordChildNodeSpan !== dependencyHeadWordChildNodeSpan;
      });

    const firstCoordinationNodeIndex = constituencyHeadNode.children.findIndex(
      (childNode) => isCoordinationMarker(childNode) || isConjunct(childNode),
    );
    if (firstCoordinationNodeIndex === -1) {
      throw new Error("Coordination part not found");
    }
    const coordinationPartSpans: ReturnType<typeof getCoordinationParts> = [];
    for (const [childNodeIndex, childNode] of constituencyHeadNode.children
      .slice(firstCoordinationNodeIndex)
      .entries()) {
      const childNodeSpan = childNodeSpans.at(
        childNodeIndex + firstCoordinationNodeIndex,
      );
      if (!childNodeSpan) {
        throw new Error("Child node span not found");
      }
      if (isCoordinationMarker(childNode) || isConjunct(childNode)) {
        coordinationPartSpans.push({
          type: isCoordinationMarker(childNode)
            ? isCorrelativeCoordination
              ? "correlative"
              : "coordinator"
            : "conjunct",
          span: {
            startWordIndex: childNodeSpan.startWordIndex,
            endWordIndex: childNodeSpan.endWordIndex,
          },
        });
      } else if (
        coordinationPartSpans.at(-1)!.type === "correlative" ||
        coordinationPartSpans.at(-1)!.type === "coordinator" ||
        childNode.label === "," ||
        childNode.label === "."
      ) {
        coordinationPartSpans.at(-1)!.span.endWordIndex =
          childNodeSpan.endWordIndex;
      } else {
        break;
      }
    }

    return coordinationPartSpans;
  }

  function collectCoordinations(
    sentence: StanzaParsedSentence,
    constituencyNode: StanzaConstituencyNode,
  ): ReturnType<typeof getCoordinations> {
    const childCoordinations = constituencyNode.children.flatMap((childNode) =>
      collectCoordinations(sentence, childNode),
    );

    if (isCoordinationNode(sentence, constituencyNode)) {
      return [
        ...childCoordinations,
        getCoordinationParts(sentence, constituencyNode),
      ];
    } else {
      return childCoordinations;
    }
  }

  return collectCoordinations(sentence, sentence.constituency);
}

function getModifications(sentence: StanzaParsedSentence): {
  modifierWordIndex: number;
  modifiedWordIndex: number;
}[] {
  const dependencyWords = sentence.tokens.flatMap((token) => token.words);
  const coordinations = getCoordinations(sentence);

  function getSharedModificationCoordination(
    modifierWordIndex: number,
    modifiedWordIndex: number,
  ): ReturnType<typeof getCoordinations>[number] | null {
    return (
      coordinations
        .filter((coordination) =>
          coordination.some(
            (coordinationPart) =>
              coordinationPart.type === "conjunct" &&
              coordinationPart.span.startWordIndex <= modifiedWordIndex &&
              modifiedWordIndex <= coordinationPart.span.endWordIndex,
          ),
        )
        .filter(
          (coordination) =>
            modifierWordIndex < coordination.at(0)!.span.startWordIndex ||
            coordination.at(-1)!.span.endWordIndex < modifierWordIndex,
        )
        .toSorted(
          (a, b) =>
            b.at(-1)!.span.endWordIndex -
            b.at(0)!.span.startWordIndex -
            (a.at(-1)!.span.endWordIndex - a.at(0)!.span.startWordIndex),
        )
        .at(0) ?? null
    );
  }

  return dependencyWords.flatMap((modifierWord) => {
    const resolvedDependencyLabel = getResolvedDependencyLabel(
      sentence,
      modifierWord,
    );
    if (
      !(
        resolvedDependencyLabel === "acl" ||
        resolvedDependencyLabel === "acl:relcl"
      )
    ) {
      return [];
    }

    const modifierWordIndex = dependencyWords.findIndex(
      (dependencyWord) => dependencyWord.id === modifierWord.id,
    );
    if (modifierWordIndex === -1) {
      throw new Error("Modifier word not found");
    }

    const modifiedWord = getResolvedDependencyHeadWord(sentence, modifierWord);
    if (!modifiedWord) {
      throw new Error("Modified word not found");
    }
    const modifiedWordIndex = dependencyWords.findIndex(
      (dependencyWord) => dependencyWord.id === modifiedWord.id,
    );
    if (modifiedWordIndex === -1) {
      throw new Error("Modified word not found");
    }

    const sharedModificationCoordination = getSharedModificationCoordination(
      modifierWordIndex,
      modifiedWordIndex,
    );
    if (!sharedModificationCoordination) {
      return [{ modifierWordIndex, modifiedWordIndex }];
    }

    return sharedModificationCoordination
      .filter((coordinationPart) => coordinationPart.type === "conjunct")
      .flatMap((conjunct) => {
        const modifiedWord = getDependencySpanConnectorWord(
          sentence,
          conjunct.span,
        );
        if (!modifiedWord) {
          console.error("Modified word not found");
          return [];
        }
        const modifiedWordIndex = dependencyWords.findIndex(
          (dependencyWord) => dependencyWord.id === modifiedWord.id,
        );
        if (modifiedWordIndex === -1) {
          throw new Error("Modified word not found");
        }

        return [{ modifierWordIndex, modifiedWordIndex }];
      });
  });
}

export function createSentenceStructureDocumentFromStanzaParsedDocument(
  stanzaParsedDocument: StanzaParsedDocument,
): SentenceStructureDocument {
  const sentenceStructureDocumentFromWords =
    createSentenceStructureDocumentFromWords(
      stanzaParsedDocument.sentences.map((sentence) => ({
        words: sentence.tokens.flatMap((token) =>
          token.words.map((word, index) => ({
            text: word.text,
            whitespaceAfter:
              index === token.words.length - 1 ? token.spaces_after : "",
          })),
        ),
      })),
    );

  try {
    for (const sentence of stanzaParsedDocument.sentences) {
      const dependencyWords = sentence.tokens.flatMap((token) => token.words);
      const constituencyLeafNodes = getConstituencyLeafNodes(
        sentence.constituency,
      );
      if (
        dependencyWords.length !== constituencyLeafNodes.length ||
        !dependencyWords.every(
          (dependencyWord, index) =>
            dependencyWord.text === constituencyLeafNodes.at(index)?.label,
        )
      ) {
        throw new Error(
          "Dependency words and constituency leaf nodes do not match",
        );
      }
    }
  } catch (error) {
    console.error(error);
    return sentenceStructureDocumentFromWords;
  }

  const sentenceStructureDocumentWithSentenceStructureElements =
    stanzaParsedDocument.sentences.reduce(
      (sentenceStructureDocument, stanzaSentence, sentenceIndex) => {
        const sentenceId =
          sentenceStructureDocument.sentences.at(sentenceIndex)?.id;
        if (!sentenceId) {
          throw new Error("Sentence not found");
        }
        const sentenceStructureElements =
          getSentenceStructureElements(stanzaSentence);

        return sentenceStructureElements.reduce(
          (sentenceStructureDocument, sentenceStructureElement) => {
            const startWordId = sentenceStructureDocument.sentences
              .find((sentence) => sentence.id === sentenceId)
              ?.words.find(
                (word) =>
                  word.index === sentenceStructureElement.span.startWordIndex,
              )?.id;
            const endWordId = sentenceStructureDocument.sentences
              .find((sentence) => sentence.id === sentenceId)
              ?.words.find(
                (word) =>
                  word.index === sentenceStructureElement.span.endWordIndex,
              )?.id;
            if (!startWordId || !endWordId) {
              throw new Error("Word not found");
            }

            switch (sentenceStructureElement.kind) {
              case "core-sentence-element": {
                const result = addSentenceStructureElement(
                  sentenceStructureDocument,
                  {
                    sentenceId,
                    kind: sentenceStructureElement.kind,
                    sentenceElementName:
                      sentenceStructureElement.sentenceElementName,
                    startWordId,
                    endWordId,
                  },
                );
                if (!result.success) {
                  console.error(result.message);
                  return sentenceStructureDocument;
                }
                return result.data.newSentenceStructureDocument;
              }
              case "sentence-constituent": {
                switch (sentenceStructureElement.type) {
                  case "verbal-phrase":
                  case "clause": {
                    switch (sentenceStructureElement.usage) {
                      case "nominal": {
                        const result = addSentenceStructureElement(
                          sentenceStructureDocument,
                          {
                            sentenceId,
                            kind: sentenceStructureElement.kind,
                            type: sentenceStructureElement.type,
                            usage: sentenceStructureElement.usage,
                            sentenceElementName:
                              sentenceStructureElement.sentenceElementName,
                            startWordId,
                            endWordId,
                          },
                        );
                        if (!result.success) {
                          console.error(result.message);
                          return sentenceStructureDocument;
                        }
                        return result.data.newSentenceStructureDocument;
                      }
                      case "adjectival":
                      case "adverbial": {
                        const result = addSentenceStructureElement(
                          sentenceStructureDocument,
                          {
                            sentenceId,
                            kind: sentenceStructureElement.kind,
                            type: sentenceStructureElement.type,
                            usage: sentenceStructureElement.usage,
                            sentenceElementName:
                              sentenceStructureElement.sentenceElementName,
                            startWordId,
                            endWordId,
                          },
                        );
                        if (!result.success) {
                          console.error(result.message);
                          return sentenceStructureDocument;
                        }
                        return result.data.newSentenceStructureDocument;
                      }
                      default: {
                        sentenceStructureElement satisfies never;
                        throw new Error("Unreachable");
                      }
                    }
                  }
                  case "modifier-phrase": {
                    const result = addSentenceStructureElement(
                      sentenceStructureDocument,
                      {
                        sentenceId,
                        kind: sentenceStructureElement.kind,
                        type: sentenceStructureElement.type,
                        sentenceElementName:
                          sentenceStructureElement.sentenceElementName,
                        startWordId,
                        endWordId,
                      },
                    );
                    if (!result.success) {
                      console.error(result.message);
                      return sentenceStructureDocument;
                    }
                    return result.data.newSentenceStructureDocument;
                  }
                  default: {
                    sentenceStructureElement satisfies never;
                    throw new Error("Unreachable");
                  }
                }
              }
              default: {
                sentenceStructureElement satisfies never;
                throw new Error("Unreachable");
              }
            }
          },
          sentenceStructureDocument,
        );
      },
      sentenceStructureDocumentFromWords,
    );

  const sentenceStructureDocumentWithCoordinations =
    stanzaParsedDocument.sentences.reduce(
      (sentenceStructureDocument, stanzaSentence, sentenceIndex) => {
        const sentenceId =
          sentenceStructureDocument.sentences.at(sentenceIndex)?.id;
        if (!sentenceId) {
          throw new Error("Sentence not found");
        }
        return getCoordinations(stanzaSentence).reduce(
          (sentenceStructureDocument, coordination) => {
            const result = addCoordination(sentenceStructureDocument, {
              sentenceId,
              coordinationParts: coordination.map((coordinationPart) => {
                const startWordId = sentenceStructureDocument.sentences
                  .find((sentence) => sentence.id === sentenceId)
                  ?.words.find(
                    (word) =>
                      word.index === coordinationPart.span.startWordIndex,
                  )?.id;
                const endWordId = sentenceStructureDocument.sentences
                  .find((sentence) => sentence.id === sentenceId)
                  ?.words.find(
                    (word) => word.index === coordinationPart.span.endWordIndex,
                  )?.id;
                if (!startWordId || !endWordId) {
                  throw new Error("Word not found");
                }
                return {
                  type: coordinationPart.type,
                  startWordId,
                  endWordId,
                };
              }),
            });
            if (!result.success) {
              console.error(result.message);
              return sentenceStructureDocument;
            }
            return result.data.newSentenceStructureDocument;
          },
          sentenceStructureDocument,
        );
      },
      sentenceStructureDocumentWithSentenceStructureElements,
    );

  const sentenceStructureDocumentWithModifications =
    stanzaParsedDocument.sentences.reduce(
      (sentenceStructureDocument, stanzaSentence, sentenceIndex) => {
        const sentenceId =
          sentenceStructureDocument.sentences.at(sentenceIndex)?.id;
        if (!sentenceId) {
          throw new Error("Sentence not found");
        }
        const dependencyWords = stanzaSentence.tokens.flatMap(
          (token) => token.words,
        );

        const modifications = getModifications(stanzaSentence);

        return modifications.reduce(
          (sentenceStructureDocument, modification) => {
            function getMaximalSentenceStructureElementSpan(
              includedWordIndex: number,
              excludedWordIndex: number,
            ): {
              startWordIndex: number;
              endWordIndex: number;
            } | null {
              const sentence =
                sentenceStructureDocument.sentences.at(sentenceIndex)!;

              const sentenceStructureElement =
                sentence.sentenceStructureElements.find(
                  (sentenceStructureElement) => {
                    const startWordIndex = sentence.words.findIndex(
                      (word) =>
                        word.id === sentenceStructureElement.startWordId,
                    );
                    const endWordIndex = sentence.words.findIndex(
                      (word) => word.id === sentenceStructureElement.endWordId,
                    );
                    if (startWordIndex === -1 || endWordIndex === -1) {
                      throw new Error(
                        "Sentence structure element word not found",
                      );
                    }

                    return (
                      startWordIndex <= includedWordIndex &&
                      includedWordIndex <= endWordIndex &&
                      (excludedWordIndex < startWordIndex ||
                        endWordIndex < excludedWordIndex)
                    );
                  },
                );
              if (!sentenceStructureElement) {
                return null;
              }

              return {
                startWordIndex: sentence.words.findIndex(
                  (word) => word.id === sentenceStructureElement.startWordId,
                ),
                endWordIndex: sentence.words.findIndex(
                  (word) => word.id === sentenceStructureElement.endWordId,
                ),
              };
            }

            const modifierSentenceStructureElementSpan =
              getMaximalSentenceStructureElementSpan(
                modification.modifierWordIndex,
                modification.modifiedWordIndex,
              );
            if (!modifierSentenceStructureElementSpan) {
              console.error("Modifier sentence structure element not found");
              return sentenceStructureDocument;
            }

            const modifiedWord = dependencyWords.at(
              modification.modifiedWordIndex,
            );
            if (!modifiedWord) {
              throw new Error("Modified word not found");
            }
            const coreNominalSpan = getCoreNominalSpan(
              stanzaSentence,
              modifiedWord,
            ) ?? {
              startWordIndex: modification.modifiedWordIndex,
              endWordIndex: modification.modifiedWordIndex,
            };

            const modifiedSentenceStructureElementSpan =
              getMaximalSentenceStructureElementSpan(
                modification.modifiedWordIndex,
                modification.modifierWordIndex,
              ) ?? {
                startWordIndex: coreNominalSpan.startWordIndex,
                endWordIndex: coreNominalSpan.endWordIndex,
              };

            const result = addModification(sentenceStructureDocument, {
              sentenceId,
              modifierSentenceStructureElement: {
                startWordId: sentenceStructureDocument.sentences
                  .find((sentence) => sentence.id === sentenceId)!
                  .words.find(
                    (word) =>
                      word.index ===
                      modifierSentenceStructureElementSpan.startWordIndex,
                  )!.id,
                endWordId: sentenceStructureDocument.sentences
                  .find((sentence) => sentence.id === sentenceId)!
                  .words.find(
                    (word) =>
                      word.index ===
                      modifierSentenceStructureElementSpan.endWordIndex,
                  )!.id,
              },
              modifiedSentenceStructureElement: {
                startWordId: sentenceStructureDocument.sentences
                  .find((sentence) => sentence.id === sentenceId)!
                  .words.find(
                    (word) =>
                      word.index ===
                      modifiedSentenceStructureElementSpan.startWordIndex,
                  )!.id,
                endWordId: sentenceStructureDocument.sentences
                  .find((sentence) => sentence.id === sentenceId)!
                  .words.find(
                    (word) =>
                      word.index ===
                      modifiedSentenceStructureElementSpan.endWordIndex,
                  )!.id,
              },
            });
            if (!result.success) {
              console.error(result.message);
              return sentenceStructureDocument;
            }
            return result.data.newSentenceStructureDocument;
          },
          sentenceStructureDocument,
        );
      },
      sentenceStructureDocumentWithCoordinations,
    );

  return sentenceStructureDocumentWithModifications;
}
