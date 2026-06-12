import React, { useEffect, useRef, useState } from "react";
import {
	View,
	StyleSheet,
	Dimensions,
	Image,
	FlatList,
	ActivityIndicator,
	Pressable,
} from "react-native";
import { Text, Button } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { useAuthStore } from "@/stores/authStore";
import Animated, { FadeInUp, FadeInDown } from "react-native-reanimated";
import { Star, ChevronLeft, ChevronRight } from "lucide-react-native";
import { api } from "@/services/api";

const { width } = Dimensions.get("window");

interface Review {
	id: string;
	authorName: string;
	image: string;
	rating: number;
	content: string;
	badge?: string;
}

export default function ReviewsScreen() {
	const router = useRouter();
	const { user, setUser } = useAuthStore();
	const [reviews, setReviews] = useState<Review[]>([]);
	const [loading, setLoading] = useState(true);
	const [currentIndex, setCurrentIndex] = useState(0);
	const listRef = useRef<FlatList<Review>>(null);

	useEffect(() => {
		fetchReviews();
	}, []);

	const fetchReviews = async () => {
		try {
			const data = await api.get("/reviews");
			setReviews(data);
		} catch (err) {
			console.error("Failed to fetch reviews:", err);
			// Fallback mock data if API fails
			setReviews([
				{
					id: "1",
					authorName: "Khách hàng",
					image:
						"https://images.unsplash.com/photo-1594824476967-48c8b964273f?q=80&w=1080",
					rating: 5,
					content:
						"Điều tôi yêu thích nhất về ứng dụng là nó khiến bạn cảm thấy tuyệt vời về bản thân và 100% có thể tùy chỉnh với RẤT NHIỀU bài tập miễn phí, theo dõi bài tập, kế hoạch ăn uống, và hơn thế nữa!",
					badge: "-13kg",
				},
				{
					id: "2",
					authorName: "Minh Tuấn",
					image:
						"https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=1080",
					rating: 5,
					content:
						"Tôi từng bị đau lưng kinh niên do ngồi văn phòng quá lâu. Sau 2 tuần tập luyện theo lộ trình cá nhân hóa của TheraHome, cơn đau đã giảm đáng kể. Cảm ơn đội ngũ rất nhiều!",
					badge: "Giảm 80% đau",
				},
				{
					id: "3",
					authorName: "Hồng Hạnh",
					image:
						"https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=1080",
					rating: 4,
					content:
						"Ứng dụng rất dễ sử dụng, giao diện đẹp. Các bài tập được hướng dẫn chi tiết và phù hợp với sức khỏe của mình. Rất hài lòng với lộ trình hiện tại.",
					badge: "Sống khỏe",
				},
			]);
		} finally {
			setLoading(false);
		}
	};

	const handleNext = async () => {
		await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
		router.replace("/(auth)/best-version");
	};

	const scrollToReview = async (nextIndex: number) => {
		if (nextIndex < 0 || nextIndex >= reviews.length) return;
		await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
		listRef.current?.scrollToIndex({ index: nextIndex, animated: true });
		setCurrentIndex(nextIndex);
	};

	const renderReview = ({ item }: { item: Review }) => (
		<View style={styles.cardContainer}>
			<View style={styles.card}>
				<View style={styles.imageContainer}>
					<Image source={{ uri: item.image }} style={styles.image} />
					{item.badge && (
						<View style={styles.badge}>
							<Text style={styles.badgeText}>↓ {item.badge}</Text>
						</View>
					)}
				</View>

				<View style={styles.starsContainer}>
					{[1, 2, 3, 4, 5].map((star) => (
						<Star
							key={star}
							size={24}
							fill={star <= item.rating ? "#FBBF24" : "none"}
							color="#FBBF24"
							style={styles.star}
						/>
					))}
				</View>

				<Text style={styles.reviewText}>{item.content}</Text>
			</View>
		</View>
	);

	return (
		<SafeAreaView style={styles.container}>
			<View style={styles.content}>
				<Animated.View entering={FadeInUp.duration(600).springify()}>
					<Text style={styles.title}>
						Những câu chuyện thành{"\n"}công giúp bạn tạo thêm{"\n"}động lực
					</Text>
				</Animated.View>

				<View style={styles.reviewsListContainer}>
					{loading ? (
						<ActivityIndicator size="large" color="#3B82F6" />
					) : (
						<>
							<FlatList
								ref={listRef}
								data={reviews}
								renderItem={renderReview}
								keyExtractor={(item) => item.id}
								horizontal
								pagingEnabled
								showsHorizontalScrollIndicator={false}
								onScroll={(e) => {
									const x = e.nativeEvent.contentOffset.x;
									setCurrentIndex(Math.round(x / width));
								}}
								scrollEventThrottle={16}
							/>

							<View style={styles.navigationRow}>
								<Pressable
									onPress={() => void scrollToReview(currentIndex - 1)}
									disabled={currentIndex === 0}
									style={[
										styles.arrowButton,
										currentIndex === 0 && styles.arrowButtonDisabled,
									]}
								>
									<ChevronLeft
										size={22}
										color={currentIndex === 0 ? "#9CA3AF" : "#111827"}
									/>
								</Pressable>

								<View style={styles.dotsContainer}>
									{reviews.map((_, i) => (
										<View
											key={i}
											style={[
												styles.dot,
												currentIndex === i && styles.activeDot,
											]}
										/>
									))}
								</View>

								<Pressable
									onPress={() => void scrollToReview(currentIndex + 1)}
									disabled={currentIndex === reviews.length - 1}
									style={[
										styles.arrowButton,
										currentIndex === reviews.length - 1 &&
											styles.arrowButtonDisabled,
									]}
								>
									<ChevronRight
										size={22}
										color={
											currentIndex === reviews.length - 1
												? "#9CA3AF"
												: "#111827"
										}
									/>
								</Pressable>
							</View>
						</>
					)}
				</View>

				<Animated.View
					entering={FadeInDown.delay(500).duration(600)}
					style={styles.footer}
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
						TIẾP TỤC
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
		paddingTop: 40,
	},
	title: {
		fontSize: 26,
		fontWeight: "bold",
		color: "#000000",
		textAlign: "center",
		lineHeight: 34,
		marginBottom: 15,
		paddingHorizontal: 20,
	},
	reviewsListContainer: {
		flex: 1,
		justifyContent: "center",
	},
	cardContainer: {
		width: width,
		alignItems: "center",
		paddingHorizontal: 30,
	},
	card: {
		backgroundColor: "#FFFFFF",
		borderRadius: 25,
		padding: 20,
		width: "100%",
		alignItems: "center",
		// Shadow
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 10 },
		shadowOpacity: 0.1,
		shadowRadius: 20,
		elevation: 8,
		borderWidth: 1,
		borderColor: "#F3F4F6",
	},
	imageContainer: {
		width: "100%",
		aspectRatio: 1,
		borderRadius: 20,
		overflow: "hidden",
		position: "relative",
		marginBottom: 20,
	},
	image: {
		width: "100%",
		height: "100%",
	},
	badge: {
		position: "absolute",
		top: 15,
		right: 15,
		backgroundColor: "#10B981",
		paddingHorizontal: 12,
		paddingVertical: 6,
		borderRadius: 15,
	},
	badgeText: {
		color: "#FFFFFF",
		fontWeight: "bold",
		fontSize: 14,
	},
	starsContainer: {
		flexDirection: "row",
		marginBottom: 15,
	},
	star: {
		marginHorizontal: 2,
	},
	reviewText: {
		fontSize: 16,
		color: "#333",
		textAlign: "center",
		lineHeight: 24,
	},
	navigationRow: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		marginTop: 20,
		gap: 14,
	},
	dotsContainer: {
		flexDirection: "row",
		justifyContent: "center",
		alignItems: "center",
	},
	dot: {
		width: 8,
		height: 8,
		borderRadius: 4,
		backgroundColor: "#E5E7EB",
		marginHorizontal: 4,
	},
	activeDot: {
		backgroundColor: "#10B981",
		width: 24,
	},
	arrowButton: {
		width: 42,
		height: 42,
		borderRadius: 21,
		backgroundColor: "#FFFFFF",
		borderWidth: 1,
		borderColor: "#E5E7EB",
		alignItems: "center",
		justifyContent: "center",
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.08,
		shadowRadius: 10,
		elevation: 3,
	},
	arrowButtonDisabled: {
		opacity: 0.55,
	},
	footer: {
		paddingHorizontal: 40,
		marginBottom: 20,
		marginTop: 8,
		alignItems: "center",
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
