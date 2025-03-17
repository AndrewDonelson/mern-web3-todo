// file: client/src/components/Profile/SecuritySettings.tsx
// description: Security settings panel for user account
// module: Client
// License: MIT
// Author: Andrew Donelson
// Copyright 2025 Andrew Donelson

import React, { useState } from 'react';
import { Loader2, AlertTriangle, Check, RefreshCw } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';

export const SecuritySettings: React.FC = () => {
  const { toast } = useToast();
  const [isGeneratingBackup, setIsGeneratingBackup] = useState(false);
  const [isRegeneratingKey, setIsRegeneratingKey] = useState(false);
  const [settings, setSettings] = useState({
    twoFactorAuth: false,
    signatureVerification: true,
    emailAlerts: true,
    activityLogging: true,
  });

  const handleToggleSetting = (setting: keyof typeof settings) => {
    setSettings(prev => ({ ...prev, [setting]: !prev[setting] }));
  };

  const handleGenerateBackup = async () => {
    try {
      setIsGeneratingBackup(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // In a real app, this would trigger a download of the backup
      const dummyBackupData = JSON.stringify({
        userId: "user123",
        timestamp: new Date().toISOString(),
        backupData: "encrypted-data-would-go-here",
      }, null, 2);
      
      // Create a Blob and download it
      const blob = new Blob([dummyBackupData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `wallet-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Backup created",
        description: "Your wallet backup has been generated successfully.",
        variant: "success",
      });
    } catch (error: any) {
      console.error("Failed to generate backup:", error);
      toast({
        title: "Backup failed",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingBackup(false);
    }
  };

  const handleRegenerateKey = async () => {
    try {
      setIsRegeneratingKey(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1200));
      
      toast({
        title: "API Key regenerated",
        description: "Your new API key has been generated. Please update your applications.",
        variant: "success",
      });
    } catch (error: any) {
      console.error("Failed to regenerate key:", error);
      toast({
        title: "Regeneration failed",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsRegeneratingKey(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Security Settings</CardTitle>
          <CardDescription>
            Configure your account security preferences and authentication methods.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert className="border-primary/50 bg-primary/10">
            <Check className="h-4 w-4 text-primary" />
            <AlertTitle>Your account is secure</AlertTitle>
            <AlertDescription>
              Your security settings are up to date. Your last login was from Chrome on Windows at 12:42 PM today.
            </AlertDescription>
          </Alert>
          
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="two-factor">Two-Factor Authentication</Label>
                <p className="text-xs text-muted-foreground">
                  Require a code from your authenticator app when signing in
                </p>
              </div>
              <Switch
                id="two-factor"
                checked={settings.twoFactorAuth}
                onCheckedChange={() => handleToggleSetting('twoFactorAuth')}
              />
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="signature">Signature Verification</Label>
                <p className="text-xs text-muted-foreground">
                  Require wallet signature verification for all transactions
                </p>
              </div>
              <Switch
                id="signature"
                checked={settings.signatureVerification}
                onCheckedChange={() => handleToggleSetting('signatureVerification')}
              />
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="email-alerts">Security Alerts via Email</Label>
                <p className="text-xs text-muted-foreground">
                  Receive email notifications for suspicious activities
                </p>
              </div>
              <Switch
                id="email-alerts"
                checked={settings.emailAlerts}
                onCheckedChange={() => handleToggleSetting('emailAlerts')}
              />
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="activity-log">Activity Logging</Label>
                <p className="text-xs text-muted-foreground">
                  Keep a detailed log of all account activities
                </p>
              </div>
              <Switch
                id="activity-log"
                checked={settings.activityLogging}
                onCheckedChange={() => handleToggleSetting('activityLogging')}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Wallet Backup</CardTitle>
          <CardDescription>
            Create a secure backup of your wallet credentials
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Generate an encrypted backup file of your wallet credentials. Store this file in a secure location
            to recover your wallet in case of device loss or failure.
          </p>
          <Alert variant="destructive" className="border-destructive/50 bg-destructive/10">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Important security notice</AlertTitle>
            <AlertDescription>
              Never share your backup file or private keys with anyone. Keep multiple copies of your backup file in secure locations.
            </AlertDescription>
          </Alert>
        </CardContent>
        <CardFooter>
          <Button 
            variant="outline" 
            className="gap-1"
            onClick={handleGenerateBackup} 
            disabled={isGeneratingBackup}
          >
            {isGeneratingBackup && <Loader2 className="h-4 w-4 animate-spin" />}
            {isGeneratingBackup ? "Generating..." : "Generate Backup"}
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>API Access</CardTitle>
          <CardDescription>
            Manage your API key for external applications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-md bg-muted p-3">
            <div className="text-xs font-mono break-all">
              {/* Mock API key - would come from backend in real app */}
              {process.env.REACT_APP_API_KEY || "sk_test_••••••••••••••••••••••••"}
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            This key provides access to all API features. Regenerating will invalidate the current key.
          </p>
        </CardContent>
        <CardFooter>
          <Button 
            variant="outline" 
            className="gap-1 text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={handleRegenerateKey}
            disabled={isRegeneratingKey}
          >
            {isRegeneratingKey ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            {isRegeneratingKey ? "Regenerating..." : "Regenerate API Key"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};