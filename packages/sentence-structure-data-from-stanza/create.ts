import {
  addCoordination,
  addModification,
  addSentenceStructureElement,
  coreSentenceElementAllowedSentenceElementNameOptions,
  createSentenceStructureDocumentFromWords,
  sentenceConstituentTypeToAllowedSentenceElementNameOptionsMap,
  type CoordinationPartType,
  type SentenceStructureDocument,
} from "@sentence-structure-diagram-app/sentence-structure-data";
import type {
  StanzaDependencyLabel,
  StanzaDocument,
  StanzaParseTree,
  StanzaSentence,
  StanzaWord,
} from "./types.js";

function getConstituencyLeafNodes(
  constituencyNode: StanzaParseTree,
): StanzaParseTree[] {
  if (constituencyNode.children.length === 0) {
    return [constituencyNode];
  }
  return constituencyNode.children.flatMap((child) =>
    getConstituencyLeafNodes(child),
  );
}

function getCorrespondingConstituencyLeafNode(
  sentence: StanzaSentence,
  dependencyWord: StanzaWord,
): StanzaParseTree {
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
  sentence: StanzaSentence,
  constituencyNode: StanzaParseTree,
): StanzaParseTree | null {
  if (sentence.constituency === constituencyNode) {
    return null;
  }

  function findConstituencyParentNode(
    currentConstituencyNode: StanzaParseTree,
  ): StanzaParseTree | null {
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
  constituencyNode: StanzaParseTree,
  targetLeafNode: StanzaParseTree,
): StanzaParseTree {
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
  sentence: StanzaSentence,
  constituencyNode: StanzaParseTree,
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
  sentence: StanzaSentence,
  constituencyNode: StanzaParseTree,
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
  sentence: StanzaSentence,
  dependencyHeadWord: StanzaWord,
): { startWordIndex: number; endWordIndex: number } | null {
  try {
    const correspondingConstituencyHeadLeafNode =
      getCorrespondingConstituencyLeafNode(sentence, dependencyHeadWord);

    function ascendToCandidateCoreNominalNode(
      constituencyNode: StanzaParseTree,
    ): StanzaParseTree {
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
      constituencyNode: StanzaParseTree,
    ): StanzaParseTree {
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
    return getConstituencyNodeSpan(sentence, coreNominalNode);
  } catch (error) {
    console.error(error);
    return null;
  }
}

function getCoreVerbComplexSpan(
  sentence: StanzaSentence,
  predicateCarrierWord: StanzaWord,
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
  sentence: StanzaSentence,
  dependencyHeadWord: StanzaWord,
): { startWordIndex: number; endWordIndex: number } | null {
  const correspondingConstituencyHeadLeafNode =
    getCorrespondingConstituencyLeafNode(sentence, dependencyHeadWord);

  function ascendToCoreAdjectivalNode(
    constituencyNode: StanzaParseTree,
  ): StanzaParseTree | null {
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

function getPhraseSpan(
  sentence: StanzaSentence,
  dependencyHeadWord: StanzaWord,
): { startWordIndex: number; endWordIndex: number } | null {
  try {
    const correspondingConstituencyHeadLeafNode =
      getCorrespondingConstituencyLeafNode(sentence, dependencyHeadWord);

    function ascendToCandidatePhraseNode(
      constituencyNode: StanzaParseTree,
    ): StanzaParseTree {
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
        throw new Error("Candidate phrase node not found");
      }

      return ascendToCandidatePhraseNode(constituencyParentNode);
    }

    function descendToPhraseNode(
      constituencyNode: StanzaParseTree,
    ): StanzaParseTree {
      if (isCoordinationNode(sentence, constituencyNode)) {
        return descendToPhraseNode(
          getConstituencyDirectChildNodeOnPathToLeafNode(
            constituencyNode,
            correspondingConstituencyHeadLeafNode,
          ),
        );
      }

      if (constituencyNode.children.length === 1) {
        return descendToPhraseNode(constituencyNode.children.at(0)!);
      }

      return constituencyNode;
    }

    const candidatePhraseNode = ascendToCandidatePhraseNode(
      correspondingConstituencyHeadLeafNode,
    );
    const phraseNode = descendToPhraseNode(candidatePhraseNode);
    return getConstituencyNodeSpan(sentence, phraseNode);
  } catch (error) {
    console.error(error);
    return null;
  }
}

function getClauseSpan(
  sentence: StanzaSentence,
  dependencyHeadWord: StanzaWord,
): { startWordIndex: number; endWordIndex: number } | null {
  try {
    const correspondingConstituencyHeadLeafNode =
      getCorrespondingConstituencyLeafNode(sentence, dependencyHeadWord);

    function ascendToClauseNode(
      constituencyNode: StanzaParseTree,
    ): StanzaParseTree {
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

function getAdverbialPhraseSpan(
  sentence: StanzaSentence,
  dependencyHeadWord: StanzaWord,
): { startWordIndex: number; endWordIndex: number } | null {
  try {
    const dependencyWords = sentence.tokens.flatMap((token) => token.words);
    const correspondingConstituencyHeadLeafNode =
      getCorrespondingConstituencyLeafNode(sentence, dependencyHeadWord);

    function ascendToAdverbialPhraseNode(
      constituencyNode: StanzaParseTree,
    ): StanzaParseTree {
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
        throw new Error("Adverbial phrase node not found");
      }

      return ascendToAdverbialPhraseNode(constituencyParentNode);
    }

    const adverbialPhraseNode = ascendToAdverbialPhraseNode(
      correspondingConstituencyHeadLeafNode,
    );
    return getConstituencyNodeSpan(sentence, adverbialPhraseNode);
  } catch (error) {
    console.error(error);
    return null;
  }
}

function getResolvedDependencyLabel(
  sentence: StanzaSentence,
  dependentWord: StanzaWord,
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
  sentence: StanzaSentence,
  dependentWord: StanzaWord,
): StanzaWord | null {
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
  sentence: StanzaSentence,
  span: { startWordIndex: number; endWordIndex: number },
): StanzaWord | null {
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
  sentence: StanzaSentence,
  predicateCarrierWord: StanzaWord,
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
  type: "phrase" | "clause";
  predicateCarrierWord: StanzaWord;
  connectorWord: StanzaWord | null;
  span: { startWordIndex: number; endWordIndex: number };
};

function getPredicateConstituents(
  sentence: StanzaSentence,
): PredicateConstituent[] {
  const dependencyWords = sentence.tokens.flatMap((token) => token.words);

  function isPredicateCarrierWord(dependencyWord: StanzaWord): boolean {
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

    const predicateConstituent = (() => {
      const predicateFiniteness = getPredicateFiniteness(
        sentence,
        predicateCarrierWord,
      );
      switch (predicateFiniteness) {
        case "non-finite": {
          const phraseSpan = getPhraseSpan(sentence, predicateCarrierWord);
          if (!phraseSpan) {
            return null;
          }
          return {
            type: "phrase" as const,
            predicateCarrierWord,
            connectorWord: getDependencySpanConnectorWord(sentence, phraseSpan),
            span: phraseSpan,
          };
        }
        case "finite": {
          const clauseSpan = getClauseSpan(sentence, predicateCarrierWord);
          if (!clauseSpan) {
            return null;
          }
          return {
            type: "clause" as const,
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

function getSentenceStructureElements(sentence: StanzaSentence): (
  | {
      kind: "core-sentence-element";
      sentenceElementName: (typeof coreSentenceElementAllowedSentenceElementNameOptions)[number];
      span: { startWordIndex: number; endWordIndex: number };
    }
  | {
      kind: "sentence-constituent";
      type: "phrase";
      usage: "nominal" | "adjectival" | "adverbial";
      sentenceElementName: (typeof sentenceConstituentTypeToAllowedSentenceElementNameOptionsMap)["phrase"][number];
      span: { startWordIndex: number; endWordIndex: number };
    }
  | {
      kind: "sentence-constituent";
      type: "clause";
      usage: "nominal" | "adjectival" | "adverbial";
      sentenceElementName: (typeof sentenceConstituentTypeToAllowedSentenceElementNameOptionsMap)["clause"][number];
      span: { startWordIndex: number; endWordIndex: number };
    }
  | {
      kind: "sentence-constituent";
      type: "adverbial-phrase";
      sentenceElementName: (typeof sentenceConstituentTypeToAllowedSentenceElementNameOptionsMap)["adverbial-phrase"][number];
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
    const predicateConstituentForDependencyWord =
      predicateConstituents.find(
        (predicateConstituent) =>
          predicateConstituent.connectorWord?.id === dependencyWord.id,
      ) ?? null;

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
            ? dependencyWords.filter(
                (candidateDependencyWord) =>
                  candidateDependencyWord.id === copHeadWord.id ||
                  (candidateDependencyWord.head === copHeadWord.id &&
                    candidateDependencyWord.deprel === "conj"),
              )
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
                const adverbialPhraseSpan = getAdverbialPhraseSpan(
                  sentence,
                  copComplementHeadWord,
                );
                if (!adverbialPhraseSpan) {
                  console.error("Adverbial phrase span not found");
                  break;
                }
                sentenceStructureElements.push({
                  kind: "sentence-constituent",
                  type: "adverbial-phrase",
                  sentenceElementName: "M",
                  span: adverbialPhraseSpan,
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
              const adverbialPhraseSpan = getAdverbialPhraseSpan(
                sentence,
                copComplementHeadWord,
              );
              if (!adverbialPhraseSpan) {
                console.error("Adverbial phrase span not found");
                break;
              }
              sentenceStructureElements.push({
                kind: "sentence-constituent",
                type: "adverbial-phrase",
                sentenceElementName: "M",
                span: adverbialPhraseSpan,
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
        if (predicateConstituentForDependencyWord) {
          sentenceStructureElements.push({
            kind: "sentence-constituent",
            type: predicateConstituentForDependencyWord.type,
            usage: "nominal",
            sentenceElementName: "C",
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
      case "advmod":
      case "obl":
      case "obl:agent":
      case "nmod":
      case "compound:prt": {
        const adverbialPhraseSpan = getAdverbialPhraseSpan(
          sentence,
          dependencyWord,
        );
        if (!adverbialPhraseSpan) {
          console.error("Adverbial phrase span not found");
          break;
        }
        sentenceStructureElements.push({
          kind: "sentence-constituent",
          type: "adverbial-phrase",
          sentenceElementName: "M",
          span: adverbialPhraseSpan,
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
          type: "adverbial-phrase",
          sentenceElementName: "M",
          span: coreNominalSpan,
        });
        break;
      }
      case "expl": {
        if (dependencyWord.text.toLowerCase() === "there") {
          sentenceStructureElements.push({
            kind: "sentence-constituent",
            type: "adverbial-phrase",
            sentenceElementName: "M",
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
        if (!predicateConstituentForDependencyWord) {
          console.error("Predicate constituent type not found");
          break;
        }

        sentenceStructureElements.push({
          kind: "sentence-constituent",
          type: predicateConstituentForDependencyWord.type,
          usage: "adjectival",
          sentenceElementName: "M",
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
        if (!predicateConstituentForDependencyWord) {
          console.error("Predicate constituent type not found");
          break;
        }

        sentenceStructureElements.push({
          kind: "sentence-constituent",
          type: predicateConstituentForDependencyWord.type,
          usage: "adverbial",
          sentenceElementName: "M",
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

function getCoordinations(sentence: StanzaSentence): {
  type: CoordinationPartType;
  span: { startWordIndex: number; endWordIndex: number };
}[][] {
  const dependencyWords = sentence.tokens.flatMap((token) => token.words);

  function getCoordinationParts(
    sentence: StanzaSentence,
    constituencyHeadNode: StanzaParseTree,
  ): ReturnType<typeof getCoordinations>[number] {
    const childNodeSpans = constituencyHeadNode.children.map((childNode) =>
      getConstituencyNodeSpan(sentence, childNode),
    );

    function isCoordinationMarker(constituencyNode: StanzaParseTree): boolean {
      return (
        constituencyNode.label === "CC" || constituencyNode.label === "CONJP"
      );
    }

    function isConjunct(constituencyNode: StanzaParseTree): boolean {
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

    const isCorrelativeCoordination = (() => {
      return dependencyWords.some((dependentWord, dependentWordIndex) => {
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
    })();

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
    sentence: StanzaSentence,
    constituencyNode: StanzaParseTree,
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

function getModifications(sentence: StanzaSentence): {
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

export function createSentenceStructureDocumentFromStanza(
  stanzaDocument: StanzaDocument,
): SentenceStructureDocument {
  const sentenceStructureDocumentFromWords =
    createSentenceStructureDocumentFromWords(
      stanzaDocument.sentences.map((sentence) => ({
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
    for (const sentence of stanzaDocument.sentences) {
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
    stanzaDocument.sentences.reduce(
      (sentenceStructureDocument, stanzaSentence, sentenceIndex) => {
        const sentenceId =
          sentenceStructureDocument.sentences.at(sentenceIndex)!.id;
        const sentenceStructureElements =
          getSentenceStructureElements(stanzaSentence);

        return sentenceStructureElements.reduce(
          (sentenceStructureDocument, sentenceStructureElement) => {
            const startWordId = sentenceStructureDocument.sentences
              .at(sentenceIndex)!
              .words.at(sentenceStructureElement.span.startWordIndex)!.id;
            const endWordId = sentenceStructureDocument.sentences
              .at(sentenceIndex)!
              .words.at(sentenceStructureElement.span.endWordIndex)!.id;

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
                  case "phrase":
                  case "clause": {
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
                  case "adverbial-phrase": {
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
                  default:
                    sentenceStructureElement satisfies never;
                    throw new Error("Unreachable");
                }
              }
              default:
                sentenceStructureElement satisfies never;
                throw new Error("Unreachable");
            }
          },
          sentenceStructureDocument,
        );
      },
      sentenceStructureDocumentFromWords,
    );

  const sentenceStructureDocumentWithCoordinations =
    stanzaDocument.sentences.reduce(
      (sentenceStructureDocument, stanzaSentence, sentenceIndex) => {
        return getCoordinations(stanzaSentence).reduce(
          (sentenceStructureDocument, coordination) => {
            const result = addCoordination(sentenceStructureDocument, {
              sentenceId:
                sentenceStructureDocument.sentences.at(sentenceIndex)!.id,
              coordinationParts: coordination.map((coordinationPart) => ({
                type: coordinationPart.type,
                startWordId: sentenceStructureDocument.sentences
                  .at(sentenceIndex)!
                  .words.at(coordinationPart.span.startWordIndex)!.id,
                endWordId: sentenceStructureDocument.sentences
                  .at(sentenceIndex)!
                  .words.at(coordinationPart.span.endWordIndex)!.id,
              })),
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
    stanzaDocument.sentences.reduce(
      (sentenceStructureDocument, stanzaSentence, sentenceIndex) => {
        const sentenceId =
          sentenceStructureDocument.sentences.at(sentenceIndex)!.id;
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
              startWordId: string;
              endWordId: string;
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
                startWordId: sentenceStructureElement.startWordId,
                endWordId: sentenceStructureElement.endWordId,
              };
            }

            const modifierSentenceStructureElement =
              getMaximalSentenceStructureElementSpan(
                modification.modifierWordIndex,
                modification.modifiedWordIndex,
              );
            if (!modifierSentenceStructureElement) {
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

            const modifiedSentenceStructureElement =
              getMaximalSentenceStructureElementSpan(
                modification.modifiedWordIndex,
                modification.modifierWordIndex,
              ) ?? {
                startWordId: sentenceStructureDocument.sentences
                  .at(sentenceIndex)!
                  .words.at(coreNominalSpan.startWordIndex)!.id,
                endWordId: sentenceStructureDocument.sentences
                  .at(sentenceIndex)!
                  .words.at(coreNominalSpan.endWordIndex)!.id,
              };

            const result = addModification(sentenceStructureDocument, {
              sentenceId,
              modifierSentenceStructureElement,
              modifiedSentenceStructureElement,
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
