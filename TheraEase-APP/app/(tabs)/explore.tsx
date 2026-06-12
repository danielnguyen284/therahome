import React, { useEffect, useMemo, useState } from "react";
import { Image, ImageSourcePropType, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Text, Button } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Check, Sparkles } from "lucide-react-native";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuthStore } from "@/stores/authStore";
import { getOwnedDeviceIds } from "@/utils/ownedDevices";
import { api } from "@/services/api";

const NECK_IMAGE = require("../../assets/theraneck.png");
const BACK_IMAGE = require("../../assets/theraback.png");

type Product = {
	id: string;
	key: string;
	name: string;
	image_url?: string;
};

const normalizeText = (value: string) =>
	value
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.toLowerCase();

const findProduct = (products: Product[], targetKey: "ech" | "rung") =>
	products.find((product) => {
		const key = normalizeText(product.key || "");
		const name = normalizeText(product.name || "");

		if (targetKey === "ech") {
			return key === "ech" || name.includes("theraneck") || name.includes("neck") || name.includes("co vai");
		}

		return key === "rung" || name.includes("theraback") || name.includes("back") || name.includes("lung");
	}) ?? null;

const resolveProductImage = (
	product: Product | null,
	fallback: ImageSourcePropType,
	preferFallback = false,
): ImageSourcePropType => {
	if (preferFallback) {
		return fallback;
	}
	const imageUrl = product?.image_url?.trim();
	return imageUrl ? { uri: imageUrl } : fallback;
};

