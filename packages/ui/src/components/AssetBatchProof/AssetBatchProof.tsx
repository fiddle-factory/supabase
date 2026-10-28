import avatarSrc from './asset-batch-proof/avatar.png'
import heroSrc from './asset-batch-proof/hero.png'
import logoSrc from './asset-batch-proof/logo.png'

const resolveSrc = (src: string | { src: string }) => (typeof src === 'string' ? src : src.src)

const images = [
  { label: 'Logo', src: logoSrc, width: 200, height: 100 },
  { label: 'Hero', src: heroSrc, width: 600, height: 300 },
  { label: 'Avatar', src: avatarSrc, width: 200, height: 200 },
]

export function AssetBatchProof() {
  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'flex-start',
        gap: 24,
        padding: 24,
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      {images.map((image) => (
        <figure
          key={image.label}
          style={{ margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}
        >
          <img
            src={resolveSrc(image.src as string | { src: string })}
            alt={image.label}
            width={image.width}
            height={image.height}
            style={{
              display: 'block',
              width: image.width,
              maxWidth: '100%',
              height: 'auto',
              aspectRatio: `${image.width} / ${image.height}`,
            }}
          />
          <figcaption style={{ fontSize: 14, fontWeight: 500 }}>{image.label}</figcaption>
        </figure>
      ))}
    </div>
  )
}

export default AssetBatchProof
