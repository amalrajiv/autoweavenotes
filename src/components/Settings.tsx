import React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "./ui/sheet";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { useSettings } from '@/store/useSettingsStore';
import { useTheme } from './theme-provider';

interface SettingsProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export const Settings: React.FC<SettingsProps> = ({ isOpen, onOpenChange }) => {
  const { apiKey, setApiKey } = useSettings();
  const { theme, setTheme } = useTheme();

  const handleSave = () => {
    onOpenChange(false);
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle>Settings</SheetTitle>
        </SheetHeader>
        
        <div className="py-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="openai-key">OpenAI API Key</Label>
              <Input
                id="openai-key"
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-..."
              />
              <p className="text-sm text-muted-foreground">
                Your API key is stored locally and never sent to our servers.
                Get your API key from{" "}
                <a
                  href="https://platform.openai.com/api-keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  OpenAI's dashboard
                </a>
                .
              </p>
            </div>

            <div className="space-y-2">
              <Label>Theme</Label>
              <div className="grid grid-cols-3 gap-2">
                {["light", "dark", "system", "dim", "nord", "sunset"].map((t) => (
                  <Button
                    key={t}
                    variant={theme === t ? "default" : "outline"}
                    size="sm"
                    onClick={() => setTheme(t as any)}
                    className="capitalize"
                  >
                    {t}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="font-medium">Data Management</h3>
              <Button variant="destructive" size="sm">
                Clear All Notes
              </Button>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <Button onClick={handleSave}>Save Changes</Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};