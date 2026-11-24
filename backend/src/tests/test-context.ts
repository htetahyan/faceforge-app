import { app } from '../index.ts';

export let passed = 0;
export let failed = 0;
export let userId = '';
export let token = '';
export let loginToken = '';
export const testEmail = `test-verify-user-${Date.now()}@glowup.com`;

export function setUserId(val: string) { userId = val; }
export function setToken(val: string) { token = val; }
export function setLoginToken(val: string) { loginToken = val; }
export function incrementPassed() { passed++; }
export function incrementFailed() { failed++; }

export function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    incrementPassed();
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    incrementFailed();
  }
}

export const req = async (path: string, options: any = {}) => {
  return await app.request(path, {
    method: options.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(options.token && { 'Authorization': `Bearer ${options.token}` }),
      ...options.headers
    },
    body: options.body ? JSON.stringify(options.body) : undefined
  });
};
