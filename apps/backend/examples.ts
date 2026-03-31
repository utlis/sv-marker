import type { SimplifiedSentenceStructureDocument } from "@sv-marker/sentence-structure-document";

export const examples: SimplifiedSentenceStructureDocument[] = [
  {
    sentences: [
      {
        words: [
          {
            index: 0,
            text: "The",
            whitespaceAfter: " ",
          },
          {
            index: 1,
            text: "girl",
            whitespaceAfter: " ",
          },
          {
            index: 2,
            text: "who",
            whitespaceAfter: " ",
          },
          {
            index: 3,
            text: "likes",
            whitespaceAfter: " ",
          },
          {
            index: 4,
            text: "to",
            whitespaceAfter: " ",
          },
          {
            index: 5,
            text: "draw",
            whitespaceAfter: " ",
          },
          {
            index: 6,
            text: "pictures",
            whitespaceAfter: " ",
          },
          {
            index: 7,
            text: "after",
            whitespaceAfter: " ",
          },
          {
            index: 8,
            text: "school",
            whitespaceAfter: " ",
          },
          {
            index: 9,
            text: "has",
            whitespaceAfter: " ",
          },
          {
            index: 10,
            text: "been",
            whitespaceAfter: " ",
          },
          {
            index: 11,
            text: "quietly",
            whitespaceAfter: " ",
          },
          {
            index: 12,
            text: "improving",
            whitespaceAfter: " ",
          },
          {
            index: 13,
            text: "her",
            whitespaceAfter: " ",
          },
          {
            index: 14,
            text: "skills",
            whitespaceAfter: " ",
          },
          {
            index: 15,
            text: "for",
            whitespaceAfter: " ",
          },
          {
            index: 16,
            text: "the",
            whitespaceAfter: " ",
          },
          {
            index: 17,
            text: "past",
            whitespaceAfter: " ",
          },
          {
            index: 18,
            text: "two",
            whitespaceAfter: " ",
          },
          {
            index: 19,
            text: "years",
            whitespaceAfter: "",
          },
          {
            index: 20,
            text: ".",
            whitespaceAfter: "",
          },
        ],
        sentenceStructureElements: [
          {
            kind: "core-sentence-element",
            index: 0,
            startWordIndex: 0,
            endWordIndex: 1,
            sentenceElementName: "S",
          },
          {
            kind: "sentence-constituent",
            type: "clause",
            usage: "adjectival",
            index: 1,
            startWordIndex: 2,
            endWordIndex: 8,
            sentenceElementName: null,
          },
          {
            kind: "core-sentence-element",
            index: 2,
            startWordIndex: 2,
            endWordIndex: 2,
            sentenceElementName: "S",
          },
          {
            kind: "core-sentence-element",
            index: 3,
            startWordIndex: 3,
            endWordIndex: 3,
            sentenceElementName: "V",
          },
          {
            kind: "sentence-constituent",
            type: "verbal-phrase",
            usage: "nominal",
            index: 4,
            startWordIndex: 4,
            endWordIndex: 8,
            sentenceElementName: "O",
          },
          {
            kind: "core-sentence-element",
            index: 5,
            startWordIndex: 5,
            endWordIndex: 5,
            sentenceElementName: "V",
          },
          {
            kind: "core-sentence-element",
            index: 6,
            startWordIndex: 6,
            endWordIndex: 6,
            sentenceElementName: "O",
          },
          {
            kind: "sentence-constituent",
            type: "modifier-phrase",
            index: 7,
            startWordIndex: 7,
            endWordIndex: 8,
            sentenceElementName: null,
          },
          {
            kind: "core-sentence-element",
            index: 8,
            startWordIndex: 9,
            endWordIndex: 12,
            sentenceElementName: "V",
          },
          {
            kind: "sentence-constituent",
            type: "modifier-phrase",
            index: 9,
            startWordIndex: 11,
            endWordIndex: 11,
            sentenceElementName: null,
          },
          {
            kind: "core-sentence-element",
            index: 10,
            startWordIndex: 13,
            endWordIndex: 14,
            sentenceElementName: "O",
          },
          {
            kind: "sentence-constituent",
            type: "modifier-phrase",
            index: 11,
            startWordIndex: 15,
            endWordIndex: 19,
            sentenceElementName: null,
          },
        ],
        modifications: [
          {
            modifierSentenceStructureElementIndex: 1,
            modifiedSentenceStructureElementIndex: 0,
          },
        ],
        coordinations: [],
      },
    ],
  },
  {
    sentences: [
      {
        words: [
          {
            index: 0,
            text: "The",
            whitespaceAfter: " ",
          },
          {
            index: 1,
            text: "detailed",
            whitespaceAfter: " ",
          },
          {
            index: 2,
            text: "handwritten",
            whitespaceAfter: " ",
          },
          {
            index: 3,
            text: "notes",
            whitespaceAfter: " ",
          },
          {
            index: 4,
            text: "from",
            whitespaceAfter: " ",
          },
          {
            index: 5,
            text: "the",
            whitespaceAfter: " ",
          },
          {
            index: 6,
            text: "lesson",
            whitespaceAfter: " ",
          },
          {
            index: 7,
            text: "the",
            whitespaceAfter: " ",
          },
          {
            index: 8,
            text: "teacher",
            whitespaceAfter: " ",
          },
          {
            index: 9,
            text: "explained",
            whitespaceAfter: " ",
          },
          {
            index: 10,
            text: "on",
            whitespaceAfter: " ",
          },
          {
            index: 11,
            text: "the",
            whitespaceAfter: " ",
          },
          {
            index: 12,
            text: "first",
            whitespaceAfter: " ",
          },
          {
            index: 13,
            text: "day",
            whitespaceAfter: " ",
          },
          {
            index: 14,
            text: "were",
            whitespaceAfter: " ",
          },
          {
            index: 15,
            text: "helpful",
            whitespaceAfter: " ",
          },
          {
            index: 16,
            text: "for",
            whitespaceAfter: " ",
          },
          {
            index: 17,
            text: "everyone",
            whitespaceAfter: "",
          },
          {
            index: 18,
            text: ".",
            whitespaceAfter: "",
          },
        ],
        sentenceStructureElements: [
          {
            kind: "core-sentence-element",
            index: 0,
            startWordIndex: 0,
            endWordIndex: 3,
            sentenceElementName: "S",
          },
          {
            kind: "sentence-constituent",
            type: "modifier-phrase",
            index: 1,
            startWordIndex: 4,
            endWordIndex: 13,
            sentenceElementName: null,
          },
          {
            kind: "modification-element",
            index: 2,
            startWordIndex: 5,
            endWordIndex: 6,
          },
          {
            kind: "sentence-constituent",
            type: "clause",
            usage: "adjectival",
            index: 3,
            startWordIndex: 7,
            endWordIndex: 13,
            sentenceElementName: null,
          },
          {
            kind: "core-sentence-element",
            index: 4,
            startWordIndex: 7,
            endWordIndex: 8,
            sentenceElementName: "S",
          },
          {
            kind: "core-sentence-element",
            index: 5,
            startWordIndex: 9,
            endWordIndex: 9,
            sentenceElementName: "V",
          },
          {
            kind: "sentence-constituent",
            type: "modifier-phrase",
            index: 6,
            startWordIndex: 10,
            endWordIndex: 13,
            sentenceElementName: null,
          },
          {
            kind: "core-sentence-element",
            index: 7,
            startWordIndex: 14,
            endWordIndex: 14,
            sentenceElementName: "V",
          },
          {
            kind: "core-sentence-element",
            index: 8,
            startWordIndex: 15,
            endWordIndex: 15,
            sentenceElementName: "C",
          },
          {
            kind: "sentence-constituent",
            type: "modifier-phrase",
            index: 9,
            startWordIndex: 16,
            endWordIndex: 17,
            sentenceElementName: null,
          },
        ],
        modifications: [
          {
            modifierSentenceStructureElementIndex: 3,
            modifiedSentenceStructureElementIndex: 2,
          },
        ],
        coordinations: [],
      },
    ],
  },
  {
    sentences: [
      {
        words: [
          {
            index: 0,
            text: "When",
            whitespaceAfter: " ",
          },
          {
            index: 1,
            text: "the",
            whitespaceAfter: " ",
          },
          {
            index: 2,
            text: "weather",
            whitespaceAfter: " ",
          },
          {
            index: 3,
            text: "is",
            whitespaceAfter: " ",
          },
          {
            index: 4,
            text: "nice",
            whitespaceAfter: "",
          },
          {
            index: 5,
            text: ",",
            whitespaceAfter: " ",
          },
          {
            index: 6,
            text: "we",
            whitespaceAfter: " ",
          },
          {
            index: 7,
            text: "play",
            whitespaceAfter: " ",
          },
          {
            index: 8,
            text: "soccer",
            whitespaceAfter: " ",
          },
          {
            index: 9,
            text: "and",
            whitespaceAfter: " ",
          },
          {
            index: 10,
            text: "visit",
            whitespaceAfter: " ",
          },
          {
            index: 11,
            text: "our",
            whitespaceAfter: " ",
          },
          {
            index: 12,
            text: "friends",
            whitespaceAfter: " ",
          },
          {
            index: 13,
            text: "and",
            whitespaceAfter: " ",
          },
          {
            index: 14,
            text: "neighbors",
            whitespaceAfter: "",
          },
          {
            index: 15,
            text: ".",
            whitespaceAfter: "",
          },
        ],
        sentenceStructureElements: [
          {
            kind: "sentence-constituent",
            type: "clause",
            usage: "adverbial",
            index: 0,
            startWordIndex: 0,
            endWordIndex: 4,
            sentenceElementName: null,
          },
          {
            kind: "core-sentence-element",
            index: 1,
            startWordIndex: 1,
            endWordIndex: 2,
            sentenceElementName: "S",
          },
          {
            kind: "core-sentence-element",
            index: 2,
            startWordIndex: 3,
            endWordIndex: 3,
            sentenceElementName: "V",
          },
          {
            kind: "core-sentence-element",
            index: 3,
            startWordIndex: 4,
            endWordIndex: 4,
            sentenceElementName: "C",
          },
          {
            kind: "core-sentence-element",
            index: 4,
            startWordIndex: 6,
            endWordIndex: 6,
            sentenceElementName: "S",
          },
          {
            kind: "core-sentence-element",
            index: 5,
            startWordIndex: 7,
            endWordIndex: 7,
            sentenceElementName: "V",
          },
          {
            kind: "core-sentence-element",
            index: 6,
            startWordIndex: 8,
            endWordIndex: 8,
            sentenceElementName: "O",
          },
          {
            kind: "core-sentence-element",
            index: 7,
            startWordIndex: 10,
            endWordIndex: 10,
            sentenceElementName: "V",
          },
          {
            kind: "core-sentence-element",
            index: 8,
            startWordIndex: 12,
            endWordIndex: 12,
            sentenceElementName: "O",
          },
          {
            kind: "core-sentence-element",
            index: 9,
            startWordIndex: 14,
            endWordIndex: 14,
            sentenceElementName: "O",
          },
        ],
        modifications: [],
        coordinations: [
          {
            parts: [
              {
                type: "conjunct",
                startWordIndex: 7,
                endWordIndex: 8,
              },
              {
                type: "coordinator",
                startWordIndex: 9,
                endWordIndex: 9,
              },
              {
                type: "conjunct",
                startWordIndex: 10,
                endWordIndex: 14,
              },
            ],
          },
          {
            parts: [
              {
                type: "conjunct",
                startWordIndex: 12,
                endWordIndex: 12,
              },
              {
                type: "coordinator",
                startWordIndex: 13,
                endWordIndex: 13,
              },
              {
                type: "conjunct",
                startWordIndex: 14,
                endWordIndex: 14,
              },
            ],
          },
        ],
      },
    ],
  },
  {
    sentences: [
      {
        words: [
          {
            index: 0,
            text: "She",
            whitespaceAfter: " ",
          },
          {
            index: 1,
            text: "not",
            whitespaceAfter: " ",
          },
          {
            index: 2,
            text: "only",
            whitespaceAfter: " ",
          },
          {
            index: 3,
            text: "bought",
            whitespaceAfter: " ",
          },
          {
            index: 4,
            text: "apples",
            whitespaceAfter: "",
          },
          {
            index: 5,
            text: ",",
            whitespaceAfter: " ",
          },
          {
            index: 6,
            text: "oranges",
            whitespaceAfter: "",
          },
          {
            index: 7,
            text: ",",
            whitespaceAfter: " ",
          },
          {
            index: 8,
            text: "and",
            whitespaceAfter: " ",
          },
          {
            index: 9,
            text: "bananas",
            whitespaceAfter: "",
          },
          {
            index: 10,
            text: ",",
            whitespaceAfter: " ",
          },
          {
            index: 11,
            text: "but",
            whitespaceAfter: " ",
          },
          {
            index: 12,
            text: "also",
            whitespaceAfter: " ",
          },
          {
            index: 13,
            text: "got",
            whitespaceAfter: " ",
          },
          {
            index: 14,
            text: "some",
            whitespaceAfter: " ",
          },
          {
            index: 15,
            text: "bread",
            whitespaceAfter: " ",
          },
          {
            index: 16,
            text: "on",
            whitespaceAfter: " ",
          },
          {
            index: 17,
            text: "her",
            whitespaceAfter: " ",
          },
          {
            index: 18,
            text: "way",
            whitespaceAfter: " ",
          },
          {
            index: 19,
            text: "home",
            whitespaceAfter: "",
          },
          {
            index: 20,
            text: ".",
            whitespaceAfter: "",
          },
        ],
        sentenceStructureElements: [
          {
            kind: "core-sentence-element",
            index: 0,
            startWordIndex: 0,
            endWordIndex: 0,
            sentenceElementName: "S",
          },
          {
            kind: "core-sentence-element",
            index: 1,
            startWordIndex: 3,
            endWordIndex: 3,
            sentenceElementName: "V",
          },
          {
            kind: "core-sentence-element",
            index: 2,
            startWordIndex: 4,
            endWordIndex: 4,
            sentenceElementName: "O",
          },
          {
            kind: "core-sentence-element",
            index: 3,
            startWordIndex: 6,
            endWordIndex: 6,
            sentenceElementName: "O",
          },
          {
            kind: "core-sentence-element",
            index: 4,
            startWordIndex: 9,
            endWordIndex: 9,
            sentenceElementName: "O",
          },
          {
            kind: "core-sentence-element",
            index: 5,
            startWordIndex: 13,
            endWordIndex: 13,
            sentenceElementName: "V",
          },
          {
            kind: "core-sentence-element",
            index: 6,
            startWordIndex: 14,
            endWordIndex: 15,
            sentenceElementName: "O",
          },
          {
            kind: "sentence-constituent",
            type: "modifier-phrase",
            index: 7,
            startWordIndex: 16,
            endWordIndex: 19,
            sentenceElementName: null,
          },
        ],
        modifications: [],
        coordinations: [
          {
            parts: [
              {
                type: "correlative",
                startWordIndex: 1,
                endWordIndex: 2,
              },
              {
                type: "conjunct",
                startWordIndex: 3,
                endWordIndex: 10,
              },
              {
                type: "correlative",
                startWordIndex: 11,
                endWordIndex: 12,
              },
              {
                type: "conjunct",
                startWordIndex: 13,
                endWordIndex: 19,
              },
            ],
          },
          {
            parts: [
              {
                type: "conjunct",
                startWordIndex: 4,
                endWordIndex: 5,
              },
              {
                type: "conjunct",
                startWordIndex: 6,
                endWordIndex: 7,
              },
              {
                type: "coordinator",
                startWordIndex: 8,
                endWordIndex: 8,
              },
              {
                type: "conjunct",
                startWordIndex: 9,
                endWordIndex: 9,
              },
            ],
          },
        ],
      },
    ],
  },
  {
    sentences: [
      {
        words: [
          {
            index: 0,
            text: "My",
            whitespaceAfter: " ",
          },
          {
            index: 1,
            text: "little",
            whitespaceAfter: " ",
          },
          {
            index: 2,
            text: "brother",
            whitespaceAfter: " ",
          },
          {
            index: 3,
            text: "is",
            whitespaceAfter: " ",
          },
          {
            index: 4,
            text: "apt",
            whitespaceAfter: " ",
          },
          {
            index: 5,
            text: "to",
            whitespaceAfter: " ",
          },
          {
            index: 6,
            text: "keep",
            whitespaceAfter: " ",
          },
          {
            index: 7,
            text: "everyone",
            whitespaceAfter: " ",
          },
          {
            index: 8,
            text: "laughing",
            whitespaceAfter: " ",
          },
          {
            index: 9,
            text: "with",
            whitespaceAfter: " ",
          },
          {
            index: 10,
            text: "his",
            whitespaceAfter: " ",
          },
          {
            index: 11,
            text: "funny",
            whitespaceAfter: " ",
          },
          {
            index: 12,
            text: "stories",
            whitespaceAfter: "",
          },
          {
            index: 13,
            text: ".",
            whitespaceAfter: "",
          },
        ],
        sentenceStructureElements: [
          {
            kind: "core-sentence-element",
            index: 0,
            startWordIndex: 0,
            endWordIndex: 2,
            sentenceElementName: "S",
          },
          {
            kind: "core-sentence-element",
            index: 1,
            startWordIndex: 3,
            endWordIndex: 6,
            sentenceElementName: "V",
          },
          {
            kind: "core-sentence-element",
            index: 2,
            startWordIndex: 7,
            endWordIndex: 7,
            sentenceElementName: "O",
          },
          {
            kind: "sentence-constituent",
            type: "verbal-phrase",
            usage: "adjectival",
            index: 3,
            startWordIndex: 8,
            endWordIndex: 8,
            sentenceElementName: "C",
          },
          {
            kind: "core-sentence-element",
            index: 4,
            startWordIndex: 8,
            endWordIndex: 8,
            sentenceElementName: "V",
          },
          {
            kind: "sentence-constituent",
            type: "modifier-phrase",
            index: 5,
            startWordIndex: 9,
            endWordIndex: 12,
            sentenceElementName: null,
          },
        ],
        modifications: [],
        coordinations: [],
      },
    ],
  },
  {
    sentences: [
      {
        words: [
          {
            index: 0,
            text: "Our",
            whitespaceAfter: " ",
          },
          {
            index: 1,
            text: "guide",
            whitespaceAfter: " ",
          },
          {
            index: 2,
            text: "made",
            whitespaceAfter: " ",
          },
          {
            index: 3,
            text: "it",
            whitespaceAfter: " ",
          },
          {
            index: 4,
            text: "clear",
            whitespaceAfter: " ",
          },
          {
            index: 5,
            text: "that",
            whitespaceAfter: " ",
          },
          {
            index: 6,
            text: "the",
            whitespaceAfter: " ",
          },
          {
            index: 7,
            text: "walk",
            whitespaceAfter: " ",
          },
          {
            index: 8,
            text: "was",
            whitespaceAfter: " ",
          },
          {
            index: 9,
            text: "not",
            whitespaceAfter: " ",
          },
          {
            index: 10,
            text: "a",
            whitespaceAfter: " ",
          },
          {
            index: 11,
            text: "race",
            whitespaceAfter: " ",
          },
          {
            index: 12,
            text: "but",
            whitespaceAfter: " ",
          },
          {
            index: 13,
            text: "a",
            whitespaceAfter: " ",
          },
          {
            index: 14,
            text: "chance",
            whitespaceAfter: " ",
          },
          {
            index: 15,
            text: "to",
            whitespaceAfter: " ",
          },
          {
            index: 16,
            text: "enjoy",
            whitespaceAfter: " ",
          },
          {
            index: 17,
            text: "the",
            whitespaceAfter: " ",
          },
          {
            index: 18,
            text: "view",
            whitespaceAfter: "",
          },
          {
            index: 19,
            text: ".",
            whitespaceAfter: "",
          },
        ],
        sentenceStructureElements: [
          {
            kind: "core-sentence-element",
            index: 0,
            startWordIndex: 0,
            endWordIndex: 1,
            sentenceElementName: "S",
          },
          {
            kind: "core-sentence-element",
            index: 1,
            startWordIndex: 2,
            endWordIndex: 2,
            sentenceElementName: "V",
          },
          {
            kind: "core-sentence-element",
            index: 2,
            startWordIndex: 3,
            endWordIndex: 3,
            sentenceElementName: "O",
          },
          {
            kind: "core-sentence-element",
            index: 3,
            startWordIndex: 4,
            endWordIndex: 4,
            sentenceElementName: "C",
          },
          {
            kind: "sentence-constituent",
            type: "clause",
            usage: "nominal",
            index: 4,
            startWordIndex: 5,
            endWordIndex: 18,
            sentenceElementName: "O",
          },
          {
            kind: "core-sentence-element",
            index: 5,
            startWordIndex: 6,
            endWordIndex: 7,
            sentenceElementName: "S",
          },
          {
            kind: "core-sentence-element",
            index: 6,
            startWordIndex: 8,
            endWordIndex: 8,
            sentenceElementName: "V",
          },
          {
            kind: "core-sentence-element",
            index: 7,
            startWordIndex: 10,
            endWordIndex: 11,
            sentenceElementName: "C",
          },
          {
            kind: "core-sentence-element",
            index: 8,
            startWordIndex: 13,
            endWordIndex: 14,
            sentenceElementName: "C",
          },
          {
            kind: "sentence-constituent",
            type: "verbal-phrase",
            usage: "adjectival",
            index: 9,
            startWordIndex: 15,
            endWordIndex: 18,
            sentenceElementName: null,
          },
          {
            kind: "core-sentence-element",
            index: 10,
            startWordIndex: 16,
            endWordIndex: 16,
            sentenceElementName: "V",
          },
          {
            kind: "core-sentence-element",
            index: 11,
            startWordIndex: 17,
            endWordIndex: 18,
            sentenceElementName: "O",
          },
        ],
        modifications: [
          {
            modifierSentenceStructureElementIndex: 9,
            modifiedSentenceStructureElementIndex: 8,
          },
        ],
        coordinations: [
          {
            parts: [
              {
                type: "correlative",
                startWordIndex: 9,
                endWordIndex: 9,
              },
              {
                type: "conjunct",
                startWordIndex: 10,
                endWordIndex: 11,
              },
              {
                type: "correlative",
                startWordIndex: 12,
                endWordIndex: 12,
              },
              {
                type: "conjunct",
                startWordIndex: 13,
                endWordIndex: 18,
              },
            ],
          },
        ],
      },
    ],
  },
  {
    sentences: [
      {
        words: [
          {
            index: 0,
            text: "Tom",
            whitespaceAfter: "",
          },
          {
            index: 1,
            text: ",",
            whitespaceAfter: " ",
          },
          {
            index: 2,
            text: "my",
            whitespaceAfter: " ",
          },
          {
            index: 3,
            text: "brother",
            whitespaceAfter: "",
          },
          {
            index: 4,
            text: ",",
            whitespaceAfter: " ",
          },
          {
            index: 5,
            text: "shared",
            whitespaceAfter: " ",
          },
          {
            index: 6,
            text: "the",
            whitespaceAfter: " ",
          },
          {
            index: 7,
            text: "good",
            whitespaceAfter: " ",
          },
          {
            index: 8,
            text: "news",
            whitespaceAfter: " ",
          },
          {
            index: 9,
            text: "that",
            whitespaceAfter: " ",
          },
          {
            index: 10,
            text: "our",
            whitespaceAfter: " ",
          },
          {
            index: 11,
            text: "aunt",
            whitespaceAfter: " ",
          },
          {
            index: 12,
            text: "would",
            whitespaceAfter: " ",
          },
          {
            index: 13,
            text: "visit",
            whitespaceAfter: " ",
          },
          {
            index: 14,
            text: "us",
            whitespaceAfter: " ",
          },
          {
            index: 15,
            text: "on",
            whitespaceAfter: " ",
          },
          {
            index: 16,
            text: "Sunday",
            whitespaceAfter: "",
          },
          {
            index: 17,
            text: ".",
            whitespaceAfter: "",
          },
        ],
        sentenceStructureElements: [
          {
            kind: "core-sentence-element",
            index: 0,
            startWordIndex: 0,
            endWordIndex: 0,
            sentenceElementName: "S",
          },
          {
            kind: "core-sentence-element",
            index: 1,
            startWordIndex: 5,
            endWordIndex: 5,
            sentenceElementName: "V",
          },
          {
            kind: "core-sentence-element",
            index: 2,
            startWordIndex: 6,
            endWordIndex: 8,
            sentenceElementName: "O",
          },
          {
            kind: "sentence-constituent",
            type: "clause",
            usage: "nominal",
            index: 3,
            startWordIndex: 9,
            endWordIndex: 16,
            sentenceElementName: null,
          },
          {
            kind: "core-sentence-element",
            index: 4,
            startWordIndex: 10,
            endWordIndex: 11,
            sentenceElementName: "S",
          },
          {
            kind: "core-sentence-element",
            index: 5,
            startWordIndex: 12,
            endWordIndex: 13,
            sentenceElementName: "V",
          },
          {
            kind: "core-sentence-element",
            index: 6,
            startWordIndex: 14,
            endWordIndex: 14,
            sentenceElementName: "O",
          },
          {
            kind: "sentence-constituent",
            type: "modifier-phrase",
            index: 7,
            startWordIndex: 15,
            endWordIndex: 16,
            sentenceElementName: null,
          },
        ],
        modifications: [],
        coordinations: [],
      },
    ],
  },
] satisfies SimplifiedSentenceStructureDocument[];
