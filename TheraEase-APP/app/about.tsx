import React from "react";
import { ScrollView, StyleSheet } from "react-native";
import { Text, Appbar } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { colors } from "@/utils/theme";

export default function AboutScreen() {
	const router = useRouter();

	return (
		<SafeAreaView style={styles.container} edges={[]}>
			<Appbar.Header style={styles.header}>
				<Appbar.BackAction onPress={() => router.back()} />
				<Appbar.Content title="Giới thiệu" />
			</Appbar.Header>

			<ScrollView
				style={styles.content}
				contentContainerStyle={styles.contentContainer}
			>
				<Text style={styles.title}>Về TheraHome</Text>
				<Text style={styles.date}>Phiên bản 1.0.0</Text>

				<Text style={styles.intro}>
					TheraHome là ứng dụng chăm sóc sức khỏe cột sống thông minh, được
					thiết kế để giúp bạn quản lý và cải thiện tình trạng đau cổ, đau lưng
					một cách hiệu quả.
				</Text>

				<Text style={styles.sectionTitle}>Tính năng chính</Text>
				<Text style={styles.paragraph}>
					• Theo dõi mức độ đau hàng ngày{"\n"}• Bài tập vật lý cải thiện được cá
					nhân hóa{"\n"}• Gợi ý thông minh dựa trên triệu chứng{"\n"}• Nhắc nhở
					cải thiện đều đặn{"\n"}• Trợ lý AI hỗ trợ 24/7
				</Text>

				<Text style={styles.sectionTitle}>Sứ mệnh</Text>
				<Text style={styles.paragraph}>
					Chúng tôi cam kết mang đến giải pháp chăm sóc sức khỏe cột sống toàn
					diện, giúp người dùng giảm đau và cải thiện chất lượng cuộc sống.
				</Text>

				<Text style={styles.sectionTitle}>Liên hệ</Text>
				<Text style={styles.paragraph}>
					Nếu bạn có câu hỏi hoặc cần hỗ trợ, vui lòng liên hệ:{"\n\n"}
					Email: Bacsilong1974@gmail.com{"\n"}
					Điện thoại: 0364.263.552{"\n"}
					Địa chỉ: 234 Phạm Văn Đồng, Hà Nội{"\n"}
					Website: https://therahome.vn
				</Text>

				<Text style={styles.footer}>
					Cảm ơn bạn đã tin tưởng và sử dụng TheraHome. Chúng tôi luôn nỗ lực để
					mang đến trải nghiệm tốt nhất cho sức khỏe cột sống của bạn.
				</Text>
			</ScrollView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: colors.background,
		paddingTop: 0,
	},
	header: {
		backgroundColor: colors.background,
		elevation: 0,
	},
	content: {
		flex: 1,
	},
	contentContainer: {
		padding: 20,
		paddingBottom: 40,
	},
	title: {
		fontSize: 24,
		fontWeight: "bold",
		color: colors.text,
		marginBottom: 8,
	},
	date: {
		fontSize: 14,
		color: colors.textSecondary,
		marginBottom: 16,
	},
	intro: {
		fontSize: 15,
		color: colors.text,
		lineHeight: 24,
		marginBottom: 20,
		padding: 16,
		backgroundColor: colors.primary + "10",
		borderRadius: 12,
	},
	sectionTitle: {
		fontSize: 18,
		fontWeight: "bold",
		color: colors.primary,
		marginTop: 24,
		marginBottom: 12,
	},
	paragraph: {
		fontSize: 15,
		color: colors.text,
		lineHeight: 24,
		marginBottom: 12,
	},
	footer: {
		fontSize: 14,
		color: colors.textSecondary,
		fontStyle: "italic",
		marginTop: 24,
		padding: 16,
		backgroundColor: colors.primary + "10",
		borderRadius: 12,
	},
});
