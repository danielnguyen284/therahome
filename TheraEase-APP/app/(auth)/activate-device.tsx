import React, { useState, useEffect } from "react";
import {
	View,
	StyleSheet,
	Dimensions,
	TouchableOpacity,
	TextInput,
	Alert,
	ActivityIndicator,
} from "react-native";
import { Text, Button } from "react-native-paper";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import Animated, { FadeInUp, FadeInDown } from "react-native-reanimated";
import { MotiView } from "moti";
import { ArrowLeft } from "lucide-react-native";
import { useAuthStore } from "@/stores/authStore";
import { persistOnboardingProfile } from "@/services/onboardingProfile";
import { CameraView, useCameraPermissions } from "expo-camera";
import { api } from "@/services/api";

const { width } = Dimensions.get("window");

export default function ActivateDeviceScreen() {
	const router = useRouter();
	const insets = useSafeAreaInsets();
	const { user, setUser } = useAuthStore();
	const [permission, requestPermission] = useCameraPermissions();

	const [isManual, setIsManual] = useState(false);
	const [isScanning, setIsScanning] = useState(false);
	const [activationCode, setActivationCode] = useState("");
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		if (isScanning && !permission?.granted) {
			void requestPermission();
		}
	}, [isScanning, permission, requestPermission]);

	const handleActivateCode = async (codeStr: string) => {
		const normalizedCode = codeStr.trim().toUpperCase();
		if (!normalizedCode) return;

		if (!user || user.id === "guest") {
			setLoading(true);
			try {
				await api.post("/codes/validate", { code: normalizedCode });
				await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
				router.replace({
					pathname: "/(auth)/login",
					params: { activationCode: normalizedCode },
				});
			} catch (error: any) {
				console.warn("Validate activation code error:", error?.message || error);
				Alert.alert(
					"Lỗi",
					error?.message || "Mã không hợp lệ hoặc chưa được kích hoạt.",
				);
			} finally {
				setLoading(false);
			}
			return;
		}

		setLoading(true);
		try {
			const response = await api.post("/codes/activate", { code: normalizedCode });

			if (response?.user) {
				setUser(response.user);
			}

			if (user || response?.user) {
				await persistOnboardingProfile();
			}
			router.replace("/(tabs)/home");
			Alert.alert("Thành công", "Kích hoạt thiết bị thành công!");
		} catch (error: any) {
			console.warn("Activate error:", error?.message || error);
			Alert.alert(
				"Lỗi",
				error?.message || "Mã không hợp lệ hoặc đã được sử dụng.",
			);
		} finally {
			setLoading(false);
		}
	};

	const handleAction = async () => {
		await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
		handleActivateCode(activationCode);
	};

	const handleBarcodeScanned = ({ type, data }: any) => {
		setIsScanning(false);
		void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
		setActivationCode(data);
		handleActivateCode(data);
	};

	if (isScanning) {
		if (!permission) {
			return <View style={styles.container} />;
		}
		if (!permission.granted) {
			return (
				<SafeAreaView style={styles.container}>
					<View style={styles.content}>
						<Text style={{ textAlign: "center", marginBottom: 20 }}>
							Chúng tôi cần quyền truy cập camera để quét mã QR.
						</Text>
						<Button mode="contained" onPress={requestPermission}>
							Cấp quyền Camera
						</Button>
						<Button
							mode="text"
							onPress={() => setIsScanning(false)}
							style={{ marginTop: 10 }}
						>
							Quay lại
						</Button>
					</View>
				</SafeAreaView>
			);
		}

		return (
			<View style={styles.container}>
				<CameraView
					style={StyleSheet.absoluteFillObject}
					facing="back"
					onBarcodeScanned={loading ? undefined : handleBarcodeScanned}
					barcodeScannerSettings={{
						barcodeTypes: ["qr"],
					}}
				/>
				<View style={styles.overlay}>
					<View style={styles.scanFrame} />
					{loading && (
						<ActivityIndicator
							size="large"
							color="#FFF"
							style={{ marginTop: 20 }}
						/>
					)}
					<TouchableOpacity
						onPress={() => setIsScanning(false)}
						style={styles.cancelScanButton}
					>
						<Text style={styles.cancelScanText}>Hủy Quét</Text>
					</TouchableOpacity>
				</View>
			</View>
		);
	}

	return (
		<SafeAreaView style={styles.container}>
			<TouchableOpacity
				onPress={() => router.back()}
				style={[styles.backButtonTop, { top: insets.top + 8 }]}
				activeOpacity={0.8}
			>
				<ArrowLeft size={24} color="#1E293B" />
			</TouchableOpacity>
			<View style={styles.content}>
				<Animated.View
					entering={FadeInUp.duration(600).springify()}
					style={styles.messageBox}
				>
					<Text style={styles.messageText}>
						Mã kích hoạt kèm theo ở trong hộp sản phẩm nếu bạn không thấy vui
						lòng nhắn tin{"\n"}
						Zalo: <Text style={styles.bold}>0364263552</Text>
					</Text>
				</Animated.View>

				<View style={styles.footer}>
					<Animated.View entering={FadeInDown.delay(400).duration(600)}>
						{isManual ? (
							<MotiView
								from={{ opacity: 0, scale: 0.9 }}
								animate={{ opacity: 1, scale: 1 }}
								transition={{ type: "timing", duration: 400 }}
								style={styles.manualEntryContainer}
							>
								<TextInput
									style={styles.input}
									placeholder="Nhập mã kích hoạt tại đây..."
									placeholderTextColor="#94A3B8"
									value={activationCode}
									onChangeText={setActivationCode}
									autoFocus
									autoCapitalize="characters"
									editable={!loading}
								/>
								<TouchableOpacity
									onPress={handleAction}
									style={[
										styles.qrButton,
										(!activationCode || loading) && { opacity: 0.5 },
									]}
									disabled={!activationCode || loading}
								>
									{loading ? (
										<ActivityIndicator color="#FFFFFF" />
									) : (
										<Text style={styles.qrText}>Xác nhận</Text>
									)}
								</TouchableOpacity>
								{!loading && (
									<TouchableOpacity
										onPress={() => setIsManual(false)}
										style={styles.backButton}
									>
										<Text style={styles.backText}>Quay lại</Text>
									</TouchableOpacity>
								)}
							</MotiView>
						) : (
							<>
								<TouchableOpacity
									onPress={() => {
										void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
										setIsManual(true);
									}}
									style={styles.manualButton}
								>
									<Text style={styles.manualText}>Nhập thủ công</Text>
								</TouchableOpacity>

								<TouchableOpacity
									onPress={() => {
										void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
										setIsScanning(true);
									}}
									style={styles.qrButton}
								>
									<Text style={styles.qrText}>Quét QR</Text>
								</TouchableOpacity>
							</>
						)}
					</Animated.View>
				</View>
			</View>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#FFFFFF",
	},
	backButtonTop: {
		position: "absolute",
		left: 20,
		zIndex: 10,
		width: 44,
		height: 44,
		borderRadius: 22,
		backgroundColor: "#FFFFFF",
		borderWidth: 1,
		borderColor: "#E2E8F0",
		alignItems: "center",
		justifyContent: "center",
		shadowColor: "#0F172A",
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.08,
		shadowRadius: 10,
		elevation: 3,
	},
	content: {
		flex: 1,
		paddingHorizontal: 30,
		justifyContent: "center",
		alignItems: "center",
	},
	messageBox: {
		marginBottom: 60,
	},
	messageText: {
		fontSize: 18,
		color: "#333",
		textAlign: "center",
		lineHeight: 28,
		fontStyle: "italic",
	},
	bold: {
		fontWeight: "bold",
		fontStyle: "normal",
	},
	footer: {
		width: "100%",
		gap: 20,
	},
	manualButton: {
		width: "100%",
		backgroundColor: "#FFFFFF",
		paddingVertical: 18,
		borderRadius: 40,
		alignItems: "center",
		borderWidth: 2,
		borderColor: "#E2E8F0",
		marginBottom: 20,
		shadowColor: "#3B82F6",
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.1,
		shadowRadius: 8,
		elevation: 3,
	},
	manualText: {
		fontSize: 22,
		fontWeight: "bold",
		color: "#3B82F6",
	},
	qrButton: {
		width: "100%",
		backgroundColor: "#3B82F6",
		paddingVertical: 18,
		borderRadius: 40,
		alignItems: "center",
		shadowColor: "#3B82F6",
		shadowOffset: { width: 0, height: 6 },
		shadowOpacity: 0.3,
		shadowRadius: 12,
		elevation: 8,
	},
	qrText: {
		fontSize: 22,
		fontWeight: "bold",
		color: "#FFFFFF",
	},
	manualEntryContainer: {
		width: "100%",
		gap: 16,
	},
	input: {
		width: "100%",
		backgroundColor: "#F8FAFC",
		borderWidth: 2,
		borderColor: "#E2E8F0",
		borderRadius: 20,
		paddingHorizontal: 20,
		paddingVertical: 16,
		fontSize: 18,
		fontWeight: "600",
		color: "#1E293B",
		textAlign: "center",
		marginBottom: 8,
	},
	backButton: {
		width: "100%",
		paddingVertical: 12,
		alignItems: "center",
	},
	backText: {
		fontSize: 16,
		fontWeight: "600",
		color: "#64748B",
		textDecorationLine: "underline",
	},
	overlay: {
		flex: 1,
		backgroundColor: "rgba(0,0,0,0.5)",
		justifyContent: "center",
		alignItems: "center",
	},
	scanFrame: {
		width: 250,
		height: 250,
		borderWidth: 2,
		borderColor: "#3B82F6",
		backgroundColor: "transparent",
		borderRadius: 12,
	},
	cancelScanButton: {
		marginTop: 40,
		paddingVertical: 12,
		paddingHorizontal: 30,
		backgroundColor: "rgba(255,255,255,0.2)",
		borderRadius: 20,
	},
	cancelScanText: {
		color: "#FFF",
		fontSize: 18,
		fontWeight: "600",
	},
});
