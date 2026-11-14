import { NextPage } from 'next'
import { useTheme } from 'next-themes'
import Image from 'next/legacy/image'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { Button } from 'ui'

import { SnakeGame } from '@/components/interfaces/ErrorHandling/SnakeGame/SnakeGame'
import { SupportLink } from '@/components/interfaces/Support/SupportLink'
import { useLastVisitedOrganization } from '@/hooks/misc/useLastVisitedOrganization'
import { useSignOut } from '@/lib/auth'

const Error500: NextPage = () => {
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
    <div className="relative mx-auto flex flex-1 w-full flex-col items-center">
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
      <main className="flex w-full flex-1 flex-col items-center justify-center gap-6 px-6 pt-24 pb-10">
        <div className="flex max-w-md flex-col items-center gap-2 text-center">
          <h4 className="text-lg">Something went wrong 🤕</h4>
          <p className="text-sm text-foreground-light">
            Sorry about that, please try again later or feel free to reach out to us if the problem
            persists. In the meantime, how about a game?
          </p>
        </div>
        <SnakeGame className="max-w-[min(560px,max(280px,calc(100vh_-_340px)))]" />
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
      </main>
    </div>
  )
}

export default Error500
