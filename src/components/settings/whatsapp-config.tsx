'use client';

import { useEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';
import {
  Eye,
  EyeOff,
  Copy,
  CheckCircle2,
  XCircle,
  Loader2,
  ExternalLink,
  Zap,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';
import { whatsappConfig as configApi } from '@/lib/api';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion';
import type { WhatsAppConfig as WhatsAppConfigType } from '@/types';

const MASKED_TOKEN = '••••••••••••••••';

type ConnectionStatus = 'connected' | 'disconnected' | 'unknown';
type ResetReason = 'token_corrupted' | 'meta_api_error' | null;

export function WhatsAppConfig() {
  const { user, loading: authLoading } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [showToken, setShowToken] = useState(false);
  const [config, setConfig] = useState<WhatsAppConfigType | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('unknown');
  const [resetReason, setResetReason] = useState<ResetReason>(null);
  const [statusMessage, setStatusMessage] = useState<string>('');

  const [phoneNumberId, setPhoneNumberId] = useState('');
  const [wabaId, setWabaId] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [verifyToken, setVerifyToken] = useState('');
  const [tokenEdited, setTokenEdited] = useState(false);

  const webhookUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/api/whatsapp/webhook`
      : '';

  const fetchConfig = useCallback(async (_userId: string) => {
    setLoading(true);
    try {
      const res = await configApi.get();
      const data = res.data;

      if (data && data.phone_number_id) {
        setConfig(data);
        setPhoneNumberId(data.phone_number_id || '');
        setWabaId(data.waba_id || '');
        setAccessToken(MASKED_TOKEN);
        setVerifyToken('');
        setTokenEdited(false);
        setConnectionStatus(data.status === 'active' ? 'connected' : 'disconnected');
        setResetReason(null);
        setStatusMessage('');
      } else {
        setConfig(null);
        setPhoneNumberId('');
        setWabaId('');
        setAccessToken('');
        setVerifyToken('');
        setTokenEdited(false);
        setConnectionStatus('disconnected');
        setResetReason(null);
        setStatusMessage('');
      }
    } catch (err) {
      console.error('fetchConfig error:', err);
      setConfig(null);
      setConnectionStatus('disconnected');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }
    fetchConfig(user.id);
  }, [authLoading, user, fetchConfig]);

  async function handleSave() {
    if (!phoneNumberId.trim()) {
      toast.error('Phone Number ID is required');
      return;
    }
    if (!config && (!accessToken.trim() || !tokenEdited)) {
      toast.error('Access Token is required for initial setup');
      return;
    }

    try {
      setSaving(true);
      const payload: Record<string, unknown> = {
        phone_number_id: phoneNumberId.trim(),
        waba_id: wabaId.trim() || null,
        verify_token: verifyToken.trim() || null,
      };

      if (tokenEdited && accessToken !== MASKED_TOKEN && accessToken.trim()) {
        payload.access_token = accessToken.trim();
      }

      await configApi.save(payload);
      toast.success('Configuration saved successfully');
      if (user) await fetchConfig(user.id);
    } catch (err) {
      console.error('Save error:', err);
      toast.error('Failed to save configuration');
    } finally {
      setSaving(false);
    }
  }

  async function handleTestConnection() {
    try {
      setTesting(true);
      const res = await configApi.get();
      const data = res.data;

      if (data && data.status === 'active') {
        setConnectionStatus('connected');
        setResetReason(null);
        setStatusMessage('');
        toast.success('API connection successful');
      } else {
        setConnectionStatus('disconnected');
        setStatusMessage('Connection check failed');
        toast.error('API connection failed');
      }
    } catch (err) {
      console.error('Test connection error:', err);
      setConnectionStatus('disconnected');
      toast.error('Connection test failed. Check network and try again.');
    } finally {
      setTesting(false);
    }
  }

  async function handleReset() {
    if (!confirm('This will delete the current WhatsApp config so you can re-enter it. Continue?')) {
      return;
    }

    try {
      setResetting(true);
      await configApi.delete();
      toast.success('Configuration cleared. You can now re-enter your credentials.');
      setConfig(null);
      setPhoneNumberId('');
      setWabaId('');
      setAccessToken('');
      setVerifyToken('');
      setTokenEdited(false);
      setConnectionStatus('disconnected');
      setResetReason(null);
      setStatusMessage('');
    } catch (err) {
      console.error('Reset error:', err);
      toast.error('Failed to reset configuration');
    } finally {
      setResetting(false);
    }
  }

  function handleCopyWebhookUrl() {
    navigator.clipboard.writeText(webhookUrl);
    toast.success('Webhook URL copied to clipboard');
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="size-6 animate-spin text-violet-500" />
      </div>
    );
  }

  const showResetBanner = resetReason === 'token_corrupted';

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_380px] mt-4">
      {/* Main config form */}
      <div className="space-y-6">
        {/* Corrupted-token reset banner */}
        {showResetBanner && (
          <Alert className="bg-amber-950/40 border-amber-600/40">
            <div className="flex items-start gap-3">
              <AlertTriangle className="size-5 text-amber-400 mt-0.5 shrink-0" />
              <div className="flex-1">
                <AlertTitle className="text-amber-200 mb-1">
                  Stored token can&apos;t be decrypted
                </AlertTitle>
                <AlertDescription className="text-amber-100/80 text-sm">
                  {statusMessage}
                </AlertDescription>
                <Button
                  onClick={handleReset}
                  disabled={resetting}
                  size="sm"
                  className="mt-3 bg-amber-600 hover:bg-amber-700 text-white"
                >
                  {resetting ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Resetting...
                    </>
                  ) : (
                    <>
                      <RotateCcw className="size-4" />
                      Reset Configuration
                    </>
                  )}
                </Button>
              </div>
            </div>
          </Alert>
        )}

        {/* Connection Status */}
        <Alert className="bg-theme-bg-card border-theme-border shadow-sm">
          <div className="flex items-center gap-2">
            {connectionStatus === 'connected' ? (
              <CheckCircle2 className="size-4 text-violet-500" />
            ) : (
              <XCircle className="size-4 text-red-500" />
            )}
            <AlertTitle className="text-theme-text mb-0">
              {connectionStatus === 'connected' ? 'Connected' : 'Not Connected'}
            </AlertTitle>
          </div>
          <AlertDescription className="text-theme-text-muted">
            {connectionStatus === 'connected'
              ? 'Your WhatsApp Business API is connected and ready to send/receive messages.'
              : statusMessage ||
                'Configure your Meta API credentials below to connect your WhatsApp Business account.'}
          </AlertDescription>
        </Alert>

        {/* API Credentials */}
        <Card className="bg-theme-bg-card border-theme-border shadow-sm ring-0 ring-transparent">
          <CardHeader>
            <CardTitle className="text-theme-text">API Credentials</CardTitle>
            <CardDescription className="text-theme-text-muted">
              Enter your Meta WhatsApp Business API credentials.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-theme-text-secondary">Phone Number ID</Label>
              <Input
                placeholder="e.g. 100234567890123"
                value={phoneNumberId}
                onChange={(e) => setPhoneNumberId(e.target.value)}
                className="bg-theme-bg-secondary border-theme-border text-theme-text placeholder:text-theme-text-muted/50"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-theme-text-secondary">WhatsApp Business Account ID</Label>
              <Input
                placeholder="e.g. 100234567890456"
                value={wabaId}
                onChange={(e) => setWabaId(e.target.value)}
                className="bg-theme-bg-secondary border-theme-border text-theme-text placeholder:text-theme-text-muted/50"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-theme-text-secondary">Permanent Access Token</Label>
              <div className="relative">
                <Input
                  type={showToken ? 'text' : 'password'}
                  placeholder="Enter your access token"
                  value={accessToken}
                  onChange={(e) => {
                    setAccessToken(e.target.value);
                    setTokenEdited(true);
                  }}
                  onFocus={() => {
                    if (accessToken === MASKED_TOKEN) {
                      setAccessToken('');
                      setTokenEdited(true);
                    }
                  }}
                  className="bg-theme-bg-secondary border-theme-border text-theme-text placeholder:text-theme-text-muted/50 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowToken(!showToken)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-theme-text-muted hover:text-theme-text transition-colors"
                >
                  {showToken ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              {config && !tokenEdited && (
                <p className="text-xs text-theme-text-muted">
                  Token is hidden for security. Re-enter it to update configuration.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-theme-text-secondary">Webhook Verify Token</Label>
              <Input
                placeholder="Create a custom verify token"
                value={verifyToken}
                onChange={(e) => setVerifyToken(e.target.value)}
                className="bg-theme-bg-secondary border-theme-border text-theme-text placeholder:text-theme-text-muted/50"
              />
              <p className="text-xs text-theme-text-muted">
                A custom string you create. Must match the token you set in Meta webhook settings.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Webhook URL */}
        <Card className="bg-theme-bg-card border-theme-border shadow-sm ring-0 ring-transparent">
          <CardHeader>
            <CardTitle className="text-theme-text">Webhook Configuration</CardTitle>
            <CardDescription className="text-theme-text-muted">
              Use this URL as your webhook callback in the Meta App Dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label className="text-theme-text-secondary">Webhook Callback URL</Label>
              <div className="flex gap-2">
                <Input
                  readOnly
                  value={webhookUrl}
                  className="bg-theme-bg-secondary border-theme-border text-theme-text-secondary font-mono text-sm"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleCopyWebhookUrl}
                  className="shrink-0 border-theme-border text-theme-text hover:text-theme-text hover:bg-theme-bg-hover"
                >
                  <Copy className="size-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3">
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-violet-600 hover:bg-violet-700 text-white"
          >
            {saving ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Configuration'
            )}
          </Button>
          <Button
            variant="outline"
            onClick={handleTestConnection}
            disabled={testing || !config}
            className="border-theme-border text-theme-text hover:text-theme-text hover:bg-theme-bg-hover"
          >
            {testing ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Testing...
              </>
            ) : (
              <>
                <Zap className="size-4" />
                Test API Connection
              </>
            )}
          </Button>
          {config && (
            <Button
              variant="outline"
              onClick={handleReset}
              disabled={resetting}
              className="border-red-900 text-red-400 hover:text-red-300 hover:bg-red-950/40"
            >
              {resetting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Resetting...
                </>
              ) : (
                <>
                  <RotateCcw className="size-4" />
                  Reset Configuration
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Setup Instructions Sidebar */}
      <div>
        <Card className="bg-theme-bg-card border-theme-border shadow-sm ring-0 ring-transparent">
          <CardHeader>
            <CardTitle className="text-theme-text text-base">Setup Instructions</CardTitle>
            <CardDescription className="text-theme-text-muted">
              Follow these steps to connect your WhatsApp Business API.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion>
              <AccordionItem className="border-theme-border">
                <AccordionTrigger className="text-theme-text-secondary hover:text-theme-text hover:no-underline">
                  <span className="flex items-center gap-2">
                    <span className="flex size-5 items-center justify-center rounded-full bg-violet-600 text-xs font-bold text-white">1</span>
                    Create a Meta App
                  </span>
                </AccordionTrigger>
                <AccordionContent className="text-theme-text-muted">
                  <ol className="list-decimal list-inside space-y-1 text-sm">
                    <li>Go to <span className="text-violet-400">developers.facebook.com</span></li>
                    <li>Click &quot;My Apps&quot; and then &quot;Create App&quot;</li>
                    <li>Select &quot;Business&quot; as the app type</li>
                    <li>Fill in app details and create</li>
                  </ol>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem className="border-theme-border">
                <AccordionTrigger className="text-theme-text-secondary hover:text-theme-text hover:no-underline">
                  <span className="flex items-center gap-2">
                    <span className="flex size-5 items-center justify-center rounded-full bg-violet-600 text-xs font-bold text-white">2</span>
                    Add WhatsApp Product
                  </span>
                </AccordionTrigger>
                <AccordionContent className="text-theme-text-muted">
                  <ol className="list-decimal list-inside space-y-1 text-sm">
                    <li>In your app dashboard, click &quot;Add Product&quot;</li>
                    <li>Find &quot;WhatsApp&quot; and click &quot;Set Up&quot;</li>
                    <li>Follow the setup wizard to link your business</li>
                  </ol>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem className="border-theme-border">
                <AccordionTrigger className="text-theme-text-secondary hover:text-theme-text hover:no-underline">
                  <span className="flex items-center gap-2">
                    <span className="flex size-5 items-center justify-center rounded-full bg-violet-600 text-xs font-bold text-white">3</span>
                    Get API Credentials
                  </span>
                </AccordionTrigger>
                <AccordionContent className="text-theme-text-muted">
                  <ol className="list-decimal list-inside space-y-1 text-sm">
                    <li>Go to WhatsApp &gt; API Setup</li>
                    <li>Copy your <strong className="text-theme-text">Phone Number ID</strong></li>
                    <li>Copy your <strong className="text-theme-text">WhatsApp Business Account ID</strong></li>
                    <li>Generate a <strong className="text-theme-text">Permanent Access Token</strong> from Business Settings &gt; System Users</li>
                  </ol>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem className="border-theme-border">
                <AccordionTrigger className="text-theme-text-secondary hover:text-theme-text hover:no-underline">
                  <span className="flex items-center gap-2">
                    <span className="flex size-5 items-center justify-center rounded-full bg-violet-600 text-xs font-bold text-white">4</span>
                    Configure Webhooks
                  </span>
                </AccordionTrigger>
                <AccordionContent className="text-theme-text-muted">
                  <ol className="list-decimal list-inside space-y-1 text-sm">
                    <li>Go to WhatsApp &gt; Configuration</li>
                    <li>Click &quot;Edit&quot; on the Webhook section</li>
                    <li>Paste the <strong className="text-theme-text">Webhook Callback URL</strong> from above</li>
                    <li>Enter the same <strong className="text-theme-text">Verify Token</strong> you set here</li>
                    <li>Subscribe to &quot;messages&quot; webhook field</li>
                  </ol>
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            <div className="mt-4 pt-4 border-t border-theme-border">
              <a
                href="https://developers.facebook.com/docs/whatsapp/cloud-api/get-started"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-violet-400 hover:text-violet-300 transition-colors"
              >
                <ExternalLink className="size-3.5" />
                Meta WhatsApp API Documentation
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
