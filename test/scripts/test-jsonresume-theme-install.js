/* eslint-env mocha */
/* eslint-disable no-console */
/*
Test that demonstrates installing an external JSON Resume theme and using it
with the `hackmyresume` CLI to build a JRS resume.
This uses the sandbox folder to avoid polluting the repo or global node_modules.
*/

var chai = require('chai')
  , expect = chai.expect
  , HMRMAIN = require('../../src/cli/main')
  , FS = require('fs')
  , PATH = require('path')
  , CP = require('child_process')
  , STRIPCOLOR = require('stripcolorcodes')
  ;

describe('External JSON Resume theme install & build', function () {
  this.timeout(90000);

  var gather = '';
  var ConsoleLogOrg = console.log;

  // Replacement for process.exit()
  function MyProcessExit( retVal ) { return retVal; }

  // Replacement for console.log
  function MyConsoleLog() {
    var tx = Array.prototype.slice.call(arguments).join(' ');
    gather += STRIPCOLOR( tx );
    ConsoleLogOrg.apply(this, arguments);
  }

  function HackMyResumeOutputStub( args ) {
    console.log = MyConsoleLog;
    process.exit = MyProcessExit;

    try {
      args.unshift( process.argv[1] );
      args.unshift( process.argv[0] );
      HMRMAIN( args );
    }
    catch( ex ) {
      require('../../src/cli/error').err( ex, false );
    }
  console.log = ConsoleLogOrg;
  }

  it('should install a JSON Resume theme and build a JRS resume using it', function () {
    // Create sandbox folder
    var sbpath = PATH.resolve( __dirname, '../../test/sandbox/theme-install' );
    if (!FS.existsSync(sbpath)) { FS.mkdirSync(sbpath, { recursive: true }); }

  // Attempt to install jsonresume-theme-modern into sandbox
    // If network or install fails, fail the test but don't throw unhandled
    // Determine installer availability
    var npmPath = null;
    try { npmPath = CP.execSync('which npm').toString().trim(); } catch (e) {}
    var bunPath = null;
    try { bunPath = CP.execSync('which bun').toString().trim(); } catch (e) {}

    if (!npmPath && !bunPath) {
      this.skip(); // No installer available in runner environment
      return;
    }

    // Run an install in sandbox. Prefer npm if available, otherwise bun
    try {
      if (npmPath) {
  CP.execSync('npm install --silent jsonresume-theme-modern@0.0.18', { cwd: sbpath, stdio: 'pipe' });
      } else {
  CP.execSync('bun add jsonresume-theme-modern@0.0.18', { cwd: sbpath, stdio: 'pipe' });
      }
    } catch (err) {
      // If network or install fails, skip rather than fail CI suites
      this.skip();
      return;
    }

  // Build using the installed theme by path (sandbox or fallback to repo node_modules)
  gather = '';
  var themePathSandbox = PATH.join(sbpath, 'node_modules', 'jsonresume-theme-modern');
  var themePathRepo = PATH.resolve( __dirname, '../../node_modules/jsonresume-theme-modern' );
  var themePath = FS.existsSync(themePathSandbox) ? themePathSandbox : themePathRepo;
    // Ensure target folder exists
    var tempPath = PATH.resolve( __dirname, '../../test/sandbox/temp' );
    if (!FS.existsSync(tempPath)) { FS.mkdirSync(tempPath, { recursive: true }); }

  HackMyResumeOutputStub([ 'build', 'test/fixtures/jrs/jane-fullstacker.json', 'to', 'test/sandbox/temp/jane-modern.all', '-t', themePath ]);

    // Verify HMR applied the theme
  expect(gather.indexOf('Applying JSONRESUME-THEME-MODERN theme') > -1).to.equal(true);

    // Check for generated artifacts (HTML and JSON) and that they're non-empty
  var htmlPath = PATH.join(tempPath, 'jane-modern.html');
  var jsonPath = PATH.join(tempPath, 'jane-modern.json');
    expect(FS.existsSync(htmlPath), 'HTML resume exists').to.equal(true);
    expect(FS.existsSync(jsonPath), 'JSON resume exists').to.equal(true);
    expect(FS.statSync(htmlPath).size > 0, 'HTML file not empty').to.equal(true);
    expect(FS.statSync(jsonPath).size > 0, 'JSON file not empty').to.equal(true);

    // Cleanup generated artifacts (PDF, HTML, JSON, YML, PNG)
  var generated = [ 'jane-modern.html', 'jane-modern.pdf', 'jane-modern.json', 'jane-modern.yml', 'jane-modern.png' ];
    generated.forEach(function(f) {
      var p = PATH.join(tempPath, f);
      try { if (FS.existsSync(p)) { FS.unlinkSync(p); } } catch (e) { /* ignore cleanup errors */ }
    });

    // Confirm cleanup removed the primary artifacts
    expect(FS.existsSync(htmlPath)).to.equal(false);
    expect(FS.existsSync(jsonPath)).to.equal(false);

    // If we installed the theme into the sandbox, clean that up
    try {
      if (FS.existsSync(themePathSandbox) && themePathSandbox.indexOf(sbpath) === 0) {
        // Remove sandbox node_modules folder
        var nm = PATH.join(sbpath, 'node_modules');
        if (FS.existsSync(nm)) {
          // Node 12+ use rmSync with recursive
          FS.rmSync(nm, { recursive: true, force: true });
        }
      }
      // verify removal
      expect(!FS.existsSync(PATH.join(sbpath,'node_modules')) || !FS.existsSync(themePathSandbox)).to.equal(true);
    } catch (e) {
      // ignore cleanup errors
    }
  });
});
