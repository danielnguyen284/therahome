import { api } from './api';

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

async function getSystemPrompt(promptType: string) {
  try {
    const prompts = await api.get<any[]>(`/ai-prompts?prompt_type=${promptType}`);
    if (prompts && prompts.length > 0) {
      return prompts[0];
    }
  } catch (error) {
    console.error('Get system prompt error:', error);
  }
  return {
    system_prompt: 'Bạn là trợ lý sức khỏe AI của TheraHome, có chuyên môn sâu về vật lý trị liệu cột sống.',
    model: 'llama-3.3-70b-versatile',
    temperature: 0.7,
    max_tokens: 1000,
  };
}

// Vietnamese Rule-Based Health Assistant Fallback Engine
function getFallbackResponse(userMessage: string): string {
  const msg = userMessage.toLowerCase();
  
  if (msg.includes('cổ') || msg.includes('vai') || msg.includes('gáy')) {
    return 'Đối với đau mỏi cổ vai gáy, bạn nên tránh cúi đầu quá thấp khi dùng điện thoại hoặc làm việc. Hãy thực hiện động tác kéo giãn cổ nhẹ nhàng bằng cách nghiêng đầu sang hai bên, giữ mỗi bên 15 giây. Kết hợp sử dụng thiết bị xung điện TheraNECK ở mức cường độ nhẹ (mức 1-2) từ 15 phút mỗi ngày để đạt hiệu quả giảm cơ căng cứng tốt nhất.';
  }
  
  if (msg.includes('lưng') || msg.includes('thắt lưng') || msg.includes('cột sống')) {
    return 'Đau thắt lưng thường do cơ lưng bị quá tải hoặc ngồi sai tư thế lâu. Bạn nên áp dụng liệu pháp Mc Kenzie bằng cách nằm sấp và chống khuỷu tay đẩy người lên nhẹ nhàng để giải tỏa áp lực đĩa đệm. Đồng thời sử dụng thiết bị TheraBACK kết hợp chế độ nhiệt ấm để thư giãn cơ lưng sâu.';
  }

  if (msg.includes('tê') || msg.includes('lan')) {
    return 'Triệu chứng tê lan từ cổ xuống tay hoặc từ lưng xuống chân có thể là dấu hiệu chèn ép dây thần kinh do thoát vị đĩa đệm. Bạn cần hạn chế các động tác vặn xoắn mạnh hoặc bê vác nặng. Hãy tập các bài tập kéo giãn nhẹ nhàng và nên tham khảo ý kiến bác sĩ chuyên khoa nếu tình trạng tê kéo dài.';
  }

  if (msg.includes('theraneck') || msg.includes('theraback') || msg.includes('thiết bị')) {
    return 'Hướng dẫn sử dụng thiết bị TheraHome:\n1. Bật nguồn và áp miếng đệm xung điện tiếp xúc trực tiếp lên vùng da sạch.\n2. Bắt đầu từ mức cường độ thấp nhất (mức 1 hoặc 2) để cơ thích nghi dần.\n3. Sử dụng từ 15-20 phút mỗi ngày, kết hợp chế độ sưởi ấm hồng ngoại.\nLưu ý: Không dùng trên vùng da có vết thương hở hoặc vùng tim.';
  }

  if (msg.includes('chào') || msg.includes('hello') || msg.includes('hi')) {
    return 'Xin chào! Tôi là trợ lý sức khỏe AI của TheraHome. Bạn đang cảm thấy mệt mỏi hay đau nhức ở vùng cơ khớp nào? Hãy chia sẻ để tôi đưa ra gợi ý tập luyện thích hợp nhé.';
  }

  return 'Tôi đã ghi nhận câu hỏi của bạn. Để hỗ trợ giảm nhức mỏi hiệu quả nhất, bạn nên duy trì vận động nhẹ nhàng sau mỗi 45 phút ngồi làm việc, uống đủ nước và thực hiện bài tập phục hồi cổ vai gáy hoặc cột sống lưng hằng ngày trên ứng dụng TheraHome.';
}

