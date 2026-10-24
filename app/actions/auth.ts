'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const LoginSchema = z.object({
  email: z.string().email('Please enter a valid email address.').trim(),
  password: z.string().min(1, 'Password is required.'),
})

const SignUpSchema = z.object({
  email: z.string().email('Please enter a valid email address.').trim(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters.')
    .regex(/[a-zA-Z]/, 'Password must contain at least one letter.')
    .regex(/[0-9]/, 'Password must contain at least one number.'),
})

const ForgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address.').trim(),
})

const ResetPasswordSchema = z.object({
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters.')
    .regex(/[a-zA-Z]/, 'Password must contain at least one letter.')
    .regex(/[0-9]/, 'Password must contain at least one number.'),
})

const OnboardingSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters.')
    .max(30, 'Username must be 30 characters or fewer.')
    .regex(/^[a-z0-9_]+$/, 'Username can only contain lowercase letters, numbers, and underscores.')
    .trim(),
  display_name: z.string().min(1, 'Display name is required.').max(50).trim(),
  bio: z.string().max(200, 'Bio must be 200 characters or fewer.').optional().or(z.literal('')),
  avatar_url: z.string().url('Invalid avatar URL').optional().or(z.literal('')),
})

export type AuthFormState =
  | {
      errors?: Record<string, string[]>
      message?: string
      success?: boolean
    }
  | undefined

export async function signIn(
  _prevState: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const parsed = LoginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword(parsed.data)

  if (error) {
    return { message: error.message }
  }

  revalidatePath('/', 'layout')
  redirect(formData.get('next')?.toString() ?? '/')
}

export async function signUp(
  _prevState: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const parsed = SignUpSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signUp({
    ...parsed.data,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'}/auth/callback`,
    },
  })

  if (error) {
    return { message: error.message }
  }

  return {
    success: true,
    message:
      'Account created! Check your email to confirm your address, then log in.',
  }
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/login')
}

export async function forgotPassword(
  _prevState: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const parsed = ForgotPasswordSchema.safeParse({
    email: formData.get('email'),
  })

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'}/reset-password`,
  })

  if (error) {
    return { message: error.message }
  }

  return {
    success: true,
    message: 'Password reset link sent! Check your email.',
  }
}

export async function resetPassword(
  _prevState: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const parsed = ResetPasswordSchema.safeParse({
    password: formData.get('password'),
  })

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  })

  if (error) {
    return { message: error.message }
  }

  revalidatePath('/', 'layout')
  redirect('/')
}

export async function completeOnboarding(
  _prevState: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const parsed = OnboardingSchema.safeParse({
    username: formData.get('username'),
    display_name: formData.get('display_name'),
  })

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { message: 'You must be logged in.' }
  }

  // Check username uniqueness
  const { data: existing } = await supabase
    .from('profiles')
    .select('id')
    .eq('username', parsed.data.username)
    .neq('id', user.id)
    .single()

  if (existing) {
    return { errors: { username: ['This username is already taken.'] } }
  }

  const { error } = await supabase.from('profiles').upsert({
    id: user.id,
    username: parsed.data.username,
    display_name: parsed.data.display_name,
    bio: parsed.data.bio || null,
    avatar_url: parsed.data.avatar_url || null,
  })

  if (error) {
    return { message: error.message }
  }

  revalidatePath('/', 'layout')
  redirect('/')
}
