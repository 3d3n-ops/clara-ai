import json
import logging
import os
import redis
from dotenv import load_dotenv
from livekit.agents import (
    NOT_GIVEN,
    Agent,
    AgentFalseInterruptionEvent,
    AgentSession,
    JobContext,
    JobProcess,
    MetricsCollectedEvent,
    RoomInputOptions,
    RunContext,
    WorkerOptions,
    cli,
    metrics,
)
from livekit.agents.llm import function_tool
from livekit.plugins import cartesia, deepgram, noise_cancellation, openai, silero
from livekit.plugins.turn_detector.multilingual import MultilingualModel

logger = logging.getLogger("agent")

load_dotenv(".env")


class Assistant(Agent):
    def __init__(self, instructions: str) -> None:
        super().__init__(
            instructions=instructions,
        )

    @function_tool
    async def generate_example(self, context: RunContext, concept: str):
        """Use this tool to generate a specific example of a concept.

        Args:
            concept: The concept to generate an example for.
        """
        logger.info(f"Generating example for {concept}")
        example_data = {
            "tool": "example",
            "concept": concept,
            "example": f"This is a sample example for {concept}. In a real application, this would be a more detailed and accurate example.",
        }
        await context.session.send_data(json.dumps(example_data), "tutor_data")
        return f"I've prepared an example of {concept} for you."

    @function_tool
    async def generate_quiz(self, context: RunContext, topic: str, num_questions: int = 3, difficulty: str = "medium"):
        """Use this tool to generate a short quiz on a topic.

        Args:
            topic: The topic for the quiz.
            num_questions: The number of questions to generate.
            difficulty: The difficulty of the quiz (e.g., easy, medium, hard).
        """
        logger.info(f"Generating quiz for {topic}")
        quiz_data = {
            "tool": "quiz",
            "topic": topic,
            "difficulty": difficulty,
            "questions": [
                {
                    "question_text": f"What is the main idea of {topic}? (Sample)",
                    "options": ["Option A", "Option B", "Option C", "Option D"],
                    "correct_answer": "Option A",
                }
                for _ in range(num_questions)
            ],
        }
        await context.session.send_data(json.dumps(quiz_data), "tutor_data")
        return f"I've generated a {difficulty} quiz on {topic} with {num_questions} questions."

    @function_tool
    async def explain_concept(self, context: RunContext, concept: str):
        """Use this tool to get a detailed explanation of a concept.

        Args:
            concept: The concept to explain.
        """
        logger.info(f"Generating explanation for {concept}")
        explanation_data = {
            "tool": "explanation",
            "concept": concept,
            "explanation": f"This is a sample explanation for {concept}. In a real application, this would be a more detailed and accurate explanation.",
        }
        await context.session.send_data(json.dumps(explanation_data), "tutor_data")
        return f"I can certainly explain {concept}. Here are the details."

    @function_tool
    async def generate_diagram(self, context: RunContext, diagram_description: str):
        """Use this tool to generate a diagram in Mermaid.js format.

        Args:
            diagram_description: A description of the diagram to generate.
        """
        logger.info(f"Generating diagram for: {diagram_description}")
        diagram_data = {
            "tool": "diagram",
            "description": diagram_description,
            "mermaid_code": f"flowchart TD\n    A[Start] --> B{{{diagram_description}}};\n    B -- Yes --> C[End];",
        }
        await context.session.send_data(json.dumps(diagram_data), "tutor_data")
        return f"I've created a diagram to illustrate that. Here it is."



def prewarm(proc: JobProcess):
    proc.userdata["vad"] = silero.VAD.load()


