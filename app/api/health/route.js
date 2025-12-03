export async function GET() {
  try {
    // Basic health check - just return success
    return Response.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      message: "Fitness tracker API is running",
    })
  } catch (error) {
    console.error("[v0] Health check failed:", error)
    return Response.json({ status: "error", message: error.message }, { status: 500 })
  }
}
