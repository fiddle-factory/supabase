import { Card, CardContent, CardHeader, CardTitle } from 'ui'

import { BASE_PATH } from '@/lib/constants'

export const AssetCopyQA = () => {
  return (
    <Card className="w-full max-w-[600px] overflow-hidden">
      <CardHeader>
        <CardTitle>Original asset copy</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-y-3">
        <img
          src={`${BASE_PATH}/img/asset-copy-qa.png`}
          alt="Original asset copy"
          width={600}
          height={300}
          className="w-full h-auto aspect-[2/1] rounded-md border"
        />
        <p className="text-sm text-foreground-light">Copied from the original upload</p>
      </CardContent>
    </Card>
  )
}
