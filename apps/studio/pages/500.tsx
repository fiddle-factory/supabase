import { NextPage } from 'next'
import { useTheme } from 'next-themes'
import Image from 'next/legacy/image'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { Button, cn } from 'ui'

import { BreakoutGame } from '@/components/interfaces/ErrorHandling/BreakoutGame'
import { SupportLink } from '@/components/interfaces/Support/SupportLink'
import { useLastVisitedOrganization } from '@/hooks/misc/useLastVisitedOrganization'
import { useSignOut } from '@/lib/auth'

interface Error500Props {
  /** Renders a Breakout mini-game below the error message */
  shouldShowBreakout?: boolean
}

const Error500: NextPage<Error500Props> = ({ shouldShowBreakout = false }) => {
  const router = useRouter()
  const signOut = useSignOut()
  const { resolvedTheme } = useTheme()

  const { lastVisitedOrganization } = useLastVisitedOrganization()

  const onClickLogout = async () => {
    await signOut()
    await router.push('/sign-in')
    router.reload()
  }

  return (
    <div
      className={cn(
        'relative mx-auto flex flex-1 w-full flex-col items-center justify-center space-y-6',
        shouldShowBreakout && 'pt-24'
      )}
    >
      <div className="absolute top-0 mx-auto w-full max-w-7xl px-8 pt-6 sm:px-6 lg:px-8">
        <nav className="relative flex items-center justify-between sm:h-10">
          <div className="flex shrink-0 grow items-center lg:grow-0">
            <div className="flex w-full items-center justify-between md:w-auto">
              <Link href="/projects">
                <Image
                  src={
                    resolvedTheme?.includes('dark')
                      ? `${router.basePath}/img/supabase-dark.svg`
                      : `${router.basePath}/img/supabase-light.svg`
                  }
                  alt=""
                  height={24}
                  width={120}
                />
              </Link>
            </div>
          </div>
        </nav>
      </div>
      <div className="flex w-[320px] flex-col items-center justify-center space-y-3">
        <h4 className="text-lg">Something went wrong 🤕</h4>
        <p className="text-center">
          Sorry about that, please try again later or feel free to reach out to us if the problem
          persists.
        </p>
      </div>
      <div className="flex items-center space-x-4">
        {router.pathname !== '/organizations' ? (
          <Button variant="primary" asChild>
            <Link
              href={
                !!lastVisitedOrganization ? `/org/${lastVisitedOrganization}` : '/organizations'
              }
            >
              Head back
            </Link>
          </Button>
        ) : (
          <Button variant="primary" onClick={onClickLogout}>
            Head back
          </Button>
        )}
        <Button variant="secondary" asChild>
          <SupportLink>Submit a support request</SupportLink>
        </Button>
      </div>
      {shouldShowBreakout && <BreakoutGame className="px-4 pb-8" />}
    </div>
  )
}

export default Error500
