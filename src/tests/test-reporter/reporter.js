module.exports = class TestReporter {
  onRunComplete(_, results) {
    console.log(`\ntotal test cases: ${results.numTotalTests} `);
    console.log(`\npassed test cases: ${results.numPassedTests} `);
    console.log(`\nfailed test cases: ${results.numFailedTests} `);
    for (const suite of results.testResults) {
      // A suite that fails to load (syntax error, missing export) reports no tests; surface why.
      if (suite.testExecError) console.log(`\nsuite failed to run: ${suite.testFilePath.split('/').pop()}`);
      for (const test of suite.testResults) {
        const tc = {
          title: test.ancestorTitles.join(' | ').concat(` | ${test.title}`),
          status: test.status,
        };
        console.log(`===>TC ${JSON.stringify(tc)} TC<===`);
      }
    }
  }
};
