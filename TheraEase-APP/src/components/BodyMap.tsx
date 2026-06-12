import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors } from '@/utils/theme';
import { getPainAreaLabel, PAIN_AREAS } from '@/utils/constants';
import BackBodySVG from './BackBodySVG';


interface BodyMapProps {
  selectedAreas: Record<string, number>;
  onAreaPress: (area: string, level: number) => void;
}

const BACK_REGIONS = [
  { id: PAIN_AREAS.NECK, label: 'Cổ' },
  { id: PAIN_AREAS.SHOULDER_LEFT, label: 'Vai trái' },
  { id: PAIN_AREAS.SHOULDER_RIGHT, label: 'Vai phải' },
  { id: PAIN_AREAS.UPPER_BACK, label: 'Lưng' },
  { id: PAIN_AREAS.LOWER_BACK, label: 'Thắt lưng' },
];

export default function BodyMap({ selectedAreas, onAreaPress }: BodyMapProps) {
  const [selectedArea, setSelectedArea] = useState<string | null>(null);

  const getPainColor = (level: number) => {
    if (level === 0) return colors.painNone;
    if (level <= 3) return colors.painMild;
    if (level <= 7) return colors.painModerate;
    return colors.painSevere;
  };

  const handleBodyPartPress = (areaId: string) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedArea(areaId);
  };

  const handleLevelSelect = (level: number) => {
    if (!selectedArea) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onAreaPress(selectedArea, level);
    setSelectedArea(null);
  };

  return (
    <View style={styles.container}>
      <View style={styles.mapCard}>
        <Text style={styles.mapHint}>Chạm vào cơ thể để chọn vùng bị đau và chọn mức độ.</Text>

        <View style={styles.mapCanvas}>
          <BackBodySVG 
            onAreaPress={handleBodyPartPress}
            selectedArea={selectedArea}
            selectedAreas={selectedAreas}
            getPainColor={getPainColor}
          />
        </View>

        <View style={styles.regionLegend}>
          {BACK_REGIONS.map((region) => {
            const effectiveArea = selectedArea || Object.keys(selectedAreas).pop();
            const isActive = region.id === effectiveArea;
            const savedLevel = selectedAreas[region.id];
            
            let badgeColor = '#CBD5E1';
            let displayLevel = null;

            if (isActive) {
              if (selectedArea === region.id) {
                badgeColor = '#93C5FD';
                if (savedLevel !== undefined) {
                  displayLevel = savedLevel;
                }
              } else if (savedLevel !== undefined) {
                badgeColor = getPainColor(savedLevel);
                displayLevel = savedLevel;
              }
            }

            return (
              <TouchableOpacity
                key={region.id}
                style={styles.regionChip}
                activeOpacity={0.85}
                onPress={() => setSelectedArea(region.id)}
              >
                <View style={[styles.regionChipDot, { backgroundColor: badgeColor }]} />
                <Text style={styles.regionChipText}>
                  {region.label}
                  {displayLevel !== null ? ` ${displayLevel}/10` : ''}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {selectedArea && (
        <View style={styles.levelSelector}>
          <Text style={styles.levelTitle}>Mức đau: {getPainAreaLabel(selectedArea)}</Text>
          <Text style={styles.levelSubtitle}>Chọn mức phù hợp nhất với cảm giác của bạn ở vùng này.</Text>
          <View style={styles.levelButtons}>
            <TouchableOpacity
              style={[styles.levelButton, { backgroundColor: colors.painNone }]}
              onPress={() => handleLevelSelect(0)}
            >
              <Text style={styles.levelButtonText}>0</Text>
              <Text style={styles.levelLabel}>Không đau</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.levelButton, { backgroundColor: colors.painMild }]}
              onPress={() => handleLevelSelect(3)}
            >
              <Text style={styles.levelButtonText}>3</Text>
              <Text style={styles.levelLabel}>Nhẹ</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.levelButton, { backgroundColor: colors.painModerate }]}
              onPress={() => handleLevelSelect(6)}
            >
              <Text style={styles.levelButtonText}>6</Text>
              <Text style={styles.levelLabel}>Vừa</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.levelButton, { backgroundColor: colors.painSevere }]}
              onPress={() => handleLevelSelect(9)}
            >
              <Text style={styles.levelButtonText}>9</Text>
              <Text style={styles.levelLabel}>Nặng/Tê</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.cancelButton} onPress={() => setSelectedArea(null)}>
            <Text style={styles.cancelText}>Hủy</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingBottom: 24,
  },
  mapCard: {
    width: '100%',
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    paddingVertical: 18,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 4,
  },
  mapHint: {
    fontSize: 13,
    lineHeight: 20,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 12,
    paddingHorizontal: 14,
    fontWeight: '500',
  },
  mapCanvas: {
    width: '100%',
    height: 360,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 15,
    overflow: 'hidden',
  },
  regionLegend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    marginTop: 8,
  },
  regionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  regionChipDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
  },
  regionChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
  },
  levelSelector: {
    width: '100%',
    marginTop: 18,
    backgroundColor: colors.surface,
    padding: 18,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  levelTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
    color: colors.text,
    textAlign: 'center',
  },
  levelSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
  },
  levelButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  levelButton: {
    width: 70,
    height: 70,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  levelButtonText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFF',
  },
  levelLabel: {
    fontSize: 10,
    color: '#FFF',
    marginTop: 4,
    textAlign: 'center',
    fontWeight: '700',
  },
  cancelButton: {
    padding: 12,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '700',
  },
});
