import assetCopyProof from '../../public/img/asset-copy-final.png'

// Bundlers return either a URL string (Vite) or a static image object (Next.js).
const proofSrc: string =
  typeof assetCopyProof === 'string' ? assetCopyProof : (assetCopyProof as { src: string }).src

export const AssetCopyVerified = () => {
  return (
    <div
      style={{
        boxSizing: 'border-box',
        width: 632,
        padding: 16,
        borderRadius: 12,
        border: '1px solid #e5e7eb',
        backgroundColor: '#ffffff',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
        fontFamily:
          'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        color: '#111827',
      }}
    >
      <h2 style={{ margin: '0 0 12px', fontSize: 18, fontWeight: 600, lineHeight: '24px' }}>
        Upload proof verified
      </h2>
      <img
        src={proofSrc}
        alt="Asset copy proof"
        width={600}
        height={300}
        style={{
          display: 'block',
          width: 600,
          height: 300,
          aspectRatio: '2 / 1',
          borderRadius: 8,
        }}
      />
      <p style={{ margin: '12px 0 0', fontSize: 14, lineHeight: '20px', color: '#6b7280' }}>
        Original bytes, local asset
      </p>
    </div>
  )
}

export default AssetCopyVerified
