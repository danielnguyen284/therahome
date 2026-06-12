import React, { useEffect, useMemo, useState } from "react";
import {
	ActivityIndicator,
	Dimensions,
	Image,
	Pressable,
	ScrollView,
	StyleSheet,
	View,
} from "react-native";
import { Text } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CheckCircle2, XCircle } from "lucide-react-native";
import { useTheme } from "@/contexts/ThemeContext";
import { api } from "@/services/api";

type PostureItem = {
	id: string;
	category: string;
	image_url: string;
	image_urls?: string[];
	is_correct: boolean;
	description: string;
	sort_order: number;
};

type PostureGroup = {
	category: string;
	correct: PostureItem | null;
	incorrect: PostureItem | null;
};

const CATEGORY_ORDER = [
	"Làm việc",
	"Ngủ",
	"Ngồi, nghỉ",
	"Dùng điện thoại",
	"Lái xe",
	"Bê vác",
];

export default function PostureScreen() {
	const { colors, isDark } = useTheme();
	const insets = useSafeAreaInsets();
	const styles = useMemo(
		() => createStyles(colors, isDark, insets.top),
		[colors, isDark, insets.top],
	);
	const [groups, setGroups] = useState<PostureGroup[]>([]);
	const [selectedCategory, setSelectedCategory] = useState<string>("");
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");

	useEffect(() => {
		void loadPostures();
	}, []);

	const loadPostures = async () => {
		try {
			setLoading(true);
			setError("");
			const data = await api.get<PostureItem[]>("/postures");
			const groupedMap = new Map<string, PostureGroup>();

			data.forEach((item) => {
				if (!groupedMap.has(item.category)) {
					groupedMap.set(item.category, {
						category: item.category,
						correct: null,
						incorrect: null,
					});
				}

				const group = groupedMap.get(item.category)!;
				if (item.is_correct) {
					group.correct = item;
				} else {
					group.incorrect = item;
				}
			});

			const sorted = Array.from(groupedMap.values()).sort((a, b) => {
				const aIndex = CATEGORY_ORDER.indexOf(a.category);
				const bIndex = CATEGORY_ORDER.indexOf(b.category);
				if (aIndex === -1 && bIndex === -1)
					return a.category.localeCompare(b.category, "vi");
				if (aIndex === -1) return 1;
				if (bIndex === -1) return -1;
				return aIndex - bIndex;
			});

			setGroups(sorted);
			setSelectedCategory((current) => current || sorted[0]?.category || "");
		} catch (err) {
			console.error("Load postures error:", err);
			setError("Không thể tải dữ liệu tư thế lúc này.");
		} finally {
			setLoading(false);
		}
	};

	const activeGroup =
		groups.find((group) => group.category === selectedCategory) ||
		groups[0] ||
		null;

	return (
		<View style={styles.container}>
			<ScrollView
				style={styles.scroll}
				contentContainerStyle={styles.content}
				showsVerticalScrollIndicator={false}
			>
				<View style={styles.headerWrap}>
					<View style={styles.headerCard}>
						<Text style={styles.headerTitle}>Tư thế</Text>
						<Text style={styles.subtitle}>
							Xem tư thế đúng và sai cho từng hoạt động hằng ngày.
						</Text>
					</View>
				</View>

				{loading ? (
					<View style={styles.stateWrap}>
						<ActivityIndicator size="large" color={colors.primary} />
						<Text style={styles.stateText}>Đang tải dữ liệu tư thế...</Text>
					</View>
				) : error ? (
					<View style={styles.stateWrap}>
						<Text style={styles.stateText}>{error}</Text>
					</View>
				) : groups.length === 0 ? (
					<View style={styles.stateWrap}>
						<Text style={styles.stateText}>Chưa có dữ liệu tư thế.</Text>
					</View>
				) : (
					<>
						<ScrollView
							horizontal
							showsHorizontalScrollIndicator={false}
							contentContainerStyle={styles.categoryRow}
						>
							{groups.map((group) => {
								const isActive = group.category === activeGroup?.category;
								return (
									<Pressable
										key={group.category}
										onPress={() => setSelectedCategory(group.category)}
										style={[
											styles.categoryChip,
											isActive && styles.categoryChipActive,
										]}
									>
										<Text
											style={[
												styles.categoryChipText,
												isActive && styles.categoryChipTextActive,
											]}
										>
											{group.category}
										</Text>
									</Pressable>
								);
							})}
						</ScrollView>

						{activeGroup && (
							<View style={styles.detailSection}>
								<Text style={styles.sectionTitle}>{activeGroup.category}</Text>

								<PostureCard
									title="Tư thế sai"
									icon={<XCircle size={20} color="#DC2626" />}
									item={activeGroup.incorrect}
									emptyText="Chưa có ảnh tư thế sai"
									styles={styles}
								/>

								<PostureCard
									title="Tư thế đúng"
									icon={<CheckCircle2 size={20} color="#16A34A" />}
									item={activeGroup.correct}
									emptyText="Chưa có ảnh tư thế đúng"
									styles={styles}
								/>
							</View>
						)}
					</>
				)}
			</ScrollView>
		</View>
	);
}

