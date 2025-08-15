from modal import App, Image, Secret, fastapi_endpoint, FunctionCall, Dict
import asyncio

image = Image.debian_slim().pip_install(
    "livekit>=0.19.1",
    "livekit-agents>=1.0.0",
    "livekit-plugins-openai>=1.0.0",
    "livekit-plugins-silero>=1.0.0",
    "livekit-plugins-cartesia>=1.0.0",
    "livekit-plugins-deepgram>=1.0.0",
    "python-dotenv~=1.0",
    "cartesia==2.0.0a0",
    "fastapi[standard]",
    "aiohttp",
)

app = App("livekit-voice-agent", image=image)

# Create a persisted dict - the data gets retained between app runs
room_dict = Dict.from_name("room-dict", create_if_missing=True)

with image.imports():
    from livekit import rtc
    from livekit.agents import AutoSubscribe, JobContext, AgentSession, Agent
    from livekit.agents.worker import Worker, WorkerOptions

    from livekit.plugins import openai, deepgram, silero, cartesia


async def livekit_entrypoint(ctx: JobContext):
    print("Connecting to room", ctx.room.name)
    await ctx.connect(auto_subscribe=AutoSubscribe.AUDIO_ONLY)
    participant = await ctx.wait_for_participant()
    await run_multimodal_agent(ctx, participant)

async def run_multimodal_agent(ctx: JobContext, participant: rtc.RemoteParticipant):
    print("Starting multimodal agent")

    # Create the agent session with the new API
    session = AgentSession(
        llm=openai.realtime.RealtimeModel(voice="coral")
    )

    # Start the session
    await session.start(
        room=ctx.room,
        agent=Agent(instructions="You are a voice assistant created by Modal. You answer questions and help with tasks.")
    )

    # Generate initial greeting
    await session.generate_reply(
        instructions="Hey, how can I help you today?"
    )


@app.function(image=image)
@fastapi_endpoint(method="POST")
async def run_livekit_agent(request: dict):
    from aiohttp import web

    room_name = request["room"]["sid"]

    ## check whether the room is already in the room_dict
    if room_name in room_dict and request["event"] == "room_started":
        print(
            f"Received web event for room {room_name} that already has a worker running"
        )
        return web.Response(status=200)

    if request["event"] == "room_started":
        call = run_agent_worker.spawn(room_name)
        room_dict[room_name] = call.object_id
        print(f"Worker for room {room_name} spawned")

    elif request["event"] == "room_finished":
        if room_name in room_dict:
            function_call = FunctionCall.from_id(room_dict[room_name])
            # spin down the Modal function
            function_call.cancel()
            # delete the room from the room_dict
            del room_dict[room_name]
            print(f"Worker for room {room_name} spun down")

    return web.Response(status=200)


@app.function(
    gpu="A100", timeout=3000, secrets=[Secret.from_name("livekit-voice-agent")]
)
async def run_agent_worker(room_name: str):
    import os
    print("Running worker")

    worker = Worker(
        WorkerOptions(
            entrypoint_fnc=livekit_entrypoint,
            ws_url=os.environ.get("LIVEKIT_URL"),
        )
    )

    try:
        await worker.run()  # Wait for the worker to finish
    except asyncio.CancelledError:
        print(f"Worker for room {room_name} was cancelled. Cleaning up...")
        # Perform cleanup before termination

        await worker.drain()
        await worker.aclose()
        print(f"Worker for room {room_name} shutdown complete.")
        raise  # Re-raise to propagate the cancellation
    finally:
        await worker.drain()
        await worker.aclose()