export default function ExploreScreen() {
	const router = useRouter();
	const user = useAuthStore((state) => state.user);
	const { colors, isDark } = useTheme();
	const insets = useSafeAreaInsets();
	const [products, setProducts] = useState<Product[]>([]);
	const ownedDeviceIds = useMemo(
		() => getOwnedDeviceIds(user?.owned_devices || []),
		[user?.owned_devices],
	);
	const hasNeckDevice = ownedDeviceIds.includes("neck_device");
	const hasBackDevice = ownedDeviceIds.includes("back_device");
	const styles = useMemo(
		() => createStyles(colors, isDark, insets.top),
		[colors, isDark, insets.top],
	);
	const neckProduct = useMemo(() => findProduct(products, "ech"), [products]);
	const backProduct = useMemo(() => findProduct(products, "rung"), [products]);
	const neckImage = useMemo(
		() => resolveProductImage(neckProduct, NECK_IMAGE, true),
		[neckProduct],
	);
	const backImage = useMemo(
		() => resolveProductImage(backProduct, BACK_IMAGE, true),
		[backProduct],
	);

	useEffect(() => {
		let isMounted = true;

		const loadProducts = async () => {
			try {
				const data = await api.get<Product[]>("/products");
				if (isMounted) {
					setProducts(data || []);
				}
			} catch (error) {
				console.warn("Load explore products error:", error);
			}
		};

		void loadProducts();

		return () => {
			isMounted = false;
		};
	}, []);

	return (
		<View style={styles.container}>
			<ScrollView
				style={styles.scroll}
				contentContainerStyle={styles.content}
				showsVerticalScrollIndicator={false}
			>
				<View style={styles.heroCard}>
					<View style={styles.heroBadge}>
						<Sparkles size={16} color={colors.primary} />
						<Text style={styles.heroBadgeText}>Thiết bị hỗ trợ</Text>
					</View>

					<Text style={styles.heroTitle}>
						Khám phá sản phẩm phù hợp với cơ thể bạn
					</Text>
					<Text style={styles.heroDescription}>
						Hai dòng thiết bị dành cho cổ và lưng, thiết kế để đồng hành cùng lộ
						trình phục hồi mỗi ngày.
					</Text>
				</View>

				<View style={styles.section}>
					<Text style={styles.sectionTitle}>Cổ</Text>
					<View style={styles.productCard}>
						<View style={styles.imageWrap}>
							<Image
								source={neckImage}
								style={styles.productImage}
								resizeMode="contain"
							/>
						</View>

						<View style={styles.productBody}>
							<Text style={styles.productName}>TheraNECK</Text>
							<Text style={styles.productDescription}>
								Thiết bị hỗ trợ cải thiện vùng cổ vai gáy, phù hợp cho người ngồi
								nhiều và hay mỏi cổ.
							</Text>
							{hasNeckDevice ? (
								<View style={styles.activatedBadge}>
									<Check size={16} color="#FFFFFF" strokeWidth={3} />
									<Text style={styles.activatedBadgeText}>Đã kích hoạt</Text>
								</View>
							) : (
								<View style={styles.actionRow}>
									<Pressable
										onPress={() => {
											Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
											router.push("/(auth)/activate-device");
										}}
									>
										<Text style={styles.actionPill}>Thêm</Text>
									</Pressable>
									<Pressable
										onPress={() => {
											Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
											router.push({
												pathname: "/(auth)/special-offer",
												params: { productKey: "ech" },
											});
										}}
									>
										<Text style={styles.actionPillPrimary}>Nhận ưu đãi</Text>
									</Pressable>
								</View>
							)}
						</View>
					</View>
				</View>

				<View style={styles.section}>
					<Text style={styles.sectionTitle}>Lưng</Text>
					<View style={styles.productCard}>
						<View style={styles.imageWrap}>
							<Image
								source={backImage}
								style={styles.productImage}
								resizeMode="contain"
							/>
						</View>

						<View style={styles.productBody}>
							<Text style={styles.productName}>TheraBACK</Text>
							<Text style={styles.productDescription}>
								Thiết bị hỗ trợ thư giãn và giảm căng cứng vùng lưng, phù hợp
								cho nhu cầu phục hồi cơ sâu.
							</Text>
							{hasBackDevice ? (
								<View style={styles.activatedBadge}>
									<Check size={16} color="#FFFFFF" strokeWidth={3} />
									<Text style={styles.activatedBadgeText}>Đã kích hoạt</Text>
								</View>
							) : (
								<View style={styles.actionRow}>
									<Pressable
										onPress={() => {
											Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
											router.push("/(auth)/activate-device");
										}}
									>
										<Text style={styles.actionPill}>Thêm</Text>
									</Pressable>
									<Pressable
										onPress={() => {
											Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
											router.push({
												pathname: "/(auth)/special-offer",
												params: { productKey: "rung" },
											});
										}}
									>
										<Text style={styles.actionPillPrimary}>Nhận ưu đãi</Text>
									</Pressable>
								</View>
							)}
						</View>
					</View>
				</View>

				<Button
					mode="contained"
					onPress={() => {
						Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
						router.push("/product-assessments");
					}}
					buttonColor={colors.primary}
					style={styles.reviewButton}
					contentStyle={styles.reviewButtonContent}
					labelStyle={styles.reviewButtonLabel}
				>
					Xem đánh giá sản phẩm
				</Button>
			</ScrollView>
		</View>
	);
}

