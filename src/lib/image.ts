export type ImageLike = { path: string; widths: string; width: number; height: number; alt: string; credit?: string | null };

export function imageWidths(m: ImageLike): number[] {
  return m.widths
    .split(",")
    .map(Number)
    .filter(Boolean)
    .sort((a, b) => a - b);
}

export function imageUrl(m: ImageLike, target = 960): string {
  const ws = imageWidths(m);
  const w = ws.find((x) => x >= target) ?? ws[ws.length - 1];
  return `/media/${m.path}-${w}.webp`;
}

export function imageSrcSet(m: ImageLike): string {
  return imageWidths(m)
    .map((w) => `/media/${m.path}-${w}.webp ${w}w`)
    .join(", ");
}
