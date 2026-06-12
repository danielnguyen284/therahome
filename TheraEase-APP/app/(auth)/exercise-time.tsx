import React, { useState } from "react";
import {
	View,
	StyleSheet,
	Dimensions,
	TouchableOpacity,
	Alert,
	ScrollView,
	Platform,
	Modal,
} from "react-native";
import { Text, Button } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import * as Notifications from "expo-notifications";
import { LinearGradient } from "expo-linear-gradient";
import { MotiView } from "moti";
import {
	Sun,
	Moon,
	Sparkles,
	Bell,
	CircleCheckBig,
	Info,
	Clock,
} from "lucide-react-native";
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { updateProfile } from "@/services/auth";
import { useAuthStore } from "@/stores/authStore";
import { colors } from "@/utils/theme";

const { width } = Dimensions.get("window");

const OPTIONS = [
	{
		id: "morning",
		label: "Buổi sáng",
		icon: Sun,
		color: "#F59E0B",
		desc: "Khởi đầu ngày mới sảng khoái",
	},
	{
		id: "evening",
		label: "Buổi tối",
		icon: Moon,
		color: "#4F46E5",
		desc: "Thư giãn cơ thể trước khi ngủ",
		recommended: true,
	},
	{
		id: "both",
		label: "Cả 2",
		icon: Sparkles,
		color: "#10B981",
		desc: "Tối ưu hiệu quả phục hồi",
	},
];

