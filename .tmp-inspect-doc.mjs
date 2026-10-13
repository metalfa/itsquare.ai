import mammoth from "mammoth"

const result = await mammoth.extractRawText({ path: "data/TTT_2026-11-Blog-Hacked-Email-c6780e.docx" })
console.log(result.value)
