import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal } from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Smartphone, Check, X, QrCode, Key, Activity, Heart, Zap, Hand, Footprints } from 'lucide-react-native';
import QRCode from 'react-native-qrcode-svg';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useAuthStore } from '@/stores/authStore';
import { api } from '@/services/api';
import { colors } from '@/utils/theme';
import { getOwnedDeviceIds, type OwnedDeviceEntry } from '@/utils/ownedDevices';

interface Device {
  id: string;
  name: string;
  description: string;
  Icon: any;
  color: string[];
}

const DEVICES: Device[] = [
  {
    id: 'neck_device',
    name: 'Thiết bị cải thiện cổ',
    description: 'Giảm đau cổ, vai, gáy',
    Icon: Activity, // Icon sóng/nhịp cho cổ
    color: ['#5B9BD5', '#4A7FB8'],
  },
  {
    id: 'back_device',
    name: 'Thiết bị cải thiện lưng',
    description: 'Giảm đau lưng trên, giữa, dưới',
    Icon: Heart, // Icon tim cho lưng/cột sống
    color: ['#10B981', '#059669'],
  },
  {
    id: 'shoulder_device',
    name: 'Thiết bị cải thiện vai',
    description: 'Giảm đau vai, cánh tay',
    Icon: Zap, // Icon sét cho vai/năng lượng
    color: ['#F59E0B', '#D97706'],
  },
  {
    id: 'arm_device',
    name: 'Thiết bị cải thiện tay',
    description: 'Giảm tê tay, đau cánh tay',
    Icon: Hand, // Icon bàn tay
    color: ['#8B5CF6', '#7C3AED'],
  },
  {
    id: 'leg_device',
    name: 'Thiết bị cải thiện chân',
    description: 'Giảm đau chân, tê chân',
    Icon: Footprints, // Icon dấu chân
    color: ['#EF4444', '#DC2626'],
  },
];

