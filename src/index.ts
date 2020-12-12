import type { SignUpParams } from '@aws-amplify/auth/lib-esm/types'
import type { CognitoUser } from 'amazon-cognito-identity-js'
import { Amplify, Auth } from 'aws-amplify'
import { useEffect } from 'react'
import { atom, selector, useRecoilState, useRecoilValue } from 'recoil'

export const AmplifyAuthIsLoadingAtom = atom<boolean>({
  key: '@ycu-engine/amplify-auth-hook/IsLoadingAtom',
  default: false
})
export const AmplifyAuthUserAtom = atom<CognitoUser | undefined>({
  key: '@ycu-engine/amplify-auth-hook/UserAtom',
  default: undefined
})
export const AmplifyAuthErrorAtom = atom<string>({
  key: '@ycu-engine/amplify-auth-hook/ErrorAtom',
  default: ''
})
export const AmplifyAuthIsAuthenticatedSelector = selector<boolean>({
  key: '@ycu-engine/amplify-auth-hook/IsAuthenticatedSelector',
  get: ({ get }) => !!get(AmplifyAuthUserAtom)
})

export const useAmplifyAuth = (amplifyConfig: any) => {
  Amplify.configure(amplifyConfig)

  const [isLoading, setIsLoading] = useRecoilState(AmplifyAuthIsLoadingAtom)
  const [user, setUser] = useRecoilState(AmplifyAuthUserAtom)
  const isAuthenticated = useRecoilValue(AmplifyAuthIsAuthenticatedSelector)
  const [error, setError] = useRecoilState(AmplifyAuthErrorAtom)

  const checkAuthenticated = async () => {
    setIsLoading(true)
    try {
      const data = await Auth.currentSession()
      if (!data) {
        setUser(undefined)
      } else {
        await currentAuthenticatedUser()
      }
    } catch {
      setUser(undefined)
    } finally {
      setIsLoading(false)
    }
  }
  const currentAuthenticatedUser = async () => {
    const user: CognitoUser = await Auth.currentAuthenticatedUser()
    setUser(user)
  }

  useEffect(() => {
    checkAuthenticated()
  }, [])

  const signUp = async (param: SignUpParams) => {
    setIsLoading(true)
    try {
      const result = await Auth.signUp(param)
      setUser(result.user)
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
    try {
      await Auth.confirmSignUp(username, code)
      await checkAuthenticated()
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
    try {
      await Auth.signOut()
      setUser(undefined)
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
    signUp,
    confirmSignUp,
    signIn,
    signOut
  }
}

export const useReadOnlyAmplifyAuth = () => {
  const isLoading = useRecoilValue(AmplifyAuthIsLoadingAtom)
  const user = useRecoilValue(AmplifyAuthUserAtom)
  const isAuthenticated = useRecoilValue(AmplifyAuthIsAuthenticatedSelector)
  const error = useRecoilValue(AmplifyAuthErrorAtom)

  return {
    isLoading,
    user,
    isAuthenticated,
    error
  }
}
