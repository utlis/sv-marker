from fastapi import Body, FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
from typing import Annotated, Literal
from pydantic import BaseModel
import stanza

app = FastAPI()

origins = [
    os.getenv("WEB_ORIGIN"),
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_methods=["*"],
)

stanza.download(
    "en",
    processors="tokenize,mwt,pos,lemma,depparse,constituency",
    package="default_accurate",
)

nlp = stanza.Pipeline(
    "en",
    processors="tokenize,mwt,pos,lemma,depparse,constituency",
    package="default_accurate",
    download_method=None,
)


class Word(BaseModel):
    id: int
    text: str
    lemma: str
    upos: Literal[
        # See https://universaldependencies.org/u/pos/
        #
        # Extracted by:
        # print(
        #     torch.load(
        #         ".../stanza/1.11.0/resources/en/pos/combined_electra-large.pt",
        #         map_location=torch.device("cpu"),
        #     )["vocab"]["upos"]["_id2unit"]
        # )
        "ADJ",  # adjective
        "ADP",  # adposition
        "ADV",  # adverb
        "AUX",  # auxiliary
        "CCONJ",  # coordinating conjunction
        "DET",  # determiner
        "INTJ",  # interjection
        "NOUN",  # noun
        "NUM",  # numeral
        "PART",  # particle
        "PRON",  # pronoun
        "PROPN",  # proper noun
        "PUNCT",  # punctuation
        "SCONJ",  # subordinating conjunction
        "SYM",  # symbol
        "VERB",  # verb
        "X",  # other
    ]
    xpos: str
    feats: str | None
    head: int
    deprel: Literal[
        # See
        # - https://stanfordnlp.github.io/stanza/combined_models.html#combined-models
        # - https://universaldependencies.org/treebanks/en_ewt/index.html#relations
        # - https://universaldependencies.org/treebanks/en_gum/index.html#relations
        # - https://universaldependencies.org/treebanks/en_gumreddit/index.html#relations
        # - https://universaldependencies.org/treebanks/en_pud/index.html#relations
        # - https://universaldependencies.org/treebanks/en_pronouns/index.html#relations
        # - https://universaldependencies.org/u/dep/
        #
        # Extracted by:
        # print(
        #     torch.load(
        #         ".../stanza/1.11.0/resources/en/depparse/combined_electra-large.pt",
        #         map_location=torch.device("cpu"),
        #     )["vocab"]["deprel"]["_id2unit"]
        # )
        "acl",  # clausal modifier of noun (adnominal clause)
        "acl:relcl",  # relative clause modifier
        "advcl",  # adverbial clause modifier
        "advcl:relcl",  # adverbial relative clause modifier
        "advmod",  # adverbial modifier
        "amod",  # adjectival modifier
        "appos",  # appositional modifier
        "aux",  # auxiliary
        "aux:pass",  # passive auxiliary
        "case",  # case marking
        "cc",  # coordinating conjunction
        "cc:preconj",  # preconjunct
        "ccomp",  # clausal complement
        "compound",  # compound
        "compound:prt",  # phrasal verb particle
        "conj",  # conjunct
        "cop",  # copula
        "csubj",  # clausal subject
        "csubj:outer",  # outer clause clausal subject
        "csubj:pass",  # clausal passive subject
        "dep",  # unspecified dependency
        "det",  # determiner
        "det:predet",
        "discourse",  # discourse element
        "dislocated",  # dislocated elements
        "expl",  # expletive
        "fixed",  # fixed multiword expression
        "flat",  # flat expression
        "goeswith",  # goes with
        "iobj",  # indirect object
        "list",  # list
        "mark",  # marker
        "nmod",  # nominal modifier
        "nmod:desc",
        "nmod:poss",  # possessive nominal modifier
        "nmod:unmarked",
        "nsubj",  # nominal subject
        "nsubj:outer",  # outer clause nominal subject
        "nsubj:pass",  # passive nominal subject
        "nummod",  # numeric modifier
        "obj",  # object
        "obl",  # oblique nominal
        "obl:agent",  # oblique agent in passive construction
        "obl:npmod",
        "obl:tmod",  # temporal modifier
        "obl:unmarked",
        "orphan",  # orphan
        "parataxis",  # parataxis
        "punct",  # punctuation
        "reparandum",  # overridden disfluency
        "root",  # root
        "vocative",  # vocative
        "xcomp",  # open clausal complement
    ]


class Token(BaseModel):
    text: str
    words: list["Word"]
    spaces_after: str
    spaces_before: str