export default function ExerciseTimeScreen() {
	const router = useRouter();
	const params = useLocalSearchParams();
	const { user, setUser } = useAuthStore();
	const [selectedId, setSelectedId] = useState<string | null>(null);
	const [morningTime, setMorningTime] = useState(new Date(new Date().setHours(8, 0, 0, 0)));
	const [eveningTime, setEveningTime] = useState(new Date(new Date().setHours(20, 5, 0, 0)));
	const [showPickerFor, setShowPickerFor] = useState<"morning" | "evening" | null>(null);

	const formatTime = (date: Date) => {
		const h = date.getHours().toString().padStart(2, '0');
		const m = date.getMinutes().toString().padStart(2, '0');
		return `${h}:${m}`;
	};

	const onTimeChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
		const pickerFor = showPickerFor;
		if (Platform.OS === 'android') {
			setShowPickerFor(null);
		}
		
		if (selectedDate && pickerFor) {
			if (pickerFor === "morning") {
				setMorningTime(selectedDate);
			} else {
				setEveningTime(selectedDate);
			}
		}
	};

	const getPreferredTimeValue = (value: string) => {
		if (value === "morning") return formatTime(morningTime);
		if (value === "both") return `${formatTime(morningTime)},${formatTime(eveningTime)}`;
		return formatTime(eveningTime);
	};

	const requestNotificationPermission = async () => {
		const { status: existingStatus } =
			await Notifications.getPermissionsAsync();
		let finalStatus = existingStatus;
		if (existingStatus !== "granted") {
			const { status } = await Notifications.requestPermissionsAsync();
			finalStatus = status;
		}
		if (finalStatus !== "granted") {
			Alert.alert(
				"Thông báo",
				"Bạn hãy cho phép nhận thông báo để nhận lời nhắc luyện tập nhé!",
			);
		}
	};

	const handleNext = async () => {
		if (!selectedId) return;
		await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
		await requestNotificationPermission();

		if (user) {
			const preferredTime = getPreferredTimeValue(selectedId);
			setUser({
				...user,
				preferred_time: preferredTime,
			});
			if (user.id !== "guest") {
				try {
					await updateProfile({ preferred_time: preferredTime });
				} catch (error) {
					console.error("Lỗi lưu thời gian vào database:", error);
				}
			}
		}

		router.replace({
			pathname: "/(auth)/name",
			params: { ...params, exerciseTime: selectedId },
		});
	};

	return (
		<View style={styles.container}>
			<LinearGradient
				colors={["#FDFCFB", "#F1F5F9"]}
				style={StyleSheet.absoluteFill}
			/>

			<SafeAreaView style={styles.safeArea}>
				<ScrollView
					contentContainerStyle={styles.scrollContent}
					showsVerticalScrollIndicator={false}
					bounces={false}
				>
					<View style={styles.content}>
						<MotiView
							from={{ opacity: 0, translateY: -20 }}
							animate={{ opacity: 1, translateY: 0 }}
						transition={{ type: "timing", duration: 800 }}
						style={styles.header}
					>
						<View style={styles.progressContainer}>
							<View style={[styles.progressBar, { width: "99%" }]} />
						</View>

						<View style={styles.iconContainer}>
							<View style={styles.iconCircle}>
								<Bell size={32} color={colors.primary} strokeWidth={2.5} />
							</View>
						</View>

						<Text style={styles.title}>Bạn có thể dành thời gian lúc nào?</Text>
						<Text style={styles.subtitle}>
							Hãy chọn khung thời gian bạn thấy thuận tiện nhất để duy trì thói quen tập luyện. Lịch thông báo sẽ do hệ thống thiết lập.
						</Text>
					</MotiView>

					<View style={styles.optionsGrid}>
						{OPTIONS.map((option, index) => {
							const isSelected = selectedId === option.id;
							const Icon = option.icon;

							return (
								<MotiView
									key={option.id}
									from={{ opacity: 0, scale: 0.9 }}
									animate={{ opacity: 1, scale: 1 }}
									transition={{
										delay: 100 * index,
										type: "timing",
										duration: 500,
									}}
									style={[
										styles.optionWrapper,
										option.id === "both" && styles.fullWidthOption,
									]}
								>
									<TouchableOpacity
										style={[
											styles.optionCard,
											option.recommended && !isSelected && { 
												borderColor: option.color + '60', 
												backgroundColor: option.color + '0A' 
											},
											isSelected && {
												borderColor: option.color,
												shadowOpacity: 0.2,
												backgroundColor: "#FFFFFF",
											},
										]}
										onPress={() => {
											Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
											setSelectedId(option.id);
										}}
										activeOpacity={0.8}
									>
										<View
											style={[
												styles.iconCircleSmall,
												{
													backgroundColor: isSelected
														? option.color
														: "#F3F4F6",
												},
											]}
										>
											<Icon
												size={20}
												color={isSelected ? "#FFFFFF" : "#6B7280"}
												strokeWidth={2.5}
											/>
										</View>
										<Text
											style={[
												styles.optionLabel,
												isSelected && { color: option.color },
											]}
										>
											{option.label}
										</Text>
										{isSelected && (
											<MotiView
												from={{ scale: 0 }}
												animate={{ scale: 1 }}
												style={styles.checkIcon}
											>
												<CircleCheckBig size={16} color={option.color} />
											</MotiView>
										)}
									</TouchableOpacity>
								</MotiView>
							);
						})}
					</View>

					{selectedId && (
						<MotiView
							from={{ opacity: 0, translateY: 20 }}
							animate={{ opacity: 1, translateY: 0 }}
							style={styles.timeSection}
						>
							<View style={styles.timeCard}>
								<View style={styles.timeHeader}>
									<Clock size={18} color="#6B7280" />
									<Text style={styles.timeHeaderTitle}>Giờ nhắc nhở tập luyện</Text>
								</View>

								{selectedId === "both" ? (
									<>
										<View style={styles.timeDisplayRow}>
											<Text style={styles.timeValueText}>{formatTime(morningTime)}</Text>
											<TouchableOpacity activeOpacity={0.7} onPress={() => setShowPickerFor("morning")}>
												<Text style={styles.changeTimeText}>Đổi (Sáng)</Text>
											</TouchableOpacity>
										</View>
										<View style={styles.timeDisplayRow}>
											<Text style={styles.timeValueText}>{formatTime(eveningTime)}</Text>
											<TouchableOpacity activeOpacity={0.7} onPress={() => setShowPickerFor("evening")}>
												<Text style={styles.changeTimeText}>Đổi (Tối)</Text>
											</TouchableOpacity>
										</View>
									</>
								) : (
									<View style={styles.timeDisplayRow}>
										<Text style={styles.timeValueText}>
											{selectedId === "morning" ? formatTime(morningTime) : formatTime(eveningTime)}
										</Text>
										<TouchableOpacity activeOpacity={0.7} onPress={() => setShowPickerFor(selectedId as "morning" | "evening")}>
											<Text style={styles.changeTimeText}>Thay đổi</Text>
										</TouchableOpacity>
									</View>
								)}

								<View style={styles.recommendationBox}>
									<Info size={16} color="#4F46E5" style={{ marginTop: 2 }} />
									<Text style={styles.recommendationText}>
										{selectedId === "morning"
											? "Khuyên dùng: Luyện tập vào 07:00 - 09:00 giúp bắt đầu ngày mới tràn đầy năng lượng."
											: selectedId === "evening"
											? "Khuyên dùng: Luyện tập vào 20:00 - 22:00 giúp cơ thể phục hồi tốt nhất trước khi ngủ."
											: "Khuyên dùng: Luyện tập đều đặn vào 2 buổi sẽ giúp tối ưu hiệu quả và nhanh chóng phục hồi."}
									</Text>
								</View>
							</View>
						</MotiView>
					)}

						<MotiView
							from={{ opacity: 0, translateY: 20 }}
							animate={{ opacity: 1, translateY: 0 }}
							transition={{ delay: 600, type: "timing", duration: 500 }}
							style={styles.footer}
					>
						<Button
							mode="contained"
							onPress={handleNext}
							disabled={!selectedId}
							style={[styles.button, !selectedId && styles.buttonDisabled]}
							contentStyle={styles.buttonContent}
							labelStyle={styles.buttonLabel}
							buttonColor={colors.primary}
							uppercase={false}
						>
							TIẾP TỤC
						</Button>
					</MotiView>
					</View>
				</ScrollView>
			</SafeAreaView>

			{showPickerFor && Platform.OS === 'android' && (
				<DateTimePicker
					value={showPickerFor === "morning" ? morningTime : eveningTime}
					mode="time"
					is24Hour={true}
					display="default"
					onChange={onTimeChange}
				/>
			)}

			{Platform.OS === 'ios' && (
				<Modal visible={!!showPickerFor} transparent={true} animationType="slide">
					<View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' }}>
						<View style={{ backgroundColor: 'white', paddingBottom: 20 }}>
							<View style={{ flexDirection: 'row', justifyContent: 'flex-end', padding: 16, borderBottomWidth: 1, borderBottomColor: '#E5E5EA' }}>
								<TouchableOpacity onPress={() => setShowPickerFor(null)}>
									<Text style={{ color: '#007AFF', fontSize: 18, fontWeight: '600' }}>Xong</Text>
								</TouchableOpacity>
							</View>
							{!!showPickerFor && (
								<DateTimePicker
									value={showPickerFor === "morning" ? morningTime : eveningTime}
									mode="time"
									is24Hour={true}
									display="spinner"
									onChange={onTimeChange}
								/>
							)}
						</View>
					</View>
				</Modal>
			)}
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	safeArea: {
		flex: 1,
	},
	scrollContent: {
		paddingBottom: 28,
	},
	content: {
		paddingHorizontal: 24,
	},
	header: {
		marginTop: 20,
		marginBottom: 30,
		alignItems: "center",
	},
	progressContainer: {
		width: "100%",
		height: 4,
		backgroundColor: "#E5E7EB",
		borderRadius: 2,
		marginBottom: 32,
	},
	progressBar: {
		height: "100%",
		backgroundColor: colors.primary,
		borderRadius: 2,
	},
	iconContainer: {
		marginBottom: 16,
	},
	iconCircle: {
		width: 64,
		height: 64,
		borderRadius: 32,
		backgroundColor: colors.primary + "15",
		justifyContent: "center",
		alignItems: "center",
	},
	title: {
		fontSize: 26,
		fontWeight: "800",
		color: "#111827",
		textAlign: "center",
		marginBottom: 12,
	},
	subtitle: {
		fontSize: 16,
		color: "#6B7280",
		textAlign: "center",
		lineHeight: 24,
	},
	optionsGrid: {
		flexDirection: "row",
		flexWrap: "wrap",
		justifyContent: "space-between",
		marginBottom: 20,
	},
	optionWrapper: {
		width: "48%",
		marginBottom: 16,
	},
	fullWidthOption: {
		width: "100%",
	},
	optionCard: {
		backgroundColor: "#FFFFFF",
		padding: 16,
		borderRadius: 20,
		borderWidth: 2,
		borderColor: "transparent",
		alignItems: "center",
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.05,
		shadowRadius: 10,
		elevation: 2,
	},
	iconCircleSmall: {
		width: 44,
		height: 44,
		borderRadius: 14,
		justifyContent: "center",
		alignItems: "center",
		marginBottom: 10,
	},
	optionLabel: {
		fontSize: 15,
		fontWeight: "700",
		color: "#4B5563",
	},
	checkIcon: {
		position: "absolute",
		top: 12,
		right: 12,
	},
	timeSection: {
		marginBottom: 16,
	},
	timeCard: {
		backgroundColor: "#FFFFFF",
		borderRadius: 24,
		padding: 24,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 10 },
		shadowOpacity: 0.1,
		shadowRadius: 20,
		elevation: 5,
	},
	timeHeader: {
		flexDirection: "row",
		alignItems: "center",
		marginBottom: 16,
	},
	timeHeaderTitle: {
		fontSize: 15,
		fontWeight: "600",
		color: "#4B5563",
		marginLeft: 8,
	},
	timeDisplayRow: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		paddingVertical: 14,
		paddingHorizontal: 16,
		backgroundColor: "#FFFFFF",
		borderRadius: 16,
		marginBottom: 16,
		borderWidth: 1,
		borderColor: "#F3F4F6",
	},
	timeValueText: {
		fontSize: 34,
		fontWeight: "700",
		color: "#3BA1E3",
	},
	changeTimeText: {
		fontSize: 14,
		fontWeight: "600",
		color: "#6B7280",
	},
	recommendationBox: {
		flexDirection: "row",
		backgroundColor: "#EEF2FF",
		padding: 16,
		borderRadius: 16,
		alignItems: "flex-start",
	},
	recommendationText: {
		flex: 1,
		fontSize: 13,
		color: "#4338CA",
		lineHeight: 18,
		marginLeft: 8,
	},
	footer: {
		paddingTop: 8,
		paddingBottom: 20,
	},
	button: {
		borderRadius: 20,
		shadowColor: colors.primary,
		shadowOffset: { width: 0, height: 10 },
		shadowOpacity: 0.3,
		shadowRadius: 20,
		elevation: 10,
	},
	buttonDisabled: {
		opacity: 0.5,
		elevation: 0,
		shadowOpacity: 0,
	},
	buttonContent: {
		paddingVertical: 14,
	},
	buttonLabel: {
		fontSize: 18,
		fontWeight: "800",
		letterSpacing: 1,
		lineHeight: 26,
	},
});
