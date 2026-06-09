import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Dimensions } from 'react-native';
import ConfettiCannon from 'react-native-confetti-cannon';
import { theme } from '@/lib/theme';

interface MatchResultModalProps {
  visible: boolean;
  onClose: () => void;
  result: 'win' | 'loss' | 'draw';
  score: string;
}

export const MatchResultModal: React.FC<MatchResultModalProps> = ({
  visible,
  onClose,
  result,
  score,
}) => {
  const isWin = result === 'win';

  const getConfig = () => {
    switch (result) {
      case 'win':
        return { label: 'VICTORIA', color: theme.colors.gold };
      case 'loss':
        return { label: 'DERROTA', color: theme.colors.loss };
      case 'draw':
        return { label: 'EMPATE', color: theme.colors.gray400 };
    }
  };

  const config = getConfig();

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        {isWin && (
          <ConfettiCannon
            count={200}
            origin={{ x: Dimensions.get('window').width / 2, y: -10 }}
            fallSpeed={3000}
            fadeOut={true}
          />
        )}

        <View style={styles.content}>
          <Text style={[styles.resultText, { color: config.color }]}>
            {config.label}
          </Text>

          <Text style={styles.scoreText}>{score}</Text>

          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeBtnText}>CONTINUAR</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: theme.colors.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  content: {
    alignItems: 'center',
    width: '100%',
  },
  resultText: {
    fontFamily: theme.fonts.display,
    fontSize: 48,
    marginBottom: 12,
  },
  scoreText: {
    fontFamily: theme.fonts.display,
    fontSize: 72,
    color: theme.colors.white,
    marginBottom: 48,
  },
  closeBtn: {
    borderWidth: 1,
    borderColor: theme.colors.white,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 48,
    width: '100%',
    alignItems: 'center',
  },
  closeBtnText: {
    color: theme.colors.white,
    fontFamily: theme.fonts.display,
    fontSize: 20,
  },
});
