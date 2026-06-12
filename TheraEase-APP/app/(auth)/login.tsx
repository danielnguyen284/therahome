import React, { useState, useEffect } from "react";
import {
	View,
	StyleSheet,
	Dimensions,
	ImageBackground,
	Alert,
	Platform,
	Image,
} from "react-native";
import { Text, Button } from "react-native-paper";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import Constants, { ExecutionEnvironment } from "expo-constants";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Svg, Path } from "react-native-svg";
import AuthLoadingModal from "@/components/AuthLoadingModal";
import Animated, {
	FadeInDown,
	FadeInUp,
	BounceIn,
	useSharedValue,
	useAnimatedStyle,
	withRepeat,
	withTiming,
	withSequence,
} from "react-native-reanimated";
import { useAuthStore } from "@/stores/authStore";

import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import * as Facebook from "expo-auth-session/providers/facebook";

WebBrowser.maybeCompleteAuthSession();

const { width } = Dimensions.get("window");

const messages = [
	"Hãy cùng lên ý tưởng",
	"Giảm đau hiệu quả mỗi ngày",
	"Phục hồi cơ thể khỏe mạnh",
	"Bác sĩ hỗ trợ trong túi",
	"Lộ trình dành riêng cho bạn",
];

const FACEBOOK_APP_ID =
	process.env.EXPO_PUBLIC_FACEBOOK_APP_ID || "34694532530194658";
const FACEBOOK_PERMISSIONS = ["public_profile", "email"];
const IS_EXPO_GO =
	Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
const EXPO_PROJECT_OWNER = Constants.expoConfig?.owner || "vohuyhoang";
const EXPO_PROJECT_SLUG = Constants.expoConfig?.slug || "theraease-app";
const EXPO_PROJECT_FULL_NAME = `@${EXPO_PROJECT_OWNER}/${EXPO_PROJECT_SLUG}`;
const FACEBOOK_REDIRECT_URI = (() => {
	if (IS_EXPO_GO && Platform.OS !== "web") {
		return `https://auth.expo.io/${EXPO_PROJECT_FULL_NAME}`;
	}

	return AuthSession.makeRedirectUri({
		path: "authorize",
		native: `fb${FACEBOOK_APP_ID}://authorize`,
	});
})();

function TypewriterText() {
	const [displayText, setDisplayText] = useState("");
	const [messageIndex, setMessageIndex] = useState(0);
	const [isDeleting, setIsDeleting] = useState(false);
	const [charIndex, setCharIndex] = useState(0);

	const cursorOpacity = useSharedValue(1);

	useEffect(() => {
		cursorOpacity.value = withRepeat(
			withSequence(
				withTiming(0, { duration: 500 }),
				withTiming(1, { duration: 500 }),
			),
			-1,
			true,
		);
	}, []);

	const cursorStyle = useAnimatedStyle(() => ({
		opacity: cursorOpacity.value,
	}));

	useEffect(() => {
		const currentMessage = messages[messageIndex];

		const timeout = setTimeout(
			() => {
				if (!isDeleting && charIndex < currentMessage.length) {
					const nextChar = currentMessage[charIndex];
					setDisplayText(currentMessage.substring(0, charIndex + 1));
					setCharIndex(charIndex + 1);

					if (nextChar !== " ") {
						Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
					}
				} else if (!isDeleting && charIndex === currentMessage.length) {
					setTimeout(() => setIsDeleting(true), 1500);
				} else if (isDeleting && charIndex > 0) {
					const deletedChar = currentMessage[charIndex - 1];
					setDisplayText(currentMessage.substring(0, charIndex - 1));
					setCharIndex(charIndex - 1);

					if (deletedChar !== " ") {
						Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
					}
				} else if (isDeleting && charIndex === 0) {
					setIsDeleting(false);
					setMessageIndex((messageIndex + 1) % messages.length);
				}
			},
			isDeleting ? 20 : Math.random() * 40 + 60,
		);

		return () => clearTimeout(timeout);
	}, [charIndex, isDeleting, messageIndex]);

	return (
		<View style={styles.typewriterContainer}>
			<Text style={styles.typewriterText}>
				{displayText}
				<Animated.Text style={[styles.cursor, cursorStyle]}>|</Animated.Text>
			</Text>
		</View>
	);
}

