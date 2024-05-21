import { useAuthStore } from '../store/storeAuth'
import { jwtDecode } from 'jwt-decode'
import apiInstance from './axios'
import Cookies from 'js-cookie'

export const login = async (email, password) => {
  try {
    const { data, status } = await apiInstance.post('auth/login/', {
      email,
      password
    })

    if (status === 200) {
      setAuthUser(data.access, data.refresh)

      // Alert user of successful login
    }

    return { data, error: null }
  } catch (error) {
    return {
      data: null,
      error: error.response.data?.detail || 'An error occurred'
    }
  }
}

export const register = async (email, fullName, username, password, password2) => {
  try {
    const { data } = await apiInstance.post('auth/register/', {
      email,
      full_name: fullName,
      username,
      password,
      password2
    })

    await login(email, password)

    // Alert user of successful registration

    return { data, error: null }
  } catch (error) {
    return {
      data: null,
      error: error.response.data?.detail || 'An error occurred'
    }
  }
}

export const logout = () => {
  Cookies.remove('access_token')
  Cookies.remove('refresh_token')
  useAuthStore.getState().setUser(null)

  // Alert user of successful logout
}

export const setUser = async () => {
  const accessToken = Cookies.get('access_token')
  const refreshToken = Cookies.get('refresh_token')

  if (!accessToken || !refreshToken) {
    return
  }

  if (isAccessTokenExpired(accessToken)) {
    const response = await getRefreshToken(refreshToken)
    setAuthUser(response.data.access, refreshToken)
  } else {
    setAuthUser(accessToken, refreshToken)
  }
}

export const setAuthUser = (accessToken, refreshToken) => {
  Cookies.set('access_token', accessToken, {
    expires: 1,
    secure: true
  })
  Cookies.set('refresh_token', refreshToken, {
    expires: 7,
    secure: true
  })

  const user = jwtDecode(accessToken) ?? null

  if (user) {
    useAuthStore.getState().setUser(user)
  }
  useAuthStore.getState().setLoading(false)
}

export const getRefreshToken = async () => {
  const refreshToken = Cookies.get('refresh_token')
  const response = await apiInstance.post('user/token/refresh/', {
    refresh: refreshToken
  })

  return response.data
}

export const isAccessTokenExpired = (accessToken) => {
  try {
    const decodedToken = jwtDecode(accessToken)
    return decodedToken.exp < Date.now() / 1000
  } catch (err) {
    return true
  }
}
