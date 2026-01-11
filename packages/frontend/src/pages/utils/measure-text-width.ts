export function measureTextWidth(text: string): number {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  if (!context) return 0;
  context.font = "16px system-ui";

  const metrics = context.measureText(text);
  return metrics.width;
}
