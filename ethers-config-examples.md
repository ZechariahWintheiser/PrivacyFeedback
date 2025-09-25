# Ethers.js Configuration Examples

## Current Implementation: Static HTML with CDN

Our current project uses CDN-loaded ethers.js which is properly configured:

```html
<!-- CDN Import -->
<script src="https://cdn.jsdelivr.net/npm/ethers@5.7.2/dist/ethers.umd.min.js"></script>
<script>
    // Validation check
    if (typeof ethers === 'undefined') {
        console.error('Ethers.js failed to load from CDN');
        throw new Error('Ethers.js not loaded');
    }

    // Usage - ethers is globally available
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const contract = new ethers.Contract(address, abi, signer);
</script>
```

## For Vite/React Projects (Future Reference)

If you need to configure ethers.js in a Vite-based project, here's the complete setup:

### 1. Package.json Dependencies
```json
{
  "dependencies": {
    "ethers": "^6.15.0"
  },
  "devDependencies": {
    "buffer": "^6.0.3",
    "process": "^0.11.10",
    "util": "^0.12.5"
  }
}
```

### 2. Vite Configuration (vite.config.ts)
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],

  // Key configurations for ethers.js
  optimizeDeps: {
    exclude: ['@fhevm/hardhat-plugin', 'fhevmjs'],
    include: ['ethers'] // Ensure ethers is pre-bundled
  },

  define: {
    global: 'globalThis', // Fix for ethers global variable requirement
  },

  resolve: {
    alias: {
      buffer: 'buffer',
      process: 'process/browser',
      util: 'util'
    }
  }
})
```

### 3. TypeScript/React Usage
```typescript
// App.tsx
import { ethers } from 'ethers';

export default function App() {
  const connectWallet = async () => {
    // Ethers v6 syntax
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const contract = new ethers.Contract(address, abi, signer);
  };
}
```

## Common "ethers not defined" Solutions

### For Static HTML:
1. **Check CDN loading**: Ensure script loads before usage
2. **Network issues**: Verify internet connection
3. **CORS issues**: Use proper CDN URLs
4. **Version compatibility**: Use stable versions like 5.7.2

### For Build Tools (Vite/Webpack):
1. **Explicit inclusion**: Add to `optimizeDeps.include`
2. **Global polyfills**: Define `global: 'globalThis'`
3. **Buffer polyfills**: Install and alias buffer/process
4. **Import syntax**: Use ES6 imports correctly

## Browser Console Debug
```javascript
// Check if ethers is loaded
console.log('Ethers available:', typeof ethers !== 'undefined');
console.log('Ethers version:', ethers?.version);

// Test provider creation
if (window.ethereum) {
    try {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        console.log('Provider created successfully');
    } catch (error) {
        console.error('Provider creation failed:', error);
    }
}
```

## Our Current Status
✅ **Static HTML implementation** - Working correctly with CDN
✅ **Error handling** - Checks for ethers availability
✅ **Version logging** - Shows loaded version in console
✅ **Sepolia network support** - Properly configured
✅ **MetaMask integration** - Full wallet connection flow