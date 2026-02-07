import crypto from 'crypto'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

const SESSION_COOKIE = 'kb_session'
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 8

const LOGIN_USERNAME = process.env.NEXT_PUBLIC_LOGIN_USERNAME ?? ''
const LOGIN_PASSWORD = process.env.NEXT_PUBLIC_LOGIN_PASSWORD ?? ''
const SESSION_SECRET = process.env.NEXT_PUBLIC_LOGIN_SECRET ?? LOGIN_PASSWORD

function safeEqual(a: string, b: string) {
  const aBuffer = Buffer.from(a)
  const bBuffer = Buffer.from(b)
  if (aBuffer.length !== bBuffer.length) {
    return false
  }
  return crypto.timingSafeEqual(aBuffer, bBuffer)
}

function sign(payload: string) {
  return crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('hex')
}

export function isLoginConfigured() {
  return Boolean(LOGIN_USERNAME && LOGIN_PASSWORD && SESSION_SECRET)
}

export function createSessionCookie(username: string) {
  const issuedAt = Date.now().toString()
  const payload = `${username}:${issuedAt}`
  const signature = sign(payload)
  return `${payload}:${signature}`
}

export function validateCredentials(username: string, password: string) {
  if (!isLoginConfigured()) {
    return false
  }
  return safeEqual(username, LOGIN_USERNAME) && safeEqual(password, LOGIN_PASSWORD)
}

export function verifySessionCookie(value: string) {
  if (!isLoginConfigured()) {
    return false
  }
  const parts = value.split(':')
  if (parts.length !== 3) {
    return false
  }
  const [username, issuedAt, signature] = parts
  if (!safeEqual(username, LOGIN_USERNAME)) {
    return false
  }
  if (!/^\d+$/.test(issuedAt)) {
    return false
  }
  const issuedAtMs = Number(issuedAt)
  if (Number.isNaN(issuedAtMs)) {
    return false
  }
  if (Date.now() - issuedAtMs > SESSION_MAX_AGE_SECONDS * 1000) {
    return false
  }
  const payload = `${username}:${issuedAt}`
  const expected = sign(payload)
  return safeEqual(signature, expected)
}

export async function setSessionCookie(value: string) {
  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE, value, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: SESSION_MAX_AGE_SECONDS,
    path: '/',
  })
}

export async function isAuthenticated() {
  const cookieStore = await cookies()
  const session = cookieStore.get(SESSION_COOKIE)?.value
  if (!session) {
    return false
  }
  return verifySessionCookie(session)
}

export async function requireAuth() {
  const authenticated = await isAuthenticated()
  if (!authenticated) {
    redirect('/login')
  }
}
