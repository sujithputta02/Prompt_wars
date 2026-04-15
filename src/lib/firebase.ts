/**
 * Zero-Dependency Data Layer
 * Mocking Firestore functionality to avoid reliance on the firebase package
 */

export const db = {
  // Mock methods for the demo
  collection: (name: string) => ({
    doc: (id: string) => ({
      get: async () => ({ exists: true, data: () => ({}) }),
      set: async (data: any) => console.log(`Mock Firestore Store [${name}]:`, data),
    }),
    add: async (data: any) => console.log(`Mock Firestore Add [${name}]:`, data),
  })
};

export const app = null;
