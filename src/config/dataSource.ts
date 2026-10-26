const configuredSource: string | undefined = import.meta.env.VITE_DATA_SOURCE

if (configuredSource !== 'demo' && configuredSource !== 'api') {
  throw new Error('VITE_DATA_SOURCE doit valoir « demo » ou « api » : voir .env.example.')
}

/**
 * Source des données, lue dans `.env` (`VITE_DATA_SOURCE`) :
 * - `demo` : base locale du navigateur (voir src/demo), qui permet d'utiliser tout le portail sans backend ;
 * - `api` : backend eCare+ ; seule l'authentification y est branchée pour l'instant.
 */
export const usesLocalData = configuredSource === 'demo'
