import { WebView } from 'react-native-webview';

type RPMWebViewProps = {
  creatorUrl: string;
  onAvatarCreated: (url: string) => void;
};

export function getReadyPlayerMeCreatorUrl() {
  const explicitUrl = process.env.EXPO_PUBLIC_READY_PLAYER_ME_CREATOR_URL?.trim();
  if (explicitUrl?.startsWith('https://')) return explicitUrl;

  const subdomain = process.env.EXPO_PUBLIC_READY_PLAYER_ME_SUBDOMAIN?.trim();
  if (subdomain) return `https://${subdomain}.readyplayer.me/avatar?frameApi`;

  return null;
}

export default function RPMWebView({ creatorUrl, onAvatarCreated }: RPMWebViewProps) {
  function handleMessage(event: { nativeEvent: { data: string } }) {
    try {
      const data = JSON.parse(event.nativeEvent.data) as {
        source?: string;
        eventName?: string;
        data?: { url?: string };
      };

      if (
        data.source === 'readyplayerme' &&
        data.eventName === 'v1.avatar.exported' &&
        data.data?.url
      ) {
        onAvatarCreated(data.data.url);
      }
    } catch {
      // Ignore non-RPM messages from the embedded editor.
    }
  }

  return (
    <WebView
      source={{ uri: creatorUrl }}
      style={{ flex: 1 }}
      onMessage={handleMessage}
      javaScriptEnabled
      injectedJavaScript={`
        window.addEventListener('message', (event) => {
          if (event.data && event.data.source === 'readyplayerme') {
            window.ReactNativeWebView.postMessage(JSON.stringify(event.data));
          }
        });
      `}
    />
  );
}
