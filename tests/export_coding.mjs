// Dumps coding problems + harness as JSON so the Python test runner can execute them.
import { CODING_PROBLEMS } from '../js/data/coding.js';
import { HARNESS } from '../js/lib/harness.js';
process.stdout.write(JSON.stringify({ harness: HARNESS, problems: CODING_PROBLEMS }));
