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
import { MotiView, MotiText } from "moti";
import {
	Accessibility,
	SquareUserRound,
	Bone,
	ChevronRight,
	Focus,
} from "lucide-react-native";
import { useAuthStore } from "@/stores/authStore";
import { colors } from "@/utils/theme";

const { width } = Dimensions.get("window");

const AREAS = [
	{
		id: "neck",
		label: "Cổ vai gáy",
		icon: Bone,
		color: "#5B9BD5",
		description: "Cải thiện vùng cổ vai gáy",
	},
	{
		id: "back",
		label: "Lưng & cột sống",
		icon: SquareUserRound,
		color: "#10B981",
		description: "Cải thiện đau vùng lưng, hông",
	},
	{
		id: "full",
		label: "Toàn thân",
		icon: Accessibility,
		color: "#8B5CF6",
		description: "Cải thiện cột sống cổ và lưng",
	},
];

export default function TargetAreaScreen() {
	const router = useRouter();
	const { user, setUser } = useAuthStore();
	const [selectedArea, setSelectedArea] = useState<string | null>(null);

	const handleNext = async () => {
		if (!selectedArea) return;
		await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
		const selected = AREAS.find((area) => area.id === selectedArea);
		const painAreasMap: Record<string, string[]> = {
			neck: ["neck"],
			back: ["back"],
			full: ["neck", "back"],
		};

		if (user && selected) {
			setUser({
				...user,
				focus_area: selected.label,
				pain_areas: painAreasMap[selected.id] || user.pain_areas || [],
			});
		}

		router.replace("/(auth)/understanding");
	};

	const handleSelect = (id: string) => {
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
		setSelectedArea(id);
	};

	return (
		<View style={styles.container}>
			<LinearGradient
				colors={["#FDFCFB", "#E2E8F0"]}
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
							<View style={[styles.progressBar, { width: "40%" }]} />
						</View>

						<View style={styles.iconContainer}>
							<View style={styles.iconCircle}>
								<Focus size={32} color={colors.primary} strokeWidth={2.5} />
							</View>
						</View>

						<Text style={styles.title}>Khu vực ưu tiên</Text>
						<Text style={styles.subtitle}>
							Bạn muốn tập trung cải thiện vào khu vực nào nhiều nhất?
						</Text>
					</MotiView>

					<ScrollView
						style={styles.scroll}
						contentContainerStyle={styles.scrollContent}
						showsVerticalScrollIndicator={false}
					>
						{AREAS.map((area, index) => {
							const Icon = area.icon;
							const isSelected = selectedArea === area.id;

							return (
								<MotiView
									key={area.id}
									from={{ opacity: 0, scale: 0.9 }}
									animate={{ opacity: 1, scale: 1 }}
									transition={{
										delay: 200 + index * 100,
										type: "timing",
										duration: 500,
									}}
								>
									<TouchableOpacity
										onPress={() => handleSelect(area.id)}
										activeOpacity={0.9}
										style={styles.areaWrapper}
									>
										<View
											style={[
												styles.areaCard,
												isSelected && styles.areaCardSelected,
												isSelected && { borderColor: area.color },
											]}
										>
											<View
												style={[
													styles.iconBox,
													{ backgroundColor: area.color + "10" },
													isSelected && { backgroundColor: area.color },
												]}
											>
												<Icon
													size={28}
													color={isSelected ? "#FFFFFF" : area.color}
													strokeWidth={2}
												/>
											</View>

											<View style={styles.areaInfo}>
												<Text
													style={[
														styles.areaLabel,
														isSelected && styles.areaLabelSelected,
													]}
												>
													{area.label}
												</Text>
												<Text style={styles.areaDesc}>{area.description}</Text>
											</View>

											<View
												style={[
													styles.checkbox,
													isSelected && {
														backgroundColor: area.color,
														borderColor: area.color,
													},
												]}
											>
												{isSelected && (
													<ChevronRight
														size={16}
														color="#FFFFFF"
														strokeWidth={4}
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
						from={{ opacity: 0, translateY: 20 }}
						animate={{ opacity: 1, translateY: 0 }}
						transition={{ delay: 800, type: "timing", duration: 500 }}
						style={styles.footer}
					>
						<Button
							mode="contained"
							onPress={handleNext}
							disabled={!selectedArea}
							style={[styles.button, !selectedArea && styles.buttonDisabled]}
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
		marginBottom: 40,
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
		borderRadius: 24,
		backgroundColor: "#FFFFFF",
		justifyContent: "center",
		alignItems: "center",
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.1,
		shadowRadius: 10,
		elevation: 3,
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
		color: "#6B7280",
		textAlign: "center",
		lineHeight: 24,
	},
	scroll: {
		flex: 1,
	},
	scrollContent: {
		paddingBottom: 20,
	},
	areaWrapper: {
		marginBottom: 20,
	},
	areaCard: {
		flexDirection: "row",
		alignItems: "center",
		padding: 20,
		backgroundColor: "#FFFFFF",
		borderRadius: 24,
		borderWidth: 2,
		borderColor: "transparent",
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 10 },
		shadowOpacity: 0.05,
		shadowRadius: 15,
		elevation: 4,
	},
	areaCardSelected: {
		shadowOpacity: 0.15,
		shadowColor: colors.primary,
		transform: [{ scale: 1.02 }],
	},
	iconBox: {
		width: 56,
		height: 56,
		borderRadius: 18,
		justifyContent: "center",
		alignItems: "center",
	},
	areaInfo: {
		flex: 1,
		marginLeft: 18,
	},
	areaLabel: {
		fontSize: 18,
		fontWeight: "700",
		color: "#1F2937",
		marginBottom: 4,
	},
	areaLabelSelected: {
		color: colors.primary,
	},
	areaDesc: {
		fontSize: 14,
		color: "#6B7280",
		fontWeight: "500",
	},
	checkbox: {
		width: 24,
		height: 24,
		borderRadius: 12,
		borderWidth: 2,
		borderColor: "#D1D5DB",
		justifyContent: "center",
		alignItems: "center",
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
