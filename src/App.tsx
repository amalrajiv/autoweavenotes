import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { NoteTabs } from './components/NoteTabs';
import { PublicNote } from './components/PublicNote';
import { ThemeProvider } from './components/theme-provider';
import { useNoteStore } from './store/useNoteStore';
import { SageProvider } from './components/chat/sage-provider';
import { DialogProvider } from './components/ui/dialog-provider';
import { AuthProvider } from './components/auth/auth-provider';
import { useAuth } from './components/auth/auth-provider';

function AppContent() {
  const { loadNotes } = useNoteStore();
  const { session } = useAuth();

  React.useEffect(() => {
    if (session) {
      loadNotes().catch(console.error);
    }
  }, [loadNotes, session]);

  return (
    <div className="flex h-screen bg-background text-foreground">
      <Sidebar />
      <NoteTabs />
    </div>
  );
}

const App: React.FC = () => {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="ui-theme">
      <AuthProvider>
        <DialogProvider>
          <SageProvider>
            <Router>
              <Routes>
                <Route path="/notes/:publicId" element={<PublicNote />} />
                <Route path="*" element={<AppContent />} />
              </Routes>
            </Router>
          </SageProvider>
        </DialogProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;