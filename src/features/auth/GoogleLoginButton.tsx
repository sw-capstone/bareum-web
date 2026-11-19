import { useEffect, useRef, useState } from 'react';
import { env } from '../../config/env';

type GoogleIdentity = {
  accounts: {
    id: {
      initialize: (options: {
        client_id: string;
        callback: (response: { credential?: string }) => void;
      }) => void;
      renderButton: (
        element: HTMLElement,
        options: {
          type: 'standard';
          theme: 'outline';
          size: 'large';
          width: number;
          text: 'signin_with';
        },
      ) => void;
    };
  };
};

declare global {
  interface Window {
    google?: GoogleIdentity;
  }
}

let scriptPromise: Promise<void> | null = null;

function loadGoogleIdentity() {
  if (window.google) return Promise.resolve();
  if (!scriptPromise) {
    scriptPromise = new Promise<void>((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => {
        script.remove();
        scriptPromise = null;
        reject(new Error('Google 로그인 화면을 불러오지 못했습니다. 다시 시도해 주세요.'));
      };
      document.head.append(script);
    });
  }
  return scriptPromise;
}

export function GoogleLoginButton({ onCredential }: { onCredential: (idToken: string) => void }) {
  const container = useRef<HTMLDivElement>(null);
  const callback = useRef(onCredential);
  const [error, setError] = useState('');

  useEffect(() => {
    callback.current = onCredential;
  }, [onCredential]);

  useEffect(() => {
    let active = true;
    loadGoogleIdentity()
      .then(() => {
        if (!active || !container.current || !window.google) return;
        container.current.replaceChildren();
        window.google.accounts.id.initialize({
          client_id: env.googleClientId,
          callback: ({ credential }) => {
            if (active && credential) callback.current(credential);
          },
        });
        window.google.accounts.id.renderButton(container.current, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          width: Math.min(container.current.clientWidth || 400, 400),
          text: 'signin_with',
        });
      })
      .catch((cause) => {
        if (active)
          setError(cause instanceof Error ? cause.message : 'Google 로그인을 불러오지 못했습니다.');
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <>
      <div className="google-login-button" ref={container} aria-label="Google 로그인" />
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
    </>
  );
}
