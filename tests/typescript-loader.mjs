// Load the application's actual TypeScript adapters with Node's built-in test runner.
// No transpiled copy of business logic and no extra test dependency.
import { registerHooks } from 'node:module'
import { readFileSync, existsSync } from 'node:fs'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { resolve } from 'node:path'
import ts from 'typescript'

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('@/')) {
      const path = resolve('src', specifier.slice(2))
      const file = ['.ts', '.tsx', '/index.ts'].map(suffix => path + suffix).find(existsSync)
      if (!file) throw new Error(`Module absent : ${specifier}`)
      return { url: pathToFileURL(file).href, shortCircuit: true }
    }
    return nextResolve(specifier, context)
  },
  load(url, context, nextLoad) {
    if (url.endsWith('/src/config/api.ts')) {
      return { format: 'module', source: "export const API_BASE_URL = '/api/v1'", shortCircuit: true }
    }
    if (url.endsWith('.ts') || url.endsWith('.tsx')) {
      return {
        format: 'module', shortCircuit: true,
        source: ts.transpileModule(readFileSync(fileURLToPath(url), 'utf8'), {
          compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2023, jsx: ts.JsxEmit.ReactJSX },
        }).outputText,
      }
    }
    return nextLoad(url, context)
  },
})