function PostureCard({
	title,
	icon,
	item,
	emptyText,
	styles,
}: {
	title: string;
	icon: React.ReactNode;
	item: PostureItem | null;
	emptyText: string;
	styles: ReturnType<typeof createStyles>;
}) {
	const imageUrls =
		item?.image_urls && item.image_urls.length > 0
			? item.image_urls
			: item?.image_url
				? [item.image_url]
				: [];
	const fallbackWidth = Dimensions.get("window").width - 40;
	const [galleryWidth, setGalleryWidth] = useState(0);
	const [activeImageIndex, setActiveImageIndex] = useState(0);

	useEffect(() => {
		setActiveImageIndex(0);
	}, [item?.id, imageUrls.length]);

	return (
		<View style={styles.card}>
			<View style={styles.cardHeader}>
				<View style={styles.cardTitleWrap}>
					{icon}
					<Text style={styles.cardTitle}>{title}</Text>
				</View>
			</View>

			{item && imageUrls.length > 0 ? (
				<>
					<View
						style={styles.galleryWrap}
						onLayout={(event) => {
							const nextWidth = Math.round(event.nativeEvent.layout.width);
							if (nextWidth && nextWidth !== galleryWidth) {
								setGalleryWidth(nextWidth);
							}
						}}
					>
						<ScrollView
							horizontal
							pagingEnabled
							showsHorizontalScrollIndicator={false}
							onMomentumScrollEnd={(event) => {
								const width = galleryWidth || fallbackWidth;
								const nextIndex = Math.round(
									event.nativeEvent.contentOffset.x / width,
								);
								setActiveImageIndex(nextIndex);
							}}
						>
							{imageUrls.map((url, index) => (
								<Image
									key={`${item.id}-${index}`}
									source={{ uri: url }}
									style={[
										styles.cardImage,
										{ width: galleryWidth || fallbackWidth },
									]}
									resizeMode="cover"
								/>
							))}
						</ScrollView>

						{imageUrls.length > 1 && (
							<View style={styles.galleryCounter}>
								<Text style={styles.galleryCounterText}>
									{activeImageIndex + 1}/{imageUrls.length}
								</Text>
							</View>
						)}
					</View>

					{imageUrls.length > 1 && (
						<View style={styles.galleryDots}>
							{imageUrls.map((_, index) => (
								<View
									key={`${item.id}-dot-${index}`}
									style={[
										styles.galleryDot,
										index === activeImageIndex && styles.galleryDotActive,
									]}
								/>
							))}
						</View>
					)}

					<Text style={styles.cardDescription}>{item.description}</Text>
				</>
			) : (
				<View style={styles.emptyImageWrap}>
					<Text style={styles.emptyImageText}>{emptyText}</Text>
				</View>
			)}
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
			paddingTop: Math.max(topInset + 12, 36),
			paddingHorizontal: 20,
			paddingBottom: 140,
		},
		headerWrap: {
			marginBottom: 24,
		},
		headerCard: {
			backgroundColor: colors.surface,
			borderRadius: 28,
			borderWidth: 1,
			borderColor: colors.border,
			paddingHorizontal: 22,
			paddingVertical: 24,
			alignItems: "center",
			gap: 12,
			shadowColor: isDark ? "#000000" : "#0F172A",
			shadowOffset: { width: 0, height: 10 },
			shadowOpacity: isDark ? 0.2 : 0.07,
			shadowRadius: 20,
			elevation: 4,
		},
		headerBadge: {
			paddingHorizontal: 12,
			paddingVertical: 6,
			borderRadius: 999,
			backgroundColor: `${colors.primary}18`,
			borderWidth: 1,
			borderColor: `${colors.primary}26`,
		},
		headerBadgeText: {
			fontSize: 12,
			fontWeight: "700",
			letterSpacing: 0.6,
			color: colors.primary,
			textTransform: "uppercase",
		},
		headerTitle: {
			fontSize: 30,
			fontWeight: "800",
			color: colors.text,
		},
		subtitle: {
			fontSize: 15,
			lineHeight: 24,
			color: colors.textSecondary,
			textAlign: "center",
			paddingHorizontal: 8,
		},
		stateWrap: {
			alignItems: "center",
			justifyContent: "center",
			paddingVertical: 48,
			gap: 12,
		},
		stateText: {
			fontSize: 15,
			color: colors.textSecondary,
			textAlign: "center",
		},
		categoryRow: {
			gap: 12,
			paddingBottom: 12,
			paddingRight: 20,
		},
		categoryChip: {
			paddingHorizontal: 16,
			paddingVertical: 10,
			borderRadius: 999,
			backgroundColor: colors.surface,
			borderWidth: 1,
			borderColor: colors.border,
		},
		categoryChipActive: {
			backgroundColor: colors.primary,
			borderColor: colors.primary,
		},
		categoryChipText: {
			fontSize: 14,
			fontWeight: "600",
			color: colors.text,
		},
		categoryChipTextActive: {
			color: "#FFFFFF",
		},
		detailSection: {
			gap: 16,
			marginTop: 12,
		},
		sectionTitle: {
			fontSize: 24,
			fontWeight: "700",
			color: colors.text,
		},
		card: {
			backgroundColor: colors.surface,
			borderRadius: 24,
			borderWidth: 1,
			borderColor: colors.border,
			overflow: "hidden",
			shadowColor: isDark ? "#000000" : "#0F172A",
			shadowOffset: { width: 0, height: 8 },
			shadowOpacity: isDark ? 0.16 : 0.08,
			shadowRadius: 16,
			elevation: 4,
		},
		cardHeader: {
			paddingHorizontal: 18,
			paddingTop: 18,
			paddingBottom: 12,
		},
		cardTitleWrap: {
			flexDirection: "row",
			alignItems: "center",
			gap: 8,
		},
		cardTitle: {
			fontSize: 18,
			fontWeight: "700",
			color: colors.text,
		},
		cardImage: {
			width: "100%",
			height: 220,
			backgroundColor: isDark ? "#111827" : "#E5E7EB",
		},
		galleryWrap: {
			position: "relative",
			width: "100%",
		},
		galleryCounter: {
			position: "absolute",
			right: 14,
			bottom: 14,
			paddingHorizontal: 10,
			paddingVertical: 6,
			borderRadius: 999,
			backgroundColor: "rgba(15, 23, 42, 0.72)",
		},
		galleryCounterText: {
			fontSize: 12,
			fontWeight: "700",
			color: "#FFFFFF",
		},
		galleryDots: {
			flexDirection: "row",
			alignItems: "center",
			justifyContent: "center",
			gap: 8,
			paddingTop: 14,
			paddingHorizontal: 18,
		},
		galleryDot: {
			width: 8,
			height: 8,
			borderRadius: 999,
			backgroundColor: colors.border,
		},
		galleryDotActive: {
			width: 22,
			backgroundColor: colors.primary,
		},
		cardDescription: {
			paddingHorizontal: 18,
			paddingVertical: 16,
			fontSize: 14,
			lineHeight: 22,
			color: colors.textSecondary,
		},
		emptyImageWrap: {
			height: 160,
			marginHorizontal: 18,
			marginBottom: 18,
			borderRadius: 18,
			borderWidth: 1,
			borderColor: colors.border,
			backgroundColor: colors.background,
			justifyContent: "center",
			alignItems: "center",
			paddingHorizontal: 20,
		},
		emptyImageText: {
			fontSize: 14,
			color: colors.textSecondary,
			textAlign: "center",
		},
	});
