import { GoogleGenAI, Type, Schema } from "@google/genai";
import { ResumeAnalysisResult, ResumeInput } from "../types";

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key not found in environment variables");
  }
  return new GoogleGenAI({ apiKey });
};

const SYSTEM_INSTRUCTION = `
You are the "Career AI Intelligence Agent", a top-tier AI career consultant.
Your capabilities are modeled after advanced large language models specializing in global workplace contexts.

Your core mission is to:
1. Evaluate resumes with extreme precision, identifying gaps between the candidate's profile and market requirements.
2. Provide specific, actionable optimization suggestions (using STAR method).
3. Act as a compassionate but professional career coach for career development planning.

Tone: Professional, Encouraging, Sharp, and deeply knowledgeable about the modern job market (Tech, Finance, Creative, etc.).
Always respond in English.
`;

const analysisSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    overallScore: { type: Type.INTEGER, description: "Overall resume score from 0-100 based on impact, clarity, and formatting." },
    summaryFeedback: { type: Type.STRING, description: "A comprehensive summary of the resume's quality in 2-3 sentences." },
    skillsAnalysis: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          skill: { type: Type.STRING },
          currentLevel: { type: Type.INTEGER, description: "Estimated proficiency 0-100 based on resume evidence" },
          marketDemand: { type: Type.INTEGER, description: "Estimated market demand for this skill 0-100" }
        }
      }
    },
    formattingIssues: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "List of specific formatting or structural issues."
    },
    contentStrengths: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "List of things the candidate did well."
    },
    contentWeaknesses: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "List of areas needing improvement (e.g., lack of metrics, typos)."
    },
    optimizedResumeContent: {
      type: Type.STRING,
      description: "A completely rewritten version of the Professional Summary and Experience sections, using STAR method and action verbs."
    },
    recommendedPaths: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          role: { type: Type.STRING },
          matchScore: { type: Type.INTEGER },
          gapAnalysis: { type: Type.STRING, description: "Brief analysis of gaps to reach this role." },
          learningPath: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING },
            description: "3-5 specific steps/skills to learn."
          }
        }
      }
    }
  },
  required: ["overallScore", "summaryFeedback", "skillsAnalysis", "formattingIssues", "contentStrengths", "contentWeaknesses", "optimizedResumeContent", "recommendedPaths"]
};

export const analyzeResume = async (input: ResumeInput, jobDescription?: string): Promise<ResumeAnalysisResult> => {
  const ai = getClient();
  
  const parts: any[] = [];

  let promptText = `Please analyze the provided resume deeply.`;
  if (jobDescription) {
    promptText += ` The candidate is targeting this job description: "${jobDescription}". Adjust the scoring and keyword analysis based on this target.`;
  }
  promptText += `\nProvide the output in structured JSON format according to the schema.`;
  
  if (input.text) {
    promptText += `\n\nRESUME TEXT CONTENT:\n${input.text}`;
    parts.push({ text: promptText });
  } else if (input.fileData) {
    parts.push({ text: promptText });
    parts.push({
      inlineData: {
        mimeType: input.fileData.mimeType,
        data: input.fileData.data
      }
    });
  } else {
    throw new Error("No resume content provided");
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: { parts },
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: analysisSchema,
        temperature: 0.4,
      },
    });

    if (response.text) {
      return JSON.parse(response.text) as ResumeAnalysisResult;
    } else {
      throw new Error("No data returned from AI");
    }
  } catch (error) {
    console.error("Analysis failed:", error);
    throw error;
  }
};

export const chatWithCareerCoach = async (history: {role: string, parts: {text: string}[]}[], message: string) => {
  const ai = getClient();
  const chat = ai.chats.create({
    model: "gemini-3-flash-preview",
    config: {
      systemInstruction: SYSTEM_INSTRUCTION + " You are now in a conversation with the candidate. Answer their questions about career development, interview prep, and skill acquisition directly and encouragingly. Use a tone similar to a senior mentor.",
    },
    history: history
  });

  const response = await chat.sendMessage({ message });
  return response.text;
};