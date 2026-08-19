import { printReport, validateProject } from './lib/content-pipeline.mjs';

const report = await validateProject();
printReport(report);
if (report.errors.length > 0) process.exitCode = 1;
