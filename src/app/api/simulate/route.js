import { NextResponse } from "next/server";
import { exec } from "child_process";
import path from "path";
import { promisify } from "util";

const execPromise = promisify(exec);

export async function POST() {
  try {
    // Target the current directory where Python files are located
    const runDir = process.cwd();
    
    // Command to execute the python script
    // Attempt using .venv python if available, otherwise fallback to system python
    const cmd = "python run_agent.py";
    
    console.log(`[API] Executing command: ${cmd} in directory: ${runDir}`);
    
    const { stdout, stderr } = await execPromise(cmd, { cwd: runDir });
    
    if (stderr && stderr.includes("Traceback")) {
      console.error("[API] Simulation python script printed error trace:", stderr);
    }
    
    // Split lines and filter out empty ones
    const logs = stdout
      .split("\n")
      .map(line => line.trim())
      .filter(line => line.length > 0);
      
    return NextResponse.json({
      success: true,
      thoughts_log: logs,
      raw_stderr: stderr || null
    });
  } catch (err) {
    console.error("[API] Simulation execution failed:", err);
    return NextResponse.json(
      { 
        error: "Simulation execution failed.", 
        details: err.message,
        stdout: err.stdout || null,
        stderr: err.stderr || null 
      }, 
      { status: 500 }
    );
  }
}
