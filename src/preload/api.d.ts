interface ElectronApi {
  ping: () => Promise<string>
}

interface Window {
  electronApi: ElectronApi
}
