import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

export const AuthScreen: React.FC = () => {
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [authError, setAuthError] = useState('');
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setAuthError('');

    try {
      if (authMode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { first_name: firstName.trim(), last_name: lastName.trim() } },
        });
        if (error) throw error;
        if (!data.session) {
          setAuthError('__confirm__');
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err: any) {
      let msg = err?.message || 'Une erreur est survenue.';
      if (/already registered/i.test(msg)) msg = 'Un compte existe déjà avec cet e-mail.';
      if (/invalid login credentials/i.test(msg)) msg = 'E-mail ou mot de passe incorrect.';
      if (/password should be/i.test(msg)) msg = 'Le mot de passe doit contenir au moins 6 caractères.';
      setAuthError(msg);
    } finally {
      setBusy(false);
    }
  };

  const confirmMsg = authError === '__confirm__';

  return (
    <div className="w-full h-full min-h-screen flex items-center justify-center bg-gradient-to-br from-capoeiraBlue via-capoeiraGreen to-capoeiraGold p-4">
      <div className="bg-surface border border-border rounded-card p-8 w-full max-w-md shadow-xl">
        <div className="w-12 h-12 rounded-full border-2 border-dashed border-terracotta flex items-center justify-center text-xl mx-auto mb-4 animate-spin-slow">
          🪘
        </div>
        <h1 className="text-2xl font-bold font-display text-center text-ink mb-1">Roda de Notas</h1>
        <p className="text-xs text-center text-muted mb-6">
          {authMode === 'signup' ? 'Créez votre compte enseignant·e' : 'Connectez-vous pour ouvrir le cahier'}
        </p>

        {confirmMsg && (
          <div className="bg-capoeiraGreen-soft text-capoeiraGreen text-xs p-3 rounded-lg mb-4">
            Compte créé ! Vérifiez votre e-mail pour confirmer, puis connectez-vous.
          </div>
        )}

        {authError && !confirmMsg && (
          <div className="bg-terracotta-soft text-terracotta text-xs p-3 rounded-lg mb-4">
            {authError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          {authMode === 'signup' && (
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs font-semibold text-ink mb-1">Prénom</label>
                          <input
                            type="text"
                            required
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-border rounded-lg outline-none focus:border-capoeiraBlue"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-ink mb-1">Nom</label>
                          <input
                            type="text"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-border rounded-lg outline-none focus:border-capoeiraBlue"
                          />
                        </div>
                      </div>
                    )}
          
                    <div>
                      <label className="block text-xs font-semibold text-ink mb-1">E-mail</label>
                      <input
                        type="email"
                        required
                        autoComplete="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-border rounded-lg outline-none focus:border-capoeiraBlue"
                      />
                    </div>
          
                    <div>
                      <label className="block text-xs font-semibold text-ink mb-1">Mot de passe</label>
                      <input
                        type="password"
                        required
                        minLength={6}
                        autoComplete={authMode === 'signup' ? 'new-password' : 'current-password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-border rounded-lg outline-none focus:border-capoeiraBlue"
                      />
                    </div>
          
                    <button
                      type="submit"
                      disabled={busy}
                      className="w-full bg-capoeiraBlue text-white py-2.5 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 mt-2"
                    >
                      {busy ? 'Patientez…' : authMode === 'signup' ? 'Créer le compte' : 'Se connecter'}
                    </button>
        </form>

        <div className="text-center text-xs text-muted mt-5">
          {authMode === 'signup' ? 'Déjà un compte ? ' : 'Pas encore de compte ? '}
          <button
            type="button"
            onClick={() => {
              setAuthMode(authMode === 'signup' ? 'login' : 'signup');
              setAuthError('');
            }}
            className="text-terracotta font-semibold hover:underline"
          >
            {authMode === 'signup' ? 'Se connecter' : 'Créer un compte'}
          </button>
        </div>
      </div>
    </div>
  );
};