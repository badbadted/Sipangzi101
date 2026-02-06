
import { GoogleGenAI } from "@google/genai";
import { Project } from "../types";

// Always use process.env.API_KEY directly as per guidelines
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateProjectSummary = async (project: Project): Promise<string> => {
  const prompt = `
    你是一位專業的室內設計顧問。請根據以下屋主的需求，生成一份給專業設計師看的「設計要點摘要」。
    
    專案名稱：${project.title}
    坪數：${project.size} 坪
    風格偏好：${project.stylePreference}
    各空間需求：
    ${project.rooms.map(r => `- ${r.type}: ${r.description} (優先級: ${r.priority})`).join('\n')}

    請提供以下內容：
    1. 核心設計挑戰與機會
    2. 空間配置建議
    3. 建議的材質與色調
    
    請使用繁體中文，語氣專業且精煉。
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    // Direct property access for text response
    return response.text || "無法生成摘要。";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "AI 摘要暫時不可用。";
  }
};

export const suggestDesignStyle = async (description: string): Promise<string> => {
  const prompt = `
    屋主描述了他的理想生活： "${description}"
    請根據這段描述建議 3 種適合的室內設計風格，並解釋原因。
    請用繁體中文回答。
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    // Direct property access for text response
    return response.text || "無法提供建議。";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "風格建議暫時不可用。";
  }
};