export default function LoginScreen() {
	const router = useRouter();
	const params = useLocalSearchParams<{ activationCode?: string }>();
	const user = useAuthStore((state) => state.user);
	const [loading, setLoading] = useState(false);
	const [authMessage, setAuthMessage] = useState("Đang kết nối với Google...");

	const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
		iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
		androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
		webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
		...(Platform.OS === "ios" && process.env.EXPO_PUBLIC_GOOGLE_IOS_URL_SCHEME
			? {
					redirectUri: `${process.env.EXPO_PUBLIC_GOOGLE_IOS_URL_SCHEME}:/oauthredirect`,
				}
			: {}),
	});

	const [facebookRequest, facebookResponse, promptFacebookAsync] =
		Facebook.useAuthRequest({
			clientId: FACEBOOK_APP_ID,
			iosClientId: FACEBOOK_APP_ID,
			androidClientId: FACEBOOK_APP_ID,
			webClientId: FACEBOOK_APP_ID,
			responseType: AuthSession.ResponseType.Token,
			usePKCE: false,
			scopes: FACEBOOK_PERMISSIONS,
			redirectUri: FACEBOOK_REDIRECT_URI,
		});

	useEffect(() => {
		if (!user) return;

		if (user.id === "guest") {
			return;
		}

		if (user.onboarding_completed) {
			router.replace("/(tabs)/home");
			return;
		}

		router.replace("/(auth)/welcome");
	}, [user, router]);

	useEffect(() => {
		if (!response) return;

		if (response.type === "success") {
			const idToken = response.params?.id_token;

			if (!idToken) {
				setLoading(false);
				Alert.alert("Đăng nhập thất bại", "Không lấy được id_token từ Google");
				return;
			}

			handleTokenFromGoogle(idToken);
			return;
		}

		if (response.type === "error") {
			setLoading(false);
			const details =
				response.error?.message ||
				(response.params as any)?.error_description ||
				(response.params as any)?.error ||
				"Google OAuth bị lỗi";
			Alert.alert("Đăng nhập thất bại", details);
			return;
		}

		if (response.type === "dismiss" || response.type === "cancel") {
			setLoading(false);
		}
	}, [response]);

	useEffect(() => {
		if (!facebookResponse) return;

		if (facebookResponse.type === "success") {
			const accessToken =
				(facebookResponse.authentication as any)?.accessToken ||
				(facebookResponse.params as any)?.access_token;

			if (!accessToken) {
				setLoading(false);
				Alert.alert(
					"Đăng nhập Facebook thất bại",
					"Không lấy được access token từ Facebook",
				);
				return;
			}

			void handleTokenFromFacebook(accessToken);
			return;
		}

		if (facebookResponse.type === "error") {
			setLoading(false);
			const details =
				facebookResponse.error?.message ||
				(facebookResponse.params as any)?.error_description ||
				(facebookResponse.params as any)?.error ||
				"Facebook OAuth bị lỗi";
			Alert.alert("Đăng nhập Facebook thất bại", details);
			return;
		}

		if (
			facebookResponse.type === "dismiss" ||
			facebookResponse.type === "cancel"
		) {
			setLoading(false);
		}
	}, [facebookResponse]);

	const handleAuthSuccess = async (dataUser: any) => {
		if (!dataUser) {
			throw new Error("Không nhận được dữ liệu người dùng từ server");
		}

		const draftUser = useAuthStore.getState().user;
		const isGuestDraft = draftUser?.id === "guest";

		const mergedUser = isGuestDraft
			? {
					...dataUser,
					full_name: draftUser.full_name || dataUser.full_name,
					age: draftUser.age || dataUser.age,
					occupation: draftUser.occupation || dataUser.occupation,
					gender: draftUser.gender || dataUser.gender,
					height: draftUser.height || dataUser.height,
					weight: draftUser.weight || dataUser.weight,
					target_weight: draftUser.target_weight || dataUser.target_weight,
					primary_goal: draftUser.primary_goal || dataUser.primary_goal,
					focus_area: draftUser.focus_area || dataUser.focus_area,
					limitations: draftUser.limitations || dataUser.limitations,
					diet_type: draftUser.diet_type || dataUser.diet_type,
					pain_areas:
						draftUser.pain_areas && draftUser.pain_areas.length > 0
							? draftUser.pain_areas
							: dataUser.pain_areas,
					symptoms:
						draftUser.symptoms && draftUser.symptoms.length > 0
							? draftUser.symptoms
							: dataUser.symptoms,
					surgery_history:
						draftUser.surgery_history || dataUser.surgery_history,
					preferred_time: draftUser.preferred_time || dataUser.preferred_time,
					owned_devices:
						draftUser.owned_devices && draftUser.owned_devices.length > 0
							? draftUser.owned_devices
							: dataUser.owned_devices,
				}
			: dataUser;

		useAuthStore.getState().setUser(mergedUser);

		await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
		setAuthMessage("Đăng nhập thành công!");

		if (isGuestDraft) {
			setAuthMessage("Đang lưu lộ trình của bạn...");
			const { persistOnboardingProfile } = await import(
				"@/services/onboardingProfile"
			);
			const savedUser = await persistOnboardingProfile();

			if (params.activationCode) {
				setAuthMessage("Đang liên kết thiết bị...");
				const response = await (await import("@/services/api")).api.post(
					"/codes/activate",
					{
						code: params.activationCode,
					},
				);
				if (response?.user) {
					useAuthStore.getState().setUser(response.user);
				} else if (savedUser) {
					useAuthStore.getState().setUser(savedUser);
				}
			} else if (savedUser) {
				useAuthStore.getState().setUser(savedUser);
			}

			router.replace("/(tabs)/home");
			return;
		}

		if (dataUser.onboarding_completed) {
			router.replace("/(tabs)/home");
		} else {
			router.replace("/(auth)/welcome");
		}
	};

	const handleTokenFromGoogle = async (idToken: string) => {
		try {
			setAuthMessage("Đang đăng nhập...");

			const { signInWithGoogleToken } = await import("@/services/auth");
			const data = await signInWithGoogleToken(idToken);
			await handleAuthSuccess(data.user);
		} catch (error: any) {
			console.error("Login error:", error);
			await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
			Alert.alert("Đăng nhập thất bại", error?.message || "Có lỗi xảy ra");
		} finally {
			setLoading(false);
		}
	};

	const handleGoogleSignIn = async () => {
		try {
			setLoading(true);
			setAuthMessage("Đang kết nối với Google...");
			await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

			await promptAsync();
		} catch (error: any) {
			setLoading(false);
			await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
			Alert.alert("Đăng nhập thất bại", error?.message || "Có lỗi xảy ra");
		}
	};

	const handleTokenFromFacebook = async (accessToken: string) => {
		try {
			setAuthMessage("Đang đăng nhập với Facebook...");
			const { signInWithFacebookToken } = await import("@/services/auth");
			const data = await signInWithFacebookToken(accessToken);
			await handleAuthSuccess(data.user);
		} catch (error: any) {
			console.error("Facebook login error:", error);
			await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
			Alert.alert(
				"Đăng nhập Facebook thất bại",
				error?.message || "Có lỗi xảy ra",
			);
		} finally {
			setLoading(false);
		}
	};

	const handleFacebookSignIn = async () => {
		let delegatedToTokenHandler = false;

		try {
			setLoading(true);
			setAuthMessage("Đang kết nối với Facebook...");
			await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

			if (IS_EXPO_GO && Platform.OS !== "web") {
				if (!facebookRequest?.url) {
					throw new Error("Không thể khởi tạo Facebook OAuth");
				}

				const returnUrl = AuthSession.getDefaultReturnUrl();
				const proxyUrl = `https://auth.expo.io/${EXPO_PROJECT_FULL_NAME}/start?${new URLSearchParams(
					{
						authUrl: facebookRequest.url,
						returnUrl,
					},
				).toString()}`;

				const result = await WebBrowser.openAuthSessionAsync(
					proxyUrl,
					returnUrl,
				);

				if (result.type === "success") {
					const parsed = facebookRequest.parseReturnUrl(result.url);

					if (parsed.type !== "success") {
						const details =
							parsed.type === "error"
								? parsed.error?.message ||
									(parsed.params as any)?.error_description ||
									(parsed.params as any)?.error ||
									"Facebook OAuth bị lỗi"
								: "Facebook OAuth bị lỗi";
						throw new Error(details);
					}

					const accessToken =
						(parsed.authentication as any)?.accessToken ||
						(parsed.params as any)?.access_token;

					if (!accessToken) {
						throw new Error("Không lấy được access token từ Facebook");
					}

					delegatedToTokenHandler = true;
					await handleTokenFromFacebook(accessToken);
					return;
				}

				if (result.type === "cancel" || result.type === "dismiss") {
					return;
				}

				throw new Error("Không thể hoàn tất đăng nhập Facebook");
			}

			if (Platform.OS !== "web" && !IS_EXPO_GO) {
				const { Settings, LoginManager, AccessToken } = await import(
					"react-native-fbsdk-next"
				);

				Settings.initializeSDK();

				// Use the native Facebook SDK on iOS/Android to avoid Safari OAuth
				// redirect issues and keep the access-token exchange in our backend.
				const loginResult =
					Platform.OS === "ios"
						? await LoginManager.logInWithPermissions(
								FACEBOOK_PERMISSIONS,
								"enabled",
							)
						: await LoginManager.logInWithPermissions(FACEBOOK_PERMISSIONS);

				if (loginResult.isCancelled) {
					return;
				}

				const token = await AccessToken.getCurrentAccessToken();
				const accessToken = token?.accessToken;

				if (!accessToken) {
					throw new Error("Không lấy được access token từ Facebook");
				}

				delegatedToTokenHandler = true;
				await handleTokenFromFacebook(accessToken);
				return;
			}

			if (!facebookRequest) {
				throw new Error("Không thể khởi tạo Facebook OAuth");
			}

			await promptFacebookAsync();
		} catch (error: any) {
			console.error("Facebook login error:", error);
			await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
			Alert.alert(
				"Đăng nhập Facebook thất bại",
				error?.message || "Có lỗi xảy ra",
			);
		} finally {
			if (!delegatedToTokenHandler) {
				setLoading(false);
			}
		}
	};

	return (
		<ImageBackground
			source={require("../../assets/background_login.png")}
			style={styles.container}
			resizeMode="cover"
		>
			<LinearGradient
				colors={[
					"rgba(0, 0, 0, 0.1)",
					"rgba(0, 0, 0, 0.3)",
					"rgba(0, 0, 0, 0.6)",
				]}
				style={styles.container}
			>
				<AuthLoadingModal visible={loading} message={authMessage} />

				<View style={styles.safeArea}>
					<View style={styles.content}>
						<Animated.View
							entering={BounceIn.duration(1000)}
							style={styles.logoContainer}
						>
							<Animated.Image
								entering={FadeInUp.delay(400)}
								source={require("../../assets/TheraHome_logo_white.png")}
								style={styles.logoImage}
								resizeMode="contain"
							/>

							<Animated.View entering={FadeInUp.delay(600)}>
								<TypewriterText />
							</Animated.View>
						</Animated.View>

						<Animated.View
							entering={FadeInDown.delay(800)}
							style={styles.buttonContainer}
						>
							<Button
								mode="contained"
								onPress={handleGoogleSignIn}
								loading={loading}
								disabled={loading || !request}
								style={styles.button}
								contentStyle={styles.buttonContent}
								buttonColor="#FFFFFF"
								textColor="#5B9BD5"
								icon={() => (
									<Svg width="20" height="20" viewBox="0 0 24 24">
										<Path
											d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
											fill="#4285F4"
										/>
										<Path
											d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
											fill="#34A853"
										/>
										<Path
											d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
											fill="#FBBC05"
										/>
										<Path
											d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
											fill="#EA4335"
										/>
									</Svg>
								)}
							>
								Đăng nhập với Google
							</Button>

							<Button
								mode="contained"
								onPress={handleFacebookSignIn}
								loading={loading && authMessage.includes("Facebook")}
								disabled={loading || (Platform.OS === "web" && !facebookRequest)}
								style={styles.button}
								contentStyle={styles.buttonContent}
								buttonColor="#1877F2"
								textColor="#FFFFFF"
								icon={() => (
									<Svg width="20" height="20" viewBox="0 0 24 24">
										<Path
											fill="#FFFFFF"
											d="M13.5 22v-8.2h2.8l.4-3.2h-3.2V8.57c0-.93.26-1.56 1.6-1.56H16.8V4.15c-.3-.04-1.32-.13-2.5-.13-2.47 0-4.16 1.5-4.16 4.28v2.38H7.4v3.2h2.74V22h3.36Z"
										/>
									</Svg>
								)}
							>
								Đăng nhập với Facebook
							</Button>

							<View style={styles.termsContainer}>
								<Text style={styles.terms}>
									Bằng cách đăng nhập, bạn đồng ý với{" "}
								</Text>
								<Text
									style={styles.termsLink}
									onPress={() => router.push("/terms")}
								>
									Điều khoản sử dụng
								</Text>
								<Text style={styles.terms}> và </Text>
								<Text
									style={styles.termsLink}
									onPress={() => router.push("/privacy")}
								>
									Chính sách bảo mật
								</Text>
							</View>
						</Animated.View>
					</View>
				</View>
			</LinearGradient>
		</ImageBackground>
	);
}

