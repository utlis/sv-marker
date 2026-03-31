from fastapi import Body, Request, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import os
from typing import Annotated, Literal
from pydantic import BaseModel
import stanza


@asynccontextmanager
async def lifespan(app: FastAPI):
    stanza.download(
        "en",
        processors="tokenize,mwt,pos,lemma,depparse,constituency",
        package="default_accurate",
    )

    app.state.nlp = stanza.Pipeline(
        "en",
        processors="tokenize,mwt,pos,lemma,depparse,constituency",
        package="default_accurate",
        download_method=None,
    )

    yield


app = FastAPI(lifespan=lifespan)

origins = [
    os.getenv("WEB_ORIGIN"),
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_methods=["*"],
)


class StanzaTokenizedWord(BaseModel):
    id: int
    text: str


class StanzaTokenizedToken(BaseModel):
    text: str
    words: list["StanzaTokenizedWord"]
    spaces_after: str
    spaces_before: str


class StanzaTokenizedSentence(BaseModel):
    text: str
    tokens: list["StanzaTokenizedToken"]


class StanzaTokenizedDocument(BaseModel):
    text: str
    sentences: list["StanzaTokenizedSentence"]


class StanzaParsedWord(BaseModel):
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


class StanzaParsedToken(BaseModel):
    text: str
    words: list["StanzaParsedWord"]
    spaces_after: str
    spaces_before: str


class StanzaConstituencyNode(BaseModel):
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
    children: list["StanzaConstituencyNode"]


class StanzaParsedSentence(BaseModel):
    text: str
    tokens: list["StanzaParsedToken"]
    constituency: "StanzaConstituencyNode"


class StanzaParsedDocument(BaseModel):
    text: str
    sentences: list["StanzaParsedSentence"]


@app.post("/tokenize")
def tokenize_document(
    text: Annotated[str, Body(embed=True)], request: Request
) -> StanzaTokenizedDocument:
    doc = request.app.state.nlp(text)

    return StanzaTokenizedDocument(
        text=doc.text,
        sentences=[
            StanzaTokenizedSentence(
                text=sentence.text,
                tokens=[
                    StanzaTokenizedToken(
                        text=token.text,
                        words=[
                            StanzaTokenizedWord(
                                id=word.id,
                                text=word.text,
                            )
                            for word in token.words
                        ],
                        spaces_after=token.spaces_after,
                        spaces_before=token.spaces_before,
                    )
                    for token in sentence.tokens
                ],
            )
            for sentence in doc.sentences
        ],
    )


@app.post("/parse")
def parse_document(
    text: Annotated[str, Body(embed=True)], request: Request
) -> StanzaParsedDocument:
    doc = request.app.state.nlp(text)

    def convert_constituency(constituency) -> StanzaConstituencyNode:
        return StanzaConstituencyNode(
            label=constituency.label,
            children=[convert_constituency(child) for child in constituency.children],
        )

    return StanzaParsedDocument(
        text=doc.text,
        sentences=[
            StanzaParsedSentence(
                text=sentence.text,
                tokens=[
                    StanzaParsedToken(
                        text=token.text,
                        words=[
                            StanzaParsedWord(
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


@app.post("/parse/conllu")
def parse_document_as_conllu(
    text: Annotated[str, Body(embed=True)], request: Request
) -> str:
    doc = request.app.state.nlp(text)
    return "{:C}".format(doc)
