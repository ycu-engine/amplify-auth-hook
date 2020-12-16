import type { SignUpParams } from '@aws-amplify/auth/lib-esm/types'
import type {
  CognitoUser,
  CognitoUserSession
} from 'amazon-cognito-identity-js'
import { Amplify, Auth } from 'aws-amplify'
import { useEffect } from 'react'
import { atom, selector, useRecoilState, useRecoilValue } from 'recoil'

export const AmplifyAuthIsLoadingAtom = atom<boolean>({
  key: '@ycu-engine/amplify-auth-hook/AmplifyAuthIsLoadingAtom',
  default: false
})
export const AmplifyAuthUserAtom = atom<CognitoUser | undefined>({
  key: '@ycu-engine/amplify-auth-hook/AmplifyAuthUserAtom',
  default: undefined,
  dangerouslyAllowMutability: true
})
export const AmplifyAuthErrorAtom = atom<any>({
  key: '@ycu-engine/amplify-auth-hook/AmplifyAuthErrorAtom',
  default: null
})
export const AmplifyAuthInitializedAtom = atom<boolean>({
  key: '@ycu-engine/amplify-auth-hook/AmplifyAuthInitializedAtom',
  default: false
})
export const AmplifyAuthIsAuthenticatedSelector = selector<boolean>({
  key: '@ycu-engine/amplify-auth-hook/AmplifyAuthIsAuthenticatedSelector',
  get: ({ get }) => !!get(AmplifyAuthUserAtom)
})

const getUserSession = (user: CognitoUser): Promise<CognitoUserSession> => {
  return new Promise((res, rej) => {
    user.getSession((err: Error | null, session: null | CognitoUserSession) => {
      if (session) {
        res(session)
        return
      }
      rej(err)
      return
    })
  })
}

export const useAmplifyAuth = (amplifyConfig: any) => {
  Amplify.configure(amplifyConfig)

  const [isLoading, setIsLoading] = useRecoilState(AmplifyAuthIsLoadingAtom)
  const [user, _setUser] = useRecoilState(AmplifyAuthUserAtom)
  const isAuthenticated = useRecoilValue(AmplifyAuthIsAuthenticatedSelector)
  const [error, setError] = useRecoilState(AmplifyAuthErrorAtom)
  const [initialized, setInitialized] = useRecoilState(
    AmplifyAuthInitializedAtom
  )

  const setUser = async (data: CognitoUser | undefined) => {
    console.dir({ user, data })
    if (typeof user !== typeof data) return _setUser(data)
    if (typeof user !== 'undefined' && typeof data !== 'undefined') {
      const [session1, session2] = await Promise.all([
        getUserSession(user),
        getUserSession(data)
      ])
      console.dir({ session1, session2 })
      if (
        session1.getAccessToken().getJwtToken() !==
        session2.getAccessToken().getJwtToken()
      ) {
        _setUser(data)
      }
    }
  }

  const checkAuthenticated = async () => {
    setIsLoading(true)
    try {
      const data = await Auth.currentSession()
      if (!data) {
        await setUser(undefined)
      } else {
        await currentAuthenticatedUser()
      }
    } catch {
      await setUser(undefined)
    } finally {
      setIsLoading(false)
      setInitialized(true)
    }
  }
  const currentAuthenticatedUser = async () => {
    const user: CognitoUser = await Auth.currentAuthenticatedUser()
    await setUser(user)
  }

  useEffect(() => {
    checkAuthenticated()
  }, [])

  const signUp = async (param: SignUpParams) => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await Auth.signUp(param)
      await setUser(result.user)
      setIsLoading(false)
      return result.user
    } catch (error) {
      setError(error)
      setIsLoading(false)
    }
    return undefined
  }

  const confirmSignUp = async ({
    username,
    code
  }: {
    username: string
    code: string
  }) => {
    setIsLoading(true)
    setError(null)
    try {
      await Auth.confirmSignUp(username, code)
      await checkAuthenticated()
    } catch (error) {
      setError(error)
    } finally {
      setIsLoading(false)
    }
  }

  const resendSignUp = async ({ username }: { username: string }) => {
    setIsLoading(true)
    setError(null)
    try {
      await Auth.resendSignUp(username)
    } catch (error) {
      setError(error)
    } finally {
      setIsLoading(false)
    }
  }

  const signIn = async ({
    username,
    password
  }: {
    username: string
    password: string
  }) => {
    setIsLoading(true)
    setError(null)
    try {
      await Auth.signIn(username, password)
      await checkAuthenticated()
    } catch (error) {
      setError(error)
    } finally {
      setIsLoading(false)
    }
  }

  const signOut = async () => {
    setIsLoading(true)
    setError(null)
    try {
      await Auth.signOut()
      await setUser(undefined)
    } catch (err) {
      setError(err)
    } finally {
      setIsLoading(false)
    }
  }

  return {
    isLoading,
    user,
    isAuthenticated,
    error,
    initialized,
    signUp,
    confirmSignUp,
    signIn,
    signOut,
    resendSignUp
  }
}

export const useReadOnlyAmplifyAuth = () => {
  const isLoading = useRecoilValue(AmplifyAuthIsLoadingAtom)
  const user = useRecoilValue(AmplifyAuthUserAtom)
  const isAuthenticated = useRecoilValue(AmplifyAuthIsAuthenticatedSelector)
  const error = useRecoilValue(AmplifyAuthErrorAtom)
  const initialized = useRecoilValue(AmplifyAuthInitializedAtom)

  return {
    isLoading,
    user,
    isAuthenticated,
    error,
    initialized
  }
}
