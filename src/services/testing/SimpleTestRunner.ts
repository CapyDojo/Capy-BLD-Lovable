
// Simple test runner that doesn't depend on other modules
export class SimpleTestRunner {
  private tests: Array<{ name: string; fn: () => Promise<boolean> | boolean }> = [];

  constructor() {
    this.setupBasicTests();
  }

  private setupBasicTests() {
    this.tests = [
      {
        name: 'Basic Function Test',
        fn: () => {
          console.log('✅ Basic test running...');
          return true;
        }
      },
      {
        name: 'Async Test',
        fn: async () => {
          console.log('🔄 Async test running...');
          await new Promise(resolve => setTimeout(resolve, 100));
          return true;
        }
      },
      {
        name: 'Window Object Test',
        fn: () => {
          console.log('🪟 Testing window object access...');
          return typeof window !== 'undefined';
        }
      }
    ];
  }

  async runAllTests() {
    console.log('🧪 SimpleTestRunner: Running all tests...');
    const results = [];
    
    for (const test of this.tests) {
      try {
        console.log(`▶️ Running: ${test.name}`);
        const result = await test.fn();
        console.log(`${result ? '✅' : '❌'} ${test.name}: ${result ? 'PASSED' : 'FAILED'}`);
        results.push({ name: test.name, passed: result });
      } catch (error) {
        console.log(`💥 ${test.name}: ERROR - ${error}`);
        results.push({ name: test.name, passed: false, error: String(error) });
      }
    }
    
    const passed = results.filter(r => r.passed).length;
    const total = results.length;
    console.log(`🏁 Tests complete: ${passed}/${total} passed`);
    
    return { passed, total, results };
  }

  getTestNames() {
    return this.tests.map(t => t.name);
  }

  test() {
    console.log('✅ SimpleTestRunner.test() called successfully!');
    return 'Hello from SimpleTestRunner!';
  }
}

// Create and export a global instance
export const simpleTestRunner = new SimpleTestRunner();