const createStyles = (colors: any, isDark: boolean, topInset: number) =>
	StyleSheet.create({
		container: {
			flex: 1,
			backgroundColor: colors.background,
		},
		scroll: {
			flex: 1,
		},
		content: {
			paddingTop: Math.max(topInset + 12, 28),
			paddingHorizontal: 20,
			paddingBottom: 140,
			gap: 22,
		},
		heroCard: {
			backgroundColor: colors.surface,
			borderRadius: 28,
			borderWidth: 1,
			borderColor: colors.border,
			paddingHorizontal: 22,
			paddingVertical: 24,
			gap: 12,
			shadowColor: isDark ? "#000000" : "#0F172A",
			shadowOffset: { width: 0, height: 10 },
			shadowOpacity: isDark ? 0.18 : 0.08,
			shadowRadius: 20,
			elevation: 4,
		},
		heroBadge: {
			alignSelf: "flex-start",
			flexDirection: "row",
			alignItems: "center",
			gap: 8,
			paddingHorizontal: 12,
			paddingVertical: 6,
			borderRadius: 999,
			backgroundColor: `${colors.primary}14`,
			borderWidth: 1,
			borderColor: `${colors.primary}25`,
		},
		heroBadgeText: {
			fontSize: 12,
			fontWeight: "700",
			color: colors.primary,
			textTransform: "uppercase",
			letterSpacing: 0.6,
		},
		heroTitle: {
			fontSize: 28,
			lineHeight: 34,
			fontWeight: "800",
			color: colors.text,
		},
		heroDescription: {
			fontSize: 15,
			lineHeight: 24,
			color: colors.textSecondary,
		},
		section: {
			gap: 12,
		},
		sectionTitle: {
			fontSize: 22,
			fontWeight: "700",
			color: colors.text,
			paddingHorizontal: 4,
		},
		productCard: {
			backgroundColor: colors.surface,
			borderRadius: 28,
			borderWidth: 1,
			borderColor: colors.border,
			overflow: "hidden",
			shadowColor: isDark ? "#000000" : "#0F172A",
			shadowOffset: { width: 0, height: 8 },
			shadowOpacity: isDark ? 0.16 : 0.06,
			shadowRadius: 18,
			elevation: 3,
		},
			imageWrap: {
				height: 240,
				backgroundColor: isDark ? "#1C2432" : "#F8FAFC",
				borderBottomWidth: 1,
				borderBottomColor: isDark ? "rgba(148, 163, 184, 0.12)" : "rgba(148, 163, 184, 0.16)",
				justifyContent: "center",
				alignItems: "center",
				padding: 20,
			},
			productImage: {
				width: "100%",
				height: "100%",
			},
		productBody: {
			paddingHorizontal: 20,
			paddingVertical: 18,
			gap: 10,
		},
		productName: {
			fontSize: 22,
			fontWeight: "800",
			color: colors.text,
		},
		productDescription: {
			fontSize: 14,
			lineHeight: 22,
			color: colors.textSecondary,
		},
		metaRow: {
			flexDirection: "row",
			alignItems: "center",
		},
		actionRow: {
			flexDirection: "row",
			alignItems: "center",
			gap: 10,
			flexWrap: "wrap",
		},
		statusPill: {
			paddingHorizontal: 12,
			paddingVertical: 8,
			borderRadius: 999,
			backgroundColor: `${colors.primary}14`,
			color: colors.primary,
			fontSize: 13,
			fontWeight: "700",
			overflow: "hidden",
		},
		activatedBadge: {
			alignSelf: "flex-start",
			flexDirection: "row",
			alignItems: "center",
			gap: 8,
			paddingHorizontal: 16,
			paddingVertical: 10,
			borderRadius: 999,
			backgroundColor: "#16A34A",
		},
		activatedBadgeText: {
			fontSize: 13,
			fontWeight: "800",
			color: "#FFFFFF",
		},
		actionPill: {
			paddingHorizontal: 14,
			paddingVertical: 8,
			borderRadius: 999,
			backgroundColor: colors.background,
			borderWidth: 1,
			borderColor: colors.border,
			color: colors.text,
			fontSize: 13,
			fontWeight: "700",
			overflow: "hidden",
		},
		actionPillPrimary: {
			paddingHorizontal: 14,
			paddingVertical: 8,
			borderRadius: 999,
			backgroundColor: colors.primary,
			color: "#FFFFFF",
			fontSize: 13,
			fontWeight: "700",
			overflow: "hidden",
		},
		reviewButton: {
			borderRadius: 999,
			marginTop: 4,
		},
		reviewButtonContent: {
			minHeight: 56,
		},
		reviewButtonLabel: {
			fontSize: 17,
			fontWeight: "700",
		},
	});