export async function chatWithAssistant(
  message: string,
  chatHistory: Array<{ role: string; content: string }> = []
): Promise<string> {
  const apiKey = process.env.NEXT_PUBLIC_GROQ_API_KEY;

  if (!apiKey) {
    // Return smart fallback reply offline
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(getFallbackResponse(message));
      }, 800);
    });
  }

  const config = await getSystemPrompt('chatbot');

  try {
    const response = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: config.model,
        messages: [
          { role: 'system', content: config.system_prompt },
          ...chatHistory.slice(-15),
          { role: 'user', content: message },
        ],
        temperature: config.temperature,
        max_tokens: config.max_tokens,
      }),
    });

    const data = await response.json();
    return data.choices?.[0]?.message?.content || 'Xin lỗi, tôi không thể trả lời lúc này.';
  } catch (error) {
    console.error('Groq connection error:', error);
    return getFallbackResponse(message);
  }
}

export async function generateDailyRecommendations(todayPainLog: any): Promise<{ nutrition: string; sport: string }> {
  const apiKey = process.env.NEXT_PUBLIC_GROQ_API_KEY;

  if (!apiKey) {
    // Return smart fallback reply offline based on pain log
    return new Promise((resolve) => {
      setTimeout(() => {
        const hasNeckPain = todayPainLog?.pain_areas?.neck > 0 || todayPainLog?.pain_areas?.shoulder_left > 0 || todayPainLog?.pain_areas?.shoulder_right > 0;
        const hasBackPain = todayPainLog?.pain_areas?.upper_back > 0 || todayPainLog?.pain_areas?.middle_back > 0 || todayPainLog?.pain_areas?.lower_back > 0;

        if (hasNeckPain) {
          resolve({
            nutrition: 'Bổ sung các thực phẩm giàu Canxi, Vitamin D, các chất chống oxy hóa và trà xanh để hỗ trợ kháng viêm cơ cổ vai gáy.',
            sport: 'Tập các động tác kéo giãn cổ nhẹ nhàng bằng cách nghiêng đầu sang bên 15 giây, đi bộ nhẹ nhàng 20 phút.',
          });
        } else if (hasBackPain) {
          resolve({
            nutrition: 'Uống đủ nước, tăng cường Omega-3 từ cá béo, quả óc chó và bổ sung Magie giúp giãn cơ thắt lưng tự nhiên.',
            sport: 'Áp dụng bài tập McKenzie nằm sấp chống khuỷu tay nâng ngực nhẹ nhàng, đi bộ trên nền phẳng.',
          });
        } else {
          resolve({
            nutrition: 'Duy trì chế độ ăn thanh đạm, giàu chất xơ, rau xanh và uống đủ nước để đào thải axit lactic gây nhức mỏi.',
            sport: 'Thực hiện kéo giãn toàn thân nhẹ nhàng tại chỗ 10 phút, tránh ngồi liên tục quá 45 phút.',
          });
        }
      }, 500);
    });
  }

  try {
    const config = await getSystemPrompt('recommendation');
    const message = `Dựa vào nhật ký đau hôm nay: ${JSON.stringify(todayPainLog)}, hãy đưa ra lời khuyên dinh dưỡng và thể thao ngắn gọn. Trả về đúng định dạng JSON chuẩn (không markdown, không backtick) như sau: { "nutrition": "...", "sport": "..." }`;

    const response = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: config.model,
        messages: [
          { role: 'system', content: config.system_prompt },
          { role: 'user', content: message },
        ],
        temperature: config.temperature,
        max_tokens: config.max_tokens,
      }),
    });

    const data = await response.json();
    const rawReply = data.choices?.[0]?.message?.content || '{}';
    
    const cleanJson = rawReply
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim();

    return JSON.parse(cleanJson);
  } catch (error) {
    console.error('Groq recommendation error:', error);
    // Fallback if anything fails
    return {
      nutrition: 'Duy trì chế độ ăn nhiều rau xanh, hạn chế thực phẩm nhiều dầu mỡ và uống đủ 2 lít nước.',
      sport: 'Tập các động tác xoay khớp nhẹ nhàng, đi bộ 15-20 phút tại nơi thoáng mát.',
    };
  }
}

