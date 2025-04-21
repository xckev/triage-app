from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from llama_stack_client import Agent, AgentEventLogger, LlamaStackClient
from typing import Optional, List

app = FastAPI()

# Initialize LlamaStack client and setup
client = LlamaStackClient(base_url="http://0.0.0.0:8321")

# Select the first LLM model
models = client.models.list()
model_id = next(m for m in models if m.model_type == "llm").identifier

class WeatherRequest(BaseModel):
    prompt: str

class WeatherResponse(BaseModel):
    response: str

@app.post("/analyze", response_model=WeatherResponse)
async def analyze_weather(request: WeatherRequest):
    try:
        # Create agent
        print("Creating agent with prompt:", request.prompt)
        agent = Agent(
            client,
            model=model_id,
            instructions="You will be given a prompt with weather information. You will need to analyze the weather information and provide a summary of the weather in the prompt. Keep it short and concise.",
        )
        
        # Get model response
        response = agent.create_turn(
            messages=[{"role": "user", "content": request.prompt}],
            session_id=agent.create_session("weather_analysis"),
            stream=True,
        )
        
        # Collect the complete response
        full_response = []
        for log in AgentEventLogger().log(response):
            if hasattr(log, 'content'):
                full_response.append(log.content)
        
        return {"response": "".join(full_response)}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5000)