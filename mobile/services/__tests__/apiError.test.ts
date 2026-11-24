import { getApiErrorMessage } from '../api';

export function runApiErrorVerification() {
  const tests: { name: string; run: () => void }[] = [
    {
      name: 'parses 401 Session expired correctly',
      run: () => {
        const mockError = {
          isAxiosError: true,
          response: { status: 401 },
        };
        const msg = getApiErrorMessage(mockError);
        if (msg !== 'Session expired. Please log in again.') {
          throw new Error(`Expected session expired message, got: ${msg}`);
        }
      },
    },
    {
      name: 'parses 402 Generation credit limit reached correctly',
      run: () => {
        const mockError = {
          isAxiosError: true,
          response: { status: 402 },
        };
        const msg = getApiErrorMessage(mockError);
        if (!msg.includes('credit limit reached')) {
          throw new Error(`Expected credit limit message, got: ${msg}`);
        }
      },
    },
    {
      name: 'parses server JSON error message correctly',
      run: () => {
        const mockError = {
          isAxiosError: true,
          response: { status: 400, data: { error: 'Invalid face image format' } },
        };
        const msg = getApiErrorMessage(mockError);
        if (msg !== 'Invalid face image format') {
          throw new Error(`Expected 'Invalid face image format', got: ${msg}`);
        }
      },
    },
    {
      name: 'parses network timeout ECONNABORTED correctly',
      run: () => {
        const mockError = {
          isAxiosError: true,
          code: 'ECONNABORTED',
        };
        const msg = getApiErrorMessage(mockError);
        if (!msg.includes('Connection timed out')) {
          throw new Error(`Expected timeout message, got: ${msg}`);
        }
      },
    },
  ];

  tests.forEach((t) => {
    try {
      t.run();
      console.log(`✅ [API Error Test Pass] ${t.name}`);
    } catch (e: any) {
      console.error(`❌ [API Error Test Fail] ${t.name}: ${e.message}`);
    }
  });
}
