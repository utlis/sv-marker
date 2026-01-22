import * as z from "zod";
import { loadPyodide } from "pyodide";

// See https://universaldependencies.org/u/pos/
const posSchema = z.literal([
  "ADJ", // adjective
  "ADP", // adposition
  "ADV", // adverb
  "AUX", // auxiliary
  "CCONJ", // coordinating conjunction
  "DET", // determiner
  "INTJ", // interjection
  "NOUN", // noun
  "NUM", // numeral
  "PART", // particle
  "PRON", // pronoun
  "PROPN", // proper noun
  "PUNCT", // punctuation
  "SCONJ", // subordinating conjunction
  "SYM", // symbol
  "VERB", // verb
  "X", // other
]);

// See https://spacy.io/models/en https://github.com/explosion/spaCy/blob/453732d32d55029ea9787ef737c8cf8d626f45b0/spacy/glossary.py#L206-L279
const DependencyLabelSchema = z.literal([
  "ROOT", // root
  "acl", // clausal modifier of noun (adjectival clause)
  "acomp", // adjectival complement
  "advcl", // adverbial clause modifier
  "advmod", // adverbial modifier
  "agent", // agent
  "amod", // adjectival modifier
  "appos", // appositional modifier
  "attr", // attribute
  "aux", // auxiliary
  "auxpass", // auxiliary (passive)
  "case", // case marking
  "cc", // coordinating conjunction
  "ccomp", // clausal complement
  "compound", // compound
  "conj", // conjunct
  "csubj", // clausal subject
  "csubjpass", // clausal subject (passive)
  "dative", // dative
  "dep", // unclassified dependent
  "det", // determiner
  "dobj", // direct object
  "expl", // expletive
  "intj", // interjection
  "mark", // marker
  "meta", // meta modifier
  "neg", // negation modifier
  "nmod", // modifier of nominal
  "npadvmod", // noun phrase as adverbial modifier
  "nsubj", // nominal subject
  "nsubjpass", // nominal subject (passive)
  "nummod", // numeric modifier
  "oprd", // object predicate
  "parataxis", // parataxis
  "pcomp", // complement of preposition
  "pobj", // object of preposition
  "poss", // possession modifier
  "preconj", // pre-correlative conjunction
  "predet", // None
  "prep", // prepositional modifier
  "prt", // particle
  "punct", // punctuation
  "quantmod", // modifier of quantifier
  "relcl", // relative clause modifier
  "xcomp", // open clausal complement
]);

// See https://universaldependencies.org/u/feat/VerbForm.html
const VerbFormSchema = z.literal([
  "Fin", // finite verb
  "Inf", // infinitive
  "Part", // participle, verbal adjective
  "Ger", // gerund
]);

const TokenSchema = z.object({
  index: z.int().nonnegative(),
  text: z.string(),
  pos: posSchema,
  headTokenIndex: z.int().nonnegative(),
  dependencyLabel: DependencyLabelSchema,
  verbForm: z.nullable(VerbFormSchema),
  subtreeIndices: z.array(z.int().nonnegative()).min(1),
});
export type Token = z.infer<typeof TokenSchema>;

const SpacyParseResultSchema = z.object({
  tokens: z.array(TokenSchema),
  nounChunks: z.array(
    z.object({
      text: z.string(),
      startIndex: z.int().nonnegative(),
      endIndex: z.int().nonnegative(),
    }),
  ),
});
export type SpacyParseResult = z.infer<typeof SpacyParseResultSchema>;

type Parser = {
  parse: (text: string) => SpacyParseResult;
};

export async function createSpacyParser(
  resolveWheelURL: (wheelFileName: string) => URL,
  options?: {
    indexURL?: string;
  },
): Promise<Parser> {
  const pyodide = await loadPyodide(options);
  await pyodide.loadPackage("micropip");
  const micropip = pyodide.pyimport("micropip");
  await micropip.install([
    resolveWheelURL("murmurhash-1.0.15-cp313-cp313-pyodide_2025_0_wasm32.whl")
      .href,
    resolveWheelURL("cymem-2.0.13-cp313-cp313-pyodide_2025_0_wasm32.whl").href,
    resolveWheelURL("preshed-3.0.12-cp313-cp313-pyodide_2025_0_wasm32.whl")
      .href,
    resolveWheelURL("blis-1.3.3-cp313-cp313-pyodide_2025_0_wasm32.whl").href,
    resolveWheelURL("srsly-2.5.2-cp313-cp313-pyodide_2025_0_wasm32.whl").href,
    resolveWheelURL("thinc-8.3.10-cp313-cp313-pyodide_2025_0_wasm32.whl").href,
    resolveWheelURL("spacy-3.8.11-cp313-cp313-pyodide_2025_0_wasm32.whl").href,
    resolveWheelURL("en_core_web_sm-3.8.0-py3-none-any.whl").href,
  ]);
  return {
    parse: (text: string) =>
      SpacyParseResultSchema.parse(
        pyodide.runPython(`
          from pyodide.ffi import to_js, jsnull
          import spacy

          nlp = spacy.load("en_core_web_sm")

          def dependencyParse(text):
            doc = nlp(text)
            return to_js(
              {
                "tokens": [
                  {
                    "index": token.i,
                    "text": token.text,
                    "pos": token.pos_,
                    "headTokenIndex": token.head.i,
                    "dependencyLabel": token.dep_,
                    "verbForm": token.morph.to_dict().get("VerbForm") or jsnull,
                    "subtreeIndices": [subtree_token.i for subtree_token in token.subtree],
                  }
                  for token in doc
                ],
                "nounChunks": [
                  {
                    "text": noun_chunk.text,
                    "startIndex": noun_chunk.start,
                    "endIndex": noun_chunk.end,
                  }
                  for noun_chunk in doc.noun_chunks
                ],
              }
            )

          dependencyParse
        `)(text),
      ),
  };
}
