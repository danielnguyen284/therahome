import React, { useState } from "react";
import {
	View,
	StyleSheet,
	Dimensions,
	TextInput,
	KeyboardAvoidingView,
	Platform,
} from "react-native";
import { Text, Button } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { MotiView } from "moti";
import { Cake, Hash } from "lucide-react-native";
import { useAuthStore } from "@/stores/authStore";
import { colors } from "@/utils/theme";

const { width } = Dimensions.get("window");

export default function AgeScreen() {
	const router = useRouter();
	const { user, setUser } = useAuthStore();
	const [age, setAge] = useState("");
	const [isFocused, setIsFocused] = useState(false);

	const handleNext = async () => {
		const ageNum = parseInt(age);
		if (!ageNum || ageNum < 5 || ageNum > 110) {
			await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
			return;
		}

		await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
		if (user) {
			setUser({ ...user, age: ageNum });
		}
		router.replace("/(auth)/gender");
	};

	const isValidAge =
		age.length > 0 && parseInt(age) >= 5 && parseInt(age) <= 110;

	return (
		<View style={styles.container}>
			<LinearGradient
				colors={["#FDFCFB", "#F1F5F9"]}
				style={StyleSheet.absoluteFill}
			/>

			<SafeAreaView style={styles.safeArea}>
				<KeyboardAvoidingView
					behavior={Platform.OS === "ios" ? "padding" : "height"}
					style={styles.keyboardView}
				>
					<View style={styles.content}>
						<MotiView
							from={{ opacity: 0, translateY: -20 }}
							animate={{ opacity: 1, translateY: 0 }}
							transition={{ type: "timing", duration: 800 }}
							style={styles.header}
						>
							<View style={styles.progressContainer}>
								<View style={[styles.progressBar, { width: "15%" }]} />
							</View>

							<View style={styles.iconContainer}>
								<View style={styles.iconCircle}>
									<Cake size={32} color={colors.primary} strokeWidth={2.5} />
								</View>
							</View>

							<Text style={styles.title}>Bạn bao nhiêu tuổi?</Text>
							<Text style={styles.subtitle}>
								Hãy cho chúng tôi biết tuổi thật của bạn để đưa ra cường độ phù
								hợp.
							</Text>
						</MotiView>

						<View style={styles.inputSection}>
							<MotiView
								animate={{
									scale: isFocused ? 1.05 : 1,
								}}
								transition={{ type: "spring", damping: 15 }}
								style={styles.pickerWrapper}
							>
								{/* Highlight Card */}
								<View
									style={[
										styles.highlightBar,
										isFocused && {
											borderColor: colors.primary,
											borderWidth: 2,
										},
									]}
								>
									<TextInput
										style={styles.input}
										value={age}
										onChangeText={(val) => {
											if (val.length <= 3) {
												setAge(val.replace(/[^0-9]/g, ""));
												if (val.length > 0) Haptics.selectionAsync();
											}
										}}
										placeholder="25"
										placeholderTextColor="#D1D5DB"
										keyboardType="number-pad"
										maxLength={3}
										onFocus={() => setIsFocused(true)}
										onBlur={() => setIsFocused(false)}
										autoFocus
									/>
									<View style={styles.unitLabel}>
										<Text style={styles.unitText}>TUỔI</Text>
									</View>
								</View>
							</MotiView>
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
								disabled={!isValidAge}
								style={[styles.button, !isValidAge && styles.buttonDisabled]}
								contentStyle={styles.buttonContent}
								labelStyle={styles.buttonLabel}
								buttonColor={colors.primary}
								uppercase={false}
							>
								TIẾP TỤC
							</Button>
						</MotiView>
					</View>
				</KeyboardAvoidingView>
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
	keyboardView: {
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
	inputSection: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
	},
	pickerWrapper: {
		width: "100%",
		justifyContent: "center",
		alignItems: "center",
	},
	highlightBar: {
		height: 100,
		width: "70%",
		backgroundColor: "#FFFFFF",
		borderRadius: 30,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 10 },
		shadowOpacity: 0.1,
		shadowRadius: 20,
		elevation: 8,
		borderWidth: 1,
		borderColor: "#F1F5F9",
		paddingHorizontal: 20,
	},
	input: {
		fontSize: 48,
		fontWeight: "900",
		color: colors.primary,
		textAlign: "right",
		minWidth: 80,
		marginRight: 12,
	},
	unitLabel: {
		justifyContent: "center",
	},
	unitText: {
		fontSize: 16,
		fontWeight: "800",
		color: "#9CA3AF",
		letterSpacing: 2,
	},
	footer: {
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
