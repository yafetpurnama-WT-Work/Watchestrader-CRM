'use client';

import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Loader2, Upload, Trash2, Mail, CircleAlert } from 'lucide-react';

import { auth as authApi } from '@/lib/api';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/avatar';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';

const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
const ALLOWED_MIME = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
]);

// Rough email shape check — the real validator is Supabase Auth, which
// rejects anything malformed when we call updateUser({ email }). We
// just want to stop obvious typos before making a network call.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function ProfileForm() {
  const { user, profile, refreshProfile } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [pendingAvatar, setPendingAvatar] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [removeAvatar, setRemoveAvatar] = useState(false);
  const [saving, setSaving] = useState(false);
  const [emailChangePending, setEmailChangePending] = useState(false);

  // Seed form state once the profile loads.
  useEffect(() => {
    if (!profile) return;
    setFullName(profile.full_name ?? '');
    setEmail(profile.email ?? '');
  }, [profile]);

  // Cleanup object URLs to avoid leaks.
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const currentAvatar =
    previewUrl ?? (!removeAvatar ? profile?.avatar_url ?? null : null);

  const initial = (fullName || profile?.full_name || profile?.email || 'U')
    .charAt(0)
    .toUpperCase();

  const onPickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // reset so the same file can be re-picked
    if (!file) return;

    if (!ALLOWED_MIME.has(file.type)) {
      toast.error('Unsupported image type', {
        description: 'Use PNG, JPG, WebP, or GIF.',
      });
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      toast.error('Image is too large', {
        description: 'Maximum 2 MB.',
      });
      return;
    }

    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPendingAvatar(file);
    setPreviewUrl(URL.createObjectURL(file));
    setRemoveAvatar(false);
  };

  const onRemoveAvatar = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPendingAvatar(null);
    setPreviewUrl(null);
    setRemoveAvatar(true);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile) return;

    const trimmedName = fullName.trim();
    if (!trimmedName) {
      toast.error('Display name is required');
      return;
    }
    const trimmedEmail = email.trim();
    if (!EMAIL_RE.test(trimmedEmail)) {
      toast.error('Enter a valid email address');
      return;
    }

    setSaving(true);
    try {
      let nextAvatarUrl: string | null = profile.avatar_url ?? null;

      // Avatar upload via base64 data URL (simplified — server-side file upload can be added later)
      if (pendingAvatar) {
        // For now, use the preview URL as a placeholder
        nextAvatarUrl = previewUrl;
      } else if (removeAvatar) {
        nextAvatarUrl = null;
      }

      // Save profile with name, email, and avatar
      const updateData: Record<string, any> = {
        full_name: trimmedName,
        avatar_url: nextAvatarUrl,
      };

      const emailChanged = trimmedEmail.toLowerCase() !== profile.email.toLowerCase();
      if (emailChanged) {
        updateData.email = trimmedEmail;
      }

      await authApi.updateProfile(updateData);

      setEmailChangePending(emailChanged);
      setPendingAvatar(null);
      setPreviewUrl(null);
      setRemoveAvatar(false);
      await refreshProfile();

      toast.success(
        emailChanged
          ? 'Profile saved — email updated'
          : 'Profile saved',
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const dirty =
    !!profile &&
    (fullName.trim() !== (profile.full_name ?? '') ||
      email.trim().toLowerCase() !== (profile.email ?? '').toLowerCase() ||
      pendingAvatar !== null ||
      removeAvatar);

  const joined = (user as any)?.created_at
    ? new Date((user as any).created_at).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '—';

  return (
    <Card className="bg-theme-bg-card border-theme-border shadow-sm">
      <CardHeader>
        <CardTitle className="text-theme-text">Profile</CardTitle>
        <CardDescription className="text-theme-text-muted">
          How you show up across the app. Your avatar and name appear in the
          header, sidebar, and anywhere your teammates see you.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={onSubmit} className="space-y-6">
          {/* Avatar row */}
          <div className="flex flex-wrap items-center gap-5">
            <Avatar size="lg" className="size-16">
              {currentAvatar ? (
                <AvatarImage src={currentAvatar} alt={fullName || 'Avatar'} />
              ) : null}
              <AvatarFallback className="bg-violet-500/10 text-base text-violet-400">
                {initial}
              </AvatarFallback>
            </Avatar>

            <div className="flex flex-wrap gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                className="hidden"
                onChange={onPickFile}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={saving}
              >
                <Upload className="size-4" />
                {currentAvatar ? 'Change photo' : 'Upload photo'}
              </Button>
              {currentAvatar && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={onRemoveAvatar}
                  disabled={saving}
                  className="text-theme-text-muted hover:text-theme-text"
                >
                  <Trash2 className="size-4" />
                  Remove
                </Button>
              )}
              <p className="w-full text-xs text-theme-text-muted">
                PNG, JPG, WebP, or GIF. Up to 2 MB.
              </p>
            </div>
          </div>

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="profile-full-name" className="text-theme-text-secondary">
              Display name
            </Label>
            <Input
              id="profile-full-name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Ada Lovelace"
              maxLength={120}
              disabled={saving}
              required
            />
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="profile-email" className="text-theme-text-secondary">
              Email
            </Label>
            <Input
              id="profile-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={saving}
              required
            />
            {emailChangePending && (
              <p className="flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-xs text-amber-300">
                <Mail className="mt-0.5 size-3.5 shrink-0" />
                <span>
                  Check the inbox for <strong>{profile?.email}</strong> and{' '}
                  <strong>{email}</strong> — both need to confirm before the
                  change takes effect.
                </span>
              </p>
            )}
          </div>

          {/* Read-only block */}
          <div className="rounded-lg border border-theme-border bg-theme-bg-secondary p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-theme-text-muted">
              Account details
            </p>
            <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-theme-text-muted">Role</dt>
                <dd className="mt-0.5 font-mono text-theme-text-secondary">
                  {profile?.role ?? 'user'}
                </dd>
              </div>
              <div>
                <dt className="text-theme-text-muted">Joined</dt>
                <dd className="mt-0.5 text-theme-text-secondary">{joined}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-theme-text-muted">User ID</dt>
                <dd className="mt-0.5 break-all font-mono text-xs text-theme-text-muted">
                  {user?.id ?? '—'}
                </dd>
              </div>
            </dl>
          </div>

          {!profile && (
            <p className="flex items-center gap-2 text-sm text-theme-text-muted">
              <CircleAlert className="size-4" />
              Loading your profile…
            </p>
          )}

          <div className="flex justify-end">
            <Button type="submit" disabled={saving || !dirty || !profile}>
              {saving ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Saving…
                </>
              ) : (
                'Save changes'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
