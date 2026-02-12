// eslint-disable-next-line @typescript-eslint/no-require-imports
const fs = require('fs')
// eslint-disable-next-line @typescript-eslint/no-require-imports
const path = require('path')

// Manually parse .env.local
const envPath = path.resolve(process.cwd(), '.env.local')
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, 'utf8')
  envConfig.split('\n').forEach(line => {
    const [key, value] = line.split('=')
    if (key && value) {
      process.env[key.trim()] = value.trim()
    }
  })
}

async function listModels() {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
        console.error("API Key not found!")
        return
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`

    try {
        console.log("Fetching available models...")
        const response = await fetch(url)
        const data = await response.json()

        if (data.models) {
            console.log("Available Models:")
            data.models.forEach(m => {
                if (m.supportedGenerationMethods && m.supportedGenerationMethods.includes("generateContent")) {
                    console.log(`- ${m.name}`)
                }
            })
        } else {
            console.error("No models found or error:", data)
        }
    } catch (error) {
        console.error("Error fetching models:", error)
    }
}

listModels()
