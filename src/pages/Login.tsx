import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '../integrations/supabase/client';

export function Login() {
  return (
    <div className="auth-screen">
      <div className="auth-card">
        <div className="roda-mark">🪘</div>
        <h1 className="auth-title">Roda de Notas</h1>
        <p className="auth-sub">Connectez-vous pour ouvrir le cahier</p>
        <Auth
          supabaseClient={supabase}
          socialLayout="vertical"
          providers={[]}
          localization={{
            variables: {
              sign_up: {
                email_label: 'E-mail',
                password_label: 'Mot de passe',
                button_label: 'Créer un compte',
              },
              sign_in: {
                email_label: 'E-mail',
                password_label: 'Mot de passe',
                button_label: 'Se connecter',
              },
            },
          }}
          appearance={{
            theme: ThemeSupa,
            style: {
              button: { background: 'var(--terracotta)', border: 'none' },
              anchor: { color: 'var(--terracotta)' },
              input: { borderColor: 'var(--border)' },
            },
          }}
        />
      </div>
    </div>
  );
}