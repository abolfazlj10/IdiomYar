import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
const apiKey = 'AIzaSyCDXMKBUSPiT5eL13KBgAdP4GMX_Q9S_PY'
export async function POST (request: Request){
    const body = await request.json()
    
    const { idioms, information } = body
    
    const prompt = `Write a story using these idioms for a language learner. First, provide the story in Persian (Farsi) and then its English translation, each clearly labeled.\nIn both the Persian and English stories, put the exact translation or equivalent of each idiom in [brackets] so it can be highlighted.\nIdioms: 
    ${idioms}.${information ? '\nAdditional information: ' + information : ''}\nOutput format:\nPersian:\n[FA]\nEnglish:\n[EN]`;
    
    
    const ai = new GoogleGenAI({ apiKey: apiKey });
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
    });

    console.log(response)
    
    return NextResponse.json({resp: 'thsi is a response of server',status:true})
}