import {
  type CSSProperties,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  AppBar,
  Toolbar,
  Button,
  Box,
  Paper,
  TextField,
  IconButton,
  Chip,
} from "@mui/material";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import DownloadIcon from "@mui/icons-material/IosShare";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditIcon from "@mui/icons-material/ModeEditOutline";
import DrawIcon from "@mui/icons-material/Draw";
import LinkIcon from "@mui/icons-material/CallMerge";
import CloseIcon from "@mui/icons-material/Close";

// ==================================================
// Types (explicit, minimal)
// ==================================================

type Label = "S" | "V" | "O" | "C" | "M";
type RangeKind = "phrase" | "clause" | "modifier" | "underline";

type Range = { id: string; type: RangeKind; start: number; end: number };
type LabelAnnotation = { id: string; targetId: string; label: Label };
type Relation = { id: string; fromId: string; toId: string };

type DocumentState = {
  text: string;
  ranges: Range[];
  labels: LabelAnnotation[];
  rels: Relation[];
};

// ==================================================
// Helpers (modern browsers only)
// ==================================================

const createId = () => crypto.randomUUID();

const tokenize = (input: string) =>
  input.trim()
    ? input
        .replace(/\s+/g, " ")
        .trim()
        .match(
          /[\u2018\u2019\u201C\u201D"']|[(){}\[\]]|—|–|\/|[.,;:!?]|[A-Za-z]+(?:'[A-Za-z]+)?|\d+|\S/gi
        ) ?? []
    : [];
const isPunctuationToken = (token: string) =>
  /^[.,;:!?(){}\[\]"'—–]$/.test(token) || /^[、。]$/.test(token);

// Geometry (for underlines/labels/arrows)
type TokenRect = { left: number; right: number; top: number; bottom: number };
const computeSpanGeometry = (
  tokenRects: (TokenRect | undefined)[],
  startIndex: number,
  endIndex: number
) => {
  const rects = tokenRects
    .slice(startIndex, endIndex + 1)
    .filter(Boolean) as TokenRect[];
  if (!rects.length) return null;
  const leftX = Math.min(...rects.map((r) => r.left));
  const rightX = Math.max(...rects.map((r) => r.right));
  const topY = Math.min(...rects.map((r) => r.top));
  const bottomY = Math.max(...rects.map((r) => r.bottom));
  const EPS = 6;
  const segments: { key: number; y: number; x1: number; x2: number }[] = [];
  rects.forEach((r) => {
    const same = segments.find((L) => Math.abs(L.key - r.top) <= EPS);
    if (same) {
      same.y = Math.max(same.y, r.bottom);
      same.x1 = Math.min(same.x1, r.left);
      same.x2 = Math.max(same.x2, r.right);
    } else {
      segments.push({ key: r.top, y: r.bottom, x1: r.left, x2: r.right });
    }
  });
  segments.sort((a, b) => a.key - b.key);
  return {
    midX: (leftX + rightX) / 2,
    topY,
    botY: bottomY,
    segs: segments.map((L) => ({ y: L.y, x1: L.x1, x2: L.x2 })),
  } as const;
};
const buildArrowPath = (x1: number, y1: number, x2: number, y2: number) => {
  const span = Math.max(1, Math.abs(x2 - x1));
  const lift = 18 + Math.min(48, span * 0.35);
  const apexY = Math.min(y1, y2) - lift;
  return {
    d: `M ${x1},${y1} C ${x1},${apexY} ${x2},${apexY} ${x2},${y2}`,
    midX: (x1 + x2) / 2,
    midY: apexY,
  };
};

// ==================================================
// Component: header + canvas (first public release)
// ==================================================

export default function App() {
  // View mode
  const [viewMode, setViewMode] = useState<"edit" | "annotate">("annotate");

  // Document state
  const [documentState, setDocumentState] = useState<DocumentState>({
    text: "When he arrived, the teacher quickly explained the rules to the students.",
    ranges: [],
    labels: [],
    rels: [],
  });

  // Selection / active range / pending relation
  const [activeRangeId, setActiveRangeId] = useState<string | null>(null);
  const [pendingRelationFromId, setPendingRelationFromId] = useState<
    string | null
  >(null);
  const [dragAnchorIndex, setDragAnchorIndex] = useState<number | null>(null);
  const [dragFocusIndex, setDragFocusIndex] = useState<number | null>(null);
  const selection = useMemo(
    () =>
      dragAnchorIndex == null || dragFocusIndex == null
        ? null
        : {
            start: Math.min(dragAnchorIndex, dragFocusIndex),
            end: Math.max(dragAnchorIndex, dragFocusIndex),
          },
    [dragAnchorIndex, dragFocusIndex]
  );

  // Tokens & rects
  const tokenList = useMemo(
    () => tokenize(documentState.text),
    [documentState.text]
  );
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const tokenRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const [tokenRects, setTokenRects] = useState<(TokenRect | undefined)[]>([]);

  const measureTokenRects = () => {
    const root = canvasRef.current;
    if (!root) return;
    const rootBox = root.getBoundingClientRect();
    setTokenRects(
      tokenList.map((_, i) => {
        const el = tokenRefs.current[i];
        if (!el) return undefined;
        const b = el.getBoundingClientRect();
        return {
          left: b.left - rootBox.left,
          right: b.right - rootBox.left,
          top: b.top - rootBox.top,
          bottom: b.bottom - rootBox.top,
        } as TokenRect;
      })
    );
  };

  useLayoutEffect(() => {
    if (viewMode === "annotate") measureTokenRects();
  }, [
    viewMode,
    tokenList.length,
    documentState.ranges.length,
    documentState.labels.length,
    documentState.rels.length,
  ]);
  useEffect(() => {
    const on = () => measureTokenRects();
    window.addEventListener("resize", on);
    return () => window.removeEventListener("resize", on);
  }, []);
  useEffect(() => {
    if (!canvasRef.current) return;
    const ro = new ResizeObserver(() => measureTokenRects());
    ro.observe(canvasRef.current);
    return () => ro.disconnect();
  }, []);

  // Helpers
  const snapToNearestNonPunctuation = (index: number) => {
    if (!isPunctuationToken(tokenList[index] ?? "")) return index;
    for (let j = index - 1; j >= 0 && index - j <= 6; j--)
      if (!isPunctuationToken(tokenList[j])) return j;
    for (let j = index + 1; j < tokenList.length && j - index <= 6; j++)
      if (!isPunctuationToken(tokenList[j])) return j;
    return index;
  };
  const findTopmostRangeAtToken = (index: number) => {
    const hit = documentState.ranges.filter(
      (r) => index >= r.start && index <= r.end
    );
    return hit.length ? hit[hit.length - 1] : null;
  };
  const computeToolbarAnchor = (
    start: number,
    end: number,
    placeAbove: boolean
  ) => {
    const rects = tokenRects
      .slice(start, end + 1)
      .filter(Boolean) as TokenRect[];
    if (!rects.length) return null;
    const left = Math.min(...rects.map((r) => r.left));
    const right = Math.max(...rects.map((r) => r.right));
    const top = Math.min(...rects.map((r) => r.top));
    const bottom = Math.max(...rects.map((r) => r.bottom));
    return {
      x: (left + right) / 2,
      y: placeAbove ? Math.max(0, top - 36) : bottom + 10,
    };
  };

  // Bracket markers for non-underline ranges
  const openingBrackets = useMemo(() => {
    const map: Record<number, string[]> = {};
    for (let i = 0; i < tokenList.length; i++) map[i] = [];
    documentState.ranges.forEach((range) => {
      if (range.type !== "underline")
        map[range.start].push(
          range.type === "phrase" ? "<" : range.type === "clause" ? "{" : "("
        );
    });
    return map;
  }, [documentState.ranges, tokenList.length]);
  const closingBrackets = useMemo(() => {
    const map: Record<number, string[]> = {};
    for (let i = 0; i < tokenList.length; i++) map[i] = [];
    documentState.ranges.forEach((range) => {
      if (range.type !== "underline")
        map[range.end].push(
          range.type === "phrase" ? ">" : range.type === "clause" ? "}" : ")"
        );
    });
    return map;
  }, [documentState.ranges, tokenList.length]);

  // Mutations
  const createRange = (type: RangeKind) => {
    if (!selection) return;
    const id = createId();
    setDocumentState((v) => ({
      ...v,
      ranges: [
        ...v.ranges,
        { id, type, start: selection.start, end: selection.end },
      ],
    }));
    setActiveRangeId(id);
    setDragAnchorIndex(null);
    setDragFocusIndex(null);
  };
  const addLabelToActiveRange = (label: Label) => {
    if (!activeRangeId) return;
    setDocumentState((v) => ({
      ...v,
      labels: [...v.labels, { id: createId(), targetId: activeRangeId, label }],
    }));
  };
  const clearAllAnnotations = () => {
    setDocumentState((v) => ({ ...v, ranges: [], labels: [], rels: [] }));
    setActiveRangeId(null);
    setPendingRelationFromId(null);
    setDragAnchorIndex(null);
    setDragFocusIndex(null);
  };
  const startRelation = () => {
    if (activeRangeId) setPendingRelationFromId(activeRangeId);
  };
  const cancelRelation = () => setPendingRelationFromId(null);
  const commitRelation = (toId: string) => {
    if (!pendingRelationFromId || pendingRelationFromId === toId)
      return cancelRelation();
    setDocumentState((v) => ({
      ...v,
      rels: [
        ...v.rels,
        { id: createId(), fromId: pendingRelationFromId, toId },
      ],
    }));
    cancelRelation();
  };
  const deleteActiveRange = () => {
    if (!activeRangeId) return;
    setDocumentState((v) => ({
      ...v,
      labels: v.labels.filter((l) => l.targetId !== activeRangeId),
      rels: v.rels.filter(
        (r) => r.fromId !== activeRangeId && r.toId !== activeRangeId
      ),
      ranges: v.ranges.filter((r) => r.id !== activeRangeId),
    }));
    setActiveRangeId(null);
  };

  // I/O (pure JSON; ignore legacy fields if present)
  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(documentState, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "annotation.json";
    a.click();
    URL.revokeObjectURL(url);
  };
  const importJSON = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const raw = JSON.parse(
          String(reader.result)
        ) as Partial<DocumentState> & { version?: unknown };
        const next: DocumentState = {
          text: raw.text ?? "",
          ranges: Array.isArray(raw.ranges) ? (raw.ranges) : [],
          labels: Array.isArray(raw.labels)
            ? (raw.labels)
            : [],
          rels: Array.isArray(raw.rels) ? (raw.rels) : [],
        };
        setDocumentState(next);
        setActiveRangeId(null);
        setPendingRelationFromId(null);
        setDragAnchorIndex(null);
        setDragFocusIndex(null);
        requestAnimationFrame(measureTokenRects);
      } catch {
        alert("インポートに失敗しました");
      }
    };
    reader.readAsText(file);
  };

  // Derivations
  const selectionAnchor = selection
    ? computeToolbarAnchor(selection.start, selection.end, false)
    : null;
  const activeAnchor = activeRangeId
    ? (() => {
        const r = documentState.ranges.find((x) => x.id === activeRangeId);
        return r ? computeToolbarAnchor(r.start, r.end, true) : null;
      })()
    : null;
  const canvasHeight = canvasRef.current?.getBoundingClientRect().height || 0;

  const relationShapes = useMemo(
    () =>
      documentState.rels
        .map((rel, index) => {
          const from = documentState.ranges.find((x) => x.id === rel.fromId);
          const to = documentState.ranges.find((x) => x.id === rel.toId);
          if (!from || !to) return null;
          const fg = computeSpanGeometry(tokenRects, from.start, from.end);
          const tg = computeSpanGeometry(tokenRects, to.start, to.end);
          if (!fg || !tg) return null;
          const lift = 6 * (index % 3);
          const { d, midX, midY } = buildArrowPath(
            fg.midX,
            fg.topY - 2 - lift,
            tg.midX,
            tg.topY - 2 - lift
          );
          return { id: rel.id, d, midX, midY };
        })
        .filter(Boolean) as {
        id: string;
        d: string;
        midX: number;
        midY: number;
      }[],
    [documentState.rels, documentState.ranges, tokenRects]
  );

  return (
    <Box sx={{ bgcolor: "#f8fafc", minHeight: "100vh" }}>
      <AppBar position="sticky" color="default" elevation={0}>
        <Toolbar sx={{ gap: 1 }}>
          <Box sx={{ fontWeight: 700 }}>Annotation</Box>
          <Button
            size="small"
            variant={viewMode === "edit" ? "contained" : "outlined"}
            startIcon={<EditIcon />}
            onClick={() => {
              setViewMode("edit");
              setActiveRangeId(null);
            }}
          >
            編集
          </Button>
          <Button
            size="small"
            variant={viewMode === "annotate" ? "contained" : "outlined"}
            startIcon={<DrawIcon />}
            onClick={() => {
              setViewMode("annotate");
            }}
          >
            注釈
          </Button>
          <Box sx={{ ml: "auto", display: "flex", gap: 1 }}>
            <Button
              size="small"
              startIcon={<DownloadIcon />}
              onClick={exportJSON}
            >
              出力
            </Button>
            <Button
              size="small"
              startIcon={<UploadFileIcon />}
              component="label"
            >
              読込
              <input
                hidden
                type="file"
                accept="application/json"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) importJSON(f);
                }}
              />
            </Button>
            <IconButton size="small" onClick={clearAllAnnotations}>
              <DeleteOutlineIcon />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      <Box sx={{ maxWidth: 1000, mx: "auto", p: 2 }}>
        <Paper variant="outlined" sx={{ p: 2 }}>
          {viewMode === "edit" ? (
            <TextField
              fullWidth
              multiline
              minRows={7}
              value={documentState.text}
              onChange={(e) =>
                setDocumentState((v) => ({ ...v, text: e.target.value }))
              }
              placeholder="ここに英文を編集"
            />
          ) : (
            <Box ref={canvasRef} sx={{ position: "relative" }}>
              {/* Arrows (non-interactive SVG) */}
              <svg
                width="100%"
                height={canvasHeight + 60}
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  overflow: "visible",
                  pointerEvents: "none",
                }}
              >
                <defs>
                  <marker
                    id="ah"
                    viewBox="0 0 10 10"
                    refX="10"
                    refY="5"
                    markerWidth="8"
                    markerHeight="8"
                    orient="auto-start-reverse"
                  >
                    <path d="M0 0 L10 5 L0 10 z" />
                  </marker>
                </defs>
                {relationShapes.map((shape) => (
                  <path
                    key={shape.id}
                    d={shape.d}
                    stroke="#0284c7"
                    fill="none"
                    strokeWidth={1.75}
                    markerEnd="url(#ah)"
                  />
                ))}
              </svg>

              {/* Arrow delete buttons (HTML) */}
              <Box
                sx={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  right: 0,
                  bottom: 0,
                  pointerEvents: "none",
                }}
              >
                {relationShapes.map((shape) => (
                  <Box
                    key={shape.id}
                    sx={{
                      position: "absolute",
                      left: shape.midX,
                      top: shape.midY + 2,
                      transform: "translate(-50%, -50%)",
                      pointerEvents: "auto",
                      cursor: "pointer",
                      width: 16,
                      height: 16,
                      borderRadius: "50%",
                      background: "#e2e8f0",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 9,
                    }}
                    onClick={() =>
                      setDocumentState((v) => ({
                        ...v,
                        rels: v.rels.filter((x) => x.id !== shape.id),
                      }))
                    }
                  >
                    ×
                  </Box>
                ))}
              </Box>

              {/* Tokens with bracket markers */}
              <Box
                sx={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "6px",
                  lineHeight: 2.8,
                  mt: "56px",
                }}
              >
                {tokenList.map((tokenText, tokenIndex) => {
                  const inSelection = !!(
                    selection &&
                    tokenIndex >= selection.start &&
                    tokenIndex <= selection.end &&
                    !isPunctuationToken(tokenText)
                  );
                  const inActiveRange = !!(
                    activeRangeId &&
                    documentState.ranges.find(
                      (r) =>
                        r.id === activeRangeId &&
                        tokenIndex >= r.start &&
                        tokenIndex <= r.end
                    )
                  );
                  const tokenStyle: CSSProperties = {
                    position: "relative",
                    display: "inline-block",
                    padding: "0 8px",
                    borderRadius: 8,
                    marginBottom: 12,
                    userSelect: "none",
                    cursor: !isPunctuationToken(tokenText)
                      ? "pointer"
                      : "default",
                  };
                  if (inSelection) {
                    tokenStyle.outline = "2px solid rgba(99,102,241,.6)";
                    (tokenStyle as any).background = "rgba(238,242,255,1)";
                  } else if (inActiveRange) {
                    tokenStyle.outline = "2px solid rgba(34,197,94,.6)";
                  }
                  return (
                    <Box
                      key={tokenIndex}
                      sx={{
                        position: "relative",
                        display: "inline-flex",
                        alignItems: "baseline",
                      }}
                    >
                      {openingBrackets[tokenIndex]?.length ? (
                        <span
                          style={{
                            position: "absolute",
                            right: "100%",
                            marginRight: 2,
                            top: 0,
                            fontFamily: "monospace",
                            color: "#4f46e5",
                            userSelect: "none",
                          }}
                        >
                          {openingBrackets[tokenIndex].join("")}
                        </span>
                      ) : null}

                      <span
                        ref={(el) => (tokenRefs.current[tokenIndex] = el)}
                        style={tokenStyle}
                        onMouseDown={() => {
                          const j = snapToNearestNonPunctuation(tokenIndex);
                          setDragAnchorIndex(j);
                          setDragFocusIndex(j);
                        }}
                        onMouseEnter={(e) => {
                          if (dragAnchorIndex !== null && (e.buttons & 1) === 1)
                            setDragFocusIndex(
                              snapToNearestNonPunctuation(tokenIndex)
                            );
                        }}
                        onMouseUp={() => {
                          if (dragAnchorIndex !== null)
                            setDragFocusIndex(
                              snapToNearestNonPunctuation(tokenIndex)
                            );
                        }}
                        onClick={() => {
                          const r = findTopmostRangeAtToken(tokenIndex);
                          if (!r) {
                            setActiveRangeId(null);
                            setPendingRelationFromId(null);
                            return;
                          }
                          if (pendingRelationFromId) commitRelation(r.id);
                          else setActiveRangeId(r.id);
                        }}
                      >
                        {tokenText}
                      </span>

                      {closingBrackets[tokenIndex]?.length ? (
                        <span
                          style={{
                            position: "absolute",
                            left: "100%",
                            marginLeft: 2,
                            top: 0,
                            fontFamily: "monospace",
                            color: "#4f46e5",
                            userSelect: "none",
                          }}
                        >
                          {closingBrackets[tokenIndex].join("")}
                        </span>
                      ) : null}
                    </Box>
                  );
                })}
              </Box>

              {/* Selection toolbar (pill) */}
              {selection && selectionAnchor && (
                <Box
                  sx={{
                    position: "absolute",
                    left: selectionAnchor.x,
                    top: selectionAnchor.y,
                    transform: "translate(-50%,0)",
                    zIndex: 10,
                  }}
                >
                  <Paper
                    elevation={3}
                    sx={{
                      px: 0.75,
                      py: 0.5,
                      display: "flex",
                      gap: 0.5,
                      borderRadius: 9999,
                      bgcolor: "#fff",
                      alignItems: "center",
                    }}
                  >
                    <Chip
                      size="small"
                      label="phrase"
                      onClick={() => createRange("phrase")}
                    />
                    <Chip
                      size="small"
                      label="clause"
                      onClick={() => createRange("clause")}
                    />
                    <Chip
                      size="small"
                      label="modifier"
                      onClick={() => createRange("modifier")}
                    />
                    <Chip
                      size="small"
                      label="underline"
                      onClick={() => createRange("underline")}
                    />
                  </Paper>
                </Box>
              )}

              {/* Active toolbar (pill) */}
              {activeRangeId && activeAnchor && !selection && (
                <Box
                  sx={{
                    position: "absolute",
                    left: activeAnchor.x,
                    top: activeAnchor.y,
                    transform: "translate(-50%,0)",
                    zIndex: 10,
                  }}
                >
                  <Paper
                    elevation={3}
                    sx={{
                      px: 0.75,
                      py: 0.5,
                      display: "flex",
                      gap: 0.5,
                      borderRadius: 9999,
                      bgcolor: "#fff",
                      alignItems: "center",
                    }}
                  >
                    {(["S", "V", "O", "C", "M"] as Label[]).map((L) => (
                      <Chip
                        key={L}
                        size="small"
                        label={L}
                        onClick={() => addLabelToActiveRange(L)}
                      />
                    ))}
                    {!pendingRelationFromId && (
                      <Chip
                        size="small"
                        icon={<LinkIcon />}
                        label="矢印"
                        onClick={startRelation}
                      />
                    )}
                    {pendingRelationFromId && (
                      <Chip
                        size="small"
                        icon={<CloseIcon />}
                        label="キャンセル"
                        onClick={cancelRelation}
                      />
                    )}
                    <Chip
                      size="small"
                      color="error"
                      label="削除"
                      onClick={deleteActiveRange}
                    />
                  </Paper>
                </Box>
              )}

              {/* Underlines + Labels */}
              <svg
                width="100%"
                height={canvasHeight}
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  pointerEvents: "none",
                }}
              >
                {documentState.ranges
                  .filter((r) => r.type === "underline")
                  .flatMap((range) => {
                    const g = computeSpanGeometry(
                      tokenRects,
                      range.start,
                      range.end
                    );
                    if (!g) return [];
                    return g.segs.map((seg, idx) => (
                      <line
                        key={`${range.id}-${idx}`}
                        x1={seg.x1}
                        x2={seg.x2}
                        y1={seg.y + 2.5}
                        y2={seg.y + 2.5}
                        stroke="#334155"
                        strokeWidth={2}
                        shapeRendering="crispEdges"
                      />
                    ));
                  })}
              </svg>

              <Box
                sx={{ position: "absolute", inset: 0, pointerEvents: "none" }}
              >
                {documentState.labels.map((labelAnno) => {
                  const range = documentState.ranges.find(
                    (r) => r.id === labelAnno.targetId
                  );
                  if (!range) return null;
                  const g = computeSpanGeometry(
                    tokenRects,
                    range.start,
                    range.end
                  );
                  if (!g) return null;
                  return (
                    <Box
                      key={labelAnno.id}
                      sx={{
                        position: "absolute",
                        left: g.midX,
                        top: g.botY + 12,
                        transform: "translateX(-50%)",
                        px: 1,
                        py: 0.25,
                        bgcolor: "#fef3c7",
                        border: "1px solid #fcd34d",
                        borderRadius: 1,
                        fontSize: 12,
                      }}
                    >
                      {labelAnno.label}
                    </Box>
                  );
                })}
              </Box>
            </Box>
          )}
        </Paper>

        <Box sx={{ mt: 1, display: "flex", gap: 2, fontSize: 12 }}>
          <span>
            Mode: <b>{viewMode}</b>
          </span>
          <span>
            Tokens: <b>{tokenList.length}</b>
          </span>
          <span>
            Ranges: <b>{documentState.ranges.length}</b>
          </span>
          <span>
            Labels: <b>{documentState.labels.length}</b>
          </span>
          <span>
            Rels: <b>{documentState.rels.length}</b>
          </span>
        </Box>
      </Box>
    </Box>
  );
}
