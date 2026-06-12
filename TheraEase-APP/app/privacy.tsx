import React from "react";
import { ScrollView, StyleSheet } from "react-native";
import { Text, Appbar } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { colors } from "@/utils/theme";

export default function PrivacyScreen() {
	const router = useRouter();

	return (
		<SafeAreaView style={styles.container} edges={[]}>
			<Appbar.Header style={styles.header}>
				<Appbar.BackAction onPress={() => router.back()} />
				<Appbar.Content title="Chính sách bảo mật" />
			</Appbar.Header>

			<ScrollView
				style={styles.content}
				contentContainerStyle={styles.contentContainer}
			>
				<Text style={styles.title}>Chính sách bảo mật TheraHome</Text>
				<Text style={styles.date}>
					Cập nhật lần cuối: {new Date().toLocaleDateString("vi-VN")}
				</Text>

				<Text style={styles.intro}>
					TheraHome cam kết bảo vệ quyền riêng tư và dữ liệu cá nhân của bạn.
					Chính sách này giải thích cách chúng tôi thu thập, sử dụng và bảo vệ
					thông tin của bạn.
				</Text>

				<Text style={styles.sectionTitle}>1. Thông tin chúng tôi thu thập</Text>

				<Text style={styles.subTitle}>1.1. Thông tin cá nhân</Text>
				<Text style={styles.paragraph}>
					• Họ tên{"\n"}• Tuổi{"\n"}• Nghề nghiệp{"\n"}• Email (nếu đăng nhập
					bằng Google)
				</Text>

				<Text style={styles.subTitle}>1.2. Thông tin sức khỏe</Text>
				<Text style={styles.paragraph}>
					• Vị trí đau (cổ, lưng){"\n"}• Triệu chứng cụ thể{"\n"}• Lịch sử phẫu
					thuật{"\n"}• Mức độ đau hàng ngày{"\n"}• Lịch sử cải thiện
				</Text>

				<Text style={styles.subTitle}>1.3. Dữ liệu sử dụng</Text>
				<Text style={styles.paragraph}>
					• Thời gian sử dụng ứng dụng{"\n"}• Các bài tập đã thực hiện{"\n"}•
					Phản hồi về bài tập{"\n"}• Thời gian cải thiện ưa thích
				</Text>

				<Text style={styles.sectionTitle}>
					2. Cách chúng tôi sử dụng thông tin
				</Text>
				<Text style={styles.paragraph}>
					• Cá nhân hóa chương trình cải thiện phù hợp với tình trạng của bạn
					{"\n"}• Theo dõi tiến độ và hiệu quả điều trị{"\n"}• Gửi nhắc nhở cải
					thiện (nếu bạn cho phép){"\n"}• Cải thiện và phát triển ứng dụng{"\n"}•
					Phân tích xu hướng sử dụng (dữ liệu ẩn danh){"\n"}• Hỗ trợ khách hàng
				</Text>

				<Text style={styles.sectionTitle}>3. Chia sẻ thông tin</Text>
				<Text style={styles.paragraph}>
					Chúng tôi KHÔNG bán, cho thuê hoặc chia sẻ thông tin cá nhân của bạn
					với bên thứ ba, ngoại trừ các trường hợp sau:
				</Text>
				<Text style={styles.paragraph}>
					• Với sự đồng ý của bạn{"\n"}• Để tuân thủ pháp luật hoặc yêu cầu của
					cơ quan có thẩm quyền{"\n"}• Với các nhà cung cấp dịch vụ đám mây để
					vận hành ứng dụng{"\n"}• Trong trường hợp khẩn cấp để bảo vệ sức khỏe
					và an toàn
				</Text>

				<Text style={styles.sectionTitle}>4. Bảo mật dữ liệu</Text>
				<Text style={styles.paragraph}>
					Chúng tôi áp dụng các biện pháp bảo mật kỹ thuật và tổ chức phù hợp:
					{"\n"}• Mã hóa dữ liệu khi truyền tải (SSL/TLS){"\n"}• Lưu trữ dữ liệu
					trên hệ thống đám mây bảo mật cao{"\n"}• Xác thực người dùng qua
					Google OAuth{"\n"}• Kiểm soát truy cập nghiêm ngặt{"\n"}• Sao lưu dữ
					liệu định kỳ
				</Text>

				<Text style={styles.sectionTitle}>5. Quyền của bạn</Text>
				<Text style={styles.paragraph}>
					Bạn có quyền:{"\n"}• Truy cập và xem dữ liệu cá nhân của mình{"\n"}•
					Chỉnh sửa hoặc cập nhật thông tin{"\n"}• Xóa tài khoản và dữ liệu
					{"\n"}• Xuất dữ liệu của bạn{"\n"}• Từ chối nhận thông báo{"\n"}• Rút
					lại sự đồng ý bất kỳ lúc nào
				</Text>

				<Text style={styles.sectionTitle}>6. Lưu trữ dữ liệu</Text>
				<Text style={styles.paragraph}>
					• Dữ liệu được lưu trữ trên hệ thống đám mây bảo mật tại khu vực Châu
					Á{"\n"}• Chúng tôi lưu giữ dữ liệu của bạn miễn là tài khoản còn hoạt
					động{"\n"}• Sau khi xóa tài khoản, dữ liệu sẽ bị xóa vĩnh viễn trong
					vòng 30 ngày{"\n"}• Một số dữ liệu ẩn danh có thể được giữ lại cho mục
					đích phân tích
				</Text>

				<Text style={styles.sectionTitle}>7. Cookie và công nghệ theo dõi</Text>
				<Text style={styles.paragraph}>
					Ứng dụng sử dụng công nghệ lưu trữ cục bộ để:{"\n"}• Duy trì phiên
					đăng nhập{"\n"}• Lưu trữ tùy chọn của bạn{"\n"}• Cải thiện hiệu suất
					ứng dụng
				</Text>

				<Text style={styles.sectionTitle}>8. Quyền riêng tư của trẻ em</Text>
				<Text style={styles.paragraph}>
					Ứng dụng không dành cho người dưới 16 tuổi. Chúng tôi không cố ý thu
					thập thông tin từ trẻ em. Nếu bạn là phụ huynh và phát hiện con bạn đã
					cung cấp thông tin, vui lòng liên hệ để chúng tôi xóa dữ liệu.
				</Text>

				<Text style={styles.sectionTitle}>9. Thay đổi chính sách</Text>
				<Text style={styles.paragraph}>
					Chúng tôi có thể cập nhật Chính sách bảo mật này theo thời gian. Chúng
					tôi sẽ thông báo cho bạn về các thay đổi quan trọng qua email hoặc
					thông báo trong ứng dụng.
				</Text>

				<Text style={styles.sectionTitle}>10. Liên hệ</Text>
				<Text style={styles.paragraph}>
					Nếu bạn có câu hỏi về Chính sách bảo mật hoặc muốn thực hiện quyền của
					mình:{"\n\n"}
					Email: Bacsilong1974@gmail.com{"\n"}
					Điện thoại: 0364.263.552{"\n"}
					Địa chỉ: 234 Phạm Văn Đồng, Thành phố Hà Nội{"\n"}
					Website: https://therahome.vn
				</Text>

				<Text style={styles.footer}>
					Bằng việc sử dụng TheraHome, bạn xác nhận rằng bạn đã đọc và hiểu
					Chính sách bảo mật này và đồng ý với việc thu thập và sử dụng thông
					tin như được mô tả.
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
	subTitle: {
		fontSize: 16,
		fontWeight: "600",
		color: colors.text,
		marginTop: 12,
		marginBottom: 8,
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
