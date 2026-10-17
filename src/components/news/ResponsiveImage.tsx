import { imageSrcSet, imageUrl, type ImageLike } from "@/lib/image";

type Props = {
  image: ImageLike | null | undefined;
  sizes: string;
  className?: string;
  priority?: boolean;
  /** Aspect ratio reserved before load to avoid layout shift. */
  ratio?: "16/9" | "4/3" | "1/1" | "3/2";
  alt?: string;
};

/** Renders pre-generated WebP renditions with srcset; the box is reserved to prevent layout shift. */
export function ResponsiveImage({ image, sizes, className = "", priority = false, ratio = "16/9", alt }: Props) {
  const aspect = { "16/9": "aspect-video", "4/3": "aspect-[4/3]", "1/1": "aspect-square", "3/2": "aspect-[3/2]" }[ratio];
  if (!image) {
    return <div className={`${aspect} w-full bg-surface ${className}`} aria-hidden="true" />;
  }
  return (
    <div className={`${aspect} w-full overflow-hidden bg-surface ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element -- renditions are generated at upload time */}
      <img
        src={imageUrl(image, 960)}
        srcSet={imageSrcSet(image)}
        sizes={sizes}
        alt={alt ?? image.alt}
        width={image.width}
        height={image.height}
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : "auto"}
        decoding="async"
        className="h-full w-full object-cover"
      />
    </div>
  );
}
