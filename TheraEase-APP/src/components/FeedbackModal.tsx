import React, { useState } from 'react';
import { View, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { Text, Button, TextInput, RadioButton } from 'react-native-paper';
import { colors } from '@/utils/theme';
import * as Haptics from 'expo-haptics';

interface FeedbackModalProps {
  visible: boolean;
  type: 'completed' | 'skipped';
  onSubmit: (feedback: {
    feeling?: 'good' | 'neutral' | 'bad';
    skip_reason?: string;
    comment?: string;
  }) => void;
  onDismiss: () => void;
}

export default function FeedbackModal({ visible, type, onSubmit, onDismiss }: FeedbackModalProps) {
  const [feeling, setFeeling] = useState<'good' | 'neutral' | 'bad'>('good');
  const [skipReason, setSkipReason] = useState('');
  const [comment, setComment] = useState('');

  const handleSubmit = () => {
    if (type === 'completed') {
      onSubmit({ feeling, comment });
    } else {
      onSubmit({ skip_reason: skipReason, comment });
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          {type === 'completed' ? (
            <>
              <Text style={styles.title}>Bạn cảm thấy thế nào?</Text>
              
              <View style={styles.feelingContainer}>
                <Button
                  mode={feeling === 'good' ? 'contained' : 'outlined'}
                  onPress={() => setFeeling('good')}
                  style={styles.feelingButton}
                >
                  😊 Tốt hơn
                </Button>
                <Button
                  mode={feeling === 'neutral' ? 'contained' : 'outlined'}
                  onPress={() => setFeeling('neutral')}
                  style={styles.feelingButton}
                >
                  😐 Bình thường
                </Button>
                <Button
                  mode={feeling === 'bad' ? 'contained' : 'outlined'}
                  onPress={() => setFeeling('bad')}
                  style={styles.feelingButton}
                >
                  😣 Vẫn đau
                </Button>
              </View>

              <TextInput
                label="Để lại phản hồi ✍️ (tùy chọn)"
                value={comment}
                onChangeText={setComment}
                mode="outlined"
                multiline
                numberOfLines={3}
                style={styles.input}
              />
            </>
          ) : (
            <>
              <Text style={styles.title}>Bạn đã không hoàn thành bài tập</Text>
              <Text style={styles.subtitle}>
                Xin vui lòng cho chúng tôi biết lý do...
              </Text>

              <RadioButton.Group onValueChange={(value) => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setSkipReason(value);
              }} value={skipReason}>
                <TouchableOpacity 
                  style={styles.radioItem}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSkipReason('do_later');
                  }}
                  activeOpacity={0.7}
                >
                  <RadioButton value="do_later" />
                  <Text style={styles.radioText}>Dự định làm sau</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.radioItem}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSkipReason('just_looking');
                  }}
                  activeOpacity={0.7}
                >
                  <RadioButton value="just_looking" />
                  <Text style={styles.radioText}>Chỉ cần nhìn một chút</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.radioItem}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSkipReason('too_hard');
                  }}
                  activeOpacity={0.7}
                >
                  <RadioButton value="too_hard" />
                  <Text style={styles.radioText}>Lớp học khó quá</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.radioItem}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSkipReason('too_easy');
                  }}
                  activeOpacity={0.7}
                >
                  <RadioButton value="too_easy" />
                  <Text style={styles.radioText}>Lớp học quá dễ dàng</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.radioItem}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSkipReason('distracted');
                  }}
                  activeOpacity={0.7}
                >
                  <RadioButton value="distracted" />
                  <Text style={styles.radioText}>Hướng dẫn quá gây phân tâm</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.radioItem}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSkipReason('other');
                  }}
                  activeOpacity={0.7}
                >
                  <RadioButton value="other" />
                  <Text style={styles.radioText}>Khác</Text>
                </TouchableOpacity>
              </RadioButton.Group>
            </>
          )}

          <View style={styles.actions}>
            <Button mode="outlined" onPress={onDismiss} style={styles.actionButton}>
              Bỏ qua
            </Button>
            <Button
              mode="contained"
              onPress={handleSubmit}
              style={styles.actionButton}
              disabled={type === 'skipped' && !skipReason}
            >
              Nộp
            </Button>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 16,
    textAlign: 'center',
  },
  feelingContainer: {
    gap: 12,
    marginBottom: 16,
  },
  feelingButton: {
    borderRadius: 8,
  },
  input: {
    marginBottom: 16,
  },
  radioItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginVertical: 4,
  },
  radioText: {
    fontSize: 15,
    color: colors.text,
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  actionButton: {
    flex: 1,
  },
});
