import type { SimplifiedSentenceStructureData } from "@sentence-structure-diagram-app/sentence-structure-data";

export const examples: SimplifiedSentenceStructureData[] = [
  {
    text: "The girl who likes to draw pictures after school has been quietly improving her skills for the past two years.",
    words: [
      {
        index: 0,
        text: "The",
      },
      {
        index: 1,
        text: "girl",
      },
      {
        index: 2,
        text: "who",
      },
      {
        index: 3,
        text: "likes",
      },
      {
        index: 4,
        text: "to",
      },
      {
        index: 5,
        text: "draw",
      },
      {
        index: 6,
        text: "pictures",
      },
      {
        index: 7,
        text: "after",
      },
      {
        index: 8,
        text: "school",
      },
      {
        index: 9,
        text: "has",
      },
      {
        index: 10,
        text: "been",
      },
      {
        index: 11,
        text: "quietly",
      },
      {
        index: 12,
        text: "improving",
      },
      {
        index: 13,
        text: "her",
      },
      {
        index: 14,
        text: "skills",
      },
      {
        index: 15,
        text: "for",
      },
      {
        index: 16,
        text: "the",
      },
      {
        index: 17,
        text: "past",
      },
      {
        index: 18,
        text: "two",
      },
      {
        index: 19,
        text: "years",
      },
      {
        index: 20,
        text: ".",
      },
    ],
    ranges: [
      {
        type: "文の主要素",
        index: 0,
        startWordIndex: 0,
        endWordIndex: 1,
        sentenceElementName: "S",
      },
      {
        type: "節",
        index: 1,
        startWordIndex: 2,
        endWordIndex: 8,
        sentenceElementName: "M",
      },
      {
        type: "文の主要素",
        index: 2,
        startWordIndex: 3,
        endWordIndex: 3,
        sentenceElementName: "V",
      },
      {
        type: "句",
        index: 3,
        startWordIndex: 4,
        endWordIndex: 8,
        sentenceElementName: "O",
      },
      {
        type: "文の主要素",
        index: 4,
        startWordIndex: 5,
        endWordIndex: 5,
        sentenceElementName: "V",
      },
      {
        type: "文の主要素",
        index: 5,
        startWordIndex: 6,
        endWordIndex: 6,
        sentenceElementName: "O",
      },
      {
        type: "修飾語",
        index: 6,
        startWordIndex: 7,
        endWordIndex: 8,
        sentenceElementName: "M",
      },
      {
        type: "文の主要素",
        index: 7,
        startWordIndex: 9,
        endWordIndex: 12,
        sentenceElementName: "V",
      },
      {
        type: "修飾語",
        index: 8,
        startWordIndex: 11,
        endWordIndex: 11,
        sentenceElementName: "M",
      },
      {
        type: "文の主要素",
        index: 9,
        startWordIndex: 13,
        endWordIndex: 14,
        sentenceElementName: "O",
      },
      {
        type: "修飾語",
        index: 10,
        startWordIndex: 15,
        endWordIndex: 19,
        sentenceElementName: "M",
      },
    ],
    relations: [
      {
        fromRangeIndex: 1,
        toRangeIndex: 0,
      },
    ],
    coordinations: [],
  },
  {
    text: "The detailed handwritten notes from the lesson the teacher explained on the first day were helpful for everyone.",
    words: [
      {
        index: 0,
        text: "The",
      },
      {
        index: 1,
        text: "detailed",
      },
      {
        index: 2,
        text: "handwritten",
      },
      {
        index: 3,
        text: "notes",
      },
      {
        index: 4,
        text: "from",
      },
      {
        index: 5,
        text: "the",
      },
      {
        index: 6,
        text: "lesson",
      },
      {
        index: 7,
        text: "the",
      },
      {
        index: 8,
        text: "teacher",
      },
      {
        index: 9,
        text: "explained",
      },
      {
        index: 10,
        text: "on",
      },
      {
        index: 11,
        text: "the",
      },
      {
        index: 12,
        text: "first",
      },
      {
        index: 13,
        text: "day",
      },
      {
        index: 14,
        text: "were",
      },
      {
        index: 15,
        text: "helpful",
      },
      {
        index: 16,
        text: "for",
      },
      {
        index: 17,
        text: "everyone",
      },
      {
        index: 18,
        text: ".",
      },
    ],
    ranges: [
      {
        type: "文の主要素",
        index: 0,
        startWordIndex: 0,
        endWordIndex: 3,
        sentenceElementName: "S",
      },
      {
        type: "修飾語",
        index: 1,
        startWordIndex: 4,
        endWordIndex: 13,
        sentenceElementName: "M",
      },
      {
        type: "節",
        index: 2,
        startWordIndex: 7,
        endWordIndex: 13,
        sentenceElementName: "M",
      },
      {
        type: "文の主要素",
        index: 3,
        startWordIndex: 7,
        endWordIndex: 8,
        sentenceElementName: "S",
      },
      {
        type: "文の主要素",
        index: 4,
        startWordIndex: 9,
        endWordIndex: 9,
        sentenceElementName: "V",
      },
      {
        type: "修飾語",
        index: 5,
        startWordIndex: 10,
        endWordIndex: 13,
        sentenceElementName: "M",
      },
      {
        type: "文の主要素",
        index: 6,
        startWordIndex: 14,
        endWordIndex: 14,
        sentenceElementName: "V",
      },
      {
        type: "文の主要素",
        index: 7,
        startWordIndex: 15,
        endWordIndex: 15,
        sentenceElementName: "C",
      },
      {
        type: "修飾語",
        index: 8,
        startWordIndex: 16,
        endWordIndex: 17,
        sentenceElementName: "M",
      },
      {
        type: "関係",
        index: 9,
        startWordIndex: 5,
        endWordIndex: 6,
      },
    ],
    relations: [
      {
        fromRangeIndex: 2,
        toRangeIndex: 9,
      },
    ],
    coordinations: [],
  },
  {
    text: "When the weather is nice, we play soccer and visit our friends and neighbors.",
    words: [
      {
        index: 0,
        text: "When",
      },
      {
        index: 1,
        text: "the",
      },
      {
        index: 2,
        text: "weather",
      },
      {
        index: 3,
        text: "is",
      },
      {
        index: 4,
        text: "nice",
      },
      {
        index: 5,
        text: ",",
      },
      {
        index: 6,
        text: "we",
      },
      {
        index: 7,
        text: "play",
      },
      {
        index: 8,
        text: "soccer",
      },
      {
        index: 9,
        text: "and",
      },
      {
        index: 10,
        text: "visit",
      },
      {
        index: 11,
        text: "our",
      },
      {
        index: 12,
        text: "friends",
      },
      {
        index: 13,
        text: "and",
      },
      {
        index: 14,
        text: "neighbors",
      },
      {
        index: 15,
        text: ".",
      },
    ],
    ranges: [
      {
        type: "節",
        index: 0,
        startWordIndex: 0,
        endWordIndex: 4,
        sentenceElementName: "M",
      },
      {
        type: "文の主要素",
        index: 1,
        startWordIndex: 1,
        endWordIndex: 2,
        sentenceElementName: "S",
      },
      {
        type: "文の主要素",
        index: 2,
        startWordIndex: 3,
        endWordIndex: 3,
        sentenceElementName: "V",
      },
      {
        type: "文の主要素",
        index: 3,
        startWordIndex: 4,
        endWordIndex: 4,
        sentenceElementName: "C",
      },
      {
        type: "文の主要素",
        index: 4,
        startWordIndex: 6,
        endWordIndex: 6,
        sentenceElementName: "S",
      },
      {
        type: "文の主要素",
        index: 5,
        startWordIndex: 7,
        endWordIndex: 7,
        sentenceElementName: "V",
      },
      {
        type: "文の主要素",
        index: 6,
        startWordIndex: 8,
        endWordIndex: 8,
        sentenceElementName: "O",
      },
      {
        type: "文の主要素",
        index: 7,
        startWordIndex: 10,
        endWordIndex: 10,
        sentenceElementName: "V",
      },
      {
        type: "文の主要素",
        index: 8,
        startWordIndex: 12,
        endWordIndex: 12,
        sentenceElementName: "O",
      },
      {
        type: "文の主要素",
        index: 9,
        startWordIndex: 14,
        endWordIndex: 14,
        sentenceElementName: "O",
      },
    ],
    relations: [],
    coordinations: [
      {
        children: [
          {
            type: "並列要素",
            startWordIndex: 7,
            endWordIndex: 8,
          },
          {
            type: "等位接続詞",
            startWordIndex: 9,
            endWordIndex: 9,
          },
          {
            type: "並列要素",
            startWordIndex: 10,
            endWordIndex: 14,
          },
        ],
      },
      {
        children: [
          {
            type: "並列要素",
            startWordIndex: 12,
            endWordIndex: 12,
          },
          {
            type: "等位接続詞",
            startWordIndex: 13,
            endWordIndex: 13,
          },
          {
            type: "並列要素",
            startWordIndex: 14,
            endWordIndex: 14,
          },
        ],
      },
    ],
  },
  {
    text: "She not only bought apples, oranges, and bananas, but also got some bread on her way home.",
    words: [
      {
        index: 0,
        text: "She",
      },
      {
        index: 1,
        text: "not",
      },
      {
        index: 2,
        text: "only",
      },
      {
        index: 3,
        text: "bought",
      },
      {
        index: 4,
        text: "apples",
      },
      {
        index: 5,
        text: ",",
      },
      {
        index: 6,
        text: "oranges",
      },
      {
        index: 7,
        text: ",",
      },
      {
        index: 8,
        text: "and",
      },
      {
        index: 9,
        text: "bananas",
      },
      {
        index: 10,
        text: ",",
      },
      {
        index: 11,
        text: "but",
      },
      {
        index: 12,
        text: "also",
      },
      {
        index: 13,
        text: "got",
      },
      {
        index: 14,
        text: "some",
      },
      {
        index: 15,
        text: "bread",
      },
      {
        index: 16,
        text: "on",
      },
      {
        index: 17,
        text: "her",
      },
      {
        index: 18,
        text: "way",
      },
      {
        index: 19,
        text: "home",
      },
      {
        index: 20,
        text: ".",
      },
    ],
    ranges: [
      {
        type: "文の主要素",
        index: 0,
        startWordIndex: 0,
        endWordIndex: 0,
        sentenceElementName: "S",
      },
      {
        type: "文の主要素",
        index: 1,
        startWordIndex: 3,
        endWordIndex: 3,
        sentenceElementName: "V",
      },
      {
        type: "文の主要素",
        index: 2,
        startWordIndex: 4,
        endWordIndex: 4,
        sentenceElementName: "O",
      },
      {
        type: "文の主要素",
        index: 3,
        startWordIndex: 6,
        endWordIndex: 6,
        sentenceElementName: "O",
      },
      {
        type: "文の主要素",
        index: 4,
        startWordIndex: 9,
        endWordIndex: 9,
        sentenceElementName: "O",
      },
      {
        type: "文の主要素",
        index: 5,
        startWordIndex: 13,
        endWordIndex: 13,
        sentenceElementName: "V",
      },
      {
        type: "文の主要素",
        index: 6,
        startWordIndex: 14,
        endWordIndex: 15,
        sentenceElementName: "O",
      },
      {
        type: "修飾語",
        index: 7,
        startWordIndex: 16,
        endWordIndex: 19,
        sentenceElementName: "M",
      },
    ],
    relations: [],
    coordinations: [
      {
        children: [
          {
            type: "相関接続詞",
            startWordIndex: 1,
            endWordIndex: 2,
          },
          {
            type: "並列要素",
            startWordIndex: 3,
            endWordIndex: 10,
          },
          {
            type: "相関接続詞",
            startWordIndex: 11,
            endWordIndex: 12,
          },
          {
            type: "並列要素",
            startWordIndex: 13,
            endWordIndex: 19,
          },
        ],
      },
      {
        children: [
          {
            type: "並列要素",
            startWordIndex: 4,
            endWordIndex: 5,
          },
          {
            type: "並列要素",
            startWordIndex: 6,
            endWordIndex: 7,
          },
          {
            type: "等位接続詞",
            startWordIndex: 8,
            endWordIndex: 8,
          },
          {
            type: "並列要素",
            startWordIndex: 9,
            endWordIndex: 9,
          },
        ],
      },
    ],
  },
] satisfies SimplifiedSentenceStructureData[];