async def entrypoint(ctx: JobContext):
    # Logging setup
    # Add any other context you want in all log entries here
    ctx.log_context_fields = {
        "room": ctx.room.name,
    }

    redis_client = redis.from_url(os.environ.get("REDIS_URL"))
    session_id = ctx.room.name
    summary = redis_client.get(f"summary:{session_id}")

    instructions = """You are a friendly and encouraging college tutor AI. Your primary goal is to help students learn and understand concepts, not to do their work for them.

> **Your Tutoring Strategy:**
> *   **Be Proactive:** Do not just wait for the student to ask for things. Actively guide the learning session. If a student seems unsure, take the initiative.
> *   **Explain First:** When a new topic is introduced, start by providing a clear explanation using the `explain_concept` tool.
> *   **Use Examples:** If a student is struggling with a theoretical idea, proactively provide a concrete example using the `generate_example` tool to make it tangible.
> *   **Visualize Complex Ideas:** For topics involving processes, flows, or hierarchies, proactively use the `generate_diagram` tool. Visual aids are very helpful.
> *   **Assess Understanding:** After an explanation, check for understanding. You can ask a direct question, and if you think it would be beneficial, generate a short quiz with `generate_quiz` to test their knowledge.
>
> **Strict Rules:**
> *   **Stay on Topic:** Keep the conversation focused on educational subjects. Do not engage in off-topic or inappropriate conversations.
> *   **Be Supportive:** Your tone must always be patient and encouraging."""

    if summary:
        instructions += f"\n\nHere is a summary of the lesson plan:\n{summary.decode('utf-8')}"


    # Set up a voice AI pipeline using OpenAI, Cartesia, Deepgram, and the LiveKit turn detector
    session = AgentSession(
        # A Large Language Model (LLM) is your agent's brain, processing user input and generating a response
        # See all providers at https://docs.livekit.io/agents/integrations/llm/
        llm=openai.LLM(),
        # Speech-to-text (STT) is your agent's ears, turning the user's speech into text that the LLM can understand
        # See all providers at https://docs.livekit.io/agents/integrations/stt/
        stt=deepgram.STT(model="nova-3", language="multi"),

        # Text-to-speech (TTS) is your agent's voice, turning the LLM's text into speech that the user can hear
        # See all providers at https://docs.livekit.io/agents/integrations/tts/
        tts=cartesia.TTS(voice="6f84f4b8-58a2-430c-8c79-688dad597532"),
        # VAD and turn detection are used to determine when the user is speaking and when the agent should respond
        # See more at https://docs.livekit.io/agents/build/turns
        turn_detection=MultilingualModel(),
        vad=ctx.proc.userdata["vad"],
        # allow the LLM to generate a response while waiting for the end of turn
        # See more at https://docs.livekit.io/agents/build/audio/#preemptive-generation
        preemptive_generation=True,
    )

    # To use a realtime model instead of a voice pipeline, use the following session setup instead:
    # session = AgentSession(
    #     # See all providers at https://docs.livekit.io/agents/integrations/realtime/
    #     llm=openai.realtime.RealtimeModel()
    # )

    # sometimes background noise could interrupt the agent session, these are considered false positive interruptions
    # when it's detected, you may resume the agent's speech
    @session.on("agent_false_interruption")
    def _on_agent_false_interruption(ev: AgentFalseInterruptionEvent):
        logger.info("false positive interruption, resuming")
        session.generate_reply(instructions=ev.extra_instructions or NOT_GIVEN)

    # Metrics collection, to measure pipeline performance
    # For more information, see https://docs.livekit.io/agents/build/metrics/
    usage_collector = metrics.UsageCollector()

    @session.on("metrics_collected")
    def _on_metrics_collected(ev: MetricsCollectedEvent):
        metrics.log_metrics(ev.metrics)
        usage_collector.collect(ev.metrics)

    async def log_usage():
        summary = usage_collector.get_summary()
        logger.info(f"Usage: {summary}")

    ctx.add_shutdown_callback(log_usage)

    # # Add a virtual avatar to the session, if desired
    # # For other providers, see https://docs.livekit.io/agents/integrations/avatar/
    # avatar = hedra.AvatarSession(
    #   avatar_id="...",  # See https://docs.livekit.io/agents/integrations/avatar/hedra
    # )
    # # Start the avatar and wait for it to join
    # await avatar.start(session, room=ctx.room)

    # Start the session, which initializes the voice pipeline and warms up the models
    await ctx.connect()
    await session.start(
        agent=Assistant(instructions),
        room=ctx.room,
        room_input_options=RoomInputOptions(
            # LiveKit Cloud enhanced noise cancellation
            # - If self-hosting, omit this parameter
            # - For telephony applications, use `BVCTelephony` for best results
            noise_cancellation=noise_cancellation.BVC(),
        ),
    )

    # Join the room and connect to the user
    await session.say("Hello, there! How are you doing today? How can I help you?")



if __name__ == "__main__":
    cli.run_app(WorkerOptions(entrypoint_fnc=entrypoint, prewarm_fnc=prewarm))
