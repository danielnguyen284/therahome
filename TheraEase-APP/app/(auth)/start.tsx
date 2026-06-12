import React from "react";
import {
	ImageBackground,
	Pressable,
	StyleSheet,
	View,
	Dimensions,
} from "react-native";
import { Text } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeInDown, FadeInUp, ZoomIn } from "react-native-reanimated";
import { ArrowRight, BrainCircuit } from "lucide-react-native";

const { width, height } = Dimensions.get("window");

export default function StartScreen() {
	const router = useRouter();

	const handleStart = async () => {
		await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
		router.replace("/(auth)/welcome");
	};

	const handleContinueWithAccount = async () => {
		await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
		router.replace("/(auth)/login");
	};

	return (
		<ImageBackground
			source={require("../../assets/welcome-bg.jpg")}
			resizeMode="cover"
			style={styles.container}
		>
			<LinearGradient
				colors={[
					"rgba(47, 79, 120, 0.22)",
					"rgba(70, 48, 18, 0.20)",
					"rgba(24, 32, 52, 0.38)",
				]}
				style={styles.overlay}
			>
				<SafeAreaView style={styles.safeArea}>
					<View style={styles.content}>
						<View style={styles.heroSpacer} />

						<Animated.View
							entering={FadeInUp.duration(700)}
							style={styles.brandBlock}
						>
							<View style={styles.brandRow}>
								<Text style={styles.brandText}>TheraAI</Text>
								<View style={styles.brandIconWrap}>
									<BrainCircuit size={36} color="#3B82F6" strokeWidth={2.4} />
								</View>
							</View>
							<Text style={styles.subtitle}>
								14 NGÀY CẢI THIỆN TẠI NHÀ CÙNG AI
							</Text>
						</Animated.View>

						<View style={styles.bottomSection}>
							<Animated.View entering={ZoomIn.delay(150).duration(500)}>
								<Pressable onPress={() => void handleStart()} style={styles.cta}>
									<Text style={styles.ctaText}>BẮT ĐẦU</Text>
									<ArrowRight size={34} color="#FFFFFF" strokeWidth={2.4} />
								</Pressable>
							</Animated.View>

							<Animated.View entering={FadeInDown.delay(250).duration(600)}>
								<Pressable
									onPress={() => void handleContinueWithAccount()}
									hitSlop={10}
								>
									<Text style={styles.continueText}>
										Tiếp tục với tài khoản hiện có của bạn
									</Text>
								</Pressable>
							</Animated.View>
						</View>
					</View>
				</SafeAreaView>
			</LinearGradient>
		</ImageBackground>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	overlay: {
		flex: 1,
	},
	safeArea: {
		flex: 1,
	},
	content: {
		flex: 1,
		paddingHorizontal: 28,
	},
	heroSpacer: {
		flex: 1.15,
	},
	brandBlock: {
		alignItems: "center",
	},
	brandRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
		marginBottom: 18,
	},
	brandText: {
		fontSize: 54,
		fontStyle: "italic",
		color: "#FFFFFF",
		fontWeight: "400",
		textShadowColor: "rgba(0,0,0,0.25)",
		textShadowOffset: { width: 0, height: 2 },
		textShadowRadius: 10,
	},
	brandIconWrap: {
		marginTop: 6,
	},
	subtitle: {
		fontSize: 18,
		fontWeight: "800",
		color: "#FFFFFF",
		textAlign: "center",
		letterSpacing: 0.4,
		textShadowColor: "rgba(0,0,0,0.28)",
		textShadowOffset: { width: 0, height: 2 },
		textShadowRadius: 8,
	},
	bottomSection: {
		paddingBottom: 34,
		paddingTop: 48,
		alignItems: "center",
	},
	cta: {
		width: Math.min(width * 0.63, 308),
		minHeight: 72,
		borderRadius: 28,
		backgroundColor: "#3B82F6",
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: 12,
		shadowColor: "#1D4ED8",
		shadowOffset: { width: 0, height: 10 },
		shadowOpacity: 0.32,
		shadowRadius: 18,
		elevation: 8,
	},
	ctaText: {
		fontSize: 24,
		fontWeight: "900",
		color: "#FFFFFF",
		letterSpacing: 0.5,
	},
	continueText: {
		marginTop: 24,
		fontSize: 16,
		color: "rgba(255,255,255,0.98)",
		textAlign: "center",
		textDecorationLine: "underline",
		textShadowColor: "rgba(0,0,0,0.25)",
		textShadowOffset: { width: 0, height: 1 },
		textShadowRadius: 4,
	},
});
