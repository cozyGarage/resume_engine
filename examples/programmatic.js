// Example: Programmatic usage of HackMyResume
// - Bun-first friendly example
// Usage: bun run examples/programmatic.js (or: node examples/programmatic.js)

const HMR = require('../src/index');

async function run() {
  try {
    // Example: Analyze a resume programmatically
    const Analyze = HMR.verbs.analyze;
    const a = new Analyze();
    a.on('status', (info) => console.log('[analyze status]', info));
  const analyzeRes = await a.invoke(['node_modules/fresh-test-resumes/src/jrs/jane-fullstacker.json'], null, {});
    console.log('Analyze result:', analyzeRes);

    // Example: Build an HTML resume programmatically (Bun-first)
    const Build = HMR.verbs.build;
    const b = new Build();
    b.on('status', (info) => console.log('[build status]', info));
    const buildRes = await b.invoke(
  ['node_modules/fresh-test-resumes/src/jrs/jane-fullstacker.json'],
      ['test/sandbox/prog/jane-resume.html'],
      { theme: 'modern', pdf: 'none' }
    );

    console.log('Build result:', buildRes);
  } catch (err) {
    console.error('Error running programmatic example:', err);
    process.exit(1);
  }
}

run();
