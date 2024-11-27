import * as React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './dialog';
import { Button } from './button';
import { Input } from './input';

interface DialogProviderProps {
  children: React.ReactNode;
}

interface DialogOptions {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  input?: {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
  };
}

interface DialogContext {
  showDialog: (options: DialogOptions) => Promise<boolean>;
}

const DialogContext = React.createContext<DialogContext | undefined>(undefined);

export function DialogProvider({ children }: DialogProviderProps) {
  const [dialog, setDialog] = React.useState<{
    isOpen: boolean;
    options: DialogOptions;
    resolve: ((value: boolean) => void) | null;
    inputValue: string;
  }>({
    isOpen: false,
    options: { title: '' },
    resolve: null,
    inputValue: '',
  });

  const showDialog = React.useCallback((options: DialogOptions) => {
    return new Promise<boolean>((resolve) => {
      setDialog({
        isOpen: true,
        options,
        resolve,
        inputValue: options.input?.value || '',
      });
    });
  }, []);

  const handleClose = React.useCallback((value: boolean) => {
    if (dialog.resolve) {
      if (dialog.options.input?.onChange) {
        dialog.options.input.onChange(dialog.inputValue);
      }
      dialog.resolve(value);
    }
    setDialog((prev) => ({ ...prev, isOpen: false }));
  }, [dialog]);

  const handleInputChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setDialog(prev => ({ ...prev, inputValue: e.target.value }));
    if (dialog.options.input?.onChange) {
      dialog.options.input.onChange(e.target.value);
    }
  }, [dialog.options.input]);

  return (
    <DialogContext.Provider value={{ showDialog }}>
      {children}
      <Dialog open={dialog.isOpen} onOpenChange={(open) => !open && handleClose(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dialog.options.title}</DialogTitle>
            {dialog.options.description && (
              <DialogDescription>
                {dialog.options.description}
              </DialogDescription>
            )}
          </DialogHeader>
          
          {dialog.options.input && (
            <div className="py-4">
              <Input
                value={dialog.inputValue}
                onChange={handleInputChange}
                placeholder={dialog.options.input.placeholder}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && dialog.inputValue.trim()) {
                    handleClose(true);
                  }
                }}
              />
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => handleClose(false)}>
              {dialog.options.cancelLabel || 'Cancel'}
            </Button>
            <Button 
              onClick={() => handleClose(true)}
              disabled={dialog.options.input && !dialog.inputValue.trim()}
            >
              {dialog.options.confirmLabel || 'Continue'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DialogContext.Provider>
  );
}

export function useDialog() {
  const context = React.useContext(DialogContext);
  if (!context) {
    throw new Error('useDialog must be used within a DialogProvider');
  }
  return context;
}