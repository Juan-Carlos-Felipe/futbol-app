import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SvgXml } from 'react-native-svg';
import { Shirt, FREE_SHIRTS, PREMIUM_SHIRTS, EXCLUSIVE_SHIRTS, generateShirtSVG } from '@/lib/shirts';
import { colors, font } from '@/lib/theme';

interface ShirtSelectorProps {
  currentShirtId: string;
  ownedShirtIds: string[];
  userLevel: number;
  onChange: (shirt: Shirt) => void;
}

type Tab = 'Gratis' | 'Premium' | 'Exclusivas';

export const ShirtSelector: React.FC<ShirtSelectorProps> = ({
  currentShirtId,
  ownedShirtIds,
  userLevel,
  onChange,
}) => {
  const [activeTab, setActiveTab] = useState<Tab>('Gratis');

  const getShirtsForTab = () => {
    switch (activeTab) {
      case 'Premium': return PREMIUM_SHIRTS;
      case 'Exclusivas': return EXCLUSIVE_SHIRTS;
      default: return FREE_SHIRTS;
    }
  };

  const shirts = getShirtsForTab();

  return (
    <View style={styles.container}>
      <View style={styles.tabs}>
        {(['Gratis', 'Premium', 'Exclusivas'] as Tab[]).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.activeTab]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.list}>
        {shirts.map((shirt) => {
          const isSelected = currentShirtId === shirt.id;
          const isOwned = shirt.tier === 'free' || ownedShirtIds.includes(shirt.id);
          const isLevelLocked = shirt.lockedUntilLevel ? userLevel < shirt.lockedUntilLevel : false;
          const isLocked = !isOwned || isLevelLocked;

          return (
            <TouchableOpacity
              key={shirt.id}
              style={[styles.shirtCard, isSelected && styles.selectedCard]}
              onPress={() => !isLocked && onChange(shirt)}
              disabled={isLocked && shirt.tier !== 'free'}
            >
              <View style={styles.svgContainer}>
                <SvgXml xml={generateShirtSVG(shirt)} width="60" height="70" />
                {isLocked && (
                  <View style={styles.lockOverlay}>
                    <Text style={styles.lockIcon}>🔒</Text>
                    <Text style={styles.lockLabel}>
                      {isLevelLocked ? `Niv. ${shirt.lockedUntilLevel}` : (shirt.price_balones ? `${shirt.price_balones} ⚽` : 'Bloqueado')}
                    </Text>
                  </View>
                )}
              </View>
              <Text style={styles.shirtName} numberOfLines={1}>{shirt.name}</Text>
              {shirt.tier === 'exclusive' && (
                <View style={styles.exclusiveBadge}>
                  <Text style={styles.exclusiveText}>✨ Exclusiva</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginVertical: 10 },
  tabs: {
    flexDirection: 'row',
    marginBottom: 15,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 10,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: colors.success,
  },
  tabText: {
    color: colors.textSubtle,
    fontFamily: font.dmMedium,
    fontSize: 13,
  },
  activeTabText: {
    color: 'white',
    fontFamily: font.dmBold,
  },
  list: { paddingHorizontal: 4, gap: 12 },
  shirtCard: {
    width: 90,
    height: 110,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 10,
    padding: 8,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedCard: {
    borderColor: colors.success,
    backgroundColor: 'rgba(51, 214, 159, 0.1)',
  },
  svgContainer: {
    width: 60,
    height: 70,
    marginBottom: 6,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shirtName: {
    color: 'white',
    fontSize: 10,
    fontFamily: font.dmRegular,
    textAlign: 'center',
  },
  lockOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lockIcon: { fontSize: 16 },
  lockLabel: { color: 'white', fontSize: 9, fontFamily: font.dmBold, marginTop: 2 },
  exclusiveBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: colors.warning,
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  exclusiveText: { color: 'black', fontSize: 8, fontFamily: font.dmBold },
});
