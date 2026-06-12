import React, { useEffect } from "react";
import { View, StyleSheet, Dimensions } from "react-native";
import { Text, Button } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown, ZoomIn } from "react-native-reanimated";
import { useAuthStore } from "@/stores/authStore";

const { width } = Dimensions.get("window");

export default function WelcomeScreen() {
	const router = useRouter();
	const user = useAuthStore((state) => state.user);

	useEffect(() => {
		if (!user) {
			router.replace("/(auth)/login");
			return;
		}

		if (user.onboarding_completed) {
			router.replace("/(tabs)/home");
		}
	}, [user, router]);

	const handleNext = async () => {
		await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
		router.replace("/(auth)/goals");
	};

	return (
		<SafeAreaView style={styles.container}>
			<View style={styles.content}>
				<View style={styles.avatarContainer}>
					<Animated.Image
						entering={ZoomIn.duration(800).springify()}
						source={require('../../assets/Xin chao tôi là trợ lí.png')}
						style={styles.avatar}
					/>
				</View>

				<Animated.View entering={FadeInDown.delay(300).duration(600)}>
					<Text style={styles.title}>XIN CHÀO!</Text>
				</Animated.View>

				<Animated.View entering={FadeInDown.delay(500).duration(600)}>
					<Text style={styles.description}>
						Tôi là trợ lí cải thiện AI cá nhân của bạn.{"\n"}
						Để đạt được hiệu quả cao nhất cho{"\n"}
						<Text style={styles.highlightText}>lộ trình cá nhân hoá</Text> sắp
						tới,
						{"\n"}
						bạn cho tôi hỏi một số câu hỏi nhé?
					</Text>
				</Animated.View>

				<Animated.View
					entering={FadeInDown.delay(700).duration(600)}
					style={styles.buttonContainer}
				>
					<Button
						mode="contained"
						onPress={handleNext}
						style={styles.button}
						contentStyle={styles.buttonContent}
						labelStyle={styles.buttonLabel}
						buttonColor="#3B82F6"
						uppercase={false}
					>
						TÔI ĐÃ SẴN SÀNG!
					</Button>
				</Animated.View>
			</View>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#FFFFFF",
	},
	content: {
		flex: 1,
		justifyContent: "center",
		paddingHorizontal: width * 0.08,
	},
	avatarContainer: {
		marginBottom: 20,
		alignItems: "flex-start",
	},
	avatar: {
		width: width * 0.35,
		height: width * 0.35,
		borderRadius: (width * 0.35) / 2,
		borderWidth: 1,
		borderColor: "#E5E7EB",
	},
	title: {
		fontSize: 36,
		fontWeight: "900",
		color: "#000000",
		marginBottom: 16,
		letterSpacing: 0.5,
	},
	description: {
		fontSize: 18,
		color: "#000000",
		lineHeight: 30,
		fontWeight: "400",
	},
	highlightText: {
		color: "#60A5FA",
	},
	buttonContainer: {
		alignItems: "center",
		marginTop: 60,
	},
	button: {
		width: "100%",
		borderRadius: 30,
		elevation: 8,
		shadowColor: "#3B82F6",
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.3,
		shadowRadius: 8,
	},
	buttonContent: {
		paddingVertical: 12,
	},
	buttonLabel: {
		fontSize: 20,
		fontWeight: "bold",
		color: "#FFFFFF",
		lineHeight: 28,
	},
});
