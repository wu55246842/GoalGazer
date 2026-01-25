import { spawnSync } from "child_process";
import path from "path";

interface Args {
  matchId?: string;
  league?: string;
  date?: string;
  mode?: string;
}

function parseArgs(argv: string[]): Args {
  const args: Args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const value = argv[i];
    if (!value.startsWith("--")) continue;
    const key = value.replace("--", "");
    const next = argv[i + 1];
    if (next && !next.startsWith("--")) {
      args[key as keyof Args] = next;
      i += 1;
    } else {
      args[key as keyof Args] = "true";
    }
  }
  return args;
}

const args = parseArgs(process.argv.slice(2));
const pythonModule = "goalgazer";
const projectRoot = path.resolve(__dirname, "..", "..", "..");
const pythonPath = path.join(projectRoot, "tools", "pipeline", "python");

const result = spawnSync(
  "python",
  [
    "-m",
    pythonModule,
    "--matchId",
    args.matchId ?? "12345",
    "--mode",
    args.mode ?? "single",
    "--league",
    args.league ?? "epl",
    "--date",
    args.date ?? new Date().toISOString().slice(0, 10),
  ],
  {
    stdio: "inherit",
    cwd: pythonPath,
  }
);

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}
