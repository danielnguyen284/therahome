import React, { useState } from "react";
import {
	View,
	StyleSheet,
	Dimensions,
	TouchableOpacity,
	Image,
} from "react-native";
import { Text, Button } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { MotiView } from "moti";
import { CircleCheckBig, CircleUserRound } from "lucide-react-native";
import { useAuthStore } from "@/stores/authStore";
import { colors } from "@/utils/theme";

const { width } = Dimensions.get("window");

const OPTIONS = [
	{
		id: "Nam",
		label: "Nam",
		image: require("../../assets/gender-male.png"),
		color: "#3B82F6",
	},
	{
		id: "Nữ",
		label: "Nữ",
		image: require("../../assets/gender-female.png"),
		color: "#EC4899",
	},
];

export default function GenderScreen() {
	const router = useRouter();
	const { user, setUser } = useAuthStore();
	const [selectedId, setSelectedId] = useState<"Nam" | "Nữ" | null>(null);

	const handleNext = async () => {
		if (!selectedId) return;
		await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

		if (user) {
			setUser({ ...user, gender: selectedId });
		}

		router.replace("/(auth)/occupation");
	};

	return (
		<View style={styles.container}>
			<LinearGradient
				colors={["#FDFCFB", "#F1F5F9"]}
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
							<View style={[styles.progressBar, { width: "10%" }]} />
						</View>

						<View style={styles.iconContainer}>
							<View style={styles.iconCircle}>
								<CircleUserRound
									size={32}
									color={colors.primary}
									strokeWidth={2.5}
								/>
							</View>
						</View>

						<Text style={styles.title}>Giới tính của bạn?</Text>
					</MotiView>

					<View style={styles.genderGrid}>
						{OPTIONS.map((option, index) => {
							const isSelected = selectedId === option.id;

							return (
								<MotiView
									key={option.id}
									from={{ opacity: 0, scale: 0.9 }}
									animate={{ opacity: 1, scale: 1 }}
									transition={{
										delay: 200 * index,
										type: "timing",
										duration: 500,
									}}
									style={styles.genderWrapper}
								>
									<TouchableOpacity
										style={[
											styles.genderCard,
											isSelected && { borderColor: option.color },
										]}
										onPress={() => {
											Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
											setSelectedId(option.id as "Nam" | "Nữ");
										}}
										activeOpacity={0.9}
									>
										<View style={styles.imageContainer}>
											<Image
												source={option.image}
												style={styles.genderImage}
												resizeMode="cover"
											/>
										</View>

										<View style={styles.cardFooter}>
											<Text
												style={[
													styles.genderLabel,
													isSelected && { color: option.color },
												]}
											>
												{option.label}
											</Text>
											{isSelected && (
												<MotiView from={{ scale: 0 }} animate={{ scale: 1 }}>
													<CircleCheckBig size={20} color={option.color} />
												</MotiView>
											)}
										</View>
									</TouchableOpacity>
								</MotiView>
							);
						})}
					</View>

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
	genderGrid: {
		flexDirection: "row",
		justifyContent: "space-between",
		width: "100%",
	},
	genderWrapper: {
		width: "47%",
	},
	genderCard: {
		backgroundColor: "#FFFFFF",
		borderRadius: 24,
		borderWidth: 3,
		borderColor: "transparent",
		overflow: "hidden",
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 10 },
		shadowOpacity: 0.1,
		shadowRadius: 20,
		elevation: 5,
	},
	imageContainer: {
		width: "100%",
		aspectRatio: 0.8,
		backgroundColor: "#F8FAFC",
	},
	genderImage: {
		width: "100%",
		height: "100%",
	},
	cardFooter: {
		padding: 16,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: 8,
	},
	genderLabel: {
		fontSize: 20,
		fontWeight: "800",
		color: "#4B5563",
	},
	footer: {
		marginTop: "auto",
		paddingVertical: 30,
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
