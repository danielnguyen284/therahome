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
import { User, Sparkles, MessageSquare } from "lucide-react-native";
import { useAuthStore } from "@/stores/authStore";
import { colors } from "@/utils/theme";

const { width } = Dimensions.get("window");

export default function NameScreen() {
	const router = useRouter();
	const { user, setUser } = useAuthStore();
	const [name, setName] = useState("");
	const [isFocused, setIsFocused] = useState(false);

	const handleNext = async () => {
		if (!name.trim()) return;
		await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

		if (user) {
			setUser({ ...user, full_name: name.trim() });
		}

		router.replace("/(auth)/age");
	};

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
								<View style={[styles.progressBar, { width: "5%" }]} />
							</View>


							<Text style={styles.title}>Chúng tôi gọi bạn là gì?</Text>
							<Text style={styles.subtitle}>
								Hãy cho chúng tôi biết tên của bạn để TheraHome có thể cá nhân
								hóa trải nghiệm của bạn.
							</Text>
						</MotiView>

						<View style={styles.inputSection}>
							<TextInput
								style={styles.simpleInput}
								value={name}
								onChangeText={setName}
								placeholder="Tên"
								placeholderTextColor="#D1D5DB"
								onFocus={() => setIsFocused(true)}
								onBlur={() => setIsFocused(false)}
								autoFocus
								autoCapitalize="words"
								autoCorrect={false}
								spellCheck={false}
								textAlign="center"
							/>
							<MotiView
								animate={{
									backgroundColor: isFocused ? colors.primary : "#9CA3AF",
								}}
								style={styles.inputBorderBottom}
							/>
						</View>

						{/* <MotiView 
              from={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 300, type: 'timing', duration: 600 }}
              style={styles.infoCard}
            >
              <View style={styles.infoIconCircle}>
                <MessageSquare size={20} color={colors.primary} />
              </View>
              <Text style={styles.infoText}>
                Tên của bạn sẽ được hiển thị trong lịch trình bài tập và lời nhắc hàng ngày.
              </Text>
            </MotiView> */}

						<MotiView
							from={{ opacity: 0, translateY: 20 }}
							animate={{ opacity: 1, translateY: 0 }}
							transition={{ delay: 600, type: "timing", duration: 500 }}
							style={styles.footer}
						>
							<Button
								mode="contained"
								onPress={handleNext}
								disabled={!name.trim()}
								style={[styles.button, !name.trim() && styles.buttonDisabled]}
								contentStyle={styles.buttonContent}
								labelStyle={styles.buttonLabel}
								buttonColor={colors.primary}
								uppercase={false}
							>
								BẮT ĐẦU NGAY
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
		marginBottom: 32,
		alignItems: "center",
		justifyContent: "center",
		marginTop: 20,
	},
	simpleInput: {
		fontSize: 48,
		fontWeight: "800",
		color: "#111827",
		minWidth: "80%",
		paddingVertical: 10,
	},
	inputBorderBottom: {
		width: "80%",
		height: 2,
		marginTop: 4,
	},
	infoCard: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: "#FFFFFF",
		padding: 20,
		borderRadius: 20,
		borderWidth: 1,
		borderColor: "#F1F5F9",
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.04,
		shadowRadius: 10,
		elevation: 2,
	},
	infoIconCircle: {
		width: 40,
		height: 40,
		borderRadius: 12,
		backgroundColor: colors.primary + "10",
		justifyContent: "center",
		alignItems: "center",
		marginRight: 16,
	},
	infoText: {
		flex: 1,
		fontSize: 14,
		color: "#4B5563",
		lineHeight: 20,
		fontWeight: "500",
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
