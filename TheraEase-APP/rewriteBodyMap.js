const fs = require('fs');

const code = `import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Switch } from 'react-native';
import Body from 'react-native-body-highlighter';
import * as Haptics from 'expo-haptics';
import { colors } from '@/utils/theme';
import { getPainAreaLabel, PAIN_AREAS } from '@/utils/constants';

interface BodyMapProps {
  selectedAreas: Record<string, number>;
  onAreaPress: (area: string, level: number) => void;
}

export default function BodyMap({ selectedAreas, onAreaPress }: BodyMapProps) {
  const [selectedArea, setSelectedArea] = useState<string | null>(null);
  const [isBack, setIsBack] = useState(false);

  const getPainColor = (level: number) => {
    if (level === 0) return colors.painNone;
    if (level <= 3) return colors.painMild;
    if (level <= 7) return colors.painModerate;
    return colors.painSevere;
  };

  const mapPartToArea = (slug: string, side?: string): string | null => {
    if (slug === 'neck') return PAIN_AREAS.NECK;
    if (slug === 'deltoids') return side === 'left' ? PAIN_AREAS.SHOULDER_LEFT : PAIN_AREAS.SHOULDER_RIGHT;
    if (slug === 'upper-back') return PAIN_AREAS.UPPER_BACK;
    if (slug === 'trapezius') return PAIN_AREAS.MIDDLE_BACK;
    if (slug === 'lower-back') return PAIN_AREAS.LOWER_BACK;
    
    if (slug === 'biceps' || slug === 'triceps' || slug === 'forearm') return side === 'left' ? PAIN_AREAS.ARM_LEFT : PAIN_AREAS.ARM_RIGHT;
    if (slug === 'hands') return side === 'left' ? PAIN_AREAS.HAND_LEFT : PAIN_AREAS.HAND_RIGHT;
    
    if (slug === 'quadriceps' || slug === 'hamstring' || slug === 'gluteal') return side === 'left' ? PAIN_AREAS.THIGH_LEFT : PAIN_AREAS.THIGH_RIGHT;
    if (slug === 'calves' || slug === 'tibialis') return side === 'left' ? PAIN_AREAS.LEG_LEFT : PAIN_AREAS.LEG_RIGHT;
    if (slug === 'feet') return side === 'left' ? PAIN_AREAS.FOOT_LEFT : PAIN_AREAS.FOOT_RIGHT;
    
    return null;
  };

  const getHighlighterData = () => {
    const data: Array<{ slug: any, side?: 'left'|'right', color: string }> = [];
    
    const addPart = (area: string, slug: string, side?: 'left'|'right') => {
      if (selectedAreas[area] !== undefined) {
        data.push({
          slug,
          side,
          color: getPainColor(selectedAreas[area])
        });
      }
    };

    addPart(PAIN_AREAS.NECK, 'neck');
    addPart(PAIN_AREAS.SHOULDER_LEFT, 'deltoids', 'left');
    addPart(PAIN_AREAS.SHOULDER_RIGHT, 'deltoids', 'right');
    addPart(PAIN_AREAS.UPPER_BACK, 'upper-back');
    addPart(PAIN_AREAS.MIDDLE_BACK, 'trapezius');
    addPart(PAIN_AREAS.LOWER_BACK, 'lower-back');
    
    addPart(PAIN_AREAS.ARM_LEFT, 'biceps', 'left');
    addPart(PAIN_AREAS.ARM_LEFT, 'triceps', 'left');
    addPart(PAIN_AREAS.ARM_LEFT, 'forearm', 'left');
    
    addPart(PAIN_AREAS.ARM_RIGHT, 'biceps', 'right');
    addPart(PAIN_AREAS.ARM_RIGHT, 'triceps', 'right');
    addPart(PAIN_AREAS.ARM_RIGHT, 'forearm', 'right');

    addPart(PAIN_AREAS.HAND_LEFT, 'hands', 'left');
    addPart(PAIN_AREAS.HAND_RIGHT, 'hands', 'right');
    
    addPart(PAIN_AREAS.THIGH_LEFT, 'quadriceps', 'left');
    addPart(PAIN_AREAS.THIGH_LEFT, 'hamstring', 'left');
    addPart(PAIN_AREAS.THIGH_LEFT, 'gluteal', 'left');

    addPart(PAIN_AREAS.THIGH_RIGHT, 'quadriceps', 'right');
    addPart(PAIN_AREAS.THIGH_RIGHT, 'hamstring', 'right');
    addPart(PAIN_AREAS.THIGH_RIGHT, 'gluteal', 'right');

    addPart(PAIN_AREAS.LEG_LEFT, 'calves', 'left');
    addPart(PAIN_AREAS.LEG_LEFT, 'tibialis', 'left');

    addPart(PAIN_AREAS.LEG_RIGHT, 'calves', 'right');
    addPart(PAIN_AREAS.LEG_RIGHT, 'tibialis', 'right');

    addPart(PAIN_AREAS.FOOT_LEFT, 'feet', 'left');
    addPart(PAIN_AREAS.FOOT_RIGHT, 'feet', 'right');
    
    // Thêm các color cho vị trí đang chọn
    if (selectedArea) {
      // Find what slugs correspond to the selectedArea.
      // This is a reverse lookup. We just paint the relevant slugs a bit darker or blue if not set
      const highlight = (slug: string, side?: 'left'|'right') => {
         const existing = data.find(d => d.slug === slug && d.side === side);
         if (existing) {
           existing.color = '#3B82F6';
         } else {
           data.push({ slug, side, color: '#93C5FD' });
         }
      };

      switch(selectedArea) {
        case PAIN_AREAS.NECK: highlight('neck'); break;
        case PAIN_AREAS.SHOULDER_LEFT: highlight('deltoids', 'left'); break;
        case PAIN_AREAS.SHOULDER_RIGHT: highlight('deltoids', 'right'); break;
        case PAIN_AREAS.UPPER_BACK: highlight('upper-back'); break;
        case PAIN_AREAS.MIDDLE_BACK: highlight('trapezius'); break;
        case PAIN_AREAS.LOWER_BACK: highlight('lower-back'); break;
        case PAIN_AREAS.ARM_LEFT: 
          highlight('biceps', 'left'); highlight('triceps', 'left'); highlight('forearm', 'left'); break;
        case PAIN_AREAS.ARM_RIGHT: 
          highlight('biceps', 'right'); highlight('triceps', 'right'); highlight('forearm', 'right'); break;
        case PAIN_AREAS.HAND_LEFT: highlight('hands', 'left'); break;
        case PAIN_AREAS.HAND_RIGHT: highlight('hands', 'right'); break;
        case PAIN_AREAS.THIGH_LEFT: 
          highlight('quadriceps', 'left'); highlight('hamstring', 'left'); highlight('gluteal', 'left'); break;
        case PAIN_AREAS.THIGH_RIGHT: 
          highlight('quadriceps', 'right'); highlight('hamstring', 'right'); highlight('gluteal', 'right'); break;
        case PAIN_AREAS.LEG_LEFT: highlight('calves', 'left'); highlight('tibialis', 'left'); break;
        case PAIN_AREAS.LEG_RIGHT: highlight('calves', 'right'); highlight('tibialis', 'right'); break;
        case PAIN_AREAS.FOOT_LEFT: highlight('feet', 'left'); break;
        case PAIN_AREAS.FOOT_RIGHT: highlight('feet', 'right'); break;
      }
    }

    return data;
  };

  const handleBodyPartPress = (part: any) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const mappedArea = mapPartToArea(part.slug, part.side);
    if (mappedArea) {
      setSelectedArea(mappedArea);
    }
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
          <Body
            data={getHighlighterData()}
            onBodyPartPress={handleBodyPartPress}
            gender="male"
            side={isBack ? "back" : "front"}
            scale={1.3}
            defaultFill="#E2E8F0"
          />
        </View>

        {/* Front / Back Toggle */}
        <View style={styles.toggleContainer}>
          <Text style={[styles.toggleLabel, !isBack && styles.toggleLabelActive]}>Front</Text>
          <Switch
            value={isBack}
            onValueChange={(val) => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setIsBack(val);
            }}
            trackColor={{ false: '#3B82F6', true: '#3B82F6' }}
            thumbColor={'#FFFFFF'}
          />
          <Text style={[styles.toggleLabel, isBack && styles.toggleLabelActive]}>Back</Text>
        </View>

        <View style={styles.regionLegend}>
          {Object.keys(selectedAreas).map((areaId) => {
            const level = selectedAreas[areaId];
            const badgeColor = getPainColor(level);

            return (
              <TouchableOpacity
                key={areaId}
                style={styles.regionChip}
                activeOpacity={0.85}
                onPress={() => setSelectedArea(areaId)}
              >
                <View style={[styles.regionChipDot, { backgroundColor: badgeColor }]} />
                <Text style={styles.regionChipText}>
                  {getPainAreaLabel(areaId)} {level}/10
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
    height: 400,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 16,
    gap: 12,
  },
  toggleLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  toggleLabelActive: {
    color: colors.text,
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
`;

fs.writeFileSync('src/components/BodyMap.tsx', code);
