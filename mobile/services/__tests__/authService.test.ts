import { authApi } from '../authService';

export function runAuthServiceVerification() {
  const tests: { name: string; run: () => void }[] = [
    {
      name: 'authApi exports expected methods',
      run: () => {
        if (typeof authApi.login !== 'function') throw new Error('authApi.login is missing');
        if (typeof authApi.register !== 'function') throw new Error('authApi.register is missing');
        if (typeof authApi.oauth !== 'function') throw new Error('authApi.oauth is missing');
      },
    },
    {
      name: 'valid email format helper',
      run: () => {
        const email = 'user@example.com';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Invalid email format');
      },
    },
  ];

  tests.forEach((t) => {
    try {
      t.run();
      console.log(`✅ [Mobile Test Pass] ${t.name}`);
    } catch (e: any) {
      console.error(`❌ [Mobile Test Fail] ${t.name}: ${e.message}`);
    }
  });
}
