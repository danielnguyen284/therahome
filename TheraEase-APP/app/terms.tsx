import React from "react";
import { ScrollView, StyleSheet } from "react-native";
import { Text, Appbar } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { colors } from "@/utils/theme";

export default function TermsScreen() {
	const router = useRouter();

	return (
		<SafeAreaView style={styles.container} edges={[]}>
			<Appbar.Header style={styles.header}>
				<Appbar.BackAction onPress={() => router.back()} />
				<Appbar.Content title="Điều khoản sử dụng" />
			</Appbar.Header>

			<ScrollView
				style={styles.content}
				contentContainerStyle={styles.contentContainer}
			>
				<Text style={styles.title}>Điều khoản sử dụng TheraHome</Text>
				<Text style={styles.date}>
					Cập nhật lần cuối: {new Date().toLocaleDateString("vi-VN")}
				</Text>

				<Text style={styles.sectionTitle}>1. Chấp nhận điều khoản</Text>
				<Text style={styles.paragraph}>
					Bằng việc tải xuống, cài đặt và sử dụng ứng dụng TheraHome, bạn đồng ý
					tuân thủ và bị ràng buộc bởi các điều khoản và điều kiện sau đây. Nếu
					bạn không đồng ý với bất kỳ phần nào của các điều khoản này, vui lòng
					không sử dụng ứng dụng.
				</Text>

				<Text style={styles.sectionTitle}>2. Mục đích sử dụng</Text>
				<Text style={styles.paragraph}>
					TheraHome là ứng dụng hỗ trợ giảm đau cổ và lưng thông qua các bài tập
					vật lý cải thiện với AI. Ứng dụng KHÔNG thay thế cho việc khám và điều
					trị y tế chuyên nghiệp.
				</Text>

				<Text style={styles.sectionTitle}>3. Trách nhiệm người dùng</Text>
				<Text style={styles.paragraph}>
					• Bạn cam kết cung cấp thông tin chính xác về tình trạng sức khỏe của
					mình{"\n"}• Bạn hiểu rằng các bài tập chỉ mang tính chất tham khảo
					{"\n"}• Bạn nên tham khảo ý kiến bác sĩ trước khi thực hiện bất kỳ bài
					tập nào{"\n"}• Nếu có lịch sử phẫu thuật dưới 6 tháng, BẮT BUỘC phải
					hỏi ý kiến bác sĩ{"\n"}• Ngừng tập ngay nếu cảm thấy đau hoặc khó chịu
				</Text>

				<Text style={styles.sectionTitle}>4. Giới hạn trách nhiệm</Text>
				<Text style={styles.paragraph}>
					TheraHome và các nhà phát triển KHÔNG chịu trách nhiệm về:{"\n"}• Bất
					kỳ chấn thương hoặc tổn hại nào phát sinh từ việc sử dụng ứng dụng
					{"\n"}• Kết quả điều trị hoặc hiệu quả của các bài tập{"\n"}• Bất kỳ
					quyết định y tế nào dựa trên thông tin từ ứng dụng
				</Text>

				<Text style={styles.sectionTitle}>5. Quyền sở hữu trí tuệ</Text>
				<Text style={styles.paragraph}>
					Tất cả nội dung, thiết kế, logo, và tài liệu trong ứng dụng thuộc
					quyền sở hữu của TheraHome Vietnam. Bạn không được sao chép, phân phối
					hoặc sử dụng cho mục đích thương mại mà không có sự cho phép bằng văn
					bản.
				</Text>

				<Text style={styles.sectionTitle}>6. Thu thập và sử dụng dữ liệu</Text>
				<Text style={styles.paragraph}>
					Chúng tôi thu thập và xử lý dữ liệu cá nhân của bạn theo Chính sách
					bảo mật. Vui lòng đọc Chính sách bảo mật để hiểu rõ hơn về cách chúng
					tôi xử lý dữ liệu.
				</Text>

				<Text style={styles.sectionTitle}>7. Thay đổi điều khoản</Text>
				<Text style={styles.paragraph}>
					Chúng tôi có quyền thay đổi các điều khoản này bất kỳ lúc nào. Các
					thay đổi sẽ có hiệu lực ngay khi được đăng tải trong ứng dụng. Việc
					bạn tiếp tục sử dụng ứng dụng sau khi có thay đổi đồng nghĩa với việc
					bạn chấp nhận các điều khoản mới.
				</Text>

				<Text style={styles.sectionTitle}>8. Chấm dứt sử dụng</Text>
				<Text style={styles.paragraph}>
					Chúng tôi có quyền chấm dứt hoặc tạm ngừng quyền truy cập của bạn vào
					ứng dụng nếu bạn vi phạm các điều khoản này.
				</Text>

				<Text style={styles.sectionTitle}>9. Liên hệ</Text>
				<Text style={styles.paragraph}>
					Nếu bạn có bất kỳ câu hỏi nào về Điều khoản sử dụng, vui lòng liên hệ:
					{"\n"}
					Email: Bacsilong1974@gmail.com{"\n"}
					Điện thoại: 0364.263.552{"\n"}
					Địa chỉ: 234 Phạm Văn Đồng, Hà Nội{"\n"}
					Website: https://therahome.vn
				</Text>

				<Text style={styles.footer}>
					Bằng việc sử dụng TheraHome, bạn xác nhận rằng bạn đã đọc, hiểu và
					đồng ý với các Điều khoản sử dụng này.
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
		marginBottom: 24,
	},
	sectionTitle: {
		fontSize: 18,
		fontWeight: "bold",
		color: colors.primary,
		marginTop: 20,
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
