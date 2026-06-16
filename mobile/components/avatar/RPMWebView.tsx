import { WebView } from 'react-native-webview';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import { colors } from '@/lib/theme';

const RPM_SUBDOMAIN = 'futbolapp'; // Subdominio predeterminado o el del proyecto

type RPMWebViewProps = {
  onAvatarCreated: (url: string) => void;
  onCancel?: () => void;
};

export default function RPMWebView({ onAvatarCreated, onCancel }: RPMWebViewProps) {
  function handleMessage(event: any) {
    try {
      const data = JSON.parse(event.nativeEvent.data);

      if (data.source === 'readyplayerme') {
        if (data.eventName === 'v1.avatar.exported' && data.data?.url) {
          onAvatarCreated(data.data.url);
        } else if (data.eventName === 'v1.user.set') {
          // Usuario logueado en RPM o iniciado
        }
      }
    } catch (e) {
      // Ignorar mensajes no válidos
    }
  }

  // URL del editor de Ready Player Me con parámetros para optimizar la experiencia mobile
  // frameApi: habilita la comunicación por mensajes
  // headOnly: falso para ver el cuerpo completo (necesario para FIFA card)
  const uri = `https://${RPM_SUBDOMAIN}.readyplayer.me/avatar?frameApi&clearCache&bodyType=fullbody`;

  return (
    <View style={styles.container}>
      <WebView
        source={{ uri }}
        style={styles.webview}
        onMessage={handleMessage}
        javaScriptEnabled
        domStorageEnabled
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        originWhitelist={['*']}
        startInLoadingState
        renderLoading={() => (
          <View style={styles.loading}>
            <ActivityIndicator color={colors.accent} size="large" />
          </View>
        )}
        injectedJavaScript={`
          (function() {
            window.addEventListener('message', function(event) {
              if (event.data && event.data.source === 'readyplayerme') {
                window.ReactNativeWebView.postMessage(JSON.stringify(event.data));
              }
            });
          })();
        `}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  loading: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    backgroundColor: colors.background,
    justifyContent: 'center',
  },
});
