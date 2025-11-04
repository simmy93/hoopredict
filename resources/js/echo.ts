import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

declare global {
  interface Window {
    Pusher: typeof Pusher;
    Echo: any;
  }
}

window.Pusher = Pusher;

try {
  window.Echo = new Echo({
    broadcaster: "reverb",
    key: import.meta.env.VITE_REVERB_APP_KEY,
    wsHost: import.meta.env.VITE_REVERB_HOST ?? window.location.hostname,
    wsPort: Number(import.meta.env.VITE_REVERB_PORT ?? 8080),
    wssPort: Number(import.meta.env.VITE_REVERB_PORT ?? 443),
    forceTLS: (import.meta.env.VITE_REVERB_SCHEME ?? "https") === "https",
    enabledTransports: ["ws", "wss"],
    disableStats: true,
    authEndpoint: '/broadcasting/auth',
  });

  // Add connection state listeners
  if (window.Echo.connector && window.Echo.connector.pusher) {
    window.Echo.connector.pusher.connection.bind('connected', () => {
      console.log('✅ Pusher connected successfully');
    });

    window.Echo.connector.pusher.connection.bind('disconnected', () => {
      console.warn('⚠️ Pusher disconnected');
    });

    window.Echo.connector.pusher.connection.bind('error', (err: any) => {
      console.error('❌ Pusher connection error:', err);
    });

    window.Echo.connector.pusher.connection.bind('unavailable', () => {
      console.error('❌ Pusher connection unavailable');
    });
  }
} catch (error) {
  console.error('❌ Failed to initialize Echo:', error);
}
