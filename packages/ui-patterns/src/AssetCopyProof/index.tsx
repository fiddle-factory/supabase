import { Card, CardContent, CardHeader, CardTitle, cn } from 'ui'

import assetCopyProofImage from './assets/asset-copy-proof.png'

// Next.js resolves image imports to StaticImageData, Vite to a URL string.
const resolveImageSrc = (image: unknown): string =>
  typeof image === 'string' ? image : (image as { src: string }).src

export interface AssetCopyProofProps {
  title?: string
  caption?: string
  className?: string
}

export const AssetCopyProof = ({
  title = 'Upload proof 34e93',
  caption = 'Original bytes, local asset',
  className,
}: AssetCopyProofProps) => (
  <Card className={cn('w-full max-w-[650px]', className)}>
    <CardHeader>
      <CardTitle>{title}</CardTitle>
    </CardHeader>
    <CardContent className="flex flex-col gap-3">
      <img
        src={resolveImageSrc(assetCopyProofImage)}
        alt={caption}
        width={600}
        height={300}
        className="block h-auto w-full aspect-[2/1] rounded-md border"
      />
      <p className="text-sm text-foreground-lighter">{caption}</p>
    </CardContent>
  </Card>
)
