import { WebView } from 'react-native-webview';

const RPM_SUBDOMAIN = 'futbolapp';

type RPMWebViewProps = {
  onAvatarCreated: (url: string) => void;
};

export default function RPMWebView({ onAvatarCreated }: RPMWebViewProps) {
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
      source={{ uri: `https://${RPM_SUBDOMAIN}.readyplayer.me/avatar?frameApi` }}
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
