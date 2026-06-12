import React, { useState } from "react";
import {
	View,
	StyleSheet,
	Dimensions,
	TouchableOpacity,
	ScrollView,
} from "react-native";
import { Text, Button } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { MotiView, AnimatePresence } from "moti";
import {
	Moon,
	Zap,
	Brain,
	Waves,
	Armchair,
	ShieldCheck,
	Sparkles,
	Target,
} from "lucide-react-native";
import { useAuthStore } from "@/stores/authStore";
import { colors } from "@/utils/theme";

const { width } = Dimensions.get("window");

const GOALS = [
	{ id: "sleep", label: "Ngủ ngon hơn", icon: Moon, color: "#6366F1" },
	{ id: "relief", label: "Giảm đau mỏi tức thì", icon: Zap, color: "#F59E0B" },
	{
		id: "stress",
		label: "Giảm đau đầu, căng thẳng",
		icon: Brain,
		color: "#EC4899",
	},
	{
		id: "numbness",
		label: "Cải thiện tê tay, tê chân",
		icon: Waves,
		color: "#06B6D4",
	},
	{
		id: "work",
		label: "Làm việc lâu đỡ mỏi",
		icon: Armchair,
		color: "#8B5CF6",
	},
	{
		id: "limit",
		label: "Hạn chế đau tái phát",
		icon: ShieldCheck,
		color: "#10B981",
	},
	{
		id: "all",
		label: "Tất cả (Lộ trình tối ưu)",
		icon: Sparkles,
		color: "#3B82F6",
	},
];

