import { useState } from 'react';
import { useAuth } from '@/lib/AuthContext';   // <-- new import
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Loader2, LogIn, CheckCircle2 } from 'lucide-react';
import { LANGUAGES } from '@/lib/elevenlabs';
import { getMachinisteLabel, getProjectLabel } from '@/lib/audiotool-nexus';

export default function GlobalControls({
  elevenLabsApiKey,
  onElevenLabsApiKeyChange,
  outputFormat,
  onOutputFormatChange,
  authStatus,
  authError,
  onLogin,
  userName,
  projects,
  loadingProjects,
  selectedProjectName,
  onProjectSelect,
  connectionStatus,
  connectionError,
  machinistes,
  selectedMachinisteId,
  onMachinisteSelect,
  voices,
  selectedVoiceId,
  onVoiceSelect,
  selectedLanguage,
  onLanguageChange,
}) {
  const [showKeyDialog, setShowKeyDialog] = useState(false);
  const [keyDraft, setKeyDraft] = useState('');
  const [showLogoutDialog, setShowLogoutDialog] = useState(false); // new state
  const { logout } = useAuth();          // <-- add this line to access the logout function
  const isAuthenticated = authStatus === 'authenticated';
  const isChecking = authStatus === 'checking';
  const isOpen = connectionStatus === 'connected';
  const isOpening = connectionStatus === 'connecting';
  const voicesLoading = elevenLabsApiKey && voices.length === 0;

  const handleOpenKeyDialog = () => {
    setKeyDraft('');
    setShowKeyDialog(true);
  };

  const handleSaveKey = () => {
    if (keyDraft.trim()) {
      onElevenLabsApiKeyChange(keyDraft.trim());
    }
    setShowKeyDialog(false);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Audiotool column (left) */}
        <div className="space-y-2">
          <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Audiotool
          </Label>

          {isAuthenticated ? (
            <div className="flex items-center gap-2 h-9">
              <CheckCircle2 className="h-3.5 w-3.5 text-green-400 shrink-0" />
              {/* Make the label clickable to open logout dialog */}
              <button
                type="button"
                onClick={() => setShowLogoutDialog(true)}
                className="flex items-center gap-1.5 h-9 px-0 py-0 text-xs text-card-foreground focus:outline-none"
              >
                Connected
              </button>
            </div>
          ) : isChecking ? (
            <div className="flex items-center gap-2 h-9">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Checking…</span>
            </div>
          ) : (
            <Button onClick={onLogin} size="sm" className="h-9 w-full">
              <LogIn className="h-3.5 w-3.5" />
              Connect with Audiotool
            </Button>
          )}

          {authError && !isAuthenticated && (
            <p className="text-xs text-destructive truncate">{authError}</p>
          )}

          {isAuthenticated && (
            <div className="flex flex-wrap items-center gap-2">
              <Select
                value={selectedProjectName || undefined}
                onValueChange={onProjectSelect}
                disabled={loadingProjects || isOpening}
              >
                <SelectTrigger className="h-8 w-auto text-xs min-w-[160px]">
                  <SelectValue placeholder={loadingProjects ? 'Loading projects…' : 'Select project'} />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((p) => (
                    <SelectItem key={p.name} value={p.name}>
                      {getProjectLabel(p)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {isOpening && (
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  opening…
                </span>
              )}

              {connectionError && (
                <span className="text-xs text-destructive truncate max-w-[220px]">{connectionError}</span>
              )}

              {isOpen && machinistes.length > 0 && (
                <Select value={selectedMachinisteId || undefined} onValueChange={onMachinisteSelect}>
                  <SelectTrigger className="h-8 w-auto text-xs min-w-[140px]">
                    <SelectValue placeholder="Select Machiniste" />
                  </SelectTrigger>
                  <SelectContent>
                    {machinistes.map((m, i) => (
                      <SelectItem key={m.id} value={m.id}>
                        {getMachinisteLabel(m, i)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          )}
        </div>

        {/* ElevenLabs column (right) */}
        <div className="space-y-2">
          <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
            ElevenLabs
          </Label>

          <button
            type="button"
            onClick={handleOpenKeyDialog}
            className="flex items-center gap-2 h-9 w-full rounded-md hover:bg-background/30 transition-colors -mx-1 px-1"
          >
            <CheckCircle2
              className={`h-3.5 w-3.5 shrink-0 ${voices.length > 0 ? 'text-green-400' : 'text-accent'}`}
            />
            <span className="text-xs text-card-foreground truncate flex-1 text-left">API Key</span>
          </button>

          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={selectedVoiceId || undefined}
              onValueChange={onVoiceSelect}
              disabled={!elevenLabsApiKey || voicesLoading}
            >
              <SelectTrigger className="h-8 w-auto text-xs min-w-[140px]">
                <SelectValue placeholder={voicesLoading ? 'Loading voices…' : 'Voice'} />
              </SelectTrigger>
              <SelectContent>
                {voices.map((v) => (
                  <SelectItem key={v.voice_id} value={v.voice_id}>
                    {v.name}
                    {v.labels?.gender ? ` · ${v.labels.gender}` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedLanguage || undefined} onValueChange={onLanguageChange}>
              <SelectTrigger className="h-8 w-auto text-xs min-w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map((lang) => (
                  <SelectItem key={lang.code} value={lang.code}>
                    {lang.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={outputFormat} onValueChange={onOutputFormatChange}>
              <SelectTrigger className="h-8 w-auto text-xs min-w-[70px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mp3">MP3</SelectItem>
                <SelectItem value="wav">WAV</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Logout confirmation dialog */}
      <Dialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm logout</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to disconnect from Audiotool?
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowLogoutDialog(false)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => {
                logout(); // clear token & update context
                setShowLogoutDialog(false);
              }}
            >
              Logout
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showKeyDialog} onOpenChange={setShowKeyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change ElevenLabs API Key</DialogTitle>
          </DialogHeader>
          <Input
            type="password"
            value={keyDraft}
            onChange={(e) => setKeyDraft(e.target.value)}
            placeholder="Paste your xi-api-key…"
            className="font-mono text-xs"
            spellCheck={false}
          />
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setShowKeyDialog(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSaveKey} disabled={!keyDraft.trim()}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}