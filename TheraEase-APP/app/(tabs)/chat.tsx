import React, { useState, useRef, useEffect } from "react";
import {
	View,
	StyleSheet,
	ScrollView,
	KeyboardAvoidingView,
	Platform,
	Dimensions,
	TouchableOpacity,
} from "react-native";
import {
	Text,
	TextInput,
	IconButton,
	ActivityIndicator,
} from "react-native-paper";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { Send, Bot, User as UserIcon, Sparkles } from "lucide-react-native";
import { useAuthStore } from "@/stores/authStore";
import { chatWithAssistant } from "@/services/groq";
import { api } from "@/services/api";
import { colors } from "@/utils/theme";
import Animated, {
	FadeInDown,
	FadeInUp,
	SlideInRight,
} from "react-native-reanimated";

const { width } = Dimensions.get("window");

interface Message {
	id: string;
	role: "user" | "assistant";
	content: string;
	created_at: string;
}

const SUGGESTIONS = [
	"Tôi đang đau mỏi cổ- vai",
	"Tôi đau lan tê cả tay",
	"Tôi cảm thấy đau đầu",
	"Hướng dẫn tôi sử dụng TheraNECK"
];

export default function ChatScreen() {
	const { user } = useAuthStore();
	const [messages, setMessages] = useState<Message[]>([]);
	const [inputText, setInputText] = useState("");
	const [loading, setLoading] = useState(false);
	const scrollViewRef = useRef<ScrollView>(null);

	useEffect(() => {
		loadChatHistory();
	}, [user]);

	const loadChatHistory = async () => {
		if (!user) return;

		try {
			const data = await api.get("/chat-history");
			if (data) setMessages(data);
		} catch (error) {
			console.error("Load chat history error:", error);
		}
	};

	const saveChatMessage = async (
		role: "user" | "assistant",
		content: string,
	) => {
		if (!user) return;

		try {
			const data = await api.post("/chat-history", {
				role,
				message: content,
			});

			return data;
		} catch (error) {
			console.error("Save chat message error:", error);
		}
	};

	const handleSend = async () => {
		if (!inputText.trim() || !user) return;

		const userMessage = inputText.trim();
		setInputText("");
		setLoading(true);

		try {
			// Add user message
			const userMsg = await saveChatMessage("user", userMessage);
			if (userMsg) {
				setMessages((prev) => [...prev, userMsg]);
			}

			// Get AI response with full context
			const chatHistory = messages.map((msg) => ({
				role: msg.role,
				content: msg.content,
			}));

			const aiResponse = await chatWithAssistant(userMessage, chatHistory);

			// Add AI message
			const aiMsg = await saveChatMessage("assistant", aiResponse);
			if (aiMsg) {
				setMessages((prev) => [...prev, aiMsg]);
			}

			// Scroll to bottom
			setTimeout(() => {
				scrollViewRef.current?.scrollToEnd({ animated: true });
			}, 100);
		} catch (error) {
			console.error("Send message error:", error);
		} finally {
			setLoading(false);
		}
	};

	const renderMessage = (message: Message, index: number) => {
		const isUser = message.role === "user";

		return (
			<Animated.View
				key={message.id}
				entering={SlideInRight.delay(index * 50).springify()}
				style={[
					styles.messageRow,
					isUser ? styles.userMessageRow : styles.aiMessageRow,
				]}
			>
				{!isUser && (
					<View style={styles.avatarContainer}>
						<LinearGradient
							colors={["#5B9BD5", "#4A7FB8"]}
							style={styles.avatar}
						>
							<Bot size={20} color="#FFFFFF" />
						</LinearGradient>
					</View>
				)}

				<LinearGradient
					colors={isUser ? ["#5B9BD5", "#4A7FB8"] : ["#FFFFFF", "#F9FAFB"]}
					start={{ x: 0, y: 0 }}
					end={{ x: 1, y: 1 }}
					style={[
						styles.messageContainer,
						isUser ? styles.userMessage : styles.aiMessage,
					]}
				>
					<Text
						style={[
							styles.messageText,
							isUser ? styles.userMessageText : styles.aiMessageText,
						]}
					>
						{message.content}
					</Text>
				</LinearGradient>

				{isUser && (
					<View style={styles.avatarContainer}>
						<LinearGradient
							colors={["#10B981", "#059669"]}
							style={styles.avatar}
						>
							<UserIcon size={20} color="#FFFFFF" />
						</LinearGradient>
					</View>
				)}
			</Animated.View>
		);
	};

	return (
		<LinearGradient
			colors={["#EFF6FF", "#FFFFFF", "#F9FAFB"]}
			style={styles.container}
		>
			<SafeAreaView style={styles.safeArea} edges={["top"]}>
				<KeyboardAvoidingView
					style={styles.keyboardView}
					behavior={Platform.OS === "ios" ? "padding" : undefined}
					keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
				>
					{/* Header */}
					<Animated.View
						entering={FadeInDown.duration(400)}
						style={styles.header}
					>
						<View style={styles.titleRow}>
							<Bot size={32} color={colors.primary} />
							<View style={styles.titleContainer}>
								<Text style={styles.title}>Trợ lý AI</Text>
								<Text style={styles.subtitle}>
									Hỏi tôi về tình trạng đau và bài tập
								</Text>
							</View>
						</View>
					</Animated.View>

					{/* Messages */}
					<ScrollView
						ref={scrollViewRef}
						style={styles.messagesContainer}
						contentContainerStyle={styles.messagesContent}
						onContentSizeChange={() =>
							scrollViewRef.current?.scrollToEnd({ animated: true })
						}
						showsVerticalScrollIndicator={false}
					>
						{messages.length === 0 ? (
							<Animated.View
								entering={FadeInUp.duration(600)}
								style={styles.emptyContainer}
							>
								<LinearGradient
									colors={["#5B9BD5", "#4A7FB8"]}
									style={styles.emptyIcon}
								>
									<Sparkles size={48} color="#FFFFFF" />
								</LinearGradient>
								<Text style={styles.emptyTitle}>Xin chào! 👋</Text>
								<Text style={styles.emptyText}>
									Ông chủ đang khó chịu ở đâu? Tôi có thể giúp gì không?
								</Text>
								
								<View style={styles.suggestionsWrapper}>
									{SUGGESTIONS.map((suggestion, index) => (
										<TouchableOpacity 
											key={index}
											style={styles.suggestionChip}
											onPress={() => setInputText(suggestion)}
											activeOpacity={0.7}
										>
											<Text style={styles.suggestionText}>{suggestion}</Text>
										</TouchableOpacity>
									))}
								</View>
							</Animated.View>
						) : (
							messages.map((msg, idx) => renderMessage(msg, idx))
						)}

						{loading && (
							<Animated.View entering={FadeInUp} style={styles.loadingRow}>
								<View style={styles.avatarContainer}>
									<LinearGradient
										colors={["#5B9BD5", "#4A7FB8"]}
										style={styles.avatar}
									>
										<Bot size={20} color="#FFFFFF" />
									</LinearGradient>
								</View>
								<View style={styles.loadingMessage}>
									<ActivityIndicator size="small" color={colors.primary} />
									<Text style={styles.loadingText}>Đang suy nghĩ...</Text>
								</View>
							</Animated.View>
						)}
					</ScrollView>

					{/* Input */}
					<Animated.View
						entering={FadeInUp.duration(400)}
						style={styles.inputContainer}
					>
						<View style={styles.inputWrapper}>
							<TextInput
								value={inputText}
								onChangeText={setInputText}
								placeholder="Nhập tin nhắn..."
								mode="outlined"
								style={styles.input}
								multiline
								maxLength={500}
								disabled={loading}
								outlineColor="transparent"
								activeOutlineColor={colors.primary}
								placeholderTextColor="#9CA3AF"
								textColor={colors.text}
							/>
							<TouchableOpacity
								onPress={() => {
									Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
									handleSend();
								}}
								disabled={!inputText.trim() || loading}
								activeOpacity={0.7}
								style={[
									styles.sendButton,
									(!inputText.trim() || loading) && styles.sendButtonDisabled,
								]}
							>
								<LinearGradient
									colors={
										!inputText.trim() || loading
											? ["#E5E7EB", "#D1D5DB"]
											: ["#5B9BD5", "#4A7FB8"]
									}
									style={styles.sendButtonGradient}
								>
									<Send size={20} color="#FFFFFF" fill="#FFFFFF" />
								</LinearGradient>
							</TouchableOpacity>
						</View>
					</Animated.View>
				</KeyboardAvoidingView>
			</SafeAreaView>
		</LinearGradient>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	safeArea: {
		flex: 1,
	},
	keyboardView: {
		flex: 1,
	},
	header: {
		padding: width * 0.04,
		paddingTop: 16,
		backgroundColor: "transparent",
	},
	titleRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 12,
	},
	titleContainer: {
		flex: 1,
	},
	title: {
		fontSize: 28,
		fontWeight: "bold",
		color: colors.text,
	},
	subtitle: {
		fontSize: 14,
		color: colors.textSecondary,
		marginTop: 2,
	},
	messagesContainer: {
		flex: 1,
	},
	messagesContent: {
		padding: width * 0.04,
		paddingBottom: 20,
	},
	emptyContainer: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		paddingVertical: 80,
	},
	emptyIcon: {
		width: 96,
		height: 96,
		borderRadius: 48,
		justifyContent: "center",
		alignItems: "center",
		marginBottom: 24,
		shadowColor: colors.primary,
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.3,
		shadowRadius: 12,
		elevation: 8,
	},
	emptyTitle: {
		fontSize: 24,
		fontWeight: "bold",
		color: colors.text,
		marginBottom: 12,
	},
	emptyText: {
		fontSize: 16,
		color: colors.textSecondary,
		textAlign: "center",
		lineHeight: 24,
		paddingHorizontal: 32,
	},
	suggestionsWrapper: {
		marginTop: 32,
		width: '100%',
		gap: 12,
		paddingHorizontal: 20,
	},
	suggestionChip: {
		backgroundColor: '#FFFFFF',
		paddingVertical: 12,
		paddingHorizontal: 16,
		borderRadius: 16,
		borderWidth: 1,
		borderColor: '#E5E7EB',
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.05,
		shadowRadius: 4,
		elevation: 2,
		alignItems: 'center',
	},
	suggestionText: {
		fontSize: 15,
		color: '#4B5563',
		fontWeight: '500',
		textAlign: 'center',
	},
	messageRow: {
		flexDirection: "row",
		alignItems: "flex-end",
		marginBottom: 16,
		gap: 8,
	},
	userMessageRow: {
		justifyContent: "flex-end",
	},
	aiMessageRow: {
		justifyContent: "flex-start",
	},
	avatarContainer: {
		marginBottom: 4,
	},
	avatar: {
		width: 36,
		height: 36,
		borderRadius: 18,
		justifyContent: "center",
		alignItems: "center",
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 3,
	},
	messageContainer: {
		maxWidth: "75%",
		padding: 14,
		borderRadius: 20,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 8,
		elevation: 3,
	},
	userMessage: {
		borderBottomRightRadius: 4,
	},
	aiMessage: {
		borderBottomLeftRadius: 4,
		borderWidth: 1,
		borderColor: "rgba(91, 155, 213, 0.1)",
	},
	messageText: {
		fontSize: 15,
		lineHeight: 22,
	},
	userMessageText: {
		color: "#FFFFFF",
		fontWeight: "500",
	},
	aiMessageText: {
		color: colors.text,
	},
	loadingRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
		marginBottom: 16,
	},
	loadingMessage: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
		backgroundColor: colors.surface,
		padding: 14,
		borderRadius: 20,
		borderBottomLeftRadius: 4,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 8,
		elevation: 3,
	},
	loadingText: {
		fontSize: 14,
		color: colors.textSecondary,
		fontStyle: "italic",
	},
	inputContainer: {
		padding: width * 0.04,
		paddingBottom: 100,
		backgroundColor: "transparent",
	},
	inputWrapper: {
		flexDirection: "row",
		alignItems: "flex-end",
		backgroundColor: colors.surface,
		borderRadius: 24,
		paddingRight: 4,
		shadowColor: colors.primary,
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 8,
		elevation: 4,
	},
	input: {
		flex: 1,
		backgroundColor: "transparent",
		maxHeight: 100,
	},
	sendButton: {
		marginBottom: 4,
		marginRight: 4,
	},
	sendButtonDisabled: {
		opacity: 0.5,
	},
	sendButtonGradient: {
		width: 44,
		height: 44,
		borderRadius: 22,
		justifyContent: "center",
		alignItems: "center",
	},
});