export default function GoalsScreen() {
	const router = useRouter();
	const { user, setUser } = useAuthStore();
	const [selectedGoals, setSelectedGoals] = useState<string[]>([]);

	const handleNext = async () => {
		if (selectedGoals.length === 0) return;
		await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
		const selectedLabels = GOALS.filter((goal) => selectedGoals.includes(goal.id))
			.map((g) => g.label)
			.join(", ");

		if (user) {
			setUser({ ...user, primary_goal: selectedLabels });
		}

		router.replace("/(auth)/target-area");
	};

	const handleSelect = (id: string) => {
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
		if (id === "all") {
			setSelectedGoals((prev) => (prev.includes("all") ? [] : ["all"]));
			return;
		}
		setSelectedGoals((prev) => {
			const activeGoals = prev.filter((g) => g !== "all");
			return activeGoals.includes(id)
				? activeGoals.filter((g) => g !== id)
				: [...activeGoals, id];
		});
	};

	return (
		<View style={styles.container}>
			<LinearGradient
				colors={["#F0F7FF", "#FFFFFF"]}
				style={StyleSheet.absoluteFill}
			/>

			<SafeAreaView style={styles.safeArea}>
				<View style={styles.content}>
					<MotiView
						from={{ opacity: 0, translateY: -20 }}
						animate={{ opacity: 1, translateY: 0 }}
						transition={{ type: "timing", duration: 800 }}
						style={styles.header}
					>
						<View style={styles.progressContainer}>
							<View style={[styles.progressBar, { width: "20%" }]} />
						</View>

						<View style={styles.iconContainer}>
							<View style={styles.iconCircle}>
								<Target size={32} color={colors.primary} strokeWidth={2.5} />
							</View>
						</View>

						<Text style={styles.title}>Mục tiêu của bạn</Text>
						<Text style={styles.subtitle}>
							Lựa chọn những mong muốn của bạn để chúng tôi cá nhân hoá theo
							đúng ý bạn nhất.
						</Text>
					</MotiView>

					<ScrollView
						style={styles.scroll}
						contentContainerStyle={styles.scrollContent}
						showsVerticalScrollIndicator={false}
					>
						{GOALS.map((goal, index) => {
							const Icon = goal.icon;
							const isSelected = selectedGoals.includes(goal.id);

							return (
								<MotiView
									key={goal.id}
									from={{ opacity: 0, translateX: -50 }}
									animate={{ opacity: 1, translateX: 0 }}
									transition={{
										delay: 100 * index,
										type: "timing",
										duration: 500,
									}}
								>
									<TouchableOpacity
										onPress={() => handleSelect(goal.id)}
										activeOpacity={0.8}
										style={styles.goalWrapper}
									>
										<View
											style={[
												styles.goalCard,
												isSelected && styles.goalCardSelected,
												isSelected && { borderColor: goal.color },
											]}
										>
											<View
												style={[
													styles.goalIconBox,
													{ backgroundColor: goal.color + "15" },
													isSelected && { backgroundColor: goal.color },
												]}
											>
												<Icon
													size={24}
													color={isSelected ? "#FFFFFF" : goal.color}
													strokeWidth={2.5}
												/>
											</View>

											<View style={styles.goalInfo}>
												<Text
													style={[
														styles.goalLabel,
														isSelected && styles.goalLabelSelected,
													]}
												>
													{goal.label}
												</Text>
											</View>

											<View style={[
												styles.radioCircle,
												isSelected && { borderColor: goal.color }
											]}>
												{isSelected && (
													<MotiView
														from={{ opacity: 0, scale: 0 }}
														animate={{ opacity: 1, scale: 1 }}
														style={[styles.radioInner, { backgroundColor: goal.color }]}
													/>
												)}
											</View>
										</View>
									</TouchableOpacity>
								</MotiView>
							);
						})}
					</ScrollView>

					<MotiView
						from={{ opacity: 0, scale: 0.9 }}
						animate={{ opacity: 1, scale: 1 }}
						transition={{ delay: 1000, type: "timing", duration: 400 }}
						style={styles.footer}
					>
						<Button
							mode="contained"
							onPress={handleNext}
							disabled={selectedGoals.length === 0}
							style={[styles.button, selectedGoals.length === 0 && styles.buttonDisabled]}
							contentStyle={styles.buttonContent}
							labelStyle={styles.buttonLabel}
							buttonColor={colors.primary}
							uppercase={false}
						>
							TIẾP TỤC
						</Button>
					</MotiView>
				</View>
			</SafeAreaView>
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
	content: {
		flex: 1,
		paddingHorizontal: 24,
	},
	header: {
		marginTop: 20,
		marginBottom: 32,
		alignItems: "center",
	},
	progressContainer: {
		width: "100%",
		height: 4,
		backgroundColor: "#E5E7EB",
		borderRadius: 2,
		marginBottom: 32,
		overflow: "hidden",
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
		fontSize: 28,
		fontWeight: "800",
		color: "#111827",
		textAlign: "center",
		marginBottom: 12,
	},
	subtitle: {
		fontSize: 16,
		color: "#4B5563",
		textAlign: "center",
		lineHeight: 24,
		paddingHorizontal: 12,
	},
	scroll: {
		flex: 1,
	},
	scrollContent: {
		paddingBottom: 40,
	},
	goalWrapper: {
		marginBottom: 16,
	},
	goalCard: {
		flexDirection: "row",
		alignItems: "center",
		padding: 16,
		backgroundColor: "#FFFFFF",
		borderRadius: 20,
		borderWidth: 2,
		borderColor: "#F3F4F6",
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.05,
		shadowRadius: 10,
		elevation: 2,
	},
	goalCardSelected: {
		backgroundColor: "#FFFFFF",
		shadowOpacity: 0.1,
		shadowColor: "#3B82F6",
		transform: [{ scale: 1.02 }],
	},
	goalIconBox: {
		width: 48,
		height: 48,
		borderRadius: 14,
		justifyContent: "center",
		alignItems: "center",
	},
	goalInfo: {
		flex: 1,
		marginLeft: 16,
	},
	goalLabel: {
		fontSize: 17,
		fontWeight: "600",
		color: "#374151",
	},
	goalLabelSelected: {
		color: "#111827",
		fontWeight: "700",
	},
	radioCircle: {
		width: 22,
		height: 22,
		borderRadius: 11,
		borderWidth: 2,
		borderColor: '#D1D5DB',
		justifyContent: 'center',
		alignItems: 'center',
		marginLeft: 12,
	},
	radioInner: {
		width: 12,
		height: 12,
		borderRadius: 6,
	},
	footer: {
		paddingVertical: 20,
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
		elevation: 0,
		shadowOpacity: 0,
		opacity: 0.5,
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
