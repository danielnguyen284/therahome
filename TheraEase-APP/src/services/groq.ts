import { api } from "./api";

const GROQ_API_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY;

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

// Get system prompt from backend
async function getSystemPrompt(promptType: string): Promise<{
	system_prompt: string;
	model: string;
	temperature: number;
	max_tokens: number;
}> {
	try {
		const prompts = await api.get(`/ai-prompts?prompt_type=${promptType}`);
		if (prompts && prompts.length > 0) {
			return prompts[0];
		}
	} catch (error) {
		console.error("Get system prompt error:", error);
	}

	// Default fallback
	return {
		system_prompt: "Bạn là trợ lý sức khỏe AI của TheraHome.",
		model: "llama-3.3-70b-versatile",
		temperature: 0.7,
		max_tokens: 1000,
	};
}

// Call Groq API
async function callGroq(
	systemPrompt: string,
	userMessage: string,
	model: string = "llama-3.3-70b-versatile",
	temperature: number = 0.7,
	maxTokens: number = 1000,
): Promise<string> {
	try {
		const response = await fetch(GROQ_URL, {
			method: "POST",
			headers: {
				Authorization: `Bearer ${GROQ_API_KEY}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				model,
				messages: [
					{ role: "system", content: systemPrompt },
					{ role: "user", content: userMessage },
				],
				temperature,
				max_tokens: maxTokens,
			}),
		});

		const data = await response.json();
		return data.choices?.[0]?.message?.content || "Không có phản hồi";
	} catch (error) {
		console.error("Groq API error:", error);
		return "Xin lỗi, tôi không thể trả lời lúc này. Vui lòng thử lại sau.";
	}
}

// Get AI exercise recommendations
export async function getExerciseRecommendations(userContext: {
	pain_areas?: string[];
	pain_level?: number;
	behavior?: any;
	recent_logs?: any[];
	available_exercises?: any[];
}) {
	const config = await getSystemPrompt("recommendation");
	
	const contextWithoutExercises = {
		pain_areas: userContext.pain_areas,
		pain_level: userContext.pain_level,
		behavior: userContext.behavior,
		recent_logs: userContext.recent_logs
	};
	
	const exercisesList = (userContext.available_exercises || []).map((ex: any) => ({
		id: ex.id || ex._id,
		title: ex.title,
		category: ex.category,
		difficulty: ex.difficulty,
		available_video_levels: Object.entries(ex.video_urls_by_pain || {})
			.filter(([, url]) => typeof url === 'string' && url.trim() !== '')
			.map(([level]) => level),
	}));

	const message = `Người dùng có các vấn đề: ${JSON.stringify(contextWithoutExercises)}.
    
Dưới đây là danh sách các bài tập hiện có trên hệ thống: 
${JSON.stringify(exercisesList)}

Từ danh sách bài tập trên, hãy chọn những bài tập phù hợp nhất (tối đa 5 bài) để hỗ trợ giảm đau và phục hồi.
Hãy phân tích mức đau hiện tại để ưu tiên độ khó phù hợp:
- Không đau: có thể ưu tiên medium, sau đó easy hoặc hard
- Đau nhẹ: ưu tiên easy, sau đó medium
- Đau vừa: ưu tiên easy, hạn chế hard
- Đau nặng/Tê: chỉ ưu tiên bài thật nhẹ, an toàn và tránh hard
Chỉ chọn bài có video phù hợp với mức đau hiện tại nếu có.
BẮT BUỘC TRẢ VỀ CHÍNH XÁC cấu trúc JSON mảng như sau (KHÔNG giải thích, KHÔNG chứa markdown):
[
  { "exercise_id": "id_bài_tập_từ_danh_sách" }
]`;

	return callGroq(
		config.system_prompt,
		message,
		config.model,
		config.temperature,
		config.max_tokens,
	);
}

// Get device level recommendation
export async function getDeviceLevelRecommendation(userContext: {
	pain_level?: number;
	pain_areas?: Record<string, number>;
}) {
	const config = await getSystemPrompt("recommendation");
	const message = `Mức đau: ${JSON.stringify(userContext)}. Gợi ý mức thiết bị (1-6) và thời gian sử dụng.`;
	return callGroq(
		config.system_prompt,
		message,
		config.model,
		config.temperature,
		config.max_tokens,
	);
}

// Analyze pain trends
export async function analyzePainTrends(painLogs: any[]) {
	const config = await getSystemPrompt("recommendation");
	const message = `Phân tích xu hướng đau: ${JSON.stringify(painLogs.slice(0, 7))}. Đưa ra nhận xét ngắn gọn.`;
	return callGroq(
		config.system_prompt,
		message,
		config.model,
		config.temperature,
		config.max_tokens,
	);
}

// Chat with AI assistant
export async function chatWithAssistant(
	message: string,
	chatHistory: Array<{ role: string; content: string }> = [],
) {
	const config = await getSystemPrompt("chatbot");

	try {
		const response = await fetch(GROQ_URL, {
			method: "POST",
			headers: {
				Authorization: `Bearer ${GROQ_API_KEY}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				model: config.model,
				messages: [
					{ role: "system", content: config.system_prompt },
					...chatHistory.slice(-10),
					{ role: "user", content: message },
				],
				temperature: config.temperature,
				max_tokens: config.max_tokens,
			}),
		});

		const data = await response.json();
		const reply =
			data.choices?.[0]?.message?.content ||
			"Xin lỗi, tôi không thể trả lời lúc này.";

		return reply;
	} catch (error) {
		console.error("Chat error:", error);
		return "Xin lỗi, tôi không thể trả lời lúc này. Vui lòng thử lại sau.";
	}
}

// Get chat history
export async function getChatHistory(limit = 50) {
	try {
		return await api.get(`/chat-history?limit=${limit}`);
	} catch (error) {
		console.error("Get chat history error:", error);
		return [];
	}
}

// Generate daily recommendations based on pain log
export async function generateDailyRecommendations(todayPainLog: any) {
	const config = await getSystemPrompt("recommendation");
	const message = `Dựa vào nhật ký đau hôm nay: ${JSON.stringify(todayPainLog)}, hãy đưa ra lời khuyên dinh dưỡng và thể thao ngắn gọn. Trả về đúng định dạng JSON chuẩn (không markdown, không backtick) như sau: { "nutrition": "...", "sport": "..." }`;

	const response = await callGroq(
		config.system_prompt,
		message,
		config.model,
		config.temperature,
		config.max_tokens,
	);

	try {
		const cleanJson = response
			.replace(/```json/g, "")
			.replace(/```/g, "")
			.trim();
		return JSON.parse(cleanJson);
	} catch (e) {
		console.error(
			"Failed to parse Groq recommendation:",
			e,
			"Response:",
			response,
		);
		return {
			nutrition:
				"Nên ăn nhiều rau xanh, thực phẩm giàu omega-3, và uống đủ nước.",
			sport: "Nên đi bộ hoặc tập yoga nhẹ nhàng để giảm căng thẳng cơ.",
		};
	}
}
