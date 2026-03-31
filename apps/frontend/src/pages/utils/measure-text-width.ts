export function measureTextWidth(text: string, fontSize: number): number {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  if (!context) return 0;
  context.font = `${fontSize}px system-ui`;

  const metrics = context.measureText(text);
  return metrics.width;
}