export default function DevicesScreen() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [ownedDevices, setOwnedDevices] = useState<OwnedDeviceEntry[]>([]);
  const [showQRModal, setShowQRModal] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [activationKey, setActivationKey] = useState('');

  useEffect(() => {
    loadOwnedDevices();
  }, []);

  const loadOwnedDevices = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const data = await api.get('/auth/me');

      setOwnedDevices(data?.owned_devices || []);
    } catch (error) {
      console.error('Load owned devices error:', error);
      setOwnedDevices([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDevicePress = (device: Device) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    const ownedDeviceIds = getOwnedDeviceIds(ownedDevices);
    const isOwned = ownedDeviceIds.includes(device.id);

    if (isOwned) {
      // Đã có → Hiển thị QR/Key
      setSelectedDevice(device);
      generateActivationKey(device.id);
      setShowQRModal(true);
    } else {
      // Chưa có → Hỏi có muốn thêm không
      Alert.alert(
        'Thêm thiết bị',
        `Bạn có thiết bị ${device.name}?\n\nNếu có, hãy thêm vào để nhận gợi ý phù hợp hơn.`,
        [
          { text: 'Hủy', style: 'cancel' },
          {
            text: 'Thêm',
            onPress: () => addDevice(device.id),
          },
        ]
      );
    }
  };

  const addDevice = async (deviceId: string) => {
    if (!user) return;

    try {
      const newDevices = [...ownedDevices, deviceId];
      
      await api.put('/auth/profile', { owned_devices: newDevices });

      setOwnedDevices(newDevices);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      Alert.alert('Thành công', 'Đã thêm thiết bị vào tài khoản của bạn!');
    } catch (error) {
      console.error('Add device error:', error);
      Alert.alert('Lỗi', 'Không thể thêm thiết bị. Vui lòng thử lại.');
    }
  };

  const removeDevice = async (deviceId: string, deviceName: string) => {
    if (!user) return;

    Alert.alert(
      'Xóa thiết bị',
      `Bạn có chắc muốn xóa "${deviceName}" khỏi tài khoản?\n\nBạn sẽ không nhận được gợi ý liên quan đến thiết bị này nữa.`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            try {
              const newDevices = ownedDevices.filter((d) => {
                if (typeof d === 'string') return d !== deviceId;
                return getOwnedDeviceIds([d])[0] !== deviceId;
              });
              
              await api.put('/auth/profile', { owned_devices: newDevices });

              setOwnedDevices(newDevices);
              setShowQRModal(false);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              
              Alert.alert('Đã xóa', 'Thiết bị đã được xóa khỏi tài khoản.');
            } catch (error) {
              console.error('Remove device error:', error);
              Alert.alert('Lỗi', 'Không thể xóa thiết bị. Vui lòng thử lại.');
            }
          },
        },
      ]
    );
  };

  const generateActivationKey = (deviceId: string) => {
    // Generate unique key: USER_ID-DEVICE_ID-TIMESTAMP
    const timestamp = Date.now().toString(36).toUpperCase();
    const key = `${user?.id.slice(0, 8).toUpperCase()}-${deviceId.slice(0, 4).toUpperCase()}-${timestamp}`;
    setActivationKey(key);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Thiết bị của tôi</Text>
        <Text style={styles.headerSubtitle}>
          {ownedDevices.length} / {DEVICES.length} thiết bị
        </Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Danh sách thiết bị</Text>

        {DEVICES.map((device, index) => {
          const isOwned = getOwnedDeviceIds(ownedDevices).includes(device.id);
          const DeviceIcon = device.Icon;

          return (
            <Animated.View
              key={device.id}
              entering={FadeInDown.delay(index * 100)}
            >
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => handleDevicePress(device)}
              >
                <LinearGradient
                  colors={isOwned ? (device.color as any) : ['#F3F4F6', '#E5E7EB']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.deviceCard}
                >
                  <View style={styles.deviceIcon}>
                    <DeviceIcon 
                      size={28} 
                      color={isOwned ? '#FFF' : colors.primary} 
                      strokeWidth={2}
                    />
                  </View>

                  <View style={styles.deviceInfo}>
                    <Text style={[styles.deviceName, !isOwned && styles.deviceNameInactive]}>
                      {device.name}
                    </Text>
                    <Text style={[styles.deviceDescription, !isOwned && styles.deviceDescriptionInactive]}>
                      {device.description}
                    </Text>
                  </View>

                  <View style={styles.deviceStatus}>
                    {isOwned ? (
                      <View style={styles.ownedBadge}>
                        <Check size={18} color="#FFF" strokeWidth={3} />
                        <Text style={styles.ownedText}>Đã có</Text>
                      </View>
                    ) : (
                      <View style={styles.notOwnedBadge}>
                        <Text style={styles.notOwnedText}>Chưa có</Text>
                      </View>
                    )}
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          );
        })}

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Lưu ý</Text>
          <Text style={styles.infoText}>
            • Nhấn vào thiết bị "Chưa có" để thêm vào tài khoản{'\n'}
            • Nhấn vào thiết bị "Đã có" để xem mã kích hoạt{'\n'}
            • Bạn có thể xóa thiết bị bất kỳ lúc nào
          </Text>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* QR Code Modal */}
      <Modal
        visible={showQRModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowQRModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setShowQRModal(false);
              }}
            >
              <X size={24} color={colors.text} />
            </TouchableOpacity>

            {selectedDevice && (
              <>
                <Text style={styles.modalTitle}>{selectedDevice.name}</Text>
                <Text style={styles.modalSubtitle}>Mã kích hoạt thiết bị</Text>

                {/* QR Code */}
                <View style={styles.qrContainer}>
                  <QRCode
                    value={activationKey}
                    size={200}
                    backgroundColor="white"
                    color="black"
                  />
                </View>

                {/* Activation Key */}
                <View style={styles.keyContainer}>
                  <Key size={20} color={colors.primary} />
                  <Text style={styles.keyText}>{activationKey}</Text>
                </View>

                <Text style={styles.keyHint}>
                  Quét mã QR hoặc nhập key để kích hoạt thiết bị
                </Text>

                {/* Remove Button */}
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => removeDevice(selectedDevice.id, selectedDevice.name)}
                >
                  <Text style={styles.removeButtonText}>Xóa thiết bị</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  deviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  deviceIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  deviceInfo: {
    flex: 1,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 4,
  },
  deviceNameInactive: {
    color: colors.text,
  },
  deviceDescription: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  deviceDescriptionInactive: {
    color: colors.textSecondary,
  },
  deviceStatus: {
    marginLeft: 12,
  },
  ownedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  ownedText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFF',
  },
  notOwnedBadge: {
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  notOwnedText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  infoCard: {
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 13,
    color: colors.text,
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 8,
    borderRadius: 20,
    backgroundColor: colors.background,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 24,
    textAlign: 'center',
  },
  qrContainer: {
    padding: 20,
    backgroundColor: '#FFF',
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  keyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.background,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  keyText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    fontFamily: 'monospace',
  },
  keyHint: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  removeButton: {
    backgroundColor: '#FEE2E2',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  removeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#DC2626',
  },
});