class ParseTree(BaseModel):
    label: (
        # See
        # - https://stanfordnlp.github.io/stanza/constituency.html#english
        # - https://aclanthology.org/J93-2004/
        Literal[
            # Extracted by:
            # print(
            #     torch.load(
            #         ".../stanza/1.11.0/resources/en/constituency/ptb3-revised_electra-large.pt",
            #         map_location=torch.device("cpu"),
            #     )["params"]["constituents"]
            # )
            "ADJP",  # Adjective phrase
            "ADVP",  # Adverb phrase
            "CONJP",
            "FRAG",
            "INTJ",
            "LST",
            "NAC",
            "NML",
            "NP",  # Noun phrase
            "PP",  # Prepositional phrase
            "PRN",
            "PRT",
            "QP",
            "ROOT",
            "RRC",
            "S",  # Simple declarative clause
            "SBAR",  # Clause introduced by subordinating conjunction or 0
            "SBARQ",  # Direct question introduced by wh-word or wh-phrase
            "SINV",  # Declarative sentence with subject-aux inversion
            "SQ",  # Subconstituent of SBARQ excluding wh-word or wh-phrase
            "UCP",
            "VP",  # Verb phrase
            "WHADJP",
            "WHADVP",  # wh-adverb phrase
            "WHNP",  # wh-noun phrase
            "WHPP",  # wh-prepositional phrase
            "X",  # Constituent of unknown or uncertain category
        ]
        | Literal[
            # Extracted by:
            # print(
            #     torch.load(
            #         ".../stanza/1.11.0/resources/en/constituency/ptb3-revised_electra-large.pt",
            #         map_location=torch.device("cpu"),
            #     )["params"]["tags"]
            # )
            "$",  # Dollar sign
            "''",
            ",",  # Comma
            "-LRB-",
            "-RRB-",
            ".",  # Sentence-final punctuation
            ":",  # Colon, semi-colon
            "ADD",
            "AFX",
            "CC",  # Coordinating conjunction
            "CD",  # Cardinal number
            "DT",  # Determiner
            "EX",  # Existential there
            "FW",  # Foreign word
            "HYPH",
            "IN",  # Preposition/subordinating conjunction
            "JJ",  # Adjective
            "JJR",  # Adjective, comparative
            "JJS",  # Adjective, superlative
            "LS",  # List item marker
            "MD",  # Modal
            "NFP",
            "NN",  # Noun, singular or mass
            "NNP",  # Proper noun, singular
            "NNPS",  # Proper noun, plural
            "NNS",  # Noun, plural
            "PDT",  # Predeterminer
            "POS",  # Possessive ending
            "PRP",  # Personal pronoun
            "PRP$",
            "RB",  # Adverb
            "RBR",  # Adverb, comparative
            "RBS",  # Adverb, superlative
            "RP",  # Particle
            "SYM",  # Symbol (mathematical or scientific)
            "TO",  # to
            "UH",  # Interjection
            "VB",  # Verb, base form
            "VBD",  # Verb, past tense
            "VBG",  # Verb, gerund/present participle
            "VBN",  # Verb, past participle
            "VBP",  # Verb, non-3rd ps. sing. present
            "VBZ",  # Verb, 3rd ps. sing. present
            "WDT",  # wh-determiner
            "WP",  # wh-pronoun
            "WP$",  # Possessive wh-pronoun
            "WRB",  # wh-adverb
            "``",
        ]
        | str
    )
    children: list["ParseTree"]


class Sentence(BaseModel):
    text: str
    tokens: list["Token"]
    constituency: "ParseTree"


class Document(BaseModel):
    text: str
    sentences: list["Sentence"]


@app.post("/")
def parse(text: Annotated[str, Body(embed=True)]) -> Document:
    doc = nlp(text)

    def convert_constituency(constituency) -> ParseTree:
        return ParseTree(
            label=constituency.label,
            children=[convert_constituency(child) for child in constituency.children],
        )

    return Document(
        text=doc.text,
        sentences=[
            Sentence(
                text=sentence.text,
                tokens=[
                    Token(
                        text=token.text,
                        words=[
                            Word(
                                id=word.id,
                                text=word.text,
                                lemma=word.lemma,
                                upos=word.upos,
                                xpos=word.xpos,
                                feats=word.feats,
                                head=word.head,
                                deprel=word.deprel,
                            )
                            for word in token.words
                        ],
                        spaces_after=token.spaces_after,
                        spaces_before=token.spaces_before,
                    )
                    for token in sentence.tokens
                ],
                constituency=convert_constituency(sentence.constituency),
            )
            for sentence in doc.sentences
        ],
    )