const styles = StyleSheet.create({
	container: { flex: 1 },
	safeArea: { flex: 1, paddingTop: 60, paddingBottom: 40 },
	content: {
		flex: 1,
		justifyContent: "space-between",
		paddingHorizontal: width * 0.08,
	},
	logoContainer: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
	},
	title: {
		fontSize: width * 0.11,
		fontWeight: "bold",
		color: "#FFFFFF",
		marginBottom: 16,
		textShadowColor: "rgba(0, 0, 0, 0.3)",
		textShadowOffset: { width: 0, height: 2 },
		textShadowRadius: 4,
	},
	logoImage: {
		width: width * 0.8,
		height: width * 0.25,
		marginBottom: 16,
	},
	typewriterContainer: {
		minHeight: 60,
		justifyContent: "center",
		alignItems: "center",
		paddingHorizontal: 20,
	},
	typewriterText: {
		fontSize: width * 0.055,
		color: "#FFFFFF",
		textAlign: "center",
		fontWeight: "600",
		textShadowColor: "rgba(0, 0, 0, 0.3)",
		textShadowOffset: { width: 0, height: 2 },
		textShadowRadius: 4,
	},
	cursor: {
		fontSize: width * 0.055,
		color: "#FFFFFF",
		fontWeight: "300",
	},
	buttonContainer: { gap: 16 },
	button: {
		borderRadius: 20,
		elevation: 8,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.3,
		shadowRadius: 8,
	},
	buttonContent: { paddingVertical: 12 },
	termsContainer: {
		flexDirection: "row",
		flexWrap: "wrap",
		justifyContent: "center",
		marginTop: 8,
		paddingHorizontal: 20,
	},
	terms: {
		fontSize: 13,
		color: "rgba(255, 255, 255, 0.7)",
		lineHeight: 20,
	},
	termsLink: {
		fontSize: 13,
		color: "#FFFFFF",
		fontWeight: "bold",
		textDecorationLine: "underline",
		lineHeight: 20,
	},
});
